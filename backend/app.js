const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { validationResult } = require('express-validator');
const AppError = require('./utils/appError');
const connectDB = require('./config/database');
require('dotenv').config();

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX || 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Body parser middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Validation result middleware
app.use((req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            errors: errors.array()
        });
    }
    next();
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/v1/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is running'
    });
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const labReportRoutes = require('./routes/labReportRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/lab-reports', labReportRoutes);

// Handle undefined routes - must be after all valid routes
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware - must be last
app.use(errorHandler);

// Start server function
const startServer = async () => {
    try {
        // Connect to MongoDB
        const dbConnection = await connectDB();
        if (!dbConnection) {
            console.error('Failed to connect to MongoDB. Retrying in 5 seconds...');
            setTimeout(startServer, 5000);
            return;
        }

        // Start the server
        const port = process.env.PORT || 7000;
        let server;
        
        const tryStartServer = (portToTry) => {
            return new Promise((resolve, reject) => {
                server = app.listen(portToTry, () => {
                    console.log(`🚀 Server running on port ${portToTry} in ${process.env.NODE_ENV} mode`);
                    resolve(server);
                });

                server.on('error', (error) => {
                    if (error.code === 'EADDRINUSE') {
                        console.log(`Port ${portToTry} is in use, trying ${portToTry + 1}...`);
                        server.close();
                        resolve(null); // Signal to try next port
                    } else {
                        reject(error);
                    }
                });
            });
        };

        // Try ports sequentially until we find an available one
        let currentPort = port;
        while (currentPort < port + 10) { // Try up to 10 ports
            try {
                server = await tryStartServer(currentPort);
                if (server) break; // If server started successfully
                currentPort++;
            } catch (error) {
                console.error('Error starting server:', error);
                process.exit(1);
            }
        }

        if (!server) {
            console.error('Could not find an available port. Please check your system.');
            process.exit(1);
        }

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err) => {
            console.error('UNHANDLED REJECTION! 💥 Shutting down...');
            console.error(err.name, err.message);
            server.close(() => {
                process.exit(1);
            });
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
            console.error(err.name, err.message);
            process.exit(1);
        });

    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

module.exports = app; 