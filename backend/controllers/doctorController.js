const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Hospital = require('../models/Hospital');
const Clinic = require('../models/Clinic');
const {catchAsync} = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getDoctor = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate('user', 'name email phoneNumber avatar')
    .populate('facilities.id', 'name address');

  if (!doctor) {
    return next(new AppError('No doctor found with that ID', 404));
  }
  res.status(200).json({ status: 'success', data: { doctor } });
});

exports.getAllDoctors = catchAsync(async (req, res, next) => {
    let filter = { status: 'active', 'verification.status': 'verified' };

    if (req.query.search) {
        const userIds = await User.find({ name: { $regex: req.query.search, $options: 'i' }, role: 'doctor' }).select('_id');
        filter.user = { $in: userIds };
    }

    if (req.query.specialization) {
        filter['specializations.name'] = { $regex: req.query.specialization, $options: 'i' };
    }
    
  const features = new APIFeatures(Doctor.find(filter), req.query).sort().limitFields().paginate();

  const doctors = await features.query
    .populate('user', 'name email phone avatar')
    .populate('facilities.id', 'name address');

  res.status(200).json({ status: 'success', results: doctors.length, data: { doctors } });
});

exports.getDoctorDashboardStats = catchAsync(async (req, res, next) => {
    const doctorProfile = await Doctor.findOne({ user: req.user.id });
    if (!doctorProfile) {
        return next(new AppError('Doctor profile not found for the current user.', 404));
    }

    const stats = await Appointment.aggregate([
        { $match: { doctor: doctorProfile._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $group: { _id: null, statusCounts: { $push: { status: '$_id', count: '$count' } }, totalAppointments: { $sum: '$count' } } },
        { $project: { _id: 0, totalAppointments: 1, statusCounts: { $arrayToObject: { $map: { input: '$statusCounts', as: 'status', in: { k: '$$status.status', v: '$$status.count' } } } } } }
    ]);

    const upcomingAppointments = await Appointment.find({
        doctor: doctorProfile._id,
        date: { $gte: new Date() },
        status: 'confirmed'
    }).sort('date').limit(5).populate('patient', 'name');

    const result = stats[0] || { totalAppointments: 0, statusCounts: {} };
    const total = result.totalAppointments || 0;
    const completed = result.statusCounts.completed || 0;
    result.completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
    
    res.status(200).json({ status: 'success', data: { stats: result, upcomingAppointments } });
});

exports.updateDoctor = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user.id });
  if (!doctor) {
    return next(new AppError('No doctor profile found for this user', 404));
  }

  const filteredBody = filterObj(
    req.body, 'specializations', 'qualifications', 'experience', 'schedule', 
    'consultationFee', 'currency', 'languages', 'about', 'services', 'availability'
  );

  const updatedDoctor = await Doctor.findByIdAndUpdate(doctor._id, filteredBody, {
    new: true, runValidators: true
  }).populate('user', 'name email phone avatar');

  res.status(200).json({ status: 'success', data: { doctor: updatedDoctor } });
});

exports.updateSchedule = catchAsync(async (req, res, next) => {
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor) {
        return next(new AppError('Doctor profile not found', 404));
    }
    doctor.schedule = req.body.schedule;
    await doctor.save();
    res.status(200).json({ status: 'success', data: { schedule: doctor.schedule } });
});