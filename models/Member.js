const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    // Personal Info
    name: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    address: { type: String, trim: true },
    state: { type: String, default: "Telangana", trim: true },
    dob: { type: String },
    bloodGroup: { type: String, trim: true },

    // Enrollment Details
    enrollmentNumber: { type: String, trim: true },
    enrollmentDate: { type: String },

    // Membership Details
    membershipType: { 
      type: String, 
      enum: ["PATRON MEMBER", "LIFE MEMBER", "ORDINARY MEMBER"], 
      default: "ORDINARY MEMBER" 
    },
    membershipDate: { type: String },
    membershipFee: { type: String },

    // Payment Info
    transactionNumber: { type: String, trim: true },
    amountPaid: { type: String },
    paymentTime: { type: String },
    paymentVerified: { type: Boolean, default: false },

    // Files
    photo: { type: String },           // relative path to uploaded photo
    barCertificate: { type: String },  // relative path to Bar Council Certificate

    // COP Status (Certificate of Practice)
    copStatus: {
      type: Boolean,
      default: false,
    },

    // Status
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true } 
  }
);

// Virtual property for isApproved based on status
memberSchema.virtual("isApproved").get(function () {
  return this.status === "Approved";
});
memberSchema.virtual("isApproved").set(function (val) {
  if (val) this.status = "Approved";
});

// Virtual: experience in years (calculated from enrollmentDate)
memberSchema.virtual("experience").get(function () {
  if (!this.enrollmentDate) return null;
  const enroll = new Date(this.enrollmentDate);
  if (isNaN(enroll.getTime())) return null;
  const now = new Date();
  const years = now.getFullYear() - enroll.getFullYear();
  // Adjust if birthday hasn't occurred yet this year
  const hasHadAnniversary =
    now.getMonth() > enroll.getMonth() ||
    (now.getMonth() === enroll.getMonth() && now.getDate() >= enroll.getDate());
  return hasHadAnniversary ? years : years - 1;
});

module.exports = mongoose.model("Member", memberSchema);
