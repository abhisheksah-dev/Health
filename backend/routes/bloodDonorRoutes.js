const express = require('express');
const router = express.Router();
const bloodDonorController = require('../controllers/bloodDonorController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Public routes (require authentication but no role restriction)
router.get('/search', bloodDonorController.searchDonors);
router.get('/nearest', bloodDonorController.findNearestDonors);
router.get('/stats', bloodDonorController.getDonorStats);

router
  .route('/')
  .get(bloodDonorController.getAllDonors)
  .post(bloodDonorController.registerDonor);

router
  .route('/:id')
  .get(bloodDonorController.getDonorProfile)
  .patch(bloodDonorController.updateDonorProfile)
  .delete(bloodDonorController.deleteDonorProfile);

router
  .route('/:id/availability')
  .patch(bloodDonorController.updateAvailability);

module.exports = router; 