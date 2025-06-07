const express = require('express');
const router = express.Router();
const geoFenceController = require('../controllers/geoFenceController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Public routes (require authentication)
router.get('/active-alerts', geoFenceController.getActiveAlerts);

// Admin routes
router.use(restrictTo('admin'));

// Geo-fence routes
router
  .route('/')
  .get(geoFenceController.getAllGeoFences)
  .post(geoFenceController.createGeoFence);

router
  .route('/:id')
  .get(geoFenceController.getGeoFence)
  .patch(geoFenceController.updateGeoFence)
  .delete(geoFenceController.deleteGeoFence);

// Alert routes
router
  .route('/:geoFenceId/alerts')
  .get(geoFenceController.getHealthAlerts)
  .post(geoFenceController.createHealthAlert);

router
  .route('/alerts/:alertId/status')
  .patch(geoFenceController.updateAlertStatus);

router.get('/stats', geoFenceController.getAlertStats);

module.exports = router; 