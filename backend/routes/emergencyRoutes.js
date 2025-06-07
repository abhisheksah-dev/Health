const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Public routes (require authentication but no role restriction)
router.get('/nearest', emergencyController.findNearestServices);
router.get('/in-area', emergencyController.findServicesInArea);
router.get('/stats', emergencyController.getServiceStats);

// Routes requiring service provider role
router.use(restrictTo('service-provider', 'admin'));

router
  .route('/')
  .get(emergencyController.getAllEmergencyServices)
  .post(emergencyController.createEmergencyService);

router
  .route('/:id')
  .get(emergencyController.getEmergencyService)
  .patch(emergencyController.updateEmergencyService)
  .delete(emergencyController.deleteEmergencyService);

router
  .route('/:id/status')
  .patch(emergencyController.updateServiceStatus);

module.exports = router; 