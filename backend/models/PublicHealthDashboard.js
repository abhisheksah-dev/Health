const mongoose = require('mongoose');

const publicHealthDashboardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['disease', 'demographic', 'environmental', 'healthcare_access', 'vaccination', 'custom'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: String,
  dataSource: {
    type: {
      type: String,
      enum: ['user_reported', 'healthcare_provider', 'government', 'research', 'aggregated'],
      required: true
    },
    provider: String,
    lastUpdated: Date,
    updateFrequency: String,
    reliability: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  geographicalScope: {
    type: {
      type: String,
      enum: ['national', 'state', 'district', 'city', 'custom'],
      required: true
    },
    regions: [{
      name: String,
      code: String,
      level: String
    }],
    boundaries: {
      type: {
        type: String,
        enum: ['MultiPolygon'],
        default: 'MultiPolygon'
      },
      coordinates: [[[[Number]]]] // GeoJSON MultiPolygon
    }
  },
  timeRange: {
    start: Date,
    end: Date,
    granularity: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      required: true
    }
  },
  metrics: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    unit: String,
    aggregation: {
      type: {
        type: String,
        enum: ['sum', 'average', 'count', 'percentage', 'rate', 'custom'],
        required: true
      },
      method: String
    },
    thresholds: {
      warning: Number,
      critical: Number
    },
    visualization: {
      type: {
        type: String,
        enum: ['line', 'bar', 'pie', 'map', 'heatmap', 'scatter'],
        required: true
      },
      config: mongoose.Schema.Types.Mixed
    }
  }],
  data: [{
    timestamp: {
      type: Date,
      required: true
    },
    region: {
      name: String,
      code: String
    },
    values: mongoose.Schema.Types.Mixed,
    metadata: {
      source: String,
      confidence: Number,
      sampleSize: Number
    }
  }],
  trends: [{
    metric: String,
    direction: {
      type: String,
      enum: ['increasing', 'decreasing', 'stable', 'fluctuating']
    },
    magnitude: Number,
    period: String,
    significance: {
      type: Number,
      min: 0,
      max: 1
    },
    factors: [String]
  }],
  alerts: [{
    metric: String,
    threshold: Number,
    condition: {
      type: String,
      enum: ['above', 'below', 'change']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    message: String,
    action: String
  }],
  insights: [{
    title: String,
    description: String,
    metrics: [String],
    significance: String,
    recommendations: [String],
    generatedAt: Date
  }],
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
  visualization: {
    defaultView: {
      type: String,
      enum: ['map', 'chart', 'table', 'dashboard'],
      required: true
    },
    layouts: [{
      name: String,
      components: [{
        type: String,
        config: mongoose.Schema.Types.Mixed
      }]
    }],
    filters: [{
      field: String,
      type: {
        type: String,
        enum: ['date', 'category', 'range', 'location']
      },
      options: mongoose.Schema.Types.Mixed
    }]
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'archived'],
    default: 'active'
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

// Index for faster queries
publicHealthDashboardSchema.index({ 
  type: 1, 
  category: 1,
  status: 1,
  'geographicalScope.type': 1
});

// Index for time-series data
publicHealthDashboardSchema.index({ 
  'data.timestamp': 1,
  'data.region.code': 1
});

// Index for geo-spatial queries
publicHealthDashboardSchema.index({ 
  'geographicalScope.boundaries': '2dsphere'
});

module.exports = mongoose.model('PublicHealthDashboard', publicHealthDashboardSchema); 