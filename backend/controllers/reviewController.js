const Review = require('../models/Review');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const { sendNotification } = require('../utils/notifications');

// Get all reviews for an entity
exports.getEntityReviews = catchAsync(async (req, res, next) => {
  const { entityType, entityId } = req.params;
  const { sort = '-date', filter, limit = 10, page = 1 } = req.query;

  // Build query
  const query = { entityType, entityId, status: 'active' };
  if (filter) {
    switch (filter) {
      case 'positive':
        query.rating = { $gte: 4 };
        break;
      case 'negative':
        query.rating = { $lte: 2 };
        break;
      case 'neutral':
        query.rating = { $gt: 2, $lt: 4 };
        break;
    }
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const reviews = await Review.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('userId', 'name avatar')
    .populate('likes', 'name');

  const total = await Review.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get all reviews by the authenticated user
exports.getMyReviews = catchAsync(async (req, res, next) => {
  const { entityType, sort = '-date', limit = 10, page = 1 } = req.query;

  // Build query
  const query = { userId: req.user.id };
  if (entityType) query.entityType = entityType;

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const reviews = await Review.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('entityId', 'name');

  const total = await Review.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get a specific review
exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id)
    .populate('userId', 'name avatar')
    .populate('likes', 'name')
    .populate('entityId', 'name');

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { review }
  });
});

// Create a new review
exports.createReview = catchAsync(async (req, res, next) => {
  // Check if user has already reviewed this entity
  const existingReview = await Review.findOne({
    userId: req.user.id,
    entityType: req.body.entityType,
    entityId: req.body.entityId
  });

  if (existingReview) {
    return next(new AppError('You have already reviewed this entity', 400));
  }

  // Add user ID to the review
  req.body.userId = req.user.id;

  // Handle image uploads if any
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map(file => 
      uploadToCloudinary(file.path, 'reviews')
    );
    const uploadResults = await Promise.all(uploadPromises);
    
    req.body.images = uploadResults.map(result => ({
      url: result.secure_url,
      publicId: result.public_id
    }));
  }

  const review = await Review.create(req.body);

  // Send notification to entity owner
  const entity = await getEntityModel(req.body.entityType).findById(req.body.entityId);
  if (entity && entity.userId) {
    await sendNotification({
      userId: entity.userId,
      type: 'new_review',
      title: 'New Review Received',
      message: `${req.user.name} has reviewed your ${req.body.entityType}`,
      data: { reviewId: review._id }
    });
  }

  res.status(201).json({
    status: 'success',
    data: { review }
  });
});

// Update a review
exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!review) {
    return next(new AppError('Review not found or access denied', 404));
  }

  // Handle image uploads if any
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map(file => 
      uploadToCloudinary(file.path, 'reviews')
    );
    const uploadResults = await Promise.all(uploadPromises);
    
    req.body.images = [
      ...(review.images || []),
      ...uploadResults.map(result => ({
        url: result.secure_url,
        publicId: result.public_id
      }))
    ];
  }

  // Update review
  Object.assign(review, req.body);
  await review.save();

  res.status(200).json({
    status: 'success',
    data: { review }
  });
});

// Delete a review
exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!review) {
    return next(new AppError('Review not found or access denied', 404));
  }

  // Delete associated images from cloud storage
  if (review.images && review.images.length > 0) {
    const deletePromises = review.images.map(image =>
      deleteFromCloudinary(image.publicId)
    );
    await Promise.all(deletePromises);
  }

  await review.remove();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Report a review
exports.reportReview = catchAsync(async (req, res, next) => {
  const { reason, details } = req.body;

  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  // Check if user has already reported this review
  const existingReport = review.reports.find(
    report => report.userId.toString() === req.user.id
  );

  if (existingReport) {
    return next(new AppError('You have already reported this review', 400));
  }

  // Add report
  review.reports.push({
    userId: req.user.id,
    reason,
    details,
    status: 'pending'
  });

  await review.save();

  // Notify admins
  const admins = await User.find({ role: 'admin' });
  await Promise.all(
    admins.map(admin =>
      sendNotification({
        userId: admin._id,
        type: 'review_reported',
        title: 'Review Reported',
        message: `A review has been reported for ${reason}`,
        data: { reviewId: review._id }
      })
    )
  );

  res.status(200).json({
    status: 'success',
    message: 'Review reported successfully'
  });
});

// Like/Unlike a review
exports.toggleLike = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  const likeIndex = review.likes.indexOf(req.user.id);
  if (likeIndex === -1) {
    // Like the review
    review.likes.push(req.user.id);
  } else {
    // Unlike the review
    review.likes.splice(likeIndex, 1);
  }

  await review.save();

  res.status(200).json({
    status: 'success',
    data: {
      liked: likeIndex === -1,
      likesCount: review.likes.length
    }
  });
});

// Get review statistics for an entity
exports.getReviewStats = catchAsync(async (req, res, next) => {
  const { entityType, entityId } = req.params;

  const stats = await Review.aggregate([
    {
      $match: {
        entityType,
        entityId: mongoose.Types.ObjectId(entityId),
        status: 'active'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: {
            rating: '$rating',
            count: 1
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        averageRating: { $round: ['$averageRating', 1] },
        totalReviews: 1,
        ratingDistribution: {
          $reduce: {
            input: '$ratingDistribution',
            initialValue: {
              1: 0, 2: 0, 3: 0, 4: 0, 5: 0
            },
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $let: {
                    vars: {
                      rating: { $toString: '$$this.rating' }
                    },
                    in: {
                      $setField: {
                        field: '$$rating',
                        input: '$$value',
                        value: { $add: [{ $getField: { field: '$$rating', input: '$$value' } }, '$$this.count'] }
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats: stats[0] || {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    }
  });
});

// Admin: Get all reported reviews
exports.getReportedReviews = catchAsync(async (req, res, next) => {
  const { status, sort = '-date', limit = 10, page = 1 } = req.query;

  // Build query
  const query = { 'reports.0': { $exists: true } };
  if (status) {
    query['reports.status'] = status;
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const reviews = await Review.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('userId', 'name email')
    .populate('reports.userId', 'name email')
    .populate('entityId', 'name');

  const total = await Review.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Admin: Update review report status
exports.updateReportStatus = catchAsync(async (req, res, next) => {
  const { status, action, notes } = req.body;

  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  // Update all reports for this review
  review.reports.forEach(report => {
    report.status = status;
    report.adminNotes = notes;
    report.resolvedAt = Date.now();
    report.resolvedBy = req.user.id;
  });

  // Take action if specified
  if (action) {
    switch (action) {
      case 'delete_review':
        review.status = 'deleted';
        break;
      case 'warn_user':
        await sendNotification({
          userId: review.userId,
          type: 'review_warning',
          title: 'Review Warning',
          message: 'Your review has been flagged for inappropriate content. Please review our community guidelines.',
          data: { reviewId: review._id }
        });
        break;
    }
  }

  await review.save();

  res.status(200).json({
    status: 'success',
    message: 'Report status updated successfully'
  });
});

// Helper function to get the correct model based on entity type
function getEntityModel(entityType) {
  const models = {
    doctor: require('../models/Doctor'),
    hospital: require('../models/Hospital'),
    clinic: require('../models/Clinic'),
    pharmacy: require('../models/Pharmacy'),
    laboratory: require('../models/Laboratory'),
    diagnostic_center: require('../models/DiagnosticCenter'),
    ngo: require('../models/NGO')
  };
  return models[entityType];
} 