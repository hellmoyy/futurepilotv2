require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// Define TradingBotConfig schema (same as model)
const tradingBotConfigSchema = new mongoose.Schema({
  botId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  description: { type: String, required: true },
  risk: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  winRate: { type: String, required: true },
  avgProfit: { type: String, required: true },
  recommended: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  defaultSettings: {
    leverage: { type: Number, default: 10 },
    stopLoss: { type: Number, default: 2 },
    takeProfit: { type: Number, default: 5 },
    trailingStop: { type: Boolean, default: true },
    breakEven: { type: Boolean, default: true },
    partialTakeProfit: { type: Boolean, default: false },
    maxDailyLoss: { type: Number, default: 5 },
    positionSize: { type: Number, default: 100 },
  },
  supportedCurrencies: [{ type: String }],
  features: {
    aiPowered: { type: Boolean, default: false },
    technicalAnalysis: { type: Boolean, default: false },
    sentimentAnalysis: { type: Boolean, default: false },
    riskManagement: { type: Boolean, default: false },
    autoRebalance: { type: Boolean, default: false },
    multiTimeframe: { type: Boolean, default: false },
  },
}, { timestamps: true, collection: 'tradingbotconfigs' });

const TradingBotConfig = mongoose.model('TradingBotConfig', tradingBotConfigSchema);

async function testAlphaPilotAPI() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Check if Alpha Pilot exists in database
    console.log('📊 Test 1: Check if Alpha Pilot exists in database');
    const alphaPilot = await TradingBotConfig.findOne({ name: 'Alpha Pilot' });
    
    if (!alphaPilot) {
      console.log('❌ Alpha Pilot NOT FOUND in database!');
      console.log('   This is why the button is disabled.\n');
      
      // List all bots
      const allBots = await TradingBotConfig.find({});
      console.log('📋 All bots in database:', allBots.length);
      allBots.forEach((bot, i) => {
        console.log(`   ${i + 1}. botId: ${bot.botId}, name: "${bot.name}", isActive: ${bot.isActive}`);
      });
    } else {
      console.log('✅ Alpha Pilot found in database!');
      console.log(`   botId: ${alphaPilot.botId}`);
      console.log(`   name: "${alphaPilot.name}"`);
      console.log(`   isActive: ${alphaPilot.isActive}`);
      console.log(`   icon: ${alphaPilot.icon}`);
      console.log(`   description: ${alphaPilot.description.substring(0, 50)}...`);
      console.log(`   risk: ${alphaPilot.risk}`);
      console.log(`   winRate: ${alphaPilot.winRate}`);
      console.log(`   avgProfit: ${alphaPilot.avgProfit}`);
    }
    console.log('');

    // Test 2: Check if API would return it (isActive filter)
    console.log('📊 Test 2: Simulate API call GET /api/trading-bots?isActive=true');
    const activeBots = await TradingBotConfig.find({ isActive: true }).sort({ botId: 1 }).lean();
    
    console.log(`   Found ${activeBots.length} active bot(s):`);
    activeBots.forEach((bot, i) => {
      console.log(`   ${i + 1}. botId: ${bot.botId}, name: "${bot.name}"`);
    });
    
    const alphaPilotInActive = activeBots.find(b => b.name === 'Alpha Pilot');
    if (alphaPilotInActive) {
      console.log('   ✅ Alpha Pilot WOULD BE RETURNED by API');
    } else {
      console.log('   ❌ Alpha Pilot WOULD NOT BE RETURNED by API (not active or not found)');
    }
    console.log('');

    // Test 3: Check all bots without filter
    console.log('📊 Test 3: Simulate API call GET /api/trading-bots (no filter)');
    const allBotsAPI = await TradingBotConfig.find({}).sort({ botId: 1 }).lean();
    
    console.log(`   Found ${allBotsAPI.length} total bot(s):`);
    allBotsAPI.forEach((bot, i) => {
      console.log(`   ${i + 1}. botId: ${bot.botId}, name: "${bot.name}", isActive: ${bot.isActive}`);
    });
    console.log('');

    // Conclusion
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📌 DIAGNOSIS:');
    if (alphaPilot && alphaPilot.isActive) {
      console.log('✅ Alpha Pilot exists and is active');
      console.log('✅ API should return it');
      console.log('✅ alphaPilotBot should be defined in page.tsx');
      console.log('');
      console.log('🔍 If button still disabled, check:');
      console.log('   1. Browser console for fetch errors');
      console.log('   2. Network tab - is /api/trading-bots returning data?');
      console.log('   3. Check loadingBots state in React');
      console.log('   4. Check if exchangeConnections.length > 0');
    } else if (alphaPilot && !alphaPilot.isActive) {
      console.log('⚠️ Alpha Pilot exists but isActive = false');
      console.log('   → API filter will exclude it');
      console.log('   → alphaPilotBot will be undefined');
      console.log('   → Button will be disabled');
      console.log('');
      console.log('💡 SOLUTION: Set isActive to true');
    } else {
      console.log('❌ Alpha Pilot does NOT exist in database');
      console.log('   → API will return empty array');
      console.log('   → alphaPilotBot will be undefined');
      console.log('   → Button will be disabled');
      console.log('');
      console.log('💡 SOLUTION: Run cleanup-bots-keep-alpha-pilot.js again');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testAlphaPilotAPI();
