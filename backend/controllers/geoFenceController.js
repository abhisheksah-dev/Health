const GeoFence = require('../models/GeoFence');
const HealthAlert = require('../models/HealthAlert');
const User = require('../models/User');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { sendNotification } = require('../utils/notifications');

// Create new geo-fence
exports.createGeoFence = catchAsync(async (req, res, next) => {
  const geoFence = await GeoFence.create({
    ...req.body,
    createdBy: req.user.id
  });

  res.status(201).json({
    status: 'success',
    data: {
      geoFence
    }
  });
});

// Get all geo-fences
exports.getAllGeoFences = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(GeoFence.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const geoFences = await features.query
    .populate('createdBy', 'name')
    .populate('alertTypes');

  res.status(200).json({
    status: 'success',
    results: geoFences.length,
    data: {
      geoFences
    }
  });
});

// Get single geo-fence
exports.getGeoFence = catchAsync(async (req, res, next) => {
  const geoFence = await GeoFence.findById(req.params.id)
    .populate('createdBy', 'name')
    .populate('alertTypes');

  if (!geoFence) {
    return next(new AppError('No geo-fence found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      geoFence
    }
  });
});

// Update geo-fence
exports.updateGeoFence = catchAsync(async (req, res, next) => {
  const geoFence = await GeoFence.findById(req.params.id);

  if (!geoFence) {
    return next(new AppError('No geo-fence found with that ID', 404));
  }

  // Only admin can update geo-fences
  if (req.user.role !== 'admin') {
    return next(new AppError('Only administrators can update geo-fences', 403));
  }

  const updatedGeoFence = await GeoFence.findByIdAndUpdate(
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
    .populate('alertTypes');

  res.status(200).json({
    status: 'success',
    data: {
      geoFence: updatedGeoFence
    }
  });
});

// Delete geo-fence
exports.deleteGeoFence = catchAsync(async (req, res, next) => {
  const geoFence = await GeoFence.findById(req.params.id);

  if (!geoFence) {
    return next(new AppError('No geo-fence found with that ID', 404));
  }

  // Only admin can delete geo-fences
  if (req.user.role !== 'admin') {
    return next(new AppError('Only administrators can delete geo-fences', 403));
  }

  await geoFence.remove();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Create health alert
exports.createHealthAlert = catchAsync(async (req, res, next) => {
  const { geoFenceId } = req.params;
  const geoFence = await GeoFence.findById(geoFenceId);

  if (!geoFence) {
    return next(new AppError('No geo-fence found with that ID', 404));
  }

  // Only admin can create alerts
  if (req.user.role !== 'admin') {
    return next(new AppError('Only administrators can create health alerts', 403));
  }

  const alert = await HealthAlert.create({
    ...req.body,
    geoFence: geoFenceId,
    createdBy: req.user.id
  });

  // Find users within the geo-fence
  const users = await User.find({
    'location': {
      $geoWithin: {
        $geometry: geoFence.geometry
      }
    },
    'notificationPreferences.healthAlerts': true
  });

  // Send notifications to users
  const notificationPromises = users.map(user =>
    sendNotification({
      user: user._id,
      title: alert.title,
      message: alert.message,
      type: 'health_alert',
      data: {
        alertId: alert._id,
        severity: alert.severity,
        category: alert.category
      }
    })
  );

  await Promise.all(notificationPromises);

  res.status(201).json({
    status: 'success',
    data: {
      alert,
      notifiedUsers: users.length
    }
  });
});

// Get health alerts
exports.getHealthAlerts = catchAsync(async (req, res, next) => {
  const { geoFenceId } = req.params;
  const features = new APIFeatures(
    HealthAlert.find({ geoFence: geoFenceId }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const alerts = await features.query
    .populate('createdBy', 'name')
    .populate('geoFence', 'name');

  res.status(200).json({
    status: 'success',
    results: alerts.length,
    data: {
      alerts
    }
  });
});

// Get active alerts for user's location
exports.getActiveAlerts = catchAsync(async (req, res, next) => {
  const { longitude, latitude } = req.query;

  if (!longitude || !latitude) {
    return next(new AppError('Please provide location coordinates', 400));
  }

  // Find geo-fences containing the user's location
  const geoFences = await GeoFence.find({
    geometry: {
      $geoIntersects: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        }
      }
    }
  });

  // Get active alerts for these geo-fences
  const alerts = await HealthAlert.find({
    geoFence: { $in: geoFences.map(fence => fence._id) },
    status: 'active',
    expiresAt: { $gt: new Date() }
  })
    .populate('geoFence', 'name')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: alerts.length,
    data: {
      alerts
    }
  });
});

// Update alert status
exports.updateAlertStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const alert = await HealthAlert.findById(req.params.alertId);

  if (!alert) {
    return next(new AppError('No alert found with that ID', 404));
  }

  // Only admin can update alert status
  if (req.user.role !== 'admin') {
    return next(new AppError('Only administrators can update alert status', 403));
  }

  alert.status = status;
  alert.updatedAt = Date.now();
  alert.updatedBy = req.user.id;

  await alert.save();

  res.status(200).json({
    status: 'success',
    data: {
      alert
    }
  });
});

// Get alert statistics
exports.getAlertStats = catchAsync(async (req, res, next) => {
  const stats = await HealthAlert.aggregate([
    {
      $group: {
        _id: {
          category: '$category',
          severity: '$severity',
          status: '$status'
        },
        count: { $sum: 1 },
        averageDuration: {
          $avg: {
            $subtract: ['$expiresAt', '$createdAt']
          }
        }
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