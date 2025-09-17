const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ["user", "admin"], required: true },
  text: { type: String },
  attachments: [String],
  createdAt: { type: Date, default: Date.now },
});

const ComplaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  description: { type: String, required: true },

  // Location fields
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String }, // reverse geocoded formatted address
    detailedAddress: { type: String }, // detailed street address with all components
    streetAddress: { type: String }, // street number, route, and building info
    premise: { type: String }, // building/premise name
    subpremise: { type: String }, // apartment/unit number
    establishment: { type: String }, // establishment name
    pointOfInterest: { type: String }, // nearby point of interest
    sublocality: { type: String }, // primary sublocality/neighborhood
    sublocality1: { type: String }, // sublocality level 1
    sublocality2: { type: String }, // sublocality level 2
    sublocality3: { type: String }, // sublocality level 3
    city: { type: String }, // assigned city
    state: { type: String }, // assigned state
    district: { type: String }, // district/administrative area level 2
    postalCode: { type: String }, // postal/zip code
    country: { type: String }, // country
  },

  // Admin assignment
  assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  assignedCity: { type: String }, // for quick queries
  assignedState: { type: String },
  image: { type: String, required: true }, // store file URL/path - REQUIRED
  audio: { type: String }, // store audio file URL/path - OPTIONAL
  phone: { type: String, required: true }, // REQUIRED
  priority: { type: String, enum: ["High", "Medium", "Low"] }, // OPTIONAL
  reason: { type: String }, // OPTIONAL

  status: {
    type: String,
    enum: ["pending", "in_progress", "resolved"],
    default: "pending",
  },
  messages: [MessageSchema],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ComplaintSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Complaint", ComplaintSchema);
