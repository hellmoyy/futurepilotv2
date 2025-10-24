import { User } from '@/models/User';
import { ReferralCommission } from '@/models/ReferralCommission';
import mongoose from 'mongoose';

/**
 * Commission Rates by Membership Level
 */
const COMMISSION_RATES = {
  bronze: 10,
  silver: 20,
  gold: 30,
  platinum: 50,
};

/**
 * Commission Distribution by Level
 * Level 1: 50% of commission
 * Level 2: 30% of commission
 * Level 3: 20% of commission
 */
const LEVEL_DISTRIBUTION = {
  1: 0.50, // 50%
  2: 0.30, // 30%
  3: 0.20, // 20%
};

interface CommissionInput {
  userId: mongoose.Types.ObjectId | string; // User yang melakukan trading/deposit
  amount: number; // Total fee amount (e.g., trading fee)
  source: 'trading_fee' | 'deposit_fee' | 'withdrawal_fee' | 'subscription';
  sourceTransactionId?: mongoose.Types.ObjectId | string;
  notes?: string;
}

/**
 * Calculate and create commission for all referral levels
 */
export async function calculateReferralCommission(input: CommissionInput): Promise<{
  success: boolean;
  commissions: any[];
  totalCommission: number;
  error?: string;
}> {
  try {
    const { userId, amount, source, sourceTransactionId, notes } = input;

    if (!userId || amount <= 0) {
      return { success: false, commissions: [], totalCommission: 0, error: 'Invalid input' };
    }

    // Get user yang melakukan transaksi
    const user = await User.findById(userId);
    if (!user || !user.referredBy) {
      // User tidak punya referrer, tidak ada commission
      return { success: true, commissions: [], totalCommission: 0 };
    }

    const commissions: any[] = [];
    let currentUserId: mongoose.Types.ObjectId | null = user.referredBy;
    let level = 1;
    let totalCommission = 0;

    // Loop through 3 levels
    while (currentUserId && level <= 3) {
      // Get referrer user
      const referrer: any = await User.findById(currentUserId);
      if (!referrer) break;

      // Get commission rate based on membership level
      const membershipLevel = referrer.membershipLevel || 'bronze';
      const baseRate = COMMISSION_RATES[membershipLevel as keyof typeof COMMISSION_RATES];
      
      // Calculate commission untuk level ini
      const levelMultiplier = LEVEL_DISTRIBUTION[level as keyof typeof LEVEL_DISTRIBUTION];
      const commissionAmount = (amount * baseRate / 100) * levelMultiplier;

      if (commissionAmount > 0) {
        // Create commission record
        const commission = await ReferralCommission.create({
          userId: referrer._id,
          referralUserId: userId,
          referralLevel: level,
          amount: commissionAmount,
          commissionRate: baseRate,
          source,
          sourceTransactionId,
          status: 'pending', // Will be paid automatically or require approval
          notes: notes || `Level ${level} commission from ${source}`,
        });

        // Update referrer's total earnings
        await User.findByIdAndUpdate(
          referrer._id,
          { $inc: { totalEarnings: commissionAmount } },
          { new: true }
        );

        commissions.push({
          level,
          userId: referrer._id,
          userName: referrer.name,
          userEmail: referrer.email,
          membershipLevel,
          commissionRate: baseRate,
          amount: commissionAmount,
          commissionId: commission._id,
        });

        totalCommission += commissionAmount;
      }

      // Move to next level
      currentUserId = referrer.referredBy || null;
      level++;
    }

    return {
      success: true,
      commissions,
      totalCommission,
    };
  } catch (error: any) {
    console.error('Error calculating referral commission:', error);
    return {
      success: false,
      commissions: [],
      totalCommission: 0,
      error: error.message,
    };
  }
}

/**
 * Mark commission as paid
 */
export async function markCommissionAsPaid(commissionId: string): Promise<boolean> {
  try {
    const result = await ReferralCommission.findByIdAndUpdate(
      commissionId,
      {
        status: 'paid',
        paidAt: new Date(),
      },
      { new: true }
    );
    return !!result;
  } catch (error) {
    console.error('Error marking commission as paid:', error);
    return false;
  }
}

/**
 * Auto-pay pending commissions (for automatic payout)
 * Can be called by cron job or after certain conditions
 */
export async function autoPayPendingCommissions(userId: string): Promise<{
  success: boolean;
  paidCount: number;
  totalPaid: number;
}> {
  try {
    const pendingCommissions = await ReferralCommission.find({
      userId,
      status: 'pending',
    });

    let paidCount = 0;
    let totalPaid = 0;

    for (const commission of pendingCommissions) {
      commission.status = 'paid';
      commission.paidAt = new Date();
      await commission.save();
      paidCount++;
      totalPaid += commission.amount;
    }

    return {
      success: true,
      paidCount,
      totalPaid,
    };
  } catch (error) {
    console.error('Error auto-paying commissions:', error);
    return {
      success: false,
      paidCount: 0,
      totalPaid: 0,
    };
  }
}

/**
 * Get commission statistics for a user
 */
export async function getCommissionStats(userId: string): Promise<{
  totalEarned: number;
  pendingAmount: number;
  paidAmount: number;
  totalTransactions: number;
  byLevel: {
    level1: number;
    level2: number;
    level3: number;
  };
  bySource: {
    trading_fee: number;
    deposit_fee: number;
    withdrawal_fee: number;
    subscription: number;
  };
}> {
  try {
    const commissions = await ReferralCommission.find({ userId });

    const stats = {
      totalEarned: 0,
      pendingAmount: 0,
      paidAmount: 0,
      totalTransactions: commissions.length,
      byLevel: {
        level1: 0,
        level2: 0,
        level3: 0,
      },
      bySource: {
        trading_fee: 0,
        deposit_fee: 0,
        withdrawal_fee: 0,
        subscription: 0,
      },
    };

    commissions.forEach((commission) => {
      stats.totalEarned += commission.amount;
      
      if (commission.status === 'pending') {
        stats.pendingAmount += commission.amount;
      } else if (commission.status === 'paid') {
        stats.paidAmount += commission.amount;
      }

      // By level
      if (commission.referralLevel === 1) stats.byLevel.level1 += commission.amount;
      else if (commission.referralLevel === 2) stats.byLevel.level2 += commission.amount;
      else if (commission.referralLevel === 3) stats.byLevel.level3 += commission.amount;

      // By source
      stats.bySource[commission.source] += commission.amount;
    });

    return stats;
  } catch (error) {
    console.error('Error getting commission stats:', error);
    return {
      totalEarned: 0,
      pendingAmount: 0,
      paidAmount: 0,
      totalTransactions: 0,
      byLevel: { level1: 0, level2: 0, level3: 0 },
      bySource: { trading_fee: 0, deposit_fee: 0, withdrawal_fee: 0, subscription: 0 },
    };
  }
}
