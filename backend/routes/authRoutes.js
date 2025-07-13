const express = require('express');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const AppError = require('../utils/appError');

const router = express.Router();

// Middleware to handle validation results
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);
        return next(new AppError(errorMessages.join('. '), 400));
    }
    next();
};

// Validation middleware for common user fields
const validateRegistration = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/).withMessage('Password must contain at least one uppercase, lowercase, number, and special character.'),
    body('passwordConfirm').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
    body('phoneNumber').optional().trim().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please provide a valid phone number'),
    body('dateOfBirth').optional().isISO8601().toDate().withMessage('Please provide a valid date of birth'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('address').optional().isObject().withMessage('Address must be an object'),
];

// Corrected: Comprehensive validation for doctor registration
const validateDoctorRegistration = [
    ...validateRegistration,
    body('specialization').trim().notEmpty().withMessage('Specialization is required'),
    body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
    body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
    body('consultationFee').isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number'),
    
    // Validate council object
    body('council').isObject().withMessage('Council details are required'),
    body('council.name').trim().notEmpty().withMessage('Council name is required'),
    body('council.year').isInt({ min: 1900, max: new Date().getFullYear() }).withMessage('Invalid council registration year'),
    body('council.country').trim().notEmpty().withMessage('Council country is required'),

    // Validate qualifications array
    body('qualifications').isArray({ min: 1 }).withMessage('At least one qualification is required'),
    body('qualifications.*.degree').trim().notEmpty().withMessage('Degree is required for each qualification'),
    body('qualifications.*.institution').trim().notEmpty().withMessage('Institution is required for each qualification'),
    body('qualifications.*.year').isInt({ min: 1900, max: new Date().getFullYear() }).withMessage('Invalid year for qualification'),
    body('qualifications.*.country').trim().notEmpty().withMessage('Country is required for each qualification'),
];

// Validation middleware for login
const validateLogin = [
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
];

// --- Public Routes ---
router.post('/register/patient', validateRegistration, handleValidationErrors, authController.registerPatient);
router.post('/register/doctor', validateDoctorRegistration, handleValidationErrors, authController.registerDoctor);
router.post('/login', validateLogin, handleValidationErrors, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// --- Protected Routes ---
router.use(protect);
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);
router.patch('/update-password', authController.updatePassword);

module.exports = router;