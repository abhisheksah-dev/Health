const mongoose = require('mongoose');

const governmentSchemeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  schemeCode: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['health_insurance', 'subsidy', 'assistance', 'rehabilitation', 'preventive_care'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  objectives: [{
    type: String
  }],
  benefits: {
    coverage: [{
      type: String
    }],
    financialSupport: {
      type: {
        type: String,
        enum: ['fixed_amount', 'percentage', 'sliding_scale']
      },
      value: Number,
      currency: {
        type: String,
        default: 'INR'
      },
      maxLimit: Number
    },
    services: [{
      type: String
    }],
    medications: [{
      name: String,
      coverage: {
        type: String,
        enum: ['full', 'partial', 'fixed_amount']
      },
      value: Number
    }]
  },
  eligibility: {
    ageRange: {
      min: Number,
      max: Number
    },
    incomeRange: {
      min: Number,
      max: Number
    },
    categories: [{
      type: String,
      enum: ['general', 'sc', 'st', 'obc', 'ews', 'pwd']
    }],
    employmentStatus: [{
      type: String,
      enum: ['employed', 'unemployed', 'self_employed', 'student', 'retired']
    }],
    residencyStatus: [{
      type: String,
      enum: ['citizen', 'resident', 'migrant']
    }],
    healthConditions: [{
      type: String
    }],
    documents: [{
      type: String,
      required: true
    }]
  },
  application: {
    process: [{
      step: Number,
      description: String,
      documents: [String],
      timeline: String
    }],
    channels: [{
      type: String,
      enum: ['online', 'offline', 'mobile_app', 'common_service_center']
    }],
    fees: {
      amount: Number,
      currency: {
        type: String,
        default: 'INR'
      },
      refundable: Boolean
    },
    timeline: {
      processing: String,
      approval: String,
      disbursement: String
    }
  },
  validity: {
    startDate: Date,
    endDate: Date,
    renewable: Boolean,
    renewalProcess: String,
    renewalFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', 'once']
    }
  },
  coverage: {
    geographical: {
      states: [String],
      districts: [String],
      rural: Boolean,
      urban: Boolean
    },
    healthcareProviders: [{
      type: {
        type: String,
        enum: ['government', 'private', 'both']
      },
      facilities: [String]
    }]
  },
  monitoring: {
    metrics: [{
      name: String,
      target: Number,
      current: Number,
      unit: String
    }],
    reports: [{
      type: String,
      frequency: String,
      format: String
    }]
  },
  contact: {
    helpline: {
      phone: String,
      email: String,
      hours: String
    },
    website: String,
    socialMedia: {
      twitter: String,
      facebook: String,
      instagram: String
    },
    regionalOffices: [{
      state: String,
      address: String,
      phone: String,
      email: String
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'upcoming', 'discontinued'],
    default: 'active'
  },
  languages: [{
    type: String
  }],
  metadata: {
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    version: String,
    source: String,
    tags: [String]
  }
}, {
  timestamps: true
});

// Index for faster searches
governmentSchemeSchema.index({ 
  name: 'text',
  schemeCode: 1,
  category: 1,
  status: 1,
  'coverage.geographical.states': 1
});

module.exports = mongoose.model('GovernmentScheme', governmentSchemeSchema); 