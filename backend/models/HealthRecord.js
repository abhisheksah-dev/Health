const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Health record must belong to a patient']
    },
    doctor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Doctor',
        required: [true, 'Health record must be created by a doctor']
    },
    appointment: {
        type: mongoose.Schema.ObjectId,
        ref: 'Appointment'
    },
    date: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['consultation', 'lab-result', 'prescription', 'vaccination', 'procedure', 'other'],
        required: [true, 'Please specify record type']
    },
    diagnosis: {
        type: String,
        required: [true, 'Please provide diagnosis']
    },
    symptoms: [{
        type: String
    }],
    vitalSigns: {
        bloodPressure: {
            systolic: Number,
            diastolic: Number
        },
        heartRate: Number,
        temperature: Number,
        respiratoryRate: Number,
        oxygenSaturation: Number,
        weight: Number,
        height: Number,
        bmi: Number
    },
    medications: [{
        name: {
            type: String,
            required: true
        },
        dosage: String,
        frequency: String,
        duration: String,
        startDate: Date,
        endDate: Date,
        prescribedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'Doctor'
        },
        notes: String
    }],
    allergies: [{
        allergen: String,
        reaction: String,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe']
        },
        notes: String
    }],
    labResults: [{
        testName: String,
        testDate: Date,
        result: String,
        referenceRange: String,
        labName: String,
        notes: String,
        attachments: [String] // URLs to test reports
    }],
    procedures: [{
        name: String,
        date: Date,
        performedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'Doctor'
        },
        location: String,
        notes: String,
        complications: String
    }],
    vaccinations: [{
        name: String,
        date: Date,
        administeredBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'Doctor'
        },
        batchNumber: String,
        nextDueDate: Date,
        notes: String
    }],
    familyHistory: [{
        condition: String,
        relation: String,
        notes: String
    }],
    lifestyle: {
        smoking: {
            status: {
                type: String,
                enum: ['never', 'former', 'current']
            },
            details: String
        },
        alcohol: {
            status: {
                type: String,
                enum: ['never', 'occasional', 'regular']
            },
            details: String
        },
        exercise: {
            frequency: String,
            type: String,
            duration: String
        },
        diet: String,
        occupation: String,
        stressLevel: {
            type: String,
            enum: ['low', 'moderate', 'high']
        }
    },
    notes: String,
    attachments: [{
        url: String, 
        description: String
    }],
    isPrivate: {
        type: Boolean,
        default: false
    },
    sharedWith: [{
        doctor: { type: mongoose.Schema.ObjectId, ref: 'Doctor' },
        permissions: [{ type: String, enum: ['read', 'write'] }]
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
healthRecordSchema.index({ patient: 1, date: -1 });
healthRecordSchema.index({ doctor: 1, date: -1 });
healthRecordSchema.index({ type: 1 });
healthRecordSchema.index({ 'sharedWith.doctor': 1 });


// Pre-save middleware to calculate BMI
healthRecordSchema.pre('save', function(next) {
    if (this.isModified('vitalSigns.weight') || this.isModified('vitalSigns.height')) {
        if (this.vitalSigns && this.vitalSigns.weight && this.vitalSigns.height) {
            const heightInMeters = this.vitalSigns.height / 100;
            if (heightInMeters > 0) {
              this.vitalSigns.bmi = (this.vitalSigns.weight / (heightInMeters * heightInMeters)).toFixed(1);
            }
        }
    }
    next();
});

// Method to get patient's medical history
healthRecordSchema.statics.getPatientHistory = async function(patientId, options = {}) {
    const query = this.find({ patient: patientId })
        .populate('doctor', 'name specialization')
        .populate('appointment', 'date type status')
        .sort({ date: -1 });

    if (options.type) {
        query.where('type').equals(options.type);
    }

    if (options.startDate && options.endDate) {
        query.where('date').gte(options.startDate).lte(options.endDate);
    }

    return await query;
};

// Method to get patient's current medications
healthRecordSchema.statics.getCurrentMedications = async function(patientId) {
    const records = await this.find({
        patient: patientId,
        'medications.endDate': { $gt: new Date() }
    }).select('medications');

    return records.reduce((meds, record) => {
        return meds.concat(record.medications.filter(med => 
            new Date(med.endDate) > new Date()
        ));
    }, []);
};

const HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);

module.exports = HealthRecord;