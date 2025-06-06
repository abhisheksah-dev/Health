const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Appointment must belong to a patient']
    },
    doctor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Doctor',
        required: [true, 'Appointment must belong to a doctor']
    },
    date: {
        type: Date,
        required: [true, 'Please provide appointment date']
    },
    startTime: {
        type: String,
        required: [true, 'Please provide appointment start time'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
    },
    endTime: {
        type: String,
        required: [true, 'Please provide appointment end time'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
    },
    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
        default: 'scheduled'
    },
    type: {
        type: String,
        enum: ['consultation', 'follow-up', 'emergency', 'routine-checkup'],
        required: [true, 'Please specify appointment type']
    },
    reason: {
        type: String,
        required: [true, 'Please provide reason for appointment']
    },
    notes: {
        type: String
    },
    symptoms: [{
        type: String
    }],
    diagnosis: {
        type: String
    },
    prescription: {
        type: String
    },
    followUpDate: {
        type: Date
    },
    cancellationReason: {
        type: String
    },
    cancelledBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
appointmentSchema.index({ patient: 1, date: 1 });
appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ status: 1 });

// Virtual populate for reviews
appointmentSchema.virtual('review', {
    ref: 'Review',
    foreignField: 'appointment',
    localField: '_id',
    justOne: true
});

// Pre-save middleware to validate appointment time
appointmentSchema.pre('save', function(next) {
    if (this.isModified('startTime') || this.isModified('endTime')) {
        const start = new Date(`1970-01-01T${this.startTime}:00Z`);
        const end = new Date(`1970-01-01T${this.endTime}:00Z`);
        
        if (end <= start) {
            return next(new Error('End time must be after start time'));
        }
    }
    next();
});

// Static method to find available slots
appointmentSchema.statics.findAvailableSlots = async function(doctorId, date) {
    const targetDate = new Date(date);
    const appointments = await this.find({
        doctor: doctorId,
        date: {
            $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
            $lt: new Date(new Date(date).setHours(23, 59, 59, 999))
        },
        status: { $in: ['scheduled', 'confirmed'] }
    });

    const doctor = await mongoose.model('Doctor').findById(doctorId);
    if (!doctor || !doctor.availability) return [];
    
    // ** THE FIX IS HERE **
    // Correctly get the day of the week as a lowercase string (e.g., 'monday')
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const dayAvailability = doctor.availability.find(a => a.day === dayOfWeek);

    if (!dayAvailability || !dayAvailability.slots) {
        return [];
    }

    const bookedSlots = appointments.map(apt => ({
        start: apt.startTime,
        end: apt.endTime
    }));

    const availableSlots = dayAvailability.slots.filter(slot => {
        if (!slot.isAvailable) return false;

        const slotStart = new Date(`1970-01-01T${slot.startTime}:00Z`);
        const slotEnd = new Date(`1970-01-01T${slot.endTime}:00Z`);

        const isOverlapping = bookedSlots.some(booked => {
            const bookedStart = new Date(`1970-01-01T${booked.start}:00Z`);
            const bookedEnd = new Date(`1970-01-01T${booked.end}:00Z`);
            
            return slotStart < bookedEnd && slotEnd > bookedStart;
        });

        return !isOverlapping;
    });

    return availableSlots;
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;