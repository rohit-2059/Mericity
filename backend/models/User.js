// models/user.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: String,
  email: { type: String, unique: true, sparse: true },
  password: String, // <-- Add this
  name: String,
  phone: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function (v) {
        // Allow empty/null values, but if provided, must be valid Indian mobile number
        return !v || /^[6-9]\d{9}$/.test(v);
      },
      message:
        "Phone number must be a valid 10-digit Indian mobile number starting with 6-9",
    },
  },
  address: String,
  city: String, // <-- Add this
  state: String, // <-- Add this
  district: String, // Add district for better location tracking
  role: { type: String, default: "user" },
  profileComplete: { type: Boolean, default: false },
  lastLogin: Date,
  picture: String,
  points: { type: Number, default: 0 }, // Janawaaz points system
  pointsHistory: [
    {
      points: Number,
      reason: String,
      complaintId: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint" },
      awardedAt: { type: Date, default: Date.now },
    },
  ],
});

// Custom validation to ensure at least email or phone is provided (except for Google accounts)
userSchema.pre("save", function (next) {
  if (!this.googleId && !this.email && !this.phone) {
    const error = new Error("Either email or phone number is required");
    error.name = "ValidationError";
    return next(error);
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
