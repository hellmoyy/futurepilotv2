/**
 * Check User Balances
 * Debug script to see actual balance distribution
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function checkBalances() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.connection.collection('futurepilotcol');
    
    // Get all users
    const users = await User.find({}).toArray();
    
    console.log('📊 All users with balances:');
    let totalRootBalance = 0;
    let totalWalletBalance = 0;
    let totalMainnetBalance = 0;
    
    users.forEach(u => {
      const rootBal = u.balance || 0;
      const walletBal = u.walletData?.balance || 0;
      const mainnetBal = u.walletData?.mainnetBalance || 0;
      
      totalRootBalance += rootBal;
      totalWalletBalance += walletBal;
      totalMainnetBalance += mainnetBal;
      
      if (rootBal > 0 || walletBal > 0 || mainnetBal > 0) {
        console.log(`\n${u.email}:`);
        if (rootBal > 0) console.log(`  - Root balance: $${rootBal}`);
        if (walletBal > 0) console.log(`  - Wallet balance (testnet): $${walletBal}`);
        if (mainnetBal > 0) console.log(`  - Mainnet balance: $${mainnetBal}`);
      }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('📈 Summary:');
    console.log(`  Root Balance Total: $${totalRootBalance.toFixed(2)}`);
    console.log(`  Wallet Balance (Testnet): $${totalWalletBalance.toFixed(2)}`);
    console.log(`  Mainnet Balance: $${totalMainnetBalance.toFixed(2)}`);
    console.log(`  Network Mode: ${process.env.NETWORK_MODE}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkBalances();
