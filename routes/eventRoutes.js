const express = require("express");
const router = express.Router();
const uploadPdf = require("../middleware/uploadPdfMiddleware");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

// Public routes
router.get("/", getEvents);
router.get("/:id", getEventById);

// Admin routes
router.post("/", protect, adminOnly, uploadPdf.single("pdf"), createEvent);
router.put("/:id", protect, adminOnly, uploadPdf.single("pdf"), updateEvent);
router.delete("/:id", protect, adminOnly, deleteEvent);

module.exports = router;
