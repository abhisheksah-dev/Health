const express = require('express');
const clinicController = require('../controllers/clinicController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// Public routes
router.get('/', clinicController.getAllClinics);
router.get('/:id', clinicController.getClinic);
router.get('/location', clinicController.getClinicsByLocation);
router.get('/specialization/:specialization', clinicController.getClinicsBySpecialization);
router.get('/insurance', clinicController.getClinicsByInsurance);

// Review routes for a specific clinic
router.get('/:id/reviews', reviewController.getEntityReviews);

// Protected routes
router.use(protect);

router.post('/', restrictTo('admin'), clinicController.createClinic);

router
  .route('/:id')
  .patch(restrictTo('admin'), clinicController.updateClinic)
  .delete(restrictTo('admin'), clinicController.deleteClinic);

router.post('/:id/doctors', restrictTo('admin'), clinicController.addDoctor);
router.delete('/:id/doctors/:doctorId', restrictTo('admin'), clinicController.removeDoctor);

router.patch('/:id/verify', restrictTo('admin'), clinicController.updateVerification);

module.exports = router;