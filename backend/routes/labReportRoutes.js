const express = require('express');
const { body, query, param } = require('express-validator');
const labReportController = require('../controllers/labReportController');
const { protect, restrictTo, isOwner } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const LabReport = require('../models/LabReport');

const router = express.Router();

// Protect all routes
router.use(protect);

// Validation middleware
const validateLabReportUpload = [
    body('doctorId').isMongoId().withMessage('Invalid doctor ID'),
    body('appointmentId').optional().isMongoId().withMessage('Invalid appointment ID'),
    body('labName').trim().notEmpty().withMessage('Laboratory name is required'),
    body('testDate').isISO8601().withMessage('Invalid test date'),
    body('reportDate').isISO8601().withMessage('Invalid report date'),
    body('testType').isIn([
        'blood-test',
        'urine-test',
        'x-ray',
        'mri',
        'ct-scan',
        'ultrasound',
        'ecg',
        'other'
    ]).withMessage('Invalid test type'),
    validateRequest
];

const validateLabReportUpdate = [
    body('labName').optional().trim().notEmpty().withMessage('Laboratory name cannot be empty'),
    body('testDate').optional().isISO8601().withMessage('Invalid test date'),
    body('reportDate').optional().isISO8601().withMessage('Invalid report date'),
    body('testType').optional().isIn([
        'blood-test',
        'urine-test',
        'x-ray',
        'mri',
        'ct-scan',
        'ultrasound',
        'ecg',
        'other'
    ]).withMessage('Invalid test type'),
    body('isPrivate').optional().isBoolean().withMessage('isPrivate must be a boolean'),
    validateRequest
];

// Upload lab report
router.post(
    '/upload',
    restrictTo('patient', 'doctor', 'admin'),
    labReportController.upload.single('report'),
    validateLabReportUpload,
    labReportController.uploadLabReport
);

// Get lab report by ID
router.get(
    '/:id',
    param('id').isMongoId().withMessage('Invalid lab report ID'),
    validateRequest,
    labReportController.getLabReport
);

// Get patient's lab history
router.get(
    '/patient/:patientId',
    param('patientId').isMongoId().withMessage('Invalid patient ID'),
    query('testType').optional().isIn([
        'blood-test',
        'urine-test',
        'x-ray',
        'mri',
        'ct-scan',
        'ultrasound',
        'ecg',
        'other'
    ]).withMessage('Invalid test type'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('status').optional().isIn(['pending', 'analyzing', 'analyzed', 'error'])
        .withMessage('Invalid status'),
    validateRequest,
    restrictTo('doctor', 'admin'),
    labReportController.getPatientLabHistory
);

// Get critical values
router.get(
    '/patient/:patientId/critical-values',
    param('patientId').isMongoId().withMessage('Invalid patient ID'),
    validateRequest,
    restrictTo('doctor', 'admin'),
    labReportController.getCriticalValues
);

// Get test trends
router.get(
    '/patient/:patientId/trends',
    param('patientId').isMongoId().withMessage('Invalid patient ID'),
    query('testType').isIn([
        'blood-test',
        'urine-test',
        'x-ray',
        'mri',
        'ct-scan',
        'ultrasound',
        'ecg',
        'other'
    ]).withMessage('Invalid test type'),
    query('parameter').notEmpty().withMessage('Parameter is required'),
    validateRequest,
    restrictTo('doctor', 'admin'),
    labReportController.getTestTrends
);

// Update lab report
router.patch(
    '/:id',
    param('id').isMongoId().withMessage('Invalid lab report ID'),
    validateLabReportUpdate,
    isOwner(LabReport),
    labReportController.updateLabReport
);

// Delete lab report
router.delete(
    '/:id',
    param('id').isMongoId().withMessage('Invalid lab report ID'),
    validateRequest,
    isOwner(LabReport),
    labReportController.deleteLabReport
);

// Retry analysis
router.post(
    '/:id/retry-analysis',
    param('id').isMongoId().withMessage('Invalid lab report ID'),
    validateRequest,
    isOwner(LabReport),
    labReportController.retryAnalysis
);

module.exports = router; 