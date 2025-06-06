const LabReport = require('../models/LabReport');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { analyzeLabReport } = require('../services/labReportAnalysis');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/lab-reports');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError('Invalid file type. Only PDF and image files are allowed.', 400), false);
    }
};

exports.upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Upload lab report
exports.uploadLabReport = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Please upload a lab report file.', 400));
    }

    const labReport = await LabReport.create({
        patient: req.user._id,
        doctor: req.body.doctorId,
        appointment: req.body.appointmentId,
        labName: req.body.labName,
        testDate: req.body.testDate,
        reportDate: req.body.reportDate,
        testType: req.body.testType,
        fileUrl: `/uploads/lab-reports/${req.file.filename}`,
        fileType: path.extname(req.file.originalname).slice(1),
        fileSize: req.file.size,
        metadata: {
            originalFilename: req.file.originalname,
            mimeType: req.file.mimetype,
            uploadMethod: 'web'
        }
    });

    // Start analysis in background
    analyzeLabReport(labReport._id).catch(err => {
        console.error('Lab report analysis failed:', err);
        labReport.status = 'error';
        labReport.save();
    });

    res.status(201).json({
        status: 'success',
        message: 'Lab report uploaded successfully',
        data: {
            labReport
        }
    });
});

// Get lab report by ID
exports.getLabReport = catchAsync(async (req, res, next) => {
    const labReport = await LabReport.findById(req.params.id)
        .populate('patient', 'name email')
        .populate('doctor', 'name specialization')
        .populate('appointment', 'date type status');

    if (!labReport) {
        return next(new AppError('No lab report found with that ID', 404));
    }

    // Check if user has permission to view the report
    if (req.user.role !== 'admin' && 
        req.user.role !== 'doctor' && 
        labReport.patient.toString() !== req.user._id.toString()) {
        return next(new AppError('You do not have permission to view this report', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            labReport
        }
    });
});

// Get patient's lab history
exports.getPatientLabHistory = catchAsync(async (req, res, next) => {
    const options = {
        testType: req.query.testType,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        status: req.query.status
    };

    const labReports = await LabReport.getPatientLabHistory(req.params.patientId, options);

    res.status(200).json({
        status: 'success',
        results: labReports.length,
        data: {
            labReports
        }
    });
});

// Get critical values
exports.getCriticalValues = catchAsync(async (req, res, next) => {
    const criticalValues = await LabReport.getCriticalValues(req.params.patientId);

    res.status(200).json({
        status: 'success',
        data: {
            criticalValues
        }
    });
});

// Get test trends
exports.getTestTrends = catchAsync(async (req, res, next) => {
    const { testType, parameter } = req.query;
    
    if (!testType || !parameter) {
        return next(new AppError('Please provide test type and parameter', 400));
    }

    const trends = await LabReport.getTestTrends(req.params.patientId, testType, parameter);

    res.status(200).json({
        status: 'success',
        data: {
            trends
        }
    });
});

// Update lab report
exports.updateLabReport = catchAsync(async (req, res, next) => {
    const allowedUpdates = ['labName', 'testDate', 'reportDate', 'testType', 'isPrivate'];
    const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
            obj[key] = req.body[key];
            return obj;
        }, {});

    const labReport = await LabReport.findById(req.params.id);

    if (!labReport) {
        return next(new AppError('No lab report found with that ID', 404));
    }

    // Check if user has permission to update the report
    if (req.user.role !== 'admin' && 
        req.user.role !== 'doctor' && 
        labReport.patient.toString() !== req.user._id.toString()) {
        return next(new AppError('You do not have permission to update this report', 403));
    }

    Object.assign(labReport, updates);
    await labReport.save();

    res.status(200).json({
        status: 'success',
        data: {
            labReport
        }
    });
});

// Delete lab report
exports.deleteLabReport = catchAsync(async (req, res, next) => {
    const labReport = await LabReport.findById(req.params.id);

    if (!labReport) {
        return next(new AppError('No lab report found with that ID', 404));
    }

    // Check if user has permission to delete the report
    if (req.user.role !== 'admin' && 
        labReport.patient.toString() !== req.user._id.toString()) {
        return next(new AppError('You do not have permission to delete this report', 403));
    }

    // Delete file from storage
    const filePath = path.join(__dirname, '..', labReport.fileUrl);
    try {
        await fs.unlink(filePath);
    } catch (error) {
        console.error('Error deleting file:', error);
    }

    await labReport.remove();

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Retry analysis
exports.retryAnalysis = catchAsync(async (req, res, next) => {
    const labReport = await LabReport.findById(req.params.id);

    if (!labReport) {
        return next(new AppError('No lab report found with that ID', 404));
    }

    if (req.user.role !== 'admin' && 
        req.user.role !== 'doctor' && 
        labReport.patient.toString() !== req.user._id.toString()) {
        return next(new AppError('You do not have permission to retry analysis', 403));
    }

    labReport.status = 'pending';
    await labReport.save();

    // Start analysis in background
    analyzeLabReport(labReport._id).catch(err => {
        console.error('Lab report analysis failed:', err);
        labReport.status = 'error';
        labReport.save();
    });

    res.status(200).json({
        status: 'success',
        message: 'Analysis restarted successfully'
    });
}); 