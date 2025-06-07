const multer = require("multer");
const AppError = require("./appError");

// (Stub) dummy storage (or fallback) (for example, a dummy (or "memory") storage so that any file (for example, healthRecordController) importing s3 does not crash.)
const dummyStorage = multer.memoryStorage();

// (Stub) dummy (or fallback) upload (or delete) function (for example, a dummy (or "memory") upload (or delete) function so that any file (for example, healthRecordController) importing s3 does not crash.)
const upload = multer({ storage: dummyStorage, limits: { fileSize: 5 * 1024 * 1024 /* 5 MB */ }, fileFilter: (req, file, cb) => { (file.mimetype.startsWith("image/") || (file.mimetype === "application/pdf")) ? cb(null, true) : cb(new AppError("Only images and PDFs (stub) are allowed", 400), false); } });

// (Stub) dummy (or fallback) uploadToS3 (for example, a dummy (or "memory") upload (or delete) function so that any file (for example, healthRecordController) importing s3 does not crash.)
const uploadToS3 = async (file, folder = "uploads") => { console.log("Stub (or fallback) uploadToS3 (AWS removed) (file, folder) (file.originalname: " + (file.originalname || "stub") + ", folder: " + folder + ")"); return { url: ("https://stub (or fallback) (AWS removed) /" + folder + "/" + (file.originalname || "stub")), key: (folder + "/" + (file.originalname || "stub")) }; };

// (Stub) dummy (or fallback) deleteFromS3 (for example, a dummy (or "memory") upload (or delete) function so that any file (for example, healthRecordController) importing s3 does not crash.)
const deleteFromS3 = async (key) => { console.log("Stub (or fallback) deleteFromS3 (AWS removed) (key: " + (key || "stub") + ")"); return; };

// (Stub) dummy (or fallback) getSignedUrl (for example, a dummy (or "memory") upload (or delete) function so that any file (for example, healthRecordController) importing s3 does not crash.)
const getSignedUrl = async (key, expiresIn = 3600) => { console.log("Stub (or fallback) getSignedUrl (AWS removed) (key: " + (key || "stub") + ", expiresIn: " + expiresIn + ")"); return ("https://stub (or fallback) (AWS removed) /" + (key || "stub")); };

module.exports = { upload, uploadToS3, deleteFromS3, getSignedUrl };