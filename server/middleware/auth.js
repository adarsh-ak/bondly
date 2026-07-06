/**
 * middleware/auth.js  (updated)
 *
 * Changes from previous version:
 *  - isAdmin (platform-level) removed entirely — not needed anymore
 *  - protect() still checks banStatus and auto-lifts expired temp bans
 *  - generateToken unchanged
 */

import jwt  from 'jsonwebtoken';
import User from '../models/User.js';

// ── protect ────────────────────────────────────────────────────────────────────
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — no token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — user not found',
      });
    }

    // ── Ban check ────────────────────────────────────────────────────────────
    // isBanned() auto-lifts expired temp bans and saves to DB
    const banned = await user.isBanned();
    if (banned) {
      return res.status(403).json({
        success    : false,
        banned     : true,
        banStatus  : user.banStatus,
        bannedUntil: user.bannedUntil,
        message    : user.banMessage(),
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

// ── generateToken ──────────────────────────────────────────────────────────────
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};