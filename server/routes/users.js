import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        interests: user.interests,
        stats: user.stats,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { fullName, bio, location, interests, avatar } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        fullName,
        bio,
        location,
        interests,
        avatar
      },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        interests: user.interests,
        stats: user.stats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
