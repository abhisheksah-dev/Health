const express = require('express');
const router = express.Router();
const mentalHealthController = require('../controllers/mentalHealthController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Public routes (require authentication but no role restriction)
router.get('/nearest', mentalHealthController.findNearestProfessionals);
router.get('/stats', mentalHealthController.getProfessionalStats);

// Routes requiring mental health professional role
router.use(restrictTo('mental-health-professional', 'admin'));

router
  .route('/')
  .get(mentalHealthController.getAllProfessionals)
  .post(mentalHealthController.createProfile);

router
  .route('/:id')
  .get(mentalHealthController.getProfile)
  .patch(mentalHealthController.updateProfile)
  .delete(mentalHealthController.deleteProfile);

// Admin only routes
router.use(restrictTo('admin'));

router
  .route('/:id/verify')
  .patch(mentalHealthController.verifyProfessional);

module.exports = router; 