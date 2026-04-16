import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get user dashboard stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      stats: {
        groupsJoined: user.stats.groupsCount || 0,
        activitiesParticipated: user.stats.activitiesCount || 0,
        communityFriends: user.stats.friendsCount || 0,
        eventsScheduled: user.stats.eventsCount || 0,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/dashboard/upcoming-events
// @desc    Get upcoming events for user
// @access  Private
router.get('/upcoming-events', protect, async (req, res) => {
  try {
    // Mock events - replace with actual events from database later
    const events = [
      {
        id: 1,
        title: 'Weekend Coffee Meetup',
        group: 'Coffee Lovers',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        time: '10:00 AM',
        location: 'Downtown Cafe',
        attendees: 12
      },
      {
        id: 2,
        title: 'Morning Yoga Session',
        group: 'Fitness Group',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        time: '7:00 AM',
        location: 'Central Park',
        attendees: 8
      },
      {
        id: 3,
        title: 'Book Club Discussion',
        group: 'Book Readers',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        time: '6:00 PM',
        location: 'Library Hall',
        attendees: 15
      }
    ];

    res.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/dashboard/friends
// @desc    Get user's friends list
// @access  Private
router.get('/friends', protect, async (req, res) => {
  try {
    // Mock friends - replace with actual friends from database later
    const friends = [
      {
        id: 1,
        name: 'Sarah Chen',
        avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=random',
        mutualGroups: 3,
        status: 'online'
      },
      {
        id: 2,
        name: 'Mike Johnson',
        avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=random',
        mutualGroups: 2,
        status: 'offline'
      },
      {
        id: 3,
        name: 'Emma Wilson',
        avatar: 'https://ui-avatars.com/api/?name=Emma+Wilson&background=random',
        mutualGroups: 4,
        status: 'online'
      },
      {
        id: 4,
        name: 'Alex Kim',
        avatar: 'https://ui-avatars.com/api/?name=Alex+Kim&background=random',
        mutualGroups: 1,
        status: 'online'
      }
    ];

    res.json({
      success: true,
      friends,
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

export default router;
