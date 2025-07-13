const express = require('express');
const { body, param } = require('express-validator');
const appointmentController = require('../controllers/appointmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { validateObjectId } = require('../middleware/validation'); // Corrected Import
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

const appointmentValidation = [
    // Corrected: This now properly validates the doctor's existence.
    body('doctor')
        .custom((id) => validateObjectId(id, 'Doctor'))
        .withMessage('A valid doctor ID is required and the doctor must exist.'),
    body('date').isISO8601().toDate().withMessage('Invalid date format'),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM)'),
    body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM)'),
    body('type').isIn(['consultation', 'follow_up', 'checkup', 'emergency', 'other']).withMessage('Invalid appointment type'),
    body('reason').notEmpty().withMessage('Please provide a reason for the appointment'),
    body('facility').optional().isJSON().withMessage('Facility must be a valid JSON string if provided'),
];

const statusUpdateValidation = [
    body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']).withMessage('Invalid appointment status'),
    body('cancellationReason').if(body('status').equals('cancelled')).notEmpty().withMessage('Please provide a reason for cancellation'),
];

// --- User & Doctor accessible routes ---
router.get('/my-appointments', appointmentController.getUserAppointments);
router.get('/available-slots', appointmentController.getAvailableTimeSlots);
router.get('/:id', [param('id').custom(id => validateObjectId(id, 'Appointment'))], validateRequest, appointmentController.getAppointment);

// --- Patient specific routes ---
router.post('/', upload.array('documents', 5), appointmentValidation, validateRequest, appointmentController.createAppointment);
router.patch('/:id/cancel', [param('id').custom(id => validateObjectId(id, 'Appointment'))], validateRequest, appointmentController.cancelAppointment);
router.patch('/:id/reschedule', [param('id').custom(id => validateObjectId(id, 'Appointment'))], validateRequest, appointmentController.rescheduleAppointment);

// --- Doctor & Admin specific routes ---
router.patch('/:id/status', restrictTo('doctor', 'admin'), [param('id').custom(id => validateObjectId(id, 'Appointment'))], statusUpdateValidation, validateRequest, appointmentController.updateAppointmentStatus);
router.get('/stats', restrictTo('admin', 'doctor'), appointmentController.getAppointmentStats);

// --- Admin only routes ---
router.get('/', restrictTo('admin'), appointmentController.getAllAppointments);

module.exports = router;