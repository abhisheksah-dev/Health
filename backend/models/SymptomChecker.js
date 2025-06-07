const mongoose = require('mongoose');

const symptomCheckerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  symptoms: [{
    name: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      required: true
    },
    duration: {
      value: Number,
      unit: {
        type: String,
        enum: ['hours', 'days', 'weeks', 'months'],
        required: true
      }
    },
    frequency: {
      type: String,
      enum: ['constant', 'intermittent', 'occasional'],
      required: true
    },
    description: String,
    affectedArea: String,
    triggers: [String],
    alleviatingFactors: [String]
  }],
  medicalHistory: {
    conditions: [String],
    medications: [{
      name: String,
      dosage: String,
      frequency: String
    }],
    allergies: [String],
    familyHistory: [String]
  },
  vitalSigns: {
    temperature: Number,
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    respiratoryRate: Number,
    oxygenSaturation: Number,
    timestamp: Date
  },
  analysis: {
    possibleConditions: [{
      condition: {
        type: String,
        required: true
      },
      probability: {
        type: Number,
        min: 0,
        max: 1,
        required: true
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        required: true
      },
      explanation: String,
      recommendedActions: [String],
      urgency: {
        type: String,
        enum: ['low', 'medium', 'high', 'emergency'],
        required: true
      }
    }],
    riskFactors: [{
      factor: String,
      severity: String,
      impact: String
    }],
    recommendations: [{
      type: {
        type: String,
        enum: ['self_care', 'primary_care', 'urgent_care', 'emergency'],
        required: true
      },
      description: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true
      }
    }]
  },
  llmAnalysis: {
    prompt: String,
    response: String,
    confidence: Number,
    model: String,
    timestamp: Date
  },
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    timeframe: {
      value: Number,
      unit: {
        type: String,
        enum: ['hours', 'days', 'weeks']
      }
    },
    type: {
      type: String,
        enum: ['self_monitoring', 'doctor_visit', 'specialist_consultation', 'emergency']
    },
    notes: String
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'follow_up_scheduled', 'closed'],
    default: 'in_progress'
  },
  metadata: {
    startTime: {
      type: Date,
      default: Date.now
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    duration: Number, // in minutes
    language: {
      type: String,
      default: 'en'
    },
    device: {
      type: String,
      platform: String,
      browser: String
    }
  }
}, {
  timestamps: true
});

// Index for faster searches
symptomCheckerSchema.index({ 
  userId: 1, 
  sessionId: 1,
  status: 1,
  'metadata.startTime': -1
});

// Text index for symptom search
symptomCheckerSchema.index({ 
  'symptoms.name': 'text',
  'analysis.possibleConditions.condition': 'text'
});

module.exports = mongoose.model('SymptomChecker', symptomCheckerSchema); 