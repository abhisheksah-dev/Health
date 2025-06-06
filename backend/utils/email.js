const nodemailer = require('nodemailer');
const AppError = require('./appError');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    },
    // For development with mailtrap, ignore TLS
    ...(process.env.NODE_ENV === 'development' && {
        tls: {
            rejectUnauthorized: false
        }
    })
});

const sendEmail = async (mailOptions) => {
    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(`Error sending email to ${mailOptions.to}:`, error);
        // Do not throw a generic error, let the caller decide how to handle it.
        // It's often better to log the error and not fail the entire request.
        // For critical emails like verification, the caller will handle the error.
        throw new AppError(`Error sending email: ${error.message}`, 500);
    }
};


// Send verification email
exports.sendVerificationEmail = async (email, verificationURL) => {
    const mailOptions = {
        from: `"Health Platform" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
            <h1>Welcome to Health Platform!</h1>
            <p>Please verify your email address by clicking the link below:</p>
            <a href="${verificationURL}" style="
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                padding: 14px 20px;
                text-decoration: none;
                border-radius: 4px;
                margin: 20px 0;
            ">Verify Email</a>
            <p>If you did not create an account, please ignore this email.</p>
            <p>This link will expire in 24 hours.</p>
        `
    };

    await sendEmail(mailOptions).catch(err => {
        console.error('Error sending verification email:', err);
        // The controller will catch this and respond to the user
        throw new AppError('Could not send verification email. Please try again later.', 500);
    });
};

// Send password reset email
exports.sendPasswordResetEmail = async (email, resetURL) => {
    const mailOptions = {
        from: `"Health Platform" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Reset Your Password',
        html: `
            <h1>Password Reset Request</h1>
            <p>You requested to reset your password. Click the link below to proceed:</p>
            <a href="${resetURL}" style="
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                padding: 14px 20px;
                text-decoration: none;
                border-radius: 4px;
                margin: 20px 0;
            ">Reset Password</a>
            <p>If you did not request a password reset, please ignore this email.</p>
            <p>This link will expire in 10 minutes.</p>
        `
    };

    await sendEmail(mailOptions).catch(err => {
        console.error('Error sending password reset email:', err);
        throw new AppError('Could not send password reset email. Please try again later.', 500);
    });
};

// Send appointment confirmation email
exports.sendAppointmentConfirmation = async (email, appointmentDetails) => {
    const mailOptions = {
        from: `"Health Platform" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Appointment Confirmation',
        html: `
            <h1>Appointment Confirmed</h1>
            <p>Your appointment has been confirmed with the following details:</p>
            <div style="
                background-color: #f9f9f9;
                padding: 20px;
                border-radius: 4px;
                margin: 20px 0;
            ">
                <p><strong>Doctor:</strong> ${appointmentDetails.doctorName}</p>
                <p><strong>Date:</strong> ${new Date(appointmentDetails.date).toDateString()}</p>
                <p><strong>Time:</strong> ${appointmentDetails.time}</p>
                <p><strong>Location:</strong> ${appointmentDetails.location}</p>
            </div>
            <p>Please arrive 10 minutes before your scheduled time.</p>
            <p>If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
        `
    };
    
    // This is a notification, so we can log the error without failing the request
    await sendEmail(mailOptions).catch(err => console.error('Failed to send appointment confirmation:', err.message));
};

// Send health alert email
exports.sendHealthAlert = async (email, alertDetails) => {
    const mailOptions = {
        from: `"Health Platform" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Health Alert',
        html: `
            <h1>Health Alert</h1>
            <div style="
                background-color: #fff3cd;
                border: 1px solid #ffeeba;
                color: #856404;
                padding: 20px;
                border-radius: 4px;
                margin: 20px 0;
            ">
                <h2>${alertDetails.title}</h2>
                <p>${alertDetails.message}</p>
                ${alertDetails.recommendation ? `<p><strong>Recommendation:</strong> ${alertDetails.recommendation}</p>` : ''}
            </div>
            <p>Please take appropriate action as recommended.</p>
            <p>If you have any concerns, please contact your healthcare provider.</p>
        `
    };

    // This is a notification, so we can log the error without failing the request
    await sendEmail(mailOptions).catch(err => console.error('Failed to send health alert:', err.message));
};