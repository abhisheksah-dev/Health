const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Clinic = require('../models/Clinic');
const {catchAsync} = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// Create new doctor profile
exports.createDoctor = catchAsync(async (req, res, next) => {
  // Check if user already has a doctor profile
  const existingDoctor = await Doctor.findOne({ user: req.user.id });
  if (existingDoctor) {
    return next(new AppError('User already has a doctor profile', 400));
  }

  // Create doctor profile
  const doctor = await Doctor.create({
    ...req.body,
    user: req.user.id
  });

  // Update user role if not already a doctor
  if (req.user.role !== 'doctor') {
    await User.findByIdAndUpdate(req.user.id, { role: 'doctor' });
  }

  res.status(201).json({
    status: 'success',
    data: {
      doctor
    }
  });
});

// Get doctor profile
exports.getDoctor = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate('user', 'name email phone avatar')
    .populate('facilities.id', 'name address');

  if (!doctor) {
    return next(new AppError('No doctor found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      doctor
    }
  });
});

// Get all doctors
exports.getAllDoctors = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Doctor.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const doctors = await features.query
    .populate('user', 'name email phone avatar')
    .populate('facilities.id', 'name address');

  res.status(200).json({
    status: 'success',
    results: doctors.length,
    data: {
      doctors
    }
  });
});

// Update doctor profile
exports.updateDoctor = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    return next(new AppError('No doctor found with that ID', 404));
  }

  // Check if user is authorized to update
  if (doctor.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this profile', 403));
  }

  // Filter out restricted fields
  const filteredBody = filterObj(
    req.body,
    'specializations',
    'qualifications',
    'experience',
    'schedule',
    'consultationFee',
    'currency',
    'languages',
    'about',
    'services',
    'availability'
  );

  const updatedDoctor = await Doctor.findByIdAndUpdate(
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
      doctor: updatedDoctor
    }
  });
});

// Delete doctor profile
exports.deleteDoctor = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    return next(new AppError('No doctor found with that ID', 404));
  }

  // Check if user is authorized to delete
  if (doctor.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this profile', 403));
  }

  await doctor.remove();

  // Update user role if needed
  if (req.user.role === 'doctor') {
    await User.findByIdAndUpdate(req.user.id, { role: 'patient' });
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get doctor's availability
exports.getAvailability = catchAsync(async (req, res, next) => {
  const { facilityId, date } = req.query;

  if (!facilityId || !date) {
    return next(new AppError('Please provide facility ID and date', 400));
  }

  const availability = await Doctor.getAvailability(req.params.id, facilityId, date);

  res.status(200).json({
    status: 'success',
    data: {
      availability
    }
  });
});

// Update doctor's schedule
exports.updateSchedule = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    return next(new AppError('No doctor found with that ID', 404));
  }

  // Check if user is authorized to update
  if (doctor.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this schedule', 403));
  }

  doctor.schedule = req.body.schedule;
  await doctor.save();

  res.status(200).json({
    status: 'success',
    data: {
      schedule: doctor.schedule
    }
  });
});

// Add facility to doctor's profile
exports.addFacility = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    return next(new AppError('No doctor found with that ID', 404));
  }

  // Check if user is authorized to update
  if (doctor.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this profile', 403));
  }

  const { type, id } = req.body;

  // Check if facility exists
  let facility;
  if (type === 'hospital') {
    facility = await Hospital.findById(id);
  } else if (type === 'clinic') {
    facility = await Clinic.findById(id);
  } else {
    return next(new AppError('Invalid facility type', 400));
  }

  if (!facility) {
    return next(new AppError('Facility not found', 404));
  }

  // Check if facility is already added
  const existingFacility = doctor.facilities.find(
    f => f.type === type && f.id.toString() === id
  );

  if (existingFacility) {
    return next(new AppError('Facility already added to profile', 400));
  }

  doctor.facilities.push({
    type,
    id,
    isActive: true,
    joinedAt: Date.now()
  });

  await doctor.save();

  res.status(200).json({
    status: 'success',
    data: {
      facilities: doctor.facilities
    }
  });
});

// Remove facility from doctor's profile
exports.removeFacility = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    return next(new AppError('No doctor found with that ID', 404));
  }

  // Check if user is authorized to update
  if (doctor.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this profile', 403));
  }

  const { facilityId } = req.params;

  // Find and update facility
  const facility = doctor.facilities.find(f => f.id.toString() === facilityId);
  if (!facility) {
    return next(new AppError('Facility not found in doctor profile', 404));
  }

  facility.isActive = false;
  facility.endDate = Date.now();

  // Remove related schedules
  doctor.schedule = doctor.schedule.filter(
    s => s.facility.id.toString() !== facilityId
  );

  await doctor.save();

  res.status(200).json({
    status: 'success',
    data: {
      facilities: doctor.facilities
    }
  });
});

// Update doctor's rating
exports.updateRating = catchAsync(async (req, res, next) => {
  const { score, categories } = req.body;

  if (!score || !categories) {
    return next(new AppError('Please provide score and categories', 400));
  }

  const doctor = await Doctor.updateRating(req.params.id, { score, categories });

  res.status(200).json({
    status: 'success',
    data: {
      rating: doctor.rating
    }
  });
});

// Get doctors by specialization
exports.getDoctorsBySpecialization = catchAsync(async (req, res, next) => {
  const { specialization, city, facilityType } = req.query;

  if (!specialization) {
    return next(new AppError('Please provide specialization', 400));
  }

  const doctors = await Doctor.findBySpecialization(specialization, {
    city,
    facilityType
  });

  res.status(200).json({
    status: 'success',
    results: doctors.length,
    data: {
      doctors
    }
  });
});

// Get doctors by facility
exports.getDoctorsByFacility = catchAsync(async (req, res, next) => {
  const { facilityId, specialization } = req.query;

  if (!facilityId) {
    return next(new AppError('Please provide facility ID', 400));
  }

  const doctors = await Doctor.findByFacility(facilityId, { specialization });

  res.status(200).json({
    status: 'success',
    results: doctors.length,
    data: {
      doctors
    }
  });
});

// Helper function to filter object
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};