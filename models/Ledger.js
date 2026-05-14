const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
    paymentMode: {
      type: String,
      enum: ["UPI", "Cash", "Bank", ""],
      default: "",
    },
    transactionId: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ledger", ledgerSchema);
