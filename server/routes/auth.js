import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken, protect } from '../middleware/auth.js';

const router = express.Router();

/* =========================
   SIGNUP
========================= */
router.post(
  '/signup',
  [
    body('username').trim().isLength({ min: 3, max: 30 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('full_name').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
        });
      }

      const { username, email, password, full_name } = req.body;

      // check existing user
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists',
        });
      }

      // Create user (User model's pre('save') hook automatically hashes the password)
      const user = await User.create({
        username,
        email,
        password,
        fullName: full_name || username,
        avatar: `https://ui-avatars.com/api/?name=${username}`,
        isActive: true,
      });

      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
        },
      });
    } catch (err) {
      console.error('SIGNUP ERROR:', err);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

/* =========================
   SIGNIN (FIXED)
========================= */
router.post(
  '/signin',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
        });
      }

      const { email, password } = req.body;
      const normalizedEmail = email ? email.toLowerCase().trim() : '';

      // 🔥 IMPORTANT FIX: include password explicitly and use normalized email
      const user = await User.findOne({ email: normalizedEmail }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // compare password safely
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is inactive',
        });
      }

      const token = generateToken(user._id);

      res.json({
        success: true,
        message: 'Login successful',
        token,
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
    } catch (err) {
      console.error('SIGNIN ERROR:', err);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: err.message,
      });
    }
  }
);

/* =========================
   GET CURRENT USER
========================= */
router.get('/me', protect, async (req, res) => {
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
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('ME ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default router;