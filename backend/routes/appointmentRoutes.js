const express = require('express');
const { body } = require('express-validator');
const appointmentController = require('../controllers/appointmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Protect all routes
router.use(protect);

// Validation middleware
const appointmentValidation = [
    body('doctor').isMongoId().withMessage('Invalid doctor ID'),
    body('date').isISO8601().withMessage('Invalid date format'),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format'),
    body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format'),
    body('type').isIn(['consultation', 'follow-up', 'emergency', 'routine-checkup']).withMessage('Invalid appointment type'),
    body('reason').notEmpty().withMessage('Please provide a reason for the appointment'),
    validateRequest
];

const statusUpdateValidation = [
    body('status').isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'])
        .withMessage('Invalid appointment status'),
    body('cancellationReason').if(body('status').equals('cancelled'))
        .notEmpty().withMessage('Please provide a reason for cancellation'),
    validateRequest
];

// Routes
router.post('/', appointmentValidation, appointmentController.createAppointment);
router.get('/my-appointments', appointmentController.getMyAppointments);
router.get('/available-slots', appointmentController.getAvailableSlots);

// Doctor only routes
router.get('/stats', 
    restrictTo('doctor'), 
    appointmentController.getAppointmentStats
);

// Appointment management routes
router.route('/:id')
    .get(appointmentController.getAppointment)
    .patch(
        restrictTo('doctor'),
        appointmentController.updateAppointmentDetails
    );

router.patch('/:id/status', 
    statusUpdateValidation,
    appointmentController.updateAppointmentStatus
);

module.exports = router; 