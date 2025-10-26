import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { TradeManager } from '@/lib/trading/TradeManager';

/**
 * GET /api/trades/stats
 * Get trade statistics for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const stats = await TradeManager.getTradeStats(session.user.id);

    if (!stats) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch trade stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching trade stats:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
