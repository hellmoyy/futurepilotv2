import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';
import { Settings } from '@/models/Settings';
import mongoose from 'mongoose';

/**
 * Minimum gas fee balance required to trade (in USDT)
 */
export const MINIMUM_GAS_FEE = 10;

/**
 * Check if user has sufficient gas fee balance to trade
 */
export async function canUserTrade(userId: string | mongoose.Types.ObjectId): Promise<{
  canTrade: boolean;
  gasFeeBalance: number;
  reason?: string;
}> {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return {
        canTrade: false,
        gasFeeBalance: 0,
        reason: 'User not found',
      };
    }

    const gasFeeBalance = user.gasFeeBalance || 0;

    if (gasFeeBalance < MINIMUM_GAS_FEE) {
      return {
        canTrade: false,
        gasFeeBalance,
        reason: `Insufficient gas fee balance. Minimum ${MINIMUM_GAS_FEE} USDT required.`,
      };
    }

    return {
      canTrade: true,
      gasFeeBalance,
    };
  } catch (error) {
    console.error('Error checking user trading eligibility:', error);
    return {
      canTrade: false,
      gasFeeBalance: 0,
      reason: 'Error checking eligibility',
    };
  }
}

/**
 * Calculate maximum profit before auto-close is triggered
 * This prevents gas fee balance from going negative
 */
export async function calculateMaxProfit(userId: string | mongoose.Types.ObjectId): Promise<{
  maxProfit: number;
  autoCloseThreshold: number; // 90% of max profit
  gasFeeBalance: number;
  commissionRate: number;
}> {
  try {
    const user = await User.findById(userId);
    const settings = await Settings.findOne();

    if (!user) {
      throw new Error('User not found');
    }

    const gasFeeBalance = user.gasFeeBalance || 0;
    const commissionRate = settings?.tradingCommission || 20; // Default 20%

    // Max profit = gas fee balance / commission rate
    // Example: $10 gas fee / 0.20 = $50 max profit
    const maxProfit = gasFeeBalance / (commissionRate / 100);

    // Auto-close at 90% to have safety margin
    const autoCloseThreshold = maxProfit * 0.9;

    return {
      maxProfit,
      autoCloseThreshold,
      gasFeeBalance,
      commissionRate,
    };
  } catch (error) {
    console.error('Error calculating max profit:', error);
    throw error;
  }
}

/**
 * Check if position should be auto-closed based on current profit
 */
export async function shouldAutoClose(
  userId: string | mongoose.Types.ObjectId,
  currentProfit: number
): Promise<{
  shouldClose: boolean;
  reason?: string;
  maxProfit: number;
  threshold: number;
}> {
  try {
    const { maxProfit, autoCloseThreshold } = await calculateMaxProfit(userId);

    if (currentProfit >= autoCloseThreshold) {
      return {
        shouldClose: true,
        reason: `Profit ($${currentProfit.toFixed(2)}) reached auto-close threshold ($${autoCloseThreshold.toFixed(2)})`,
        maxProfit,
        threshold: autoCloseThreshold,
      };
    }

    return {
      shouldClose: false,
      maxProfit,
      threshold: autoCloseThreshold,
    };
  } catch (error) {
    console.error('Error checking auto-close:', error);
    return {
      shouldClose: false,
      maxProfit: 0,
      threshold: 0,
      reason: 'Error calculating auto-close',
    };
  }
}

/**
 * Deduct trading commission from user's gas fee balance
 * Call this after closing a profitable trade
 */
export async function deductTradingCommission(params: {
  userId: string | mongoose.Types.ObjectId;
  profit: number;
  positionId?: string;
  notes?: string;
}): Promise<{
  success: boolean;
  commission: number;
  remainingBalance: number;
  transactionId?: mongoose.Types.ObjectId;
  error?: string;
}> {
  try {
    const { userId, profit, positionId, notes } = params;

    // Get settings for commission rate
    const settings = await Settings.findOne();
    const commissionRate = settings?.tradingCommission || 20; // Default 20%

    // Calculate commission
    const commission = profit * (commissionRate / 100);

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        commission: 0,
        remainingBalance: 0,
        error: 'User not found',
      };
    }

    // Check if user has enough gas fee balance
    const currentBalance = user.gasFeeBalance || 0;
    if (currentBalance < commission) {
      return {
        success: false,
        commission,
        remainingBalance: currentBalance,
        error: `Insufficient gas fee balance. Required: $${commission.toFixed(2)}, Available: $${currentBalance.toFixed(2)}`,
      };
    }

    // Deduct commission from gas fee balance
    user.gasFeeBalance = currentBalance - commission;
    await user.save();

    // Create transaction record
    const transaction = await Transaction.create({
      userId: user._id,
      type: 'trading_commission',
      network: 'ERC20', // Placeholder, not relevant for commission
      txHash: `TRADING_COMMISSION_${Date.now()}_${user._id}`,
      amount: commission,
      status: 'confirmed',
      walletAddress: user.walletData?.erc20Address || 'N/A',
      tradingMetadata: {
        profit,
        commissionRate,
        positionId: positionId || `POS_${Date.now()}`,
        closedAt: new Date(),
      },
    });

    console.log(`Trading commission deducted: User ${user.email}, Profit: $${profit}, Commission: $${commission} (${commissionRate}%)`);

    return {
      success: true,
      commission,
      remainingBalance: user.gasFeeBalance,
      transactionId: transaction._id as mongoose.Types.ObjectId,
    };
  } catch (error: any) {
    console.error('Error deducting trading commission:', error);
    return {
      success: false,
      commission: 0,
      remainingBalance: 0,
      error: error.message || 'Failed to deduct commission',
    };
  }
}

/**
 * Get trading commission summary for a user
 */
export async function getTradingCommissionSummary(userId: string | mongoose.Types.ObjectId): Promise<{
  totalCommissionPaid: number;
  totalProfits: number;
  averageCommissionRate: number;
  transactionCount: number;
  transactions: any[];
}> {
  try {
    const transactions = await Transaction.find({
      userId,
      type: 'trading_commission',
      status: 'confirmed',
    }).sort({ createdAt: -1 });

    const totalCommissionPaid = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalProfits = transactions.reduce((sum, tx) => sum + (tx.tradingMetadata?.profit || 0), 0);
    const avgRate = transactions.length > 0
      ? transactions.reduce((sum, tx) => sum + (tx.tradingMetadata?.commissionRate || 0), 0) / transactions.length
      : 0;

    return {
      totalCommissionPaid,
      totalProfits,
      averageCommissionRate: avgRate,
      transactionCount: transactions.length,
      transactions: transactions.map(tx => ({
        id: tx._id,
        profit: tx.tradingMetadata?.profit || 0,
        commission: tx.amount,
        rate: tx.tradingMetadata?.commissionRate || 0,
        positionId: tx.tradingMetadata?.positionId,
        date: tx.createdAt,
      })),
    };
  } catch (error) {
    console.error('Error getting trading commission summary:', error);
    return {
      totalCommissionPaid: 0,
      totalProfits: 0,
      averageCommissionRate: 0,
      transactionCount: 0,
      transactions: [],
    };
  }
}
