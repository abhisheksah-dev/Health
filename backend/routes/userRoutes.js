const express = require('express');
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes after this middleware are protected
router.use(protect);

// Routes for the currently logged-in user
router.get('/me', userController.getProfile);
router.patch('/me', userController.updateProfile);

// Routes restricted to admin only
router.use(restrictTo('admin'));

router
    .route('/')
    .get(userController.getAllUsers);

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;