import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { TradingStrategy } from '@/models/TradingStrategy';
import mongoose from 'mongoose';

// GET all strategies
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isActive = searchParams.get('isActive');

    // Build query
    const query: any = {};
    if (userId) query.userId = new mongoose.Types.ObjectId(userId);
    if (isActive !== null) query.isActive = isActive === 'true';

    const strategies = await TradingStrategy.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: strategies.length,
      data: strategies,
    });
  } catch (error: any) {
    console.error('Get Strategies Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create strategy
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['userId', 'name', 'symbol', 'entryConditions', 'exitConditions', 'stopLoss', 'takeProfit'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Create strategy
    const strategy = await TradingStrategy.create(body);

    return NextResponse.json(
      {
        success: true,
        data: strategy,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create Strategy Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
