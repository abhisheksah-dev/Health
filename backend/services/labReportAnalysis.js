const LabReport = require('../models/LabReport');
const path = require('path');
const fs = require('fs').promises;
const Tesseract = require('tesseract.js');
const pdf = require('pdf-parse');
const natural = require('natural');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const AppError = require('../utils/appError');

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

// Reference ranges for common lab tests
const referenceRanges = {
    'hemoglobin': { min: 13.5, max: 17.5, unit: 'g/dL' },
    'wbc': { min: 4000, max: 11000, unit: '/µL' },
    'platelets': { min: 150000, max: 450000, unit: '/µL' },
    'glucose': { min: 70, max: 100, unit: 'mg/dL' },
    'creatinine': { min: 0.7, max: 1.3, unit: 'mg/dL' },
    'sodium': { min: 135, max: 145, unit: 'mEq/L' },
    'potassium': { min: 3.5, max: 5.0, unit: 'mEq/L' },
    // Add more reference ranges as needed
};

// Extract text from PDF
async function extractTextFromPDF(filePath) {
    try {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (error) {
        throw new AppError('Error extracting text from PDF', 500);
    }
}

// Extract text from image using OCR
async function extractTextFromImage(filePath) {
    try {
        const { data: { text } } = await Tesseract.recognize(
            filePath,
            'eng',
            { logger: m => console.log(m) }
        );
        return text;
    } catch (error) {
        throw new AppError('Error performing OCR on image', 500);
    }
}

// Extract text from file based on type
async function extractText(filePath, fileType) {
    if (fileType === 'pdf') {
        return await extractTextFromPDF(filePath);
    } else if (['jpeg', 'png', 'tiff'].includes(fileType)) {
        return await extractTextFromImage(filePath);
    }
    throw new AppError('Unsupported file type for text extraction', 400);
}

// Parse lab values from text
function parseLabValues(text) {
    const values = {};
    const lines = text.split('\n');
    
    for (const line of lines) {
        // Look for patterns like "Parameter: Value Unit (Reference Range)"
        const match = line.match(/([A-Za-z\s]+):\s*([\d.]+)\s*([A-Za-z/%]+)\s*(?:\(([\d.-]+)\s*-\s*([\d.-]+)\))?/);
        if (match) {
            const [, parameter, value, unit, min, max] = match;
            const cleanParameter = parameter.trim().toLowerCase();
            values[cleanParameter] = {
                value: parseFloat(value),
                unit: unit.trim(),
                referenceRange: min && max ? `${min}-${max}` : null
            };
        }
    }
    
    return values;
}

// Analyze lab values against reference ranges
function analyzeLabValues(values) {
    const criticalValues = [];
    const interpretedResults = {};

    for (const [parameter, data] of Object.entries(values)) {
        const refRange = referenceRanges[parameter];
        if (refRange) {
            const status = data.value < refRange.min ? 'low' :
                          data.value > refRange.max ? 'high' : 'normal';
            
            interpretedResults[parameter] = {
                ...data,
                status,
                referenceRange: `${refRange.min}-${refRange.max} ${refRange.unit}`
            };

            if (status !== 'normal') {
                criticalValues.push({
                    parameter,
                    value: data.value,
                    referenceRange: `${refRange.min}-${refRange.max} ${refRange.unit}`,
                    status
                });
            }
        }
    }

    return { interpretedResults, criticalValues };
}

// Generate summary using Gemini AI
async function generateSummary(values, criticalValues) {
    try {
        // Initialize the model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `As a medical professional, analyze these lab test results and provide a brief summary:
            Values: ${JSON.stringify(values)}
            Critical Values: ${JSON.stringify(criticalValues)}
            
            Please provide:
            1. A brief summary of the results
            2. Any concerning values that need attention
            3. Recommendations for follow-up if needed
            
            Format the response in a clear, professional manner suitable for medical documentation.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        return summary;
    } catch (error) {
        console.error('Error generating summary with Gemini:', error);
        return 'Unable to generate summary at this time.';
    }
}

// Main analysis function
exports.analyzeLabReport = async (reportId) => {
    const startTime = Date.now();
    const labReport = await LabReport.findById(reportId);

    if (!labReport) {
        throw new AppError('Lab report not found', 404);
    }

    try {
        // Update status to analyzing
        labReport.status = 'analyzing';
        await labReport.save();

        // Get file path
        const filePath = path.join(__dirname, '..', labReport.fileUrl);

        // Extract text from file
        const text = await extractText(filePath, labReport.fileType);

        // Parse lab values
        const rawData = parseLabValues(text);

        // Analyze values
        const { interpretedResults, criticalValues } = analyzeLabValues(rawData);

        // Generate summary using Gemini
        const summary = await generateSummary(interpretedResults, criticalValues);

        // Update lab report with analysis results
        labReport.analysis = {
            rawData,
            interpretedResults,
            summary,
            criticalValues,
            analyzedAt: new Date(),
            analysisVersion: '1.0.0'
        };
        labReport.status = 'analyzed';
        labReport.metadata.processingTime = Date.now() - startTime;

        await labReport.save();

        return labReport;
    } catch (error) {
        labReport.status = 'error';
        await labReport.save();
        throw error;
    }
};

// Get analysis status
exports.getAnalysisStatus = async (reportId) => {
    const labReport = await LabReport.findById(reportId)
        .select('status analysis.metadata.processingTime');

    if (!labReport) {
        throw new AppError('Lab report not found', 404);
    }

    return {
        status: labReport.status,
        processingTime: labReport.analysis?.metadata?.processingTime
    };
}; 