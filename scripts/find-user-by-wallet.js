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

async function findUserByWallet() {
  console.log('🔍 Finding User by Wallet Address\n');
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    const targetWallet = '0x41C7aAF4c414C8bcF5A09684A0449A9188558AC7';
    console.log(`🎯 Searching for wallet: ${targetWallet}\n`);
    
    // Search in both ERC20 and BEP20 addresses (case insensitive)
    const user = await User.findOne({
      $or: [
        { 'walletData.erc20Address': new RegExp(`^${targetWallet}$`, 'i') },
        { 'walletData.bep20Address': new RegExp(`^${targetWallet}$`, 'i') }
      ]
    });
    
    if (!user) {
      console.log('❌ NO USER FOUND with this wallet address!\n');
      console.log('This means:');
      console.log('1. This wallet is not registered in the system');
      console.log('2. User needs to register and use system-generated wallet');
      console.log('3. Or this is a different user\'s wallet\n');
      
      // Show all users with wallets
      const allUsers = await User.find({ 'walletData.erc20Address': { $exists: true } }).limit(5);
      console.log(`\n📋 Found ${allUsers.length} registered users with wallets:`);
      allUsers.forEach((u, i) => {
        console.log(`\n${i + 1}. Email: ${u.email}`);
        console.log(`   ERC20: ${u.walletData.erc20Address}`);
        console.log(`   BEP20: ${u.walletData.bep20Address}`);
        console.log(`   Balance: ${u.walletData.balance || 0} USDT`);
      });
      
      return;
    }
    
    console.log('✅ USER FOUND!\n');
    console.log('📋 User Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Balance: ${user.walletData.balance || 0} USDT`);
    console.log(`   ERC20: ${user.walletData.erc20Address}`);
    console.log(`   BEP20: ${user.walletData.bep20Address}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

findUserByWallet();
