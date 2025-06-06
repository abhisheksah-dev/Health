const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a patient']
    },
    doctor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Doctor',
        required: [true, 'Review must be for a doctor']
    },
    appointment: {
        type: mongoose.Schema.ObjectId,
        ref: 'Appointment',
        required: [true, 'Review must be associated with an appointment']
    },
    rating: {
        type: Number,
        required: [true, 'Please provide a rating'],
        min: 1,
        max: 5
    },
    review: {
        type: String,
        required: [true, 'Please provide a review'],
        trim: true,
        maxlength: [500, 'Review cannot be more than 500 characters']
    },
    categories: [{
        type: String,
        enum: ['professionalism', 'communication', 'punctuality', 'treatment', 'facility', 'staff', 'value']
    }],
    categoryRatings: {
        professionalism: {
            type: Number,
            min: 1,
            max: 5
        },
        communication: {
            type: Number,
            min: 1,
            max: 5
        },
        punctuality: {
            type: Number,
            min: 1,
            max: 5
        },
        treatment: {
            type: Number,
            min: 1,
            max: 5
        },
        facility: {
            type: Number,
            min: 1,
            max: 5
        },
        staff: {
            type: Number,
            min: 1,
            max: 5
        },
        value: {
            type: Number,
            min: 1,
            max: 5
        }
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    doctorResponse: {
        response: String,
        respondedAt: Date
    },
    helpfulVotes: {
        count: {
            type: Number,
            default: 0
        },
        voters: [{
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }]
    },
    reportCount: {
        type: Number,
        default: 0
    },
    reports: [{
        reportedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        reason: {
            type: String,
            enum: ['inappropriate', 'fake', 'spam', 'other']
        },
        details: String,
        reportedAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'hidden'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
reviewSchema.index({ doctor: 1, createdAt: -1 });
reviewSchema.index({ patient: 1, doctor: 1 }, { unique: true });
reviewSchema.index({ appointment: 1 }, { unique: true });
reviewSchema.index({ rating: 1 });

// Prevent duplicate reviews for the same appointment
reviewSchema.pre('save', async function(next) {
    if (this.isNew) {
        const existingReview = await this.constructor.findOne({
            appointment: this.appointment
        });
        if (existingReview) {
            next(new Error('Review already exists for this appointment'));
        }
    }
    next();
});

// Update doctor's average rating after review
reviewSchema.post('save', async function() {
    const stats = await this.constructor.aggregate([
        {
            $match: { 
                doctor: this.doctor,
                status: 'approved'
            }
        },
        {
            $group: {
                _id: '$doctor',
                averageRating: { $avg: '$rating' },
                count: { $sum: 1 },
                professionalism: { $avg: '$categoryRatings.professionalism' },
                communication: { $avg: '$categoryRatings.communication' },
                punctuality: { $avg: '$categoryRatings.punctuality' },
                treatment: { $avg: '$categoryRatings.treatment' },
                facility: { $avg: '$categoryRatings.facility' },
                staff: { $avg: '$categoryRatings.staff' },
                value: { $avg: '$categoryRatings.value' }
            }
        }
    ]);

    if (stats.length > 0) {
        await this.model('Doctor').findByIdAndUpdate(this.doctor, {
            'rating.average': Math.round(stats[0].averageRating * 10) / 10,
            'rating.count': stats[0].count,
            'rating.categories': {
                professionalism: Math.round(stats[0].professionalism * 10) / 10,
                communication: Math.round(stats[0].communication * 10) / 10,
                punctuality: Math.round(stats[0].punctuality * 10) / 10,
                treatment: Math.round(stats[0].treatment * 10) / 10,
                facility: Math.round(stats[0].facility * 10) / 10,
                staff: Math.round(stats[0].staff * 10) / 10,
                value: Math.round(stats[0].value * 10) / 10
            }
        });
    }
});

// Static method to get doctor's reviews with filters
reviewSchema.statics.getDoctorReviews = async function(doctorId, options = {}) {
    const query = this.find({ 
        doctor: doctorId,
        status: 'approved'
    })
    .populate('patient', 'name profilePicture')
    .populate('appointment', 'date type')
    .sort({ createdAt: -1 });

    if (options.rating) {
        query.where('rating').equals(options.rating);
    }

    if (options.category) {
        query.where(`categoryRatings.${options.category}`).exists();
    }

    if (options.startDate && options.endDate) {
        query.where('createdAt').gte(options.startDate).lte(options.endDate);
    }

    const page = options.page * 1 || 1;
    const limit = options.limit * 1 || 10;
    const skip = (page - 1) * limit;

    query.skip(skip).limit(limit);

    const reviews = await query;
    const total = await this.countDocuments({ doctor: doctorId, status: 'approved' });

    return {
        reviews,
        total,
        page,
        pages: Math.ceil(total / limit)
    };
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 