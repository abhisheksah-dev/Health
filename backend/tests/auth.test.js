const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

describe('Authentication Endpoints', () => {
    describe('POST /api/v1/auth/register/patient', () => {
        it('should register a new patient', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register/patient')
                .send({
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'Password123!',
                    phoneNumber: '+1234567890',
                    dateOfBirth: '1990-01-01',
                    gender: 'male',
                    address: {
                        street: '123 Main St',
                        city: 'New York',
                        state: 'NY',
                        country: 'USA',
                        zipCode: '10001'
                    }
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.user).toHaveProperty('_id');
            expect(res.body.data.user.email).toBe('john@example.com');
            expect(res.body.data.user.role).toBe('patient');
            expect(res.body.data.user.password).toBeUndefined();
        });

        it('should not register a patient with invalid data', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register/patient')
                .send({
                    name: 'John Doe',
                    email: 'invalid-email',
                    password: 'weak'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe('error');
        });
    });

    describe('POST /api/v1/auth/register/doctor', () => {
        it('should register a new doctor', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register/doctor')
                .send({
                    name: 'Dr. Jane Smith',
                    email: 'jane@example.com',
                    password: 'Password123!',
                    phoneNumber: '+1234567890',
                    specialization: 'Cardiology',
                    licenseNumber: 'MD123456',
                    qualifications: [{
                        degree: 'MD',
                        institution: 'Harvard Medical School',
                        year: 2010,
                        country: 'USA'
                    }],
                    clinicDetails: {
                        name: 'Heart Care Clinic',
                        consultationFee: 100
                    }
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.user).toHaveProperty('_id');
            expect(res.body.data.user.email).toBe('jane@example.com');
            expect(res.body.data.user.role).toBe('doctor');
            expect(res.body.data.user.password).toBeUndefined();
        });

        it('should not register a doctor with invalid data', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register/doctor')
                .send({
                    name: 'Dr. Jane Smith',
                    email: 'invalid-email',
                    password: 'weak'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe('error');
        });
    });

    describe('POST /api/v1/auth/login', () => {
        beforeEach(async () => {
            await createTestUser('patient');
        });

        it('should login a user with valid credentials', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Password123!'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.token).toBeDefined();
            expect(res.body.data.user.email).toBe('test@example.com');
        });

        it('should not login with invalid credentials', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body.status).toBe('error');
        });
    });

    describe('GET /api/v1/auth/me', () => {
        it('should get current user profile', async () => {
            const { token } = await createAuthenticatedRequest();

            const res = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.user.email).toBe('test@example.com');
        });

        it('should not get profile without authentication', async () => {
            const res = await request(app)
                .get('/api/v1/auth/me');

            expect(res.statusCode).toBe(401);
            expect(res.body.status).toBe('error');
        });
    });

    describe('PATCH /api/v1/auth/update-password', () => {
        it('should update user password', async () => {
            const { token } = await createAuthenticatedRequest();

            const res = await request(app)
                .patch('/api/v1/auth/update-password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: 'Password123!',
                    newPassword: 'NewPassword123!',
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.token).toBeDefined();
        });

        it('should not update password with wrong current password', async () => {
            const { token } = await createAuthenticatedRequest();

            const res = await request(app)
                .patch('/api/v1/auth/update-password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: 'WrongPassword123!',
                    newPassword: 'NewPassword123!',
                });

            expect(res.statusCode).toBe(401);
            expect(res.body.status).toBe('error');
        });
    });
});