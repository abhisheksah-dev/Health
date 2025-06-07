const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reportSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Report must have a user']
  },
  reason: {
    type: String,
    enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other'],
    required: [true, 'Report must have a reason']
  },
  details: {
    type: String,
    trim: true,
    maxlength: [500, 'Report details cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },
  resolvedAt: Date,
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const imageSchema = new Schema({
  url: {
    type: String,
    required: [true, 'Image must have a URL']
  },
  publicId: {
    type: String,
    required: [true, 'Image must have a public ID']
  }
});

const reviewSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to a user']
  },
  appointment: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Review must be associated with an appointment']
  },
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Review must be for a doctor']
  },
  facility: {
    type: {
      type: String,
      enum: ['hospital', 'clinic'],
      required: true
    },
    id: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'facility.type'
    }
  },
  rating: {
    overall: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: 1,
      max: 5
    },
    categories: {
      doctor: {
        type: Number,
        required: [true, 'Doctor rating is required'],
        min: 1,
        max: 5
      },
      facility: {
        type: Number,
        required: [true, 'Facility rating is required'],
        min: 1,
        max: 5
      },
      staff: {
        type: Number,
        required: [true, 'Staff rating is required'],
        min: 1,
        max: 5
      },
      value: {
        type: Number,
        required: [true, 'Value rating is required'],
        min: 1,
        max: 5
      }
    }
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Review content is required'],
    trim: true,
    maxlength: [1000, 'Content cannot be more than 1000 characters']
  },
  pros: [{
    type: String,
    trim: true,
    maxlength: [100, 'Pro point cannot be more than 100 characters']
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: [100, 'Con point cannot be more than 100 characters']
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    caption: String
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  moderation: {
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: Date,
    reason: String,
    notes: String
  },
  helpful: {
    count: {
      type: Number,
      default: 0,
      min: 0
    },
    users: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  report: {
    count: {
      type: Number,
      default: 0,
      min: 0
    },
    reasons: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: {
        type: String,
        enum: [
          'inappropriate_content',
          'fake_review',
          'offensive_language',
          'irrelevant',
          'other'
        ],
        required: true
      },
      details: String,
      reportedAt: Date
    }]
  },
  response: {
    from: {
      type: String,
      enum: ['doctor', 'facility'],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Response cannot be more than 1000 characters']
    },
    respondedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
reviewSchema.index({ user: 1, appointment: 1 }, { unique: true });
reviewSchema.index({ doctor: 1, createdAt: -1 });
reviewSchema.index({ 'facility.id': 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ 'rating.overall': -1 });
reviewSchema.index({ 'helpful.count': -1 });

// Virtual for average category rating
reviewSchema.virtual('averageCategoryRating').get(function() {
  const categories = this.rating.categories;
  const sum = Object.values(categories).reduce((a, b) => a + b, 0);
  return sum / Object.keys(categories).length;
});

// Pre-save middleware to validate appointment
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Appointment = mongoose.model('Appointment');
    const appointment = await Appointment.findById(this.appointment);
    
    if (!appointment) {
      return next(new Error('Appointment not found'));
    }
    
    if (appointment.patient.toString() !== this.user.toString()) {
      return next(new Error('Only the patient can review the appointment'));
    }
    
    if (appointment.status !== 'completed') {
      return next(new Error('Can only review completed appointments'));
    }
    
    if (appointment.doctor.toString() !== this.doctor.toString()) {
      return next(new Error('Doctor does not match the appointment'));
    }
    
    if (appointment.facility.type !== this.facility.type || 
        appointment.facility.id.toString() !== this.facility.id.toString()) {
      return next(new Error('Facility does not match the appointment'));
    }
  }
  next();
});

// Static method to find reviews by doctor
reviewSchema.statics.findByDoctor = function(doctorId, options = {}) {
  const query = {
    doctor: doctorId,
    status: 'approved'
  };
  
  if (options.rating) {
    query['rating.overall'] = options.rating;
  }
  
  if (options.facilityType) {
    query['facility.type'] = options.facilityType;
  }
  
  return this.find(query)
    .populate('user', 'name avatar')
    .populate('facility.id', 'name')
    .sort(options.sort || { createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10);
};

// Static method to find reviews by facility
reviewSchema.statics.findByFacility = function(facilityId, facilityType, options = {}) {
  const query = {
    'facility.id': facilityId,
    'facility.type': facilityType,
    status: 'approved'
  };
  
  if (options.rating) {
    query['rating.overall'] = options.rating;
  }
  
  return this.find(query)
    .populate('user', 'name avatar')
    .populate('doctor', 'userId specialization')
    .populate('doctor.userId', 'name avatar')
    .sort(options.sort || { createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10);
};

// Static method to calculate average ratings
reviewSchema.statics.calculateAverageRatings = async function(doctorId, facilityId, facilityType) {
  const match = {
    status: 'approved'
  };
  
  if (doctorId) {
    match.doctor = doctorId;
  }
  
  if (facilityId && facilityType) {
    match['facility.id'] = facilityId;
    match['facility.type'] = facilityType;
  }
  
  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        averageOverall: { $avg: '$rating.overall' },
        averageDoctor: { $avg: '$rating.categories.doctor' },
        averageFacility: { $avg: '$rating.categories.facility' },
        averageStaff: { $avg: '$rating.categories.staff' },
        averageValue: { $avg: '$rating.categories.value' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || {
    averageOverall: 0,
    averageDoctor: 0,
    averageFacility: 0,
    averageStaff: 0,
    averageValue: 0,
    count: 0
  };
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 