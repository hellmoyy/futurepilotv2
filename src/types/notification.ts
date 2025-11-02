/**
 * Notification System - Type Definitions
 * Centralized notification types for all modules
 */

export type NotificationType = 
  | 'trading_commission'      // Commission deducted from gas fee
  | 'trading_autoclose'        // Position auto-closed to prevent negative balance
  | 'trading_low_gas'          // Gas fee < $10 warning
  | 'position_opened'          // Trading position opened
  | 'position_closed'          // Trading position closed
  | 'tier_upgrade'             // User tier upgraded
  | 'referral_commission'      // Referral commission earned
  | 'deposit_confirmed'        // Gas fee deposit confirmed
  | 'withdrawal_approved'      // Withdrawal request approved
  | 'withdrawal_rejected'      // Withdrawal request rejected
  | 'system_alert'             // System-wide alerts
  | 'account_update';          // Account-related updates

export type NotificationPriority = 
  | 'info'      // Blue - informational
  | 'success'   // Green - positive action
  | 'warning'   // Yellow - requires attention
  | 'error';    // Red - critical issue

export type NotificationChannel = 
  | 'toast'     // Real-time toast popup
  | 'email'     // Email notification
  | 'database'  // Persistent in database
  | 'all';      // Send to all channels

export interface NotificationMetadata {
  // Trading-related metadata
  positionId?: string;
  profit?: number;
  commission?: number;
  commissionRate?: number;
  gasFeeBalance?: number;
  autoCloseThreshold?: number;
  
  // Tier-related metadata
  oldTier?: string;
  newTier?: string;
  oldRate?: { level1: number; level2: number; level3: number };
  newRate?: { level1: number; level2: number; level3: number };
  totalDeposit?: number;
  
  // Referral-related metadata
  referrerId?: string;
  referredUserId?: string;
  referralLevel?: number;
  commissionAmount?: number;
  
  // Transaction-related metadata
  transactionId?: string;
  amount?: number;
  txHash?: string;
  
  // Generic metadata
  link?: string;           // Action link (e.g., /transactions/123)
  actionLabel?: string;    // Link label (e.g., "View Details")
  [key: string]: any;      // Allow additional custom fields
}

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  metadata?: NotificationMetadata;
}

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  metadata?: NotificationMetadata;
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationFilter {
  userId: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  read?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

// Email template data structures
export interface TierUpgradeEmailData {
  userName: string;
  oldTier: string;
  newTier: string;
  totalDeposit: number;
  oldRate: { level1: number; level2: number; level3: number };
  newRate: { level1: number; level2: number; level3: number };
  dashboardLink: string;
}

export interface TradingAlertEmailData {
  userName: string;
  alertType: 'autoclose' | 'low_gas' | 'commission';
  positionId?: string;
  profit?: number;
  commission?: number;
  gasFeeBalance?: number;
  message: string;
  dashboardLink: string;
}

export interface PositionNotificationEmailData {
  userName: string;
  action: 'opened' | 'closed';
  positionId: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  leverage: number;
  entryPrice?: number;
  exitPrice?: number;
  profit?: number;
  pnlPercentage?: number;
  dashboardLink: string;
}
