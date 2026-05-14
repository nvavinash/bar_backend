const mongoose = require("mongoose");

// Single-document config to store queue pointer index
const queuePointerSchema = new mongoose.Schema({
  key: { type: String, default: "commissioner_pointer", unique: true },
  pointer: { type: Number, default: 0 }, // index into sorted eligible member list
  cycleCount: { type: Number, default: 0 }, // how many full cycles completed
});

module.exports = mongoose.model("QueuePointer", queuePointerSchema);
