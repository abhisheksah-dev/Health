const mongoose = require('mongoose');

const geoFenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['health_alert', 'environmental', 'service', 'custom'],
    required: true
  },
  description: String,
  boundary: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon', 'Circle'],
      required: true
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed, // GeoJSON coordinates
      required: true
    },
    radius: Number // for Circle type
  },
  environmentalData: {
    sources: [{
      type: {
        type: String,
        enum: ['air_quality', 'water_quality', 'weather', 'pollution', 'custom'],
        required: true
      },
      provider: String,
      apiKey: String,
      updateFrequency: String,
      metrics: [{
        name: String,
        unit: String,
        threshold: {
          warning: Number,
          critical: Number
        }
      }]
    }],
    currentData: {
      timestamp: Date,
      values: mongoose.Schema.Types.Mixed
    },
    historicalData: [{
      timestamp: Date,
      values: mongoose.Schema.Types.Mixed
    }]
  },
  alerts: [{
    name: String,
    condition: {
      metric: String,
      operator: {
        type: String,
        enum: ['>', '<', '>=', '<=', '==', '!=']
      },
      value: Number,
      duration: Number // in minutes
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true
    },
    message: {
      title: String,
      body: String,
      recommendations: [String]
    },
    action: {
      type: {
        type: String,
        enum: ['notification', 'email', 'sms', 'app_alert', 'custom']
      },
      template: String,
      recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }
  }],
  healthRecommendations: [{
    condition: {
      metric: String,
      operator: String,
      value: Number
    },
    recommendation: {
      title: String,
      description: String,
      actions: [String],
      resources: [{
        type: String,
        url: String
      }]
    },
    targetAudience: {
      ageRange: {
        min: Number,
        max: Number
      },
      healthConditions: [String],
      riskFactors: [String]
    }
  }],
  services: [{
    type: {
      type: String,
      enum: ['healthcare', 'emergency', 'pharmacy', 'testing', 'custom']
    },
    name: String,
    description: String,
    contact: {
      phone: String,
      email: String,
      website: String
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number] // [longitude, latitude]
      }
    },
    operatingHours: {
      days: [String],
      hours: String
    }
  }],
  monitoring: {
    active: {
      type: Boolean,
      default: true
    },
    schedule: {
      startDate: Date,
      endDate: Date,
      frequency: String
    },
    lastChecked: Date,
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active'
    }
  },
  access: {
    public: {
      type: Boolean,
      default: true
    },
    restricted: {
      roles: [String],
      organizations: [String]
    },
    api: {
      enabled: Boolean,
      rateLimit: Number,
      authentication: Boolean
    }
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    version: String,
    tags: [String]
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geo-spatial queries
geoFenceSchema.index({ boundary: '2dsphere' });
geoFenceSchema.index({ 'services.location': '2dsphere' });

// Index for faster searches
geoFenceSchema.index({ 
  name: 'text',
  type: 1,
  status: 1,
  'monitoring.active': 1
});

// Index for environmental data queries
geoFenceSchema.index({ 
  'environmentalData.currentData.timestamp': -1,
  'environmentalData.sources.type': 1
});

module.exports = mongoose.model('GeoFence', geoFenceSchema); 