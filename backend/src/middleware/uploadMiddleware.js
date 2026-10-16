const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const env = require("../config/env");

// Ensure upload directory exists
const uploadDir = path.resolve(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed MIME types and corresponding extensions
const ALLOWED_MIME_TYPES = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/webm": ".webm"
};

// Disk storage configuration with randomized filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure 16-byte random hex prefix + timestamp
    const randomHex = crypto.randomBytes(16).toString("hex");
    const extension = ALLOWED_MIME_TYPES[file.mimetype] || path.extname(file.originalname).toLowerCase();
    
    // Sanitize extension to prevent any injection
    const safeExtension = extension.replace(/[^a-z0-9.]/gi, "");
    cb(null, `${Date.now()}-${randomHex}${safeExtension}`);
  }
});

// File filter to inspect MIME types
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    const error = new Error(
      `Unsupported file type '${file.mimetype}'. Allowed formats: JPEG, PNG, WEBP, MP4, WEBM`
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.UPLOAD_MAX_SIZE_MB * 1024 * 1024 // e.g. 25MB
  }
});

/**
 * Helper to construct public URL for uploaded file
 * Can be replaced with S3 / Cloudinary URL generator in production
 */
const getFileUrl = (req, filename) => {
  return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
};

module.exports = {
  upload,
  getFileUrl
};
