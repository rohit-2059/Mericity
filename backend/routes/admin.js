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
    res.status(500).json({ error: "Server error" });
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

module.exports = router;
