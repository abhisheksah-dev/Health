const Review = require('../models/Review');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const { uploadFile, deleteFile } = require('../utils/cloudinary');
const { sendNotification } = require('../utils/notifications');
const mongoose = require('mongoose');

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

// Get all reviews for an entity
exports.getEntityReviews = catchAsync(async (req, res, next) => {
  const { entityType, entityId } = req.params;
  const { sort = '-createdAt', filter, limit = 10, page = 1 } = req.query;

  const query = { entityType, entityId, status: 'approved' };
  if (filter) {
    switch (filter) {
      case 'positive':
        query['rating.overall'] = { $gte: 4 };
        break;
      case 'negative':
        query['rating.overall'] = { $lte: 2 };
        break;
      case 'neutral':
        query['rating.overall'] = { $gt: 2, $lt: 4 };
        break;
    }
  }

  const features = new APIFeatures(Review.find(query), req.query)
    .sort()
    .limitFields()
    .paginate();

  const reviews = await features.query
    .populate('user', 'name avatar')
    .populate('helpful.users', 'name');

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
    const { entityType, sort = '-createdAt', limit = 10, page = 1 } = req.query;
    const query = { user: req.user.id };
    if (entityType) query.entityType = entityType;

    const features = new APIFeatures(Review.find(query), req.query)
        .sort()
        .limitFields()
        .paginate();
    
    const EntityModel = getEntityModel(entityType);
    const reviews = await features.query.populate('entityId', 'name');

    const total = await Review.countDocuments(query);

    res.status(200).json({
        status: 'success',
        results: reviews.length,
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
    .populate('user', 'name avatar')
    .populate('helpful.users', 'name')
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
  const existingReview = await Review.findOne({
    user: req.user.id,
    entityType: req.body.entityType,
    entityId: req.body.entityId
  });

  if (existingReview) {
    return next(new AppError('You have already reviewed this entity', 400));
  }

  req.body.user = req.user.id;
  
  const review = await Review.create(req.body);

  const EntityModel = getEntityModel(req.body.entityType);
  if (EntityModel) {
      const entity = await EntityModel.findById(req.body.entityId);
      if (entity && entity.user) {
        await sendNotification({
          userId: entity.user,
          type: 'review_received',
          title: 'You Received a New Review',
          message: `${req.user.name} has left a review on your profile.`,
          data: { reviewId: review._id }
        });
      }
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
    user: req.user.id
  });

  if (!review) {
    return next(new AppError('Review not found or access denied', 404));
  }

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
    user: req.user.id
  });

  if (!review) {
    return next(new AppError('Review not found or access denied', 404));
  }

  if (review.images && review.images.length > 0) {
    const deletePromises = review.images.map(image =>
      deleteFile(image.publicId)
    );
    await Promise.all(deletePromises);
  }

  await review.deleteOne();

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

  const existingReport = review.report.reasons.find(
    report => report.user.toString() === req.user.id
  );

  if (existingReport) {
    return next(new AppError('You have already reported this review', 400));
  }

  review.report.count += 1;
  review.report.reasons.push({
    user: req.user.id,
    reason,
    details,
    reportedAt: Date.now()
  });

  await review.save();

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

  const likeIndex = review.helpful.users.indexOf(req.user.id);

  if (likeIndex === -1) {
    review.helpful.users.push(req.user.id);
  } else {
    review.helpful.users.splice(likeIndex, 1);
  }
  review.helpful.count = review.helpful.users.length;

  await review.save();

  res.status(200).json({
    status: 'success',
    data: {
      liked: likeIndex === -1,
      likesCount: review.helpful.count
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
        entityId: new mongoose.Types.ObjectId(entityId),
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$rating.overall',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: '$count' },
        averageRating: { $avg: '$_id' },
        ratingDistribution: {
          $push: {
            rating: '$_id',
            count: '$count'
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
          $arrayToObject: {
            $map: {
              input: '$ratingDistribution',
              as: 'dist',
              in: { k: { $toString: '$$dist.rating' }, v: '$$dist.count' }
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
        ratingDistribution: {}
      }
    }
  });
});

// Admin: Get all reported reviews
exports.getReportedReviews = catchAsync(async (req, res, next) => {
    const { status, sort = '-report.count', limit = 10, page = 1 } = req.query;

    const query = { 'report.count': { $gt: 0 } };
    if (status) {
        query['report.reasons.status'] = status;
    }

    const features = new APIFeatures(Review.find(query), req.query)
        .sort()
        .limitFields()
        .paginate();
    
    const reviews = await features.query
        .populate('user', 'name email')
        .populate('report.reasons.user', 'name email')
        .populate('entityId', 'name');

    const total = await Review.countDocuments(query);

    res.status(200).json({
        status: 'success',
        results: reviews.length,
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

    review.report.reasons.forEach(report => {
        if (report.status === 'pending') {
            report.status = status;
            report.adminNotes = notes;
            report.resolvedAt = Date.now();
            report.resolvedBy = req.user.id;
        }
    });

    if (action === 'delete_review') {
        review.status = 'rejected'; // or delete it completely
    } else if (action === 'warn_user') {
        await sendNotification({
            userId: review.user,
            type: 'review_response',
            title: 'A note about your review',
            message: `A moderator has reviewed your post and left a note: ${notes}. Please ensure compliance with our guidelines.`,
            data: { reviewId: review._id }
        });
    }

    await review.save();

    res.status(200).json({
        status: 'success',
        message: 'Report status updated successfully'
    });
});