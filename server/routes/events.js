import express from 'express';
import { protect } from '../middleware/auth.js';
import Event from '../models/Event.js';
import Group from '../models/Group.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/events
// @desc    Get all events with filters
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { groupId, status, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    if (groupId) query.group = groupId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const events = await Event.find(query)
      .populate('group', 'name image')
      .populate('organizer', 'username avatar')
      .populate('attendees.user', 'username avatar')
      .sort({ startDate: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: events,
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

// @route   POST /api/events
// @desc    Create a new event
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      description,
      group,
      startDate,
      endDate,
      location,
      eventType,
      virtualLink,
      maxAttendees,
      coverImage,
      isPublic
    } = req.body;

    // Verify group exists and user is a member
    const groupDoc = await Group.findById(group);
    if (!groupDoc) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = groupDoc.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Must be a group member to create events' });
    }

    const event = await Event.create({
      title,
      description,
      group,
      organizer: req.user._id,
      startDate,
      endDate,
      location,
      eventType,
      virtualLink,
      maxAttendees,
      coverImage,
      isPublic,
      attendees: [{
        user: req.user._id,
        status: 'going',
        registeredAt: new Date()
      }]
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.eventsCount': 1 } });

    const populatedEvent = await Event.findById(event._id)
      .populate('group', 'name image')
      .populate('organizer', 'username avatar')
      .populate('attendees.user', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: populatedEvent
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('group', 'name image memberCount')
      .populate('organizer', 'username avatar email')
      .populate('attendees.user', 'username avatar');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/events/:id/join
// @desc    Join an event
// @access  Private
router.post('/:id/join', protect, async (req, res) => {
  try {
    const { status = 'going' } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.maxAttendees && event.attendeeCount >= event.maxAttendees && status === 'going') {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    const attendeeIndex = event.attendees.findIndex(a => a.user.toString() === req.user._id.toString());
    
    if (attendeeIndex !== -1) {
      event.attendees[attendeeIndex].status = status;
    } else {
      event.attendees.push({
        user: req.user._id,
        status,
        registeredAt: new Date()
      });
    }

    await event.save();

    if (status === 'going' && attendeeIndex === -1) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.eventsCount': 1 } });
    }

    res.json({
      success: true,
      message: `Successfully marked as ${status}`,
      data: event
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/events/:id/leave
// @desc    Leave an event
// @access  Private
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    event.attendees = event.attendees.filter(a => a.user.toString() !== req.user._id.toString());
    await event.save();

    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.eventsCount': -1 } });

    res.json({
      success: true,
      message: 'Successfully left the event',
      data: event
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/events/group/:groupId
// @desc    Get events for a specific group
// @access  Public
router.get('/group/:groupId', async (req, res) => {
  try {
    const { status = 'upcoming' } = req.query;
    const query = { group: req.params.groupId };
    
    if (status !== 'all') {
      query.status = status;
    }

    const events = await Event.find(query)
      .populate('organizer', 'username avatar')
      .populate('attendees.user', 'username avatar')
      .sort({ startDate: 1 });

    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/events/user/upcoming
// @desc    Get user's upcoming events from their groups
// @access  Private
router.get('/user/upcoming', protect, async (req, res) => {
  try {
    // Get user's groups
    const groups = await Group.find({ members: req.user._id }).select('_id');
    const groupIds = groups.map(g => g._id);

    // Get upcoming events from these groups
    const events = await Event.find({
      group: { $in: groupIds },
      status: 'upcoming',
      startDate: { $gte: new Date() }
    })
      .populate('group', 'name image')
      .populate('organizer', 'username avatar')
      .populate('attendees.user', 'username avatar')
      .sort({ startDate: 1 })
      .limit(20);

    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/events/calendar
// @desc    Get events for calendar view (month view)
// @access  Private
router.get('/calendar/month', protect, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ success: false, message: 'Year and month are required' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get user's groups
    const groups = await Group.find({ members: req.user._id }).select('_id');
    const groupIds = groups.map(g => g._id);

    const events = await Event.find({
      group: { $in: groupIds },
      startDate: { $gte: startDate, $lte: endDate }
    })
      .populate('group', 'name image')
      .populate('organizer', 'username avatar')
      .sort({ startDate: 1 });

    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private (Organizer or Admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user is organizer or group admin
    const group = await Group.findById(event.group);
    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    const isAdmin = group.admins.some(a => a.toString() === req.user._id.toString());

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this event' });
    }

    const { title, description, startDate, endDate, location, eventType, virtualLink, maxAttendees, coverImage, isPublic } = req.body;

    if (title) event.title = title;
    if (description) event.description = description;
    if (startDate) event.startDate = startDate;
    if (endDate) event.endDate = endDate;
    if (location !== undefined) event.location = location;
    if (eventType) event.eventType = eventType;
    if (virtualLink !== undefined) event.virtualLink = virtualLink;
    if (maxAttendees !== undefined) event.maxAttendees = maxAttendees;
    if (coverImage) event.coverImage = coverImage;
    if (isPublic !== undefined) event.isPublic = isPublic;

    await event.save();

    const updatedEvent = await Event.findById(event._id)
      .populate('group', 'name image')
      .populate('organizer', 'username avatar')
      .populate('attendees.user', 'username avatar');

    res.json({ success: true, message: 'Event updated successfully', data: updatedEvent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/events/:id
// @desc    Cancel an event
// @access  Private (Organizer or Admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user is organizer or group admin
    const group = await Group.findById(event.group);
    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    const isAdmin = group.admins.some(a => a.toString() === req.user._id.toString());

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this event' });
    }

    event.status = 'cancelled';
    await event.save();

    res.json({ success: true, message: 'Event cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
