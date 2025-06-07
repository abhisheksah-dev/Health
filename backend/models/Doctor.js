const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const qualificationSchema = new Schema({
  degree: {
    type: String,
    required: [true, 'Degree is required'],
    trim: true
  },
  institution: {
    type: String,
    required: [true, 'Institution is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear(), 'Year cannot be in the future']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  documents: [{
    type: {
      type: String,
      enum: ['certificate', 'transcript', 'license', 'other'],
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
    verified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
});

const experienceSchema = new Schema({
  facility: {
    name: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['hospital', 'clinic', 'other'],
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: Date,
  isCurrent: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  documents: [{
    type: {
      type: String,
      enum: ['experience_letter', 'appointment_letter', 'other'],
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
    verified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
});

const specializationSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Specialization name is required'],
    trim: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

const scheduleSchema = new Schema({
  facility: {
    type: {
      type: String,
      enum: ['hospital', 'clinic'],
      required: true
    },
    id: {
      type: Schema.Types.ObjectId,
      refPath: 'facility.type',
      required: true
    }
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  startTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
  },
  endTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
  },
  slotDuration: {
    type: Number,
    required: true,
    min: [5, 'Slot duration must be at least 5 minutes'],
    max: [120, 'Slot duration cannot be more than 120 minutes']
  },
  breakStart: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
  },
  breakEnd: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxAppointments: {
    type: Number,
    min: [1, 'Maximum appointments must be at least 1'],
    default: 20
  }
});

const doctorSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true
  },
  council: {
    name: {
      type: String,
      required: [true, 'Medical council name is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Council country is required'],
      trim: true
    },
    year: {
      type: Number,
      required: [true, 'Registration year is required'],
      min: [1900, 'Year must be after 1900'],
      max: [new Date().getFullYear(), 'Year cannot be in the future']
    }
  },
  specializations: [specializationSchema],
  qualifications: [qualificationSchema],
  experience: [experienceSchema],
  schedule: [scheduleSchema],
  consultationFee: {
    type: Number,
    required: [true, 'Consultation fee is required'],
    min: [0, 'Consultation fee cannot be negative']
  },
  currency: {
    type: String,
    enum: ['INR', 'USD', 'EUR'],
    default: 'INR'
  },
  languages: [{
    type: String,
    required: true,
    trim: true
  }],
  about: {
    type: String,
    trim: true,
    maxlength: [2000, 'About cannot be more than 2000 characters']
  },
  services: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Service description cannot be more than 500 characters']
    },
    duration: {
      type: Number,
      required: true,
      min: [5, 'Duration must be at least 5 minutes'],
      max: [180, 'Duration cannot be more than 180 minutes']
    },
    fee: {
      type: Number,
      required: true,
      min: [0, 'Fee cannot be negative']
    }
  }],
  facilities: [{
    type: {
      type: String,
      enum: ['hospital', 'clinic'],
      required: true
    },
    id: {
      type: Schema.Types.ObjectId,
      refPath: 'facilities.type',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  documents: [{
    type: {
      type: String,
      enum: ['license', 'certificate', 'id_proof', 'other'],
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
    verified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  verification: {
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    notes: String,
    verifiedAt: Date,
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    },
    categories: {
      expertise: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      },
      communication: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      },
      punctuality: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      },
      value: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      }
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active'
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available'
  },
  lastActive: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
doctorSchema.index({ user: 1 }, { unique: true });
doctorSchema.index({ registrationNumber: 1 }, { unique: true });
doctorSchema.index({ 'specializations.name': 1 });
doctorSchema.index({ 'facilities.id': 1 });
doctorSchema.index({ 'schedule.facility.id': 1, 'schedule.dayOfWeek': 1 });
doctorSchema.index({ verification: 1 });
doctorSchema.index({ status: 1, availability: 1 });
doctorSchema.index({ 'rating.average': -1 });

// Virtual for experience years
doctorSchema.virtual('experienceYears').get(function() {
  if (!this.experience || this.experience.length === 0) return 0;
  
  const now = new Date();
  let totalYears = 0;
  
  this.experience.forEach(exp => {
    const start = new Date(exp.startDate);
    const end = exp.isCurrent ? now : new Date(exp.endDate);
    const years = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
    totalYears += years;
  });
  
  return Math.round(totalYears * 10) / 10; // Round to 1 decimal place
});

// Virtual for next available slot
doctorSchema.virtual('nextAvailableSlot').get(function() {
  if (!this.schedule || this.schedule.length === 0) return null;
  
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  
  // Find today's schedule
  const todaySchedule = this.schedule.find(s => 
    s.dayOfWeek === currentDay && 
    s.isActive && 
    s.endTime > currentTime
  );
  
  if (todaySchedule) {
    return {
      facility: todaySchedule.facility,
      time: todaySchedule.startTime > currentTime ? todaySchedule.startTime : currentTime
    };
  }
  
  // Find next available day's schedule
  for (let i = 1; i <= 7; i++) {
    const nextDay = (currentDay + i) % 7;
    const nextSchedule = this.schedule.find(s => 
      s.dayOfWeek === nextDay && 
      s.isActive
    );
    
    if (nextSchedule) {
      return {
        facility: nextSchedule.facility,
        time: nextSchedule.startTime
      };
    }
  }
  
  return null;
});

// Pre-save middleware to validate schedule
doctorSchema.pre('save', function(next) {
  if (this.isModified('schedule')) {
    for (const slot of this.schedule) {
      const start = new Date(`2000-01-01T${slot.startTime}`);
      const end = new Date(`2000-01-01T${slot.endTime}`);
      
      if (end <= start) {
        return next(new Error('End time must be after start time'));
      }
      
      if (slot.breakStart && slot.breakEnd) {
        const breakStart = new Date(`2000-01-01T${slot.breakStart}`);
        const breakEnd = new Date(`2000-01-01T${slot.breakEnd}`);
        
        if (breakEnd <= breakStart) {
          return next(new Error('Break end time must be after break start time'));
        }
        
        if (breakStart < start || breakEnd > end) {
          return next(new Error('Break time must be within schedule time'));
        }
      }
    }
  }
  next();
});

// Static method to find doctors by specialization
doctorSchema.statics.findBySpecialization = function(specialization, options = {}) {
  const query = {
    'specializations.name': specialization,
    'specializations.verified': true,
    status: 'active',
    verification: 'verified'
  };
  
  if (options.city) {
    query['facilities.address.city'] = options.city;
  }
  
  if (options.facilityType) {
    query['facilities.type'] = options.facilityType;
  }
  
  return this.find(query)
    .sort({ 'rating.average': -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10)
    .populate('user', 'name email phone avatar')
    .populate('facilities.id', 'name address');
};

// Static method to find doctors by facility
doctorSchema.statics.findByFacility = function(facilityId, options = {}) {
  const query = {
    'facilities.id': facilityId,
    'facilities.isActive': true,
    status: 'active',
    verification: 'verified'
  };
  
  if (options.specialization) {
    query['specializations.name'] = options.specialization;
    query['specializations.verified'] = true;
  }
  
  return this.find(query)
    .sort({ 'rating.average': -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10)
    .populate('user', 'name email phone avatar')
    .populate('facilities.id', 'name address');
};

// Static method to get doctor's availability
doctorSchema.statics.getAvailability = async function(doctorId, facilityId, date) {
  const doctor = await this.findById(doctorId)
    .select('schedule')
    .populate('facilities.id', 'name address');
  
  if (!doctor) {
    throw new Error('Doctor not found');
  }
  
  const schedule = doctor.schedule.find(s => 
    s.facility.id.toString() === facilityId.toString() &&
    s.isActive
  );
  
  if (!schedule) {
    throw new Error('Doctor is not available at this facility');
  }
  
  const appointmentDate = new Date(date);
  const dayOfWeek = appointmentDate.getDay();
  
  if (schedule.dayOfWeek !== dayOfWeek) {
    throw new Error('Doctor is not available on this day');
  }
  
  const slots = [];
  const start = new Date(`2000-01-01T${schedule.startTime}`);
  const end = new Date(`2000-01-01T${schedule.endTime}`);
  const duration = schedule.slotDuration * 60 * 1000; // Convert to milliseconds
  
  let currentSlot = new Date(start);
  
  while (currentSlot < end) {
    const slotEnd = new Date(currentSlot.getTime() + duration);
    
    // Skip if slot overlaps with break
    if (schedule.breakStart && schedule.breakEnd) {
      const breakStart = new Date(`2000-01-01T${schedule.breakStart}`);
      const breakEnd = new Date(`2000-01-01T${schedule.breakEnd}`);
      
      if (currentSlot < breakEnd && slotEnd > breakStart) {
        currentSlot = new Date(breakEnd);
        continue;
      }
    }
    
    if (slotEnd <= end) {
      slots.push({
        start: currentSlot.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        end: slotEnd.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      });
    }
    
    currentSlot = slotEnd;
  }
  
  return {
    facility: doctor.facilities.id,
    date: date,
    slots
  };
};

// Static method to update rating
doctorSchema.statics.updateRating = async function(doctorId, rating) {
  const doctor = await this.findById(doctorId);
  
  if (!doctor) {
    throw new Error('Doctor not found');
  }
  
  const { score, categories } = rating;
  
  // Update average rating
  const totalScore = doctor.rating.average * doctor.rating.count + score;
  doctor.rating.count += 1;
  doctor.rating.average = totalScore / doctor.rating.count;
  
  // Update category ratings
  for (const [category, value] of Object.entries(categories)) {
    const currentTotal = doctor.rating.categories[category] * (doctor.rating.count - 1);
    doctor.rating.categories[category] = (currentTotal + value) / doctor.rating.count;
  }
  
  await doctor.save();
  return doctor;
};

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor; 