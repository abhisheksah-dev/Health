const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const prescriptionSchema = new Schema({
  medicines: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    dosage: {
      type: String,
      required: true,
      trim: true
    },
    frequency: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: String,
      required: true,
      trim: true
    },
    instructions: String
  }],
  tests: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    instructions: String,
    isPrescribed: {
      type: Boolean,
      default: false
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    report: {
      url: String,
      publicId: String,
      uploadedAt: Date
    }
  }],
  notes: String,
  followUpDate: Date,
  followUpReason: String
});

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
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
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
    maxlength: [500, 'Reason cannot be more than 500 characters']
  },
  symptoms: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      required: true
    },
    duration: String,
    notes: String
  }],
  notes: {
    patient: {
      type: String,
      trim: true,
      maxlength: [1000, 'Patient notes cannot be more than 1000 characters']
    },
    doctor: {
      type: String,
      trim: true,
      maxlength: [1000, 'Doctor notes cannot be more than 1000 characters']
    }
  },
  documents: [{
    type: {
      type: String,
      enum: ['prescription', 'test_report', 'medical_certificate', 'other'],
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  prescription: {
    type: Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  payment: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Payment amount cannot be negative']
    },
    currency: {
      type: String,
      enum: ['INR', 'USD', 'EUR'],
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['online', 'cash', 'insurance', 'unpaid'],
      default: 'unpaid'
    },
    transactionId: String,
    paidAt: Date,
    refundedAt: Date
  },
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    date: Date,
    notes: String
  },
  cancellation: {
    reason: String,
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      trim: true,
      maxlength: [500, 'Review cannot be more than 500 characters']
    },
    createdAt: Date
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push'],
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date,
    error: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ doctor: 1, date: -1 });
appointmentSchema.index({ 'facility.id': 1, date: -1 });
appointmentSchema.index({ status: 1, date: 1 });
appointmentSchema.index({ 'payment.status': 1 });
appointmentSchema.index({ 'followUp.required': 1, 'followUp.date': 1 });

// Virtual for appointment duration
appointmentSchema.virtual('duration').get(function() {
  const start = new Date(`2000-01-01T${this.startTime}`);
  const end = new Date(`2000-01-01T${this.endTime}`);
  const diff = end - start;
  return Math.round(diff / (1000 * 60)); // Duration in minutes
});

// Virtual for appointment status
appointmentSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  const appointmentDate = new Date(this.date);
  return appointmentDate > now && this.status === 'confirmed';
});

// Virtual for appointment status
appointmentSchema.virtual('isPast').get(function() {
  const now = new Date();
  const appointmentDate = new Date(this.date);
  return appointmentDate < now || this.status === 'completed';
});

// Pre-save middleware to validate time
appointmentSchema.pre('save', function(next) {
  if (this.isModified('startTime') || this.isModified('endTime')) {
      const start = new Date(`2000-01-01T${this.startTime}`);
      const end = new Date(`2000-01-01T${this.endTime}`);
      
      if (end <= start) {
        return next(new Error('End time must be after start time'));
      }
  }
  next();
});

// Pre-save middleware to validate date
appointmentSchema.pre('save', function(next) {
  if (this.isNew) {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Set to the beginning of today
      const appointmentDate = new Date(this.date);
      appointmentDate.setHours(0, 0, 0, 0); // Set to the beginning of the appointment day
      
      if (appointmentDate < now) {
        return next(new Error('Appointment date cannot be in the past'));
      }
  }
  next();
});

// Static method to find upcoming appointments
appointmentSchema.statics.findUpcoming = function(userId, role, options = {}) {
  const query = {
    [role]: userId,
    date: { $gte: new Date() },
    status: 'confirmed'
  };
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query)
    .sort({ date: 1, startTime: 1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10)
    .populate('patient', 'name email phone')
    .populate('doctor', 'name email phone')
    .populate('facility.id', 'name address');
};

// Static method to find past appointments
appointmentSchema.statics.findPast = function(userId, role, options = {}) {
  const query = {
    [role]: userId,
    $or: [
      { date: { $lt: new Date() } },
      { status: 'completed' }
    ]
  };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ date: -1, startTime: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10)
    .populate('patient', 'name email phone')
    .populate('doctor', 'name email phone')
    .populate('facility.id', 'name address');
};

// Static method to find appointments by date range
appointmentSchema.statics.findByDateRange = function(userId, role, startDate, endDate, options = {}) {
  const query = {
    [role]: userId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query)
    .sort({ date: 1, startTime: 1 })
    .skip(options.skip || 0)
    .limit(options.limit || 50)
    .populate('patient', 'name email phone')
    .populate('doctor', 'name email phone')
    .populate('facility.id', 'name address');
};

// Static method to check availability
appointmentSchema.statics.checkAvailability = async function(doctorId, facilityId, date, startTime, endTime) {
  const query = {
    doctor: doctorId,
    'facility.id': facilityId,
    date: new Date(date),
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      {
        $and: [
          { startTime: { $lte: startTime } },
          { endTime: { $gt: startTime } }
        ]
      },
      {
        $and: [
          { startTime: { $lt: endTime } },
          { endTime: { $gte: endTime } }
        ]
      },
      {
        $and: [
          { startTime: { $gte: startTime } },
          { endTime: { $lte: endTime } }
        ]
      }
    ]
  };
  
  const conflictingAppointments = await this.find(query);
  return conflictingAppointments.length === 0;
};

// Static method to get doctor's schedule
appointmentSchema.statics.getDoctorSchedule = async function(doctorId, facilityId, date) {
  const appointments = await this.find({
    doctor: doctorId,
    'facility.id': facilityId,
    date: new Date(date),
    status: { $in: ['pending', 'confirmed'] }
  })
  .sort({ startTime: 1 })
  .select('startTime endTime status');
  
  return appointments;
};

// Static method to cancel appointment
appointmentSchema.statics.cancelAppointment = async function(appointmentId, userId, reason) {
  const appointment = await this.findById(appointmentId);
  
  if (!appointment) {
    throw new Error('Appointment not found');
  }
  
  if (appointment.status !== 'pending' && appointment.status !== 'confirmed') {
    throw new Error('Appointment cannot be cancelled');
  }
  
  const now = new Date();
  const appointmentDate = new Date(appointment.date);
  
  if (appointmentDate < now) {
    throw new Error('Cannot cancel past appointment');
  }
  
  appointment.status = 'cancelled';
  appointment.cancellation = {
    reason,
    cancelledBy: userId,
    cancelledAt: now
  };
  
  await appointment.save();
  
  // Create notification
  const Notification = mongoose.model('Notification');
  await Notification.createAppointmentNotification(appointment, 'appointment_cancelled');
  
  return appointment;
};

// Static method to complete appointment
appointmentSchema.statics.completeAppointment = async function(appointmentId, userId, notes) {
  const appointment = await this.findById(appointmentId);
  
  if (!appointment) {
    throw new Error('Appointment not found');
  }
  
  if (appointment.status !== 'confirmed') {
    throw new Error('Appointment must be confirmed to be completed');
  }
  
  appointment.status = 'completed';
  appointment.notes.doctor = notes;
  
  await appointment.save();
  
  // Create notification
  const Notification = mongoose.model('Notification');
  await Notification.createAppointmentNotification(appointment, 'appointment_completed');
  
  return appointment;
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;