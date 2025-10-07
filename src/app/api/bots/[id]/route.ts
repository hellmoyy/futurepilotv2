import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { BotInstance } from '@/models/BotInstance';
import { ExchangeConnection } from '@/models/ExchangeConnection';
import { BitcoinProStrategy } from '@/lib/trading/BitcoinProStrategy';
import { decryptApiKey } from '@/lib/encryption';

// GET - Get specific bot instance
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

    const bot = await BotInstance.findOne({
      _id: params.id,
      userId: session.user.id,
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    return NextResponse.json({ bot });
  } catch (error: any) {
    console.error('Error fetching bot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bot', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Stop and delete bot instance
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const bot = await BotInstance.findOne({
      _id: params.id,
      userId: session.user.id,
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // If bot has active position, close it
    if (bot.currentPosition && bot.status === 'ACTIVE') {
      try {
        const exchangeConnection = await ExchangeConnection.findById(
          bot.exchangeConnectionId
        );

        if (exchangeConnection) {
          const apiKey = decryptApiKey(exchangeConnection.apiKey);
          const apiSecret = decryptApiKey(exchangeConnection.apiSecret);

          // Create strategy instance to close position
          let strategy: any;

          switch (bot.botId) {
            case 1: // Bitcoin Pro
              strategy = new BitcoinProStrategy(
                session.user.id,
                apiKey,
                apiSecret
              );
              break;
            // Add other strategies
          }

          if (strategy) {
            await strategy.closePosition();
          }
        }
      } catch (error) {
        console.error('Error closing position:', error);
        // Continue with stopping bot even if position close fails
      }
    }

    // Update bot status
    bot.status = 'STOPPED';
    bot.stoppedAt = new Date();
    await bot.save();

    return NextResponse.json({
      success: true,
      message: 'Bot stopped successfully',
      bot,
    });
  } catch (error: any) {
    console.error('Error stopping bot:', error);
    return NextResponse.json(
      { error: 'Failed to stop bot', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update bot status (pause/resume)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // 'pause', 'resume', 'stop'

    await connectDB();

    const bot = await BotInstance.findOne({
      _id: params.id,
      userId: session.user.id,
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    switch (action) {
      case 'pause':
        bot.status = 'PAUSED';
        break;
      case 'resume':
        bot.status = 'ACTIVE';
        break;
      case 'stop':
        bot.status = 'STOPPED';
        bot.stoppedAt = new Date();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    await bot.save();

    return NextResponse.json({
      success: true,
      message: `Bot ${action}ed successfully`,
      bot,
    });
  } catch (error: any) {
    console.error('Error updating bot:', error);
    return NextResponse.json(
      { error: 'Failed to update bot', details: error.message },
      { status: 500 }
    );
  }
}
