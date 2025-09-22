const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['User', 'Department', 'Admin']
  },
  senderType: {
    type: String,
    required: true,
    enum: ['user', 'department', 'admin']
  },
  content: {
    type: String,
    required: function() {
      return this.messageType === 'text';
    }
  },
  messageType: {
    type: String,
    enum: ['text', 'image'],
    default: 'text'
  },
  imageUrl: {
    type: String,
    required: function() {
      return this.messageType === 'image';
    }
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId
    },
    userType: {
      type: String,
      enum: ['user', 'department', 'admin']
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  // Chat Type: 'complaint' for user-department chats, 'admin-department' for admin-department chats
  chatType: {
    type: String,
    enum: ['complaint', 'admin-department'],
    required: true
  },
  
  // For complaint-based chats (user <-> department)
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: function() {
      return this.chatType === 'complaint';
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.chatType === 'complaint';
    }
  },
  
  // Department is always present in both types of chats
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  
  // For admin-department chats
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: function() {
      return this.chatType === 'admin-department';
    }
  },
  
  // Chat participants (for quick lookup)
  participants: [{
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'participants.participantModel'
    },
    participantModel: {
      type: String,
      enum: ['User', 'Department', 'Admin']
    },
    participantType: {
      type: String,
      enum: ['user', 'department', 'admin']
    }
  }],
  
  // Messages array
  messages: [messageSchema],
  
  // Last activity timestamp
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  // Unread message count per participant
  unreadCounts: {
    user: {
      type: Number,
      default: 0
    },
    department: {
      type: Number,
      default: 0
    },
    admin: {
      type: Number,
      default: 0
    }
  },
  
  // Chat status
  status: {
    type: String,
    enum: ['active', 'closed', 'archived'],
    default: 'active'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update lastActivity and updatedAt on message addition
chatSchema.pre('save', function() {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
    this.updatedAt = new Date();
  }
});

// Indexes for efficient queries
chatSchema.index({ complaintId: 1 });
chatSchema.index({ userId: 1 });
chatSchema.index({ departmentId: 1 });
chatSchema.index({ adminId: 1 });
chatSchema.index({ chatType: 1 });
chatSchema.index({ 'participants.participantId': 1 });
chatSchema.index({ lastActivity: -1 });

// Static method to create a complaint-based chat
chatSchema.statics.createComplaintChat = async function(userId, departmentId, complaintId) {
  const participants = [
    {
      participantId: userId,
      participantModel: 'User',
      participantType: 'user'
    },
    {
      participantId: departmentId,
      participantModel: 'Department',
      participantType: 'department'
    }
  ];
  
  return this.create({
    chatType: 'complaint',
    complaintId,
    userId,
    departmentId,
    participants
  });
};

// Static method to create admin-department chat
chatSchema.statics.createAdminDepartmentChat = async function(adminId, departmentId) {
  const participants = [
    {
      participantId: adminId,
      participantModel: 'Admin',
      participantType: 'admin'
    },
    {
      participantId: departmentId,
      participantModel: 'Department',
      participantType: 'department'
    }
  ];
  
  return this.create({
    chatType: 'admin-department',
    adminId,
    departmentId,
    participants
  });
};

// Instance method to add a message
chatSchema.methods.addMessage = function(senderId, senderModel, senderType, content, messageType = 'text', imageUrl = null) {
  const message = {
    senderId,
    senderModel,
    senderType,
    content,
    messageType,
    imageUrl
  };
  
  this.messages.push(message);
  
  // Reset sender's own unread and increment others that are actual participants of this chat
  const present = {
    user: this.chatType === 'complaint',
    department: true,
    admin: this.chatType === 'admin-department'
  };

  // Reset for sender
  if (senderType === 'user' && present.user) this.unreadCounts.user = 0;
  if (senderType === 'department' && present.department) this.unreadCounts.department = 0;
  if (senderType === 'admin' && present.admin) this.unreadCounts.admin = 0;

  // Increment for the other participants only
  if (present.user && senderType !== 'user') this.unreadCounts.user = (this.unreadCounts.user || 0) + 1;
  if (present.department && senderType !== 'department') this.unreadCounts.department = (this.unreadCounts.department || 0) + 1;
  if (present.admin && senderType !== 'admin') this.unreadCounts.admin = (this.unreadCounts.admin || 0) + 1;
  
  this.lastActivity = new Date();
  this.updatedAt = new Date();
  
  return this.save();
};

// Instance method to mark messages as read by a participant
chatSchema.methods.markAsReadBy = function(participantId, participantType) {
  // Reset unread count for the participant
  if (participantType === 'user') this.unreadCounts.user = 0;
  else if (participantType === 'department') this.unreadCounts.department = 0;
  else if (participantType === 'admin') this.unreadCounts.admin = 0;

  // Optionally tag the latest message as read by this participant
  if (this.messages && this.messages.length > 0) {
    const lastMsg = this.messages[this.messages.length - 1];
    lastMsg.readBy = lastMsg.readBy || [];
    lastMsg.readBy.push({ userId: participantId, userType: participantType, readAt: new Date() });
  }

  this.updatedAt = new Date();
  return this.save();
};

module.exports = mongoose.model("Chat", chatSchema);