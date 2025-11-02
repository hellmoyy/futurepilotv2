import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { calculateReferralCommission } from '@/lib/referralCommission';
import { notificationManager } from '@/lib/notifications/NotificationManager';
import { Settings } from '@/models/Settings';

// GET - Get user's gas fee balance
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      gasFeeBalance: user.gasFeeBalance || 0,
    });
  } catch (error) {
    console.error('Error fetching gas fee balance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Update gas fee balance (for top-up)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update balance
    user.gasFeeBalance = (user.gasFeeBalance || 0) + amount;

    // Track total personal deposit for tier upgrade
    const previousDeposit = user.totalPersonalDeposit || 0;
    const newTotalDeposit = previousDeposit + amount;
    user.totalPersonalDeposit = newTotalDeposit;

    // Calculate previous tier before update
    const previousTier = !user.tierSetManually 
      ? (previousDeposit >= 10000 ? 'platinum' 
        : previousDeposit >= 2000 ? 'gold' 
        : previousDeposit >= 1000 ? 'silver' 
        : 'bronze')
      : user.membershipLevel;

    // Auto-upgrade tier based on total deposit (only if NOT manually set by admin)
    let tierUpgraded = false;
    let newTier = previousTier;
    
    if (!user.tierSetManually) {
      if (newTotalDeposit >= 10000) {
        newTier = 'platinum';
      } else if (newTotalDeposit >= 2000) {
        newTier = 'gold';
      } else if (newTotalDeposit >= 1000) {
        newTier = 'silver';
      } else {
        newTier = 'bronze';
      }
      
      // Check if tier changed
      if (newTier !== previousTier) {
        tierUpgraded = true;
        user.membershipLevel = newTier;
      }
    }

    await user.save();

    // Send tier upgrade notification if tier changed
    if (tierUpgraded) {
      try {
        // Get commission rates from settings
        const settings = await Settings.findOne();
        const tierRates = settings?.tierCommissionRates || {
          bronze: { level1: 10, level2: 5, level3: 5 },
          silver: { level1: 20, level2: 5, level3: 5 },
          gold: { level1: 30, level2: 5, level3: 5 },
          platinum: { level1: 40, level2: 5, level3: 5 },
        };

        const oldRates = tierRates[previousTier as keyof typeof tierRates] || { level1: 10, level2: 5, level3: 5 };
        const newRates = tierRates[newTier as keyof typeof tierRates] || { level1: 10, level2: 5, level3: 5 };

        await notificationManager.notifyTierUpgrade(
          (user._id as any).toString(),
          previousTier || 'bronze',
          newTier || 'bronze',
          newTotalDeposit,
          oldRates,
          newRates
        );
        
        console.log(`Tier upgrade notification sent: ${previousTier} → ${newTier}`);
      } catch (notificationError) {
        console.error('Error sending tier upgrade notification:', notificationError);
        // Don't fail the deposit if notification fails
      }
    }

    // Calculate referral commission from FULL topup amount
    // Commission distributed based on referrer's tier rates
    try {
      await calculateReferralCommission({
        userId: user._id as any,
        amount: amount, // Full topup amount, not platform fee
        source: 'gas_fee_topup',
        notes: `Gas fee topup commission from $${amount.toFixed(2)} deposit`,
      });
    } catch (commissionError) {
      console.error('Error calculating referral commission:', commissionError);
      // Don't fail the topup if commission calculation fails
    }

    return NextResponse.json({
      message: 'Balance updated successfully',
      gasFeeBalance: user.gasFeeBalance,
      membershipLevel: user.membershipLevel,
      totalPersonalDeposit: user.totalPersonalDeposit,
    });
  } catch (error) {
    console.error('Error updating gas fee balance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
