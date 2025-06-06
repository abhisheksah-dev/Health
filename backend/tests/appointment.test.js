const request = require('supertest');
const app = require('../app');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

describe('Appointment Endpoints', () => {
    let patientToken;
    let doctorToken;
    let doctorId;
    let appointmentId;

    beforeEach(async () => {
        // Create test patient and doctor
        const { token: pToken } = await createAuthenticatedRequest('patient');
        const { token: dToken, user: doctor } = await createAuthenticatedRequest('doctor');
        
        patientToken = pToken;
        doctorToken = dToken;
        doctorId = doctor._id;
    });

    describe('POST /api/v1/appointments', () => {
        it('should create a new appointment', async () => {
            const res = await request(app)
                .post('/api/v1/appointments')
                .set('Authorization', `Bearer ${patientToken}`)
                .send({
                    doctor: doctorId,
                    date: '2024-03-20',
                    startTime: '10:00',
                    endTime: '11:00',
                    type: 'consultation',
                    reason: 'Regular checkup'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.appointment).toHaveProperty('_id');
            appointmentId = res.body.data.appointment._id;
        });

        it('should not create appointment with invalid data', async () => {
            const res = await request(app)
                .post('/api/v1/appointments')
                .set('Authorization', `Bearer ${patientToken}`)
                .send({
                    doctor: doctorId,
                    date: 'invalid-date',
                    startTime: '25:00',
                    endTime: '11:00',
                    type: 'invalid-type',
                    reason: ''
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe('error');
        });
    });

    describe('GET /api/v1/appointments/my-appointments', () => {
        beforeEach(async () => {
            // Create a test appointment
            await Appointment.create({
                patient: (await createTestUser('patient'))._id,
                doctor: doctorId,
                date: '2024-03-20',
                startTime: '10:00',
                endTime: '11:00',
                type: 'consultation',
                reason: 'Test appointment'
            });
        });

        it('should get patient appointments', async () => {
            const res = await request(app)
                .get('/api/v1/appointments/my-appointments')
                .set('Authorization', `Bearer ${patientToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.data.appointments)).toBe(true);
        });

        it('should get doctor appointments', async () => {
            const res = await request(app)
                .get('/api/v1/appointments/my-appointments')
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.data.appointments)).toBe(true);
        });
    });

    describe('PATCH /api/v1/appointments/:id/status', () => {
        it('should update appointment status', async () => {
            const res = await request(app)
                .patch(`/api/v1/appointments/${appointmentId}/status`)
                .set('Authorization', `Bearer ${doctorToken}`)
                .send({
                    status: 'confirmed'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.appointment.status).toBe('confirmed');
        });

        it('should require cancellation reason when cancelling', async () => {
            const res = await request(app)
                .patch(`/api/v1/appointments/${appointmentId}/status`)
                .set('Authorization', `Bearer ${doctorToken}`)
                .send({
                    status: 'cancelled'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe('error');
        });
    });

    describe('GET /api/v1/appointments/available-slots', () => {
        it('should get available slots for a doctor', async () => {
            const res = await request(app)
                .get('/api/v1/appointments/available-slots')
                .query({
                    doctorId: doctorId,
                    date: '2024-03-20'
                })
                .set('Authorization', `Bearer ${patientToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.data.availableSlots)).toBe(true);
        });

        it('should require doctor ID and date', async () => {
            const res = await request(app)
                .get('/api/v1/appointments/available-slots')
                .set('Authorization', `Bearer ${patientToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe('error');
        });
    });

    describe('GET /api/v1/appointments/stats', () => {
        it('should get appointment statistics for doctor', async () => {
            const res = await request(app)
                .get('/api/v1/appointments/stats')
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveProperty('totalAppointments');
            expect(res.body.data).toHaveProperty('statusCounts');
            expect(res.body.data).toHaveProperty('completionRate');
        });

        it('should not allow patients to access stats', async () => {
            const res = await request(app)
                .get('/api/v1/appointments/stats')
                .set('Authorization', `Bearer ${patientToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.status).toBe('error');
        });
    });
}); 