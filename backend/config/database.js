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
            console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
        });

        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('🔌 MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                console.error('Error during MongoDB disconnection:', err);
                process.exit(1);
            }
        });

        return conn;
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
        throw new AppError('Database connection failed', 500);
    }
};

module.exports = connectDB;
