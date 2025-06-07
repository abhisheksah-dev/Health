const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  type: {
    type: String,
    enum: [
      'appointment_created',
      'appointment_confirmed',
      'appointment_cancelled',
      'appointment_reminder',
      'appointment_completed',
      'prescription_created',
      'test_result_available',
      'review_received',
      'review_response',
      'verification_approved',
      'verification_rejected',
      'password_changed',
      'email_verified',
      'phone_verified',
      'document_verified',
      'payment_successful',
      'payment_failed',
      'refund_processed',
      'system_announcement',
      'other'
    ],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  data: {
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    facility: {
      type: {
        type: String,
        enum: ['hospital', 'clinic']
      },
      id: {
        type: Schema.Types.ObjectId,
        refPath: 'data.facility.type'
      }
    },
    review: {
      type: Schema.Types.ObjectId,
      ref: 'Review'
    },
    document: {
      type: String,
      url: String,
      publicId: String
    },
    payment: {
      amount: Number,
      transactionId: String,
      status: String
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  channels: {
    email: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      error: String
    },
    sms: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      error: String
    },
    push: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      error: String
    },
    inApp: {
      sent: {
        type: Boolean,
        default: true
      },
      sentAt: {
        type: Date,
        default: Date.now
      }
    }
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'read', 'deleted'],
    default: 'pending'
  },
  readAt: Date,
  deletedAt: Date,
  expiresAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ priority: 1, status: 1 });
notificationSchema.index({ 'channels.email.sent': 1, 'channels.email.sentAt': 1 });
notificationSchema.index({ 'channels.sms.sent': 1, 'channels.sms.sentAt': 1 });
notificationSchema.index({ 'channels.push.sent': 1, 'channels.push.sentAt': 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diff = now - created;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

// Virtual for delivery status
notificationSchema.virtual('deliveryStatus').get(function() {
  const channels = this.channels;
  const statuses = [];
  
  if (channels.email.sent) statuses.push('Email sent');
  else if (channels.email.error) statuses.push('Email failed');
  
  if (channels.sms.sent) statuses.push('SMS sent');
  else if (channels.sms.error) statuses.push('SMS failed');
  
  if (channels.push.sent) statuses.push('Push sent');
  else if (channels.push.error) statuses.push('Push failed');
  
  if (channels.inApp.sent) statuses.push('In-app sent');
  
  return statuses.join(', ');
});

// Pre-save middleware to set expiration
notificationSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    // Set expiration based on priority
    const now = new Date();
    switch (this.priority) {
      case 'urgent':
        this.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        break;
      case 'high':
        this.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
        break;
      case 'medium':
        this.expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
        break;
      case 'low':
        this.expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 180 days
        break;
    }
  }
  next();
});

// Static method to find unread notifications
notificationSchema.statics.findUnread = function(userId, options = {}) {
  const query = {
    recipient: userId,
    status: { $in: ['pending', 'sent'] }
  };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.priority) {
    query.priority = options.priority;
  }
  
  return this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 20);
};

// Static method to find notifications by type
notificationSchema.statics.findByType = function(userId, type, options = {}) {
  const query = {
    recipient: userId,
    type
  };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 20);
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = function(userId, notificationIds) {
  return this.updateMany(
    {
      recipient: userId,
      _id: { $in: notificationIds },
      status: { $in: ['pending', 'sent'] }
    },
    {
      $set: {
        status: 'read',
        readAt: new Date()
      }
    }
  );
};

// Static method to delete notifications
notificationSchema.statics.deleteNotifications = function(userId, notificationIds) {
  return this.updateMany(
    {
      recipient: userId,
      _id: { $in: notificationIds }
    },
    {
      $set: {
        status: 'deleted',
        deletedAt: new Date()
      }
    }
  );
};

// Static method to create appointment notification
notificationSchema.statics.createAppointmentNotification = async function(appointment, type) {
  const Notification = mongoose.model('Notification');
  const User = mongoose.model('User');
  
  const notifications = [];
  const recipientIds = new Set();
  
  // Add patient
  recipientIds.add(appointment.patient);
  
  // Add doctor
  recipientIds.add(appointment.doctor);
  
  // Add facility admin
  const facility = await mongoose.model(appointment.facility.type).findById(appointment.facility.id);
  if (facility && facility.userId) {
    recipientIds.add(facility.userId);
  }
  
  // Create notification for each recipient
  for (const recipientId of recipientIds) {
    const user = await User.findById(recipientId);
    if (!user) continue;
    
    let title, message, priority;
    
    switch (type) {
      case 'appointment_created':
        title = 'New Appointment Created';
        message = `A new appointment has been created for ${appointment.date.toLocaleDateString()} at ${appointment.startTime}`;
        priority = 'medium';
        break;
      case 'appointment_confirmed':
        title = 'Appointment Confirmed';
        message = `Your appointment for ${appointment.date.toLocaleDateString()} at ${appointment.startTime} has been confirmed`;
        priority = 'medium';
        break;
      case 'appointment_cancelled':
        title = 'Appointment Cancelled';
        message = `Your appointment for ${appointment.date.toLocaleDateString()} at ${appointment.startTime} has been cancelled`;
        priority = 'high';
        break;
      case 'appointment_reminder':
        title = 'Appointment Reminder';
        message = `Reminder: You have an appointment tomorrow at ${appointment.startTime}`;
        priority = 'high';
        break;
      case 'appointment_completed':
        title = 'Appointment Completed';
        message = `Your appointment for ${appointment.date.toLocaleDateString()} has been completed`;
        priority = 'low';
        break;
    }
    
    const notification = new Notification({
      recipient: recipientId,
      type,
      title,
      message,
      priority,
      data: {
        appointment: appointment._id,
        doctor: appointment.doctor,
        facility: {
          type: appointment.facility.type,
          id: appointment.facility.id
        }
      },
      channels: {
        email: { sent: false },
        sms: { sent: false },
        push: { sent: false },
        inApp: { sent: true }
      }
    });
    
    notifications.push(notification);
  }
  
  return Notification.insertMany(notifications);
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 