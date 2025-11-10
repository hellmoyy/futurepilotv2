import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTradeHistory, updateBotStatistics } from '@/lib/trading/tradeTracking';
import { connectDB } from '@/lib/mongodb';
import { BotInstance } from '@/models/BotInstance';

/**
 * GET /api/bots/[id]/trades
 * 
 * Get trade history for specific bot instance
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const botInstanceId = params.id;

    // Verify bot belongs to user
    const bot = await BotInstance.findById(botInstanceId);
    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    if (bot.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status'); // 'OPEN' | 'CLOSED'

    // Get trade history
    const trades = await getTradeHistory(botInstanceId, limit);

    // Filter by status if provided
    const filteredTrades = status
      ? trades.filter(t => t.status === status)
      : trades;

    // Get statistics
    const statistics = bot.statistics || {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      totalLoss: 0,
      winRate: 0,
      avgProfit: 0,
      dailyPnL: 0,
    };

    return NextResponse.json({
      success: true,
      trades: filteredTrades,
      statistics,
      bot: {
        id: bot._id,
        botId: bot.botId,
        botName: bot.botName,
        symbol: bot.symbol,
        status: bot.status,
      },
    });
  } catch (error: any) {
    console.error('Error fetching trade history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade history', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bots/[id]/trades/refresh-stats
 * 
 * Manually refresh bot statistics from trade history
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const botInstanceId = params.id;

    // Verify bot belongs to user
    const bot = await BotInstance.findById(botInstanceId);
    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    if (bot.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Refresh statistics
    await updateBotStatistics(botInstanceId);

    // Get updated bot
    const updatedBot = await BotInstance.findById(botInstanceId);

    return NextResponse.json({
      success: true,
      message: 'Statistics refreshed successfully',
      statistics: updatedBot?.statistics,
    });
  } catch (error: any) {
    console.error('Error refreshing statistics:', error);
    return NextResponse.json(
      { error: 'Failed to refresh statistics', details: error.message },
      { status: 500 }
    );
  }
}
