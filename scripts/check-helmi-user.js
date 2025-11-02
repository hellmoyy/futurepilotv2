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

async function checkHelmiUser() {
  console.log('🔍 Checking Helmi User\n');
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    const userEmail = 'helmi.andito@gmail.com';
    console.log(`👤 Looking for: ${userEmail}\n`);
    
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ USER NOT FOUND!\n');
      
      // Try case insensitive
      const userCaseInsensitive = await User.findOne({ 
        email: new RegExp(`^${userEmail}$`, 'i') 
      });
      
      if (userCaseInsensitive) {
        console.log('✅ Found with case-insensitive search!');
        console.log(`   Actual email in DB: ${userCaseInsensitive.email}`);
        console.log(`   Wallet ERC20: ${userCaseInsensitive.walletData?.erc20Address}`);
        console.log(`   Wallet BEP20: ${userCaseInsensitive.walletData?.bep20Address}`);
        console.log(`   Balance: ${userCaseInsensitive.walletData?.balance || 0} USDT`);
      }
      return;
    }
    
    console.log('✅ USER FOUND!\n');
    console.log('📋 User Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user._id}`);
    console.log(`   Created: ${user.createdAt}\n`);
    
    if (!user.walletData) {
      console.log('⚠️  NO WALLET DATA!\n');
      return;
    }
    
    console.log('💼 Wallet Data:');
    console.log(`   ERC20 Address: ${user.walletData.erc20Address || 'NOT SET'}`);
    console.log(`   BEP20 Address: ${user.walletData.bep20Address || 'NOT SET'}`);
    console.log(`   Balance: ${user.walletData.balance || 0} USDT\n`);
    
    // Check against the wallet address from screenshot
    const screenshotWallet = '0xd1C7aAF4c414C8bcF5A09686A4A9D1B8558AC7';
    console.log(`🎯 Wallet from Screenshot: ${screenshotWallet}`);
    
    if (user.walletData.erc20Address?.toLowerCase() === screenshotWallet.toLowerCase()) {
      console.log('✅ MATCHES ERC20 address!');
    } else if (user.walletData.bep20Address?.toLowerCase() === screenshotWallet.toLowerCase()) {
      console.log('✅ MATCHES BEP20 address!');
    } else {
      console.log('❌ Does NOT match either address');
      console.log(`   DB ERC20: ${user.walletData.erc20Address}`);
      console.log(`   DB BEP20: ${user.walletData.bep20Address}`);
    }
    
    // Also check the wallet user deposited to
    const depositWallet = '0x41C7aAF4c414C8bcF5A09684A0449A9188558AC7';
    console.log(`\n💰 Wallet with 125 USDT deposit: ${depositWallet}`);
    
    if (user.walletData.erc20Address?.toLowerCase() === depositWallet.toLowerCase()) {
      console.log('✅ MATCHES ERC20 address!');
    } else if (user.walletData.bep20Address?.toLowerCase() === depositWallet.toLowerCase()) {
      console.log('✅ MATCHES BEP20 address!');
    } else {
      console.log('❌ Does NOT match either address');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkHelmiUser();
