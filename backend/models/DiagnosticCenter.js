const mongoose = require('mongoose');

const diagnosticCenterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['laboratory', 'imaging_center', 'specialized', 'comprehensive'],
    required: true
  },
  accreditation: [{
    body: String,
    certificate: String,
    validUntil: Date
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  contact: {
    phone: [String],
    email: [String],
    website: String,
    emergency: String
  },
  services: [{
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['laboratory', 'imaging', 'cardiac', 'neurological', 'other'],
      required: true
    },
    description: String,
    price: {
      amount: Number,
      currency: {
        type: String,
        default: 'INR'
      }
    },
    duration: Number, // in minutes
    preparation: String,
    reportTime: String,
    sampleType: String,
    equipment: [String],
    certifications: [String]
  }],
  facilities: [{
    name: String,
    type: String,
    capacity: Number,
    equipment: [{
      name: String,
      model: String,
      manufacturer: String,
      lastMaintenance: Date
    }]
  }],
  staff: [{
    role: {
      type: String,
      enum: ['doctor', 'technician', 'nurse', 'receptionist', 'manager']
    },
    name: String,
    qualification: String,
    specialization: String,
    availability: [{
      day: String,
      slots: [{
        start: String,
        end: String
      }]
    }]
  }],
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  is24Hours: {
    type: Boolean,
    default: false
  },
  insurance: {
    accepted: [{
      provider: String,
      plans: [String]
    }],
    cashless: Boolean,
    claimProcess: String
  },
  booking: {
    online: {
      enabled: Boolean,
      minAdvanceTime: Number, // in hours
      maxAdvanceTime: Number, // in days
      cancellationPolicy: {
        allowed: Boolean,
        timeLimit: Number, // in hours
        refundPolicy: String
      }
    },
    walkIn: {
      allowed: Boolean,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    },
    slots: [{
      date: Date,
      service: String,
      available: Number,
      booked: Number,
      price: Number
    }]
  },
  reports: {
    delivery: {
      methods: [{
        type: String,
        enum: ['email', 'sms', 'app', 'physical']
      }],
      time: String,
      format: [{
        type: String,
        enum: ['pdf', 'digital', 'physical']
      }]
    },
    language: [{
      type: String
    }],
    digitalAccess: {
      enabled: Boolean,
      validity: Number // in days
    }
  },
  quality: {
    certifications: [{
      name: String,
      issuer: String,
      validUntil: Date
    }],
    accreditations: [{
      body: String,
      level: String,
      validUntil: Date
    }],
    ratings: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      },
      count: {
        type: Number,
        default: 0
      }
    },
    reviews: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'temporarily_closed', 'permanently_closed'],
    default: 'active'
  },
  metadata: {
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    languages: [{
      type: String
    }],
    amenities: [{
      type: String
    }],
    parking: {
      available: Boolean,
      type: String
    },
    accessibility: {
      wheelchair: Boolean,
      elevator: Boolean,
      ramps: Boolean
    }
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geo-spatial queries
diagnosticCenterSchema.index({ location: '2dsphere' });

// Index for faster searches
diagnosticCenterSchema.index({ 
  name: 'text',
  type: 1,
  'address.city': 1,
  'services.name': 'text',
  status: 1
});

// Index for booking queries
diagnosticCenterSchema.index({ 
  'booking.slots.date': 1,
  'booking.slots.service': 1,
  'booking.slots.available': 1
});

module.exports = mongoose.model('DiagnosticCenter', diagnosticCenterSchema); 