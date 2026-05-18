const Notice = require("../models/Notice");

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
      // multer-storage-cloudinary stores the full Cloudinary URL in file.path
      pdfPath = req.file.path;
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
      // Cloudinary URL replaces the old URL
      updateFields.pdfPath = req.file.path;
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
    // Note: Cloudinary file is not deleted here.
    // To clean up Cloudinary files on delete, call cloudinary.uploader.destroy(public_id).

    res.status(200).json({ message: "Notice deleted successfully" });
  } catch (error) {
    console.error("Error deleting notice:", error);
    res.status(500).json({ message: "Failed to delete notice" });
  }
};

module.exports = { getNotices, getNoticeById, createNotice, updateNotice, deleteNotice };
