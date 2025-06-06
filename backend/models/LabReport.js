const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Lab report must belong to a patient']
    },
    doctor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Doctor',
        required: [true, 'Lab report must be associated with a doctor']
    },
    appointment: {
        type: mongoose.Schema.ObjectId,
        ref: 'Appointment'
    },
    reportNumber: {
        type: String,
        required: [true, 'Please provide a lab report number'],
        unique: true,
        index: true
    },
    labName: {
        type: String,
        required: [true, 'Please provide the laboratory name']
    },
    testDate: {
        type: Date,
        required: [true, 'Please provide the test date']
    },
    reportDate: {
        type: Date,
        required: [true, 'Please provide the report date']
    },
    testType: {
        type: String,
        required: [true, 'Please specify the type of test'],
        enum: [
            'blood-test',
            'urine-test',
            'x-ray',
            'mri',
            'ct-scan',
            'ultrasound',
            'ecg',
            'other'
        ]
    },
    fileUrl: {
        type: String,
        required: [true, 'Please provide the report file URL']
    },
    fileType: {
        type: String,
        required: [true, 'Please specify the file type'],
        enum: ['pdf', 'image', 'document']
    },
    fileSize: {
        type: Number,
        required: [true, 'Please provide the file size']
    },
    status: {
        type: String,
        enum: ['pending', 'analyzing', 'analyzed', 'error'],
        default: 'pending'
    },
    analysis: {
        rawData: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
        },
        interpretedResults: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
        },
        summary: String,
        recommendations: [String],
        criticalValues: [{
            parameter: String,
            value: mongoose.Schema.Types.Mixed,
            referenceRange: String,
            status: {
                type: String,
                enum: ['normal', 'high', 'low', 'critical']
            }
        }],
        analyzedAt: Date,
        analysisVersion: String
    },
    metadata: {
        originalFilename: String,
        mimeType: String,
        uploadDate: {
            type: Date,
            default: Date.now
        },
        uploadMethod: String,
        processingTime: Number
    },
    isPrivate: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
labReportSchema.index({ patient: 1, testDate: -1 });
labReportSchema.index({ doctor: 1, testDate: -1 });
labReportSchema.index({ status: 1 });

// Generate unique report number
labReportSchema.pre('save', async function(next) {
    if (this.isNew) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const count = await this.constructor.countDocuments();
        this.reportNumber = `LAB${year}${month}${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
});

// Method to get patient's lab history
labReportSchema.statics.getPatientLabHistory = async function(patientId, options = {}) {
    const query = this.find({ patient: patientId })
        .populate('doctor', 'name specialization')
        .populate('appointment', 'date type status')
        .sort({ testDate: -1 });

    if (options.testType) {
        query.where('testType').equals(options.testType);
    }

    if (options.startDate && options.endDate) {
        query.where('testDate').gte(options.startDate).lte(options.endDate);
    }

    if (options.status) {
        query.where('status').equals(options.status);
    }

    return await query;
};

// Method to get critical values
labReportSchema.statics.getCriticalValues = async function(patientId) {
    const reports = await this.find({
        patient: patientId,
        'analysis.criticalValues': { $exists: true, $ne: [] }
    })
    .select('analysis.criticalValues testDate testType')
    .sort({ testDate: -1 });

    return reports.map(report => ({
        testDate: report.testDate,
        testType: report.testType,
        criticalValues: report.analysis.criticalValues
    }));
};

// Method to get test trends
labReportSchema.statics.getTestTrends = async function(patientId, testType, parameter) {
    const reports = await this.find({
        patient: patientId,
        testType,
        'analysis.rawData': { $exists: true }
    })
    .select('analysis.rawData testDate')
    .sort({ testDate: 1 });

    return reports.map(report => ({
        date: report.testDate,
        value: report.analysis.rawData.get(parameter)
    }));
};

const LabReport = mongoose.model('LabReport', labReportSchema);

module.exports = LabReport; 