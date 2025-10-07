import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { BotInstance } from '@/models/BotInstance';
import { ExchangeConnection } from '@/models/ExchangeConnection';
import { BitcoinProStrategy } from '@/lib/trading/BitcoinProStrategy';
import { decryptApiKey } from '@/lib/encryption';
import { SafetyManager } from '@/lib/trading/SafetyManager';

// POST - Emergency stop all bots
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reason, botInstanceId } = body;

    await connectDB();

    let bots;
    if (botInstanceId) {
      // Stop specific bot
      const bot = await BotInstance.findOne({
        _id: botInstanceId,
        userId: session.user.id,
      });
      
      if (!bot) {
        return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
      }
      
      bots = [bot];
    } else {
      // Stop all active bots
      bots = await BotInstance.find({
        userId: session.user.id,
        status: 'ACTIVE',
      });
    }

    const results = [];

    for (const bot of bots) {
      try {
        // Create safety manager and trigger emergency stop
        const safetyManager = new SafetyManager(
          bot._id.toString(),
          session.user.id,
          bot.config
        );

        await safetyManager.emergencyStop(
          reason || 'Manual emergency stop triggered by user'
        );

        // Close any open positions
        if (bot.currentPosition) {
          const exchangeConnection = await ExchangeConnection.findById(
            bot.exchangeConnectionId
          );

          if (exchangeConnection) {
            const apiKey = decryptApiKey(exchangeConnection.apiKey);
            const apiSecret = decryptApiKey(exchangeConnection.apiSecret);

            let strategy: any;
            switch (bot.botId) {
              case 1:
                strategy = new BitcoinProStrategy(
                  session.user.id,
                  apiKey,
                  apiSecret,
                  bot._id.toString()
                );
                break;
            }

            if (strategy) {
              await strategy.closePosition();
            }
          }
        }

        results.push({
          botId: bot._id,
          botName: bot.botName,
          success: true,
          message: 'Emergency stop executed',
        });
      } catch (error: any) {
        results.push({
          botId: bot._id,
          botName: bot.botName,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Emergency stop executed for ${results.length} bot(s)`,
      results,
    });
  } catch (error: any) {
    console.error('Error executing emergency stop:', error);
    return NextResponse.json(
      { error: 'Failed to execute emergency stop', details: error.message },
      { status: 500 }
    );
  }
}
