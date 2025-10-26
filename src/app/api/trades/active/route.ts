import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { TradeManager } from '@/lib/trading/TradeManager';

/**
 * GET /api/trades/active
 * Get all active trades for current user
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

    const trades = await TradeManager.getOpenTrades(session.user.id);

    return NextResponse.json({
      success: true,
      data: trades,
      count: trades.length,
    });
  } catch (error: any) {
    console.error('Error fetching active trades:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
