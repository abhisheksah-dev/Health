const express = require('express');
const router = express.Router();
const medicationReminderController = require('../controllers/medicationReminderController');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

// Validation middleware
const reminderValidation = [
  body('medicationName')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Medication name is required'),
  body('dosage')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Dosage is required'),
  body('frequency')
    .isObject()
    .withMessage('Frequency must be an object'),
  body('frequency.type')
    .isIn(['daily', 'weekly', 'monthly', 'custom'])
    .withMessage('Invalid frequency type'),
  body('frequency.times')
    .isArray()
    .withMessage('Times must be an array'),
  body('frequency.times.*')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format'),
  body('startDate')
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  body('notes')
    .optional()
    .isString()
    .trim(),
  validateRequest
];

const updateValidation = [
  body('status')
    .optional()
    .isIn(['active', 'paused', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('frequency')
    .optional()
    .isObject()
    .withMessage('Frequency must be an object'),
  body('notes')
    .optional()
    .isString()
    .trim(),
  validateRequest
];

// Protect all routes
router.use(protect);

// User routes
router
  .route('/')
  .get(medicationReminderController.getUserReminders)
  .post(reminderValidation, medicationReminderController.createReminder);

router
  .route('/:id')
  .get(medicationReminderController.getReminder)
  .patch(updateValidation, medicationReminderController.updateReminder)
  .delete(medicationReminderController.deleteReminder);

router
  .route('/:id/status')
  .patch(
    body('status')
      .isIn(['active', 'paused', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    validateRequest,
    medicationReminderController.updateReminderStatus
  );

router
  .route('/:id/log')
  .post(
    body('takenAt')
      .isISO8601()
      .withMessage('Invalid taken time format'),
    body('notes')
      .optional()
      .isString()
      .trim(),
    validateRequest,
    medicationReminderController.logMedicationTaken
  );

router.get('/upcoming', medicationReminderController.getUpcomingReminders);
router.get('/stats', medicationReminderController.getReminderStats);

module.exports = router; 