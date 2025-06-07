const mongoose = require('mongoose');

const bloodDonorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  lastDonation: {
    date: Date,
    location: String
  },
  nextEligibleDonation: {
    type: Date,
    required: true
  },
  medicalHistory: {
    conditions: [String],
    medications: [String],
    allergies: [String],
    lastCheckup: Date
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
    phone: String,
    email: String,
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    }
  },
  availability: {
    status: {
      type: String,
      enum: ['available', 'unavailable', 'temporarily_unavailable'],
      default: 'available'
    },
    preferredTimes: [{
      day: String,
      timeSlots: [{
        start: String,
        end: String
      }]
    }],
    travelRadius: Number, // in kilometers
    preferredLocations: [{
      name: String,
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    }]
  },
  preferences: {
    notificationMethod: [{
      type: String,
      enum: ['email', 'sms', 'push']
    }],
    privacyLevel: {
      type: String,
      enum: ['public', 'private', 'contacts_only'],
      default: 'private'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  donationHistory: [{
    date: Date,
    location: String,
    bloodType: String,
    volume: Number, // in ml
    status: {
      type: String,
      enum: ['completed', 'cancelled', 'rejected']
    },
    notes: String
  }],
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationMethod: {
      type: String,
      enum: ['id', 'medical_certificate', 'blood_bank_verification']
    },
    verificationDate: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  metadata: {
    totalDonations: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geo-spatial queries
bloodDonorSchema.index({ location: '2dsphere' });
bloodDonorSchema.index({ 'availability.preferredLocations.coordinates': '2dsphere' });

// Index for faster searches
bloodDonorSchema.index({ 
  bloodType: 1, 
  'availability.status': 1,
  'verification.isVerified': 1,
  'address.city': 1
});

module.exports = mongoose.model('BloodDonor', bloodDonorSchema); 