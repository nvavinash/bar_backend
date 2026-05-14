const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ["Notice", "Circular", "Order", "Announcement"],
      default: "Notice",
    },
    pdfPath: { type: String }, // stored path: /uploads/filename.pdf
    pdfOriginalName: { type: String }, // original filename for download
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notice", noticeSchema);
