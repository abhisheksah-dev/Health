// ./routes/healthEducationRoutes.js

const express = require('express');
const { query } = require('express-validator');
const router = express.Router();
const healthEducationController = require('../controllers/healthEducationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

// --- Public Routes (No authentication required) ---

// Search for content using a natural language query (powered by Gemini AI)
router.get(
    '/search',
    [
        query('search')
            .trim()
            .notEmpty()
            .withMessage('A search query parameter is required.')
    ],
    validateRequest,
    healthEducationController.searchContent
);

// Get trending articles
router.get('/trending', healthEducationController.getTrendingContent);

// Get content statistics
router.get('/stats', healthEducationController.getContentStats);

// Get all published articles (with pagination, filtering, etc.)
router.get('/', healthEducationController.getAllContent);

// Get a single article by its ID
router.get('/:id', healthEducationController.getContent);


// --- Protected Routes (Authentication and specific roles required) ---

// The .post() for the '/' route must be protected
router.post(
    '/',
    protect,
    restrictTo('admin', 'content-creator'),
    healthEducationController.createContent
);

// The .patch() and .delete() for the '/:id' route must be protected
router.patch(
    '/:id',
    protect,
    restrictTo('admin', 'content-creator'),
    healthEducationController.updateContent
);

router.delete(
    '/:id',
    protect,
    restrictTo('admin', 'content-creator'),
    healthEducationController.deleteContent
);

module.exports = router;