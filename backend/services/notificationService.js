const Notification = require('../models/Notification');
const smsService = require('./smsService');

class NotificationService {
  // Create in-app notification
  async createNotification(userId, complaintId, type, title, message, metadata = {}) {
    try {
      const notification = new Notification({
        userId,
        complaintId,
        type,
        title,
        message,
        metadata,
      });
      
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send notification for complaint status change
  async sendStatusUpdateNotification(complaint, oldStatus, newStatus, adminName) {
    try {
      const title = this.getStatusTitle(newStatus);
      const message = this.getStatusMessage(newStatus, complaint.description);
      
      // Create in-app notification
      await this.createNotification(
        complaint.userId,
        complaint._id,
        'status_update',
        title,
        message,
        {
          oldStatus,
          newStatus,
          adminName,
          complaintDescription: complaint.description.substring(0, 100),
        }
      );

      // Send SMS notification
      if (complaint.phone) {
        const smsMessage = smsService.getStatusMessage(newStatus, complaint.description);
        const formattedPhone = smsService.formatPhoneNumber(complaint.phone);
        
        const smsResult = await smsService.sendSMS(formattedPhone, smsMessage);
        console.log('SMS sent result:', smsResult);
      }

      console.log(`Notifications sent for complaint ${complaint._id} status change: ${oldStatus} -> ${newStatus}`);
    } catch (error) {
      console.error('Error sending status update notification:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  // Get user's unread notification count
  async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({
        userId,
        status: 'unread',
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Get user's notifications with pagination
  async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const notifications = await Notification.find({ userId })
        .populate('complaintId', 'description location status createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Notification.countDocuments({ userId });
      
      return {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + notifications.length < total,
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { status: 'read', readAt: new Date() }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { userId, status: 'unread' },
        { status: 'read', readAt: new Date() }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Helper methods for generating notification content
  getStatusTitle(status) {
    switch (status) {
      case 'in_progress':
        return '🚧 Complaint In Progress';
      case 'resolved':
        return '✅ Complaint Resolved';
      default:
        return '📋 Complaint Updated';
    }
  }

  getStatusMessage(status, description) {
    const shortDescription = description?.length > 50 
      ? description.substring(0, 50) + '...' 
      : description;

    switch (status) {
      case 'in_progress':
        return `Great news! Your complaint "${shortDescription}" is now being worked on by our team.`;
      case 'resolved':
        return `Excellent! Your complaint "${shortDescription}" has been resolved. Thank you for helping improve our community.`;
      default:
        return `Your complaint "${shortDescription}" status has been updated.`;
    }
  }
}

module.exports = new NotificationService();