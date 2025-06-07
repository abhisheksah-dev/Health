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

  const schemes = await features.query
    .populate('createdBy', 'name')
    .populate('categories')
    .populate('eligibilityCriteria');

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
  const scheme = await GovernmentScheme.findById(req.params.id)
    .populate('createdBy', 'name')
    .populate('categories')
    .populate('eligibilityCriteria');

  if (!scheme) {
    return next(new AppError('No scheme found with that ID', 404));
  }

  // Increment view count
  scheme.views += 1;
  await scheme.save();

  res.status(200).json({
    status: 'success',
    data: {
      scheme
    }
  });
});

// Update government scheme
exports.updateScheme = catchAsync(async (req, res, next) => {
  const scheme = await GovernmentScheme.findById(req.params.id);

  if (!scheme) {
    return next(new AppError('No scheme found with that ID', 404));
  }

  // Only admin can update schemes
  if (req.user.role !== 'admin') {
    return next(new AppError('Only administrators can update government schemes', 403));
  }

  const updatedScheme = await GovernmentScheme.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      updatedBy: req.user.id,
      updatedAt: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  )
    .populate('createdBy', 'name')
    .populate('categories')
    .populate('eligibilityCriteria');

  res.status(200).json({
    status: 'success',
    data: {
      scheme: updatedScheme
    }
  });
});

// Delete government scheme
exports.deleteScheme = catchAsync(async (req, res, next) => {
  const scheme = await GovernmentScheme.findById(req.params.id);

  if (!scheme) {
    return next(new AppError('No scheme found with that ID', 404));
  }

  // Only admin can delete schemes
  if (req.user.role !== 'admin') {
    return next(new AppError('Only administrators can delete government schemes', 403));
  }

  await scheme.remove();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Search government schemes
exports.searchSchemes = catchAsync(async (req, res, next) => {
  const { query, category, state, status } = req.query;

  // Build search query
  const searchQuery = {};

  if (query) {
    searchQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { benefits: { $regex: query, $options: 'i' } }
    ];
  }

  if (category) {
    searchQuery.categories = category;
  }

  if (state) {
    searchQuery.availableStates = state;
  }

  if (status) {
    searchQuery.status = status;
  }

  const schemes = await GovernmentScheme.find(searchQuery)
    .populate('createdBy', 'name')
    .populate('categories')
    .populate('eligibilityCriteria')
    .sort('-createdAt');

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
        totalViews: { $sum: '$views' },
        averageBenefitAmount: { $avg: '$benefitAmount' },
        states: { $addToSet: '$availableStates' }
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
    availableStates: state,
    status: 'active',
    applicationDeadline: { $gt: new Date() }
  })
    .populate('createdBy', 'name')
    .populate('categories')
    .populate('eligibilityCriteria')
    .sort('-createdAt');

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
    startDate: { $gt: new Date() }
  })
    .sort('startDate')
    .limit(parseInt(limit))
    .populate('createdBy', 'name')
    .populate('categories')
    .populate('eligibilityCriteria');

  res.status(200).json({
    status: 'success',
    results: schemes.length,
    data: {
      schemes
    }
  });
}); 