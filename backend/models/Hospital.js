const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const departmentSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  head: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  doctors: [{
    type: Schema.Types.ObjectId,
    ref: 'Doctor'
  }],
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
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    }
  }],
  facilities: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    capacity: Number,
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
});

const insuranceSchema = new Schema({
  provider: {
    type: String,
    required: [true, 'Insurance provider is required'],
    trim: true
  },
  plans: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    coverage: {
      type: String,
      enum: ['basic', 'standard', 'premium'],
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
});

const hospitalSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  name: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['public', 'private', 'trust', 'other'],
    required: [true, 'Hospital type is required']
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true
  },
  establishedYear: {
    type: Number,
    required: [true, 'Established year is required'],
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear(), 'Year cannot be in the future']
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function(v) {
            return v.length === 2 && 
                   v[0] >= -180 && v[0] <= 180 && 
                   v[1] >= -90 && v[1] <= 90;
          },
          message: 'Invalid coordinates'
        }
      }
    }
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    website: {
      type: String,
      trim: true,
      match: [/^(https?:\/\/)?(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/, 'Please provide a valid website URL']
    },
    emergency: {
      type: String,
      required: [true, 'Emergency contact is required'],
      trim: true
    }
  },
  departments: [departmentSchema],
  facilities: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],
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
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department'
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],
  insurance: [insuranceSchema],
  doctors: [{
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    position: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  staff: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'receptionist', 'nurse', 'other'],
      required: true
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department'
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  documents: [{
    type: {
      type: String,
      enum: ['license', 'certificate', 'registration', 'other'],
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
      cleanliness: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      },
      staff: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      },
      facilities: {
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
  operatingHours: {
    monday: {
      open: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
      },
      close: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
      },
      isOpen: {
        type: Boolean,
        default: true
      }
    },
    tuesday: {
      open: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
      },
      close: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
      },
      isOpen: {
        type: Boolean,
        default: true
      }
    },
    wednesday: {
      open: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
      },
      close: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
      },
      isOpen: {
        type: Boolean,
        default: true
      }
    },
    thursday: {
      open: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
      },
      close: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
      },
      isOpen: {
        type: Boolean,
        default: true
      }
    },
    friday: {
      open: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
      },
      close: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
      },
      isOpen: {
        type: Boolean,
        default: true
      }
    },
    saturday: {
      open: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
      },
      close: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
      },
      isOpen: {
        type: Boolean,
        default: true
      }
    },
    sunday: {
      open: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
      },
      close: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
      },
      isOpen: {
        type: Boolean,
        default: true
      }
    }
  },
  emergency: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    services: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }]
  },
  images: [{
    type: {
      type: String,
      enum: ['exterior', 'interior', 'facility', 'department', 'other'],
      required: true
    },
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
  about: {
    type: String,
    trim: true,
    maxlength: [2000, 'About cannot be more than 2000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
hospitalSchema.index({ user: 1 }, { unique: true });
hospitalSchema.index({ registrationNumber: 1 }, { unique: true });
hospitalSchema.index({ 'address.city': 1, 'address.state': 1 });
hospitalSchema.index({ 'address.coordinates': '2dsphere' });
hospitalSchema.index({ 'departments.name': 1 });
hospitalSchema.index({ 'doctors.doctor': 1 });
hospitalSchema.index({ 'staff.user': 1 });
hospitalSchema.index({ verification: 1 });
hospitalSchema.index({ status: 1, 'rating.average': -1 });

// Virtual for active doctors count
hospitalSchema.virtual('activeDoctorsCount').get(function() {
  return this.doctors.filter(d => d.isActive).length;
});

// Virtual for active staff count
hospitalSchema.virtual('activeStaffCount').get(function() {
  return this.staff.filter(s => s.isActive).length;
});

// Virtual for active departments count
hospitalSchema.virtual('activeDepartmentsCount').get(function() {
  return this.departments.filter(d => d.isActive).length;
});

// Virtual for is open
hospitalSchema.virtual('isOpen').get(function() {
  const now = new Date();
  const day = now.toLocaleLowerCase();
  const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  
  const hours = this.operatingHours[day];
  if (!hours || !hours.isOpen) return false;
  
  return currentTime >= hours.open && currentTime <= hours.close;
});

// Pre-save middleware to validate operating hours
hospitalSchema.pre('save', function(next) {
  if (this.isModified('operatingHours')) {
    for (const [day, hours] of Object.entries(this.operatingHours)) {
      if (hours.isOpen) {
        if (!hours.open || !hours.close) {
          return next(new Error(`${day} operating hours must have both open and close times`));
        }
        
        const open = new Date(`2000-01-01T${hours.open}`);
        const close = new Date(`2000-01-01T${hours.close}`);
        
        if (close <= open) {
          return next(new Error(`${day} close time must be after open time`));
        }
      }
    }
  }
  next();
});

// Static method to find hospitals by location
hospitalSchema.statics.findByLocation = function(coordinates, maxDistance, options = {}) {
  const query = {
    'address.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: maxDistance
      }
    },
    status: 'active',
    verification: 'verified'
  };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.department) {
    query['departments.name'] = options.department;
    query['departments.isActive'] = true;
  }
  
  return this.find(query)
    .sort({ 'rating.average': -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10)
    .select('name address contact operatingHours rating');
};

// Static method to find hospitals by department
hospitalSchema.statics.findByDepartment = function(department, options = {}) {
  const query = {
    'departments.name': department,
    'departments.isActive': true,
    status: 'active',
    verification: 'verified'
  };
  
  if (options.city) {
    query['address.city'] = options.city;
  }
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query)
    .sort({ 'rating.average': -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10)
    .select('name address contact departments operatingHours rating');
};

// Static method to find hospitals by insurance
hospitalSchema.statics.findByInsurance = function(provider, options = {}) {
  const query = {
    'insurance.provider': provider,
    'insurance.isActive': true,
    status: 'active',
    verification: 'verified'
  };
  
  if (options.city) {
    query['address.city'] = options.city;
  }
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query)
    .sort({ 'rating.average': -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10)
    .select('name address contact insurance operatingHours rating');
};

// Static method to update rating
hospitalSchema.statics.updateRating = async function(hospitalId, rating) {
  const hospital = await this.findById(hospitalId);
  
  if (!hospital) {
    throw new Error('Hospital not found');
  }
  
  const { score, categories } = rating;
  
  // Update average rating
  const totalScore = hospital.rating.average * hospital.rating.count + score;
  hospital.rating.count += 1;
  hospital.rating.average = totalScore / hospital.rating.count;
  
  // Update category ratings
  for (const [category, value] of Object.entries(categories)) {
    const currentTotal = hospital.rating.categories[category] * (hospital.rating.count - 1);
    hospital.rating.categories[category] = (currentTotal + value) / hospital.rating.count;
  }
  
  await hospital.save();
  return hospital;
};

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital; 