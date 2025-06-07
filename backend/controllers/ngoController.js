const NGO = require('../models/NGO');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.createProfile = catchAsync(async (req, res, next) => {
  const profile = await NGO.create({
    ...req.body,
    user: req.user.id
  });

  res.status(201).json({
    status: 'success',
    data: {
      profile
    }
  });
});

exports.getProfile = catchAsync(async (req, res, next) => {
  const profile = await NGO.findById(req.params.id)
    .populate('user', 'name email phone');

  if (!profile) {
    return next(new AppError('No NGO profile found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      profile
    }
  });
});

exports.getAllNGOs = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    NGO.find({ isVerified: true, isActive: true }),
    req.query
  ).filter().sort().limitFields().paginate();

  const ngos = await features.query.populate('user', 'name email');

  res.status(200).json({
    status: 'success',
    results: ngos.length,
    data: {
      ngos
    }
  });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  const profile = await NGO.findById(req.params.id);

  if (!profile) {
    return next(new AppError('No NGO profile found with that ID', 404));
  }

  if (profile.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this profile', 403));
  }

  const updatedProfile = await NGO.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('user', 'name');

  res.status(200).json({
    status: 'success',
    data: {
      profile: updatedProfile
    }
  });
});

exports.deleteProfile = catchAsync(async (req, res, next) => {
  const profile = await NGO.findById(req.params.id);

  if (!profile) {
    return next(new AppError('No NGO profile found with that ID', 404));
  }

  if (profile.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this profile', 403));
  }

  await profile.deleteOne();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.findNearestNGOs = catchAsync(async (req, res, next) => {
  const { longitude, latitude, maxDistance } = req.query;

  if (!longitude || !latitude) {
    return next(new AppError('Please provide location coordinates', 400));
  }

  const ngos = await NGO.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        $maxDistance: parseInt(maxDistance) || 50000 // 50km default
      }
    },
    isVerified: true,
    isActive: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      ngos
    }
  });
});

exports.verifyNGO = catchAsync(async (req, res, next) => {
  const profile = await NGO.findByIdAndUpdate(
    req.params.id,
    { isVerified: true },
    { new: true }
  );

  if (!profile) {
    return next(new AppError('No NGO profile found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      profile
    }
  });
});

exports.getNGOStats = catchAsync(async (req, res, next) => {
  const stats = await NGO.aggregate([
    {
      $unwind: "$focusAreas"
    },
    {
      $group: {
        _id: '$focusAreas',
        count: { $sum: 1 },
        totalBeneficiaries: { $sum: '$beneficiariesCount' }
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

exports.updateStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const profile = await NGO.findById(req.params.id);

  if (!profile) {
    return next(new AppError('No NGO profile found with that ID', 404));
  }

  if (profile.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this profile status', 403));
  }

  profile.status = status;
  await profile.save();

  res.status(200).json({
    status: 'success',
    data: {
      profile
    }
  });
});