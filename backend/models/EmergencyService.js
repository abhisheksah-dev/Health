const mongoose = require('mongoose');

const emergencyServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['hospital', 'clinic', 'pharmacy', 'ambulance', 'blood_bank'],
    required: true
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
    website: String
  },
  services: [{
    type: String
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
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'temporarily_closed'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geo-spatial queries
emergencyServiceSchema.index({ location: '2dsphere' });

// Index for faster searches
emergencyServiceSchema.index({ name: 'text', type: 1, 'address.city': 1 });

module.exports = mongoose.model('EmergencyService', emergencyServiceSchema); 