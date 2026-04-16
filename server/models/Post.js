import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: 'Untitled Post',
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
    },
    category: {
      type: String,
      enum: ['event', 'announcement', 'activity', 'general', 'news', 'update'],
      default: 'general',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    eventDate: {
      type: Date,
      default: null,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
   /* comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Comment",
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ], changeedd*/
    comments: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
  },
], 



    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Post', postSchema);

