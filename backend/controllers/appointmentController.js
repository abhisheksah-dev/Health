const Appointment = require('../models/Appointment');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');

// Create new appointment
exports.createAppointment = catchAsync(async (req, res, next) => {
    const appointment = await Appointment.create({
        ...req.body,
        patient: req.user._id // Get patient ID from authenticated user
    });

    res.status(201).json({
        status: 'success',
        data: {
            appointment
        }
    });
});

// Get all appointments for a user (patient or doctor)
exports.getMyAppointments = catchAsync(async (req, res, next) => {
    const filter = req.user.role === 'doctor' 
        ? { doctor: req.user._id }
        : { patient: req.user._id };

    const appointments = await Appointment.find(filter)
        .populate('patient', 'name email phoneNumber')
        .populate('doctor', 'name specialization clinicDetails')
        .sort('-date -startTime');

    res.status(200).json({
        status: 'success',
        results: appointments.length,
        data: {
            appointments
        }
    });
});

// Get single appointment
exports.getAppointment = catchAsync(async (req, res, next) => {
    const appointment = await Appointment.findById(req.params.id)
        .populate('patient', 'name email phoneNumber')
        .populate('doctor', 'name specialization clinicDetails');

    if (!appointment) {
        return next(new AppError('No appointment found with that ID', 404));
    }

    if (req.user.role !== 'admin' && 
        appointment.patient._id.toString() !== req.user._id.toString() && 
        appointment.doctor._id.toString() !== req.user._id.toString()) {
        return next(new AppError('You do not have permission to view this appointment', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            appointment
        }
    });
});

// Update appointment status
exports.updateAppointmentStatus = catchAsync(async (req, res, next) => {
    const { status, cancellationReason } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        return next(new AppError('No appointment found with that ID', 404));
    }

    if (req.user.role !== 'admin' && 
        appointment.patient._id.toString() !== req.user._id.toString() && 
        appointment.doctor._id.toString() !== req.user._id.toString()) {
        return next(new AppError('You do not have permission to update this appointment', 403));
    }

    appointment.status = status;
    if (status === 'cancelled') {
        if (!cancellationReason) {
            return next(new AppError('Please provide a reason for cancellation.', 400));
        }
        appointment.cancellationReason = cancellationReason;
        appointment.cancelledBy = req.user._id;
    }

    await appointment.save();

    res.status(200).json({
        status: 'success',
        data: {
            appointment
        }
    });
});

// Update appointment details (doctor only)
exports.updateAppointmentDetails = catchAsync(async (req, res, next) => {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        return next(new AppError('No appointment found with that ID', 404));
    }

    if (appointment.doctor._id.toString() !== req.user._id.toString()) {
        return next(new AppError('Only the assigned doctor can update appointment details', 403));
    }

    const allowedUpdates = ['diagnosis', 'prescription', 'notes', 'followUpDate', 'symptoms'];
    Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
            appointment[key] = req.body[key];
        }
    });

    await appointment.save();

    res.status(200).json({
        status: 'success',
        data: {
            appointment
        }
    });
});

// Get available time slots for a doctor
exports.getAvailableSlots = catchAsync(async (req, res, next) => {
    // ** THE FIX IS HERE **
    // Use the validated and sanitized date from the request query.
    const { doctorId, date } = req.query;

    const availableSlots = await Appointment.findAvailableSlots(doctorId, date);

    res.status(200).json({
        status: 'success',
        data: {
            availableSlots
        }
    });
});

// Get appointment statistics
exports.getAppointmentStats = catchAsync(async (req, res, next) => {
    const stats = await Appointment.aggregate([
        {
            $match: {
                doctor: req.user._id,
                date: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } // last 30 days
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                status: '$_id',
                count: 1
            }
        }
    ]);

    const totalAppointments = stats.reduce((acc, curr) => acc + curr.count, 0);
    const statusCounts = stats.reduce((acc, curr) => {
        acc[curr.status] = curr.count;
        return acc;
    }, {});
    
    const completedCount = statusCounts.completed || 0;

    res.status(200).json({
        status: 'success',
        data: {
            totalAppointments,
            statusCounts,
            completionRate: totalAppointments > 0 ? 
                parseFloat(((completedCount / totalAppointments) * 100).toFixed(1)) : 0
        }
    });
});