const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const healthRecordController = require('../controllers/healthRecordController');
const { protect } = require('../middleware/authMiddleware'); // Corrected
const validateRequest = require('../middleware/validateRequest');
const { validateObjectId } = require('../middleware/validation');

// Validation middleware
const healthRecordValidation = [
  body('type')
    .isIn(['medical', 'dental', 'vision', 'mental_health', 'vaccination', 'lab_result', 'imaging', 'prescription', 'allergy', 'family_history'])
    .withMessage('Invalid record type'),
  body('date')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('provider')
    .optional()
    .isObject()
    .withMessage('Provider must be an object'),
  body('provider.name')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Provider name is required if provider is specified'),
  body('provider.type')
    .optional()
    .isIn(['doctor', 'hospital', 'clinic', 'laboratory', 'pharmacy'])
    .withMessage('Invalid provider type'),
  body('diagnosis')
    .optional()
    .isArray()
    .withMessage('Diagnosis must be an array'),
  body('diagnosis.*.condition')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Condition name is required'),
  body('diagnosis.*.icdCode')
    .optional()
    .isString()
    .trim()
    .withMessage('ICD code must be a string'),
  body('medications')
    .optional()
    .isArray()
    .withMessage('Medications must be an array'),
  body('medications.*.name')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Medication name is required'),
  body('medications.*.dosage')
    .optional()
    .isString()
    .trim()
    .withMessage('Dosage must be a string'),
  body('medications.*.frequency')
    .optional()
    .isString()
    .trim()
    .withMessage('Frequency must be a string'),
  body('vitals')
    .optional()
    .isObject()
    .withMessage('Vitals must be an object'),
  body('vitals.height')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Height must be a positive number'),
  body('vitals.weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),
  body('vitals.bloodPressure.systolic')
    .optional()
    .isInt({ min: 0, max: 300 })
    .withMessage('Systolic pressure must be between 0 and 300'),
  body('vitals.bloodPressure.diastolic')
    .optional()
    .isInt({ min: 0, max: 200 })
    .withMessage('Diastolic pressure must be between 0 and 200'),
  body('vitals.temperature')
    .optional()
    .isFloat({ min: 35, max: 42 })
    .withMessage('Temperature must be between 35 and 42'),
  body('vitals.heartRate')
    .optional()
    .isInt({ min: 0, max: 250 })
    .withMessage('Heart rate must be between 0 and 250'),
  body('vitals.oxygenSaturation')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Oxygen saturation must be between 0 and 100'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  body('attachments.*.type')
    .optional()
    .isIn(['image', 'document', 'lab_report', 'prescription'])
    .withMessage('Invalid attachment type'),
  body('attachments.*.url')
    .optional()
    .isURL()
    .withMessage('Invalid attachment URL'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .withMessage('Notes must be a string'),
  body('privacy')
    .optional()
    .isObject()
    .withMessage('Privacy must be an object'),
  body('privacy.level')
    .optional()
    .isIn(['public', 'private', 'doctors_only', 'selected_doctors'])
    .withMessage('Invalid privacy level'),
  body('privacy.sharedWith')
    .optional()
    .isArray()
    .withMessage('Shared with must be an array'),
  body('privacy.sharedWith.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid doctor ID in shared with list'),
  validateRequest
];

// Routes
router.use(protect);

// Get all health records for the authenticated user
router.get('/', [
  query('type').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('provider').optional().isString(),
  query('sort').optional().isIn(['date', '-date', 'type', '-type']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 }),
  validateRequest
], healthRecordController.getHealthRecords);

// Get a specific health record
router.get('/:id', [
  param('id').custom(id => validateObjectId(id, 'HealthRecord')).withMessage('Invalid health record ID'),
  validateRequest
], healthRecordController.getHealthRecord);

// Create a new health record
router.post('/', healthRecordValidation, healthRecordController.createHealthRecord);

// Update a health record
router.patch('/:id', [
  param('id').custom(id => validateObjectId(id, 'HealthRecord')).withMessage('Invalid health record ID'),
  ...healthRecordValidation
], healthRecordController.updateHealthRecord);

// Delete a health record
router.delete('/:id', [
  param('id').custom(id => validateObjectId(id, 'HealthRecord')).withMessage('Invalid health record ID'),
  validateRequest
], healthRecordController.deleteHealthRecord);

// Share health record with a doctor
router.post('/:id/share', [
  param('id').custom(id => validateObjectId(id, 'HealthRecord')).withMessage('Invalid health record ID'),
  body('doctorId').custom(id => validateObjectId(id, 'Doctor')).withMessage('Invalid doctor ID'),
  body('permissions').optional().isArray(),
  body('permissions.*').isIn(['read', 'write', 'delete']),
  validateRequest
], healthRecordController.shareHealthRecord);

// Revoke access from a doctor
router.delete('/:id/share/:doctorId', [
  param('id').custom(id => validateObjectId(id, 'HealthRecord')).withMessage('Invalid health record ID'),
  param('doctorId').custom(id => validateObjectId(id, 'Doctor')).withMessage('Invalid doctor ID'),
  validateRequest
], healthRecordController.revokeAccess);

// Get health record statistics
router.get('/stats/summary', healthRecordController.getHealthRecordStats);

// Export health records
router.get('/export/pdf', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('type').optional().isString(),
  validateRequest
], healthRecordController.exportHealthRecords);

module.exports = router;