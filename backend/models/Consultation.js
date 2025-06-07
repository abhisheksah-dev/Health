const mongoose = require('mongoose');

const ConsultationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { type: String, enum: [ 'pending', 'ongoing', 'completed', 'cancelled' ], default: 'pending' },
  meetingLink: { type: String, required: true },
  notes: { type: String, trim: true },
  diagnosis: { type: String, trim: true },
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ConsultationSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('Consultation', ConsultationSchema); 