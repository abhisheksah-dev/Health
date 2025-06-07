const express = require('express');
const router = express.Router();
const telemedicineController = require('../controllers/telemedicineController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

// Validation middleware
const consultationValidation = [
  body('doctorId').isMongoId().withMessage('Invalid doctor ID'),
  body('symptoms').isString().trim().notEmpty().withMessage('Symptoms are required'),
  body('preferredTime').isISO8601().withMessage('Invalid preferred time format'),
  body('notes').optional().isString().trim(),
  validateRequest
];

const statusUpdateValidation = [
  body('status')
    .isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled'])
    .withMessage('Invalid consultation status'),
  body('scheduledTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid scheduled time format'),
  body('notes')
    .optional()
    .isString()
    .trim(),
  validateRequest
];

const notesValidation = [
  body('notes').isString().trim().notEmpty().withMessage('Notes are required'),
  body('prescription')
    .optional()
    .isObject()
    .withMessage('Prescription must be an object'),
  body('followUpDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid follow-up date format'),
  validateRequest
];

// Protect all routes
router.use(protect);

// Public routes (require authentication)
router.get('/my-consultations', telemedicineController.getUserConsultations);
router.get('/doctor/:doctorId/availability', telemedicineController.getDoctorAvailability);

router
  .route('/')
  .post(consultationValidation, telemedicineController.createConsultation);

router
  .route('/:id')
  .get(telemedicineController.getConsultation)
  .patch(statusUpdateValidation, telemedicineController.updateConsultationStatus);

router
  .route('/:id/notes')
  .patch(notesValidation, telemedicineController.addConsultationNotes);

// Doctor routes
router.use(restrictTo('doctor'));
router.patch('/availability', telemedicineController.updateDoctorAvailability);

// Admin routes
router.use(restrictTo('admin'));
router.get('/stats', telemedicineController.getConsultationStats);

module.exports = router; 