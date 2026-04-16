import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['text', 'image'],
      default: 'text',
    },
    imageUrl: {
      type: String,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Fast lookup: all messages for a group in order
messageSchema.index({ group: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);