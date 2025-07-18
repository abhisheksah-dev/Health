const mongoose = require('mongoose');

const medicationLogSchema = new mongoose.Schema({
    takenAt: { type: Date, required: true },
    status: { type: String, enum: ['taken', 'skipped', 'taken_late'], required: true },
    notes: String
});

const MedicationReminderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicationName: { type: String, required: true, trim: true },
  dosage: { type: String, trim: true },
  frequency: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'custom'],
      required: true
    },
    times: [String], // e.g., ['08:00', '20:00']
    days: [Number] // 0 for Sunday, 6 for Saturday
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  notes: { type: String, trim: true },
  logs: [medicationLogSchema],
}, {
  timestamps: true
});

module.exports = mongoose.model('MedicationReminder', MedicationReminderSchema);