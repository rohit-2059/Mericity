const express = require("express");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const router = express.Router();


// Admin Login (using adminId and password)
router.post("/login", async (req, res) => {
  try {
    const { adminId, password } = req.body;

    if (!adminId || !password) {
      return res
        .status(400)
        .json({ error: "Admin ID and password are required" });
    }

    // Find admin by adminId
    const admin = await Admin.findOne({
      adminId: adminId.trim(),
      isActive: true,
    });

    if (!admin) {
      return res.status(401).json({ error: "Invalid admin ID or password" });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid admin ID or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin._id,
        role: "admin",
        city: admin.assignedCity,
        state: admin.assignedState,
        adminId: admin.adminId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        adminId: admin.adminId,
        assignedCity: admin.assignedCity,
        assignedState: admin.assignedState,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});



// Get Admin Profile
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json({
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        assignedCity: admin.assignedCity,
        assignedState: admin.assignedState,
        role: admin.role,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all city admins (for super admin)
router.get("/cities", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const admins = await Admin.find({ isActive: true })
      .select("-password")
      .sort({ assignedState: 1, assignedCity: 1 });

    const cityList = admins.map((admin) => ({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      assignedCity: admin.assignedCity,
      assignedState: admin.assignedState,
      createdAt: admin.createdAt,
    }));

    res.json({ cities: cityList });
  } catch (error) {
    console.error("Get cities error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update admin profile
router.put("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { name, email } = req.body;
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Check if email is being changed and is unique
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({
        email: email.toLowerCase().trim(),
      });
      if (existingAdmin) {
        return res.status(400).json({ error: "Email already in use" });
      }
      admin.email = email.toLowerCase().trim();
    }

    if (name) admin.name = name.trim();

    await admin.save();

    res.json({
      message: "Profile updated successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        assignedCity: admin.assignedCity,
        assignedState: admin.assignedState,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Server error", details: error?.message });
  }
});

// Middleware to authenticate admin
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};

// Get all complaints from admin's assigned city (viewing only)
router.get("/complaints", authenticateAdmin, async (req, res) => {
  try {
    const Complaint = require("../models/Complaint");
    
    // Get admin info
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    console.log(`Fetching complaints for admin: ${admin.name} (${admin.assignedCity}, ${admin.assignedState})`);

    // Find all complaints from admin's assigned city and state
    const complaints = await Complaint.find({
      $and: [
        {
          $or: [
            { 'location.city': { $regex: new RegExp(admin.assignedCity, 'i') } },
            { assignedCity: { $regex: new RegExp(admin.assignedCity, 'i') } }
          ]
        },
        {
          $or: [
            { 'location.state': { $regex: new RegExp(admin.assignedState, 'i') } },
            { assignedState: { $regex: new RegExp(admin.assignedState, 'i') } }
          ]
        }
      ]
    })
    .populate('userId', 'name email phone')
    .populate('assignedDepartment', 'name departmentType email contactNumber')
    .sort({ createdAt: -1 });

    // Add full URL to image and audio paths, and canManage property
    const complaintsWithUrls = complaints.map((complaint) => ({
      ...complaint.toObject(),
      imageUrl: complaint.image
        ? `${req.protocol}://${req.get("host")}/${complaint.image}`
        : null,
      audioUrl: complaint.audio
        ? `${req.protocol}://${req.get("host")}/${complaint.audio}`
        : null,
      canManage: !complaint.assignedDepartment, // Admin can only manage complaints not assigned to departments
    }));

    // Calculate stats
    const stats = {
      pending: complaintsWithUrls.filter(c => c.status === "pending").length,
      in_progress: complaintsWithUrls.filter(c => c.status === "in_progress").length,
      resolved: complaintsWithUrls.filter(c => c.status === "resolved").length,
      total: complaintsWithUrls.length
    };

    res.json({ 
      complaints: complaintsWithUrls,
      stats,
      admin: {
        name: admin.name,
        city: admin.assignedCity,
        state: admin.assignedState
      },
      message: `Found ${complaintsWithUrls.length} complaints from ${admin.assignedCity}, ${admin.assignedState}`,
      note: "Admin can view all complaints but cannot modify status - only departments can update complaint status"
    });

  } catch (error) {
    console.error("Admin complaints fetch error:", error);
    res.status(500).json({ error: "Server error", details: error?.message });
  }
});

// Get complaint statistics for admin's city
router.get("/stats", authenticateAdmin, async (req, res) => {
  try {
    const Complaint = require("../models/Complaint");
    const Department = require("../models/Department");
    
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Get complaint stats
    const totalComplaints = await Complaint.countDocuments({
      $and: [
        {
          $or: [
            { 'location.city': { $regex: new RegExp(admin.assignedCity, 'i') } },
            { assignedCity: { $regex: new RegExp(admin.assignedCity, 'i') } }
          ]
        },
        {
          $or: [
            { 'location.state': { $regex: new RegExp(admin.assignedState, 'i') } },
            { assignedState: { $regex: new RegExp(admin.assignedState, 'i') } }
          ]
        }
      ]
    });

    const pendingComplaints = await Complaint.countDocuments({
      status: "pending",
      $and: [
        {
          $or: [
            { 'location.city': { $regex: new RegExp(admin.assignedCity, 'i') } },
            { assignedCity: { $regex: new RegExp(admin.assignedCity, 'i') } }
          ]
        },
        {
          $or: [
            { 'location.state': { $regex: new RegExp(admin.assignedState, 'i') } },
            { assignedState: { $regex: new RegExp(admin.assignedState, 'i') } }
          ]
        }
      ]
    });

    const inProgressComplaints = await Complaint.countDocuments({
      status: "in_progress",
      $and: [
        {
          $or: [
            { 'location.city': { $regex: new RegExp(admin.assignedCity, 'i') } },
            { assignedCity: { $regex: new RegExp(admin.assignedCity, 'i') } }
          ]
        },
        {
          $or: [
            { 'location.state': { $regex: new RegExp(admin.assignedState, 'i') } },
            { assignedState: { $regex: new RegExp(admin.assignedState, 'i') } }
          ]
        }
      ]
    });

    const resolvedComplaints = await Complaint.countDocuments({
      status: "resolved",
      $and: [
        {
          $or: [
            { 'location.city': { $regex: new RegExp(admin.assignedCity, 'i') } },
            { assignedCity: { $regex: new RegExp(admin.assignedCity, 'i') } }
          ]
        },
        {
          $or: [
            { 'location.state': { $regex: new RegExp(admin.assignedState, 'i') } },
            { assignedState: { $regex: new RegExp(admin.assignedState, 'i') } }
          ]
        }
      ]
    });

    // Get department stats
    const activeDepartments = await Department.countDocuments({
      isActive: true,
      $or: [
        { assignedCity: { $regex: new RegExp(admin.assignedCity, 'i') } },
        { assignedState: { $regex: new RegExp(admin.assignedState, 'i') } }
      ]
    });

    res.json({
      stats: {
        total: totalComplaints,
        pending: pendingComplaints,
        in_progress: inProgressComplaints,
        resolved: resolvedComplaints,
        departments: activeDepartments
      },
      admin: {
        name: admin.name,
        city: admin.assignedCity,
        state: admin.assignedState
      }
    });

  } catch (error) {
    console.error("Admin stats fetch error:", error);
    res.status(500).json({ error: "Server error", details: error?.message });
  }
});

module.exports = router;
