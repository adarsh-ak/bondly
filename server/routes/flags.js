/**
 * routes/flags.js
 *
 * Flag system scoped to group admins — no platform-level admin needed.
 *
 * Any member routes (protect only):
 *   POST  /api/flags                        — submit flag (must include groupId)
 *   GET   /api/flags/my-flags               — flags I submitted
 *   GET   /api/flags/against-me             — approved flags against me
 *
 * Group-admin routes (protect + isGroupAdmin middleware):
 *   GET   /api/flags/group/:groupId/pending — all pending flags in my group
 *   GET   /api/flags/group/:groupId/all     — all flags in my group (any status)
 *   PATCH /api/flags/:flagId/approve        — approve → auto-ban logic
 *   PATCH /api/flags/:flagId/reject         — reject flag
 *   GET   /api/flags/group/:groupId/banned  — banned users who are members
 *   PATCH /api/flags/lift-ban/:userId       — manually lift ban (group admin only)
 */

import express   from 'express';
import mongoose  from 'mongoose';
import Flag      from '../models/Flag.js';
import User      from '../models/User.js';
import Group     from '../models/Group.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Middleware: verify the logged-in user is an admin of the group
 * referenced by req.params.groupId  OR  by the flag's own group field.
 * Attaches req.group for downstream use.
 */
async function isGroupAdmin(req, res, next) {
  try {
    // groupId can come from param or from the flag being acted on
    const groupId = req.params.groupId || req._flagGroupId;

    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID.' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const userId = req.user._id.toString();
    const isAdmin =
      group.creator.toString() === userId ||
      group.admins.some((a) => a.toString() === userId);

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only this group\'s admin can perform this action.',
      });
    }

    req.group = group;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

/**
 * Ban logic — called after a flag is approved.
 * flagCount 1 → warning only (no ban)
 * flagCount 2 → temp_banned for 2 months
 * flagCount 3+ → perm_banned
 */
async function applyBanIfNeeded(flaggedUser) {
  const count = flaggedUser.flagCount;

  if (count === 2) {
    const until = new Date();
    until.setMonth(until.getMonth() + 2);
    flaggedUser.banStatus   = 'temp_banned';
    flaggedUser.bannedUntil = until;
    flaggedUser.banReason   = 'Received 2 approved flags from group admins.';
    await flaggedUser.save();
    return 'temp_banned';
  }

  if (count >= 3) {
    flaggedUser.banStatus   = 'perm_banned';
    flaggedUser.bannedUntil = null;
    flaggedUser.banReason   = 'Received 3 or more approved flags — permanently banned.';
    flaggedUser.isActive    = false;
    await flaggedUser.save();
    return 'perm_banned';
  }

  return 'warned'; // 1st flag — warning on record only
}

// ─────────────────────────────────────────────────────────────────────────────
//  MEMBER ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/flags
 * Body: { flaggedUserId, groupId, reason, description, proofUrl?, proofText? }
 */
router.post('/', protect, async (req, res) => {
  try {
    const { flaggedUserId, groupId, reason, description, proofUrl, proofText } = req.body;

    if (!flaggedUserId || !groupId || !reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'flaggedUserId, groupId, reason, and description are all required.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(flaggedUserId) ||
        !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    }

    if (flaggedUserId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot flag yourself.' });
    }

    // Verify the group exists and both users are members
    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const reporterIsMember = group.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!reporterIsMember) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this group to flag someone in it.',
      });
    }

    const flaggedUserIsMember = group.members.some(
      (m) => m.toString() === flaggedUserId
    );
    if (!flaggedUserIsMember) {
      return res.status(400).json({
        success: false,
        message: 'The reported user is not a member of this group.',
      });
    }

    // Cannot flag the group admin/creator
    const isCreatorOrAdmin =
      group.creator.toString() === flaggedUserId ||
      group.admins.some((a) => a.toString() === flaggedUserId);
    if (isCreatorOrAdmin) {
      return res.status(400).json({
        success: false,
        message: 'You cannot flag a group admin.',
      });
    }

    // Duplicate check — same reporter, same target, same group, pending/approved
    const existing = await Flag.findOne({
      reporter    : req.user._id,
      flaggedUser : flaggedUserId,
      group       : groupId,
      status      : { $in: ['pending', 'approved'] },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          existing.status === 'pending'
            ? 'You already have a pending flag against this member in this group.'
            : 'You already have an approved flag against this member in this group.',
      });
    }

    const flag = await Flag.create({
      reporter    : req.user._id,
      flaggedUser : flaggedUserId,
      group       : groupId,
      reason,
      description : description.trim(),
      proofUrl    : proofUrl?.trim()  || '',
      proofText   : proofText?.trim() || '',
    });

    res.status(201).json({
      success: true,
      message: 'Flag submitted. The group admin will review it shortly.',
      data: { flagId: flag._id, status: flag.status },
    });
  } catch (err) {
    console.error('POST /flags error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/flags/my-flags
 * Flags submitted by the current user across all groups.
 */
router.get('/my-flags', protect, async (req, res) => {
  try {
    const flags = await Flag.find({ reporter: req.user._id })
      .populate('flaggedUser', 'username fullName avatar')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: flags });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/flags/against-me
 * Only approved flags shown to the flagged user.
 */
router.get('/against-me', protect, async (req, res) => {
  try {
    const flags = await Flag.find({
      flaggedUser : req.user._id,
      status      : 'approved',
    })
      .select('reason description createdAt adminNote reviewedAt group')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: flags });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  GROUP ADMIN ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/flags/group/:groupId/pending
 * All pending flags in the group — for group admin review.
 */
router.get('/group/:groupId/pending', protect, isGroupAdmin, async (req, res) => {
  try {
    const flags = await Flag.find({
      group  : req.params.groupId,
      status : 'pending',
    })
      .populate('reporter',    'username fullName avatar')
      .populate('flaggedUser', 'username fullName avatar flagCount banStatus')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: flags.length, data: flags });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/flags/group/:groupId/all
 * All flags in the group (any status) with pagination.
 */
router.get('/group/:groupId/all', protect, isGroupAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { group: req.params.groupId };
    if (status) query.status = status;

    const [flags, total] = await Promise.all([
      Flag.find(query)
        .populate('reporter',    'username fullName avatar')
        .populate('flaggedUser', 'username fullName avatar flagCount banStatus bannedUntil')
        .populate('reviewedBy',  'username')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean(),
      Flag.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: flags,
      pagination: {
        page: parseInt(page), limit: parseInt(limit),
        total, pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

/**
 * PATCH /api/flags/:flagId/approve
 * Group admin approves a flag → triggers ban logic.
 * Body: { adminNote? }
 */
router.patch('/:flagId/approve', protect, async (req, res) => {
  try {
    const flag = await Flag.findById(req.params.flagId).populate('group');
    if (!flag) return res.status(404).json({ success: false, message: 'Flag not found.' });

    if (flag.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Flag is already ${flag.status}.` });
    }

    // Verify the acting user is a group admin of the flag's group
    const group   = flag.group;
    const userId  = req.user._id.toString();
    const isAdmin =
      group.creator.toString() === userId ||
      group.admins.some((a) => a.toString() === userId);

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the group admin of this flag\'s group can approve it.',
      });
    }

    // Mark approved
    flag.status     = 'approved';
    flag.reviewedBy = req.user._id;
    flag.adminNote  = (req.body.adminNote || '').trim();
    flag.reviewedAt = new Date();
    await flag.save();

    // Increment flagCount and apply ban
    const flaggedUser = await User.findById(flag.flaggedUser);
    if (!flaggedUser) {
      return res.status(404).json({ success: false, message: 'Flagged user no longer exists.' });
    }

    flaggedUser.flagCount += 1;
    const banResult = await applyBanIfNeeded(flaggedUser);

    res.json({
      success    : true,
      message    : 'Flag approved.',
      flagCount  : flaggedUser.flagCount,
      banResult,
      banStatus  : flaggedUser.banStatus,
      bannedUntil: flaggedUser.bannedUntil,
    });
  } catch (err) {
    console.error('PATCH approve error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

/**
 * PATCH /api/flags/:flagId/reject
 * Group admin rejects a flag — no ban effect.
 * Body: { adminNote? }
 */
router.patch('/:flagId/reject', protect, async (req, res) => {
  try {
    const flag = await Flag.findById(req.params.flagId).populate('group');
    if (!flag) return res.status(404).json({ success: false, message: 'Flag not found.' });

    if (flag.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Flag is already ${flag.status}.` });
    }

    const group   = flag.group;
    const userId  = req.user._id.toString();
    const isAdmin =
      group.creator.toString() === userId ||
      group.admins.some((a) => a.toString() === userId);

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the group admin of this flag\'s group can reject it.',
      });
    }

    flag.status     = 'rejected';
    flag.reviewedBy = req.user._id;
    flag.adminNote  = (req.body.adminNote || '').trim();
    flag.reviewedAt = new Date();
    await flag.save();

    res.json({ success: true, message: 'Flag rejected.', data: flag });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/flags/group/:groupId/banned
 * Show members of this group who are currently banned.
 * Useful for the group admin to see moderation state at a glance.
 */
router.get('/group/:groupId/banned', protect, isGroupAdmin, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate(
      'members', 'username fullName avatar email banStatus bannedUntil banReason flagCount'
    );

    const banned = (group.members || []).filter(
      (m) => m.banStatus === 'temp_banned' || m.banStatus === 'perm_banned'
    );

    res.json({ success: true, count: banned.length, data: banned });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

/**
 * PATCH /api/flags/lift-ban/:userId
 * Group admin manually lifts a ban on a member of their group.
 * They must be admin of at least one group the user belongs to.
 */
router.patch('/lift-ban/:userId', protect, async (req, res) => {
  try {
    const { groupId } = req.body;
    if (!groupId) {
      return res.status(400).json({ success: false, message: 'groupId required in body.' });
    }

    const group  = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

    const userId  = req.user._id.toString();
    const isAdmin =
      group.creator.toString() === userId ||
      group.admins.some((a) => a.toString() === userId);

    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only group admins can lift bans.' });
    }

    const target = await User.findById(req.params.userId);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });

    target.banStatus   = 'active';
    target.bannedUntil = null;
    target.banReason   = '';
    target.isActive    = true;
    await target.save();

    res.json({ success: true, message: `Ban lifted for ${target.username}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

export default router;