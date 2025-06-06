const express = require('express');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { protect, verifyEmail } = require('../middleware/authMiddleware');
const AppError = require('../utils/appError');

const router = express.Router();

// Validation middleware
const validateRegistration = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('passwordConfirm')
        .trim()
        .notEmpty()
        .withMessage('Password confirmation is required')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        }),
    
    body('phoneNumber')
        .optional()
        .trim()
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Please provide a valid phone number'),
    
    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date of birth'),
    
    body('gender')
        .optional()
        .isIn(['male', 'female', 'other'])
        .withMessage('Gender must be either male, female, or other'),
    
    body('address')
        .optional()
        .isObject()
        .withMessage('Address must be an object'),
    
    body('address.street')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Street is required if address is provided'),
    
    body('address.city')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('City is required if address is provided'),
    
    body('address.state')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('State is required if address is provided'),
    
    body('address.country')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Country is required if address is provided'),
    
    body('address.zipCode')
        .optional()
        .trim()
        .matches(/^\d{5}(-\d{4})?$/)
        .withMessage('Please provide a valid ZIP code'),

    // Validation result middleware
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => err.msg);
            return next(new AppError(errorMessages.join('. '), 400));
        }
        next();
    }
];

const validateDoctorRegistration = [
    ...validateRegistration,
    body('specialization').trim().notEmpty().withMessage('Specialization is required'),
    body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
    body('qualifications').isArray().withMessage('Qualifications must be an array'),
    body('qualifications.*.degree').trim().notEmpty().withMessage('Degree is required'),
    body('qualifications.*.institution').trim().notEmpty().withMessage('Institution is required'),
    body('qualifications.*.year').isInt({ min: 1900, max: new Date().getFullYear() }).withMessage('Invalid year'),
    body('clinicDetails.name').trim().notEmpty().withMessage('Clinic name is required'),
    body('clinicDetails.consultationFee').isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number')
];

// Public routes
router.post('/register/patient', validateRegistration, authController.registerPatient);
router.post('/register/doctor', validateDoctorRegistration, authController.registerDoctor);
router.post('/login', [
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Please provide a valid email'),
    body('password').trim().notEmpty().withMessage('Password is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => err.msg);
            return next(new AppError(errorMessages.join('. '), 400));
        }
        next();
    }
], authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.use(protect); // All routes after this middleware require authentication
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);
router.patch('/update-password', authController.updatePassword);

module.exports = router; 