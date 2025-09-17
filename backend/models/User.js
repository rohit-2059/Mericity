// models/user.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: String,
  email: { type: String, required: true, unique: true },
  password: String,            // <-- Add this
  name: String,
  phone: String,
  address: String,
  role: { type: String, default: "user" },
  profileComplete: { type: Boolean, default: false },
  lastLogin: Date,
  picture: String
});

module.exports = mongoose.model("User", userSchema);
