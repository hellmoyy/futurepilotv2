import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BotInstance } from '@/models/BotInstance';
import { ExchangeConnection } from '@/models/ExchangeConnection';
import { BitcoinProStrategy } from '@/lib/trading/BitcoinProStrategy';
import { decryptApiKey } from '@/lib/encryption';

// This endpoint will be called by Upstash Cron
// Secure it with a secret token
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    // Support both Authorization header and query parameter
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const tokenFromQuery = searchParams.get('token');
    const cronSecret = process.env.CRON_SECRET;

    // Check if auth is valid from either header or query param
    const isValidHeader = authHeader === `Bearer ${cronSecret}`;
    const isValidQuery = tokenFromQuery === cronSecret;

    if (!cronSecret || (!isValidHeader && !isValidQuery)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all active bot instances
    const activeBots = await BotInstance.find({ status: 'ACTIVE' });

    if (activeBots.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active bots to run',
        processedBots: 0,
      });
    }

    const results = [];

    // Process each bot
    for (const bot of activeBots) {
      try {
        // Get exchange connection
        const exchangeConnection = await ExchangeConnection.findById(
          bot.exchangeConnectionId
        );

        if (!exchangeConnection) {
          console.error(`Exchange connection not found for bot ${bot._id}`);
          results.push({
            botId: bot._id,
            botName: bot.botName,
            success: false,
            error: 'Exchange connection not found',
          });
          continue;
        }

        // Decrypt API credentials
        const apiKey = decryptApiKey(exchangeConnection.apiKey);
        const apiSecret = decryptApiKey(exchangeConnection.apiSecret);

        // Initialize strategy based on botId
        let strategy;
        switch (bot.botId) {
          case 1: // Bitcoin Pro
            strategy = new BitcoinProStrategy(
              apiKey,
              apiSecret,
              bot._id.toString()
            );
            break;
          // Add other strategies here
          case 2: // Ethereum Master
          case 3: // Safe Trader
          case 4: // Aggressive Trader
            console.log(`Strategy for bot ${bot.botName} not yet implemented`);
            results.push({
              botId: bot._id,
              botName: bot.botName,
              success: false,
              error: 'Strategy not yet implemented',
            });
            continue;
          default:
            console.error(`Unknown bot type: ${bot.botId}`);
            results.push({
              botId: bot._id,
              botName: bot.botName,
              success: false,
              error: 'Unknown bot type',
            });
            continue;
        }

        // Execute trading cycle
        const result = await strategy.executeTradingCycle();

        // Update bot instance with results
        bot.lastAnalysis = {
          timestamp: new Date(),
          signal: {
            action: result.message,
            confidence: 0,
            reason: result.message,
          },
        };

        if (!result.success && result.message) {
          bot.lastError = {
            timestamp: new Date(),
            message: result.message,
            stack: '',
          };
        }

        // Update current position if exists
        if (result.position) {
          bot.currentPosition = {
            symbol: result.position.symbol,
            side: result.position.side,
            entryPrice: result.position.entryPrice,
            quantity: result.position.quantity,
            leverage: result.position.leverage,
            stopLoss: result.position.stopLoss,
            takeProfit: result.position.takeProfit,
            pnl: result.position.pnl || 0,
            pnlPercent: result.position.pnlPercent || 0,
            openTime: result.position.openTime,
          };
        } else {
          // Clear position if no position exists
          bot.currentPosition = undefined;
        }

        await bot.save();

        results.push({
          botId: bot._id,
          botName: bot.botName,
          success: result.success,
          message: result.message,
          hasPosition: !!result.position,
          safetyWarnings: result.safetyWarnings || [],
        });
      } catch (error: any) {
        console.error(`Error processing bot ${bot._id}:`, error);
        
        // Update bot error
        bot.lastError = {
          timestamp: new Date(),
          message: error.message,
          stack: error.stack,
        };
        await bot.save();

        results.push({
          botId: bot._id,
          botName: bot.botName,
          success: false,
          error: error.message,
        });
      }
    }

    // Summary
    const summary = {
      totalBots: activeBots.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      withPositions: results.filter((r) => r.hasPosition).length,
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      results,
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST method for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
