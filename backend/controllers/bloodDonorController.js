const BloodDonor = require('../models/BloodDonor');
const {catchAsync} = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// Register as blood donor
exports.registerDonor = catchAsync(async (req, res, next) => {
  // Check if user is already registered
  const existingDonor = await BloodDonor.findOne({ user: req.user.id });
  if (existingDonor) {
    return next(new AppError('You are already registered as a blood donor', 400));
  }

  const donor = await BloodDonor.create({
    ...req.body,
    user: req.user.id,
    lastDonationDate: req.body.lastDonationDate || null,
    isAvailable: true
  });

  res.status(201).json({
    status: 'success',
    data: {
      donor
    }
  });
});

// Get all blood donors with filtering
exports.getAllDonors = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    BloodDonor.find({ isAvailable: true }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const donors = await features.query
    .populate('user', 'name phone')
    .select('-user.email -user.address');

  res.status(200).json({
    status: 'success',
    results: donors.length,
    data: {
      donors
    }
  });
});

// Get donor profile
exports.getDonorProfile = catchAsync(async (req, res, next) => {
  const donor = await BloodDonor.findById(req.params.id)
    .populate('user', 'name phone')
    .select('-user.email -user.address');

  if (!donor) {
    return next(new AppError('No donor found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      donor
    }
  });
});

// Update donor profile
exports.updateDonorProfile = catchAsync(async (req, res, next) => {
  const donor = await BloodDonor.findById(req.params.id);

  if (!donor) {
    return next(new AppError('No donor found with that ID', 404));
  }

  // Check if user is authorized to update
  if (donor.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this profile', 403));
  }

  const updatedDonor = await BloodDonor.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  )
    .populate('user', 'name phone')
    .select('-user.email -user.address');

  res.status(200).json({
    status: 'success',
    data: {
      donor: updatedDonor
    }
  });
});

// Delete donor profile
exports.deleteDonorProfile = catchAsync(async (req, res, next) => {
  const donor = await BloodDonor.findById(req.params.id);

  if (!donor) {
    return next(new AppError('No donor found with that ID', 404));
  }

  // Check if user is authorized to delete
  if (donor.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this profile', 403));
  }

  await donor.remove();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Search blood donors
exports.searchDonors = catchAsync(async (req, res, next) => {
  const { bloodGroup, city, state, lastDonationBefore } = req.query;

  // Build search query
  const searchQuery = {
    isAvailable: true
  };

  if (bloodGroup) {
    searchQuery.bloodGroup = bloodGroup;
  }

  if (city) {
    searchQuery['location.city'] = { $regex: city, $options: 'i' };
  }

  if (state) {
    searchQuery['location.state'] = { $regex: state, $options: 'i' };
  }

  if (lastDonationBefore) {
    searchQuery.lastDonationDate = { $lt: new Date(lastDonationBefore) };
  }

  const donors = await BloodDonor.find(searchQuery)
    .populate('user', 'name phone')
    .select('-user.email -user.address')
    .sort('-lastDonationDate');

  res.status(200).json({
    status: 'success',
    results: donors.length,
    data: {
      donors
    }
  });
});

// Find nearest donors
exports.findNearestDonors = catchAsync(async (req, res, next) => {
  const { longitude, latitude, maxDistance, bloodGroup } = req.query;

  if (!longitude || !latitude) {
    return next(new AppError('Please provide location coordinates', 400));
  }

  // Build query
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        $maxDistance: maxDistance ? parseInt(maxDistance) : 50000 // Default 50km
      }
    },
    isAvailable: true
  };

  // Add blood group filter if provided
  if (bloodGroup) {
    query.bloodGroup = bloodGroup;
  }

  const donors = await BloodDonor.find(query)
    .populate('user', 'name phone')
    .select('-user.email -user.address')
    .limit(20);

  res.status(200).json({
    status: 'success',
    results: donors.length,
    data: {
      donors
    }
  });
});

// Update donor availability
exports.updateAvailability = catchAsync(async (req, res, next) => {
  const { isAvailable } = req.body;
  const donor = await BloodDonor.findById(req.params.id);

  if (!donor) {
    return next(new AppError('No donor found with that ID', 404));
  }

  // Check if user is authorized to update
  if (donor.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this profile', 403));
  }

  donor.isAvailable = isAvailable;
  donor.availabilityUpdatedAt = Date.now();

  await donor.save();

  res.status(200).json({
    status: 'success',
    data: {
      donor
    }
  });
});

// Get donor statistics
exports.getDonorStats = catchAsync(async (req, res, next) => {
  const stats = await BloodDonor.aggregate([
    {
      $group: {
        _id: '$bloodGroup',
        totalDonors: { $sum: 1 },
        availableDonors: {
          $sum: { $cond: [{ $eq: ['$isAvailable', true] }, 1, 0] }
        },
        averageAge: { $avg: '$age' },
        cities: { $addToSet: '$location.city' }
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