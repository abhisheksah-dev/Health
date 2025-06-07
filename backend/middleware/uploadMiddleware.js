const multer = require('multer');
const path = require('path');
const AppError = require('../utils/appError');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new AppError('Only images and PDFs are allowed', 400), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload; 