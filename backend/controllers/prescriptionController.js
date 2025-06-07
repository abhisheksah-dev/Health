const Prescription = require('../models/Prescription');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// Upload and analyze prescription
exports.uploadPrescription = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a prescription image', 400));
  }

  // Create prescription record without S3 for now
  const prescription = await Prescription.create({
    user: req.user.id,
    imageUrl: req.file.path, // Local file path
    status: 'pending',
    uploadedBy: req.user.id
  });

  res.status(201).json({
    status: 'success',
    data: {
      prescription
    }
  });
});

// Get all prescriptions for a user
exports.getUserPrescriptions = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Prescription.find({ user: req.user.id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const prescriptions = await features.query;

  res.status(200).json({
    status: 'success',
    results: prescriptions.length,
    data: {
      prescriptions
    }
  });
});

// Get single prescription
exports.getPrescription = catchAsync(async (req, res, next) => {
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    return next(new AppError('No prescription found with that ID', 404));
  }

  // Check if user is authorized to view
  if (prescription.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view this prescription', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      prescription
    }
  });
});

// Update prescription
exports.updatePrescription = catchAsync(async (req, res, next) => {
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    return next(new AppError('No prescription found with that ID', 404));
  }

  // Check if user is authorized to update
  if (prescription.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this prescription', 403));
  }

  // If new image is uploaded
  if (req.file) {
    prescription.imageUrl = req.file.path;
    prescription.status = 'pending';
    prescription.updatedAt = Date.now();
  } else {
    // Update other fields
    Object.assign(prescription, req.body);
  }

  await prescription.save();

  res.status(200).json({
    status: 'success',
    data: {
      prescription
    }
  });
});

// Delete prescription
exports.deletePrescription = catchAsync(async (req, res, next) => {
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    return next(new AppError('No prescription found with that ID', 404));
  }

  // Check if user is authorized to delete
  if (prescription.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this prescription', 403));
  }

  await prescription.remove();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get prescription statistics
exports.getPrescriptionStats = catchAsync(async (req, res, next) => {
  const stats = await Prescription.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
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

// Verify prescription analysis
exports.verifyAnalysis = catchAsync(async (req, res, next) => {
  const { verifiedMedications, notes } = req.body;
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    return next(new AppError('No prescription found with that ID', 404));
  }

  // Check if user is authorized to verify
  if (prescription.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to verify this prescription', 403));
  }

  prescription.verifiedMedications = verifiedMedications;
  prescription.verificationNotes = notes;
  prescription.status = 'verified';
  prescription.verifiedAt = Date.now();
  prescription.verifiedBy = req.user.id;

  await prescription.save();

  res.status(200).json({
    status: 'success',
    data: {
      prescription
    }
  });
});

// Get medication history
exports.getMedicationHistory = catchAsync(async (req, res, next) => {
  const prescriptions = await Prescription.find({
    user: req.user.id,
    status: 'verified'
  })
    .select('verifiedMedications createdAt')
    .sort('-createdAt');

  // Process medication history
  const medicationHistory = prescriptions.reduce((history, prescription) => {
    const medications = prescription.verifiedMedications || [];
    medications.forEach(med => {
      if (!history[med.name]) {
        history[med.name] = [];
      }
      history[med.name].push({
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        prescribedAt: prescription.createdAt
      });
    });
    return history;
  }, {});

  res.status(200).json({
    status: 'success',
    data: {
      medicationHistory
    }
  });
}); 