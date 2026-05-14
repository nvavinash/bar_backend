const Notice = require("../models/Notice");
const path = require("path");
const fs = require("fs");

// GET /api/notices → public
const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (error) {
    console.error("Error fetching notices:", error);
    res.status(500).json({ message: "Failed to fetch notices" });
  }
};

// GET /api/notices/:id → public (single)
const getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });
    res.status(200).json(notice);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notice" });
  }
};

// POST /api/notices → admin only
const createNotice = async (req, res) => {
  try {
    const { title, description, type } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    let pdfPath = null;
    let pdfOriginalName = null;
    if (req.file) {
      pdfPath = `/uploads/${req.file.filename}`;
      pdfOriginalName = req.file.originalname;
    }

    const notice = new Notice({ title, description, type, pdfPath, pdfOriginalName });
    const saved = await notice.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error creating notice:", error);
    res.status(500).json({ message: "Failed to create notice", error: error.message });
  }
};

// PUT /api/notices/:id → admin only
const updateNotice = async (req, res) => {
  try {
    const { title, description, type } = req.body;
    const updateFields = { title, description, type };

    if (req.file) {
      // Delete old PDF file if exists
      const old = await Notice.findById(req.params.id);
      if (old?.pdfPath) {
        const oldPath = path.join(__dirname, "..", old.pdfPath);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateFields.pdfPath = `/uploads/${req.file.filename}`;
      updateFields.pdfOriginalName = req.file.originalname;
    }

    const updated = await Notice.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Notice not found" });
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating notice:", error);
    res.status(500).json({ message: "Failed to update notice" });
  }
};

// DELETE /api/notices/:id → admin only
const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });

    // Delete PDF file from disk
    if (notice.pdfPath) {
      const filePath = path.join(__dirname, "..", notice.pdfPath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.status(200).json({ message: "Notice deleted successfully" });
  } catch (error) {
    console.error("Error deleting notice:", error);
    res.status(500).json({ message: "Failed to delete notice" });
  }
};

module.exports = { getNotices, getNoticeById, createNotice, updateNotice, deleteNotice };
