import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending'
  },
  mutualFriendsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to ensure unique friend relationships
friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

const Friend = mongoose.model('Friend', friendSchema);

export default Friend;
