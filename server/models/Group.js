/**
 * models/Group.js  (updated)
 *
 * New fields:
 *   rules        — array of custom rule strings set by the group admin
 *   preferences  — small set of group-level toggles/settings
 */

import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a group name'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: true,
    enum: ['social', 'sports', 'arts', 'technology', 'food', 'music', 'travel', 'fitness', 'gaming', 'other'],
    lowercase: true
  },
  type: {
    type: String,
    required: true,
    enum: ['interest', 'necessity'],
    lowercase: true,
    default: 'interest'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400'
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  memberCount: {
    type: Number,
    default: 1
  },

  // ── Custom rules set by the group admin ──────────────────────────────────
  // Replaces the old hardcoded "Community Guidelines" list.
  rules: {
    type: [String],
    default: [
      'Be respectful and welcoming to all members',
      'Share your experiences and knowledge openly',
      'Follow all community standards at all times',
    ],
    validate: {
      validator: (arr) => arr.length <= 20,
      message: 'A group can have at most 20 rules',
    },
  },

  // ── Group-level preferences/toggles ───────────────────────────────────────
  preferences: {
    allowMemberPosts: {       // can regular members create posts in this group
      type: Boolean,
      default: true,
    },
    allowMemberEvents: {      // can regular members create events (not just admins)
      type: Boolean,
      default: true,
    },
    requireApprovalToJoin: {  // future-proofing: join requests need admin approval
      type: Boolean,
      default: false,
    },
    isPrivate: {              // group hidden from public discover/search
      type: Boolean,
      default: false,
    },
  },
}, {
  timestamps: true
});

// Update member count before saving
groupSchema.pre('save', function(next) {
  this.memberCount = this.members.length;
  next();
});

const Group = mongoose.model('Group', groupSchema);

export default Group;