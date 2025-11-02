/**
 * Reset Test User Balance
 * Set test@futurepilot.pro balance to 0
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import User model
const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('futurepilotcol', UserSchema);

async function resetTestUserBalance() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find test user using Mongoose model
    const testUser = await User.findOne({ 
      email: /test.*futurepilot/i
    });
    
    if (!testUser) {
      console.log('✅ Test user not found (already deleted)');
      process.exit(0);
    }

    console.log(`📊 Found test user: ${testUser.email}`);
    console.log(`   Current balances:`);
    console.log(`   - Testnet: $${testUser.walletData?.balance || 0}`);
    console.log(`   - Mainnet: $${testUser.walletData?.mainnetBalance || 0}`);

    // Reset both balances to 0
    const updateResult = await User.updateOne(
      { email: /test.*futurepilot/i },
      { 
        $set: { 
          'walletData.balance': 0,
          'walletData.mainnetBalance': 0
        } 
      }
    );

    console.log(`\n✅ Updated ${updateResult.modifiedCount} user`);
    console.log('🎉 Test user balance reset to $0!');
    
    // Verify
    const verified = await User.findOne({ email: /test.*futurepilot/i });
    if (verified) {
      console.log(`\n✅ Verification:`);
      console.log(`   - Testnet: $${verified.walletData?.balance || 0}`);
      console.log(`   - Mainnet: $${verified.walletData?.mainnetBalance || 0}`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

resetTestUserBalance();
