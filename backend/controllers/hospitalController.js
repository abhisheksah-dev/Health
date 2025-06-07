const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// Create new hospital
exports.createHospital = catchAsync(async (req, res, next) => {
  // Check if user already has a hospital
  const existingHospital = await Hospital.findOne({ user: req.user.id });
  if (existingHospital) {
    return next(new AppError('User already has a hospital profile', 400));
  }

  // Create hospital
  const hospital = await Hospital.create({
    ...req.body,
    user: req.user.id
  });

  // Update user role if not already admin
  if (req.user.role !== 'admin') {
    await User.findByIdAndUpdate(req.user.id, { role: 'admin' });
  }

  res.status(201).json({
    status: 'success',
    data: {
      hospital
    }
  });
});

// Get hospital
exports.getHospital = catchAsync(async (req, res, next) => {
  const hospital = await Hospital.findById(req.params.id)
    .populate('user', 'name email phone avatar')
    .populate('departments.headDoctor', 'name specializations')
    .populate('doctors.doctor', 'name specializations rating');

  if (!hospital) {
    return next(new AppError('No hospital found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      hospital
    }
  });
});

// Get all hospitals
exports.getAllHospitals = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Hospital.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const hospitals = await features.query
    .populate('user', 'name email phone avatar')
    .populate('departments.headDoctor', 'name specializations');

  res.status(200).json({
    status: 'success',
    results: hospitals.length,
    data: {
      hospitals
    }
  });
});

// Update hospital
exports.updateHospital = catchAsync(async (req, res, next) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    return next(new AppError('No hospital found with that ID', 404));
  }

  // Check if user is authorized to update
  if (hospital.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this hospital', 403));
  }

  // Filter out restricted fields
  const filteredBody = filterObj(
    req.body,
    'name',
    'type',
    'registrationNumber',
    'establishedYear',
    'address',
    'contact',
    'departments',
    'insurance',
    'operatingHours',
    'emergencyServices',
    'images'
  );

  const updatedHospital = await Hospital.findByIdAndUpdate(
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
      hospital: updatedHospital
    }
  });
});

// Delete hospital
exports.deleteHospital = catchAsync(async (req, res, next) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    return next(new AppError('No hospital found with that ID', 404));
  }

  // Check if user is authorized to delete
  if (hospital.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this hospital', 403));
  }

  await hospital.remove();

  // Update user role if needed
  if (req.user.role === 'admin') {
    await User.findByIdAndUpdate(req.user.id, { role: 'patient' });
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Add department
exports.addDepartment = catchAsync(async (req, res, next) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    return next(new AppError('No hospital found with that ID', 404));
  }

  // Check if user is authorized
  if (hospital.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this hospital', 403));
  }

  const { name, description, headDoctor, services, facilities } = req.body;

  // Check if department already exists
  const existingDepartment = hospital.departments.find(
    d => d.name.toLowerCase() === name.toLowerCase()
  );

  if (existingDepartment) {
    return next(new AppError('Department already exists', 400));
  }

  // Verify head doctor if provided
  if (headDoctor) {
    const doctor = await Doctor.findById(headDoctor);
    if (!doctor) {
      return next(new AppError('Head doctor not found', 404));
    }
  }

  hospital.departments.push({
    name,
    description,
    headDoctor,
    services,
    facilities,
    isActive: true
  });

  await hospital.save();

  res.status(200).json({
    status: 'success',
    data: {
      departments: hospital.departments
    }
  });
});

// Update department
exports.updateDepartment = catchAsync(async (req, res, next) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    return next(new AppError('No hospital found with that ID', 404));
  }

  // Check if user is authorized
  if (hospital.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this hospital', 403));
  }

  const { departmentId } = req.params;
  const department = hospital.departments.id(departmentId);

  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  // Update department fields
  Object.assign(department, req.body);

  // Verify head doctor if updated
  if (req.body.headDoctor) {
    const doctor = await Doctor.findById(req.body.headDoctor);
    if (!doctor) {
      return next(new AppError('Head doctor not found', 404));
    }
  }

  await hospital.save();

  res.status(200).json({
    status: 'success',
    data: {
      department
    }
  });
});

// Remove department
exports.removeDepartment = catchAsync(async (req, res, next) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    return next(new AppError('No hospital found with that ID', 404));
  }

  // Check if user is authorized
  if (hospital.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this hospital', 403));
  }

  const { departmentId } = req.params;
  const department = hospital.departments.id(departmentId);

  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  department.isActive = false;
  await hospital.save();

  res.status(200).json({
    status: 'success',
    data: null
  });
});

// Add doctor to hospital
exports.addDoctor = catchAsync(async (req, res, next) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    return next(new AppError('No hospital found with that ID', 404));
  }

  // Check if user is authorized
  if (hospital.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this hospital', 403));
  }

  const { doctorId, departmentId, position, schedule } = req.body;

  // Verify doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  // Verify department exists
  const department = hospital.departments.id(departmentId);
  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  // Check if doctor is already added
  const existingDoctor = hospital.doctors.find(
    d => d.doctor.toString() === doctorId
  );

  if (existingDoctor) {
    return next(new AppError('Doctor already added to hospital', 400));
  }

  hospital.doctors.push({
    doctor: doctorId,
    department: departmentId,
    position,
    schedule,
    isActive: true,
    joinedAt: Date.now()
  });

  await hospital.save();

  res.status(200).json({
    status: 'success',
    data: {
      doctors: hospital.doctors
    }
  });
});

// Remove doctor from hospital
exports.removeDoctor = catchAsync(async (req, res, next) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    return next(new AppError('No hospital found with that ID', 404));
  }

  // Check if user is authorized
  if (hospital.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this hospital', 403));
  }

  const { doctorId } = req.params;
  const doctor = hospital.doctors.find(d => d.doctor.toString() === doctorId);

  if (!doctor) {
    return next(new AppError('Doctor not found in hospital', 404));
  }

  doctor.isActive = false;
  doctor.endDate = Date.now();
  await hospital.save();

  res.status(200).json({
    status: 'success',
    data: null
  });
});

// Update hospital rating
exports.updateRating = catchAsync(async (req, res, next) => {
  const { score, categories } = req.body;

  if (!score || !categories) {
    return next(new AppError('Please provide score and categories', 400));
  }

  const hospital = await Hospital.updateRating(req.params.id, { score, categories });

  res.status(200).json({
    status: 'success',
    data: {
      rating: hospital.rating
    }
  });
});

// Get hospitals by location
exports.getHospitalsByLocation = catchAsync(async (req, res, next) => {
  const { longitude, latitude, maxDistance } = req.query;

  if (!longitude || !latitude) {
    return next(new AppError('Please provide location coordinates', 400));
  }

  const hospitals = await Hospital.findByLocation(
    [parseFloat(longitude), parseFloat(latitude)],
    maxDistance ? parseInt(maxDistance) : undefined
  );

  res.status(200).json({
    status: 'success',
    results: hospitals.length,
    data: {
      hospitals
    }
  });
});

// Get hospitals by department
exports.getHospitalsByDepartment = catchAsync(async (req, res, next) => {
  const { department, city } = req.query;

  if (!department) {
    return next(new AppError('Please provide department name', 400));
  }

  const hospitals = await Hospital.findByDepartment(department, { city });

  res.status(200).json({
    status: 'success',
    results: hospitals.length,
    data: {
      hospitals
    }
  });
});

// Get hospitals by insurance
exports.getHospitalsByInsurance = catchAsync(async (req, res, next) => {
  const { provider, plan } = req.query;

  if (!provider) {
    return next(new AppError('Please provide insurance provider', 400));
  }

  const hospitals = await Hospital.findByInsurance(provider, { plan });

  res.status(200).json({
    status: 'success',
    results: hospitals.length,
    data: {
      hospitals
    }
  });
});

// Update hospital verification
exports.updateVerification = catchAsync(async (req, res, next) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    return next(new AppError('No hospital found with that ID', 404));
  }

  // Only admin can update verification
  if (req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update verification', 403));
  }

  const { status, documents } = req.body;

  hospital.verification.status = status;
  if (documents) {
    hospital.verification.documents = documents;
  }

  await hospital.save();

  res.status(200).json({
    status: 'success',
    data: {
      verification: hospital.verification
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