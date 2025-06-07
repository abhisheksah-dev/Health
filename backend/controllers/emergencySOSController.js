const EmergencySOS = require('../models/EmergencySOS');
const User = require('../models/User');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { sendNotification } = require('../utils/notifications');

// Create a new emergency alert
exports.createEmergencyAlert = catchAsync(async (req, res, next) => {
  const { location, emergencyType, notes } = req.body;

  if (!location || !location.coordinates) {
    return next(new AppError('Location is required to create an alert.', 400));
  }

  const alert = await EmergencySOS.create({
    user: req.user.id,
    location,
    emergencyType,
    notes,
  });

  // Notify user's emergency contacts
  const user = await User.findById(req.user.id).select('emergencyContacts name');
  if (user.emergencyContacts && user.emergencyContacts.length > 0) {
    const notificationPromises = user.emergencyContacts.map(contact => 
      sendNotification({
        userId: user._id, // (stub) in reality, send SMS/email to contact.phone/email
        type: 'emergency_sos',
        title: `Emergency Alert from ${user.name}`,
        message: `${user.name} has triggered an SOS alert of type: ${emergencyType}. Notes: ${notes || 'N/A'}. Location: ${location.address}`,
        data: { alertId: alert._id }
      })
    );
    await Promise.all(notificationPromises);
  }

  res.status(201).json({
    status: 'success',
    data: {
      alert,
    },
  });
});

// Get all alerts for the authenticated user
exports.getUserAlerts = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    EmergencySOS.find({ user: req.user.id }),
    req.query
  ).sort().paginate();

  const alerts = await features.query;

  res.status(200).json({
    status: 'success',
    results: alerts.length,
    data: {
      alerts,
    },
  });
});

// Get all active alerts (for responders/admins)
exports.getActiveAlerts = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    EmergencySOS.find({ status: 'active' }),
    req.query
  ).sort().paginate();

  const alerts = await features.query.populate('user', 'name phone');

  res.status(200).json({
    status: 'success',
    results: alerts.length,
    data: {
      alerts,
    },
  });
});

// Get a single alert by ID
exports.getAlert = catchAsync(async (req, res, next) => {
  const alert = await EmergencySOS.findById(req.params.id).populate('user', 'name phone emergencyContacts');

  if (!alert) {
    return next(new AppError('No alert found with that ID', 404));
  }

  // Authorization check (owner, responder, or admin)
  if (alert.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
     return next(new AppError('You do not have permission to view this alert', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      alert,
    },
  });
});

// Update the status of an alert
exports.updateAlertStatus = catchAsync(async (req, res, next) => {
    const { status, notes } = req.body;
    
    const alert = await EmergencySOS.findById(req.params.id);

    if (!alert) {
        return next(new AppError('No alert found with that ID', 404));
    }
    
    // Authorization check
    if (alert.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('You do not have permission to update this alert', 403));
    }
    
    alert.status = status;
    if (notes) {
        alert.notes = notes;
    }
    
    if (status === 'resolved' && !alert.resolvedAt) {
        alert.resolvedAt = Date.now();
        alert.responseTime = (alert.resolvedAt - alert.createdAt) / 1000; // in seconds
    }
    
    await alert.save();
    
    res.status(200).json({
        status: 'success',
        data: {
            alert
        }
    });
});

// Get alert statistics (admin only)
exports.getAlertStats = catchAsync(async (req, res, next) => {
    const stats = await EmergencySOS.aggregate([
        {
            $group: {
                _id: '$emergencyType',
                count: { $sum: 1 },
                active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
                avgResponseTime: { $avg: '$responseTime' }
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