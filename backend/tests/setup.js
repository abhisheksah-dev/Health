const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

let mongoServer;

// Connect to the in-memory database
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

// Clear database between tests
beforeEach(async () => {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
        await collection.deleteMany({});
    }
});

// Disconnect and stop server
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// Helper function to create a test user
global.createTestUser = async (role = 'patient') => {
    const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        role: role,
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            zipCode: '12345'
        }
    };

    if (role === 'doctor') {
        return await Doctor.create({
            ...userData,
            specialization: 'Test Specialization',
            licenseNumber: 'TEST123',
            qualifications: [{
                degree: 'MD',
                institution: 'Test University',
                year: 2010
            }],
            clinicDetails: {
                name: 'Test Clinic',
                consultationFee: 100
            }
        });
    }

    return await User.create(userData);
};

// Helper function to generate JWT token
global.generateToken = (user) => {
    return jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
    );
};

// Helper function to create authenticated request
global.createAuthenticatedRequest = async (role = 'patient') => {
    const user = await createTestUser(role);
    const token = generateToken(user);
    return {
        user,
        token,
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
}; 