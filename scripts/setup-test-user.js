/**
 * Setup Test User for Bot Integration Testing
 * 
 * This script prepares a test user with:
 * - Binance API credentials (testnet)
 * - Gas fee balance ($50)
 * - Bot settings initialized
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  walletData: {
    balance: Number,
    mainnetBalance: Number,
    erc20Address: String,
    bep20Address: String,
  },
  binanceApiKey: String,
  binanceApiSecret: String,
  botSettings: {
    enabled: Boolean,
    symbols: [String],
    minStrength: {
      type: String,
      enum: ['WEAK', 'MODERATE', 'STRONG', 'VERY_STRONG'],
      default: 'STRONG',
    },
    riskPerTrade: {
      type: Number,
      min: 1,
      max: 5,
      default: 2,
    },
    maxPositions: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    leverage: {
      type: Number,
      min: 1,
      max: 20,
      default: 10,
    },
  },
  totalPersonalDeposit: Number,
  gasFeeBalance: Number,
  createdAt: Date,
}, { timestamps: true });

const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', userSchema, 'futurepilotcols');

async function setupTestUser() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test user credentials
    const testEmail = 'test@futurepilot.com';
    
    // Check if test user exists
    let user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.log('📝 Creating new test user...');
      user = new User({
        name: 'Test User',
        email: testEmail,
        password: '$2a$10$test.password.hash', // Placeholder
        walletData: {
          balance: 50, // $50 testnet balance
          mainnetBalance: 0,
        },
        gasFeeBalance: 50, // $50 gas fee
        totalPersonalDeposit: 50,
        botSettings: {
          enabled: true,
          symbols: ['BTCUSDT'],
          minStrength: 'STRONG',
          riskPerTrade: 2,
          maxPositions: 3,
          leverage: 10,
        },
        createdAt: new Date(),
      });
      await user.save();
      console.log('✅ Test user created\n');
    } else {
      console.log('✅ Test user already exists\n');
    }

    // Update Binance API credentials
    console.log('🔑 Configuring Binance API credentials...');
    
    // Binance Testnet API credentials (public test keys)
    // You need to replace these with your own testnet keys
    // Get them from: https://testnet.binancefuture.com/
    const testnetApiKey = process.env.BINANCE_TESTNET_API_KEY || 'YOUR_TESTNET_API_KEY';
    const testnetApiSecret = process.env.BINANCE_TESTNET_API_SECRET || 'YOUR_TESTNET_API_SECRET';
    
    user.binanceApiKey = testnetApiKey;
    user.binanceApiSecret = testnetApiSecret;
    
    // Ensure bot settings
    if (!user.botSettings) {
      user.botSettings = {
        enabled: true,
        symbols: ['BTCUSDT'],
        minStrength: 'STRONG',
        riskPerTrade: 2,
        maxPositions: 3,
        leverage: 10,
      };
    }
    
    // Ensure gas fee balance
    if (!user.walletData) {
      user.walletData = { balance: 50 };
    }
    if (!user.walletData.balance || user.walletData.balance < 10) {
      user.walletData.balance = 50;
    }
    user.gasFeeBalance = user.walletData.balance;
    
    await user.save();
    
    console.log('✅ Binance API credentials configured\n');
    
    // Display user info
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST USER SETUP COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`Email:                ${user.email}`);
    console.log(`Name:                 ${user.name}`);
    console.log(`Gas Fee Balance:      $${user.gasFeeBalance}`);
    console.log(`Binance API Key:      ${user.binanceApiKey?.substring(0, 10)}...`);
    console.log(`Binance API Secret:   ${user.binanceApiSecret ? '[CONFIGURED]' : '[NOT SET]'}\n`);
    
    console.log('Bot Settings:');
    console.log(`  Enabled:            ${user.botSettings?.enabled}`);
    console.log(`  Symbols:            ${user.botSettings?.symbols?.join(', ')}`);
    console.log(`  Min Strength:       ${user.botSettings?.minStrength}`);
    console.log(`  Risk Per Trade:     ${user.botSettings?.riskPerTrade}%`);
    console.log(`  Max Positions:      ${user.botSettings?.maxPositions}`);
    console.log(`  Leverage:           ${user.botSettings?.leverage}x\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Check if API keys are placeholders
    if (testnetApiKey === 'YOUR_TESTNET_API_KEY' || !testnetApiKey) {
      console.log('⚠️  WARNING: Binance API keys are not configured!');
      console.log('');
      console.log('To get testnet API keys:');
      console.log('1. Go to https://testnet.binancefuture.com/');
      console.log('2. Login with GitHub or Google');
      console.log('3. Go to API Key Management');
      console.log('4. Create new API key with trading permissions');
      console.log('5. Add to .env.local:');
      console.log('   BINANCE_TESTNET_API_KEY=your_key');
      console.log('   BINANCE_TESTNET_API_SECRET=your_secret');
      console.log('6. Run this script again\n');
    } else {
      console.log('✅ Ready for testing!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Start dev server: npm run dev');
      console.log('2. Login as test user: test@futurepilot.com');
      console.log('3. Run tests: node test-bot-integration.js\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

setupTestUser();
