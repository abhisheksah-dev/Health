const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const MentalHealthProfessional = require('../models/MentalHealthProfessional');
const User = require('../models/User');

describe('Mental Health Professional API', () => {
  let testUser;
  let testProfessional;
  let testAdmin;
  let userToken;
  let adminToken;

  beforeEach(async () => {
    const userAuth = await createAuthenticatedRequest('mental-health-professional');
    testUser = userAuth.user;
    userToken = userAuth.token;
    
    const adminAuth = await createAuthenticatedRequest('admin');
    testAdmin = adminAuth.user;
    adminToken = adminAuth.token;

    testProfessional = await MentalHealthProfessional.create({
        user: testUser._id,
        specializations: ['Anxiety', 'Depression'],
        yearsOfExperience: 5,
        location: {
            type: 'Point',
            coordinates: [72.8777, 19.0760] // Mumbai coordinates
        },
        isActive: true,
        isVerified: true
    });
  });

  describe('GET /api/v1/mental-health/nearest', () => {
    it('should find nearest professionals', async () => {
      const res = await request(app)
        .get('/api/v1/mental-health/nearest')
        .query({
          longitude: 72.8777,
          latitude: 19.0760,
          maxDistance: 50000
        })
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.professionals)).toBe(true);
      expect(res.body.data.professionals.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/mental-health/nearest')
        .query({
          longitude: 72.8777,
          latitude: 19.0760
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/mental-health', () => {
    it('should create new professional profile', async () => {
      // Create a new user for this test to avoid profile conflict
      const newUserAuth = await createAuthenticatedRequest('mental-health-professional', 'newprof@example.com');

      const profileData = {
        specializations: ['Trauma', 'PTSD'],
        yearsOfExperience: 3,
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760]
        }
      };

      const res = await request(app)
        .post('/api/v1/mental-health')
        .set('Authorization', `Bearer ${newUserAuth.token}`)
        .send(profileData);
      
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.profile.specializations).toContain('Trauma');
    });

    it('should require mental health professional role', async () => {
      const regularUserAuth = await createAuthenticatedRequest('user');
      const res = await request(app)
        .post('/api/v1/mental-health')
        .set('Authorization', `Bearer ${regularUserAuth.token}`)
        .send({});

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/mental-health/:id/verify', () => {
    it('should verify professional profile', async () => {
      const res = await request(app)
        .patch(`/api/v1/mental-health/${testProfessional._id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.profile.isVerified).toBe(true);
    });

    it('should require admin role', async () => {
      const res = await request(app)
        .patch(`/api/v1/mental-health/${testProfessional._id}/verify`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/mental-health/stats', () => {
    it('should get professional statistics', async () => {
      const res = await request(app)
        .get('/api/v1/mental-health/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.stats).toBeDefined();
    });
  });

  describe('PATCH /api/v1/mental-health/:id', () => {
    it('should update professional profile', async () => {
      const updateData = {
        specializations: ['Anxiety', 'Depression', 'Stress Management'],
        yearsOfExperience: 6
      };

      const res = await request(app)
        .patch(`/api/v1/mental-health/${testProfessional._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.data.profile.yearsOfExperience).toBe(6);
      expect(res.body.data.profile.specializations).toContain('Stress Management');
    });

    it('should not allow unauthorized updates', async () => {
      const otherUserAuth = await createAuthenticatedRequest('mental-health-professional', 'other@example.com');
      
      const res = await request(app)
        .patch(`/api/v1/mental-health/${testProfessional._id}`)
        .set('Authorization', `Bearer ${otherUserAuth.token}`)
        .send({ yearsOfExperience: 10 });

      expect(res.status).toBe(403);
    });
  });
});