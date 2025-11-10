/**
 * ⚠️  DEPRECATED - This file is replaced by API route
 * 
 * This standalone cron file has been replaced with an HTTP API route
 * for better integration with Upstash QStash and serverless environments.
 * 
 * NEW IMPLEMENTATION:
 * - API Route: /src/app/api/cron/balance-check/route.ts
 * - Setup Script: /scripts/setup-upstash-balance-check.js
 * - Documentation: /docs/BALANCE_CHECK_CRON_SETUP.md
 * 
 * This file is kept for reference only.
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * Balance Check Cron Job (ORIGINAL - REPLACED)
 * 
 * Monitors user gas fee balances and sends alerts when balance is low.
 * 
 * Schedule: Every 1 hour
 * Purpose: Proactive notification before users hit minimum balance
 * 
 * Alerts:
 * 1. Low Balance Warning (< $15): User approaching minimum
 * 2. Critical Balance Alert (< $12): User very close to minimum
 * 3. Cannot Trade Alert (< $10): User cannot trade anymore
 * 
 * Integration:
 * - Call this from your cron system (node-cron, Vercel Cron, etc.)
 * - Recommended: Run hourly during trading hours
 */

import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { notificationManager } from '@/lib/notifications/NotificationManager';
import { MINIMUM_GAS_FEE } from '@/lib/tradingCommission';

// User model interface
interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  walletData?: {
    balance: number;
    mainnetBalance: number;
  };
}

// ✅ MAINNET ONLY - Helper to get user balance
function getUserBalance(user: IUser): number {
  if (!user.walletData) return 0;
  return user.walletData.mainnetBalance || 0;
}

// Balance thresholds
const THRESHOLDS = {
  CRITICAL: 12, // $12 - Very close to minimum
  WARNING: 15,  // $15 - User should top up soon
  MINIMUM: MINIMUM_GAS_FEE, // $10 - Cannot trade
};

/**
 * Main cron job function
 * Checks all active users and sends balance alerts
 */
export async function checkUserBalances(): Promise<void> {
  console.log('⏰ [BALANCE CHECK CRON] Starting balance check...');
  
  const startTime = Date.now();
  
  try {
    await connectDB();
    
    // Get User model
    const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', new mongoose.Schema({}, { strict: false }));
    
    // Find all active users with trading enabled
    // TODO: Add filter for users with active bot instances
    const users = await User.find({
      status: { $ne: 'banned' },
      // Optional: Add filter for users with active trading
      // 'tradingBot.isActive': true
    }).select('_id email name walletData').lean<IUser[]>();
    
    console.log(`📊 Checking balances for ${users.length} users...`);
    
    let warningCount = 0;
    let criticalCount = 0;
    let cannotTradeCount = 0;
    let errorCount = 0;
    
    // Check each user's balance
    for (const user of users) {
      try {
        const balance = getUserBalance(user);
        
        // Skip users with healthy balance
        if (balance >= THRESHOLDS.WARNING) {
          continue;
        }
        
        // Determine alert level
        if (balance < THRESHOLDS.MINIMUM) {
          // CRITICAL: Cannot trade
          console.log(`🚨 User ${user.email}: CANNOT TRADE (balance: $${balance.toFixed(2)})`);
          
          await notificationManager.notifyLowGasFee(
            user._id.toString(),
            balance
          );
          
          cannotTradeCount++;
          
        } else if (balance < THRESHOLDS.CRITICAL) {
          // CRITICAL: Very close to minimum
          console.log(`⚠️  User ${user.email}: CRITICAL LOW (balance: $${balance.toFixed(2)})`);
          
          await notificationManager.notifyLowGasFee(
            user._id.toString(),
            balance
          );
          
          criticalCount++;
          
        } else if (balance < THRESHOLDS.WARNING) {
          // WARNING: Approaching minimum
          console.log(`⚡ User ${user.email}: LOW WARNING (balance: $${balance.toFixed(2)})`);
          
          await notificationManager.notifyLowGasFee(
            user._id.toString(),
            balance
          );
          
          warningCount++;
        }
        
      } catch (userError) {
        console.error(`❌ Error checking user ${user.email}:`, userError);
        errorCount++;
        // Continue with next user
      }
    }
    
    const duration = Date.now() - startTime;
    
    console.log('✅ [BALANCE CHECK CRON] Check complete:', {
      totalUsers: users.length,
      warningAlerts: warningCount,
      criticalAlerts: criticalCount,
      cannotTradeAlerts: cannotTradeCount,
      errors: errorCount,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    // Log summary alert if many users have low balance
    if (criticalCount + cannotTradeCount > 10) {
      console.warn('🚨 [BALANCE CHECK CRON] HIGH ALERT: Many users have critical low balance!', {
        critical: criticalCount,
        cannotTrade: cannotTradeCount,
        total: criticalCount + cannotTradeCount
      });
    }
    
  } catch (error) {
    console.error('❌ [BALANCE CHECK CRON] Fatal error during balance check:', error);
    
    // Don't throw error - cron should continue running
    // Log to monitoring system here if available
  }
}

/**
 * Get statistics about user balances
 * Useful for monitoring dashboard
 */
export async function getBalanceStatistics() {
  try {
    await connectDB();
    
    const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', new mongoose.Schema({}, { strict: false }));
    
    const users = await User.find({
      status: { $ne: 'banned' },
    }).select('_id email walletData').lean<IUser[]>();
    
    let healthy = 0;
    let warning = 0;
    let critical = 0;
    let cannotTrade = 0;
    
    for (const user of users) {
      const balance = getUserBalance(user);
      
      if (balance < THRESHOLDS.MINIMUM) {
        cannotTrade++;
      } else if (balance < THRESHOLDS.CRITICAL) {
        critical++;
      } else if (balance < THRESHOLDS.WARNING) {
        warning++;
      } else {
        healthy++;
      }
    }
    
    const stats = {
      total: users.length,
      healthy,
      warning,
      critical,
      cannotTrade,
      thresholds: THRESHOLDS,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 [BALANCE CHECK STATS] Current statistics:', stats);
    
    return stats;
    
  } catch (error) {
    console.error('❌ [BALANCE CHECK STATS] Error getting statistics:', error);
    return null;
  }
}

// Export for use in API routes or other cron systems
const balanceCheckCron = {
  checkUserBalances,
  getBalanceStatistics
};

export default balanceCheckCron;
