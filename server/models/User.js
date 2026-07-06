/**
 * models/User.js  (updated)
 *
 * Changes from previous version:
 *  - isAdmin field REMOVED (group admins are determined by Group.admins/creator,
 *    not a flag on the User document)
 *  - flagCount, banStatus, bannedUntil, banReason fields retained
 *  - isBanned() and banMessage() instance methods retained
 */

import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type      : String,
      required  : [true, 'Please provide a username'],
      unique    : true,
      trim      : true,
      minlength : [3,  'Username must be at least 3 characters'],
      maxlength : [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type     : String,
      required : [true, 'Please provide an email'],
      unique   : true,
      lowercase: true,
      trim     : true,
      match    : [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type      : String,
      required  : [true, 'Please provide a password'],
      minlength : [6, 'Password must be at least 6 characters'],
      select    : false,
    },
    fullName: {
      type     : String,
      required : [true, 'Please provide your full name'],
      trim     : true,
    },
    avatar: {
      type   : String,
      default: '',
    },
    bio: {
      type      : String,
      default   : '',
      maxlength : [500, 'Bio cannot exceed 500 characters'],
    },
    location: {
      type      : String,
      default   : '',
      maxlength : [100, 'Location cannot exceed 100 characters'],
    },
    interests: {
      type   : [String],
      default: [],
    },
    stats: {
      groupsCount     : { type: Number, default: 0 },
      activitiesCount : { type: Number, default: 0 },
      friendsCount    : { type: Number, default: 0 },
      eventsCount     : { type: Number, default: 0 },
    },
    isActive: {
      type   : Boolean,
      default: true,
    },

    // ── Moderation fields ────────────────────────────────────────────────────
    // Incremented each time a flag against this user is approved by a group admin
    flagCount: {
      type   : Number,
      default: 0,
      min    : 0,
    },

    // 'active' = normal account
    // 'temp_banned' = banned for 2 months (flagCount reached 2)
    // 'perm_banned' = permanently banned (flagCount reached 3+)
    banStatus: {
      type   : String,
      enum   : ['active', 'temp_banned', 'perm_banned'],
      default: 'active',
    },

    // Populated only for temp_banned users
    bannedUntil: {
      type   : Date,
      default: null,
    },

    // Human-readable reason stored alongside the ban
    banReason: {
      type      : String,
      default   : '',
      maxlength : 500,
    },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
userSchema.index({ banStatus: 1 });

// ── Password hashing ───────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt   = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── comparePassword ────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

/**
 * isBanned()
 * Returns true if this user is currently under an active ban.
 * Side-effect: automatically lifts expired temp bans (saves to DB).
 */
userSchema.methods.isBanned = async function () {
  if (this.banStatus === 'perm_banned') return true;

  if (this.banStatus === 'temp_banned') {
    if (this.bannedUntil && new Date() > this.bannedUntil) {
      this.banStatus   = 'active';
      this.bannedUntil = null;
      this.banReason   = '';
      await this.save();
      return false;
    }
    return true;
  }

  return false;
};

/**
 * banMessage()
 * Human-readable ban explanation sent to the client.
 */
userSchema.methods.banMessage = function () {
  if (this.banStatus === 'perm_banned') {
    return 'Your account has been permanently banned from Bondly due to repeated violations of our community guidelines.';
  }
  if (this.banStatus === 'temp_banned' && this.bannedUntil) {
    const until = this.bannedUntil.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    return `Your account has been temporarily suspended until ${until}. Reason: ${this.banReason}`;
  }
  return '';
};

const User = mongoose.model('User', userSchema);
export default User;