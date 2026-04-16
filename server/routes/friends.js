import express from 'express';
import Friend from '../models/Friend.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/friends/request
// @desc    Send friend request
// @access  Private
router.post('/request', protect, async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID required' });
    }

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot send friend request to yourself' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const existingFriendship = await Friend.findOne({
      $or: [
        { requester: req.user._id, recipient: recipientId },
        { requester: recipientId, recipient: req.user._id }
      ]
    });

    if (existingFriendship) {
      return res.status(400).json({
        success: false,
        message: existingFriendship.status === 'pending'
          ? 'Friend request already sent'
          : 'Already friends'
      });
    }

    const friendship = await Friend.create({
      requester: req.user._id,
      recipient: recipientId,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Friend request sent',
      data: { friendship }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/friends/respond/:id
// @desc    Respond to friend request (accept/decline)
// @access  Private
router.put('/respond/:id', protect, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const friendship = await Friend.findById(req.params.id);

    if (!friendship) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    if (friendship.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (friendship.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Friend request already responded to' });
    }

    friendship.status = action === 'accept' ? 'accepted' : 'declined';
    await friendship.save();

    if (action === 'accept') {
      await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.friendsCount': 1 } });
      await User.findByIdAndUpdate(friendship.requester, { $inc: { 'stats.friendsCount': 1 } });

      await Activity.create({
        user: req.user._id,
        type: 'friend_added',
        title: 'New friend added',
        relatedUser: friendship.requester
      });
    }

    res.json({
      success: true,
      message: action === 'accept' ? 'Friend request accepted' : 'Friend request declined',
      data: { friendship }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/friends
// @desc    Get user's friends
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const friendships = await Friend.find({
      $or: [
        { requester: req.user._id, status: 'accepted' },
        { recipient: req.user._id, status: 'accepted' }
      ]
    })
      .populate('requester', 'username avatar stats')
      .populate('recipient', 'username avatar stats');

    const friends = friendships.map(f => {
      const friend = f.requester._id.toString() === req.user._id.toString()
        ? f.recipient
        : f.requester;
      return {
        ...friend.toObject(),
        mutualFriendsCount: f.mutualFriendsCount,
        friendshipId: f._id
      };
    });

    res.json({ success: true, data: { friends, count: friends.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/friends/requests
// @desc    Get pending friend requests
// @access  Private
router.get('/requests', protect, async (req, res) => {
  try {
    const requests = await Friend.find({
      recipient: req.user._id,
      status: 'pending'
    })
      .populate('requester', 'username avatar stats')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { requests, count: requests.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/friends/suggestions
// @desc    Get friend suggestions
// @access  Private
router.get('/suggestions', protect, async (req, res) => {
  try {
    const existingFriendships = await Friend.find({
      $or: [
        { requester: req.user._id },
        { recipient: req.user._id }
      ]
    });

    const existingFriendIds = existingFriendships.map(f =>
      f.requester.toString() === req.user._id.toString() ? f.recipient : f.requester
    );

    const suggestions = await User.find({
      _id: {
        $nin: [...existingFriendIds, req.user._id],
      },
      isActive: true
    })
      .limit(10)
      .select('username avatar stats');

    res.json({ success: true, data: { suggestions, count: suggestions.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/friends/:id
// @desc    Remove friend
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const friendship = await Friend.findById(req.params.id);

    if (!friendship) {
      return res.status(404).json({ success: false, message: 'Friendship not found' });
    }

    const isRequester = friendship.requester.toString() === req.user._id.toString();
    const isRecipient = friendship.recipient.toString() === req.user._id.toString();

    if (!isRequester && !isRecipient) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await friendship.deleteOne();

    if (friendship.status === 'accepted') {
      await User.findByIdAndUpdate(friendship.requester, { $inc: { 'stats.friendsCount': -1 } });
      await User.findByIdAndUpdate(friendship.recipient, { $inc: { 'stats.friendsCount': -1 } });
    }

    res.json({ success: true, message: 'Friend removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
