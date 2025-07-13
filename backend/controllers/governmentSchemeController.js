const GovernmentScheme = require('../models/GovernmentScheme');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// Create new government scheme
exports.createScheme = catchAsync(async (req, res, next) => {
  const scheme = await GovernmentScheme.create({
    ...req.body,
    createdBy: req.user.id
  });

  res.status(201).json({
    status: 'success',
    data: {
      scheme
    }
  });
});

// Get all government schemes with filtering
exports.getAllSchemes = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(GovernmentScheme.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const schemes = await features.query;

  res.status(200).json({
    status: 'success',
    results: schemes.length,
    data: {
      schemes
    }
  });
});

// Get single government scheme
exports.getScheme = catchAsync(async (req, res, next) => {
  const scheme = await GovernmentScheme.findById(req.params.id);

  if (!scheme) {
    return next(new AppError('No scheme found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      scheme
    }
  });
});

// Update government scheme
exports.updateScheme = catchAsync(async (req, res, next) => {
  const updatedScheme = await GovernmentScheme.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      'metadata.lastUpdated': Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!updatedScheme) {
    return next(new AppError('No scheme found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      scheme: updatedScheme
    }
  });
});

// Delete government scheme
exports.deleteScheme = catchAsync(async (req, res, next) => {
  const scheme = await GovernmentScheme.findByIdAndDelete(req.params.id);

  if (!scheme) {
    return next(new AppError('No scheme found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Search government schemes
exports.searchSchemes = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(GovernmentScheme.find(), req.query)
    .filter()
    .search()
    .sort();
    
  const schemes = await features.query;

  res.status(200).json({
    status: 'success',
    results: schemes.length,
    data: {
      schemes
    }
  });
});

// Get scheme statistics
exports.getSchemeStats = catchAsync(async (req, res, next) => {
  const stats = await GovernmentScheme.aggregate([
    {
      $group: {
        _id: '$category',
        totalSchemes: { $sum: 1 },
        averageFinancialLimit: { $avg: '$benefits.financialSupport.maxLimit' },
        statesCovered: { $addToSet: '$coverage.geographical.states' }
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

// Get active schemes by state
exports.getActiveSchemesByState = catchAsync(async (req, res, next) => {
  const { state } = req.params;

  const schemes = await GovernmentScheme.find({
    'coverage.geographical.states': state,
    status: 'active',
    'validity.endDate': { $gte: new Date() }
  }).sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: schemes.length,
    data: {
      schemes
    }
  });
});

// Get upcoming schemes
exports.getUpcomingSchemes = catchAsync(async (req, res, next) => {
  const { limit = 5 } = req.query;

  const schemes = await GovernmentScheme.find({
    status: 'upcoming',
    'validity.startDate': { $gt: new Date() }
  })
    .sort('validity.startDate')
    .limit(parseInt(limit));

  res.status(200).json({
    status: 'success',
    results: schemes.length,
    data: {
      schemes
    }
  });
});