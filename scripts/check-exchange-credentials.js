require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

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

async function checkExchangeConnection() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user
    const userEmail = 'helmi.andito@gmail.com';
    const User = mongoose.model('User', new mongoose.Schema({}, { collection: 'futurepilotcols' }));
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log(`👤 User: ${userEmail} (ID: ${user._id})\n`);

    // Get exchange connection that was used
    const connectionId = '6908895f2aeb7d841d98298b';
    console.log(`🔍 Checking Exchange Connection: ${connectionId}\n`);

    const conn = await ExchangeConnection.findById(connectionId);

    if (!conn) {
      console.log('❌ Exchange connection NOT FOUND!');
      console.log('   This is why bot start failed with 404.\n');
      
      // List all connections for this user
      const allConns = await ExchangeConnection.find({ userId: user._id });
      console.log(`📋 All connections for user (${allConns.length}):`);
      allConns.forEach((c, i) => {
        console.log(`   ${i + 1}. ID: ${c._id}, Name: ${c.name || 'Unnamed'}, Exchange: ${c.exchange}`);
      });
      
      return;
    }

    console.log('✅ Exchange Connection Found!');
    console.log(`   ID: ${conn._id}`);
    console.log(`   Name: ${conn.name || 'Unnamed'}`);
    console.log(`   Exchange: ${conn.exchange}`);
    console.log(`   Testnet: ${conn.testnet}`);
    console.log(`   Status: ${conn.status || 'N/A'}`);
    console.log(`   Created: ${conn.createdAt}`);
    console.log(`   User ID Match: ${conn.userId.toString() === user._id.toString() ? '✅ YES' : '❌ NO'}`);
    console.log('');

    // Check API credentials
    console.log('🔐 API Credentials Check:');
    console.log(`   Has apiKey: ${conn.apiKey ? '✅ YES' : '❌ NO'}`);
    console.log(`   Has apiSecret: ${conn.apiSecret ? '✅ YES' : '❌ NO'}`);
    
    if (conn.apiKey) {
      console.log(`   apiKey length: ${conn.apiKey.length} chars`);
      console.log(`   apiKey preview: ${conn.apiKey.substring(0, 20)}...`);
    }
    
    if (conn.apiSecret) {
      console.log(`   apiSecret length: ${conn.apiSecret.length} chars`);
      console.log(`   apiSecret preview: ${conn.apiSecret.substring(0, 20)}...`);
    }
    console.log('');

    // Diagnosis
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DIAGNOSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!conn.apiKey || !conn.apiSecret) {
      console.log('❌ PROBLEM: API credentials are missing!');
      console.log('   → This causes 400 error: "API credentials are missing"');
      console.log('');
      console.log('💊 SOLUTION:');
      console.log('   1. Go to Settings → Trading Account');
      console.log('   2. Re-enter your Binance API Key & Secret');
      console.log('   3. Click "Save Connection"');
      console.log('   4. Try starting bot again');
    } else if (conn.apiKey.length < 50 || conn.apiSecret.length < 50) {
      console.log('⚠️ WARNING: API keys seem too short (might be invalid)');
      console.log('   Normal Binance API key: 64 chars');
      console.log('   Normal Binance API secret: 64 chars');
    } else {
      console.log('✅ API credentials exist and look valid!');
      console.log('   If bot start still fails, check:');
      console.log('   1. Decryption process (encryption key correct?)');
      console.log('   2. Server logs for decryption errors');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkExchangeConnection();
