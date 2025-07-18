const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appointmentSchema = new Schema({
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required']
  },
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor is required']
  },
  facility: {
    type: {
      type: String,
      enum: ['hospital', 'clinic'],
      required: [true, 'Facility type is required']
    },
    id: {
      type: Schema.Types.ObjectId,
      refPath: 'facility.type',
      required: [true, 'Facility ID is required']
    }
  },
  date: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
  },
  type: {
    type: String,
    enum: ['consultation', 'follow_up', 'checkup', 'emergency', 'other'],
    required: [true, 'Appointment type is required']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'pending'
  },
  reason: {
    type: String,
    required: [true, 'Reason for appointment is required'],
    trim: true,
  },
  review: { // NEW FIELD TO PREVENT DUPLICATE REVIEWS
    type: Schema.Types.ObjectId,
    ref: 'Review'
  },
  cancellation: {
    reason: String,
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date
  },
}, {
  timestamps: true,
});

appointmentSchema.statics.checkAvailability = async function(doctorId, facilityId, date, startTime, endTime) {
  const query = {
    doctor: doctorId,
    'facility.id': facilityId,
    date: new Date(date),
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      { $and: [{ startTime: { $lte: startTime } }, { endTime: { $gt: startTime } }] },
      { $and: [{ startTime: { $lt: endTime } }, { endTime: { $gte: endTime } }] },
      { $and: [{ startTime: { $gte: startTime } }, { endTime: { $lte: endTime } }] }
    ]
  };
  
  const conflictingAppointments = await this.find(query);
  return conflictingAppointments.length === 0;
};

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;