import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { ReferralCommission } from '@/models/ReferralCommission';
import { User } from '@/models/User';
import { getCommissionStats } from '@/lib/referralCommission';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

/**
 * GET - Fetch user's commission transactions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, paid, cancelled
    const level = searchParams.get('level'); // 1, 2, 3
    const source = searchParams.get('source'); // trading_fee, deposit_fee, etc
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query
    const query: any = { userId: user._id };
    if (status) query.status = status;
    if (level) query.referralLevel = parseInt(level);
    if (source) query.source = source;

    // Get total count
    const totalCount = await ReferralCommission.countDocuments(query);

    // Get transactions with pagination
    const transactions = await ReferralCommission.find(query)
      .populate('referralUserId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    // Get statistics
    const stats = await getCommissionStats((user._id as any).toString());

    return NextResponse.json({
      success: true,
      transactions,
      statistics: stats,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching commission transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
