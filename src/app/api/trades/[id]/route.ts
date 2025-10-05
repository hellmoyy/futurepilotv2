import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Trade } from '@/models/Trade';

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
