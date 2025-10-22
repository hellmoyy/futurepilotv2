import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import BotSettings from '@/models/BotSettings';
import { User } from '@/models/User';

// GET - Fetch bot settings for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const settings = await BotSettings.find({ userId: user._id });

    return NextResponse.json({
      success: true,
      settings: settings.map(s => ({
        botId: s.botId,
        leverage: s.leverage,
        stopLoss: s.stopLoss,
        takeProfit: s.takeProfit,
        // Tier 1 features
        trailingStopLoss: s.trailingStopLoss || { enabled: false, distance: 2 },
        maxPositionSize: s.maxPositionSize || 100,
        maxConcurrentPositions: s.maxConcurrentPositions || 3,
        maxDailyTrades: s.maxDailyTrades || 10,
        // Tier 2 features
        breakEvenStop: s.breakEvenStop || { enabled: false, triggerProfit: 2 },
        partialTakeProfit: s.partialTakeProfit || { enabled: false, levels: [{ profit: 3, closePercent: 50 }, { profit: 6, closePercent: 50 }] },
        maxDailyLoss: s.maxDailyLoss || { enabled: false, amount: 100 },
      }))
    });
  } catch (error) {
    console.error('Error fetching bot settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bot settings' },
      { status: 500 }
    );
  }
}

// POST - Save or update bot settings
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      botId, 
      leverage, 
      stopLoss, 
      takeProfit,
      // Tier 1 features
      trailingStopLoss,
      maxPositionSize,
      maxConcurrentPositions,
      maxDailyTrades,
      // Tier 2 features
      breakEvenStop,
      partialTakeProfit,
      maxDailyLoss
    } = body;

    if (!botId || leverage === undefined || stopLoss === undefined || takeProfit === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate ranges
    if (leverage < 1 || leverage > 50) {
      return NextResponse.json(
        { error: 'Leverage must be between 1 and 50' },
        { status: 400 }
      );
    }

    if (stopLoss < 1 || stopLoss > 20) {
      return NextResponse.json(
        { error: 'Stop loss must be between 1 and 20' },
        { status: 400 }
      );
    }

    if (takeProfit < 1 || takeProfit > 30) {
      return NextResponse.json(
        { error: 'Take profit must be between 1 and 30' },
        { status: 400 }
      );
    }

    // Validate Tier 1 features
    if (maxPositionSize && (maxPositionSize < 10 || maxPositionSize > 10000)) {
      return NextResponse.json(
        { error: 'Max position size must be between 10 and 10000 USDT' },
        { status: 400 }
      );
    }

    if (maxConcurrentPositions && (maxConcurrentPositions < 1 || maxConcurrentPositions > 20)) {
      return NextResponse.json(
        { error: 'Max concurrent positions must be between 1 and 20' },
        { status: 400 }
      );
    }

    if (maxDailyTrades && (maxDailyTrades < 1 || maxDailyTrades > 50)) {
      return NextResponse.json(
        { error: 'Max daily trades must be between 1 and 50' },
        { status: 400 }
      );
    }

    if (trailingStopLoss?.enabled && trailingStopLoss.distance && 
        (trailingStopLoss.distance < 0.5 || trailingStopLoss.distance > 10)) {
      return NextResponse.json(
        { error: 'Trailing stop loss distance must be between 0.5 and 10%' },
        { status: 400 }
      );
    }

    // Validate Tier 2 features
    if (breakEvenStop?.enabled && breakEvenStop.triggerProfit && 
        (breakEvenStop.triggerProfit < 0.5 || breakEvenStop.triggerProfit > 10)) {
      return NextResponse.json(
        { error: 'Break even trigger profit must be between 0.5 and 10%' },
        { status: 400 }
      );
    }

    if (maxDailyLoss?.enabled && maxDailyLoss.amount && 
        (maxDailyLoss.amount < 10 || maxDailyLoss.amount > 5000)) {
      return NextResponse.json(
        { error: 'Max daily loss must be between 10 and 5000 USDT' },
        { status: 400 }
      );
    }

    if (partialTakeProfit?.enabled && partialTakeProfit.levels) {
      for (const level of partialTakeProfit.levels) {
        if (level.profit < 0.5 || level.profit > 30) {
          return NextResponse.json(
            { error: 'Partial TP profit must be between 0.5 and 30%' },
            { status: 400 }
          );
        }
        if (level.closePercent < 10 || level.closePercent > 100) {
          return NextResponse.json(
            { error: 'Partial TP close percent must be between 10 and 100%' },
            { status: 400 }
          );
        }
      }
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update or create settings
    const settings = await BotSettings.findOneAndUpdate(
      { userId: user._id, botId },
      {
        userId: user._id,
        botId,
        leverage,
        stopLoss,
        takeProfit,
        // Tier 1 features
        trailingStopLoss: trailingStopLoss || { enabled: false, distance: 2 },
        maxPositionSize: maxPositionSize || 100,
        maxConcurrentPositions: maxConcurrentPositions || 3,
        maxDailyTrades: maxDailyTrades || 10,
        // Tier 2 features
        breakEvenStop: breakEvenStop || { enabled: false, triggerProfit: 2 },
        partialTakeProfit: partialTakeProfit || { enabled: false, levels: [{ profit: 3, closePercent: 50 }, { profit: 6, closePercent: 50 }] },
        maxDailyLoss: maxDailyLoss || { enabled: false, amount: 100 },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings: {
        botId: settings.botId,
        leverage: settings.leverage,
        stopLoss: settings.stopLoss,
        takeProfit: settings.takeProfit,
        trailingStopLoss: settings.trailingStopLoss,
        maxPositionSize: settings.maxPositionSize,
        maxConcurrentPositions: settings.maxConcurrentPositions,
        maxDailyTrades: settings.maxDailyTrades,
        breakEvenStop: settings.breakEvenStop,
        partialTakeProfit: settings.partialTakeProfit,
        maxDailyLoss: settings.maxDailyLoss,
      }
    });
  } catch (error) {
    console.error('Error saving bot settings:', error);
    return NextResponse.json(
      { error: 'Failed to save bot settings' },
      { status: 500 }
    );
  }
}
