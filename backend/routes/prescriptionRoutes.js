const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Protect all routes
router.use(protect);

// Upload routes
router.post(
  '/upload',
  upload.single('prescription'),
  prescriptionController.uploadPrescription
);

// User routes
router.get('/my-prescriptions', prescriptionController.getUserPrescriptions);
router.get('/medication-history', prescriptionController.getMedicationHistory);

router
  .route('/:id')
  .get(prescriptionController.getPrescription)
  .patch(
    upload.single('prescription'),
    prescriptionController.updatePrescription
  )
  .delete(prescriptionController.deletePrescription);

router
  .route('/:id/verify')
  .patch(prescriptionController.verifyAnalysis);

// Admin routes
router.use(restrictTo('admin'));
router.get('/stats', prescriptionController.getPrescriptionStats);

module.exports = router; 