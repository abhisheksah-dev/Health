const HealthRecord = require('../models/HealthRecord');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const { generatePDF } = require('../utils/pdfGenerator');
const { uploadToS3, deleteFromS3 } = require('../utils/s3');
const APIFeatures = require('../utils/apiFeatures');

// Get all health records for the authenticated user
exports.getHealthRecords = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(
        HealthRecord.find({ patient: req.user.id }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const records = await features.query.populate('doctor', 'name');

    res.status(200).json({
        status: 'success',
        results: records.length,
        data: {
            records
        }
    });
});

// Get a specific health record
exports.getHealthRecord = catchAsync(async (req, res, next) => {
    const record = await HealthRecord.findById(req.params.id)
        .populate('doctor', 'name specialization')
        .populate('patient', 'name email');

    if (!record) {
        return next(new AppError('Health record not found', 404));
    }

    if (record.patient._id.toString() !== req.user.id && req.user.role !== 'admin' && record.doctor._id.toString() !== req.user.id) {
        return next(new AppError('You do not have permission to view this health record.', 403));
    }

    res.status(200).json({
        status: 'success',
        data: { record }
    });
});

// Create a new health record
exports.createHealthRecord = catchAsync(async (req, res, next) => {
    let uploadedAttachments = [];
    if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map(file =>
            uploadToS3(file, `health-records/${req.user.id}`)
        );
        const uploadResults = await Promise.all(uploadPromises);
        uploadedAttachments = uploadResults.map((result, index) => ({
            url: result.url,
            description: req.files[index].originalname,
        }));
    }

    const recordData = {
        ...req.body,
        patient: req.user.id,
        attachments: uploadedAttachments
    };
    
    const record = await HealthRecord.create(recordData);

    res.status(201).json({
        status: 'success',
        data: {
            record
        }
    });
});


// Update a health record
exports.updateHealthRecord = catchAsync(async (req, res, next) => {
    const record = await HealthRecord.findOne({ _id: req.params.id, patient: req.user.id });

    if (!record) {
        return next(new AppError('Health record not found or you do not have permission to update it.', 404));
    }
    
    Object.assign(record, req.body);
    record.updatedAt = Date.now();
    await record.save({ validateBeforeSave: true });

    res.status(200).json({
        status: 'success',
        data: { record }
    });
});


// Delete a health record
exports.deleteHealthRecord = catchAsync(async (req, res, next) => {
    const record = await HealthRecord.findOne({ _id: req.params.id, patient: req.user.id });

    if (!record) {
        return next(new AppError('Health record not found or you do not have permission to delete it.', 404));
    }

    if (record.attachments && record.attachments.length > 0) {
        const deletePromises = record.attachments.map(attachment => {
            const key = attachment.url.split('.com/')[1];
            return deleteFromS3(key);
        });
        await Promise.all(deletePromises);
    }

    await record.deleteOne();

    res.status(204).json({
        status: 'success',
        data: null
    });
});


// Share health record with a doctor
exports.shareHealthRecord = catchAsync(async (req, res, next) => {
    return next(new AppError('Sharing functionality is not supported by the current HealthRecord model.', 501));
});


// Revoke access from a doctor
exports.revokeAccess = catchAsync(async (req, res, next) => {
    return next(new AppError('Sharing functionality is not supported by the current HealthRecord model.', 501));
});


// Get health record statistics
exports.getHealthRecordStats = catchAsync(async (req, res, next) => {
    const stats = await HealthRecord.aggregate([
        { $match: { patient: req.user._id } },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                latestRecord: { $max: '$date' }
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

// Export health records to PDF
exports.exportHealthRecords = catchAsync(async (req, res, next) => {
    const { startDate, endDate, type } = req.query;

    const query = { patient: req.user.id };
    if (type) query.type = type;
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    const records = await HealthRecord.find(query)
        .sort('date')
        .populate('doctor', 'name');

    if (!records.length) {
        return next(new AppError('No records found for the specified criteria', 404));
    }
    
    const pdfBuffer = await generatePDF({
        records,
        user: req.user,
        dateRange: { startDate, endDate }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=health-records-${Date.now()}.pdf`);
    res.send(pdfBuffer);
});