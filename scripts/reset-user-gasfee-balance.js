/**
 * Reset User Gas Fee Balance to Zero
 * 
 * Usage: node scripts/reset-user-gasfee-balance.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const TARGET_EMAIL = 'helmi.andito@gmail.com';

// Define User schema (minimal for this script)
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  walletData: {
    balance: { type: Number, default: 0 },
    mainnetBalance: { type: Number, default: 0 },
    erc20Address: String,
    bep20Address: String,
  }
}, { collection: 'futurepilotcols' });

const User = mongoose.model('User', userSchema);

async function resetUserBalance() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user
    console.log(`🔍 Finding user: ${TARGET_EMAIL}`);
    const user = await User.findOne({ email: TARGET_EMAIL });

    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('\n📊 Current Balance:');
    console.log('User:', user.name);
    console.log('Email:', user.email);
    console.log('Testnet Balance:', user.walletData?.balance || 0, 'USDT');
    console.log('Mainnet Balance:', user.walletData?.mainnetBalance || 0, 'USDT');

    // Reset to zero
    console.log('\n🔄 Resetting gas fee balance to 0...');
    
    const updateResult = await User.updateOne(
      { email: TARGET_EMAIL },
      {
        $set: {
          'walletData.balance': 0,
          'walletData.mainnetBalance': 0
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      console.log('⚠️  Balance already at 0, no changes made');
    } else {
      console.log('✅ Balance reset successful!');
    }

    // Verify
    const updatedUser = await User.findOne({ email: TARGET_EMAIL });
    console.log('\n✅ New Balance:');
    console.log('Testnet Balance:', updatedUser.walletData?.balance || 0, 'USDT');
    console.log('Mainnet Balance:', updatedUser.walletData?.mainnetBalance || 0, 'USDT');

    console.log('\n✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
resetUserBalance();
