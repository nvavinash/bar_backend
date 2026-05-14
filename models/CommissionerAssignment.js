const mongoose = require("mongoose");

const commissionerAssignmentSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    name: { type: String, required: true },
    experience: { type: Number, default: 0 },

    appointedBy: {
      type: String,
      required: true,
      enum: ["DRT-1 RO1", "DRT-1 RO2", "DRT-2 RO1", "DRT-2 RO2"],
    },

    rcNumber: { type: String, required: true, trim: true },
    assignedDate: { type: Date, default: Date.now },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedByEmail: { type: String }, // store editor email for display

    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommissionerAssignment", commissionerAssignmentSchema);
