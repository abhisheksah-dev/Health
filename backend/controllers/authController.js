const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const AppError = require('../utils/appError');
const {catchAsync} = require('../utils/catchAsync');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    
    // Ensure password is not sent, even if it's part of a combined user object
    const userResponse = { ...user };
    if (userResponse.password) {
        delete userResponse.password;
    }

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user: userResponse
        }
    });
};

exports.registerPatient = catchAsync(async (req, res, next) => {
    // Corrected: Added bloodGroup to align with frontend and added to User model
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: 'patient',
        phoneNumber: req.body.phoneNumber,
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender,
        address: req.body.address,
        bloodGroup: req.body.bloodGroup
    });

    const verificationToken = newUser.createEmailVerificationToken();
    await newUser.save({ validateBeforeSave: false });

    try {
        const verificationURL = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${verificationToken}`;
        await sendVerificationEmail(newUser.email, verificationURL);
    } catch (err) {
        console.error(`ERROR sending verification email to ${newUser.email}:`, err.message);
        // Do not block the registration process if email fails. Log it for later.
    }

    createSendToken(newUser.toObject(), 201, res);
});

exports.registerDoctor = catchAsync(async (req, res, next) => {
    // 1. Create the base user
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: 'doctor',
        phoneNumber: req.body.phoneNumber,
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender,
        address: req.body.address
    });
    
    // 2. Create the detailed doctor profile
    await Doctor.create({
        user: newUser._id,
        specializations: req.body.specializations,
        licenseNumber: req.body.licenseNumber,
        registrationNumber: req.body.registrationNumber,
        council: req.body.council,
        qualifications: req.body.qualifications,
        consultationFee: req.body.consultationFee,
        languages: req.body.languages || []
    });
    
    // 3. Create and send email verification token
    const verificationToken = newUser.createEmailVerificationToken();
    await newUser.save({ validateBeforeSave: false });

    try {
        const verificationURL = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${verificationToken}`;
        await sendVerificationEmail(newUser.email, verificationURL);
    } catch (err) {
        console.error(`ERROR sending verification email to doctor ${newUser.email}:`, err.message);
    }

    // 4. Send the JWT token
    createSendToken(newUser.toObject(), 201, res);
});


exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }
    
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    
    const userObject = user.toObject();

    // If user is a doctor, attach their doctor profile
    if (user.role === 'doctor') {
        const doctorProfile = await Doctor.findOne({ user: user._id });
        if(doctorProfile) {
            userObject.doctorProfile = doctorProfile.toObject();
        }
    }
    
    createSendToken(userObject, 200, res);
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ emailVerificationToken: hashedToken });
    
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

exports.logout = (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
    });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        // To prevent user enumeration, always return a success message
        return res.status(200).json({
            status: 'success',
            message: 'If a user with that email exists, a password reset link has been sent.'
        });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
        const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        await sendPasswordResetEmail(user.email, resetURL);
        res.status(200).json({
            status: 'success',
            message: 'If a user with that email exists, a password reset link has been sent.'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError('There was an error sending the password reset email. Please try again later.', 500));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user.toObject(), 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
        return next(new AppError('Your current password is incorrect', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    createSendToken(user.toObject(), 200, res);
});

exports.getMe = (req, res, next) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user
        }
    });
};