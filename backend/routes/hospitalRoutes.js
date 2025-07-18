const express = require('express');
const hospitalController = require('../controllers/hospitalController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// Public routes
router.get('/', hospitalController.getAllHospitals);
router.get('/:id', hospitalController.getHospital);
router.get('/location', hospitalController.getHospitalsByLocation);
router.get('/department/:department', hospitalController.getHospitalsByDepartment);
router.get('/insurance', hospitalController.getHospitalsByInsurance);

// Review routes for a specific hospital
router.get('/:id/reviews', reviewController.getEntityReviews);

// Protected routes
router.use(protect);

router.post('/', restrictTo('admin'), hospitalController.createHospital);

router
  .route('/:id')
  .patch(restrictTo('admin'), hospitalController.updateHospital)
  .delete(restrictTo('admin'), hospitalController.deleteHospital);
  
router.post('/:id/departments', restrictTo('admin'), hospitalController.addDepartment);
router.patch('/:id/departments/:departmentId', restrictTo('admin'), hospitalController.updateDepartment);
router.delete('/:id/departments/:departmentId', restrictTo('admin'), hospitalController.removeDepartment);

router.post('/:id/doctors', restrictTo('admin'), hospitalController.addDoctor);
router.delete('/:id/doctors/:doctorId', restrictTo('admin'), hospitalController.removeDoctor);

router.patch('/:id/verify', restrictTo('admin'), hospitalController.updateVerification);

module.exports = router;