/**
 * models/Flag.js
 *
 * A flag is a report submitted by a group member against another member
 * of the SAME group. The group's admin (creator or anyone in group.admins)
 * reviews it — NOT a platform-level admin.
 *
 * Flow:
 *   1. Reporter submits flag, referencing which group the incident happened in.
 *   2. Status is 'pending' — visible only to that group's admins.
 *   3. Group admin approves or rejects.
 *   4. On approval the flagged user's flagCount increments:
 *        flagCount === 2  →  temp_banned for 2 months (site-wide)
 *        flagCount >= 3   →  permanently banned (site-wide)
 */

import mongoose from 'mongoose';

const flagSchema = new mongoose.Schema(
  {
    // Who submitted the report
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Who is being reported
    flaggedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Which group the incident occurred in — required
    // The group admin of THIS group is who reviews the flag
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'A group must be specified for the flag'],
    },

    // Reason category
    reason: {
      type: String,
      required: [true, 'Please provide a reason for the flag'],
      enum: [
        'harassment',
        'hate_speech',
        'spam',
        'inappropriate_content',
        'impersonation',
        'threats',
        'misinformation',
        'other',
      ],
    },

    // Free-text description of what happened
    description: {
      type: String,
      required: [true, 'Please describe the incident'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      trim: true,
    },

    // Optional proof: URL to screenshot / external link
    proofUrl: {
      type: String,
      default: '',
      trim: true,
    },

    // Optional proof text (copy-paste of message etc.)
    proofText: {
      type: String,
      default: '',
      maxlength: [2000, 'Proof text cannot exceed 2000 characters'],
      trim: true,
    },

    // Review status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    // Which group admin reviewed this
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    // Group admin's note when approving / rejecting
    adminNote: {
      type: String,
      default: '',
      maxlength: [500, 'Note cannot exceed 500 characters'],
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent same reporter flagging same person in the same group twice (pending/approved)
flagSchema.index({ reporter: 1, flaggedUser: 1, group: 1, status: 1 });

// Fast lookup of all flags for a given group
flagSchema.index({ group: 1, status: 1, createdAt: -1 });

export default mongoose.model('Flag', flagSchema);