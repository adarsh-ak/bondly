import express from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import { protect } from '../middleware/auth.js';

const messageRoutes = express.Router();

// ─────────────────────────────────────────────────────────────
// GET /api/messages/groups
// Returns all groups that the current user has sent messages in
// (used to populate the sidebar "recent chats")
// ─────────────────────────────────────────────────────────────
messageRoutes.get('/groups', protect, async (req, res) => {
  try {
    // Find distinct groups where the user is a sender
    const groupIds = await Message.distinct('group', { sender: req.user._id });

    // Populate group details from the Group collection
    // Adjust the model name 'Group' if yours is different
    const Group = mongoose.model('Group');
    const groups = await Group.find({ _id: { $in: groupIds } })
      .select('name description members avatar _id')
      .lean();

    res.json({ success: true, groups });
  } catch (err) {
    console.error('GET /messages/groups:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/messages/:groupId
// Fetch all messages for a specific group
// ─────────────────────────────────────────────────────────────
messageRoutes.get('/:groupId', protect, async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID' });
    }

    const messages = await Message.find({ group: groupId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name username avatar')
      .lean();

    // Mark all messages in this group as read for the current user
    await Message.updateMany(
      { group: groupId, sender: { $ne: req.user._id }, read: false },
      { read: true }
    );

    res.json({ success: true, messages });
  } catch (err) {
    console.error('GET /messages/:groupId:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/messages/:groupId
// Send a message to a group
// Body: { content: string, type?: 'text'|'image', imageUrl?: string }
// ─────────────────────────────────────────────────────────────
messageRoutes.post('/:groupId', protect, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, type = 'text', imageUrl = null } = req.body;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID' });
    }

    if (!content?.trim() && !imageUrl) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const message = await Message.create({
      sender: req.user._id,
      group: groupId,
      content: content?.trim() || '',
      type,
      imageUrl,
      read: false,
    });

    const populated = await message.populate('sender', 'name username avatar');

    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    console.error('POST /messages/:groupId:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/messages/:messageId
// Delete a message (only sender can delete)
// ─────────────────────────────────────────────────────────────
messageRoutes.delete('/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, message: 'Invalid message ID' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await message.deleteOne();
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('DELETE /messages/:messageId:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/messages/unread/count
// Unread message count across all groups for badge display
// ─────────────────────────────────────────────────────────────
messageRoutes.get('/unread/count', protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      sender: { $ne: req.user._id },
      read: false,
    });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default messageRoutes;