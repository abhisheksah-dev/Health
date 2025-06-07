const mongoose = require('mongoose');

const mentalHealthProfessionalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialization: [{
    type: String,
    required: true
  }],
  qualifications: [{
    degree: String,
    institution: String,
    year: Number
  }],
  certifications: [{
    name: String,
    issuer: String,
    year: Number,
    expiryDate: Date
  }],
  experience: {
    years: Number,
    description: String
  },
  languages: [{
    type: String
  }],
  treatmentApproaches: [{
    type: String
  }],
  services: [{
    name: String,
    description: String,
    duration: Number, // in minutes
    price: Number
  }],
  availability: {
    monday: [{ start: String, end: String }],
    tuesday: [{ start: String, end: String }],
    wednesday: [{ start: String, end: String }],
    thursday: [{ start: String, end: String }],
    friday: [{ start: String, end: String }],
    saturday: [{ start: String, end: String }],
    sunday: [{ start: String, end: String }]
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
  insuranceAccepted: [{
    type: String
  }],
  slidingScale: {
    available: Boolean,
    details: String
  },
  virtualConsultation: {
    available: Boolean,
    platforms: [String]
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
    enum: ['active', 'inactive', 'on_leave'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geo-spatial queries
mentalHealthProfessionalSchema.index({ location: '2dsphere' });

// Index for faster searches
mentalHealthProfessionalSchema.index({ 
  specialization: 1, 
  'address.city': 1, 
  languages: 1,
  treatmentApproaches: 1
});

module.exports = mongoose.model('MentalHealthProfessional', mentalHealthProfessionalSchema); 