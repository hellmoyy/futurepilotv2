/**
 * Trading Hooks Interface
 * 
 * This module provides hooks that the trading bot should call
 * at key points in the trading lifecycle to ensure proper
 * gas fee balance management and commission deduction.
 * 
 * Integration with Trading Bot:
 * - Call beforeTrade() before opening any position
 * - Call onProfitUpdate() periodically during open position
 * - Call afterTrade() after closing position (win or loss)
 */

import {
  canUserTrade,
  shouldAutoClose,
  deductTradingCommission,
  calculateMaxProfit,
  MINIMUM_GAS_FEE,
} from '@/lib/tradingCommission';
import { notificationManager } from '@/lib/notifications/NotificationManager';
import mongoose from 'mongoose';

export interface BeforeTradeResult {
  allowed: boolean;
  reason?: string;
  gasFeeBalance: number;
  maxProfit: number;
  autoCloseThreshold: number;
}

export interface OnProfitResult {
  shouldClose: boolean;
  reason?: string;
  currentProfit: number;
  maxProfit: number;
  threshold: number;
}

export interface AfterTradeResult {
  success: boolean;
  commission?: number;
  remainingBalance?: number;
  error?: string;
}

/**
 * Call this BEFORE opening a trading position
 * Returns whether user can trade and their limits
 * 
 * @example
 * const { allowed, reason, maxProfit } = await beforeTrade(userId);
 * if (!allowed) {
 *   console.log('Cannot trade:', reason);
 *   return;
 * }
 * console.log('Max profit before auto-close:', maxProfit);
 */
export async function beforeTrade(userId: string | mongoose.Types.ObjectId): Promise<BeforeTradeResult> {
  try {
    // Check if user can trade (has minimum gas fee)
    const eligibility = await canUserTrade(userId);
    
    if (!eligibility.canTrade) {
      // Send low gas fee notification
      if (eligibility.gasFeeBalance < MINIMUM_GAS_FEE) {
        await notificationManager.notifyLowGasFee(
          userId.toString(),
          eligibility.gasFeeBalance
        ).catch(err => console.error('Failed to send low gas fee notification:', err));
      }
      
      return {
        allowed: false,
        reason: eligibility.reason,
        gasFeeBalance: eligibility.gasFeeBalance,
        maxProfit: 0,
        autoCloseThreshold: 0,
      };
    }

    // Calculate profit limits
    const profitLimits = await calculateMaxProfit(userId);

    return {
      allowed: true,
      gasFeeBalance: eligibility.gasFeeBalance,
      maxProfit: profitLimits.maxProfit,
      autoCloseThreshold: profitLimits.autoCloseThreshold,
    };
  } catch (error: any) {
    console.error('Error in beforeTrade hook:', error);
    return {
      allowed: false,
      reason: error.message || 'Error checking trading eligibility',
      gasFeeBalance: 0,
      maxProfit: 0,
      autoCloseThreshold: 0,
    };
  }
}

/**
 * Call this DURING an open position when profit updates
 * Returns whether position should be auto-closed
 * 
 * @example
 * const { shouldClose, reason } = await onProfitUpdate(userId, currentProfit);
 * if (shouldClose) {
 *   console.log('Auto-closing position:', reason);
 *   closePosition();
 * }
 */
export async function onProfitUpdate(
  userId: string | mongoose.Types.ObjectId,
  currentProfit: number,
  positionId?: string
): Promise<OnProfitResult> {
  try {
    const closeCheck = await shouldAutoClose(userId, currentProfit);

    // Send auto-close notification if position should be closed
    if (closeCheck.shouldClose) {
      // Get current gas fee balance for notification
      const eligibility = await canUserTrade(userId);
      
      await notificationManager.notifyAutoClose(
        userId.toString(),
        currentProfit,
        closeCheck.threshold,
        eligibility.gasFeeBalance,
        positionId || `POS_${Date.now()}`
      ).catch(err => console.error('Failed to send auto-close notification:', err));
    }

    return {
      shouldClose: closeCheck.shouldClose,
      reason: closeCheck.reason,
      currentProfit,
      maxProfit: closeCheck.maxProfit,
      threshold: closeCheck.threshold,
    };
  } catch (error: any) {
    console.error('Error in onProfitUpdate hook:', error);
    return {
      shouldClose: false,
      reason: error.message || 'Error checking auto-close',
      currentProfit,
      maxProfit: 0,
      threshold: 0,
    };
  }
}

/**
 * Call this AFTER closing a position (win or loss)
 * Deducts commission for profitable trades
 * 
 * @example
 * // After closing position with profit
 * const profit = 50.00;
 * const { success, commission } = await afterTrade(userId, profit, positionId);
 * if (success) {
 *   console.log(`Commission deducted: $${commission}`);
 * }
 * 
 * // After closing position with loss (no commission)
 * const loss = -20.00;
 * await afterTrade(userId, loss, positionId); // No commission for losses
 */
export async function afterTrade(
  userId: string | mongoose.Types.ObjectId,
  profitOrLoss: number,
  positionId?: string
): Promise<AfterTradeResult> {
  try {
    // Only deduct commission for profitable trades
    if (profitOrLoss <= 0) {
      console.log(`No commission for loss/breakeven trade: $${profitOrLoss.toFixed(2)}`);
      return {
        success: true,
        commission: 0,
      };
    }

    // Deduct commission from gas fee balance
    const result = await deductTradingCommission({
      userId,
      profit: profitOrLoss,
      positionId: positionId || `POS_${Date.now()}`,
      notes: 'Trading commission deducted after profitable trade',
    });

    if (!result.success) {
      console.error('Failed to deduct commission:', result.error);
      return {
        success: false,
        error: result.error,
      };
    }

    console.log(`Trading commission deducted: $${result.commission.toFixed(2)}, Remaining balance: $${result.remainingBalance.toFixed(2)}`);

    // Calculate commission rate from result
    const commissionRate = (result.commission / profitOrLoss) * 100;

    // Send commission notification
    await notificationManager.notifyTradingCommission(
      userId.toString(),
      profitOrLoss,
      result.commission,
      commissionRate,
      result.remainingBalance,
      positionId || `POS_${Date.now()}`
    ).catch(err => console.error('Failed to send commission notification:', err));

    return {
      success: true,
      commission: result.commission,
      remainingBalance: result.remainingBalance,
    };
  } catch (error: any) {
    console.error('Error in afterTrade hook:', error);
    return {
      success: false,
      error: error.message || 'Error deducting commission',
    };
  }
}

/**
 * Get minimum gas fee requirement
 */
export function getMinimumGasFee(): number {
  return MINIMUM_GAS_FEE;
}

/**
 * Example integration with trading bot:
 * 
 * ```typescript
 * import { beforeTrade, onProfitUpdate, afterTrade } from '@/lib/trading/hooks';
 * 
 * async function executeTrade(userId: string, symbol: string) {
 *   // 1. Check if user can trade
 *   const { allowed, reason, maxProfit } = await beforeTrade(userId);
 *   if (!allowed) {
 *     throw new Error(`Cannot trade: ${reason}`);
 *   }
 *   
 *   console.log(`Opening position. Max profit: $${maxProfit.toFixed(2)}`);
 *   
 *   // 2. Open position
 *   const position = await openPosition(symbol);
 *   
 *   // 3. Monitor position
 *   const interval = setInterval(async () => {
 *     const currentProfit = calculateProfit(position);
 *     
 *     const { shouldClose, reason } = await onProfitUpdate(userId, currentProfit);
 *     if (shouldClose) {
 *       console.log(`Auto-closing: ${reason}`);
 *       clearInterval(interval);
 *       await closePosition(position);
 *       
 *       // 4. Deduct commission
 *       const { success, commission } = await afterTrade(userId, currentProfit, position.id);
 *       if (success) {
 *         console.log(`Commission deducted: $${commission}`);
 *       }
 *     }
 *   }, 5000); // Check every 5 seconds
 * }
 * ```
 */
