const express = require('express');
const doctorController = require('../controllers/doctorController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes accessible by anyone
router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctor);
router.get('/specialization/:specialization', doctorController.getDoctorsBySpecialization);
router.get('/facility/:facilityId', doctorController.getDoctorsByFacility);
router.get('/:id/availability', doctorController.getAvailability);

// All routes after this middleware are protected (require login)
router.use(protect);

// Routes for doctors to manage their own profile
router.post(
    '/', 
    restrictTo('doctor', 'admin'), 
    doctorController.createDoctor
);

router.patch(
    '/:id',
    restrictTo('doctor', 'admin'),
    doctorController.updateDoctor
);

router.delete(
    '/:id',
    restrictTo('doctor', 'admin'),
    doctorController.deleteDoctor
);

router.patch(
    '/:id/schedule',
    restrictTo('doctor', 'admin'),
    doctorController.updateSchedule
);

router.post(
    '/:id/facilities',
    restrictTo('doctor', 'admin'),
    doctorController.addFacility
);

router.delete(
    '/:id/facilities/:facilityId',
    restrictTo('doctor', 'admin'),
    doctorController.removeFacility
);

router.patch(
    '/:id/rating',
    doctorController.updateRating // Any logged-in user can rate
);


module.exports = router;