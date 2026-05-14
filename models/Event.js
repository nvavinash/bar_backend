const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ["event", "notice"], required: true },
    pdf: { type: String }, // path to the uploaded file
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
