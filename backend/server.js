const app = require('./app');
const connectDB = require('./config/database');

const startServer = async () => {
    try {
        await connectDB();

        const port = process.env.PORT || 7000;
        const server = app.listen(port, () => {
            console.log(`🚀 Server running on port ${port} in ${process.env.NODE_ENV} mode`);
        });

        process.on('unhandledRejection', (err) => {
            console.error('UNHANDLED REJECTION! 💥 Shutting down...');
            console.error(err.name, err.message);
            server.close(() => {
                process.exit(1);
            });
        });

        process.on('uncaughtException', (err) => {
            console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
            console.error(err.name, err.message);
            server.close(() => {
                process.exit(1);
            });
        });

        process.on('SIGTERM', () => {
            console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
            server.close(() => {
                console.log('💥 Process terminated!');
            });
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();