const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  prescriptionDate: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  diagnosis: [{
    condition: String,
    icdCode: String,
    notes: String
  }],
  medications: [{
    name: {
      type: String,
      required: true
    },
    genericName: String,
    dosage: {
      amount: Number,
      unit: String,
      frequency: String,
      duration: {
        value: Number,
        unit: {
          type: String,
          enum: ['days', 'weeks', 'months']
        }
      }
    },
    route: {
      type: String,
      enum: ['oral', 'injection', 'topical', 'inhalation', 'other']
    },
    timing: {
      type: String,
      enum: ['before_meal', 'after_meal', 'with_meal', 'empty_stomach', 'as_needed']
    },
    specialInstructions: String,
    refill: {
      allowed: Boolean,
      count: Number,
      interval: Number // in days
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'expired'],
      default: 'active'
    }
  }],
  labTests: [{
    name: String,
    instructions: String,
    urgency: {
      type: String,
      enum: ['routine', 'urgent', 'emergency']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled']
    }
  }],
  followUp: {
    required: Boolean,
    date: Date,
    type: {
      type: String,
      enum: ['review', 'procedure', 'consultation']
    },
    notes: String
  },
  images: [{
    url: String,
    type: {
      type: String,
      enum: ['original', 'processed', 'thumbnail']
    },
    ocrData: {
      text: String,
      confidence: Number,
      processedAt: Date
    }
  }],
  ocrAnalysis: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    rawText: String,
    extractedData: {
      doctorInfo: {
        name: String,
        license: String,
        specialization: String
      },
      patientInfo: {
        name: String,
        age: Number,
        gender: String
      },
      medications: [{
        name: String,
        dosage: String,
        frequency: String
      }],
      diagnosis: [String],
      date: Date
    },
    confidence: Number,
    processingTime: Number,
    model: String,
    error: String
  },
  drugInteractions: [{
    medications: [{
      type: String
    }],
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    description: String,
    recommendation: String
  }],
  allergies: [{
    medication: String,
    reaction: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    }
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'expired'],
    default: 'active'
  },
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'scan', 'digital'],
      required: true
    },
    verification: {
      verified: Boolean,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      verifiedAt: Date,
      method: {
        type: String,
        enum: ['manual', 'digital_signature', 'blockchain']
      }
    },
    language: {
      type: String,
      default: 'en'
    },
    version: String
  }
}, {
  timestamps: true
});

// Index for faster searches
prescriptionSchema.index({ 
  userId: 1, 
  doctorId: 1,
  prescriptionDate: -1,
  status: 1
});

// Text index for medication search
prescriptionSchema.index({ 
  'medications.name': 'text',
  'diagnosis.condition': 'text'
});

module.exports = mongoose.model('Prescription', prescriptionSchema); 