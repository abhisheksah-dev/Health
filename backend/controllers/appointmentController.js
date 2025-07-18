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
    const { doctor: doctorId, date, startTime, type, reason } = req.body;
    let { facility } = req.body;

    // A. Check for facility data
    if (!facility || !facility.type || !facility.id) {
        return next(new AppError('Facility object must include a valid type and id.', 400));
    }
    
    // B. Check if the doctor exists
    const doctorDoc = await Doctor.findById(doctorId).populate('user');
    if (!doctorDoc) {
        return next(new AppError('Doctor not found with the provided ID.', 404));
    }

    // C. Calculate endTime based on doctor's schedule or a default
    // This logic assumes doctor's schedule has slotDuration. A default of 30 mins is used otherwise.
    const schedule = doctorDoc.schedule.find(s => s.facility.id.toString() === facility.id && s.dayOfWeek === new Date(date).getDay());
    const slotDuration = schedule ? schedule.slotDuration : 30; // Default to 30 minutes if not found
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const endTimeDate = new Date();
    endTimeDate.setHours(startHour, startMinute + slotDuration, 0, 0);
    const endTime = endTimeDate.toTimeString().slice(0, 5);


    // D. Check for time slot availability
    const isAvailable = await Appointment.checkAvailability(doctorId, facility.id, date, startTime, endTime);
    if (!isAvailable) {
        return next(new AppError('The selected time slot is not available.', 400));
    }

    // E. Handle file uploads
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

    // F. Create the appointment document
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

    // G. Send notifications
    const patientUser = await User.findById(req.user.id);
    const doctorUser = doctorDoc.user;

    const FacilityModel = facility.type === 'hospital' ? Hospital : Clinic;
    const facilityDoc = await FacilityModel.findById(facility.id).select('name address');
    const location = facilityDoc ? `${facilityDoc.name}, ${facilityDoc.address.city}` : 'Healthcare Facility';

    if (patientUser && doctorUser) {
        const appointmentDetails = {
            doctorName: `Dr. ${doctorUser.name}`,
            patientName: patientUser.name,
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
    
    // Corrected Authorization: Fetch doctor's user ID for comparison
    const doctorUserId = appointment.doctor.user._id.toString();

    if (appointment.patient._id.toString() !== req.user.id && doctorUserId !== req.user.id && req.user.role !== 'admin') {
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
    } else { // Admin case
      // No filter needed, will get all
    }

    const features = new APIFeatures(Appointment.find(filter), req.query)
        .filter().sort().limitFields().paginate();
    
    const appointments = await features.query
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
        .populate('patient', 'name')
        .populate('facility.id', 'name');


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
    const appointment = await Appointment.findById(req.params.id).populate({path: 'doctor', select: 'user'});

    if (!appointment) {
        return next(new AppError('No appointment found with that ID', 404));
    }
    
    // Authorization check
    if(req.user.id.toString() !== appointment.doctor.user.toString() && req.user.role !== 'admin') {
        return next(new AppError('You do not have permission to update this appointment status.', 403));
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

    // Allow patient, relevant doctor, or admin to cancel
    const doctorProfile = await Doctor.findById(appointment.doctor);
    if (!doctorProfile) {
        return next(new AppError('Doctor associated with appointment not found.', 404));
    }

    if (appointment.patient.toString() !== req.user.id && doctorProfile.user.toString() !== req.user.id && req.user.role !== 'admin') {
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
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        return next(new AppError('Appointment not found', 404));
    }

    if (appointment.patient.toString() !== req.user.id && req.user.role !== 'admin') {
         return next(new AppError('You do not have permission to reschedule this appointment.', 403));
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
        req.params.id, 
        { date, startTime, endTime, status: 'pending' }, 
        { new: true, runValidators: true }
    );
    
    res.status(200).json({
        status: 'success',
        data: { appointment: updatedAppointment }
    });
});

// Get available time slots (Implemented)
exports.getAvailableTimeSlots = catchAsync(async (req, res, next) => {
    const { doctorId, date, facilityId } = req.query;
    if (!doctorId || !date || !facilityId) {
        return next(new AppError('Doctor ID, facility ID, and date are required parameters.', 400));
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
        return next(new AppError('Doctor not found', 404));
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    const schedule = doctor.schedule.find(s => s.facility.id.toString() === facilityId && s.dayOfWeek === dayOfWeek && s.isActive);

    if (!schedule) {
        return res.status(200).json({
            status: 'success',
            data: { availableSlots: [] }
        });
    }

    const bookedAppointments = await Appointment.find({
        doctor: doctorId,
        'facility.id': facilityId,
        date: appointmentDate,
        status: { $in: ['pending', 'confirmed'] }
    }).select('startTime endTime');

    const availableSlots = [];
    const { startTime, endTime, slotDuration, breakStart, breakEnd } = schedule;

    let currentSlot = new Date(`${date}T${startTime}`);
    const endOfDay = new Date(`${date}T${endTime}`);
    const breakStartTime = breakStart ? new Date(`${date}T${breakStart}`) : null;
    const breakEndTime = breakEnd ? new Date(`${date}T${breakEnd}`) : null;

    while (currentSlot < endOfDay) {
        const slotEnd = new Date(currentSlot.getTime() + slotDuration * 60000);
        const currentTimeString = currentSlot.toTimeString().slice(0, 5);

        const isDuringBreak = breakStartTime && breakEndTime && currentSlot >= breakStartTime && currentSlot < breakEndTime;
        
        const isBooked = bookedAppointments.some(appt => {
            const apptStart = new Date(`${date}T${appt.startTime}`);
            const apptEnd = new Date(`${date}T${appt.endTime}`);
            return currentSlot < apptEnd && slotEnd > apptStart;
        });

        if (!isDuringBreak && !isBooked) {
            availableSlots.push(currentTimeString);
        }

        currentSlot = slotEnd;
    }

    res.status(200).json({
        status: 'success',
        data: { availableSlots }
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
    const totalAppointments = result.totalAppointments || 0;
    const completedAppointments = result.statusCounts.completed || 0;
    
    result.completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

    res.status(200).json({
        status: 'success',
        data: result
    });
});