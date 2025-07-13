// ./controllers/appointmentController.js

const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const Hospital = require('../models/Hospital');
const {catchAsync} = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { sendAppointmentConfirmation } = require('../utils/email');
const { sendSMS } = require('../utils/sms');
const { uploadToS3 } = require('../utils/s3');

// Create new appointment
exports.createAppointment = catchAsync(async (req, res, next) => {
    const { doctor: doctorId, date, startTime, endTime, type, reason } = req.body;
    let { facility } = req.body;

    // A. Parse facility data since it comes as a string in multipart forms
    if (facility) {
      try {
          facility = JSON.parse(facility);
          if (!facility.type || !facility.id) {
              return next(new AppError('Facility object must include a valid type and id.', 400));
          }
      } catch (e) {
          return next(new AppError('Invalid facility data format. It must be a JSON string.', 400));
      }
    } else {
        return next(new AppError('Facility details are required.', 400));
    }

    // B. Check if the doctor exists
    const doctorDoc = await Doctor.findById(doctorId).populate('user');
    if (!doctorDoc) {
        return next(new AppError('Doctor not found with the provided ID.', 404));
    }

    // C. Check for time slot availability
    const isAvailable = await Appointment.checkAvailability(doctorId, facility.id, date, startTime, endTime);
    if (!isAvailable) {
        return next(new AppError('The selected time slot is not available.', 400));
    }

    // D. Handle file uploads
    let uploadedDocuments = [];
    if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map(file =>
            uploadToS3(file, `appointment-documents/${req.user.id}`)
        );
        const uploadResults = await Promise.all(uploadPromises);
        uploadedDocuments = uploadResults.map((result, index) => ({
            url: result.url,
            publicId: result.key,
            name: req.files[index].originalname,
            type: 'other', // Or derive from mimetype
            uploadedBy: req.user.id
        }));
    }

    // E. Create the appointment document
    const appointment = await Appointment.create({
        patient: req.user.id,
        doctor: doctorId,
        facility: { type: facility.type, id: facility.id },
        date,
        startTime,
        endTime,
        type,
        reason,
        documents: uploadedDocuments
    });

    // F. Send notifications
    const patientUser = await User.findById(req.user.id);
    const doctorUser = doctorDoc.user;

    const FacilityModel = facility.type === 'hospital' ? Hospital : Clinic;
    const facilityDoc = await FacilityModel.findById(facility.id).select('name address');
    const location = facilityDoc ? `${facilityDoc.name}, ${facilityDoc.address.city}` : 'Healthcare Facility';

    if (patientUser && doctorUser) {
        const appointmentDetails = {
            doctorName: doctorUser.name,
            date: appointment.date,
            time: appointment.startTime,
            location
        };

        sendAppointmentConfirmation(patientUser.email, appointmentDetails).catch(err => {
            console.error(`Failed to send appointment confirmation email to ${patientUser.email}:`, err);
        });

        if (patientUser.phoneNumber) {
            const smsMessage = `Your appointment with Dr. ${doctorUser.name} on ${new Date(appointment.date).toDateString()} at ${appointment.startTime} is scheduled.`;
            sendSMS(patientUser.phoneNumber, smsMessage).catch(err => {
                console.error(`Failed to send appointment SMS to ${patientUser.phoneNumber}:`, err);
            });
        }
    }

    res.status(201).json({
        status: 'success',
        data: {
            appointment
        }
    });
});

// Get a single appointment
exports.getAppointment = catchAsync(async (req, res, next) => {
    const appointment = await Appointment.findById(req.params.id)
        .populate('patient', 'name email')
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name specialization' } });

    if (!appointment) {
        return next(new AppError('No appointment found with that ID', 404));
    }

    if (appointment.patient._id.toString() !== req.user.id && appointment.doctor.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('You do not have permission to view this appointment.', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            appointment
        }
    });
});

// Get appointments for the logged-in user (patient or doctor)
exports.getUserAppointments = catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.user.role === 'patient') {
        filter.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
        const doctorProfile = await Doctor.findOne({ user: req.user.id });
        if (!doctorProfile) {
            return res.status(200).json({ status: 'success', results: 0, data: { appointments: [] } });
        }
        filter.doctor = doctorProfile._id;
    }

    const features = new APIFeatures(Appointment.find(filter), req.query)
        .filter().sort().limitFields().paginate();
    
    const appointments = await features.query.populate({ path: 'doctor', populate: { path: 'user', select: 'name' } }).populate('patient', 'name');

    res.status(200).json({
        status: 'success',
        results: appointments.length,
        data: {
            appointments
        }
    });
});

// Get all appointments (admin only)
exports.getAllAppointments = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Appointment.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const appointments = await features.query
        .populate('patient', 'name email')
        .populate({
            path: 'doctor',
            populate: { path: 'user', select: 'name' }
        });

    res.status(200).json({
        status: 'success',
        results: appointments.length,
        data: {
            appointments
        }
    });
});

// Update appointment status (for doctors/admins)
exports.updateAppointmentStatus = catchAsync(async (req, res, next) => {
    const { status, cancellationReason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        return next(new AppError('No appointment found with that ID', 404));
    }
    
    appointment.status = status;
    if (status === 'cancelled' && cancellationReason) {
        appointment.cancellation = { reason: cancellationReason, cancelledBy: req.user.id, cancelledAt: Date.now() };
    }
    
    await appointment.save();

    res.status(200).json({
        status: 'success',
        data: {
            appointment
        }
    });
});

// Cancel an appointment
exports.cancelAppointment = catchAsync(async (req, res, next) => {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        return next(new AppError('No appointment found with that ID', 404));
    }

    if (appointment.patient.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('You do not have permission to cancel this appointment.', 403));
    }

    appointment.status = 'cancelled';
    appointment.cancellation = { reason: req.body.reason || 'Cancelled by user', cancelledBy: req.user.id, cancelledAt: Date.now() };
    await appointment.save();

    res.status(200).json({
        status: 'success',
        data: { appointment }
    });
});

// Reschedule an appointment
exports.rescheduleAppointment = catchAsync(async (req, res, next) => {
    const { date, startTime, endTime } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
        req.params.id, 
        { date, startTime, endTime, status: 'pending' }, 
        { new: true, runValidators: true }
    );
    if (!appointment) {
        return next(new AppError('Appointment not found', 404));
    }
    res.status(200).json({
        status: 'success',
        data: { appointment }
    });
});

// Get available time slots
exports.getAvailableTimeSlots = catchAsync(async (req, res, next) => {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
        return next(new AppError('Doctor ID and date are required parameters.', 400));
    }

    // Stub implementation
    const availableSlots = [ '09:00', '10:00', '11:00', '14:00', '15:00', '16:00' ];
    
    res.status(200).json({
        status: 'success',
        data: {
            availableSlots
        }
    });
});

// Get appointment statistics
exports.getAppointmentStats = catchAsync(async (req, res, next) => {
    let match = {};
    if (req.user.role === 'doctor') {
        const doctorProfile = await Doctor.findOne({ user: req.user.id });
        if (!doctorProfile) return next(new AppError('Doctor profile not found.', 404));
        match.doctor = doctorProfile._id;
    }

    const stats = await Appointment.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $group: { _id: null, statusCounts: { $push: { status: '$_id', count: '$count' } }, totalAppointments: { $sum: '$count' } } },
        { $project: { _id: 0, totalAppointments: 1, statusCounts: { $arrayToObject: { $map: { input: '$statusCounts', as: 'status', in: { k: '$$status.status', v: '$$status.count' } } } } } }
    ]);

    const result = stats[0] || { totalAppointments: 0, statusCounts: {} };
    result.completionRate = result.totalAppointments > 0 ? ((result.statusCounts.completed || 0) / result.totalAppointments) * 100 : 0;

    res.status(200).json({
        status: 'success',
        data: result
    });
});