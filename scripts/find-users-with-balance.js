/**
 * Find Users with Balance
 * Search for users that have balance causing $836.25 total
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function findUsersWithBalance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.connection.collection('futurepilotcol');
    const networkMode = process.env.NETWORK_MODE || 'testnet';
    
    console.log(`🔍 Searching for users with balance (Network: ${networkMode})\n`);
    
    // Get all users and check all possible balance fields
    const users = await User.find({}).toArray();
    
    let totalFound = 0;
    const usersWithBalance = [];
    
    users.forEach(user => {
      const balances = {
        root: user.balance || 0,
        walletBalance: user.walletData?.balance || 0,
        mainnetBalance: user.walletData?.mainnetBalance || 0,
      };
      
      const hasAnyBalance = balances.root > 0 || balances.walletBalance > 0 || balances.mainnetBalance > 0;
      
      if (hasAnyBalance) {
        totalFound += (networkMode === 'mainnet' ? balances.mainnetBalance : balances.walletBalance);
        usersWithBalance.push({
          email: user.email,
          name: user.name,
          ...balances
        });
      }
    });
    
    console.log(`📊 Found ${usersWithBalance.length} users with balance:\n`);
    
    usersWithBalance.forEach(u => {
      console.log(`${u.email} (${u.name})`);
      if (u.root > 0) console.log(`  - Root balance: $${u.root}`);
      if (u.walletBalance > 0) console.log(`  - Wallet testnet: $${u.walletBalance}`);
      if (u.mainnetBalance > 0) console.log(`  - Wallet mainnet: $${u.mainnetBalance}`);
      console.log('');
    });
    
    console.log('='.repeat(60));
    console.log(`💰 Total Balance Found: $${totalFound.toFixed(2)}`);
    console.log(`📍 Network Mode: ${networkMode}`);
    console.log(`🎯 Expected from API: $836.25`);
    console.log('='.repeat(60));
    
    // Now do the exact same aggregation as API
    console.log('\n🔬 Testing API aggregation:\n');
    
    const balanceAggregate = await User.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { 
            $sum: networkMode === 'mainnet' ? '$walletData.mainnetBalance' : '$walletData.balance'
          },
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    console.log('Aggregation result:', JSON.stringify(balanceAggregate, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findUsersWithBalance();
