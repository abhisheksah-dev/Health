const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const MentalHealthProfessional = require('../models/MentalHealthProfessional');

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
    for (const collection of collections) {
        await collection.deleteMany({});
    }
});

// Disconnect and stop server
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// Helper function to create a test user and associated profiles
global.createTestUser = async (role = 'patient', email, name) => {
    const userData = {
        name: name || 'Test User',
        email: email || `${role}-${Date.now()}@example.com`,
        password: 'Password123!',
        role: role,
        phoneNumber: `+1234567${Math.floor(Math.random() * 9000) + 1000}`,
        dateOfBirth: '1990-01-01',
        gender: 'male',
        address: { street: '123 Test St', city: 'Test City', state: 'TS', country: 'Testland', zipCode: '12345' }
    };

    const user = await User.create(userData);

    if (role === 'doctor') {
        const doctorProfile = await Doctor.create({
            user: user._id,
            specializations: [{ name: 'Cardiology', verified: true }],
            registrationNumber: `REG-${Date.now()}`,
            council: { name: 'Medical Council of Testland', year: 2010, country: 'Testland' },
            qualifications: [{ degree: 'MD', institution: 'Test University', year: 2010, country: 'Testland' }],
            consultationFee: 150
        });
        return { user, doctorProfile };
    }

    if (role === 'mental-health-professional') {
        const professionalProfile = await MentalHealthProfessional.create({
            userId: user._id,
            specialization: ['Anxiety', 'Depression'],
            experience: { years: 5, description: 'Vast experience.' },
            location: { type: 'Point', coordinates: [0, 0] }
        });
        return { user, professionalProfile };
    }

    return { user };
};

// Helper function to generate JWT token
global.generateToken = (user) => {
    return jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
    );
};

// Helper function to create authenticated request context
global.createAuthenticatedRequest = async (role = 'patient', email, name) => {
    const profiles = await createTestUser(role, email, name);
    const token = generateToken(profiles.user);
    return { ...profiles, token };
};