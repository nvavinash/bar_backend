const mongoose = require("mongoose");

const virtualSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

const Virtual = mongoose.model("Virtual", virtualSchema);

module.exports = Virtual;
