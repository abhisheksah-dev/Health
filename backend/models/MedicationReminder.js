const mongoose = require('mongoose');

const MedicationReminderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicationName: { type: String, required: true, trim: true },
  dosage: { type: String, trim: true },
  frequency: { type: String, trim: true },
  nextReminder: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

MedicationReminderSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('MedicationReminder', MedicationReminderSchema); 