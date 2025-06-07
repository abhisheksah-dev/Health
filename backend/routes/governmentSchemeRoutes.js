const express = require('express');
const router = express.Router();
const governmentSchemeController = require('../controllers/governmentSchemeController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Public routes (require authentication)
router.get('/search', governmentSchemeController.searchSchemes);
router.get('/stats', governmentSchemeController.getSchemeStats);
router.get('/upcoming', governmentSchemeController.getUpcomingSchemes);
router.get('/state/:state', governmentSchemeController.getActiveSchemesByState);

router
  .route('/')
  .get(governmentSchemeController.getAllSchemes)
  .post(protect, restrictTo('admin'), governmentSchemeController.createScheme);

router
  .route('/:id')
  .get(governmentSchemeController.getScheme)
  .patch(protect, restrictTo('admin'), governmentSchemeController.updateScheme)
  .delete(protect, restrictTo('admin'), governmentSchemeController.deleteScheme);

module.exports = router; 