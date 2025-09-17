const express = require("express");
const multer = require("multer");
const Complaint = require("../models/Complaint");
const Admin = require("../models/Admin");
const auth = require("../middleware/auth"); // your JWT middleware
const geocodingService = require("../services/geocodingService");
const router = express.Router();

// configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // make sure uploads/ exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// create complaint
router.post(
  "/",
  auth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { description, lat, lon, phone, priority, reason } = req.body;

      // Validate required fields
      if (!description || !lat || !lon || !phone) {
        return res.status(400).json({
          error:
            "Missing required fields: description, location (lat, lon), and phone are required",
        });
      }

      // Get image and audio paths if uploaded
      const imagePath = req.files["image"] ? req.files["image"][0].path : null;
      const audioPath = req.files["audio"] ? req.files["audio"][0].path : null;

      // Validate that image is provided
      if (!imagePath) {
        return res.status(400).json({
          error: "Image is required. Please upload a photo.",
        });
      }

      // Get city information from coordinates
      console.log(
        `Processing complaint with coordinates: lat=${lat}, lon=${lon}`
      );

      let locationInfo;
      try {
        locationInfo = await geocodingService.getCityFromCoordinates(lat, lon);
        console.log(
          "Location info from geocoding:",
          JSON.stringify(locationInfo, null, 2)
        );
      } catch (error) {
        console.error("Geocoding failed:", error);
        locationInfo = {
          city: "Unknown City",
          state: "Unknown State",
          formattedAddress: `${lat}, ${lon}`,
          source: "error",
        };
        console.log("Using fallback location info:", locationInfo);
      }

      // Find admin for this city
      let assignedAdmin = null;
      let assignedCity = locationInfo.city;
      let assignedState = locationInfo.state;

      if (locationInfo.city && locationInfo.city !== "Unknown City") {
        assignedAdmin = await Admin.findOne({
          assignedCity: { $regex: new RegExp(locationInfo.city, "i") },
          assignedState: { $regex: new RegExp(locationInfo.state, "i") },
          isActive: true,
        });

        if (assignedAdmin) {
          assignedCity = assignedAdmin.assignedCity;
          assignedState = assignedAdmin.assignedState;
          console.log(
            `Complaint assigned to admin: ${assignedAdmin.name} (${assignedCity}, ${assignedState})`
          );
        } else {
          console.log(
            `No admin found for ${locationInfo.city}, ${locationInfo.state}`
          );
        }
      }

      const complaint = new Complaint({
        userId: req.user.id,
        description,
        phone,
        location: {
          lat: parseFloat(lat),
          lng: parseFloat(lon),
          address: locationInfo.formattedAddress,
          detailedAddress: locationInfo.detailedAddress,
          streetAddress: locationInfo.streetAddress,
          premise: locationInfo.premise,
          subpremise: locationInfo.subpremise,
          establishment: locationInfo.establishment,
          pointOfInterest: locationInfo.pointOfInterest,
          sublocality: locationInfo.sublocality,
          sublocality1: locationInfo.sublocality1,
          sublocality2: locationInfo.sublocality2,
          sublocality3: locationInfo.sublocality3,
          city: locationInfo.city,
          state: locationInfo.state,
          district: locationInfo.district,
          postalCode: locationInfo.postalCode,
          country: locationInfo.country,
        },
        assignedAdmin: assignedAdmin ? assignedAdmin._id : null,
        assignedCity,
        assignedState,
        image: imagePath,
        audio: audioPath,
        ...(priority && { priority }), // Only add priority if provided
        ...(reason && { reason }), // Only add reason if provided
      });

      await complaint.save();

      // Populate admin info in response
      await complaint.populate(
        "assignedAdmin",
        "name email assignedCity assignedState"
      );

      res.json({
        complaint,
        message: assignedAdmin
          ? `Complaint assigned to ${assignedAdmin.name} (${assignedCity} Admin)`
          : `Complaint created but no admin found for ${assignedCity}, ${assignedState}`,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get all complaints for a user
router.get("/", auth, async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    // Add full URL to image and audio paths
    const complaintsWithUrls = complaints.map((complaint) => ({
      ...complaint.toObject(),
      imageUrl: complaint.image
        ? `${req.protocol}://${req.get("host")}/${complaint.image}`
        : null,
      audioUrl: complaint.audio
        ? `${req.protocol}://${req.get("host")}/${complaint.audio}`
        : null,
    }));

    res.json({ complaints: complaintsWithUrls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all pending complaints for explore (from all users)
router.get("/explore", auth, async (req, res) => {
  try {
    const complaints = await Complaint.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .populate("userId", "name email"); // Populate user info but keep it anonymous

    // Add full URL to image and audio paths, but remove sensitive user info
    const complaintsWithUrls = complaints.map((complaint) => ({
      ...complaint.toObject(),
      imageUrl: complaint.image
        ? `${req.protocol}://${req.get("host")}/${complaint.image}`
        : null,
      audioUrl: complaint.audio
        ? `${req.protocol}://${req.get("host")}/${complaint.audio}`
        : null,
      userId: undefined, // Remove user ID for privacy
      phone: complaint.phone
        ? complaint.phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2")
        : null, // Mask phone number
    }));

    res.json({ complaints: complaintsWithUrls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get a specific complaint by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Add full URLs to the response
    const complaintWithUrls = {
      ...complaint.toObject(),
      imageUrl: complaint.image
        ? `${req.protocol}://${req.get("host")}/${complaint.image}`
        : null,
      audioUrl: complaint.audio
        ? `${req.protocol}://${req.get("host")}/${complaint.audio}`
        : null,
    };

    res.json({ complaint: complaintWithUrls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin routes for managing city complaints
router.get("/admin/my-city", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin role required." });
    }

    // Find admin details
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Get complaints for this admin's city
    const complaints = await Complaint.find({
      assignedAdmin: admin._id,
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    // Add full URLs for images and audio
    const complaintsWithUrls = complaints.map((complaint) => ({
      ...complaint.toObject(),
      imageUrl: complaint.image
        ? `http://localhost:5000/${complaint.image}`
        : null,
      audioUrl: complaint.audio
        ? `http://localhost:5000/${complaint.audio}`
        : null,
    }));

    res.json({
      complaints: complaintsWithUrls,
      admin: {
        name: admin.name,
        city: admin.assignedCity,
        state: admin.assignedState,
      },
      count: complaintsWithUrls.length,
    });
  } catch (error) {
    console.error("Get admin city complaints error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update complaint status (admin only)
router.put("/admin/:id/status", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin role required." });
    }

    const { status } = req.body;
    const complaintId = req.params.id;

    // Validate status
    const validStatuses = ["pending", "in_progress", "resolved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Find admin
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Find and update complaint (only if assigned to this admin)
    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedAdmin: admin._id,
    });

    if (!complaint) {
      return res
        .status(404)
        .json({ error: "Complaint not found or not assigned to you" });
    }

    complaint.status = status;
    complaint.updatedAt = new Date();
    await complaint.save();

    res.json({
      message: "Complaint status updated successfully",
      complaint: {
        id: complaint._id,
        status: complaint.status,
        updatedAt: complaint.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update complaint status error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Get complaints for admin's city
router.get("/admin/my-city", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin role required." });
    }

    // Find admin
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Debug logging
    console.log("Admin info:", {
      id: admin._id,
      name: admin.name,
      assignedCity: admin.assignedCity,
      assignedState: admin.assignedState,
    });

    // Get all complaints for this admin's city (case-insensitive)
    const complaints = await Complaint.find({
      "location.city": { $regex: new RegExp(`^${admin.assignedCity}$`, "i") },
      "location.state": { $regex: new RegExp(`^${admin.assignedState}$`, "i") },
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    console.log(
      `Found ${complaints.length} complaints for ${admin.assignedCity}, ${admin.assignedState}`
    );

    // Also check all complaints to see what cities we have
    const allComplaints = await Complaint.find({}).select(
      "location.city location.state"
    );
    console.log(
      "All complaint locations:",
      allComplaints.map(
        (c) =>
          `${c.location?.city || "No City"}, ${c.location?.state || "No State"}`
      )
    );

    res.json({
      admin: {
        name: admin.name,
        city: admin.assignedCity,
        state: admin.assignedState,
      },
      complaints: complaints.map((complaint) => ({
        ...complaint.toObject(),
        imageUrl: complaint.image
          ? `http://localhost:5000/${complaint.image}`
          : null,
        audioUrl: complaint.audio
          ? `http://localhost:5000/${complaint.audio}`
          : null,
      })),
    });
  } catch (error) {
    console.error("Get city complaints error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Reverse geocoding endpoint - get detailed address from coordinates
router.post("/geocode", async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        error: "Both latitude and longitude are required",
      });
    }

    const locationInfo = await geocodingService.getCityFromCoordinates(
      lat,
      lng
    );

    res.json({
      success: true,
      location: locationInfo,
      message: `Address resolved using ${locationInfo.source}`,
    });
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    res.status(500).json({
      error: "Failed to resolve address from coordinates",
      details: error.message,
    });
  }
});

// Admin endpoint to update addresses for existing complaints
router.put("/admin/update-addresses", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin role required." });
    }

    // Find complaints that don't have detailed address information
    const complaintsToUpdate = await Complaint.find({
      $or: [
        { "location.detailedAddress": { $exists: false } },
        { "location.detailedAddress": null },
        { "location.detailedAddress": "" },
        { "location.streetAddress": { $exists: false } },
        { "location.streetAddress": null },
        { "location.streetAddress": "" },
      ],
    });

    console.log(
      `Found ${complaintsToUpdate.length} complaints to update with detailed addresses`
    );

    let updatedCount = 0;
    let errorCount = 0;

    for (const complaint of complaintsToUpdate) {
      try {
        const { lat, lng } = complaint.location;
        console.log(
          `Updating complaint ${complaint._id} with coordinates: ${lat}, ${lng}`
        );

        const locationInfo = await geocodingService.getCityFromCoordinates(
          lat,
          lng
        );

        await Complaint.findByIdAndUpdate(complaint._id, {
          $set: {
            "location.address": locationInfo.formattedAddress,
            "location.detailedAddress": locationInfo.detailedAddress,
            "location.streetAddress": locationInfo.streetAddress,
            "location.premise": locationInfo.premise,
            "location.subpremise": locationInfo.subpremise,
            "location.establishment": locationInfo.establishment,
            "location.pointOfInterest": locationInfo.pointOfInterest,
            "location.sublocality": locationInfo.sublocality,
            "location.sublocality1": locationInfo.sublocality1,
            "location.sublocality2": locationInfo.sublocality2,
            "location.sublocality3": locationInfo.sublocality3,
            "location.district": locationInfo.district,
            "location.postalCode": locationInfo.postalCode,
            "location.country": locationInfo.country,
            updatedAt: new Date(),
          },
        });

        updatedCount++;
        console.log(`Successfully updated complaint ${complaint._id}`);

        // Add delay to respect API rate limits
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(
          `Failed to update complaint ${complaint._id}:`,
          error.message
        );
        errorCount++;
      }
    }

    res.json({
      message: "Address update completed",
      totalFound: complaintsToUpdate.length,
      updated: updatedCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error("Update addresses error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
