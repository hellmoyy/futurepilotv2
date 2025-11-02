require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: String,
  walletData: {
    erc20Address: String,
    bep20Address: String,
    balance: Number
  }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function checkUser() {
  console.log('🔍 Checking User in Database\n');
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in .env.local');
      return;
    }
    
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected!\n');
    
    const userEmail = 'helmi.andito@gmail.com';
    console.log(`👤 Looking for user: ${userEmail}`);
    
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('\n❌ USER NOT FOUND IN DATABASE!');
      console.log('   User needs to:');
      console.log('   1. Register/Login to the platform');
      console.log('   2. Generate wallet at /topup page');
      return;
    }
    
    console.log('\n✅ USER FOUND!\n');
    console.log('📋 User Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user._id}`);
    console.log(`   Created: ${user.createdAt}`);
    
    if (!user.walletData) {
      console.log('\n⚠️  NO WALLET DATA!');
      console.log('   User needs to generate wallet at /topup page');
      return;
    }
    
    console.log('\n💼 Wallet Data:');
    console.log(`   ERC20 Address: ${user.walletData.erc20Address || 'NOT SET'}`);
    console.log(`   BEP20 Address: ${user.walletData.bep20Address || 'NOT SET'}`);
    console.log(`   Balance: ${user.walletData.balance || 0} USDT`);
    
    const targetWallet = '0x41C7aAF4c414C8bcF5A09684A0449A9188558AC7';
    console.log(`\n🎯 Target Wallet: ${targetWallet}`);
    
    if (user.walletData.bep20Address?.toLowerCase() === targetWallet.toLowerCase()) {
      console.log('✅ BEP20 address MATCHES!');
    } else {
      console.log(`❌ BEP20 address DOES NOT MATCH: ${user.walletData.bep20Address}`);
    }
    
    if (user.walletData.erc20Address?.toLowerCase() === targetWallet.toLowerCase()) {
      console.log('✅ ERC20 address MATCHES!');
    } else {
      console.log(`❌ ERC20 address DOES NOT MATCH: ${user.walletData.erc20Address}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

checkUser();
