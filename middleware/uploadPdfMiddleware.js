const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Cloudinary storage for PDF uploads (events / notices)
// const pdfStorage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "bar_uploads/pdfs",
//     allowed_formats: ["pdf"],
//     resource_type: "raw", // required for non-image files
//     public_id: (req, file) =>
//       `pdf_${Date.now()}_${Math.round(Math.random() * 1e9)}.pdf`,
//   },
// });

const pdfStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "bar_uploads/pdfs",

    allowed_formats: ["pdf"],

    resource_type: "auto",

    public_id: `pdf_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
  },
});

// PDF-only filter (unchanged)
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed."));
  }
};

const uploadPdf = multer({
  storage: pdfStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: pdfFilter,
});

module.exports = uploadPdf;
