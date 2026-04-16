import express from 'express';
import Activity from '../models/Activity.js'; // make sure this model is also ES module compatible
import { protect } from '../middleware/auth.js'; // same for your middleware

const router = express.Router();

// @route   GET /api/activities
// @desc    Get user's activities feed
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const activities = await Activity.find({
      user: req.user._id,
      isPublic: true
    })
    .populate('user', 'username avatar')
    .populate('relatedGroup', 'name coverImage')
    .populate('relatedEvent', 'title startDate')
    .populate('relatedUser', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Activity.countDocuments({ user: req.user._id, isPublic: true });

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/activities/feed
// @desc    Get community activities feed (user + friends)
// @access  Private
router.get('/feed', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const activities = await Activity.find({ isPublic: true })
      .populate('user', 'username avatar')
      .populate('relatedGroup', 'name coverImage')
      .populate('relatedEvent', 'title startDate')
      .populate('relatedUser', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Activity.countDocuments({ isPublic: true });

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/activities
// @desc    Create a new activity
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { type, title, description, relatedGroup, relatedEvent, relatedUser, isPublic } = req.body;

    const activity = await Activity.create({
      user: req.user._id,
      type,
      title,
      description,
      relatedGroup,
      relatedEvent,
      relatedUser,
      isPublic
    });

    const populatedActivity = await Activity.findById(activity._id)
      .populate('user', 'username avatar')
      .populate('relatedGroup', 'name coverImage')
      .populate('relatedEvent', 'title startDate')
      .populate('relatedUser', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: { activity: populatedActivity }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/activities/:id
// @desc    Delete an activity
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    if (activity.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await activity.deleteOne();

    res.json({ success: true, message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
