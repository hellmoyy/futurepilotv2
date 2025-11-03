import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { BotInstance } from '@/models/BotInstance';
import { ExchangeConnection } from '@/models/ExchangeConnection';
import { BitcoinProStrategy } from '@/lib/trading/BitcoinProStrategy';
import { decryptApiKey } from '@/lib/encryption';

// GET - Get all bot instances for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const bots = await BotInstance.find({ userId: session.user.id }).sort({
      createdAt: -1,
    }).lean();

    return NextResponse.json(bots);
  } catch (error: any) {
    console.error('Error fetching bots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bots', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Start or create a new bot instance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { botId, exchangeConnectionId, settings } = body;

    if (!botId || !exchangeConnectionId) {
      return NextResponse.json(
        { error: 'botId and exchangeConnectionId are required' },
        { status: 400 }
      );
    }

    console.log('📥 Received bot start request:', { botId, exchangeConnectionId, settings });

    await connectDB();

    // Check if bot already exists and is active
    const existingBot = await BotInstance.findOne({
      userId: session.user.id,
      botId,
      status: 'ACTIVE',
    });

    if (existingBot) {
      return NextResponse.json(
        { error: 'Bot is already running', bot: existingBot },
        { status: 400 }
      );
    }

    // Get exchange connection
    const exchangeConnection = await ExchangeConnection.findOne({
      _id: exchangeConnectionId,
      userId: session.user.id,
    });

    if (!exchangeConnection) {
      return NextResponse.json(
        { error: 'Exchange connection not found. Please connect your Binance account first.' },
        { status: 404 }
      );
    }

    // Check if API keys exist
    if (!exchangeConnection.apiKey || !exchangeConnection.apiSecret) {
      return NextResponse.json(
        { error: 'API credentials are missing. Please reconnect your Binance account.' },
        { status: 400 }
      );
    }

    // Decrypt API credentials
    let apiKey: string;
    let apiSecret: string;
    
    try {
      apiKey = decryptApiKey(exchangeConnection.apiKey);
      apiSecret = decryptApiKey(exchangeConnection.apiSecret);
      
      // Validate decrypted keys are not empty
      if (!apiKey || !apiSecret || apiKey.trim() === '' || apiSecret.trim() === '') {
        throw new Error('Decrypted keys are empty');
      }
    } catch (error) {
      console.error('❌ Failed to decrypt API keys:', error);
      return NextResponse.json(
        { 
          error: 'Failed to decrypt API credentials. Please reconnect your Binance account.',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Get bot configuration based on botId
    let botName = '';
    let symbol = '';
    let defaultConfig: any = {};

    switch (botId) {
      case 1: // Bitcoin Pro
        botName = 'Bitcoin Pro';
        symbol = 'BTCUSDT';
        defaultConfig = {
          leverage: 10,
          stopLossPercent: 3,
          takeProfitPercent: 6,
          positionSizePercent: 10,
          maxDailyLoss: 100,
        };
        break;
      case 2: // Ethereum Master
        botName = 'Ethereum Master';
        symbol = 'ETHUSDT';
        defaultConfig = {
          leverage: 10,
          stopLossPercent: 3,
          takeProfitPercent: 6,
          positionSizePercent: 10,
          maxDailyLoss: 100,
        };
        break;
      case 3: // Safe Trader
        botName = 'Safe Trader';
        symbol = 'BTCUSDT'; // Multi-currency in future
        defaultConfig = {
          leverage: 5,
          stopLossPercent: 2,
          takeProfitPercent: 3,
          positionSizePercent: 5,
          maxDailyLoss: 50,
        };
        break;
      case 4: // Aggressive Trader
        botName = 'Aggressive Trader';
        symbol = 'BTCUSDT'; // Multi-currency in future
        defaultConfig = {
          leverage: 20,
          stopLossPercent: 5,
          takeProfitPercent: 10,
          positionSizePercent: 15,
          maxDailyLoss: 200,
        };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid bot ID' },
          { status: 400 }
        );
    }

    // Merge default config with user settings (including Tier 1 & 2 features)
    const config = {
      ...defaultConfig,
      // Override with user settings if provided
      ...(settings && {
        leverage: settings.leverage ?? defaultConfig.leverage,
        stopLossPercent: settings.stopLoss ?? defaultConfig.stopLossPercent,
        takeProfitPercent: settings.takeProfit ?? defaultConfig.takeProfitPercent,
        positionSizePercent: settings.positionSize ?? defaultConfig.positionSizePercent,
        maxDailyLoss: settings.maxDailyLoss ?? defaultConfig.maxDailyLoss,
        // Tier 1 features
        trailingStopLoss: settings.trailingStopLoss ?? { enabled: false, distance: 2 },
        maxPositionSize: settings.maxPositionSize ?? 100,
        maxConcurrentPositions: settings.maxConcurrentPositions ?? 3,
        maxDailyTrades: settings.maxDailyTrades ?? 10,
        // Tier 2 features
        breakEvenStop: settings.breakEvenStop ?? { enabled: false, triggerProfit: 2 },
        partialTakeProfit: settings.partialTakeProfit ?? {
          enabled: false,
          levels: [
            { profit: 3, closePercent: 50 },
            { profit: 6, closePercent: 50 }
          ]
        },
      }),
      symbol: settings?.currency || symbol, // Use selected currency if provided
    };

    console.log('⚙️ Bot configuration (with advanced features):', config);

    // Create bot instance
    const botInstance = await BotInstance.create({
      userId: session.user.id,
      botId,
      botName,
      symbol,
      status: 'ACTIVE',
      config,
      exchangeConnectionId,
      startedAt: new Date(),
      statistics: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalProfit: 0,
        totalLoss: 0,
        winRate: 0,
        avgProfit: 0,
        dailyPnL: 0,
        lastResetDate: new Date(),
      },
    });

    // Run initial analysis (don't wait for it)
    runBotAnalysis(botInstance._id.toString(), botId, apiKey, apiSecret).catch(
      console.error
    );

    return NextResponse.json({
      success: true,
      message: 'Bot started successfully',
      bot: botInstance,
    });
  } catch (error: any) {
    console.error('Error starting bot:', error);
    return NextResponse.json(
      { error: 'Failed to start bot', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to run bot analysis in background
async function runBotAnalysis(
  botInstanceId: string,
  botId: number,
  apiKey: string,
  apiSecret: string
) {
  try {
    await connectDB();
    const botInstance = await BotInstance.findById(botInstanceId);
    if (!botInstance || botInstance.status !== 'ACTIVE') {
      return;
    }

    // Create strategy instance based on botId
    let strategy: any;

    switch (botId) {
      case 1: // Bitcoin Pro
        strategy = new BitcoinProStrategy(
          botInstance.userId.toString(),
          apiKey,
          apiSecret,
          botInstanceId
        );
        break;
      // Add other strategies here
      default:
        return;
    }

    // Run trading cycle
    const result = await strategy.executeTradingCycle();

    // Update bot instance with results
    const updateData: any = {
      lastAnalysis: {
        timestamp: new Date(),
        signal: result,
      },
    };

    if (result.position) {
      updateData.currentPosition = result.position;
    }

    if (!result.success) {
      updateData.status = 'ERROR';
      updateData.lastError = {
        timestamp: new Date(),
        message: result.message,
      };
    }

    await BotInstance.findByIdAndUpdate(botInstanceId, updateData);
  } catch (error: any) {
    console.error('Error in bot analysis:', error);
    await BotInstance.findByIdAndUpdate(botInstanceId, {
      status: 'ERROR',
      lastError: {
        timestamp: new Date(),
        message: error.message,
        stack: error.stack,
      },
    });
  }
}
