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
  }
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
