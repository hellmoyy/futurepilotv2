/**
 * 🤖 CRON: Balance Check & Low Balance Alerts
 * 
 * This endpoint is called by Upstash Cron to check user balances hourly
 * and send notifications for low gas fee balances
 * 
 * Setup Instructions:
 * 1. Go to https://console.upstash.com/qstash
 * 2. Click "Create Schedule"
 * 3. URL: https://yourdomain.com/api/cron/balance-check?token=YOUR_CRON_SECRET
 * 4. Cron Expression: 0 * * * * (every hour at minute 0)
 * 5. Method: POST
 * 
 * Alert Levels:
 * - WARNING: < $15 (can still trade, but approaching limit)
 * - CRITICAL: < $12 (very low, need topup soon)
 * - CANNOT_TRADE: < $10 (trading blocked)
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { notificationManager } from '@/lib/notifications/NotificationManager';
import { getUserBalance } from '@/lib/network-balance';

// ============================================================================
// 🔐 SECURITY: Verify Cron Secret (Query Parameter or Header)
// ============================================================================

function verifyCronAuth(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('❌ CRON_SECRET not configured in .env');
    return false;
  }

  // Method 1: Check query parameter (easier for Upstash)
  const { searchParams } = new URL(req.url);
  const tokenParam = searchParams.get('token');
  if (tokenParam === cronSecret) {
    return true;
  }

  // Method 2: Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === cronSecret) {
      return true;
    }
  }

  console.error('❌ Invalid or missing CRON_SECRET');
  return false;
}

// ============================================================================
// 💰 BALANCE THRESHOLDS
// ============================================================================

const THRESHOLDS = {
  CRITICAL: 12,    // Below $12 - Critical alert
  WARNING: 15,     // Below $15 - Warning alert
  MINIMUM: 10,     // Below $10 - Cannot trade
};

// ============================================================================
// 📊 BALANCE CHECK FUNCTION
// ============================================================================

async function checkUserBalances() {
  const startTime = Date.now();
  const stats = {
    total: 0,
    healthy: 0,
    warning: 0,
    critical: 0,
    cannotTrade: 0,
    errors: 0,
  };

  try {
    await connectDB();

    // Get all active users
    const users = await User.find({ 
      status: { $ne: 'banned' } 
    }).select('name email walletData');

    stats.total = users.length;
    console.log(`📊 [BALANCE-CHECK] Checking ${users.length} users...`);

    // Check each user's balance
    for (const user of users) {
      try {
        // Get network-aware balance (testnet vs mainnet)
        const balance = getUserBalance(user);

        // Categorize balance level
        if (balance < THRESHOLDS.MINIMUM) {
          stats.cannotTrade++;
          
          // Send CANNOT_TRADE notification
          await notificationManager.notifyLowGasFee(
            String(user._id),
            balance
          );

          console.log(`🚫 [BALANCE-CHECK] User ${user.email}: $${balance} - CANNOT TRADE`);
        } else if (balance < THRESHOLDS.CRITICAL) {
          stats.critical++;
          
          // Send CRITICAL notification
          await notificationManager.notifyLowGasFee(
            String(user._id),
            balance
          );

          console.log(`⚠️  [BALANCE-CHECK] User ${user.email}: $${balance} - CRITICAL`);
        } else if (balance < THRESHOLDS.WARNING) {
          stats.warning++;
          
          // Send WARNING notification
          await notificationManager.notifyLowGasFee(
            String(user._id),
            balance
          );

          console.log(`⚡ [BALANCE-CHECK] User ${user.email}: $${balance} - WARNING`);
        } else {
          stats.healthy++;
        }
      } catch (error: any) {
        stats.errors++;
        console.error(`❌ [BALANCE-CHECK] Error checking user ${user.email}:`, error.message);
        // Continue with next user
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [BALANCE-CHECK] Completed in ${duration}ms`, stats);

    return stats;
  } catch (error: any) {
    console.error('❌ [BALANCE-CHECK] Fatal error:', error);
    throw error;
  }
}

// ============================================================================
// 🚀 POST - Check Balances (Called by Cron)
// ============================================================================

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify authentication
    if (!verifyCronAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid CRON_SECRET' },
        { status: 401 }
      );
    }

    console.log('🤖 [CRON] Starting balance check...');

    // Run balance check
    const stats = await checkUserBalances();

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Balance check completed',
      stats,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ [CRON] Balance check failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Balance check failed',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// 🔍 GET - Manual Test / Statistics (Optional)
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    if (!verifyCronAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid CRON_SECRET' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all active users
    const users = await User.find({ 
      status: { $ne: 'banned' } 
    }).select('name email walletData');

    // Calculate statistics
    const stats = {
      total: users.length,
      healthy: 0,
      warning: 0,
      critical: 0,
      cannotTrade: 0,
      balanceDistribution: [] as Array<{ email: string; balance: number; status: string }>,
    };

    for (const user of users) {
      const balance = getUserBalance(user);
      
      let status = 'HEALTHY';
      if (balance < THRESHOLDS.MINIMUM) {
        stats.cannotTrade++;
        status = 'CANNOT_TRADE';
      } else if (balance < THRESHOLDS.CRITICAL) {
        stats.critical++;
        status = 'CRITICAL';
      } else if (balance < THRESHOLDS.WARNING) {
        stats.warning++;
        status = 'WARNING';
      } else {
        stats.healthy++;
      }

      stats.balanceDistribution.push({
        email: user.email,
        balance,
        status,
      });
    }

    // Sort by balance (lowest first)
    stats.balanceDistribution.sort((a, b) => a.balance - b.balance);

    return NextResponse.json({
      success: true,
      stats,
      thresholds: THRESHOLDS,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ [CRON] GET statistics failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get statistics',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// 🔄 FORCE DYNAMIC (NO CACHING)
// ============================================================================

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout
