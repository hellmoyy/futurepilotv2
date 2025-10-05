import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

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

    // Build referral list with levels
    const referralList = [
      ...level1Referrals.map(ref => ({
        level: 1,
        name: ref.name,
        email: ref.email,
        earnings: 0, // TODO: Calculate actual earnings from trading
        joinedAt: ref.createdAt,
      })),
      ...level2Referrals.map(ref => ({
        level: 2,
        name: ref.name,
        email: ref.email,
        earnings: 0, // TODO: Calculate actual earnings from trading
        joinedAt: ref.createdAt,
      })),
      ...level3Referrals.map(ref => ({
        level: 3,
        name: ref.name,
        email: ref.email,
        earnings: 0, // TODO: Calculate actual earnings from trading
        joinedAt: ref.createdAt,
      })),
    ];

    // Sort by joined date (newest first)
    referralList.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());

    const stats = {
      referralCode: user.referralCode || '',
      membershipLevel: user.membershipLevel || 'bronze',
      commissionRate,
      totalEarnings: user.totalEarnings || 0,
      totalReferrals: {
        level1: level1Referrals.length,
        level2: level2Referrals.length,
        level3: level3Referrals.length,
      },
      referrals: referralList,
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching referral stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral stats' },
      { status: 500 }
    );
  }
}
