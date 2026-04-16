import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/profile
// @desc    Get current user profile
// @access  Private
router.get('/', protect, async (req, res) => {
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
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        interests: user.interests,
        stats: user.stats,
        joinedDate: user.createdAt,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/profile/:userId
// @desc    Get user profile by ID
// @access  Public
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User profile is not available',
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        interests: user.interests,
        stats: user.stats,
        joinedDate: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/',
  protect,
  [
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Full name must be between 1 and 100 characters'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters'),
    body('location')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Location cannot exceed 100 characters'),
    body('interests')
      .optional()
      .isArray()
      .withMessage('Interests must be an array'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    try {
      const { fullName, bio, location, interests } = req.body;

      const updateData = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (bio !== undefined) updateData.bio = bio;
      if (location !== undefined) updateData.location = location;
      if (interests !== undefined) {
        // Filter out empty strings and limit to 10 interests
        updateData.interests = interests
          .filter(i => i && i.trim())
          .slice(0, 10)
          .map(i => i.trim());
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
          bio: user.bio,
          location: user.location,
          interests: user.interests,
          stats: user.stats,
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error', 
        error: error.message 
      });
    }
  }
);

// @route   PUT /api/profile/avatar
// @desc    Update user avatar
// @access  Private
router.put(
  '/avatar',
  protect,
  [
    body('avatar')
      .isURL()
      .withMessage('Avatar must be a valid URL'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg 
      });
    }

    try {
      const { avatar } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { avatar } },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        message: 'Avatar updated successfully',
        avatar: user.avatar,
      });
    } catch (error) {
      console.error('Update avatar error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error', 
        error: error.message 
      });
    }
  }
);

// @route   PUT /api/profile/stats
// @desc    Update user stats (for internal use)
// @access  Private
router.put('/stats', protect, async (req, res) => {
  try {
    const { groupsCount, activitiesCount, friendsCount, eventsCount } = req.body;

    const updateData = {};
    if (groupsCount !== undefined) updateData['stats.groupsCount'] = groupsCount;
    if (activitiesCount !== undefined) updateData['stats.activitiesCount'] = activitiesCount;
    if (friendsCount !== undefined) updateData['stats.friendsCount'] = friendsCount;
    if (eventsCount !== undefined) updateData['stats.eventsCount'] = eventsCount;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Stats updated successfully',
      stats: user.stats,
    });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/profile
// @desc    Deactivate user account (soft delete)
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   POST /api/profile/reactivate
// @desc    Reactivate user account
// @access  Private
router.post('/reactivate', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { isActive: true } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Account reactivated successfully',
    });
  } catch (error) {
    console.error('Reactivate account error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/profile/search
// @desc    Search users by username or name
// @access  Private
router.get('/search/users', protect, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }

    const users = await User.find({
      isActive: true,
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } }
      ]
    })
    .select('username fullName avatar bio location stats')
    .limit(20);

    res.json({
      success: true,
      count: users.length,
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        stats: user.stats,
      })),
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

export default router;