const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

// Create and sign JWT token
const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// Create and send token response
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

// Register new patient
exports.registerPatient = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: 'patient',
        phoneNumber: req.body.phoneNumber,
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender,
        address: req.body.address
    });

    const verificationToken = newUser.createEmailVerificationToken();
    await newUser.save({ validateBeforeSave: false });

    try {
        const verificationURL = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${verificationToken}`;
        await sendVerificationEmail(newUser.email, verificationURL);
    } catch (err) {
        console.error(`ERROR sending verification email to ${newUser.email}:`, err.message);
        // Do NOT block the registration. The user can request a new verification email later.
    }

    createSendToken(newUser, 201, res);
});

// Register new doctor
exports.registerDoctor = catchAsync(async (req, res, next) => {
    const newDoctor = await Doctor.create(req.body);

    const verificationToken = newDoctor.createEmailVerificationToken();
    await newDoctor.save({ validateBeforeSave: false });

    try {
        const verificationURL = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${verificationToken}`;
        await sendVerificationEmail(newDoctor.email, verificationURL);
    } catch (err) {
        console.error(`ERROR sending verification email to doctor ${newDoctor.email}:`, err.message);
    }

    createSendToken(newDoctor, 201, res);
});


// Login user
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }
    
    if (!user.emailVerified) {
        // Optional: you can choose to block login for unverified emails
        // return next(new AppError('Please verify your email before logging in.', 403));
    }

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, res);
});

// Verify Email
exports.verifyEmail = catchAsync(async (req, res, next) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

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
});


// Logout user
exports.logout = (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
    });
};

// Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with that email address', 404));
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
        await sendPasswordResetEmail(user.email, resetURL);
        res.status(200).json({
            status: 'success',
            message: 'Password reset token sent to email'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError('There was an error sending the password reset email. Please try again later.', 500));
    }
});

// Reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
});

// Update password
exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
        return next(new AppError('Your current password is incorrect', 401));
    }

    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.newPasswordConfirm;
    await user.save();

    createSendToken(user, 200, res);
});

// Get current user
exports.getMe = (req, res, next) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user
        }
    });
};