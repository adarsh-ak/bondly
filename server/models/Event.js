import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an event title'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date']
  },
  location: {
    type: String,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  eventType: {
    type: String,
    enum: ['In-Person', 'Virtual', 'Hybrid'],
    default: 'In-Person'
  },
  virtualLink: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Please provide a valid URL'
    }
  },
  maxAttendees: {
    type: Number,
    min: [1, 'Max attendees must be at least 1']
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['going', 'interested', 'not-going'],
      default: 'going'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  attendeeCount: {
    type: Number,
    default: 0
  },
  coverImage: {
    type: String,
    default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  tags: [String],
  reminderSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
eventSchema.index({ group: 1, startDate: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ 'attendees.user': 1 });
eventSchema.index({ status: 1, startDate: 1 });

// Update attendee count before saving
eventSchema.pre('save', function(next) {
  this.attendeeCount = this.attendees.filter(a => a.status === 'going').length;
  next();
});

// Update status based on dates
eventSchema.pre('save', function(next) {
  if (this.status === 'cancelled') {
    return next();
  }
  
  const now = new Date();
  if (now > this.endDate) {
    this.status = 'completed';
  } else if (now >= this.startDate && now <= this.endDate) {
    this.status = 'ongoing';
  } else {
    this.status = 'upcoming';
  }
  next();
});

// Virtual for checking if event is full
eventSchema.virtual('isFull').get(function() {
  if (!this.maxAttendees) return false;
  return this.attendeeCount >= this.maxAttendees;
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
