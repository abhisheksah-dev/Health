const mongoose = require('mongoose');
const User = require('./User');

const doctorSchema = new mongoose.Schema({
    specialization: {
        type: String,
        required: [true, 'Please specify your specialization'],
        trim: true
    },
    qualifications: [{
        degree: {
            type: String,
            required: true,
            trim: true
        },
        institution: {
            type: String,
            required: true,
            trim: true
        },
        year: {
            type: Number,
            required: true
        }
    }],
    licenseNumber: {
        type: String,
        required: [true, 'Please provide your medical license number'],
        unique: true,
        trim: true
    },
    experience: {
        type: Number,
        min: 0,
        default: 0
    },
    clinicDetails: {
        name: {
            type: String,
            required: [true, 'Please provide clinic name'],
            trim: true
        },
        address: {
            street: String,
            city: String,
            state: String,
            country: String,
            zipCode: String,
            coordinates: {
                type: {
                    type: String,
                    enum: ['Point'],
                    default: 'Point'
                },
                coordinates: {
                    type: [Number],
                    default: [0, 0]
                }
            }
        },
        phoneNumber: String,
        email: String,
        website: String,
        consultationFee: {
            type: Number,
            required: [true, 'Please specify consultation fee']
        }
    },
    availability: [{
        day: {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            required: true
        },
        slots: [{
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
            isAvailable: {
                type: Boolean,
                default: true
            }
        }]
    }],
    languages: [{
        type: String,
        trim: true
    }],
    services: [{
        type: String,
        trim: true
    }],
    insuranceAccepted: [{
        type: String,
        trim: true
    }],
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationDocuments: [{
        type: {
            type: String,
            enum: ['license', 'certification', 'id_proof', 'other'],
            required: true
        },
        documentUrl: {
            type: String,
            required: true
        },
        verified: {
            type: Boolean,
            default: false
        },
        verifiedAt: Date,
        verifiedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for geospatial queries
doctorSchema.index({ 'clinicDetails.address.coordinates': '2dsphere' });

// Virtual populate for reviews
doctorSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'doctor',
    localField: '_id'
});

// Virtual populate for appointments
doctorSchema.virtual('appointments', {
    ref: 'Appointment',
    foreignField: 'doctor',
    localField: '_id'
});

// Pre-save middleware to ensure role is set to 'doctor'
doctorSchema.pre('save', function(next) {
    this.role = 'doctor';
    next();
});

// Static method to find nearby doctors
doctorSchema.statics.findNearby = function(coordinates, maxDistance = 10000) {
    return this.find({
        'clinicDetails.address.coordinates': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: coordinates
                },
                $maxDistance: maxDistance
            }
        }
    });
};

// Method to calculate average rating
doctorSchema.methods.calculateAverageRating = async function() {
    const stats = await this.model('Review').aggregate([
        {
            $match: { doctor: this._id }
        },
        {
            $group: {
                _id: '$doctor',
                averageRating: { $avg: '$rating' },
                count: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        this.rating.average = Math.round(stats[0].averageRating * 10) / 10;
        this.rating.count = stats[0].count;
    } else {
        this.rating.average = 0;
        this.rating.count = 0;
    }

    await this.save();
};

const Doctor = User.discriminator('Doctor', doctorSchema);

module.exports = Doctor; 