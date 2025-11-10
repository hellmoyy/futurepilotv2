#!/usr/bin/env node

/**
 * Script to cleanup all bots in database and keep only Alpha Pilot
 * This ensures /automation page has only one bot to work with
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Define TradingBot Schema (same as in model)
const tradingBotSchema = new mongoose.Schema({
  botId: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  icon: String,
  description: String,
  risk: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  riskColor: String,
  winRate: String,
  avgProfit: String,
  recommended: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  defaultSettings: {
    leverage: {
      type: Number,
      default: 10,
    },
    stopLoss: {
      type: Number,
      default: 2,
    },
    takeProfit: {
      type: Number,
      default: 5,
    },
  },
  supportedCurrencies: {
    type: [String],
    default: ['BTCUSDT'],
  },
  features: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const TradingBot = mongoose.model('TradingBot', tradingBotSchema);

async function cleanupAndKeepAlphaPilot() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Alpha Pilot configuration
    const alphaPilotConfig = {
      botId: 1,
      name: 'Alpha Pilot',
      icon: '🤖',
      description: 'AI-powered Bitcoin trading with proven track record. Advanced algorithms for maximum profit.',
      risk: 'Medium',
      riskColor: 'yellow',
      winRate: '80.5%',
      avgProfit: '+3.2%',
      recommended: true,
      isActive: true,
      defaultSettings: {
        leverage: 10,
        stopLoss: 2,
        takeProfit: 5,
      },
      supportedCurrencies: ['BTCUSDT', 'ETHUSDT'],
      features: {
        aiPowered: true,
        technicalAnalysis: true,
        riskManagement: true,
        trailingStop: true,
        autoRebalance: true,
      },
    };

    // Step 1: Check all existing bots
    console.log('📊 Checking existing bots...');
    const allBots = await TradingBot.find({});
    console.log(`Found ${allBots.length} bot(s) in database:`);
    allBots.forEach(bot => {
      console.log(`  - botId: ${bot.botId}, name: "${bot.name}", isActive: ${bot.isActive}`);
    });
    console.log('');

    // Step 2: Delete all bots except Alpha Pilot (botId: 1)
    console.log('🗑️  Deleting all bots except Alpha Pilot (botId: 1)...');
    const deleteResult = await TradingBot.deleteMany({ botId: { $ne: 1 } });
    console.log(`✅ Deleted ${deleteResult.deletedCount} bot(s)\n`);

    // Step 3: Check if Alpha Pilot exists
    console.log('🔍 Checking for Alpha Pilot (botId: 1)...');
    let alphaPilot = await TradingBot.findOne({ botId: 1 });

    if (alphaPilot) {
      console.log('✅ Alpha Pilot already exists');
      console.log('📝 Updating Alpha Pilot configuration...');
      
      // Update existing Alpha Pilot
      alphaPilot.name = alphaPilotConfig.name;
      alphaPilot.icon = alphaPilotConfig.icon;
      alphaPilot.description = alphaPilotConfig.description;
      alphaPilot.risk = alphaPilotConfig.risk;
      alphaPilot.riskColor = alphaPilotConfig.riskColor;
      alphaPilot.winRate = alphaPilotConfig.winRate;
      alphaPilot.avgProfit = alphaPilotConfig.avgProfit;
      alphaPilot.recommended = alphaPilotConfig.recommended;
      alphaPilot.isActive = alphaPilotConfig.isActive;
      alphaPilot.defaultSettings = alphaPilotConfig.defaultSettings;
      alphaPilot.supportedCurrencies = alphaPilotConfig.supportedCurrencies;
      alphaPilot.features = alphaPilotConfig.features;
      alphaPilot.updatedAt = new Date();
      
      await alphaPilot.save();
      console.log('✅ Alpha Pilot updated successfully\n');
    } else {
      console.log('❌ Alpha Pilot not found, creating new one...');
      
      // Create new Alpha Pilot
      alphaPilot = new TradingBot(alphaPilotConfig);
      await alphaPilot.save();
      console.log('✅ Alpha Pilot created successfully\n');
    }

    // Step 4: Verify final state
    console.log('✅ Final Database State:');
    const finalBots = await TradingBot.find({});
    console.log(`Total bots: ${finalBots.length}`);
    finalBots.forEach(bot => {
      console.log('\n📌 Bot Details:');
      console.log(`   botId: ${bot.botId}`);
      console.log(`   name: ${bot.name}`);
      console.log(`   icon: ${bot.icon}`);
      console.log(`   description: ${bot.description}`);
      console.log(`   risk: ${bot.risk}`);
      console.log(`   winRate: ${bot.winRate}`);
      console.log(`   avgProfit: ${bot.avgProfit}`);
      console.log(`   recommended: ${bot.recommended}`);
      console.log(`   isActive: ${bot.isActive}`);
      console.log(`   leverage: ${bot.defaultSettings.leverage}x`);
      console.log(`   stopLoss: ${bot.defaultSettings.stopLoss}%`);
      console.log(`   takeProfit: ${bot.defaultSettings.takeProfit}%`);
      console.log(`   currencies: ${bot.supportedCurrencies.join(', ')}`);
    });

    console.log('\n✅ SUCCESS: Database cleaned! Only Alpha Pilot (botId: 1) remains.');
    console.log('🚀 You can now use /automation page with Alpha Pilot bot.\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupAndKeepAlphaPilot();
