const EmergencyService = require('../models/EmergencyService');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// Create new emergency service
exports.createEmergencyService = catchAsync(async (req, res, next) => {
  const emergencyService = await EmergencyService.create({
    ...req.body,
    user: req.user.id
  });

  res.status(201).json({
    status: 'success',
    data: {
      emergencyService
    }
  });
});

// Get emergency service
exports.getEmergencyService = catchAsync(async (req, res, next) => {
  const emergencyService = await EmergencyService.findById(req.params.id)
    .populate('user', 'name email phone');

  if (!emergencyService) {
    return next(new AppError('No emergency service found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      emergencyService
    }
  });
});

// Get all emergency services
exports.getAllEmergencyServices = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(EmergencyService.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const emergencyServices = await features.query
    .populate('user', 'name email phone');

  res.status(200).json({
    status: 'success',
    results: emergencyServices.length,
    data: {
      emergencyServices
    }
  });
});

// Update emergency service
exports.updateEmergencyService = catchAsync(async (req, res, next) => {
  const emergencyService = await EmergencyService.findById(req.params.id);

  if (!emergencyService) {
    return next(new AppError('No emergency service found with that ID', 404));
  }

  // Check if user is authorized to update
  if (emergencyService.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this service', 403));
  }

  const updatedService = await EmergencyService.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('user', 'name email phone');

  res.status(200).json({
    status: 'success',
    data: {
      emergencyService: updatedService
    }
  });
});

// Delete emergency service
exports.deleteEmergencyService = catchAsync(async (req, res, next) => {
  const emergencyService = await EmergencyService.findById(req.params.id);

  if (!emergencyService) {
    return next(new AppError('No emergency service found with that ID', 404));
  }

  // Check if user is authorized to delete
  if (emergencyService.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this service', 403));
  }

  await emergencyService.remove();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Find nearest emergency services
exports.findNearestServices = catchAsync(async (req, res, next) => {
  const { longitude, latitude, maxDistance, type } = req.query;

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
        $maxDistance: maxDistance ? parseInt(maxDistance) : 10000 // Default 10km
      }
    },
    isActive: true
  };

  // Add type filter if provided
  if (type) {
    query.type = type;
  }

  const services = await EmergencyService.find(query)
    .populate('user', 'name email phone')
    .limit(20); // Limit to 20 nearest services

  res.status(200).json({
    status: 'success',
    results: services.length,
    data: {
      services
    }
  });
});

// Find emergency services within area
exports.findServicesInArea = catchAsync(async (req, res, next) => {
  const { coordinates, type } = req.body;

  if (!coordinates || !Array.isArray(coordinates)) {
    return next(new AppError('Please provide valid area coordinates', 400));
  }

  // Build query
  const query = {
    location: {
      $geoWithin: {
        $geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        }
      }
    },
    isActive: true
  };

  // Add type filter if provided
  if (type) {
    query.type = type;
  }

  const services = await EmergencyService.find(query)
    .populate('user', 'name email phone');

  res.status(200).json({
    status: 'success',
    results: services.length,
    data: {
      services
    }
  });
});

// Update service status
exports.updateServiceStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const emergencyService = await EmergencyService.findById(req.params.id);

  if (!emergencyService) {
    return next(new AppError('No emergency service found with that ID', 404));
  }

  // Check if user is authorized to update
  if (emergencyService.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this service', 403));
  }

  emergencyService.status = status;
  emergencyService.statusUpdatedAt = Date.now();
  emergencyService.statusUpdatedBy = req.user.id;

  await emergencyService.save();

  res.status(200).json({
    status: 'success',
    data: {
      emergencyService
    }
  });
});

// Get service statistics
exports.getServiceStats = catchAsync(async (req, res, next) => {
  const stats = await EmergencyService.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        averageRating: { $avg: '$rating' }
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