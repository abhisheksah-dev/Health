const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');

// Ensure a dummy file exists for testing uploads
const fixturesDir = path.join(__dirname, 'fixtures');
const dummyPdfPath = path.join(fixturesDir, 'test.pdf');
if (!fs.existsSync(fixturesDir)) fs.mkdirSync(fixturesDir);
if (!fs.existsSync(dummyPdfPath)) fs.writeFileSync(dummyPdfPath, 'dummy pdf content');


describe('Appointment Endpoints', () => {
    let patient, doctorProfile, patientToken, doctorToken, appointmentId, clinic;

    beforeEach(async () => {
        const patientAuth = await createAuthenticatedRequest('patient');
        patient = patientAuth.user;
        patientToken = patientAuth.token;
        
        const doctorAuth = await createAuthenticatedRequest('doctor');
        doctorToken = doctorAuth.token;
        doctorProfile = doctorAuth.doctorProfile;
        
        clinic = await Clinic.create({
            name: "Test Health Clinic",
            userId: new mongoose.Types.ObjectId(),
            type: 'specialty',
            registrationNumber: `CLINIC-${Date.now()}`,
            establishedYear: 2020,
            address: { street: '1 Health Way', city: 'Testville', state: 'TS', country: 'Testland', zipCode: '54321', coordinates: { type: 'Point', coordinates: [0, 0] } },
            contact: { phone: ['+19876543210'], email: 'clinic@test.com' }
        });

        doctorProfile.facilities.push({ type: 'clinic', id: clinic._id, isActive: true });
        await doctorProfile.save();
        
        const appointment = await Appointment.create({
            patient: patient._id,
            doctor: doctorProfile._id,
            facility: { type: 'clinic', id: clinic._id },
            date: '2024-08-20T00:00:00.000Z',
            startTime: '10:00',
            endTime: '11:00',
            type: 'consultation',
            reason: 'Initial Test appointment'
        });
        appointmentId = appointment._id;
    });

    describe('POST /api/v1/appointments', () => {
        it('should create a new appointment with a document', async () => {
            const facilityData = JSON.stringify({ type: 'clinic', id: clinic._id });

            const res = await request(app)
                .post('/api/v1/appointments')
                .set('Authorization', `Bearer ${patientToken}`)
                .field('doctor', doctorProfile._id.toString())
                .field('facility', facilityData)
                .field('date', '2024-09-21')
                .field('startTime', '10:00')
                .field('endTime', '11:00')
                .field('type', 'consultation')
                .field('reason', 'Follow-up checkup')
                .attach('documents', dummyPdfPath);

            expect(res.statusCode).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.appointment).toHaveProperty('_id');
            expect(res.body.data.appointment.documents).toHaveLength(1);
            expect(res.body.data.appointment.documents[0].name).toBe('test.pdf');
        });

        it('should not create appointment with invalid data', async () => {
            const res = await request(app)
                .post('/api/v1/appointments')
                .set('Authorization', `Bearer ${patientToken}`)
                .send({
                    doctor: doctorProfile._id,
                    date: 'invalid-date',
                    startTime: '25:00',
                    endTime: '11:00',
                    type: 'invalid-type',
                    reason: ''
                });
            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe('fail');
        });
    });

    describe('GET /api/v1/appointments/my-appointments', () => {
        it('should get patient appointments', async () => {
            const res = await request(app)
                .get('/api/v1/appointments/my-appointments')
                .set('Authorization', `Bearer ${patientToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.data.appointments)).toBe(true);
            expect(res.body.data.appointments.length).toBeGreaterThan(0);
        });

        it('should get doctor appointments', async () => {
            const res = await request(app)
                .get('/api/v1/appointments/my-appointments')
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.data.appointments)).toBe(true);
            expect(res.body.data.appointments.length).toBeGreaterThan(0);
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
            expect(res.body.status).toBe('fail');
        });
    });

    describe('GET /api/v1/appointments/available-slots', () => {
        it('should get available slots for a doctor', async () => {
            const res = await request(app)
                .get('/api/v1/appointments/available-slots')
                .query({
                    doctorId: doctorProfile._id,
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
            expect(res.body.status).toBe('fail');
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
            expect(res.body.status).toBe('fail');
        });
    });
});