const MedicationReminder = require('../models/MedicationReminder');
const User = require('../models/User');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { sendNotification } = require('../utils/notifications');
const { scheduleReminder, cancelReminder } = require('../utils/scheduler');

// Create new medication reminder
exports.createReminder = catchAsync(async (req, res, next) => {
  const reminder = await MedicationReminder.create({
    ...req.body,
    user: req.user.id,
    status: 'active',
    createdBy: req.user.id
  });

  // Schedule notifications
  await scheduleReminder(reminder);

  res.status(201).json({
    status: 'success',
    data: {
      reminder
    }
  });
});

// Get all reminders for a user
exports.getUserReminders = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    MedicationReminder.find({ user: req.user.id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const reminders = await features.query;

  res.status(200).json({
    status: 'success',
    results: reminders.length,
    data: {
      reminders
    }
  });
});

// Get single reminder
exports.getReminder = catchAsync(async (req, res, next) => {
  const reminder = await MedicationReminder.findById(req.params.id);

  if (!reminder) {
    return next(new AppError('No reminder found with that ID', 404));
  }

  // Check if user is authorized to view
  if (reminder.user.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to view this reminder', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      reminder
    }
  });
});

// Update reminder
exports.updateReminder = catchAsync(async (req, res, next) => {
  const reminder = await MedicationReminder.findById(req.params.id);

  if (!reminder) {
    return next(new AppError('No reminder found with that ID', 404));
  }

  // Check if user is authorized to update
  if (reminder.user.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to update this reminder', 403));
  }

  // Cancel existing scheduled notifications
  await cancelReminder(reminder);

  // Update reminder
  Object.assign(reminder, req.body);
  await reminder.save();

  // Reschedule notifications if reminder is active
  if (reminder.status === 'active') {
    await scheduleReminder(reminder);
  }

  res.status(200).json({
    status: 'success',
    data: {
      reminder
    }
  });
});

// Delete reminder
exports.deleteReminder = catchAsync(async (req, res, next) => {
  const reminder = await MedicationReminder.findById(req.params.id);

  if (!reminder) {
    return next(new AppError('No reminder found with that ID', 404));
  }

  // Check if user is authorized to delete
  if (reminder.user.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to delete this reminder', 403));
  }

  // Cancel scheduled notifications
  await cancelReminder(reminder);

  await reminder.remove();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Update reminder status
exports.updateReminderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const reminder = await MedicationReminder.findById(req.params.id);

  if (!reminder) {
    return next(new AppError('No reminder found with that ID', 404));
  }

  // Check if user is authorized to update
  if (reminder.user.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to update this reminder', 403));
  }

  // Handle status change
  if (status === 'active' && reminder.status !== 'active') {
    await scheduleReminder(reminder);
  } else if (status !== 'active' && reminder.status === 'active') {
    await cancelReminder(reminder);
  }

  reminder.status = status;
  await reminder.save();

  res.status(200).json({
    status: 'success',
    data: {
      reminder
    }
  });
});

// Log medication taken
exports.logMedicationTaken = catchAsync(async (req, res, next) => {
  const { takenAt, notes } = req.body;
  const reminder = await MedicationReminder.findById(req.params.id);

  if (!reminder) {
    return next(new AppError('No reminder found with that ID', 404));
  }

  // Check if user is authorized to log
  if (reminder.user.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to log this reminder', 403));
  }

  // Add log entry
  reminder.logs.push({
    takenAt: new Date(takenAt),
    notes,
    loggedBy: req.user.id
  });

  await reminder.save();

  res.status(200).json({
    status: 'success',
    data: {
      reminder
    }
  });
});

// Get upcoming reminders
exports.getUpcomingReminders = catchAsync(async (req, res, next) => {
  const now = new Date();
  const reminders = await MedicationReminder.find({
    user: req.user.id,
    status: 'active',
    $or: [
      { endDate: { $gt: now } },
      { endDate: null }
    ]
  }).sort('nextReminderTime');

  res.status(200).json({
    status: 'success',
    results: reminders.length,
    data: {
      reminders
    }
  });
});

// Get reminder statistics
exports.getReminderStats = catchAsync(async (req, res, next) => {
  const stats = await MedicationReminder.aggregate([
    {
      $match: { user: req.user._id }
    },
    {
      $group: {
        _id: {
          status: '$status',
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        count: { $sum: 1 },
        totalLogs: { $sum: { $size: '$logs' } },
        adherenceRate: {
          $avg: {
            $cond: [
              { $gt: [{ $size: '$logs' }, 0] },
              {
                $divide: [
                  { $size: { $filter: { input: '$logs', as: 'log', cond: { $eq: ['$$log.status', 'taken'] } } } },
                  { $size: '$logs' }
                ]
              },
              0
            ]
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