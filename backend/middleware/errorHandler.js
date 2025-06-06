const AppError = require('../utils/appError');

// Development error response
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

// Production error response
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } 
    // Programming or other unknown error: don't leak error details
    else {
        // Log error for debugging
        console.error('ERROR 💥', err);

        // Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }
};

// Handle MongoDB duplicate key error
const handleDuplicateFieldsDB = err => {
    const field = Object.keys(err.keyValue)[0];
    const value = Object.values(err.keyValue)[0];
    const message = `An account with that ${field} (${value}) already exists. Please use another value.`;
    return new AppError(message, 400);
};

// Handle MongoDB validation error
const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = () => 
    new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () => 
    new AppError('Your token has expired! Please log in again.', 401);

// Handle MongoDB cast error
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err, name: err.name, message: err.message };

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};

module.exports = errorHandler;