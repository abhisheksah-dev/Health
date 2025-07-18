const Clinic = require('../models/Clinic');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { catchAsync } = require('../utils/catchAsync'); // Corrected import
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// Helper function to filter object keys
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Create new clinic
exports.createClinic = catchAsync(async (req, res, next) => {
  const existingClinic = await Clinic.findOne({ user: req.user.id });
  if (existingClinic) {
    return next(new AppError('User already has a clinic profile', 400));
  }

  const clinic = await Clinic.create({
    ...req.body,
    user: req.user.id
  });

  if (req.user.role !== 'admin') {
    await User.findByIdAndUpdate(req.user.id, { role: 'admin' });
  }

  res.status(201).json({
    status: 'success',
    data: {
      clinic
    }
  });
});

// Get clinic
exports.getClinic = catchAsync(async (req, res, next) => {
  const clinic = await Clinic.findById(req.params.id)
    .populate('user', 'name email phone avatar')
    .populate('doctors.doctor', 'name specializations rating');

  if (!clinic) {
    return next(new AppError('No clinic found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      clinic
    }
  });
});

// Get all clinics
exports.getAllClinics = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Clinic.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const clinics = await features.query
    .populate('user', 'name email phone avatar')
    .populate('doctors.doctor', 'name specializations');

  res.status(200).json({
    status: 'success',
    results: clinics.length,
    data: {
      clinics
    }
  });
});

// Update clinic
exports.updateClinic = catchAsync(async (req, res, next) => {
  const clinic = await Clinic.findById(req.params.id);

  if (!clinic) {
    return next(new AppError('No clinic found with that ID', 404));
  }

  if (clinic.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this clinic', 403));
  }

  const filteredBody = filterObj(
    req.body,
    'name',
    'type',
    'registrationNumber',
    'establishedYear',
    'address',
    'contact',
    'specializations',
    'services',
    'insurance',
    'operatingHours',
    'images'
  );

  const updatedClinic = await Clinic.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      new: true,
      runValidators: true
    }
  ).populate('user', 'name email phone avatar');

  res.status(200).json({
    status: 'success',
    data: {
      clinic: updatedClinic
    }
  });
});

// Delete clinic
exports.deleteClinic = catchAsync(async (req, res, next) => {
  const clinic = await Clinic.findById(req.params.id);

  if (!clinic) {
    return next(new AppError('No clinic found with that ID', 404));
  }

  if (clinic.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this clinic', 403));
  }

  await clinic.remove();

  if (req.user.role === 'admin') {
    await User.findByIdAndUpdate(req.user.id, { role: 'patient' });
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Add doctor to clinic
exports.addDoctor = catchAsync(async (req, res, next) => {
  const clinic = await Clinic.findById(req.params.id);

  if (!clinic) {
    return next(new AppError('No clinic found with that ID', 404));
  }

  if (clinic.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this clinic', 403));
  }

  const { doctorId, position, schedule } = req.body;

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  const existingDoctor = clinic.doctors.find(
    d => d.doctor.toString() === doctorId
  );

  if (existingDoctor) {
    return next(new AppError('Doctor already added to clinic', 400));
  }

  clinic.doctors.push({
    doctor: doctorId,
    position,
    schedule,
    isActive: true,
    joinedAt: Date.now()
  });

  await clinic.save();

  res.status(200).json({
    status: 'success',
    data: {
      doctors: clinic.doctors
    }
  });
});

// Remove doctor from clinic
exports.removeDoctor = catchAsync(async (req, res, next) => {
  const clinic = await Clinic.findById(req.params.id);

  if (!clinic) {
    return next(new AppError('No clinic found with that ID', 404));
  }

  if (clinic.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this clinic', 403));
  }

  const { doctorId } = req.params;
  const doctor = clinic.doctors.find(d => d.doctor.toString() === doctorId);

  if (!doctor) {
    return next(new AppError('Doctor not found in clinic', 404));
  }

  doctor.isActive = false;
  doctor.endDate = Date.now();
  await clinic.save();

  res.status(200).json({
    status: 'success',
    data: null
  });
});

// Update clinic rating
exports.updateRating = catchAsync(async (req, res, next) => {
  const { score, categories } = req.body;

  if (!score || !categories) {
    return next(new AppError('Please provide score and categories', 400));
  }

  const clinic = await Clinic.updateRating(req.params.id, { score, categories });

  res.status(200).json({
    status: 'success',
    data: {
      rating: clinic.rating
    }
  });
});

// Get clinics by location
exports.getClinicsByLocation = catchAsync(async (req, res, next) => {
  const { longitude, latitude, maxDistance } = req.query;

  if (!longitude || !latitude) {
    return next(new AppError('Please provide location coordinates', 400));
  }

  const clinics = await Clinic.findByLocation(
    [parseFloat(longitude), parseFloat(latitude)],
    maxDistance ? parseInt(maxDistance) : undefined
  );

  res.status(200).json({
    status: 'success',
    results: clinics.length,
    data: {
      clinics
    }
  });
});

// Get clinics by specialization
exports.getClinicsBySpecialization = catchAsync(async (req, res, next) => {
  const { specialization, city } = req.query;

  if (!specialization) {
    return next(new AppError('Please provide specialization', 400));
  }

  const clinics = await Clinic.findBySpecialization(specialization, { city });

  res.status(200).json({
    status: 'success',
    results: clinics.length,
    data: {
      clinics
    }
  });
});

// Get clinics by insurance
exports.getClinicsByInsurance = catchAsync(async (req, res, next) => {
  const { provider, plan } = req.query;

  if (!provider) {
    return next(new AppError('Please provide insurance provider', 400));
  }

  const clinics = await Clinic.findByInsurance(provider, { plan });

  res.status(200).json({
    status: 'success',
    results: clinics.length,
    data: {
      clinics
    }
  });
});

// Update clinic verification
exports.updateVerification = catchAsync(async (req, res, next) => {
  const clinic = await Clinic.findById(req.params.id);

  if (!clinic) {
    return next(new AppError('No clinic found with that ID', 404));
  }

  if (req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update verification', 403));
  }

  const { status, documents } = req.body;

  clinic.verification.status = status;
  if (documents) {
    clinic.verification.documents = documents;
  }

  await clinic.save();

  res.status(200).json({
    status: 'success',
    data: {
      verification: clinic.verification
    }
  });
});