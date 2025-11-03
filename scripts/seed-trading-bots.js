/**
 * Seed Script for Trading Bot Configurations
 * Run this script to populate the database with default trading bot configurations
 * Usage: node scripts/seed-trading-bots.js
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');

// Define the schema inline to avoid import issues
const TradingBotConfigSchema = new mongoose.Schema({
  botId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  description: { type: String, required: true },
  risk: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  riskColor: { type: String, enum: ['green', 'blue', 'orange', 'red'], required: true },
  winRate: { type: String, required: true },
  avgProfit: { type: String, required: true },
  recommended: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  defaultSettings: {
    leverage: { type: Number, required: true },
    stopLoss: { type: Number, required: true },
    takeProfit: { type: Number, required: true },
  },
  supportedCurrencies: [{ type: String }],
  features: {
    trailingStopLoss: {
      available: { type: Boolean, default: true },
      defaultEnabled: { type: Boolean, default: false },
      defaultDistance: { type: Number, default: 2 },
    },
    maxPositionSize: {
      available: { type: Boolean, default: true },
      defaultValue: { type: Number, default: 100 },
    },
    maxConcurrentPositions: {
      available: { type: Boolean, default: true },
      defaultValue: { type: Number, default: 3 },
    },
    maxDailyTrades: {
      available: { type: Boolean, default: true },
      defaultValue: { type: Number, default: 10 },
    },
    breakEvenStop: {
      available: { type: Boolean, default: true },
      defaultEnabled: { type: Boolean, default: false },
      defaultTriggerProfit: { type: Number, default: 2 },
    },
    partialTakeProfit: {
      available: { type: Boolean, default: true },
      defaultEnabled: { type: Boolean, default: false },
      defaultLevels: [{
        profit: { type: Number },
        closePercent: { type: Number },
      }],
    },
    maxDailyLoss: {
      available: { type: Boolean, default: true },
      defaultEnabled: { type: Boolean, default: false },
      defaultAmount: { type: Number, default: 100 },
    },
  },
  version: { type: String, default: '1.0.0' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const TradingBotConfig = mongoose.models.TradingBotConfig || mongoose.model('TradingBotConfig', TradingBotConfigSchema);

const defaultBotConfigs = [
  {
    botId: 1,
    name: 'Alpha Pilot',
    icon: '/images/icon-coin/alpha-pilot.svg', // Custom "A" logo (rendered via CSS)
    description: 'AI-powered automated trading with proven track record',
    risk: 'Medium',
    riskColor: 'blue',
    winRate: '71%',
    avgProfit: '+3.2%',
    recommended: true,
    isActive: true,
    defaultSettings: {
      leverage: 10,
      stopLoss: 3,
      takeProfit: 6,
    },
    supportedCurrencies: ['BTC'], // Alpha Pilot - Bitcoin trading
    features: {
      trailingStopLoss: {
        available: true,
        defaultEnabled: false,
        defaultDistance: 2,
      },
      maxPositionSize: {
        available: true,
        defaultValue: 100,
      },
      maxConcurrentPositions: {
        available: true,
        defaultValue: 3,
      },
      maxDailyTrades: {
        available: true,
        defaultValue: 10,
      },
      breakEvenStop: {
        available: true,
        defaultEnabled: false,
        defaultTriggerProfit: 2,
      },
      partialTakeProfit: {
        available: true,
        defaultEnabled: false,
        defaultLevels: [
          { profit: 3, closePercent: 50 },
          { profit: 6, closePercent: 50 }
        ],
      },
      maxDailyLoss: {
        available: true,
        defaultEnabled: false,
        defaultAmount: 100,
      },
    },
    version: '1.0.0',
  },
  {
    botId: 2,
    name: 'Ethereum Master',
    icon: '/images/icon-coin/etehreum.webp',
    description: 'Smart ETH trading with advanced algorithms',
    risk: 'Medium',
    riskColor: 'blue',
    winRate: '69%',
    avgProfit: '+2.8%',
    recommended: false,
    isActive: true,
    defaultSettings: {
      leverage: 10,
      stopLoss: 3,
      takeProfit: 6,
    },
    supportedCurrencies: ['ETH'], // Ethereum Master - Only Ethereum trading
    features: {
      trailingStopLoss: {
        available: true,
        defaultEnabled: false,
        defaultDistance: 2,
      },
      maxPositionSize: {
        available: true,
        defaultValue: 100,
      },
      maxConcurrentPositions: {
        available: true,
        defaultValue: 3,
      },
      maxDailyTrades: {
        available: true,
        defaultValue: 10,
      },
      breakEvenStop: {
        available: true,
        defaultEnabled: false,
        defaultTriggerProfit: 2,
      },
      partialTakeProfit: {
        available: true,
        defaultEnabled: false,
        defaultLevels: [
          { profit: 3, closePercent: 50 },
          { profit: 6, closePercent: 50 }
        ],
      },
      maxDailyLoss: {
        available: true,
        defaultEnabled: false,
        defaultAmount: 100,
      },
    },
    version: '1.0.0',
  },
  {
    botId: 3,
    name: 'Safe Trader',
    icon: '/images/icon-coin/safe.webp',
    description: 'Multi Currency - Low risk steady gains for beginners',
    risk: 'Low',
    riskColor: 'green',
    winRate: '68%',
    avgProfit: '+1.5%',
    recommended: false,
    isActive: true,
    defaultSettings: {
      leverage: 5,
      stopLoss: 2,
      takeProfit: 3,
    },
    supportedCurrencies: ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'LINK', 'LTC'], // Safe Trader - Stable major cryptocurrencies
    features: {
      trailingStopLoss: {
        available: true,
        defaultEnabled: true, // Enabled by default for safer trading
        defaultDistance: 1.5,
      },
      maxPositionSize: {
        available: true,
        defaultValue: 50, // Lower position size for safety
      },
      maxConcurrentPositions: {
        available: true,
        defaultValue: 2, // Fewer concurrent positions
      },
      maxDailyTrades: {
        available: true,
        defaultValue: 5, // Conservative daily trades
      },
      breakEvenStop: {
        available: true,
        defaultEnabled: true, // Enabled by default
        defaultTriggerProfit: 1.5,
      },
      partialTakeProfit: {
        available: true,
        defaultEnabled: true,
        defaultLevels: [
          { profit: 2, closePercent: 50 },
          { profit: 3, closePercent: 50 }
        ],
      },
      maxDailyLoss: {
        available: true,
        defaultEnabled: true, // Enabled by default for safety
        defaultAmount: 50,
      },
    },
    version: '1.0.0',
  },
  {
    botId: 4,
    name: 'Aggressive Trader',
    icon: '/images/icon-coin/aggresive.webp',
    description: 'Multi Currency - High risk high reward for experienced traders',
    risk: 'High',
    riskColor: 'orange',
    winRate: '64%',
    avgProfit: '+5.1%',
    recommended: false,
    isActive: true,
    defaultSettings: {
      leverage: 20,
      stopLoss: 5,
      takeProfit: 10,
    },
    supportedCurrencies: ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOGE', 'MATIC', 'AVAX', 'DOT', 'ARB', 'OP', 'ATOM', 'FTM', 'NEAR'], // Aggressive Trader - More pairs including volatile ones
    features: {
      trailingStopLoss: {
        available: true,
        defaultEnabled: false,
        defaultDistance: 3,
      },
      maxPositionSize: {
        available: true,
        defaultValue: 200, // Higher position size for aggressive trading
      },
      maxConcurrentPositions: {
        available: true,
        defaultValue: 5, // More concurrent positions
      },
      maxDailyTrades: {
        available: true,
        defaultValue: 20, // More active trading
      },
      breakEvenStop: {
        available: true,
        defaultEnabled: false,
        defaultTriggerProfit: 3,
      },
      partialTakeProfit: {
        available: true,
        defaultEnabled: false,
        defaultLevels: [
          { profit: 5, closePercent: 50 },
          { profit: 10, closePercent: 50 }
        ],
      },
      maxDailyLoss: {
        available: true,
        defaultEnabled: false,
        defaultAmount: 200,
      },
    },
    version: '1.0.0',
  },
];

async function seedTradingBots() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🌱 Seeding trading bot configurations...');

    // Clear existing configs (optional - comment out if you want to update instead)
    // await TradingBotConfig.deleteMany({});
    // console.log('🗑️  Cleared existing configurations');

    // Insert or update each bot config
    for (const config of defaultBotConfigs) {
      const existingBot = await TradingBotConfig.findOne({ botId: config.botId });
      
      if (existingBot) {
        console.log(`♻️  Updating bot: ${config.name} (ID: ${config.botId})`);
        await TradingBotConfig.updateOne(
          { botId: config.botId },
          { $set: { ...config, updatedAt: new Date() } }
        );
      } else {
        console.log(`➕ Creating bot: ${config.name} (ID: ${config.botId})`);
        await TradingBotConfig.create(config);
      }
    }

    console.log('\n✅ Successfully seeded trading bot configurations!');
    console.log(`📊 Total bots configured: ${defaultBotConfigs.length}`);

    // Display summary
    const allBots = await TradingBotConfig.find({});
    console.log('\n📋 Current bot configurations:');
    allBots.forEach(bot => {
      console.log(`   - ${bot.name} (ID: ${bot.botId}) - ${bot.risk} Risk - ${bot.supportedCurrencies.length} currencies`);
    });

  } catch (error) {
    console.error('❌ Error seeding trading bots:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed function
seedTradingBots();
