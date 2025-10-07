import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Trade } from '@/models/Trade';
import mongoose from 'mongoose';

// GET all trades
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const symbol = searchParams.get('symbol');

    // Build query - always filter by current user
    const query: any = { userId: new mongoose.Types.ObjectId(session.user.id) };
    if (status) query.status = status;
    if (symbol) query.symbol = symbol.toUpperCase();

    const trades = await Trade.find(query)
      .sort({ entryTime: -1 })
      .limit(100)
      .lean();

    // Calculate statistics
    const stats = {
      total: trades.length,
      open: trades.filter(t => t.status === 'open').length,
      closed: trades.filter(t => t.status === 'closed').length,
      totalPnL: trades
        .filter(t => t.pnl)
        .reduce((sum, t) => sum + (t.pnl || 0), 0),
    };

    return NextResponse.json(trades);
  } catch (error: any) {
    console.error('Get Trades Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create trade
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['userId', 'symbol', 'type', 'side', 'entryPrice', 'quantity', 'stopLoss', 'takeProfit'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Create trade
    const trade = await Trade.create(body);

    return NextResponse.json(
      {
        success: true,
        data: trade,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create Trade Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
