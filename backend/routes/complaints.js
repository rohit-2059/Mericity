const express = require("express");
const multer = require("multer");
const Complaint = require("../models/Complaint");
const Admin = require("../models/Admin");
const auth = require("../middleware/auth"); // your JWT middleware
const geocodingService = require("../services/geocodingService");
const departmentDetectionService = require("../services/departmentDetectionService");
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
      let assignedDepartment = null;
      let departmentRouting = null;

      // Use AI to detect and route complaint to appropriate department
      try {
        console.log("Starting AI department detection...");

        const complaintData = {
          description,
          category: priority || "General", // Use priority as category hint if available
          location: {
            city: locationInfo.city,
            state: locationInfo.state,
            district: locationInfo.district,
          },
        };

        // Check if department detection service is available
        if (
          departmentDetectionService &&
          typeof departmentDetectionService.routeComplaintToDepartment ===
            "function"
        ) {
          departmentRouting =
            await departmentDetectionService.routeComplaintToDepartment(
              complaintData
            );
          console.log(
            "Department routing result:",
            JSON.stringify(departmentRouting, null, 2)
          );

          if (
            departmentRouting.success &&
            departmentRouting.assignedDepartment
          ) {
            assignedDepartment = departmentRouting.assignedDepartment._id;
            console.log(
              `Complaint automatically routed to: ${departmentRouting.assignedDepartment.name} (${departmentRouting.assignedDepartment.departmentType})`
            );
            console.log(
              `AI Confidence: ${departmentRouting.confidence}, Reasoning: ${departmentRouting.reasoning}`
            );
          } else {
            console.log(
              "AI routing failed or returned no department, falling back to admin assignment"
            );
          }
        } else {
          console.log(
            "Department detection service not available, falling back to admin assignment"
          );
        }
      } catch (aiError) {
        console.error("AI department routing failed:", aiError);
        console.log("Falling back to admin assignment");
        // Reset variables to prevent partial state
        departmentRouting = null;
        assignedDepartment = null;
      }

      // Fallback to admin assignment if AI routing fails
      if (
        !assignedDepartment &&
        locationInfo.city &&
        locationInfo.city !== "Unknown City"
      ) {
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
        assignedDepartment: assignedDepartment || null,
        ...(departmentRouting &&
          departmentRouting.success && {
            departmentRouting: {
              detectedDepartment: departmentRouting.detectedDepartment,
              confidence: departmentRouting.confidence,
              reasoning: departmentRouting.reasoning,
              analysisMethod: departmentRouting.analysis_method,
              isFallback: departmentRouting.is_fallback || false,
            },
          }),
        assignedCity,
        assignedState,
        image: imagePath,
        audio: audioPath,
        ...(priority && { priority }), // Only add priority if provided
        ...(reason && { reason }), // Only add reason if provided
      });

      console.log("Attempting to save complaint with data:", {
        userId: complaint.userId,
        assignedDepartment: complaint.assignedDepartment,
        assignedAdmin: complaint.assignedAdmin,
        hasImage: !!complaint.image,
        hasAudio: !!complaint.audio,
        location: complaint.location.city,
      });

      await complaint.save();
      console.log("Complaint saved successfully with ID:", complaint._id);

      // Populate admin and department info in response
      try {
        const populationQueries = [];

        if (complaint.assignedAdmin) {
          populationQueries.push({
            path: "assignedAdmin",
            select: "name email assignedCity assignedState",
          });
        }

        if (complaint.assignedDepartment) {
          populationQueries.push({
            path: "assignedDepartment",
            select:
              "name departmentType assignedCity assignedState email contactNumber",
          });
        }

        if (populationQueries.length > 0) {
          await complaint.populate(populationQueries);
        }

        console.log("Successfully populated complaint references");
      } catch (populateError) {
        console.error("Error populating complaint references:", populateError);
        // Continue without population if it fails
      }

      // Create response message based on routing result
      let responseMessage;
      if (complaint.assignedDepartment) {
        const dept = complaint.assignedDepartment;
        responseMessage = `🤖 AI automatically routed complaint to ${
          dept.name || "Department"
        } (${dept.departmentType || "Unknown Type"})`;
        if (departmentRouting && departmentRouting.confidence) {
          responseMessage += ` with ${Math.round(
            departmentRouting.confidence * 100
          )}% confidence`;
        }
      } else if (complaint.assignedAdmin) {
        const admin = complaint.assignedAdmin;
        responseMessage = `Complaint assigned to ${
          admin.name || "Admin"
        } (${assignedCity} Admin)`;
      } else {
        responseMessage = `Complaint created but no department or admin found for ${assignedCity}, ${assignedState}`;
      }

      res.json({
        complaint,
        message: responseMessage,
        routing: departmentRouting
          ? {
              method: departmentRouting.analysis_method,
              confidence: departmentRouting.confidence,
              reasoning: departmentRouting.reasoning,
              detectedDepartment: departmentRouting.detectedDepartment,
              isFallback: departmentRouting.is_fallback,
            }
          : null,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Calculate priority for a complaint based on location
router.post("/calculate-priority", auth, async (req, res) => {
  try {
    const { lat, lon, issueType = "general", category = "civic" } = req.body;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: lat and lon",
      });
    }

    // Import the priority calculation logic
    const axios = require("axios");
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

    let priority = "Medium";
    let reason = "General complaint.";
    let highPriorityReason = null;
    let highPriorityPlaceName = null;
    let isHighPriorityArea = false;
    let areaName = "the surrounding area";

    if (issueType === "colony-work") {
      priority = "Low";
      reason = "Minor residential issue.";
    }

    // Check for critical places nearby
    const criticalTerms = [
      "hospital",
      "school",
      "police station",
      "bus station",
      "airport",
      "temple",
      "tourist attraction",
      "landmark",
    ];

    for (const term of criticalTerms) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=500&keyword=${encodeURIComponent(
        term
      )}&key=${GOOGLE_MAPS_API_KEY}`;
      try {
        const response = await axios.get(url);

        if (response.data.results.length > 0) {
          highPriorityReason = `a key public service (${term})`;
          highPriorityPlaceName = response.data.results[0].name;
          isHighPriorityArea = true;
          break; // Stop after the first match
        }
      } catch (error) {
        console.error(`Error checking for ${term}:`, error.message);
      }
    }

    if (isHighPriorityArea) {
      priority = "High";
    }

    // Check for high traffic (only if priority isn't already high)
    if (priority !== "High") {
      try {
        const destinationLat = parseFloat(lat) + 0.005;
        const destinationLng = parseFloat(lon) + 0.005;

        const trafficUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat},${lon}&destination=${destinationLat},${destinationLng}&key=${GOOGLE_MAPS_API_KEY}&mode=driving&traffic_model=best_guess&departure_time=now`;
        const noTrafficUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat},${lon}&destination=${destinationLat},${destinationLng}&key=${GOOGLE_MAPS_API_KEY}&mode=driving`;

        const [trafficResponse, noTrafficResponse] = await Promise.all([
          axios.get(trafficUrl),
          axios.get(noTrafficUrl),
        ]);

        const trafficDuration =
          trafficResponse.data.routes[0]?.legs[0]?.duration_in_traffic?.value;
        const noTrafficDuration =
          noTrafficResponse.data.routes[0]?.legs[0]?.duration?.value;

        if (trafficDuration && noTrafficDuration) {
          const trafficDifference =
            (trafficDuration - noTrafficDuration) / noTrafficDuration;

          if (trafficDifference > 0.25) {
            priority = "High";
            highPriorityReason = "high traffic";
            highPriorityPlaceName = "the surrounding roads";
          }
        }
      } catch (error) {
        console.error("Traffic check error:", error.message);
      }
    }

    // Get area name from geocoding
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_MAPS_API_KEY}`;
      const geocodeResponse = await axios.get(geocodeUrl);
      const addressComponents =
        geocodeResponse.data.results[0]?.address_components;

      if (addressComponents) {
        const locality = addressComponents.find((comp) =>
          comp.types.includes("locality")
        )?.long_name;
        if (locality) {
          areaName = locality;
        }
      }
    } catch (error) {
      console.error("Geocoding error:", error.message);
    }

    // Final message construction
    let finalMessage;
    if (priority === "High") {
      if (isHighPriorityArea) {
        finalMessage = `Priority set to: High. Reason: The issue is located near ${highPriorityReason}. The identified place is ${highPriorityPlaceName}.`;
      } else {
        finalMessage = `Priority set to: High. Reason: The area is experiencing ${highPriorityReason}.`;
      }
    } else if (priority === "Medium") {
      finalMessage = `Priority set to: Medium. Reason: ${reason} in ${areaName}.`;
    } else {
      finalMessage = `Priority set to: Low. Reason: ${reason} in ${areaName}.`;
    }

    res.json({
      success: true,
      message: finalMessage,
      priority: priority,
      coordinates: { latitude: lat, longitude: lon },
      issue: issueType,
      areaName: areaName,
      highPriorityPlace: highPriorityPlaceName,
      reasoning: finalMessage,
    });
  } catch (error) {
    console.error("Priority calculation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate priority",
      details: error.message,
    });
  }
});

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

// Get all open complaints for explore (pending and in_progress from all users)
router.get("/explore", auth, async (req, res) => {
  try {
    const complaints = await Complaint.find({ 
      status: { $in: ["pending", "in_progress"] } // Show both pending and in_progress complaints
    })
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

// Community routes

// Get community complaints (all non-closed complaints from user's city)
router.get("/community", auth, async (req, res) => {
  try {
    // Get user's city and state from their profile
    const User = require("../models/User");
    const user = await User.findById(req.user.id);

    if (!user || !user.city) {
      return res.status(400).json({
        error:
          "Please complete your profile with city information to view community complaints",
      });
    }

    // Extract query parameters for filtering
    const {
      sortBy = "latest",
      voteFilter = "all",
      locationFilter = "all",
      minUpvotes,
      minDownvotes,
    } = req.query;

    // Build base query
    let baseQuery = {
      "location.city": { $regex: new RegExp(`^${user.city}$`, "i") },
      status: { $ne: "resolved" }, // Get pending and in_progress complaints
    };

    // Apply location filter
    if (locationFilter === "same-area" && user.sublocality) {
      baseQuery["location.sublocality"] = {
        $regex: new RegExp(`^${user.sublocality}$`, "i"),
      };
    }

    // Find all complaints matching base criteria
    let complaints = await Complaint.find(baseQuery)
      .populate("userId", "name")
      .populate("comments.userId", "name");

    // Add full URLs and calculate vote counts
    let complaintsWithUrls = complaints.map((complaint) => ({
      ...complaint.toObject(),
      imageUrl: complaint.image
        ? `${req.protocol}://${req.get("host")}/${complaint.image}`
        : null,
      audioUrl: complaint.audio
        ? `${req.protocol}://${req.get("host")}/${complaint.audio}`
        : null,
      upvoteCount: complaint.upvotes.length,
      downvoteCount: complaint.downvotes.length,
      hasUserUpvoted: complaint.upvotes.includes(req.user.id),
      hasUserDownvoted: complaint.downvotes.includes(req.user.id),
      isOwnComplaint: complaint.userId._id.toString() === req.user.id,
    }));

    // Apply vote filtering
    if (voteFilter === "upvoted-only") {
      complaintsWithUrls = complaintsWithUrls.filter((c) => c.upvoteCount > 0);
    } else if (voteFilter === "downvoted-only") {
      complaintsWithUrls = complaintsWithUrls.filter(
        (c) => c.downvoteCount > 0
      );
    } else if (voteFilter === "no-votes") {
      complaintsWithUrls = complaintsWithUrls.filter(
        (c) => c.upvoteCount === 0 && c.downvoteCount === 0
      );
    }

    // Apply minimum vote thresholds if specified
    if (minUpvotes && !isNaN(parseInt(minUpvotes))) {
      complaintsWithUrls = complaintsWithUrls.filter(
        (c) => c.upvoteCount >= parseInt(minUpvotes)
      );
    }
    if (minDownvotes && !isNaN(parseInt(minDownvotes))) {
      complaintsWithUrls = complaintsWithUrls.filter(
        (c) => c.downvoteCount >= parseInt(minDownvotes)
      );
    }

    // Apply sorting
    complaintsWithUrls.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "most-upvoted":
          return b.upvoteCount - a.upvoteCount;
        case "most-downvoted":
          return b.downvoteCount - a.downvoteCount;
        case "most-discussed":
          return (b.comments?.length || 0) - (a.comments?.length || 0);
        case "latest":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    res.json({
      complaints: complaintsWithUrls,
      userCity: user.city,
      userState: user.state,
      filters: {
        sortBy,
        voteFilter,
        locationFilter,
        applied:
          sortBy !== "latest" ||
          voteFilter !== "all" ||
          locationFilter !== "all",
      },
      stats: {
        total: complaints.length,
        filtered: complaintsWithUrls.length,
        upvoted: complaintsWithUrls.filter((c) => c.upvoteCount > 0).length,
        downvoted: complaintsWithUrls.filter((c) => c.downvoteCount > 0).length,
        noVotes: complaintsWithUrls.filter(
          (c) => c.upvoteCount === 0 && c.downvoteCount === 0
        ).length,
      },
    });
  } catch (err) {
    console.error("Community complaints error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Upvote a complaint
router.post("/:id/upvote", auth, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const userId = req.user.id;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Check if user already upvoted
    const hasUpvoted = complaint.upvotes.includes(userId);
    const hasDownvoted = complaint.downvotes.includes(userId);

    if (hasUpvoted) {
      // Remove upvote
      complaint.upvotes = complaint.upvotes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      // Add upvote and remove downvote if exists
      if (hasDownvoted) {
        complaint.downvotes = complaint.downvotes.filter(
          (id) => id.toString() !== userId
        );
      }
      complaint.upvotes.push(userId);
    }

    await complaint.save();

    res.json({
      upvoteCount: complaint.upvotes.length,
      downvoteCount: complaint.downvotes.length,
      hasUserUpvoted: complaint.upvotes.includes(userId),
      hasUserDownvoted: complaint.downvotes.includes(userId),
    });
  } catch (err) {
    console.error("Upvote error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Downvote a complaint
router.post("/:id/downvote", auth, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const userId = req.user.id;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Check if user already downvoted
    const hasUpvoted = complaint.upvotes.includes(userId);
    const hasDownvoted = complaint.downvotes.includes(userId);

    if (hasDownvoted) {
      // Remove downvote
      complaint.downvotes = complaint.downvotes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      // Add downvote and remove upvote if exists
      if (hasUpvoted) {
        complaint.upvotes = complaint.upvotes.filter(
          (id) => id.toString() !== userId
        );
      }
      complaint.downvotes.push(userId);
    }

    await complaint.save();

    res.json({
      upvoteCount: complaint.upvotes.length,
      downvoteCount: complaint.downvotes.length,
      hasUserUpvoted: complaint.upvotes.includes(userId),
      hasUserDownvoted: complaint.downvotes.includes(userId),
    });
  } catch (err) {
    console.error("Downvote error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add comment to a complaint
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    if (text.length > 500) {
      return res
        .status(400)
        .json({ error: "Comment must be less than 500 characters" });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const newComment = {
      userId: userId,
      text: text.trim(),
      createdAt: new Date(),
    };

    complaint.comments.push(newComment);
    await complaint.save();

    // Populate the newly added comment
    await complaint.populate("comments.userId", "name");

    // Get the newly added comment with user info
    const addedComment = complaint.comments[complaint.comments.length - 1];

    res.json({
      message: "Comment added successfully",
      comment: addedComment,
      commentCount: complaint.comments.length,
    });
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete comment (only by comment author)
router.delete("/:id/comment/:commentId", auth, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const commentId = req.params.commentId;
    const userId = req.user.id;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const comment = complaint.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check if user is the author of the comment
    if (comment.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "You can only delete your own comments" });
    }

    comment.remove();
    await complaint.save();

    res.json({
      message: "Comment deleted successfully",
      commentCount: complaint.comments.length,
    });
  } catch (err) {
    console.error("Delete comment error:", err);
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

    // Get ALL complaints for this admin's city (including those assigned to departments)
    const complaints = await Complaint.find({
      "location.city": { $regex: new RegExp(`^${admin.assignedCity}$`, "i") },
      "location.state": { $regex: new RegExp(`^${admin.assignedState}$`, "i") },
    })
      .populate("userId", "name email")
      .populate("assignedDepartment", "name departmentType")
      .sort({ createdAt: -1 });

    // Add full URLs for images and audio, plus canManage property and assignment info
    const complaintsWithUrls = complaints.map((complaint) => ({
      ...complaint.toObject(),
      imageUrl: complaint.image
        ? `http://localhost:5000/${complaint.image}`
        : null,
      audioUrl: complaint.audio
        ? `http://localhost:5000/${complaint.audio}`
        : null,
      canManage: !complaint.assignedDepartment, // Admin can only manage complaints NOT assigned to departments
      assignmentType: complaint.assignedDepartment ? 'department' : 'unassigned',
      assignedDepartmentId: complaint.assignedDepartment || null,
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

    // Find and update complaint (only if it's in admin's city AND not assigned to a department)
    const complaint = await Complaint.findOne({
      _id: complaintId,
      "location.city": { $regex: new RegExp(`^${admin.assignedCity}$`, "i") },
      "location.state": { $regex: new RegExp(`^${admin.assignedState}$`, "i") },
      assignedDepartment: null, // Admin can only manage complaints NOT assigned to departments
    });

    if (!complaint) {
      return res
        .status(404)
        .json({ error: "Complaint not found, not in your city, or already assigned to a department" });
    }

    // Store old status for notifications
    const oldStatus = complaint.status;
    const shouldAwardPoints =
      oldStatus === "pending" && status === "in_progress";

    // Check if status is actually changing
    const statusChanged = oldStatus !== status;

    complaint.status = status;
    complaint.updatedAt = new Date();
    await complaint.save();

    // Send notifications if status changed to in_progress or resolved
    if (statusChanged && (status === "in_progress" || status === "resolved")) {
      const notificationService = require("../services/notificationService");
      await notificationService.sendStatusUpdateNotification(
        complaint,
        oldStatus,
        status,
        admin.name
      );
    }

    // Award points to user if complaint status changes from pending to in_progress
    if (shouldAwardPoints) {
      const User = require("../models/User");
      const user = await User.findById(complaint.userId);

      if (user) {
        // Award 5 points
        user.points = (user.points || 0) + 5;

        // Add to points history
        if (!user.pointsHistory) {
          user.pointsHistory = [];
        }
        user.pointsHistory.push({
          points: 5,
          reason: "Complaint status changed from pending to in-progress",
          complaintId: complaint._id,
          awardedAt: new Date(),
        });

        await user.save();

        console.log(
          `Awarded 5 points to user ${user.name} (${user.email}) for complaint ${complaint._id}`
        );
      }
    }

    res.json({
      message: "Complaint status updated successfully",
      complaint: {
        id: complaint._id,
        status: complaint.status,
        updatedAt: complaint.updatedAt,
      },
      pointsAwarded: shouldAwardPoints ? 5 : 0,
      notificationSent:
        statusChanged && (status === "in_progress" || status === "resolved"),
    });
  } catch (error) {
    console.error("Update complaint status error:", error);
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

// Get complaints assigned to a department
router.get("/department/my-complaints", auth, async (req, res) => {
  try {
    // Check if the authenticated user is a department
    if (req.user.type !== "department") {
      return res.status(403).json({
        error: "Access denied. Department login required.",
      });
    }

    // Get department info
    const Department = require("../models/Department");
    const department = await Department.findById(req.user.id);
    if (!department) {
      return res.status(404).json({
        error: "Department not found",
      });
    }

    // Find complaints assigned to this specific department (AI-routed) or fallback to location/type matching
    let complaints;

    // First, try to find complaints directly assigned to this department (AI-routed)
    const directlyAssignedComplaints = await Complaint.find({
      assignedDepartment: req.user.id,
    }).sort({ createdAt: -1 });

    // Also find complaints in the department's assigned area and of their type (fallback/legacy)
    const locationBasedComplaints = await Complaint.find({
      assignedDepartment: null, // Only get complaints not yet assigned to a specific department
      $and: [
        {
          $or: [
            {
              "location.city": {
                $regex: new RegExp(department.assignedCity, "i"),
              },
            },
            {
              "location.state": {
                $regex: new RegExp(department.assignedState, "i"),
              },
            },
            {
              "location.district": {
                $regex: new RegExp(department.assignedDistrict, "i"),
              },
            },
          ],
        },
        {
          $or: [
            {
              "departmentRouting.detectedDepartment": department.departmentType,
            },
            {
              description: {
                $regex: new RegExp(
                  department.departmentType.replace(" Department", ""),
                  "i"
                ),
              },
            },
          ],
        },
      ],
    }).sort({ createdAt: -1 });

    // Combine both sets of complaints
    const allComplaints = [
      ...directlyAssignedComplaints,
      ...locationBasedComplaints,
    ];

    // Remove duplicates based on _id
    const uniqueComplaints = allComplaints.filter(
      (complaint, index, self) =>
        index ===
        self.findIndex((c) => c._id.toString() === complaint._id.toString())
    );

    complaints = uniqueComplaints;

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

    res.json({
      complaints: complaintsWithUrls,
      department: department.toJSON(),
    });
  } catch (err) {
    console.error("Department complaints error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update complaint status (for departments)
router.put("/department/:id/status", auth, async (req, res) => {
  try {
    // Check if the authenticated user is a department
    if (req.user.type !== "department") {
      return res.status(403).json({
        error: "Access denied. Department login required.",
      });
    }

    const { status, departmentComment } = req.body;
    const complaintId = req.params.id;

    if (!["pending", "in_progress", "resolved"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be pending, in_progress, or resolved",
      });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        error: "Complaint not found",
      });
    }

    // Store old status for points and notifications
    const oldStatus = complaint.status;
    const shouldAwardPoints =
      oldStatus === "pending" && status === "in_progress";

    // Check if status is actually changing
    const statusChanged = oldStatus !== status;

    // Update complaint status
    complaint.status = status;
    if (departmentComment) {
      complaint.departmentComment = departmentComment;
    }
    complaint.updatedAt = new Date();

    await complaint.save();

    // Send notifications if status changed to in_progress or resolved
    if (statusChanged && (status === "in_progress" || status === "resolved")) {
      const notificationService = require("../services/notificationService");
      const Department = require("../models/Department");
      const department = await Department.findById(req.user.id);
      
      await notificationService.sendStatusUpdateNotification(
        complaint,
        oldStatus,
        status,
        department ? department.name : "Department"
      );
    }

    // Award points to user if complaint status changes from pending to in_progress
    if (shouldAwardPoints) {
      const User = require("../models/User");
      const user = await User.findById(complaint.userId);

      if (user) {
        // Award 5 points
        user.points = (user.points || 0) + 5;

        // Add to points history
        if (!user.pointsHistory) {
          user.pointsHistory = [];
        }
        user.pointsHistory.push({
          points: 5,
          reason: "Complaint status changed from pending to in-progress by department",
          complaintId: complaint._id,
          awardedAt: new Date(),
        });

        await user.save();

        console.log(
          `Awarded 5 points to user ${user.name} (${user.email}) for complaint ${complaint._id} by department`
        );
      }
    }

    res.json({
      message: "Complaint status updated successfully",
      complaint: complaint.toObject(),
      pointsAwarded: shouldAwardPoints ? 5 : 0,
      notificationSent:
        statusChanged && (status === "in_progress" || status === "resolved"),
    });
  } catch (err) {
    console.error("Update complaint status error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
