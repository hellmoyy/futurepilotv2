import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { User } from '@/models/User';
import { listenerManager } from '@/lib/signal-center/SignalListener';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/bot-control
 * Get bot status and statistics
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    const listener = listenerManager.getListener(user._id as mongoose.Types.ObjectId);
    const stats = listener.getStats();
    const positions = await listener.getActivePositions();
    
    return NextResponse.json({
      success: true,
      status: stats.status,
      stats,
      activePositions: positions.length,
      settings: user.botSettings || {
        enabled: false,
        symbols: ['BTCUSDT'],
        minStrength: 'STRONG',
        riskPerTrade: 2,
        maxPositions: 3,
        leverage: 10,
      },
    });
  } catch (error: any) {
    console.error('❌ GET bot control error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/bot-control
 * Start or stop bot
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { action } = body; // 'start' or 'stop'
    
    if (!['start', 'stop'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    const listener = listenerManager.getListener(user._id as mongoose.Types.ObjectId);
    
    if (action === 'start') {
      // Check if bot is already running
      if (listener.isListening()) {
        return NextResponse.json({
          success: true,
          message: 'Bot already running',
          status: 'RUNNING',
        });
      }
      
      // Check bot settings enabled
      if (!user.botSettings?.enabled) {
        return NextResponse.json(
          { success: false, error: 'Bot not enabled in settings. Enable it first.' },
          { status: 400 }
        );
      }
      
      // Start listener
      const result = await listener.start();
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
      
      console.log(`🚀 Bot started for user ${user.email}`);
      
      return NextResponse.json({
        success: true,
        message: 'Bot started successfully',
        status: 'RUNNING',
        stats: listener.getStats(),
      });
    } else {
      // Stop bot
      await listener.stop();
      
      console.log(`🛑 Bot stopped for user ${user.email}`);
      
      return NextResponse.json({
        success: true,
        message: 'Bot stopped successfully',
        status: 'STOPPED',
        stats: listener.getStats(),
      });
    }
  } catch (error: any) {
    console.error('❌ POST bot control error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/bot-control
 * Close a specific position manually
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const positionId = searchParams.get('positionId');
    
    if (!positionId) {
      return NextResponse.json(
        { success: false, error: 'positionId required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    const listener = listenerManager.getListener(user._id as mongoose.Types.ObjectId);
    
    if (!listener.isListening()) {
      return NextResponse.json(
        { success: false, error: 'Bot not running' },
        { status: 400 }
      );
    }
    
    await listener.closePosition(positionId);
    
    console.log(`🏁 Position ${positionId} closed manually by user ${user.email}`);
    
    return NextResponse.json({
      success: true,
      message: 'Position closed successfully',
    });
  } catch (error: any) {
    console.error('❌ DELETE bot control error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
