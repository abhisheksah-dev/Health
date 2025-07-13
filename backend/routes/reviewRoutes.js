const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const reviewController = require('../controllers/reviewController');
// Corrected: Changed 'authorize' to 'restrictTo'
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validation');
const validateRequest = require('../middleware/validateRequest');

// Validation middleware
const reviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('content')
    .isString()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Review content must be between 10 and 1000 characters'),
  body('entityType')
    .isIn(['doctor', 'hospital', 'clinic', 'pharmacy', 'laboratory', 'diagnostic_center', 'ngo'])
    .withMessage('Invalid entity type'),
  body('entityId')
    .isMongoId()
    .withMessage('Invalid entity ID'),
  body('anonymous')
    .optional()
    .isBoolean()
    .withMessage('Anonymous must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .trim()
    .withMessage('Each tag must be a string'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  validateRequest
];

// Routes
router.use(protect);

// Get all reviews for an entity
router.get('/entity/:entityType/:entityId', [
  param('entityType').isIn(['doctor', 'hospital', 'clinic', 'pharmacy', 'laboratory', 'diagnostic_center', 'ngo']),
  param('entityId').custom(id => validateObjectId(id, 'Review')), // Adjusted to Review for this context
  query('sort').optional().isIn(['rating', '-rating', 'date', '-date']),
  query('filter').optional().isIn(['positive', 'negative', 'neutral']),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('page').optional().isInt({ min: 1 }),
  validateRequest
], reviewController.getEntityReviews);

// Get all reviews by the authenticated user
router.get('/my-reviews', [
  query('entityType').optional().isString(),
  query('sort').optional().isIn(['rating', '-rating', 'date', '-date']),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('page').optional().isInt({ min: 1 }),
  validateRequest
], reviewController.getMyReviews);

// Get a specific review
router.get('/:id', [
  param('id').custom(id => validateObjectId(id, 'Review')),
  validateRequest
], reviewController.getReview);

// Create a new review
router.post('/', reviewValidation, reviewController.createReview);

// Update a review
router.patch('/:id', [
  param('id').custom(id => validateObjectId(id, 'Review')),
  ...reviewValidation
], reviewController.updateReview);

// Delete a review
router.delete('/:id', [
  param('id').custom(id => validateObjectId(id, 'Review')),
  validateRequest
], reviewController.deleteReview);

// Report a review
router.post('/:id/report', [
  param('id').custom(id => validateObjectId(id, 'Review')),
  body('reason')
    .isIn(['inappropriate', 'spam', 'fake', 'offensive', 'other'])
    .withMessage('Invalid report reason'),
  body('details')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Report details must not exceed 500 characters'),
  validateRequest
], reviewController.reportReview);

// Like/Unlike a review
router.post('/:id/like', [
  param('id').custom(id => validateObjectId(id, 'Review')),
  validateRequest
], reviewController.toggleLike);

// Get review statistics for an entity
router.get('/stats/:entityType/:entityId', [
  param('entityType').isIn(['doctor', 'hospital', 'clinic', 'pharmacy', 'laboratory', 'diagnostic_center', 'ngo']),
  param('entityId').custom(id => validateObjectId(id, 'Review')), // Adjusted to Review for this context
  validateRequest
], reviewController.getReviewStats);

// Admin routes
router.use(restrictTo('admin'));

// Get all reported reviews
router.get('/admin/reported', [
  query('status').optional().isIn(['pending', 'resolved', 'dismissed']),
  query('sort').optional().isIn(['date', '-date', 'reports', '-reports']),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('page').optional().isInt({ min: 1 }),
  validateRequest
], reviewController.getReportedReviews);

// Update review report status
router.patch('/admin/report/:id', [
  param('id').custom(id => validateObjectId(id, 'Review')),
  body('status')
    .isIn(['resolved', 'dismissed'])
    .withMessage('Invalid status'),
  body('action')
    .optional()
    .isIn(['delete_review', 'warn_user', 'none'])
    .withMessage('Invalid action'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  validateRequest
], reviewController.updateReportStatus);

module.exports = router;