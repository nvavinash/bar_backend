const mongoose = require("mongoose");

const commissionerQueueSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    assigned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommissionerQueue", commissionerQueueSchema);
