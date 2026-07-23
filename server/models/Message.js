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
      enum: ['text', 'image', 'audio', 'file', 'video','call','poll'], // NAYA: 'audio' add kiya
      default: 'text',
    },
    fileName: {                                    // NAYA field
  type: String,
  default: null,
},
    imageUrl: {
      type: String,
      default: null,
    },
    audioUrl: {              // NAYA field
      type: String,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
    poll: {
  question: { type: String },
  options: [
    {
      text: { type: String },
      votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
  ],
  allowMultiple: { type: Boolean, default: false },
},
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        emoji: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

// Fast lookup: all messages for a group in order
messageSchema.index({ group: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);