const express = require('express');
const router = express.Router();
const ngoController = require('../controllers/ngoController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Public routes (require authentication but no role restriction)
router.get('/nearest', ngoController.findNearestNGOs);
router.get('/stats', ngoController.getNGOStats);

// Routes requiring NGO role
router.use(restrictTo('ngo', 'admin'));

router
  .route('/')
  .get(ngoController.getAllNGOs)
  .post(ngoController.createProfile);

router
  .route('/:id')
  .get(ngoController.getProfile)
  .patch(ngoController.updateProfile)
  .delete(ngoController.deleteProfile);

router
  .route('/:id/status')
  .patch(ngoController.updateStatus);

// Admin only routes
router.use(restrictTo('admin'));

router
  .route('/:id/verify')
  .patch(ngoController.verifyNGO);

module.exports = router; 