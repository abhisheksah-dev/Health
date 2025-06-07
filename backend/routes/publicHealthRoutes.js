const express = require('express');
const router = express.Router();
const publicHealthController = require('../controllers/publicHealthController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Restrict to admin and health officials
router.use(restrictTo('admin', 'healthOfficial'));

// Get overall health statistics
router.get('/stats', publicHealthController.getHealthStats);

// Get disease prevalence statistics
router.get('/disease-prevalence', publicHealthController.getDiseasePrevalence);

// Get regional health insights
router.get('/regional-insights', publicHealthController.getRegionalInsights);

module.exports = router; 