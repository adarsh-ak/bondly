import express from 'express';
import { protect } from '../middleware/auth.js';
import Group from '../models/Group.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/groups
// @desc    Get all groups with search and filter
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, category, limit = 20, page = 1 } = req.query;
    
    const query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') {
      query.category = category.toLowerCase();
    }
    
    const groups = await Group.find(query)
      .populate('creator', 'username avatar')
      .sort({ memberCount: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Group.countDocuments(query);
    
    res.json({
      success: true,
      data: groups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/groups/user/my-groups
// @desc    Get current user's groups
// @access  Private
router.get('/user/my-groups', protect, async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user._id,
      isActive: true
    })
      .populate('creator', 'username avatar')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/groups/:id
// @desc    Get single group by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'username avatar fullName')
      .populate('members', 'username avatar fullName')
      .populate('admins', 'username avatar fullName');
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    res.json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, category, type, location, image } = req.body;
    
    const group = await Group.create({
      name,
      description,
      category: category.toLowerCase(),
      type: type ? type.toLowerCase() : 'interest',
      location,
      image,
      creator: req.user._id,
      admins: [req.user._id],
      members: [req.user._id]
    });
    
    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.groupsCount': 1 }
    });
    
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/groups/:id/join
// @desc    Join a group
// @access  Private
router.post('/:id/join', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }
    
    group.members.push(req.user._id);
    await group.save();
    
    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.groupsCount': 1 }
    });
    
    res.json({ success: true, message: 'Successfully joined group', data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/groups/:id/leave
// @desc    Leave a group
// @access  Private
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    // Don't allow creator to leave
    if (group.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Group creator cannot leave. Please delete the group or transfer ownership first.' 
      });
    }
    
    group.members = group.members.filter(id => id.toString() !== req.user._id.toString());
    group.admins = group.admins.filter(id => id.toString() !== req.user._id.toString());
    await group.save();
    
    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.groupsCount': -1 }
    });
    
    res.json({ success: true, message: 'Successfully left group', data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/groups/:id
// @desc    Update a group
// @access  Private (Admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    // Check if user is admin
    if (!group.admins.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this group' });
    }
    
    const { name, description, category, location, image } = req.body;
    
    if (name) group.name = name;
    if (description) group.description = description;
    if (category) group.category = category.toLowerCase();
    if (location !== undefined) group.location = location;
    if (image) group.image = image;
    
    await group.save();
    
    res.json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/groups/:id
// @desc    Delete a group (soft delete)
// @access  Private (Creator only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    // Only creator can delete
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only group creator can delete the group' });
    }
    
    group.isActive = false;
    await group.save();
    
    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
