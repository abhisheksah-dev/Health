const MedicationReminder = require('../models/MedicationReminder');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { scheduleReminder, cancelReminder } = require('../utils/scheduler');

// Create new medication reminder
exports.createReminder = catchAsync(async (req, res, next) => {
  const reminder = await MedicationReminder.create({
    ...req.body,
    user: req.user.id
  });

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
  const reminder = await MedicationReminder.findOne({ _id: req.params.id, user: req.user.id });

  if (!reminder) {
    return next(new AppError('No reminder found with that ID for the current user', 404));
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
  const reminder = await MedicationReminder.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!reminder) {
    return next(new AppError('No reminder found with that ID to update', 404));
  }

  await cancelReminder(reminder);
  if (reminder.isActive) {
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
  const reminder = await MedicationReminder.findOneAndDelete({ _id: req.params.id, user: req.user.id });

  if (!reminder) {
    return next(new AppError('No reminder found with that ID to delete', 404));
  }

  await cancelReminder(reminder);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Update reminder status
exports.updateReminderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const reminder = await MedicationReminder.findOne({ _id: req.params.id, user: req.user.id });

  if (!reminder) {
    return next(new AppError('No reminder found with that ID', 404));
  }
  
  reminder.isActive = status === 'active';
  await reminder.save();
  
  if (reminder.isActive) {
    await scheduleReminder(reminder);
  } else {
    await cancelReminder(reminder);
  }

  res.status(200).json({
    status: 'success',
    data: {
      reminder
    }
  });
});

// Log medication taken
exports.logMedicationTaken = catchAsync(async (req, res, next) => {
    return next(new AppError('This functionality is not supported by the current MedicationReminder model.', 501));
});

// Get upcoming reminders
exports.getUpcomingReminders = catchAsync(async (req, res, next) => {
  const now = new Date();
  const reminders = await MedicationReminder.find({
    user: req.user.id,
    isActive: true,
    nextReminder: { $gte: now }
  }).sort('nextReminder');

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
        { $match: { user: req.user._id } },
        {
            $group: {
                _id: '$isActive',
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                status: { $cond: [ '$_id', 'active', 'inactive' ] },
                count: '$count'
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