const mongoose = require('mongoose');

const EmergencySOSSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: { type: { type: String, enum: [ 'Point' ], default: 'Point' }, coordinates: { type: [ Number ], required: true }, address: { type: String, trim: true } },
  emergencyType: { type: String, required: true, trim: true },
  status: { type: String, enum: [ 'active', 'resolved', 'cancelled' ], default: 'active' },
  notes: { type: String, trim: true },
  resolvedAt: { type: Date },
  responseTime: { type: Number }, // (in seconds)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

EmergencySOSSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

EmergencySOSSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('EmergencySOS', EmergencySOSSchema); 