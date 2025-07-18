const MentalHealthProfessional = require('../models/MentalHealthProfessional');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.createProfile = catchAsync(async (req, res, next) => {
  const profileData = { ...req.body, userId: req.user.id };
  
  const existingProfile = await MentalHealthProfessional.findOne({ userId: req.user.id });
  if (existingProfile) {
    return next(new AppError('This user already has a professional profile.', 400));
  }
  
  const profile = await MentalHealthProfessional.create(profileData);

  res.status(201).json({
    status: 'success',
    data: {
      profile
    }
  });
});

exports.getProfile = catchAsync(async (req, res, next) => {
  const profile = await MentalHealthProfessional.findById(req.params.id)
    .populate('userId', 'name email avatar');

  if (!profile) {
    return next(new AppError('No profile found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      profile
    }
  });
});

exports.getAllProfessionals = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    MentalHealthProfessional.find({ status: 'active' }),
    req.query
  ).filter().sort().limitFields().paginate();

  const professionals = await features.query.populate('userId', 'name');

  res.status(200).json({
    status: 'success',
    results: professionals.length,
    data: {
      professionals
    }
  });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  const profile = await MentalHealthProfessional.findById(req.params.id);

  if (!profile) {
    return next(new AppError('No profile found with that ID', 404));
  }

  if (profile.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this profile', 403));
  }

  const updatedProfile = await MentalHealthProfessional.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('userId', 'name');

  res.status(200).json({
    status: 'success',
    data: {
      profile: updatedProfile
    }
  });
});

exports.deleteProfile = catchAsync(async (req, res, next) => {
  const profile = await MentalHealthProfessional.findById(req.params.id);

  if (!profile) {
    return next(new AppError('No profile found with that ID', 404));
  }

  if (profile.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this profile', 403));
  }

  await profile.deleteOne();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.findNearestProfessionals = catchAsync(async (req, res, next) => {
  const { longitude, latitude, maxDistance } = req.query;

  if (!longitude || !latitude) {
    return next(new AppError('Please provide location coordinates', 400));
  }

  const professionals = await MentalHealthProfessional.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        $maxDistance: parseInt(maxDistance) || 50000 // 50km default
      }
    },
    status: 'active'
  });

  res.status(200).json({
    status: 'success',
    data: {
      professionals
    }
  });
});

exports.verifyProfessional = catchAsync(async (req, res, next) => {
  const profile = await MentalHealthProfessional.findById(req.params.id);

  if (!profile) {
    return next(new AppError('No profile found with that ID', 404));
  }

  // This functionality should ideally be more robust, e.g. setting a verified status field
  // For now, we assume this is just a placeholder.
  
  res.status(200).json({
    status: 'success',
    message: 'Verification logic not implemented in this stub.',
    data: {
      profile
    }
  });
});

exports.getProfessionalStats = catchAsync(async (req, res, next) => {
  const stats = await MentalHealthProfessional.aggregate([
    {
        $unwind: "$specialization"
    },
    {
      $group: {
        _id: '$specialization',
        count: { $sum: 1 },
        averageExperience: { $avg: '$experience.years' }
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