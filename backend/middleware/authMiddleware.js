const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const crypto = require('crypto');

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password. Please log in again.', 401));
    }

    req.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
        });

        if (!user) {
            return next(new AppError('Token is invalid or has already been used', 400));
        }

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            message: 'Email verified successfully. You can now log in.'
        });
    } catch (err) {
        next(new AppError('Email verification failed', 400));
    }
};

exports.isOwner = (Model) => catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);
    
    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    }

    const ownerField = doc.user || doc.userId || doc.patient;
    if (ownerField && ownerField.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
        return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
});