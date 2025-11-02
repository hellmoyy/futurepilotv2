/**
 * Notification Model
 * MongoDB schema for persistent notification storage
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { NotificationType, NotificationPriority, NotificationMetadata } from '@/types/notification';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  metadata?: NotificationMetadata;
  createdAt: Date;
  readAt?: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'futurepilotcol',
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'trading_commission',
      'trading_autoclose',
      'trading_low_gas',
      'position_opened',
      'position_closed',
      'tier_upgrade',
      'referral_commission',
      'deposit_confirmed',
      'withdrawal_approved',
      'withdrawal_rejected',
      'system_alert',
      'account_update',
    ],
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    required: true,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info',
    index: true,
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  readAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, priority: 1, createdAt: -1 });

// Virtual for time ago display
notificationSchema.virtual('timeAgo').get(function(this: INotification) {
  const now = new Date();
  const diff = now.getTime() - this.createdAt.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Static method: Mark notification as read
notificationSchema.statics.markAsRead = async function(
  notificationId: string,
  userId: string
): Promise<INotification | null> {
  return this.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true, readAt: new Date() },
    { new: true }
  );
};

// Static method: Mark all as read for user
notificationSchema.statics.markAllAsRead = async function(
  userId: string
): Promise<number> {
  const result = await this.updateMany(
    { userId, read: false },
    { read: true, readAt: new Date() }
  );
  return result.modifiedCount;
};

// Static method: Get unread count
notificationSchema.statics.getUnreadCount = async function(
  userId: string
): Promise<number> {
  return this.countDocuments({ userId, read: false });
};

// Static method: Get statistics
notificationSchema.statics.getStats = async function(userId: string) {
  const [total, unread, byType, byPriority] = await Promise.all([
    this.countDocuments({ userId }),
    this.countDocuments({ userId, read: false }),
    this.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    this.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
  ]);

  return {
    total,
    unread,
    byType: Object.fromEntries(byType.map((item: any) => [item._id, item.count])),
    byPriority: Object.fromEntries(byPriority.map((item: any) => [item._id, item.count])),
  };
};

// Static method: Delete old notifications (cleanup)
notificationSchema.statics.deleteOldNotifications = async function(
  daysToKeep: number = 90
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    read: true,
  });
  
  return result.deletedCount;
};

// Extend Model type with static methods
interface NotificationModel extends Model<INotification> {
  markAsRead(notificationId: string, userId: string): Promise<INotification | null>;
  markAllAsRead(userId: string): Promise<number>;
  getUnreadCount(userId: string): Promise<number>;
  getStats(userId: string): Promise<any>;
  deleteOldNotifications(daysToKeep?: number): Promise<number>;
}

// Prevent model overwrite on hot reload
const Notification = (mongoose.models.Notification as NotificationModel) || 
  mongoose.model<INotification, NotificationModel>('Notification', notificationSchema);

export default Notification;
