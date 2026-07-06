/**
 * routes/dashboard.js  (updated)
 *
 * All real DB queries. No mocks.
 * - /stats          → live counts (3 cards: groups, activities, events scheduled)
 * - /upcoming-events → real upcoming events from user's groups
 * - /friends         → real accepted friends
 */

import express from 'express';
import User   from '../models/User.js';
import Event  from '../models/Event.js';
import Group  from '../models/Group.js';
import Friend from '../models/Friend.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
   GET /api/dashboard/stats
   Three live counts for the three stat cards.
   Also keeps user.stats in sync.
───────────────────────────────────────────────────────────── */
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Groups the user is actually a member of
    const groupsJoined = await Group.countDocuments({
      members: userId,
      isActive: true,
    });

    // Events the user is attending with status = 'going'
    // Uses the attendees sub-document array on Event
    const activitiesParticipated = await Event.countDocuments({
      attendees: {
        $elemMatch: { user: userId, status: 'going' },
      },
    });

    // Events the user created/organised
    const eventsScheduled = await Event.countDocuments({
      organizer: userId,
    });

    // Keep user.stats in sync (used by profile page etc.)
    await User.findByIdAndUpdate(userId, {
      $set: {
        'stats.groupsCount'     : groupsJoined,
        'stats.activitiesCount' : activitiesParticipated,
        'stats.eventsCount'     : eventsScheduled,
      },
    });

    res.json({
      success: true,
      stats: { groupsJoined, activitiesParticipated, eventsScheduled },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/dashboard/upcoming-events
   Next 20 upcoming events from any group the user belongs to,
   sorted by most-recently-created first (matches frontend sort).
───────────────────────────────────────────────────────────── */
router.get('/upcoming-events', protect, async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user._id,
      isActive: true,
    }).select('_id');

    if (groups.length === 0) {
      return res.json({ success: true, events: [] });
    }

    const groupIds = groups.map((g) => g._id);

    const events = await Event.find({
      group   : { $in: groupIds },
      status  : { $in: ['upcoming', 'ongoing'] },
      startDate: { $gte: new Date() },
    })
      .populate('group'    , 'name image')
      .populate('organizer', 'username avatar')
      .populate('attendees.user', 'username fullName avatar')
      .sort({ createdAt: -1 })   // newest created first
      .limit(20)
      .lean();

    res.json({ success: true, events });
  } catch (error) {
    console.error('Dashboard upcoming-events error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/dashboard/friends
   Accepted friends with basic profile info.
───────────────────────────────────────────────────────────── */
router.get('/friends', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const friendships = await Friend.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' },
      ],
    })
      .populate('requester', 'username fullName avatar')
      .populate('recipient', 'username fullName avatar')
      .lean();

    const friends = friendships.map((f) => {
      const friend =
        f.requester._id.toString() === userId.toString()
          ? f.recipient
          : f.requester;
      return {
        id          : friend._id,
        name        : friend.fullName || friend.username,
        username    : friend.username,
        avatar      : friend.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username)}`,
        friendshipId: f._id,
        status      : 'offline', // real-time status not implemented yet
      };
    });

    res.json({ success: true, friends });
  } catch (error) {
    console.error('Dashboard friends error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;