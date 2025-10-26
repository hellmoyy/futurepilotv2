import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Trade } from '@/models/Trade';
import { TradeManager } from '@/lib/trading/TradeManager';

interface Params {
  params: {
    id: string;
  };
}

// GET single trade
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    
    const trade = await Trade.findById(params.id)
      .populate('userId', 'name email')
      .populate('strategyId', 'name');

    if (!trade) {
      return NextResponse.json(
        { success: false, error: 'Trade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: trade,
    });
  } catch (error: any) {
    console.error('Get Trade Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT update trade
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    const trade = await Trade.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    );

    if (!trade) {
      return NextResponse.json(
        { success: false, error: 'Trade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: trade,
    });
  } catch (error: any) {
    console.error('Update Trade Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE trade
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    
    const trade = await Trade.findByIdAndDelete(params.id);

    if (!trade) {
      return NextResponse.json(
        { success: false, error: 'Trade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {},
    });
  } catch (error: any) {
    console.error('Delete Trade Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/trades/[id]
 * Advanced trade operations: close, update SL/TP, cancel
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { action, exitPrice, stopLoss, takeProfit, notes } = body;

    // Verify trade exists and user owns it
    const trade = await Trade.findById(params.id);

    if (!trade) {
      return NextResponse.json(
        { success: false, error: 'Trade not found' },
        { status: 404 }
      );
    }

    if (trade.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - not your trade' },
        { status: 403 }
      );
    }

    let updatedTrade;

    if (action === 'close') {
      // Close the trade
      if (!exitPrice) {
        return NextResponse.json(
          { success: false, error: 'Exit price required for closing trade' },
          { status: 400 }
        );
      }

      updatedTrade = await TradeManager.closeTrade(params.id, {
        exitPrice,
        exitTime: new Date(),
        notes: notes || 'Manually closed',
      });
    } else if (action === 'update_sl') {
      // Update stop loss
      if (!stopLoss) {
        return NextResponse.json(
          { success: false, error: 'Stop loss value required' },
          { status: 400 }
        );
      }

      updatedTrade = await TradeManager.updateStopLoss(params.id, stopLoss);
    } else if (action === 'update_tp') {
      // Update take profit
      if (!takeProfit) {
        return NextResponse.json(
          { success: false, error: 'Take profit value required' },
          { status: 400 }
        );
      }

      updatedTrade = await TradeManager.updateTakeProfit(params.id, takeProfit);
    } else if (action === 'cancel') {
      // Cancel trade
      updatedTrade = await TradeManager.cancelTrade(params.id, notes);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be: close, update_sl, update_tp, or cancel' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTrade,
      message: `Trade ${action}d successfully`,
    });
  } catch (error: any) {
    console.error('Error updating trade:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
