const mongoose = require('mongoose');

const healthAlertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['vital', 'medication', 'appointment', 'outbreak', 'environmental', 'custom'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  targetUsers: {
    all: {
      type: Boolean,
      default: false
    },
    specificUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    userGroups: [{
      type: String,
      enum: ['patients', 'doctors', 'admins']
    }],
    conditions: [{
      type: String
    }],
    ageRange: {
      min: Number,
      max: Number
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      },
      radius: Number // in kilometers
    }
  },
  trigger: {
    type: {
      type: String,
      enum: ['immediate', 'scheduled', 'recurring', 'condition_based'],
      required: true
    },
    schedule: {
      startDate: Date,
      endDate: Date,
      frequency: String, // e.g., "daily", "weekly", "monthly"
      timeOfDay: String, // e.g., "09:00"
      daysOfWeek: [String],
      timezone: String
    },
    condition: {
      metric: String, // e.g., "blood_pressure", "blood_sugar"
      operator: String, // e.g., ">", "<", "=="
      value: Number,
      duration: Number // in minutes
    }
  },
  notification: {
    channels: [{
      type: String,
      enum: ['email', 'sms', 'push', 'in_app'],
      required: true
    }],
    template: {
      email: String,
      sms: String,
      push: String,
      in_app: String
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    }
  },
  action: {
    type: {
      type: String,
      enum: ['none', 'redirect', 'call', 'schedule_appointment'],
      default: 'none'
    },
    details: {
      url: String,
      phone: String,
      appointmentType: String
    }
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastTriggered: Date,
    triggerCount: {
      type: Number,
      default: 0
    },
    responseRate: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
healthAlertSchema.index({ 
  type: 1, 
  severity: 1, 
  status: 1,
  'trigger.type': 1,
  'targetUsers.location': '2dsphere'
});

module.exports = mongoose.model('HealthAlert', healthAlertSchema); 