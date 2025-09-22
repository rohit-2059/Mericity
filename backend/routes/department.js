const express = require("express");
const jwt = require("jsonwebtoken");
const Department = require("../models/Department");
const auth = require("../middleware/auth");

const router = express.Router();

// Department login
router.post("/login", async (req, res) => {
  try {
    const { departmentId, password } = req.body;

    // Validate input
    if (!departmentId || !password) {
      return res.status(400).json({
        error: "Department ID and password are required",
      });
    }

    // Find department by departmentId
    const department = await Department.findByDepartmentId(departmentId);
    if (!department) {
      return res.status(401).json({
        error: "Invalid department ID or password",
      });
    }

    // Check password
    const isPasswordValid = await department.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid department ID or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: department._id,
        departmentId: department.departmentId,
        role: "department",
        type: "department",
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // Return success response
    res.json({
      message: "Login successful",
      token,
      department: {
        id: department._id,
        name: department.name,
        departmentId: department.departmentId,
        departmentType: department.departmentType,
        assignedCity: department.assignedCity,
        assignedState: department.assignedState,
        assignedDistrict: department.assignedDistrict,
        email: department.email,
        contactNumber: department.contactNumber,
        role: department.role,
      },
    });
  } catch (error) {
    console.error("Department login error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Get department profile (protected route)
router.get("/profile", auth, async (req, res) => {
  try {
    // Check if the authenticated user is a department
    if (req.user.type !== "department") {
      return res.status(403).json({
        error: "Access denied. Department login required.",
      });
    }

    const department = await Department.findById(req.user.id);
    if (!department) {
      return res.status(404).json({
        error: "Department not found",
      });
    }

    res.json({
      department: department.toJSON(),
    });
  } catch (error) {
    console.error("Get department profile error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Update department profile (protected route)
router.put("/profile", auth, async (req, res) => {
  try {
    // Check if the authenticated user is a department
    if (req.user.type !== "department") {
      return res.status(403).json({
        error: "Access denied. Department login required.",
      });
    }

    const allowedUpdates = [
      "contactNumber",
      "officeAddress",
      "headOfDepartment",
      "serviceAreas",
    ];

    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({
        error:
          "Invalid updates. Only contact number, office address, head of department, and service areas can be updated.",
      });
    }

    const department = await Department.findById(req.user.id);
    if (!department) {
      return res.status(404).json({
        error: "Department not found",
      });
    }

    updates.forEach((update) => {
      department[update] = req.body[update];
    });

    await department.save();

    res.json({
      message: "Profile updated successfully",
      department: department.toJSON(),
    });
  } catch (error) {
    console.error("Update department profile error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Change department password (protected route)
router.put("/change-password", auth, async (req, res) => {
  try {
    // Check if the authenticated user is a department
    if (req.user.type !== "department") {
      return res.status(403).json({
        error: "Access denied. Department login required.",
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "New password must be at least 6 characters long",
      });
    }

    const department = await Department.findById(req.user.id);
    if (!department) {
      return res.status(404).json({
        error: "Department not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await department.comparePassword(
      currentPassword
    );
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: "Current password is incorrect",
      });
    }

    // Update password
    department.password = newPassword;
    await department.save();

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change department password error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Get all departments (for admin use)
router.get("/all", auth, async (req, res) => {
  try {
    // Only admins can access this route
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied. Admin login required.",
      });
    }

    const departments = await Department.find({ isActive: true })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      departments,
      count: departments.length,
    });
  } catch (error) {
    console.error("Get all departments error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Logout (client-side token removal, but we can log it server-side)
router.post("/logout", auth, async (req, res) => {
  try {
    // Here you could implement token blacklisting if needed
    res.json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Department logout error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

module.exports = router;
