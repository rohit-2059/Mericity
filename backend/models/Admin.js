const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  adminId: { type: String, required: true, unique: true }, // Unique admin ID for login
  password: { type: String, required: true },

  // City assignment
  assignedCity: { type: String, required: true }, // e.g., "Mumbai", "Delhi", "Bangalore"
  assignedState: { type: String, required: true }, // e.g., "Maharashtra", "Delhi", "Karnataka"

  // Admin role and permissions
  role: { type: String, default: "city_admin" },
  isActive: { type: Boolean, default: true },

  // Optional: Geographic boundaries for more precise assignment
  cityBounds: {
    northeast: {
      lat: Number,
      lng: Number,
    },
    southwest: {
      lat: Number,
      lng: Number,
    },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password before saving
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
AdminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update timestamp on save
AdminSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient city-based queries
AdminSchema.index({ assignedCity: 1, assignedState: 1 });
AdminSchema.index({ adminId: 1 });

module.exports = mongoose.model("Admin", AdminSchema);
