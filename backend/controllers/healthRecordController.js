const HealthRecord = require('../models/HealthRecord');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const { createPDF } = require('../utils/pdfGenerator');
const { uploadToCloudinary } = require('../utils/cloudinary');
const APIFeatures = require('../utils/apiFeatures');
const { uploadToS3, deleteFromS3 } = require('../utils/s3');
const { sendNotification } = require('../utils/notifications');

// Get all health records for the authenticated user
exports.getHealthRecords = catchAsync(async (req, res, next) => {
  const { type, startDate, endDate, provider, sort, limit = 10, page = 1 } = req.query;
  
  // Build query
  const query = { userId: req.user.id };
  if (type) query.type = type;
  if (provider) query['provider.name'] = { $regex: provider, $options: 'i' };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const records = await HealthRecord.find(query)
    .sort(sort || '-date')
    .skip(skip)
    .limit(parseInt(limit))
    .populate('provider.id', 'name specialization');

  const total = await HealthRecord.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      records,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get a specific health record
exports.getHealthRecord = catchAsync(async (req, res, next) => {
  const record = await HealthRecord.findOne({
    _id: req.params.id,
    $or: [
      { userId: req.user.id },
      { 'privacy.sharedWith': req.user.id }
    ]
  }).populate('provider.id', 'name specialization');

  if (!record) {
    return next(new AppError('Health record not found or access denied', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { record }
  });
});

// Create a new health record
exports.createHealthRecord = catchAsync(async (req, res, next) => {
  const {
    recordType,
    title,
    description,
    date,
    provider,
    diagnosis,
    medications,
    attachments
  } = req.body;

  // Upload attachments to S3 if any
  let uploadedAttachments = [];
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map(file =>
      uploadToS3(file, 'health-records')
    );
    uploadedAttachments = await Promise.all(uploadPromises);
  }

  // Create health record
  const record = await HealthRecord.create({
    user: req.user.id,
    recordType,
    title,
    description,
    date,
    provider,
    diagnosis,
    medications,
    attachments: uploadedAttachments.map(attachment => ({
      url: attachment.Location,
      s3Key: attachment.Key,
      name: attachment.originalname,
      type: attachment.mimetype
    })),
    createdBy: req.user.id
  });

  res.status(201).json({
    status: 'success',
    data: {
      record
    }
  });
});

// Update a health record
exports.updateHealthRecord = catchAsync(async (req, res, next) => {
  const record = await HealthRecord.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!record) {
    return next(new AppError('Health record not found or access denied', 404));
  }

  // Handle file uploads if any
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map(file => 
      uploadToCloudinary(file.path, 'health-records')
    );
    const uploadResults = await Promise.all(uploadPromises);
    
    req.body.attachments = [
      ...(record.attachments || []),
      ...uploadResults.map(result => ({
        type: result.resource_type,
        url: result.secure_url,
        publicId: result.public_id
      }))
    ];
  }

  // Update record
  Object.assign(record, req.body);
  await record.save();

  res.status(200).json({
    status: 'success',
    data: { record }
  });
});

// Delete a health record
exports.deleteHealthRecord = catchAsync(async (req, res, next) => {
  const record = await HealthRecord.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!record) {
    return next(new AppError('Health record not found or access denied', 404));
  }

  // Delete associated files from cloud storage
  if (record.attachments && record.attachments.length > 0) {
    const deletePromises = record.attachments.map(attachment =>
      deleteFromCloudinary(attachment.publicId)
    );
    await Promise.all(deletePromises);
  }

  await record.remove();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Share health record with a doctor
exports.shareHealthRecord = catchAsync(async (req, res, next) => {
  const { doctorId, permissions } = req.body;

  // Verify doctor exists
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  const record = await HealthRecord.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!record) {
    return next(new AppError('Health record not found or access denied', 404));
  }

  // Add doctor to shared list if not already present
  if (!record.privacy.sharedWith.includes(doctorId)) {
    record.privacy.sharedWith.push(doctorId);
    if (permissions) {
      record.privacy.permissions = {
        ...record.privacy.permissions,
        [doctorId]: permissions
      };
    }
    await record.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'Health record shared successfully'
  });
});

// Revoke access from a doctor
exports.revokeAccess = catchAsync(async (req, res, next) => {
  const { doctorId } = req.params;

  const record = await HealthRecord.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!record) {
    return next(new AppError('Health record not found or access denied', 404));
  }

  // Remove doctor from shared list
  record.privacy.sharedWith = record.privacy.sharedWith.filter(
    id => id.toString() !== doctorId
  );
  
  // Remove doctor's permissions
  if (record.privacy.permissions) {
    delete record.privacy.permissions[doctorId];
  }

  await record.save();

  res.status(200).json({
    status: 'success',
    message: 'Access revoked successfully'
  });
});

// Get health record statistics
exports.getHealthRecordStats = catchAsync(async (req, res, next) => {
  const stats = await HealthRecord.aggregate([
    {
      $match: { userId: req.user._id }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        latestRecord: { $max: '$date' },
        providers: { $addToSet: '$provider.name' }
      }
    }
  ]);

  // Get vital trends if any records have vitals
  const vitalTrends = await HealthRecord.aggregate([
    {
      $match: {
        userId: req.user._id,
        vitals: { $exists: true, $ne: null }
      }
    },
    {
      $sort: { date: 1 }
    },
    {
      $group: {
        _id: null,
        bloodPressure: {
          $push: {
            date: '$date',
            systolic: '$vitals.bloodPressure.systolic',
            diastolic: '$vitals.bloodPressure.diastolic'
          }
        },
        heartRate: {
          $push: {
            date: '$date',
            value: '$vitals.heartRate'
          }
        },
        weight: {
          $push: {
            date: '$date',
            value: '$vitals.weight'
          }
        }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
      vitalTrends: vitalTrends[0] || null
    }
  });
});

// Export health records to PDF
exports.exportHealthRecords = catchAsync(async (req, res, next) => {
  const { startDate, endDate, type } = req.query;
  
  // Build query
  const query = { userId: req.user.id };
  if (type) query.type = type;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const records = await HealthRecord.find(query)
    .sort('date')
    .populate('provider.id', 'name specialization');

  if (!records.length) {
    return next(new AppError('No records found for the specified criteria', 404));
  }

  // Generate PDF
  const pdfBuffer = await createPDF({
    records,
    user: req.user,
    dateRange: { startDate, endDate }
  });

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=health-records-${Date.now()}.pdf`
  );

  res.send(pdfBuffer);
});

// Get all health records for a user
exports.getUserRecords = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    HealthRecord.find({ user: req.user.id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const records = await features.query
    .populate('provider', 'name specialization')
    .populate('createdBy', 'name');

  res.status(200).json({
    status: 'success',
    results: records.length,
    data: {
      records
    }
  });
});

// Get single health record
exports.getRecord = catchAsync(async (req, res, next) => {
  const record = await HealthRecord.findById(req.params.id)
    .populate('provider', 'name specialization')
    .populate('createdBy', 'name');

  if (!record) {
    return next(new AppError('No health record found with that ID', 404));
  }

  // Check if user is authorized to view
  if (
    record.user.toString() !== req.user.id &&
    !req.user.healthcareProviders.includes(record.provider._id) &&
    req.user.role !== 'admin'
  ) {
    return next(new AppError('You are not authorized to view this record', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      record
    }
  });
});

// Update health record
exports.updateRecord = catchAsync(async (req, res, next) => {
  const record = await HealthRecord.findById(req.params.id);

  if (!record) {
    return next(new AppError('No health record found with that ID', 404));
  }

  // Check if user is authorized to update
  if (
    record.user.toString() !== req.user.id &&
    !req.user.healthcareProviders.includes(record.provider) &&
    req.user.role !== 'admin'
  ) {
    return next(new AppError('You are not authorized to update this record', 403));
  }

  // Handle new attachments
  let newAttachments = [];
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map(file =>
      uploadToS3(file, 'health-records')
    );
    const uploadedFiles = await Promise.all(uploadPromises);
    newAttachments = uploadedFiles.map(attachment => ({
      url: attachment.Location,
      s3Key: attachment.Key,
      name: attachment.originalname,
      type: attachment.mimetype
    }));
  }

  // Delete removed attachments from S3
  if (req.body.removedAttachments) {
    const deletePromises = req.body.removedAttachments.map(key =>
      deleteFromS3(key)
    );
    await Promise.all(deletePromises);
  }

  // Update record
  const updatedRecord = await HealthRecord.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      attachments: [
        ...(record.attachments.filter(
          attachment => !req.body.removedAttachments?.includes(attachment.s3Key)
        )),
        ...newAttachments
      ],
      updatedAt: Date.now(),
      updatedBy: req.user.id
    },
    {
      new: true,
      runValidators: true
    }
  )
    .populate('provider', 'name specialization')
    .populate('createdBy', 'name');

  res.status(200).json({
    status: 'success',
    data: {
      record: updatedRecord
    }
  });
});

// Delete health record
exports.deleteRecord = catchAsync(async (req, res, next) => {
  const record = await HealthRecord.findById(req.params.id);

  if (!record) {
    return next(new AppError('No health record found with that ID', 404));
  }

  // Check if user is authorized to delete
  if (
    record.user.toString() !== req.user.id &&
    !req.user.healthcareProviders.includes(record.provider) &&
    req.user.role !== 'admin'
  ) {
    return next(new AppError('You are not authorized to delete this record', 403));
  }

  // Delete attachments from S3
  const deletePromises = record.attachments.map(attachment =>
    deleteFromS3(attachment.s3Key)
  );
  await Promise.all(deletePromises);

  // Delete record
  await record.remove();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Share health record
exports.shareRecord = catchAsync(async (req, res, next) => {
  const { recordId } = req.params;
  const { providerId, accessLevel, expiryDate } = req.body;

  const record = await HealthRecord.findById(recordId);
  if (!record) {
    return next(new AppError('No health record found with that ID', 404));
  }

  // Check if user is authorized to share
  if (record.user.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to share this record', 403));
  }

  // Check if provider exists
  const provider = await User.findOne({
    _id: providerId,
    role: { $in: ['doctor', 'healthcare_provider'] }
  });

  if (!provider) {
    return next(new AppError('Provider not found', 404));
  }

  // Add sharing record
  record.sharedWith.push({
    provider: providerId,
    accessLevel,
    expiryDate: expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
    sharedBy: req.user.id,
    sharedAt: Date.now()
  });

  await record.save();

  // Send notification to provider
  await sendNotification({
    user: providerId,
    title: 'Health Record Shared',
    message: `${req.user.name} has shared a health record with you`,
    type: 'record_shared',
    data: {
      recordId: record._id,
      recordType: record.recordType,
      accessLevel,
      expiryDate
    }
  });

  res.status(200).json({
    status: 'success',
    data: {
      record
    }
  });
});

// Get shared records
exports.getSharedRecords = catchAsync(async (req, res, next) => {
  const records = await HealthRecord.find({
    'sharedWith.provider': req.user.id,
    'sharedWith.expiryDate': { $gt: new Date() }
  })
    .populate('user', 'name email')
    .populate('provider', 'name specialization')
    .populate('sharedWith.provider', 'name specialization')
    .sort('-sharedWith.sharedAt');

  res.status(200).json({
    status: 'success',
    results: records.length,
    data: {
      records
    }
  });
});

// Get record statistics
exports.getRecordStats = catchAsync(async (req, res, next) => {
  const stats = await HealthRecord.aggregate([
    {
      $match: {
        user: req.user.id
      }
    },
    {
      $group: {
        _id: {
          recordType: '$recordType',
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        count: { $sum: 1 },
        totalAttachments: {
          $sum: { $size: '$attachments' }
        }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
}); 