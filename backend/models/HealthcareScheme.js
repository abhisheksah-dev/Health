const mongoose = require('mongoose');

const healthcareSchemeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['government', 'private', 'ngo', 'corporate'],
    required: true
  },
  provider: {
    name: String,
    contact: {
      phone: String,
      email: String,
      website: String
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  },
  description: {
    type: String,
    required: true
  },
  benefits: [{
    type: String
  }],
  eligibilityCriteria: {
    ageRange: {
      min: Number,
      max: Number
    },
    incomeRange: {
      min: Number,
      max: Number
    },
    employmentStatus: [String],
    residencyStatus: [String],
    otherCriteria: [String]
  },
  coverage: {
    medicalServices: [String],
    medications: [String],
    procedures: [String],
    exclusions: [String]
  },
  documentsRequired: [{
    type: String
  }],
  applicationProcess: {
    steps: [String],
    estimatedTime: String,
    fees: Number
  },
  validity: {
    startDate: Date,
    endDate: Date,
    renewable: Boolean,
    renewalProcess: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  languages: [{
    type: String
  }],
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
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for faster searches
healthcareSchemeSchema.index({ 
  name: 'text', 
  type: 1, 
  'provider.name': 1,
  tags: 1
});

module.exports = mongoose.model('HealthcareScheme', healthcareSchemeSchema); 