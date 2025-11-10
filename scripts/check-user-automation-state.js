require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  walletData: {
    erc20Address: String,
    bep20Address: String,
    encryptedPrivateKey: String,
    balance: { type: Number, default: 0 },
    mainnetBalance: { type: Number, default: 0 },
  },
  gasFeeBalance: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  totalWithdrawn: { type: Number, default: 0 },
  totalPersonalDeposit: { type: Number, default: 0 },
  binanceApiKey: String,
  binanceApiSecret: String,
  binanceTestnetApiKey: String,
  binanceTestnetApiSecret: String,
}, { timestamps: true, collection: 'futurepilotcols' });

const User = mongoose.model('User', userSchema);

// ExchangeConnection Schema
const exchangeConnectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  exchange: String,
  apiKey: String,
  apiSecret: String,
  testnet: Boolean,
  status: String,
  createdAt: Date,
}, { collection: 'exchangeconnections' });

const ExchangeConnection = mongoose.model('ExchangeConnection', exchangeConnectionSchema);

// TradingBotConfig Schema
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
  },
  supportedCurrencies: [{ type: String }],
}, { timestamps: true, collection: 'tradingbotconfigs' });

const TradingBotConfig = mongoose.model('TradingBotConfig', tradingBotConfigSchema);

// Bot Instance Schema
const botInstanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  botId: Number,
  exchangeConnectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExchangeConnection' },
  status: String,
  settings: Object,
  createdAt: Date,
}, { collection: 'botinstances' });

const BotInstance = mongoose.model('BotInstance', botInstanceSchema);

async function checkUserAutomationState() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user
    const userEmail = 'helmi.andito@gmail.com';
    console.log(`🔍 Looking for user: ${userEmail}`);
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log('❌ User NOT FOUND!');
      return;
    }

    console.log('✅ User found!');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   User ID: ${user._id}`);
    console.log(`   Gas Fee Balance: $${user.gasFeeBalance || 0}`);
    console.log(`   Has Binance API: ${user.binanceApiKey ? 'Yes' : 'No'}`);
    console.log(`   Has Binance Testnet API: ${user.binanceTestnetApiKey ? 'Yes' : 'No'}`);
    console.log('');

    // Check Exchange Connections
    console.log('🔍 Checking Exchange Connections...');
    const connections = await ExchangeConnection.find({ userId: user._id });
    console.log(`   Found ${connections.length} exchange connection(s):`);
    
    if (connections.length === 0) {
      console.log('   ❌ NO EXCHANGE CONNECTIONS!');
      console.log('   → This is why button is disabled!');
      console.log('   → User needs to add Binance API in Settings > Exchange');
    } else {
      connections.forEach((conn, i) => {
        console.log(`   ${i + 1}. ${conn.name || 'Unnamed'} (${conn.exchange})`);
        console.log(`      ID: ${conn._id}`);
        console.log(`      Status: ${conn.status}`);
        console.log(`      Testnet: ${conn.testnet}`);
        console.log(`      Created: ${conn.createdAt}`);
      });
    }
    console.log('');

    // Check Trading Bots (what API would return)
    console.log('🔍 Checking Trading Bot Configs (API: GET /api/trading-bots?isActive=true)...');
    const tradingBots = await TradingBotConfig.find({ isActive: true }).sort({ botId: 1 });
    console.log(`   Found ${tradingBots.length} active bot(s):`);
    
    tradingBots.forEach((bot, i) => {
      console.log(`   ${i + 1}. ${bot.name} (botId: ${bot.botId})`);
      if (bot.name === 'Alpha Pilot') {
        console.log(`      ✅ This is the Alpha Pilot!`);
      }
    });

    const alphaPilot = tradingBots.find(b => b.name === 'Alpha Pilot');
    if (!alphaPilot) {
      console.log('   ❌ Alpha Pilot NOT FOUND in active bots!');
    }
    console.log('');

    // Check Active Bot Instances
    console.log('🔍 Checking Active Bot Instances (API: GET /api/bots)...');
    const botInstances = await BotInstance.find({ userId: user._id });
    console.log(`   Found ${botInstances.length} bot instance(s) for this user:`);
    
    if (botInstances.length === 0) {
      console.log('   ℹ️ No active bots (normal if bot not started yet)');
    } else {
      botInstances.forEach((instance, i) => {
        console.log(`   ${i + 1}. Bot ID: ${instance.botId}, Status: ${instance.status}`);
        console.log(`      Exchange Connection: ${instance.exchangeConnectionId}`);
        console.log(`      Created: ${instance.createdAt}`);
      });
    }
    console.log('');

    // Final Diagnosis
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 AUTOMATION PAGE STATE DIAGNOSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n1️⃣ tradingBots (from /api/trading-bots?isActive=true):');
    console.log(`   Count: ${tradingBots.length}`);
    console.log(`   Alpha Pilot: ${alphaPilot ? '✅ Found' : '❌ Not Found'}`);
    
    console.log('\n2️⃣ alphaPilotBot (calculated in page.tsx):');
    if (alphaPilot) {
      console.log(`   ✅ Should be DEFINED`);
      console.log(`   Value: { botId: ${alphaPilot.botId}, name: "${alphaPilot.name}" }`);
    } else {
      console.log(`   ❌ Will be UNDEFINED`);
      console.log(`   → Button will be disabled!`);
    }
    
    console.log('\n3️⃣ exchangeConnections (from /api/exchange):');
    console.log(`   Count: ${connections.length}`);
    if (connections.length === 0) {
      console.log(`   ❌ EMPTY ARRAY`);
      console.log(`   → Button will be disabled!`);
    } else {
      console.log(`   ✅ Has ${connections.length} connection(s)`);
    }
    
    console.log('\n4️⃣ isBotActive (calculated):');
    const isBotActive = alphaPilot && botInstances.some(b => b.botId === alphaPilot.botId);
    console.log(`   Value: ${isBotActive}`);
    console.log(`   (true if bot instance exists for Alpha Pilot)`);
    
    console.log('\n5️⃣ Button Disabled Condition:');
    const shouldBeDisabled = !alphaPilot || (false && connections.length === 0); // loading=false, isLaunching=false, isShuttingDown=false
    console.log(`   !alphaPilotBot: ${!alphaPilot}`);
    console.log(`   loading: false (assumed)`);
    console.log(`   isLaunching: false (assumed)`);
    console.log(`   isShuttingDown: false (assumed)`);
    console.log(`   (!isBotActive && exchangeConnections.length === 0): ${!isBotActive && connections.length === 0}`);
    console.log(`   → Button disabled: ${shouldBeDisabled || (!isBotActive && connections.length === 0)}`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 ROOT CAUSE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!alphaPilot) {
      console.log('❌ Alpha Pilot bot not found in database');
      console.log('   → alphaPilotBot = undefined');
      console.log('   → Button disabled by: !alphaPilotBot condition');
      console.log('\n💊 SOLUTION:');
      console.log('   Run: node scripts/cleanup-bots-keep-alpha-pilot.js');
    } else if (connections.length === 0) {
      console.log('❌ No exchange connections found for user');
      console.log('   → exchangeConnections.length = 0');
      console.log('   → Button disabled by: (!isBotActive && exchangeConnections.length === 0)');
      console.log('\n💊 SOLUTION:');
      console.log('   1. Go to Settings → Exchange');
      console.log('   2. Add Binance API Key & Secret');
      console.log('   3. Save connection');
      console.log('   4. Refresh automation page');
    } else {
      console.log('✅ Both conditions met:');
      console.log('   ✅ Alpha Pilot exists');
      console.log('   ✅ Exchange connection exists');
      console.log('   ℹ️ If button still disabled, check browser console for:');
      console.log('      - loading state stuck at true');
      console.log('      - isLaunching state stuck at true');
      console.log('      - API fetch errors');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkUserAutomationState();
