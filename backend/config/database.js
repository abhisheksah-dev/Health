const mongoose = require('mongoose');
const AppError = require('../utils/appError');

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new AppError('MONGODB_URI not defined in environment variables', 500);
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected.');
        });

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('🔌 MongoDB connection closed through app termination');
            process.exit(0);
        });

        return conn;
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error.message);
        // We throw the error so the server startup process can handle it
        throw error;
    }
};

module.exports = connectDB;