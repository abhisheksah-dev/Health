const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/, 'Please provide a valid email']
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'admin', 'ngo', 'mental-health-professional', 'service-provider', 'content-creator', 'healthOfficial'],
        default: 'patient'
    },
    dateOfBirth: Date,
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
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    avatar: String,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: Date,
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    preferences: {
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false }
        }
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    if (!this.isNew) {
        this.passwordChangedAt = Date.now() - 1000; // ensure token is created after password change
    }
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    return resetToken;
};

userSchema.methods.createEmailVerificationToken = function() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    return verificationToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;