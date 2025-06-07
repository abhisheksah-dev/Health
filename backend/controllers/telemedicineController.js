const Consultation = require('../models/Consultation');
const User = require('../models/User');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { sendNotification } = require('../utils/notifications');
const { generateMeetingLink } = require('../utils/videoConference');

// Create consultation request
exports.createConsultation = catchAsync(async (req, res, next) => {
  const { doctorId, symptoms, preferredTime, notes } = req.body;

  // Check if doctor exists and is available
  const doctor = await User.findOne({
    _id: doctorId,
    role: 'doctor',
    'availability.status': 'available'
  });

  if (!doctor) {
    return next(new AppError('Doctor not found or not available', 404));
  }

  // Create consultation
  const consultation = await Consultation.create({
    patient: req.user.id,
    doctor: doctorId,
    symptoms,
    preferredTime,
    notes,
    status: 'pending',
    createdBy: req.user.id
  });

  // Send notification to doctor
  await sendNotification({
    user: doctorId,
    title: 'New Consultation Request',
    message: `Patient ${req.user.name} has requested a consultation`,
    type: 'consultation_request',
    data: {
      consultationId: consultation._id,
      patientId: req.user.id,
      preferredTime
    }
  });

  res.status(201).json({
    status: 'success',
    data: {
      consultation
    }
  });
});

// Get all consultations for a user
exports.getUserConsultations = catchAsync(async (req, res, next) => {
  const query = req.user.role === 'doctor'
    ? { doctor: req.user.id }
    : { patient: req.user.id };

  const features = new APIFeatures(
    Consultation.find(query),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const consultations = await features.query
    .populate('patient', 'name email')
    .populate('doctor', 'name email specialization')
    .populate('createdBy', 'name');

  res.status(200).json({
    status: 'success',
    results: consultations.length,
    data: {
      consultations
    }
  });
});

// Get single consultation
exports.getConsultation = catchAsync(async (req, res, next) => {
  const consultation = await Consultation.findById(req.params.id)
    .populate('patient', 'name email')
    .populate('doctor', 'name email specialization')
    .populate('createdBy', 'name');

  if (!consultation) {
    return next(new AppError('No consultation found with that ID', 404));
  }

  // Check if user is authorized to view
  if (
    consultation.patient._id.toString() !== req.user.id &&
    consultation.doctor._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(new AppError('You are not authorized to view this consultation', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      consultation
    }
  });
});

// Update consultation status
exports.updateConsultationStatus = catchAsync(async (req, res, next) => {
  const { status, scheduledTime, notes } = req.body;
  const consultation = await Consultation.findById(req.params.id);

  if (!consultation) {
    return next(new AppError('No consultation found with that ID', 404));
  }

  // Check if user is authorized to update
  if (
    consultation.doctor._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(new AppError('Only the assigned doctor can update consultation status', 403));
  }

  // Generate meeting link if consultation is accepted
  if (status === 'accepted' && !consultation.meetingLink) {
    const meetingLink = await generateMeetingLink({
      consultationId: consultation._id,
      doctorId: consultation.doctor._id,
      patientId: consultation.patient._id,
      scheduledTime
    });

    consultation.meetingLink = meetingLink;
  }

  consultation.status = status;
  if (scheduledTime) consultation.scheduledTime = scheduledTime;
  if (notes) consultation.doctorNotes = notes;
  consultation.updatedAt = Date.now();
  consultation.updatedBy = req.user.id;

  await consultation.save();

  // Send notification to patient
  await sendNotification({
    user: consultation.patient._id,
    title: 'Consultation Status Updated',
    message: `Your consultation has been ${status}`,
    type: 'consultation_update',
    data: {
      consultationId: consultation._id,
      status,
      scheduledTime,
      meetingLink: consultation.meetingLink
    }
  });

  res.status(200).json({
    status: 'success',
    data: {
      consultation
    }
  });
});

// Add consultation notes
exports.addConsultationNotes = catchAsync(async (req, res, next) => {
  const { notes, prescription, followUpDate } = req.body;
  const consultation = await Consultation.findById(req.params.id);

  if (!consultation) {
    return next(new AppError('No consultation found with that ID', 404));
  }

  // Check if user is authorized to add notes
  if (
    consultation.doctor._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(new AppError('Only the assigned doctor can add consultation notes', 403));
  }

  // Check if consultation is completed
  if (consultation.status !== 'completed') {
    return next(new AppError('Can only add notes to completed consultations', 400));
  }

  consultation.consultationNotes = notes;
  consultation.prescription = prescription;
  consultation.followUpDate = followUpDate;
  consultation.updatedAt = Date.now();
  consultation.updatedBy = req.user.id;

  await consultation.save();

  // Send notification to patient
  await sendNotification({
    user: consultation.patient._id,
    title: 'Consultation Notes Added',
    message: 'Your doctor has added notes to your consultation',
    type: 'consultation_notes',
    data: {
      consultationId: consultation._id,
      hasPrescription: !!prescription,
      followUpDate
    }
  });

  res.status(200).json({
    status: 'success',
    data: {
      consultation
    }
  });
});

// Get doctor availability
exports.getDoctorAvailability = catchAsync(async (req, res, next) => {
  const doctor = await User.findById(req.params.doctorId)
    .select('availability');

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      availability: doctor.availability
    }
  });
});

// Update doctor availability
exports.updateDoctorAvailability = catchAsync(async (req, res, next) => {
  const doctor = await User.findById(req.user.id);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  doctor.availability = req.body.availability;
  await doctor.save();

  res.status(200).json({
    status: 'success',
    data: {
      availability: doctor.availability
    }
  });
});

// Get consultation statistics
exports.getConsultationStats = catchAsync(async (req, res, next) => {
  const stats = await Consultation.aggregate([
    {
      $group: {
        _id: {
          status: '$status',
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        count: { $sum: 1 },
        averageDuration: {
          $avg: {
            $subtract: ['$updatedAt', '$createdAt']
          }
        }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
}); 