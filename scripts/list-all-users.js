require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: String,
  name: String,
  walletData: {
    erc20Address: String,
    bep20Address: String,
    balance: Number
  }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function listAllUsers() {
  console.log('🔍 Listing All Users in Database\n');
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    const allUsers = await User.find({}).sort({ createdAt: -1 }).limit(20);
    
    console.log(`📋 Total Users: ${allUsers.length}\n`);
    console.log('=' .repeat(80));
    
    allUsers.forEach((user, i) => {
      console.log(`\n${i + 1}. 👤 Email: ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Created: ${user.createdAt}`);
      
      if (user.walletData) {
        console.log(`   💼 Wallet:`);
        console.log(`      ERC20: ${user.walletData.erc20Address || 'NOT SET'}`);
        console.log(`      BEP20: ${user.walletData.bep20Address || 'NOT SET'}`);
        console.log(`      Balance: ${user.walletData.balance || 0} USDT`);
      } else {
        console.log(`   💼 Wallet: NOT GENERATED`);
      }
      console.log('   ' + '-'.repeat(76));
    });
    
    // Search for emails containing 'helmi'
    console.log('\n\n🔎 Searching for emails containing "helmi"...');
    const helmiUsers = await User.find({ 
      email: new RegExp('helmi', 'i') 
    });
    
    if (helmiUsers.length > 0) {
      console.log(`✅ Found ${helmiUsers.length} user(s) with "helmi" in email:`);
      helmiUsers.forEach(u => {
        console.log(`   - ${u.email}`);
      });
    } else {
      console.log('❌ No users found with "helmi" in email');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

listAllUsers();
