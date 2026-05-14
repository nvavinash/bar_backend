const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "editor", "member"],
      default: "member",
    },
    otp: {
      type: String, // Temporarily stores the encrypted/plain OTP
    },
    otpExpires: {
      type: Date, // Expiration time for the OTP
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
