/**
 * Debug Balance Aggregate
 * Check what MongoDB aggregation returns
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function debugAggregation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.connection.collection('futurepilotcol');
    const networkMode = process.env.NETWORK_MODE || 'testnet';
    
    console.log(`Network Mode: ${networkMode}\n`);
    
    // Test aggregation
    const result = await User.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { 
            $sum: networkMode === 'mainnet' ? '$walletData.mainnetBalance' : '$walletData.balance'
          },
          totalRootBalance: { $sum: '$balance' },
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    console.log('Aggregation Result:');
    console.log(JSON.stringify(result, null, 2));
    
    // Also check individual users
    const usersWithBalance = await User.find({
      $or: [
        { balance: { $gt: 0 } },
        { 'walletData.balance': { $gt: 0 } },
        { 'walletData.mainnetBalance': { $gt: 0 } }
      ]
    }).toArray();
    
    console.log(`\n📊 Users with non-zero balance: ${usersWithBalance.length}`);
    usersWithBalance.forEach(u => {
      console.log(`  - ${u.email}: root=$${u.balance || 0}, wallet=$${u.walletData?.balance || 0}, mainnet=$${u.walletData?.mainnetBalance || 0}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugAggregation();
