const mongoose = require('mongoose');
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');

// Helper to get Model from entityType string
function getEntityModel(entityType) {
  const models = {
    doctor: Doctor,
    hospital: require('../models/Hospital'),
    clinic: require('../models/Clinic'),
  };
  return models[entityType];
}

// Create a new review
exports.createReview = catchAsync(async (req, res, next) => {
  const { appointmentId, rating, title, content } = req.body;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    return next(new AppError('Appointment not found.', 404));
  }

  if (appointment.patient.toString() !== req.user.id) {
    return next(new AppError('You can only review your own appointments.', 403));
  }
  if (appointment.status !== 'completed') {
    return next(new AppError('You can only review completed appointments.', 400));
  }
  if (appointment.review) {
    return next(new AppError('You have already reviewed this appointment.', 400));
  }

  const review = await Review.create({
    user: req.user.id,
    appointment: appointmentId,
    doctor: appointment.doctor,
    facility: appointment.facility,
    rating, // The frontend should send the full rating object now
    title,
    content,
    status: 'approved'
  });

  appointment.review = review._id;
  await appointment.save();
  
  // Update the doctor's average rating
  const stats = await Review.aggregate([
    { $match: { doctor: appointment.doctor, status: 'approved' } },
    { $group: { _id: '$doctor', avgRating: { $avg: '$rating.overall' }, count: { $sum: 1 } } }
  ]);
  
  if (stats.length > 0) {
    await Doctor.findByIdAndUpdate(appointment.doctor, {
        'rating.average': stats[0].avgRating,
        'rating.count': stats[0].count
    });
  }

  res.status(201).json({ status: 'success', data: { review } });
});

// Get all reviews for an entity
exports.getEntityReviews = catchAsync(async (req, res, next) => {
  const { entityType, entityId } = req.params;
  const validTypes = ['doctor', 'hospital', 'clinic'];
  if (!validTypes.includes(entityType)) {
      return next(new AppError('Invalid entity type.', 400));
  }

  const query = { [entityType]: new mongoose.Types.ObjectId(entityId), status: 'approved' };
  
  const reviews = await Review.find(query).sort('-createdAt').populate('user', 'name avatar');
    
  res.status(200).json({ status: 'success', results: reviews.length, data: { reviews } });
});

// Get all reviews by the authenticated user
exports.getMyReviews = catchAsync(async (req, res, next) => {
    const reviews = await Review.find({ user: req.user.id })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' }})
      .sort('-createdAt');
    res.status(200).json({ status: 'success', results: reviews.length, data: { reviews } });
});

// Get a specific review
exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id)
    .populate('user', 'name avatar')
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });

  if (!review) {
    return next(new AppError('Review not found', 404));
  }
  res.status(200).json({ status: 'success', data: { review } });
});

// Update a review
exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findOne({ _id: req.params.id, user: req.user.id });

  if (!review) {
    return next(new AppError('Review not found or you do not have permission to update.', 404));
  }
  
  const { rating, title, content } = req.body;
  if(rating) review.rating = rating;
  if(title) review.title = title;
  if(content) review.content = content;

  await review.save();
  res.status(200).json({ status: 'success', data: { review } });
});

// Delete a review
exports.deleteReview = catchAsync(async (req, res, next) => {
  const query = { _id: req.params.id };
  if (req.user.role !== 'admin') {
      query.user = req.user.id;
  }
  
  const review = await Review.findOneAndDelete(query);
  if (!review) {
    return next(new AppError('Review not found or you lack permission to delete it.', 404));
  }
  
  await Appointment.findByIdAndUpdate(review.appointment, { $unset: { review: "" } });

  res.status(204).json({ status: 'success', data: null });
});

// Report a review
exports.reportReview = catchAsync(async (req, res, next) => {
  const { reason, details } = req.body;
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  const existingReport = review.report.reasons.find(r => r.user.toString() === req.user.id);
  if (existingReport) {
    return next(new AppError('You have already reported this review', 400));
  }

  review.report.count += 1;
  review.report.reasons.push({ user: req.user.id, reason, details });
  await review.save();

  res.status(200).json({ status: 'success', message: 'Review reported successfully' });
});

// Toggle a like on a review
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

  res.status(200).json({ status: 'success', data: { liked: likeIndex === -1, likesCount: review.helpful.count } });
});

// Get statistics for a specific entity
exports.getReviewStats = catchAsync(async (req, res, next) => {
  const { entityType, entityId } = req.params;
  const match = { [entityType]: new mongoose.Types.ObjectId(entityId), status: 'approved' };
  
  const stats = await Review.aggregate([
    { $match: match },
    { $group: { _id: null, avgRating: { $avg: '$rating.overall' }, count: { $sum: 1 } } }
  ]);

  res.status(200).json({ status: 'success', data: { stats: stats[0] || { avgRating: 0, count: 0 } } });
});

// Admin: Get reported reviews
exports.getReportedReviews = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Review.find({ 'report.count': { $gt: 0 } }), req.query)
        .sort().paginate();
    const reviews = await features.query.populate('user', 'name email');
    res.status(200).json({ status: 'success', results: reviews.length, data: { reviews } });
});

// Admin: Update the status of a reported review
exports.updateReportStatus = catchAsync(async (req, res, next) => {
    const { status, action, notes } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return next(new AppError('Review not found', 404));

    review.report.reasons.forEach(r => {
        if (r.status === 'pending') {
            r.status = status;
            r.adminNotes = notes;
        }
    });

    if (action === 'delete_review') {
        await review.deleteOne();
        return res.status(204).json({ status: 'success', data: null });
    }
    
    await review.save();
    res.status(200).json({ status: 'success', message: 'Report status updated.' });
});