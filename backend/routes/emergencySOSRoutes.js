const express = require('express');
const router = express.Router();
const emergencySOSController = require('../controllers/emergencySOSController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Emergency alert routes
router
  .route('/')
  .get(emergencySOSController.getUserAlerts)
  .post(emergencySOSController.createEmergencyAlert);

router
  .route('/active')
  .get(emergencySOSController.getActiveAlerts);

router
  .route('/:id')
  .get(emergencySOSController.getAlert)
  .patch(emergencySOSController.updateAlertStatus);

// Admin routes
router.use(restrictTo('admin'));
router.get('/stats', emergencySOSController.getAlertStats);

module.exports = router; 