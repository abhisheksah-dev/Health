const express = require('express');
const doctorController = require('../controllers/doctorController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctor);

// Protected routes
router.use(protect);

// Doctor's own routes
router.get('/dashboard-stats', restrictTo('doctor'), doctorController.getDoctorDashboardStats);
router.patch('/update-my-profile', restrictTo('doctor'), doctorController.updateDoctor);
router.patch('/update-my-schedule', restrictTo('doctor'), doctorController.updateSchedule);

module.exports = router;