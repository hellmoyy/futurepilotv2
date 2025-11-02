require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

async function checkHelmiUser() {
  console.log('🔍 Checking Helmi User in futurepilotcols\n');
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const collection = db.collection('futurepilotcols');
    
    const user = await collection.findOne({ email: 'helmi.andito@gmail.com' });
    
    if (!user) {
      console.log('❌ USER NOT FOUND!');
      return;
    }
    
    console.log('✅ USER FOUND!\n');
    console.log('=' .repeat(80));
    console.log('\n📋 User Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   ID: ${user._id}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Updated: ${user.updatedAt}`);
    
    if (!user.walletData) {
      console.log('\n⚠️  NO WALLET DATA!\n');
      return;
    }
    
    console.log('\n💼 Wallet Data:');
    console.log(`   ERC20 Address: ${user.walletData.erc20Address || 'NOT SET'}`);
    console.log(`   BEP20 Address: ${user.walletData.bep20Address || 'NOT SET'}`);
    console.log(`   Balance: ${user.walletData.balance || 0} USDT`);
    
    console.log('\n🎯 Checking against deposit wallet...');
    const depositWallet = '0x41C7aAF4c414C8bcF5A09684A0449A9188558AC7';
    console.log(`   Deposit made to: ${depositWallet}`);
    
    if (user.walletData.erc20Address?.toLowerCase() === depositWallet.toLowerCase()) {
      console.log('   ✅ MATCHES ERC20 address!');
    } else if (user.walletData.bep20Address?.toLowerCase() === depositWallet.toLowerCase()) {
      console.log('   ✅ MATCHES BEP20 address!');
    } else {
      console.log('   ❌ Does NOT match either address');
      console.log(`      User's ERC20: ${user.walletData.erc20Address}`);
      console.log(`      User's BEP20: ${user.walletData.bep20Address}`);
    }
    
    // Check transactions for this user
    console.log('\n📨 Checking transactions...');
    const transactions = await db.collection('transactions').find({ 
      userId: user._id 
    }).toArray();
    
    console.log(`   Found ${transactions.length} transaction(s)`);
    
    if (transactions.length > 0) {
      console.log('\n   Transaction Details:');
      transactions.forEach((tx, i) => {
        console.log(`\n   ${i + 1}. Network: ${tx.network}`);
        console.log(`      Amount: ${tx.amount} USDT`);
        console.log(`      Status: ${tx.status}`);
        console.log(`      TxHash: ${tx.txHash}`);
        console.log(`      Created: ${tx.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

checkHelmiUser();
