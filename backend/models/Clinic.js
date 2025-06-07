const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  description: String,
  duration: {
    type: Number, // in minutes
    required: true,
    min: [5, 'Duration must be at least 5 minutes']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    enum: ['consultation', 'procedure', 'test', 'therapy', 'other'],
    required: true
  }
});

const facilitySchema = new Schema({
  name: {
    type: String,
    required: [true, 'Facility name is required'],
    trim: true
  },
  description: String,
  type: {
    type: String,
    enum: ['medical', 'non_medical', 'diagnostic', 'support'],
    required: true
  },
  availability: {
    type: String,
    enum: ['24x7', 'day', 'night', 'weekday', 'weekend', 'custom'],
    default: 'day'
  },
  customTimings: {
    startTime: String,
    endTime: String,
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'under_maintenance'],
    default: 'active'
  }
});

const clinicSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Clinic name is required'],
    trim: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Clinic must be associated with a user account']
  },
  type: {
    type: String,
    enum: ['general', 'specialty', 'multi_specialty'],
    required: true
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true
  },
  establishedYear: {
    type: Number,
    required: true,
    min: [1800, 'Year cannot be before 1800'],
    max: [new Date().getFullYear(), 'Year cannot be in the future']
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  contact: {
    phone: [{
      type: String,
      required: true,
      trim: true
    }],
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  workingHours: {
    monday: {
      isOpen: {
        type: Boolean,
        default: true
      },
      startTime: String,
      endTime: String
    },
    tuesday: {
      isOpen: {
        type: Boolean,
        default: true
      },
      startTime: String,
      endTime: String
    },
    wednesday: {
      isOpen: {
        type: Boolean,
        default: true
      },
      startTime: String,
      endTime: String
    },
    thursday: {
      isOpen: {
        type: Boolean,
        default: true
      },
      startTime: String,
      endTime: String
    },
    friday: {
      isOpen: {
        type: Boolean,
        default: true
      },
      startTime: String,
      endTime: String
    },
    saturday: {
      isOpen: {
        type: Boolean,
        default: true
      },
      startTime: String,
      endTime: String
    },
    sunday: {
      isOpen: {
        type: Boolean,
        default: false
      },
      startTime: String,
      endTime: String
    }
  },
  services: [serviceSchema],
  facilities: [facilitySchema],
  doctors: [{
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    specialization: String,
    startDate: Date,
    endDate: Date,
    current: {
      type: Boolean,
      default: true
    },
    availability: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        required: true
      },
      slots: [{
        startTime: {
          type: String,
          required: true,
          match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
        },
        endTime: {
          type: String,
          required: true,
          match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
        },
        isAvailable: {
          type: Boolean,
          default: true
        }
      }]
    }]
  }],
  insuranceAccepted: [{
    provider: String,
    plans: [String]
  }],
  accreditations: [{
    name: String,
    issuer: String,
    year: Number,
    expiryDate: Date,
    document: {
      url: String,
      publicId: String
    }
  }],
  images: [{
    type: {
      type: String,
      enum: ['exterior', 'interior', 'facility', 'other'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    caption: String
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    categories: {
      cleanliness: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      staff: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      facilities: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      treatment: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      value: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      }
    }
  },
  verification: {
    registration: {
      verified: {
        type: Boolean,
        default: false
      },
      verifiedAt: Date,
      verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      documents: [{
        type: String,
        url: String,
        publicId: String
      }]
    },
    license: {
      verified: {
        type: Boolean,
        default: false
      },
      verifiedAt: Date,
      verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      documents: [{
        type: String,
        url: String,
        publicId: String
      }]
    }
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'inactive'],
    default: 'pending'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
clinicSchema.index({ userId: 1 }, { unique: true });
clinicSchema.index({ registrationNumber: 1 }, { unique: true });
clinicSchema.index({ 'address.coordinates': '2dsphere' });
clinicSchema.index({ name: 'text', 'address.city': 'text', 'address.state': 'text' });
clinicSchema.index({ status: 1, 'rating.average': -1 });
clinicSchema.index({ type: 1 });

// Virtual for current doctors
clinicSchema.virtual('currentDoctors').get(function() {
  if (!this.doctors) return [];
  return this.doctors.filter(doc => doc.current);
});

// Pre-save middleware to validate coordinates
clinicSchema.pre('save', function(next) {
  if (this.isModified('address.coordinates.coordinates')) {
    const [longitude, latitude] = this.address.coordinates.coordinates;
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      return next(new Error('Invalid coordinates'));
    }
  }
  next();
});

// Pre-save middleware to validate working hours
clinicSchema.pre('save', function(next) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  for (const day of days) {
    const hours = this.workingHours[day];
    if (hours.isOpen) {
      if (!hours.startTime || !hours.endTime) {
        return next(new Error(`Start time and end time are required for ${day}`));
      }
      
      const start = new Date(`2000-01-01T${hours.startTime}`);
      const end = new Date(`2000-01-01T${hours.endTime}`);
      
      if (end <= start) {
        return next(new Error(`End time must be after start time for ${day}`));
      }
    }
  }
  next();
});

// Static method to find nearby clinics
clinicSchema.statics.findNearby = function(coordinates, maxDistance = 10000) {
  return this.find({
    'address.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    },
    status: 'active'
  }).populate('userId', 'name email phone');
};

// Static method to find clinics by service
clinicSchema.statics.findByService = function(serviceName) {
  return this.find({
    'services.name': serviceName,
    status: 'active'
  }).populate('userId', 'name email phone');
};

// Static method to find available clinics
clinicSchema.statics.findAvailable = function(date, time) {
  const day = date.toLocaleLowerCase();
  const queryTime = time;
  
  return this.find({
    status: 'active',
    [`workingHours.${day}.isOpen`]: true,
    [`workingHours.${day}.startTime`]: { $lte: queryTime },
    [`workingHours.${day}.endTime`]: { $gte: queryTime },
    'doctors.availability': {
      $elemMatch: {
        day: day,
        'slots.startTime': { $lte: queryTime },
        'slots.endTime': { $gte: queryTime },
        'slots.isAvailable': true
      }
    }
  }).populate('userId', 'name email phone');
};

const Clinic = mongoose.model('Clinic', clinicSchema);

module.exports = Clinic; 