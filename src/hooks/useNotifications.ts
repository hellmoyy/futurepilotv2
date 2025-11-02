/**
 * Notification Hooks
 * Helper hooks for showing toast notifications from API responses
 */

'use client';

import { useCallback } from 'react';
import { useToastNotifications } from '@/contexts/ToastContext';
import type { Notification } from '@/types/notification';

/**
 * Hook for displaying notifications from database records
 */
export function useNotificationDisplay() {
  const { showInfo, showSuccess, showWarning, showError } = useToastNotifications();

  const displayNotification = useCallback((notification: Notification) => {
    const { title, message, priority, metadata } = notification;
    
    const toastOptions = {
      link: metadata?.link,
      actionLabel: metadata?.actionLabel,
      duration: 6000, // 6 seconds for important notifications
    };

    switch (priority) {
      case 'info':
        showInfo(title, message, toastOptions);
        break;
      case 'success':
        showSuccess(title, message, toastOptions);
        break;
      case 'warning':
        showWarning(title, message, toastOptions);
        break;
      case 'error':
        showError(title, message, toastOptions);
        break;
    }
  }, [showInfo, showSuccess, showWarning, showError]);

  return { displayNotification };
}

/**
 * Hook for polling and displaying new notifications
 */
export function useNotificationPolling(intervalMs: number = 10000) {
  const { displayNotification } = useNotificationDisplay();
  
  const pollNotifications = useCallback(async () => {
    try {
      // Get last notification timestamp from localStorage
      const lastCheck = localStorage.getItem('lastNotificationCheck');
      const lastCheckDate = lastCheck ? new Date(lastCheck) : new Date(Date.now() - 60000); // Default: last 1 minute

      // Fetch new notifications
      const response = await fetch(
        `/api/notifications?read=false&startDate=${lastCheckDate.toISOString()}&limit=10`
      );

      if (!response.ok) return;

      const data = await response.json();
      const notifications = data.notifications || [];

      // Display each new notification as toast
      notifications.forEach((notification: Notification) => {
        displayNotification(notification);
        
        // Mark as read after displaying (optional)
        fetch(`/api/notifications/${notification._id}`, {
          method: 'PATCH',
        }).catch(console.error);
      });

      // Update last check timestamp
      localStorage.setItem('lastNotificationCheck', new Date().toISOString());
    } catch (error) {
      console.error('[Notification Polling] Error:', error);
    }
  }, [displayNotification]);

  return { pollNotifications };
}

/**
 * Hook for trading-specific notifications
 */
export function useTradingNotifications() {
  const { showInfo, showSuccess, showWarning, showError } = useToastNotifications();

  const notifyCommissionDeducted = useCallback((commission: number, profit: number, rate: number) => {
    showInfo(
      'Commission Deducted',
      `${commission.toFixed(2)} USDT commission (${rate}%) deducted from profit of ${profit.toFixed(2)} USDT`,
      {
        link: '/transactions',
        actionLabel: 'View Transactions',
        duration: 5000,
      }
    );
  }, [showInfo]);

  const notifyAutoClose = useCallback((profit: number) => {
    showWarning(
      '⚠️ Position Auto-Closed',
      `Position automatically closed at ${profit.toFixed(2)} USDT profit to prevent negative gas fee balance`,
      {
        link: '/dashboard',
        actionLabel: 'View Dashboard',
        duration: 8000,
      }
    );
  }, [showWarning]);

  const notifyLowGasFee = useCallback((balance: number) => {
    showError(
      '🚨 Low Gas Fee Balance',
      `Your gas fee balance (${balance.toFixed(2)} USDT) is below 10 USDT. Please top up to continue trading.`,
      {
        link: '/topup',
        actionLabel: 'Top Up Now',
        duration: 10000,
      }
    );
  }, [showError]);

  const notifyPositionOpened = useCallback((symbol: string, side: string) => {
    showSuccess(
      `Position Opened: ${symbol}`,
      `${side} position opened successfully`,
      {
        link: '/automation',
        actionLabel: 'View Positions',
        duration: 4000,
      }
    );
  }, [showSuccess]);

  const notifyPositionClosed = useCallback((symbol: string, profit: number) => {
    const isProfit = profit > 0;
    const message = `Position closed with ${isProfit ? 'profit' : 'loss'} of ${Math.abs(profit).toFixed(2)} USDT`;
    
    if (isProfit) {
      showSuccess(`Position Closed: ${symbol}`, message, {
        link: '/automation',
        actionLabel: 'View History',
        duration: 5000,
      });
    } else {
      showError(`Position Closed: ${symbol}`, message, {
        link: '/automation',
        actionLabel: 'View History',
        duration: 5000,
      });
    }
  }, [showSuccess, showError]);

  return {
    notifyCommissionDeducted,
    notifyAutoClose,
    notifyLowGasFee,
    notifyPositionOpened,
    notifyPositionClosed,
  };
}

/**
 * Hook for tier upgrade notifications
 */
export function useTierNotifications() {
  const { showSuccess } = useToastNotifications();

  const notifyTierUpgrade = useCallback((oldTier: string, newTier: string) => {
    const tierEmojis: Record<string, string> = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎',
    };

    showSuccess(
      `🎉 Tier Upgraded to ${tierEmojis[newTier.toLowerCase()]} ${newTier}!`,
      `Congratulations! You've been upgraded from ${oldTier} to ${newTier}. Your commission rates have increased!`,
      {
        link: '/referral',
        actionLabel: 'View Commission Rates',
        duration: 8000,
      }
    );
  }, [showSuccess]);

  return { notifyTierUpgrade };
}
