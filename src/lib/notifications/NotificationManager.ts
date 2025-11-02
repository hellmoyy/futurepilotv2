/**
 * Notification Manager
 * Centralized notification system for all modules
 * Supports: Toast, Email, Database persistence
 */

import Notification from '@/models/Notification';
import connectDB from '@/lib/mongodb';
import type {
  NotificationPayload,
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  NotificationFilter,
  NotificationStats,
  TierUpgradeEmailData,
  TradingAlertEmailData,
  PositionNotificationEmailData,
} from '@/types/notification';

class NotificationManager {
  /**
   * Send notification through specified channels
   */
  async send(payload: NotificationPayload): Promise<void> {
    const { channels } = payload;

    // Send to all requested channels in parallel
    const promises: Promise<any>[] = [];

    if (channels.includes('database') || channels.includes('all')) {
      promises.push(this.sendToDatabase(payload));
    }

    if (channels.includes('email') || channels.includes('all')) {
      promises.push(this.sendEmail(payload));
    }

    // Toast notifications are handled client-side via API response
    // We just need to ensure database record exists for real-time updates

    await Promise.allSettled(promises);
  }

  /**
   * Save notification to database
   */
  private async sendToDatabase(payload: NotificationPayload): Promise<void> {
    try {
      await connectDB();

      await Notification.create({
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        priority: payload.priority,
        metadata: payload.metadata,
        read: false,
      });

      console.log(`[Notification] Database saved: ${payload.type} for user ${payload.userId}`);
    } catch (error) {
      console.error('[Notification] Database save failed:', error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(payload: NotificationPayload): Promise<void> {
    try {
      // Import email service dynamically to avoid circular dependencies
      const EmailServiceModule = await import('@/lib/notifications/EmailService');
      const EmailService = EmailServiceModule.default || EmailServiceModule.EmailService;
      const emailService = new EmailService();

      // Route to appropriate email template based on type
      switch (payload.type) {
        case 'tier_upgrade':
          await emailService.sendTierUpgradeEmail(payload);
          break;
        
        case 'trading_commission':
        case 'trading_autoclose':
        case 'trading_low_gas':
          await emailService.sendTradingAlertEmail(payload);
          break;
        
        case 'position_opened':
        case 'position_closed':
          await emailService.sendPositionNotificationEmail(payload);
          break;
        
        default:
          await emailService.sendGenericEmail(payload);
      }

      console.log(`[Notification] Email sent: ${payload.type} for user ${payload.userId}`);
    } catch (error) {
      console.error('[Notification] Email send failed:', error);
      // Don't throw - email failure shouldn't break the flow
    }
  }

  /**
   * Get user notifications with filtering and pagination
   */
  async getNotifications(filter: NotificationFilter) {
    try {
      await connectDB();

      const {
        userId,
        type,
        priority,
        read,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = filter;

      const query: any = { userId };

      if (type) query.type = type;
      if (priority) query.priority = priority;
      if (read !== undefined) query.read = read;
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate;
        if (endDate) query.createdAt.$lte = endDate;
      }

      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(query),
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('[Notification] Get notifications failed:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      await connectDB();
      const notification = await Notification.markAsRead(notificationId, userId);
      return !!notification;
    } catch (error) {
      console.error('[Notification] Mark as read failed:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      await connectDB();
      return await Notification.markAllAsRead(userId);
    } catch (error) {
      console.error('[Notification] Mark all as read failed:', error);
      return 0;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      await connectDB();
      const result = await Notification.deleteOne({ _id: notificationId, userId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('[Notification] Delete failed:', error);
      return false;
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      await connectDB();
      return await Notification.getUnreadCount(userId);
    } catch (error) {
      console.error('[Notification] Get unread count failed:', error);
      return 0;
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(userId: string): Promise<NotificationStats> {
    try {
      await connectDB();
      return await Notification.getStats(userId);
    } catch (error) {
      console.error('[Notification] Get stats failed:', error);
      return {
        total: 0,
        unread: 0,
        byType: {} as any,
        byPriority: {} as any,
      };
    }
  }

  /**
   * Helper: Create trading commission notification
   */
  async notifyTradingCommission(
    userId: string,
    profit: number,
    commission: number,
    rate: number,
    gasFeeBalance: number,
    positionId: string
  ): Promise<void> {
    await this.send({
      userId,
      type: 'trading_commission',
      title: 'Commission Deducted',
      message: `${commission.toFixed(2)} USDT commission (${rate}%) deducted from your profit of ${profit.toFixed(2)} USDT`,
      priority: 'info',
      channels: ['database', 'toast'],
      metadata: {
        positionId,
        profit,
        commission,
        commissionRate: rate,
        gasFeeBalance,
        link: '/transactions',
        actionLabel: 'View Transactions',
      },
    });
  }

  /**
   * Helper: Create auto-close notification
   */
  async notifyAutoClose(
    userId: string,
    profit: number,
    threshold: number,
    gasFeeBalance: number,
    positionId: string
  ): Promise<void> {
    await this.send({
      userId,
      type: 'trading_autoclose',
      title: '⚠️ Position Auto-Closed',
      message: `Your position was automatically closed at ${profit.toFixed(2)} USDT profit to prevent negative gas fee balance`,
      priority: 'warning',
      channels: ['all'], // Toast + Email + Database
      metadata: {
        positionId,
        profit,
        autoCloseThreshold: threshold,
        gasFeeBalance,
        link: '/dashboard',
        actionLabel: 'View Dashboard',
      },
    });
  }

  /**
   * Helper: Create low gas fee warning
   */
  async notifyLowGasFee(
    userId: string,
    currentBalance: number
  ): Promise<void> {
    await this.send({
      userId,
      type: 'trading_low_gas',
      title: '🚨 Low Gas Fee Balance',
      message: `Your gas fee balance (${currentBalance.toFixed(2)} USDT) is below 10 USDT. Please top up to continue trading.`,
      priority: 'error',
      channels: ['all'], // Toast + Email + Database
      metadata: {
        gasFeeBalance: currentBalance,
        link: '/topup',
        actionLabel: 'Top Up Now',
      },
    });
  }

  /**
   * Helper: Create tier upgrade notification
   */
  async notifyTierUpgrade(
    userId: string,
    oldTier: string,
    newTier: string,
    totalDeposit: number,
    oldRate: { level1: number; level2: number; level3: number },
    newRate: { level1: number; level2: number; level3: number }
  ): Promise<void> {
    const tierEmojis: Record<string, string> = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎',
    };

    await this.send({
      userId,
      type: 'tier_upgrade',
      title: `🎉 Tier Upgraded to ${tierEmojis[newTier.toLowerCase()]} ${newTier}!`,
      message: `Congratulations! You've been upgraded from ${oldTier} to ${newTier}. Your commission rates have increased!`,
      priority: 'success',
      channels: ['all'], // Toast + Email + Database
      metadata: {
        oldTier,
        newTier,
        totalDeposit,
        oldRate,
        newRate,
        link: '/referral',
        actionLabel: 'View Commission Rates',
      },
    });
  }

  /**
   * Helper: Create position opened notification
   */
  async notifyPositionOpened(
    userId: string,
    positionId: string,
    symbol: string,
    side: 'LONG' | 'SHORT',
    leverage: number,
    entryPrice: number
  ): Promise<void> {
    await this.send({
      userId,
      type: 'position_opened',
      title: `Position Opened: ${symbol}`,
      message: `${side} position opened at ${entryPrice} with ${leverage}x leverage`,
      priority: 'success',
      channels: ['database', 'toast'],
      metadata: {
        positionId,
        link: '/automation',
        actionLabel: 'View Positions',
      },
    });
  }

  /**
   * Helper: Create position closed notification
   */
  async notifyPositionClosed(
    userId: string,
    positionId: string,
    symbol: string,
    profit: number,
    pnlPercentage: number
  ): Promise<void> {
    const isProfit = profit > 0;
    
    await this.send({
      userId,
      type: 'position_closed',
      title: `Position Closed: ${symbol}`,
      message: `Position closed with ${isProfit ? 'profit' : 'loss'} of ${Math.abs(profit).toFixed(2)} USDT (${pnlPercentage.toFixed(2)}%)`,
      priority: isProfit ? 'success' : 'error',
      channels: ['database', 'toast'],
      metadata: {
        positionId,
        profit,
        link: '/automation',
        actionLabel: 'View History',
      },
    });
  }

  /**
   * Withdrawal Notifications
   */

  /**
   * Notify user when withdrawal request is submitted
   */
  async notifyWithdrawalRequested(
    userId: string,
    amount: number,
    network: string,
    walletAddress: string
  ): Promise<void> {
    const maskedAddress = walletAddress.substring(0, 6) + '...' + walletAddress.substring(38);
    
    await this.send({
      userId,
      type: 'withdrawal_requested',
      title: 'Withdrawal Request Submitted',
      message: `Your withdrawal request of $${amount.toFixed(2)} to ${network} (${maskedAddress}) has been submitted and is pending admin approval.`,
      priority: 'info',
      channels: ['all'], // Toast + Email + Database
      actionUrl: '/withdrawals',
      metadata: {
        amount,
        network,
        walletAddress: maskedAddress,
        status: 'pending',
      },
    });
  }

  /**
   * Notify user when withdrawal is approved
   */
  async notifyWithdrawalApproved(
    userId: string,
    amount: number,
    network: string,
    walletAddress: string,
    txHash: string
  ): Promise<void> {
    const maskedAddress = walletAddress.substring(0, 6) + '...' + walletAddress.substring(38);
    const maskedTxHash = txHash.substring(0, 10) + '...' + txHash.substring(56);
    
    await this.send({
      userId,
      type: 'withdrawal_approved',
      title: '✅ Withdrawal Approved',
      message: `Your withdrawal of $${amount.toFixed(2)} has been approved and processed. Transaction: ${maskedTxHash}`,
      priority: 'success',
      channels: ['all'], // Toast + Email + Database
      actionUrl: '/withdrawals',
      metadata: {
        amount,
        network,
        walletAddress: maskedAddress,
        txHash,
        status: 'completed',
        explorerUrl: network === 'ERC20' 
          ? `https://etherscan.io/tx/${txHash}` 
          : `https://bscscan.com/tx/${txHash}`,
      },
    });
  }

  /**
   * Notify user when withdrawal is rejected
   */
  async notifyWithdrawalRejected(
    userId: string,
    amount: number,
    network: string,
    reason: string
  ): Promise<void> {
    await this.send({
      userId,
      type: 'withdrawal_rejected',
      title: '❌ Withdrawal Rejected',
      message: `Your withdrawal request of $${amount.toFixed(2)} has been rejected. Reason: ${reason}`,
      priority: 'error',
      channels: ['all'], // Toast + Email + Database
      actionUrl: '/withdrawals',
      metadata: {
        amount,
        network,
        reason,
        status: 'rejected',
      },
    });
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
export default notificationManager;
