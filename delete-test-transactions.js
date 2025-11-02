/**
 * Delete Test User Transactions
 * Removes all transactions from test@futurepilot.pro
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function deleteTestTransactions() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get collections
    const User = mongoose.connection.collection('futurepilotcol');
    const Transaction = mongoose.connection.collection('transactions');

    // Try to find test user by email
    let testUser = await User.findOne({ email: 'test@futurepilot.pro' });
    
    if (!testUser) {
      console.log('⚠️  Test user (test@futurepilot.pro) not found in database');
      console.log('Looking for test transactions by pattern...\n');
      
      // Find transactions with dummy txHash patterns
      const testTransactions = await Transaction.find({
        $or: [
          { txHash: /^0x1111222233334444/ },
          { txHash: /^0xfedcbafedcba/ },
          { amount: 300, status: 'failed' },
          { amount: 75 },
          { amount: 50.25 },
          { amount: 250.75 },
          { amount: 100.5 }
        ]
      }).toArray();

      if (testTransactions.length === 0) {
        console.log('✅ No test transactions found');
        process.exit(0);
      }

      console.log(`📊 Found ${testTransactions.length} test transactions by pattern`);
      console.log('\n📋 Test transactions to be deleted:');
      testTransactions.forEach((tx, index) => {
        console.log(`   ${index + 1}. ${tx.network} - $${tx.amount} - ${tx.status} - ${tx.txHash.substring(0, 20)}...`);
      });

      // Delete by txHash
      const txHashes = testTransactions.map(tx => tx.txHash);
      const deleteResult = await Transaction.deleteMany({ 
        txHash: { $in: txHashes }
      });

      console.log(`\n✅ Deleted ${deleteResult.deletedCount} test transactions`);
      console.log('🎉 Test transactions removed successfully!');
      
    } else {
      console.log(`\n✅ Found test user: ${testUser.name} (${testUser.email})`);
      console.log(`   User ID: ${testUser._id}`);

      // Count transactions for test user
      const transactionCount = await Transaction.countDocuments({ 
        userId: testUser._id 
      });

      console.log(`\n📊 Found ${transactionCount} transactions for test user`);

      if (transactionCount === 0) {
        console.log('✅ No transactions to delete');
        process.exit(0);
      }

      // Show transactions before deleting
      const transactions = await Transaction.find({ userId: testUser._id }).toArray();
      console.log('\n📋 Transactions to be deleted:');
      transactions.forEach((tx, index) => {
        console.log(`   ${index + 1}. ${tx.network} - $${tx.amount} - ${tx.status} - ${new Date(tx.createdAt).toLocaleString()}`);
      });

      // Delete all transactions
      const deleteResult = await Transaction.deleteMany({ 
        userId: testUser._id 
      });

      console.log(`\n✅ Deleted ${deleteResult.deletedCount} transactions`);
      console.log('🎉 Test user transactions removed successfully!');
    }

  } catch (error) {
    console.error('❌ Error deleting test transactions:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the deletion
deleteTestTransactions();
