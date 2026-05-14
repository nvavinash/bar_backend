const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine (shared)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  },
});

// File filter: JPEG only (for profile photo)
const photoFileFilter = (req, file, cb) => {
  const isJpeg =
    file.mimetype === "image/jpeg" || file.mimetype === "image/jpg";
  if (isJpeg) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG/JPG images are allowed."));
  }
};

// File filter: JPEG, PNG, or PDF (for bar certificate)
const certificateFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, or PDF files are allowed for certificates."));
  }
};

// Combined file filter (used in member upload with both fields)
const memberFileFilter = (req, file, cb) => {
  if (file.fieldname === "photo") {
    photoFileFilter(req, file, cb);
  } else if (file.fieldname === "barCertificate") {
    certificateFileFilter(req, file, cb);
  } else {
    cb(null, true);
  }
};

// Single photo upload (JPEG only, 100KB) – legacy/simple routes
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 }, // 100 KB
  fileFilter: photoFileFilter,
});

// Multi-field upload for member registration:
//   field "photo"           → JPEG only, 100 KB
//   field "barCertificate"  → JPEG/PNG/PDF, 100 KB
const memberUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 }, // 100 KB (applied per file)
  fileFilter: memberFileFilter,
});

module.exports = upload;
module.exports.memberUpload = memberUpload;
