const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // This only works on CREATE and SAVE
            validator: function(el) {
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'admin'],
        default: 'patient'
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    profilePicture: {
        type: String,
        default: 'default.jpg'
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },
    isActive: {
        type: Boolean,
        default: true,
        select: false
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


// Virtual populate for appointments
userSchema.virtual('appointments', {
    ref: 'Appointment',
    foreignField: 'patient',
    localField: '_id'
});

// Middleware to hash password and handle passwordChangedAt
userSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm field
    this.passwordConfirm = undefined;

    // Update passwordChangedAt field if the document is not new
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // Subtract 1s to ensure token is created after this timestamp
    }
    
    next();
});

// Only find active users
userSchema.pre(/^find/, function(next) {
    this.find({ isActive: { $ne: false } });
    next();
});

// Instance method to check if password is correct
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
};

// Instance method to create email verification token
userSchema.methods.createEmailVerificationToken = function() {
    const verificationToken = crypto.randomBytes(32).toString('hex');

    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    return verificationToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;