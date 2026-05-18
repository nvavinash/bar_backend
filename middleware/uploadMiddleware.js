const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// ─── Cloudinary storage for member PHOTOS (JPEG only) ───────────────────────
const photoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "bar_members/photos",
    allowed_formats: ["jpg", "jpeg"],
    // Use a unique public_id so filenames never collide
    public_id: (req, file) =>
      `photo_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
  },
});

// ─── Cloudinary storage for BAR CERTIFICATES (JPEG/PNG/PDF) ─────────────────
const certificateStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "bar_members/certificates",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    // PDFs must use 'raw' resource type; images use 'image'
    resource_type: file.mimetype === "application/pdf" ? "raw" : "image",
    public_id: `cert_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
  }),
});

// ─── File filters (validation preserved exactly as before) ──────────────────
const photoFileFilter = (req, file, cb) => {
  const isJpeg =
    file.mimetype === "image/jpeg" || file.mimetype === "image/jpg";
  if (isJpeg) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG/JPG images are allowed."));
  }
};

const certificateFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, or PDF files are allowed for certificates."));
  }
};

// Combined filter used by memberUpload
const memberFileFilter = (req, file, cb) => {
  if (file.fieldname === "photo") {
    photoFileFilter(req, file, cb);
  } else if (file.fieldname === "barCertificate") {
    certificateFileFilter(req, file, cb);
  } else {
    cb(null, true);
  }
};

// ─── Single photo upload (JPEG only, 100 KB) – legacy/simple routes ─────────
const upload = multer({
  storage: photoStorage,
  limits: { fileSize: 100 * 1024 }, // 100 KB
  fileFilter: photoFileFilter,
});

// ─── Multi-field upload for member registration ──────────────────────────────
//   field "photo"          → JPEG only,         100 KB
//   field "barCertificate" → JPEG/PNG/PDF,       100 KB
//
// NOTE: multer-storage-cloudinary selects the correct storage bucket per field
// because params() is evaluated per-file (photo → photoStorage,
// certificate → certificateStorage). We use a custom combined storage that
// delegates by fieldname.
const { Readable } = require("stream");

// Proxy storage: routes each file to the right Cloudinary storage bucket
const memberStorage = {
  _handleFile(req, file, cb) {
    const delegate =
      file.fieldname === "barCertificate" ? certificateStorage : photoStorage;
    delegate._handleFile(req, file, cb);
  },
  _removeFile(req, file, cb) {
    const delegate =
      file.fieldname === "barCertificate" ? certificateStorage : photoStorage;
    delegate._removeFile(req, file, cb);
  },
};

const memberUpload = multer({
  storage: memberStorage,
  limits: { fileSize: 100 * 1024 }, // 100 KB per file
  fileFilter: memberFileFilter,
});

module.exports = upload;
module.exports.memberUpload = memberUpload;
