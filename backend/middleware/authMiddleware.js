const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');

// Protect routes - verify JWT token
exports.protect = catchAsync(async (req, res, next) => {
    // 1) Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
        return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 4) Check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password. Please log in again.', 401));
    }

    // Grant access to protected route
    req.user = user;
    next();
});

// Restrict access to certain roles
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};

// Verify email middleware
exports.verifyEmail = async (req, res, next) => {
    try {
        const user = await User.findOne({
            emailVerificationToken: req.params.token,
            emailVerified: false
        });

        if (!user) {
            return next(new AppError('Invalid or expired verification token', 400));
        }

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save();

        // Create and send new JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        res.status(200).json({
            status: 'success',
            message: 'Email verified successfully',
            token
        });
    } catch (err) {
        next(new AppError('Email verification failed', 400));
    }
};

// Check if user is verified
exports.isVerified = (req, res, next) => {
    if (!req.user.emailVerified) {
        return next(new AppError('Please verify your email address first', 403));
    }
    next();
};

// Doctor-specific middleware
exports.isDoctor = async (req, res, next) => {
    if (req.user.role !== 'doctor') {
        return next(new AppError('This route is only accessible to doctors', 403));
    }
    if (!req.user.isVerified) {
        return next(new AppError('Your doctor account is pending verification', 403));
    }
    next();
};

// Patient-specific middleware
exports.isPatient = (req, res, next) => {
    if (req.user.role !== 'patient') {
        return next(new AppError('This route is only accessible to patients', 403));
    }
    next();
};

// Admin-specific middleware
exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return next(new AppError('This route is only accessible to administrators', 403));
    }
    next();
};

// Check if user is the owner of the resource
exports.isOwner = (Model) => catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);
    
    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    }

    if (doc.user && doc.user.toString() !== req.user._id.toString()) {
        return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
}); 