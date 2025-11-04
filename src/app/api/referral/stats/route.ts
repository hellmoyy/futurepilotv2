import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { ReferralCommission } from '@/models/ReferralCommission';
import { Withdrawal } from '@/models/Withdrawal';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

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

    // Get current user
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get commission rate based on membership level
    const commissionRates: Record<string, number> = {
      bronze: 10,
      silver: 20,
      gold: 30,
      platinum: 50,
    };

    const commissionRate = commissionRates[user.membershipLevel || 'bronze'];

    // Get Level 1 referrals (direct referrals)
    const level1Referrals = await User.find({ referredBy: user._id }).select('name email createdAt');

    // Get Level 2 referrals (referrals of referrals)
    const level1Ids = level1Referrals.map(ref => ref._id);
    const level2Referrals = await User.find({ referredBy: { $in: level1Ids } }).select('name email createdAt referredBy');

    // Get Level 3 referrals (referrals of level 2)
    const level2Ids = level2Referrals.map(ref => ref._id);
    const level3Referrals = await User.find({ referredBy: { $in: level2Ids } }).select('name email createdAt referredBy');

    // Calculate earnings from each referral
    const calculateEarningsFromReferral = async (referralId: any) => {
      const commissions = await ReferralCommission.find({
        userId: user._id,
        referralUserId: referralId,
      });
      return commissions.reduce((sum, comm) => sum + comm.amount, 0);
    };

    // Build referral list with levels and real earnings
    const referralList = await Promise.all([
      ...level1Referrals.map(async (ref: any) => ({
        level: 1,
        name: ref.name,
        email: ref.email,
        earnings: await calculateEarningsFromReferral(ref._id),
        joinedAt: ref.createdAt,
      })),
      ...level2Referrals.map(async (ref: any) => ({
        level: 2,
        name: ref.name,
        email: ref.email,
        earnings: await calculateEarningsFromReferral(ref._id),
        joinedAt: ref.createdAt,
      })),
      ...level3Referrals.map(async (ref: any) => ({
        level: 3,
        name: ref.name,
        email: ref.email,
        earnings: await calculateEarningsFromReferral(ref._id),
        joinedAt: ref.createdAt,
      })),
    ]);

    // Sort by joined date (newest first)
    referralList.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());

    // Calculate total withdrawn from referral commissions (for display only)
    const withdrawals = await Withdrawal.find({
      userId: user._id,
      type: 'referral',
      status: { $in: ['processing', 'completed'] },
    });

    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    
    // ✅ FIX: totalEarnings already has withdrawals deducted (done in withdrawal API)
    // No need to subtract again, otherwise it's double deduction!
    const availableCommission = Math.max(0, user.totalEarnings || 0);

    const stats = {
      referralCode: user.referralCode || '',
      membershipLevel: user.membershipLevel || 'bronze',
      commissionRate,
      totalEarnings: user.totalEarnings || 0,
      totalWithdrawn: totalWithdrawn,
      availableCommission: availableCommission, // Already ensured non-negative above
      totalPersonalDeposit: user.totalPersonalDeposit || 0, // ✅ For Membership Progress component
      totalReferrals: {
        level1: level1Referrals.length,
        level2: level2Referrals.length,
        level3: level3Referrals.length,
      },
      referrals: referralList,
    };

    // 🔍 Debug log
    console.log('📊 API Response - Referral Stats:', {
      email: user.email,
      totalPersonalDeposit: user.totalPersonalDeposit || 0,
      membershipLevel: user.membershipLevel || 'bronze',
    });

    return NextResponse.json(stats, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching referral stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral stats' },
      { status: 500 }
    );
  }
}
