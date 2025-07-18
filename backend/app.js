const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const AppError = require('./utils/appError');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173', // Fallback for frontend dev server
    credentials: true
}));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 200, // limit each IP to 200 requests per windowMs
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is running'
    });
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bloodDonorRoutes = require('./routes/bloodDonorRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const geoFenceRoutes = require('./routes/geoFenceRoutes');
const telemedicineRoutes = require('./routes/telemedicineRoutes');
const medicationReminderRoutes = require('./routes/medicationReminderRoutes');
const emergencySOSRoutes = require('./routes/emergencySOSRoutes');
const healthRecordRoutes = require('./routes/healthRecordRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const chatRoutes = require('./routes/chatRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const mentalHealthRoutes = require('./routes/mentalHealthRoutes');
const ngoRoutes = require('./routes/ngoRoutes');
const publicHealthRoutes = require('./routes/publicHealthRoutes');
const labReportRoutes = require('./routes/labReportRoutes');
const governmentSchemeRoutes = require('./routes/governmentSchemeRoutes');
const healthEducationRoutes = require('./routes/healthEducationRoutes');
const clinicRoutes = require('./routes/clinicRoutes'); // Assuming you have clinic routes
const hospitalRoutes = require('./routes/hospitalRoutes'); // Assuming you have hospital routes


// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/blood-donors', bloodDonorRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/geo-fences', geoFenceRoutes);
app.use('/api/v1/telemedicine', telemedicineRoutes);
app.use('/api/v1/medication-reminders', medicationReminderRoutes);
app.use('/api/v1/emergency-sos', emergencySOSRoutes);
app.use('/api/v1/health-records', healthRecordRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/emergency', emergencyRoutes);
app.use('/api/v1/mental-health', mentalHealthRoutes);
app.use('/api/v1/ngos', ngoRoutes);
app.use('/api/v1/public-health', publicHealthRoutes);
app.use('/api/v1/lab-reports', labReportRoutes);
app.use('/api/v1/government-schemes', governmentSchemeRoutes);
app.use('/api/v1/health-education', healthEducationRoutes);
app.use('/api/v1/clinics', clinicRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);


// Error handling middleware for unhandled routes
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

module.exports = app;