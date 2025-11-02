import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import {
  canUserTrade,
  calculateMaxProfit,
  shouldAutoClose,
  deductTradingCommission,
  getTradingCommissionSummary,
} from '@/lib/tradingCommission';

export const dynamic = 'force-dynamic';

/**
 * POST /api/trading/commission/deduct
 * Deduct trading commission after closing a profitable position
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { userId, profit, positionId, notes } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!profit || profit <= 0) {
      return NextResponse.json(
        { error: 'profit must be a positive number' },
        { status: 400 }
      );
    }

    const result = await deductTradingCommission({
      userId,
      profit,
      positionId,
      notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to deduct commission' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        commission: result.commission,
        remainingBalance: result.remainingBalance,
        transactionId: result.transactionId,
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/trading/commission/deduct:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/trading/commission/check?userId=xxx
 * Check if user can trade and get trading limits
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action'); // 'check', 'max-profit', 'summary'

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check trading eligibility
    if (action === 'check' || !action) {
      const eligibility = await canUserTrade(userId);
      return NextResponse.json({
        success: true,
        data: eligibility,
      });
    }

    // Get max profit and auto-close threshold
    if (action === 'max-profit') {
      const maxProfitData = await calculateMaxProfit(userId);
      return NextResponse.json({
        success: true,
        data: maxProfitData,
      });
    }

    // Get commission summary
    if (action === 'summary') {
      const summary = await getTradingCommissionSummary(userId);
      return NextResponse.json({
        success: true,
        data: summary,
      });
    }

    // Auto-close check (requires profit parameter)
    if (action === 'auto-close') {
      const profitStr = searchParams.get('profit');
      if (!profitStr) {
        return NextResponse.json(
          { error: 'profit parameter required for auto-close check' },
          { status: 400 }
        );
      }

      const profit = parseFloat(profitStr);
      const autoCloseData = await shouldAutoClose(userId, profit);
      return NextResponse.json({
        success: true,
        data: autoCloseData,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in GET /api/trading/commission:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
