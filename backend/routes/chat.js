const express = require("express");
const auth = require("../middleware/auth");
const Chat = require("../models/Chat");
const User = require("../models/User");
const Department = require("../models/Department");
const Admin = require("../models/Admin");
const Complaint = require("../models/Complaint");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Configure multer for chat image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// =============================================================================
// USER CHAT ENDPOINTS
// =============================================================================

// Create or get existing chat for a complaint (User -> Department)
router.post("/create", auth, async (req, res) => {
  try {
    const { complaintId } = req.body;
    
    if (!complaintId) {
      return res.status(400).json({ error: "Complaint ID is required" });
    }

    // Verify the complaint exists and belongs to the user
    const complaint = await Complaint.findOne({
      _id: complaintId,
      userId: req.user.id
    }).populate("assignedDepartment", "name departmentType");

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found or you don't have access to it" });
    }

    if (!complaint.assignedDepartment) {
      return res.status(400).json({ 
        error: "This complaint hasn't been assigned to a department yet. Please wait for assignment." 
      });
    }

    // Check if chat already exists for this complaint
    let chat = await Chat.findOne({
      chatType: 'complaint',
      complaintId: complaintId,
      userId: req.user.id
    }).populate("departmentId", "name departmentType");

    // If chat doesn't exist, create it
    if (!chat) {
      chat = await Chat.createComplaintChat(
        req.user.id,
        complaint.assignedDepartment._id,
        complaintId
      );
      await chat.populate("departmentId", "name departmentType");
    }

    res.json({
      success: true,
      chat: chat
    });

  } catch (error) {
    console.error("Create chat error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get messages for a specific chat
router.get("/messages/:chatId", auth, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId)
      .populate("messages.senderId", "name email")
      .populate("departmentId", "name departmentType")
      .populate("userId", "name email")
      .populate("adminId", "name");

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Verify requester has access (any participant can access).
    const toId = (val) => (val && val._id ? String(val._id) : val ? String(val) : null);
    const requesterId = String(req.user.id);
    const userType = req.user.type || 'user';
    const chatUserId = toId(chat.userId);
    const chatDeptId = toId(chat.departmentId);
    const chatAdminId = toId(chat.adminId);

    let hasAccess = [chatUserId, chatDeptId, chatAdminId].filter(Boolean).includes(requesterId);

    // Optional: admins may access complaint chats in their city even if not direct participant
    if (!hasAccess && userType === 'admin' && chat.chatType === 'complaint') {
      // For now, restrict to direct participants to avoid extra DB lookups
      hasAccess = false;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this chat" });
    }

    // Sort messages by creation date (support legacy docs without messages)
    const msgs = Array.isArray(chat.messages) ? [...chat.messages] : [];
    msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.json({
      success: true,
      messages: msgs,
      chat: {
        _id: chat._id,
        chatType: chat.chatType,
        departmentId: chat.departmentId,
        userId: chat.userId,
        adminId: chat.adminId
      }
    });

  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Send a text message
router.post("/message", auth, async (req, res) => {
  try {
    const { chatId, content, senderType } = req.body;

    if (!chatId || !content?.trim() || !senderType) {
      return res.status(400).json({ error: "Chat ID, content, and sender type are required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Determine sender model and verify access
    let senderModel;
    let senderId;
    const userType = req.user.type || 'user';

    if (userType === 'user' && senderType === 'user') {
      senderModel = 'User';
      senderId = req.user.id;
      // Verify user is part of this chat
      if (!(String(chat.userId) === String(req.user.id))) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else if (userType === 'department' && senderType === 'department') {
      senderModel = 'Department';
      senderId = req.user.id; // use Department ObjectId from auth
      // Verify department is part of this chat
      if (!(String(chat.departmentId) === String(req.user.id))) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else if (userType === 'admin' && senderType === 'admin') {
      senderModel = 'Admin';
      senderId = req.user.id;
      // Verify admin has access to this chat
      if (chat.chatType === 'admin-department') {
        if (!(String(chat.adminId) === String(req.user.id))) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
    } else {
      return res.status(400).json({ error: "Invalid sender type for your user type" });
    }

    // Add message to chat
    await chat.addMessage(senderId, senderModel, senderType, content.trim());
    
    // Get the newly added message with populated data
    const updatedChat = await Chat.findById(chatId)
      .populate("messages.senderId", "name email");
    
    const newMessage = updatedChat.messages[updatedChat.messages.length - 1];

    res.json({
      success: true,
      message: newMessage
    });

  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Send an image message
router.post("/message/image", upload.single("image"), auth, async (req, res) => {
  try {
    const { chatId, senderType } = req.body;

    if (!chatId || !senderType || !req.file) {
      return res.status(400).json({ error: "Chat ID, sender type, and image are required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Determine sender model and verify access (same logic as text message)
    let senderModel;
    let senderId;
    const userType = req.user.type || 'user';

    if (userType === 'user' && senderType === 'user') {
      senderModel = 'User';
      senderId = req.user.id;
      if (!(String(chat.userId) === String(req.user.id))) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else if (userType === 'department' && senderType === 'department') {
      senderModel = 'Department';
      senderId = req.user.id;
      if (!(String(chat.departmentId) === String(req.user.id))) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else if (userType === 'admin' && senderType === 'admin') {
      senderModel = 'Admin';
      senderId = req.user.id;
      if (chat.chatType === 'admin-department' && !(String(chat.adminId) === String(req.user.id))) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else {
      return res.status(400).json({ error: "Invalid sender type for your user type" });
    }

    // Add image message to chat
    await chat.addMessage(
      senderId, 
      senderModel, 
      senderType, 
      req.body.content || "Shared an image", 
      'image', 
      req.file.filename
    );
    
    // Get the newly added message with populated data
    const updatedChat = await Chat.findById(chatId)
      .populate("messages.senderId", "name email");
    
    const newMessage = updatedChat.messages[updatedChat.messages.length - 1];

    res.json({
      success: true,
      message: newMessage
    });

  } catch (error) {
    console.error("Send image message error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark chat as read
router.post("/read/:chatId", auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userType = req.user.type || 'user';

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Verify access and mark as read
    if (userType === 'user' && String(chat.userId) === String(req.user.id)) {
      await chat.markAsReadBy(req.user.id, 'user');
    } else if (userType === 'department' && String(chat.departmentId) === String(req.user.id)) {
      await chat.markAsReadBy(req.user.id, 'department');
    } else if (userType === 'admin') {
      if (String(chat.adminId) === String(req.user.id) || chat.chatType === 'complaint') {
        await chat.markAsReadBy(req.user.id, 'admin');
      }
    } else {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ success: true });

  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// =============================================================================
// ADMIN CHAT ENDPOINTS
// =============================================================================

// Create or get admin-department chat
router.post("/admin/create", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { departmentId } = req.body;
    
    if (!departmentId) {
      return res.status(400).json({ error: "Department ID is required" });
    }

  // Verify department exists and is in admin's jurisdiction (city/state or district/state)
  const admin = await Admin.findById(req.user.id);
    const department = await Department.findById(departmentId);

    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Case-insensitive comparison helpers
    const eq = (a,b) => String(a||'').trim().toLowerCase() === String(b||'').trim().toLowerCase();
    const cityOk = eq(department.assignedCity, admin.assignedCity) || eq(department.assignedDistrict, admin.assignedCity);
    const stateOk = eq(department.assignedState, admin.assignedState);
    if (!(cityOk && stateOk)) {
      return res.status(403).json({ error: "You can only chat with departments registered in your assigned district/city and state" });
    }

    // Always try to reuse any existing chat for this department (single thread per department)
    let chat = await Chat.findOne({ chatType: 'admin-department', departmentId: departmentId })
      .populate("departmentId", "name departmentType assignedCity assignedState")
      .populate("adminId", "name assignedCity assignedState");

    // If a chat exists but is assigned to another admin, adopt it when jurisdiction matches
    if (chat && String(chat.adminId) !== String(req.user.id)) {
      const eq = (a,b) => String(a||'').trim().toLowerCase() === String(b||'').trim().toLowerCase();
      const stateOk2 = eq(admin.assignedState, department.assignedState);
      const cityOk2 = eq(admin.assignedCity, department.assignedCity) || eq(admin.assignedCity, department.assignedDistrict);
      if (stateOk2 && cityOk2) {
        chat.adminId = req.user.id;
        await chat.save();
      } else {
        return res.status(403).json({ error: "You can only chat with departments in your assigned district/city and state" });
      }
    }

    // If chat doesn't exist, create it
    if (!chat) {
      chat = await Chat.createAdminDepartmentChat(req.user.id, departmentId);
      await chat.populate("departmentId", "name departmentType assignedCity assignedState");
      await chat.populate("adminId", "name assignedCity assignedState");
    }

    res.json({
      success: true,
      chat: chat
    });

  } catch (error) {
    console.error("Create admin chat error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all chats for admin
router.get("/admin/my-chats", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const chats = await Chat.find({
      chatType: 'admin-department',
      adminId: req.user.id
    })
    .populate("departmentId", "name departmentType")
    .populate("adminId", "name")
    .sort({ lastActivity: -1 });

    res.json({
      success: true,
      chats: chats
    });

  } catch (error) {
    console.error("Get admin chats error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// =============================================================================
// ADMIN-DEPARTMENT ENDPOINT ALIASES (for frontend compatibility)
// =============================================================================

// Create or get admin-department chat (alias)
router.post("/admin-dept/create", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { departmentId } = req.body;
    if (!departmentId) return res.status(400).json({ error: "Department ID is required" });

    // Verify jurisdiction
    const admin = await Admin.findById(req.user.id);
    const department = await Department.findById(departmentId);
    if (!department) return res.status(404).json({ error: "Department not found" });
    const eq = (a,b) => String(a||'').trim().toLowerCase() === String(b||'').trim().toLowerCase();
    const cityOk = eq(department.assignedCity, admin.assignedCity) || eq(department.assignedDistrict, admin.assignedCity);
    const stateOk = eq(department.assignedState, admin.assignedState);
    if (!(cityOk && stateOk)) {
      return res.status(403).json({ error: "You can only chat with departments registered in your assigned district/city and state" });
    }

    let chat = await Chat.findOne({ chatType: 'admin-department', adminId: req.user.id, departmentId })
      .populate("departmentId", "name departmentType assignedCity assignedState")
      .populate("adminId", "name assignedCity assignedState");
    if (!chat) {
      chat = await Chat.createAdminDepartmentChat(req.user.id, departmentId);
      await chat.populate("departmentId", "name departmentType assignedCity assignedState");
      await chat.populate("adminId", "name assignedCity assignedState");
    }
    return res.json({ success: true, chat });
  } catch (err) {
    console.error("Admin-dept create error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get messages for admin-dept chat (alias) - supports admin and department sides
router.get("/admin-dept/messages/:chatId", auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId)
      .populate("messages.senderId", "name email")
      .populate("departmentId", "name departmentType assignedCity assignedState")
      .populate("adminId", "name assignedCity assignedState");
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    if (chat.chatType !== 'admin-department') return res.status(400).json({ error: "Invalid chat type" });
    const isAdmin = req.user.role === 'admin' && String(chat.adminId) === String(req.user.id);
    const isDept = req.user.type === 'department' && String(chat.departmentId) === String(req.user.id);
    if (!isAdmin && !isDept) return res.status(403).json({ error: "Access denied to this chat" });
    const msgs = Array.isArray(chat.messages) ? [...chat.messages] : [];
    msgs.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    return res.json({ success: true, messages: msgs, chat: { _id: chat._id, chatType: chat.chatType, departmentId: chat.departmentId, adminId: chat.adminId } });
  } catch (err) {
    console.error("Admin-dept messages error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Send text message in admin-dept chat (alias) - supports admin and department
router.post("/admin-dept/message", auth, async (req, res) => {
  try {
    const { chatId, content } = req.body;
    if (!chatId || !content?.trim()) return res.status(400).json({ error: "Chat ID and content are required" });
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    if (chat.chatType !== 'admin-department') return res.status(400).json({ error: "Invalid chat type" });
    const isAdmin = req.user.role === 'admin' && String(chat.adminId) === String(req.user.id);
    const isDept = req.user.type === 'department' && String(chat.departmentId) === String(req.user.id);
    if (!isAdmin && !isDept) return res.status(403).json({ error: "Access denied" });

    if (isAdmin) {
      await chat.addMessage(req.user.id, 'Admin', 'admin', content.trim());
    } else {
      await chat.addMessage(req.user.id, 'Department', 'department', content.trim());
    }
    const updatedChat = await Chat.findById(chatId).populate("messages.senderId", "name email");
    const newMessage = updatedChat.messages[updatedChat.messages.length - 1];
    return res.json({ success: true, message: newMessage });
  } catch (err) {
    console.error("Admin-dept send message error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Send image in admin-dept chat (alias) - supports admin and department
router.post("/admin-dept/message/image", upload.single("image"), auth, async (req, res) => {
  try {
    const { chatId } = req.body;
    if (!chatId || !req.file) return res.status(400).json({ error: "Chat ID and image are required" });
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    if (chat.chatType !== 'admin-department') return res.status(400).json({ error: "Invalid chat type" });
    const isAdmin = req.user.role === 'admin' && String(chat.adminId) === String(req.user.id);
    const isDept = req.user.type === 'department' && String(chat.departmentId) === String(req.user.id);
    if (!isAdmin && !isDept) return res.status(403).json({ error: "Access denied" });

    if (isAdmin) {
      await chat.addMessage(req.user.id, 'Admin', 'admin', req.body.content || 'Shared an image', 'image', req.file.filename);
    } else {
      await chat.addMessage(req.user.id, 'Department', 'department', req.body.content || 'Shared an image', 'image', req.file.filename);
    }
    const updatedChat = await Chat.findById(chatId).populate("messages.senderId", "name email");
    const newMessage = updatedChat.messages[updatedChat.messages.length - 1];
    return res.json({ success: true, message: newMessage });
  } catch (err) {
    console.error("Admin-dept send image error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Mark admin-dept chat as read (alias) - supports admin and department
router.post("/admin-dept/read/:chatId", auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    if (chat.chatType !== 'admin-department') return res.status(400).json({ error: "Invalid chat type" });
    const isAdmin = req.user.role === 'admin' && String(chat.adminId) === String(req.user.id);
    const isDept = req.user.type === 'department' && String(chat.departmentId) === String(req.user.id);
    if (!isAdmin && !isDept) return res.status(403).json({ error: "Access denied" });
    await chat.markAsReadBy(req.user.id, isAdmin ? 'admin' : 'department');
    return res.json({ success: true });
  } catch (err) {
    console.error("Admin-dept read error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Department-initiated creation with city/state matching the logged-in department
router.post("/admin-dept/create-with-city", auth, async (req, res) => {
  try {
    if (req.user.type !== 'department') {
      return res.status(403).json({ error: "Department access required" });
    }

    const department = await Department.findById(req.user.id);
    if (!department) return res.status(404).json({ error: "Department not found" });

    // Find the admin responsible for this department's city/district/state
    const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cityOrDistrict = `${escapeRegex(department.assignedCity)}|${escapeRegex(department.assignedDistrict)}`;
    const admin = await Admin.findOne({
      assignedState: { $regex: new RegExp(`^${escapeRegex(department.assignedState)}$`, 'i') },
      assignedCity: { $regex: new RegExp(`^(${cityOrDistrict})$`, 'i') }
    });

    if (!admin) {
      return res.status(404).json({ error: "City admin not found for your district/city" });
    }

    // Ensure or create chat
    let chat = await Chat.findOne({ chatType: 'admin-department', adminId: admin._id, departmentId: department._id })
      .populate("adminId", "name assignedCity assignedState")
      .populate("departmentId", "name departmentType assignedCity assignedState");
    if (!chat) {
      chat = await Chat.createAdminDepartmentChat(admin._id, department._id);
      await chat.populate("adminId", "name assignedCity assignedState");
      await chat.populate("departmentId", "name departmentType assignedCity assignedState");
    }

    return res.json({ success: true, chat });
  } catch (err) {
    console.error("Dept create-with-city error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// List admin-dept chats for current user (admin or department) with lastMessage and unreadCount
router.get("/admin-dept/my", auth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const isDept = req.user.type === 'department';
    if (!isAdmin && !isDept) return res.status(403).json({ error: "Access denied" });

    const filter = isAdmin
      ? { chatType: 'admin-department', adminId: req.user.id }
      : { chatType: 'admin-department', departmentId: req.user.id };

    const chats = await Chat.find(filter)
      .populate("departmentId", "name departmentType assignedCity assignedState")
      .populate("adminId", "name assignedCity assignedState")
      .sort({ lastActivity: -1 });

    const participantKey = isAdmin ? 'admin' : 'department';
    const mapped = chats.map(c => {
      const messages = Array.isArray(c.messages) ? c.messages : [];
      const lm = messages.length ? messages[messages.length - 1] : null;
      return {
        _id: c._id,
        adminId: c.adminId,
        departmentId: c.departmentId,
        status: c.status,
        city: isAdmin ? c.departmentId?.assignedCity : c.adminId?.assignedCity,
        state: isAdmin ? c.departmentId?.assignedState : c.adminId?.assignedState,
        unreadCount: Number(c.unreadCounts?.[participantKey] || 0),
        lastMessage: lm ? {
          _id: lm._id,
          content: lm.content,
          messageType: lm.messageType,
          imageUrl: lm.imageUrl,
          createdAt: lm.createdAt,
          senderModel: lm.senderModel
        } : null,
      };
    });

    return res.json({ success: true, chats: mapped });
  } catch (err) {
    console.error("Admin-dept list error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Unread summary for admin-dept chats
router.get("/admin-dept/unread-count", auth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const isDept = req.user.type === 'department';
    if (!isAdmin && !isDept) return res.status(403).json({ error: "Access denied" });

    const filter = isAdmin
      ? { chatType: 'admin-department', adminId: req.user.id }
      : { chatType: 'admin-department', departmentId: req.user.id };
    const chats = await Chat.find(filter).select('unreadCounts');
    const key = isAdmin ? 'admin' : 'department';
    const total = chats.reduce((acc, c) => acc + (c.unreadCounts?.[key] || 0), 0);
    return res.json({ success: true, totalUnread: total });
  } catch (err) {
    console.error("Admin-dept unread error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// =============================================================================
// DEPARTMENT CHAT ENDPOINTS
// =============================================================================

// Get all chats for department (both user complaints and admin chats)
router.get("/department/my-chats", auth, async (req, res) => {
  try {
    if (req.user.type !== 'department') {
      return res.status(403).json({ error: "Department access required" });
    }

    const chats = await Chat.find({
      departmentId: req.user.id
    })
    .populate("userId", "name email")
    .populate("adminId", "name")
    .populate("departmentId", "name departmentType")
    .populate("complaintId", "description status")
    .sort({ lastActivity: -1 });

    res.json({
      success: true,
      chats: chats
    });

  } catch (error) {
    console.error("Get department chats error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get department chats (placeholder for now - for backward compatibility)
router.get("/department", auth, async (req, res) => {
  try {
    // Check if the authenticated user is a department
    if (req.user.type !== "department") {
      return res.status(403).json({
        error: "Access denied. Department login required.",
      });
    }

    // Redirect to the proper endpoint
    return res.redirect('/chat/department/my-chats');
  } catch (err) {
    console.error("Department chat error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =============================================================================
// GENERIC ENDPOINTS
// =============================================================================

// Get user's complaint chats
router.get("/my-complaint-chats", auth, async (req, res) => {
  try {
    const userType = req.user.type || 'user';
    
    if (userType !== 'user') {
      return res.status(403).json({ error: "User access required" });
    }

    const chats = await Chat.find({
      chatType: 'complaint',
      userId: req.user.id
    })
    .populate("departmentId", "name departmentType")
    .populate("complaintId", "description status")
    .populate("userId", "name email")
    .sort({ lastActivity: -1 });

    res.json({
      success: true,
      chats: chats
    });

  } catch (error) {
    console.error("Get user complaint chats error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get unread message counts
router.get("/unread-counts", auth, async (req, res) => {
  try {
    const userType = req.user.type || 'user';
    const isAdmin = req.user.role === 'admin';
    let query = {};
    let participantType = 'user';

    if (!isAdmin && userType === 'user') {
      query = { userId: req.user.id };
      participantType = 'user';
    } else if (!isAdmin && userType === 'department') {
      // Department identity is the authenticated user's id
      query = { departmentId: req.user.id };
      participantType = 'department';
    } else if (isAdmin) {
      query = { 
        $or: [
          { adminId: req.user.id },
          { chatType: 'complaint' } // Admins can see complaint chats in their city
        ]
      };
      participantType = 'admin';
    }

    const chats = await Chat.find(query);
    let totalUnread = 0;
    let chatUnreads = {};

    chats.forEach(chat => {
      const unreadCount = chat.unreadCounts[participantType] || 0;
      totalUnread += unreadCount;
      chatUnreads[chat._id] = unreadCount;
    });

    res.json({
      success: true,
      totalUnread,
      chatUnreads
    });

  } catch (error) {
    console.error("Get unread counts error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
