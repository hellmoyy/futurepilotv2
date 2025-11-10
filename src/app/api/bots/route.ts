import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { BotInstance } from '@/models/BotInstance';
import { ExchangeConnection } from '@/models/ExchangeConnection';
import { TradingBotConfig } from '@/models/TradingBotConfig';
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

    return NextResponse.json({ bots }); // Return as { bots: [...] } not just [...]
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
      console.log('⚠️ Bot already running:', { botId, userId: session.user.id });
      return NextResponse.json(
        { error: 'Bot is already running. Please stop it first before starting again.' },
        { status: 400 }
      );
    }

    // Get exchange connection (explicitly select apiKey and apiSecret)
    const exchangeConnection = await ExchangeConnection.findOne({
      _id: exchangeConnectionId,
      userId: session.user.id,
    }).select('+apiKey +apiSecret'); // Explicitly select these fields (they are excluded by default)

    if (!exchangeConnection) {
      console.log('❌ Exchange connection not found:', { exchangeConnectionId, userId: session.user.id });
      return NextResponse.json(
        { error: 'Exchange connection not found. Please connect your Binance account first.' },
        { status: 404 }
      );
    }

    console.log('✅ Exchange connection found:', {
      id: exchangeConnection._id,
      exchange: exchangeConnection.exchange,
      hasApiKey: !!exchangeConnection.apiKey,
      hasApiSecret: !!exchangeConnection.apiSecret
    });

    // Check if API keys exist
    if (!exchangeConnection.apiKey || !exchangeConnection.apiSecret) {
      console.log('❌ API credentials missing in exchange connection');
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

    // Get bot configuration from TradingBotConfig database
    const tradingBotConfig = await TradingBotConfig.findOne({ botId, isActive: true });
    
    if (!tradingBotConfig) {
      return NextResponse.json(
        { error: `Bot configuration not found for botId: ${botId}` },
        { status: 404 }
      );
    }

    const botName = tradingBotConfig.name; // Use actual bot name from database (e.g., "Alpha Pilot")
    const symbol = settings?.currency || tradingBotConfig.supportedCurrencies?.[0] || 'BTCUSDT';
    const defaultConfig = {
      leverage: tradingBotConfig.defaultSettings?.leverage || 10,
      stopLossPercent: tradingBotConfig.defaultSettings?.stopLoss || 3,
      takeProfitPercent: tradingBotConfig.defaultSettings?.takeProfit || 6,
      positionSizePercent: 10,
      maxDailyLoss: 100,
    };

    console.log('✅ Bot config loaded from database:', { botId, botName, symbol });

    // Merge default config with user settings (including Tier 1 & 2 features)
    const config = {
      ...defaultConfig,
      // Override with user settings if provided
      ...(settings && {
        leverage: settings.leverage ?? defaultConfig.leverage,
        stopLossPercent: settings.stopLoss ?? defaultConfig.stopLossPercent,
        takeProfitPercent: settings.takeProfit ?? defaultConfig.takeProfitPercent,
        positionSizePercent: settings.positionSize ?? defaultConfig.positionSizePercent,
        maxDailyLoss: settings.maxDailyLoss?.amount ?? settings.maxDailyLoss ?? defaultConfig.maxDailyLoss, // Extract amount if object
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
    try {
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

      console.log('✅ Bot instance created:', { 
        instanceId: botInstance._id, 
        userId: session.user.id, 
        botId 
      });

      // Run initial analysis (don't wait for it)
      runBotAnalysis(
        botInstance._id.toString(), 
        botId, 
        apiKey, 
        apiSecret,
        exchangeConnectionId,
        botName
      ).catch(console.error);

      return NextResponse.json({
        success: true,
        message: 'Bot started successfully',
        bot: botInstance,
      });
    } catch (createError: any) {
      // Handle duplicate key error (race condition)
      if (createError.code === 11000) {
        console.log('⚠️ Duplicate bot creation prevented by unique index');
        return NextResponse.json(
          { error: 'Bot is already running. Please stop it first before starting again.' },
          { status: 400 }
        );
      }
      throw createError; // Re-throw other errors
    }
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
  apiSecret: string,
  exchangeConnectionId: string,
  botName: string
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
      case 1: // Bitcoin Pro (Alpha Pilot)
        strategy = new BitcoinProStrategy(
          botInstance.userId.toString(),
          apiKey,
          apiSecret,
          botInstanceId,
          exchangeConnectionId,
          botId,
          botName
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
