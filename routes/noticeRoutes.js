const express = require("express");
const router = express.Router();
const uploadPdf = require("../middleware/uploadPdfMiddleware");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
} = require("../controllers/noticeController");

// Public
router.get("/", getNotices);
router.get("/:id", getNoticeById);

// Admin only
router.post("/", protect, adminOnly, uploadPdf.single("pdf"), createNotice);
router.put("/:id", protect, adminOnly, uploadPdf.single("pdf"), updateNotice);
router.delete("/:id", protect, adminOnly, deleteNotice);

module.exports = router;
