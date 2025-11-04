/**
 * SAFE Cron Job: Auto-fix missing referral commissions
 * Runs every 5 minutes to catch missed commissions
 * 
 * SAFETY FEATURES:
 * - Idempotency check: Won't create duplicate commissions
 * - Only processes users with deposits but NO commissions
 * - Logs all actions for audit trail
 * - Safe to run multiple times
 * 
 * Deploy: Add to Upstash QStash or Vercel Cron
 * Schedule: Every 5 minutes
 * URL: /api/cron/auto-fix-commissions?token=CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { ReferralCommission } from '@/models/ReferralCommission';
import { Settings } from '@/models/Settings';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Verify cron secret
    const token = request.nextUrl.searchParams.get('token');
    if (token !== process.env.CRON_SECRET) {
      console.error('❌ Unauthorized cron attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 [AUTO-FIX CRON] Starting commission check...');

    await connectDB();

    // 2. Get commission rates from settings
    const tierRatesSetting = await Settings.findOne({ key: 'tierCommissionRates' });
    const tierRates = tierRatesSetting?.value || {
      bronze: { level1: 10, level2: 5, level3: 5 },
      silver: { level1: 20, level2: 5, level3: 5 },
      gold: { level1: 30, level2: 5, level3: 5 },
      platinum: { level1: 40, level2: 5, level3: 5 },
    };

    // 3. Find users with deposits who were referred
    const candidateUsers = await User.find({ 
      totalPersonalDeposit: { $gt: 0 },
      referredBy: { $exists: true, $ne: null }
    }).select('_id email totalPersonalDeposit referredBy').lean();

    console.log(`📊 [AUTO-FIX CRON] Found ${candidateUsers.length} referred users with deposits`);

    // 4. Filter users WITHOUT commissions (IDEMPOTENCY CHECK)
    const usersNeedingCommission = [];
    
    for (const user of candidateUsers) {
      const existingCommission = await ReferralCommission.findOne({ 
        referralUserId: user._id 
      });
      
      if (!existingCommission) {
        usersNeedingCommission.push(user);
      }
    }

    console.log(`🎯 [AUTO-FIX CRON] ${usersNeedingCommission.length} users need commission processing`);

    if (usersNeedingCommission.length === 0) {
      const duration = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        message: 'No missing commissions detected',
        processed: 0,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
    }

    // 5. Process missing commissions
    let commissionsCreated = 0;
    let totalAmountDistributed = 0;
    const processedUsers = [];

    for (const user of usersNeedingCommission) {
      try {
        // ✅ IMPORTANT: Sync totalPersonalDeposit from actual transactions first
        // This ensures we use the correct deposit amount for commission calculation
        const Transaction = (await import('@/models/Transaction')).Transaction;
        const depositSum = await Transaction.aggregate([
          {
            $match: {
              userId: user._id,
              type: { $in: ['deposit', undefined, null] },
              status: 'confirmed',
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        const calculatedDeposit = depositSum.length > 0 ? depositSum[0].total : 0;
        const depositAmount = calculatedDeposit;

        // Update user's totalPersonalDeposit if different
        if (calculatedDeposit !== user.totalPersonalDeposit) {
          await User.findByIdAndUpdate(user._id, { totalPersonalDeposit: calculatedDeposit });
          console.log(`📊 [SYNC] Updated ${user.email}: $${user.totalPersonalDeposit} → $${calculatedDeposit}`);
        }

        let currentUserId: any = user._id;
        let currentReferrerId: any = user.referredBy;
        let level = 1;

        // Distribute to 3 levels
        while (currentReferrerId && level <= 3) {
          const referrer = await User.findById(currentReferrerId)
            .select('email membershipLevel totalEarnings referredBy');
          
          if (!referrer) break;

          // Calculate commission
          const tierKey = referrer.membershipLevel || 'bronze';
          const rate = tierRates[tierKey]?.[`level${level}`] || 0;
          const commissionAmount = (depositAmount * rate) / 100;

          if (commissionAmount > 0) {
            // Create commission record
            // IMPORTANT: referralUserId should ALWAYS be the original deposit user (user._id),
            // NOT currentUserId which changes during the loop
            const commission = new ReferralCommission({
              userId: referrer._id,
              referralUserId: user._id, // ✅ FIX: Always use original user who made the deposit
              amount: commissionAmount,
              level: level,
              depositAmount: depositAmount,
              commissionRate: rate,
              source: 'auto_fix_cron',
              createdAt: new Date(),
            });
            await commission.save();

            // Update referrer's totalEarnings
            referrer.totalEarnings = (referrer.totalEarnings || 0) + commissionAmount;
            await referrer.save();

            commissionsCreated++;
            totalAmountDistributed += commissionAmount;

            console.log(`✅ [AUTO-FIX CRON] Level ${level}: ${referrer.email} +$${commissionAmount.toFixed(2)}`);
          }

          // Move to next level
          currentUserId = referrer._id;
          currentReferrerId = referrer.referredBy;
          level++;
        }

        processedUsers.push(user.email);

      } catch (userError: any) {
        console.error(`❌ [AUTO-FIX CRON] Error processing ${user.email}:`, userError.message);
        // Continue with next user
      }
    }

    const duration = Date.now() - startTime;

    console.log(`✅ [AUTO-FIX CRON] Completed:`);
    console.log(`   Users processed: ${processedUsers.length}`);
    console.log(`   Commissions created: ${commissionsCreated}`);
    console.log(`   Amount distributed: $${totalAmountDistributed.toFixed(2)}`);
    console.log(`   Duration: ${duration}ms`);

    return NextResponse.json({
      success: true,
      processed: processedUsers.length,
      commissionsCreated,
      totalAmountDistributed: totalAmountDistributed.toFixed(2),
      users: processedUsers,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [AUTO-FIX CRON] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
