#!/usr/bin/env node

/**
 * ⚠️ CRITICAL: Clean All Withdrawal Data
 * 
 * This script will DELETE ALL withdrawal-related data:
 * - All withdrawal transactions
 * - All withdrawal records (from Withdrawal collection)
 * - Reset totalWithdrawn to 0
 * 
 * USE WITH CAUTION!
 * 
 * Usage:
 *   node scripts/cleanup-all-withdrawals.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  walletData: {
    balance: { type: Number, default: 0 },
    mainnetBalance: { type: Number, default: 0 },
  },
  totalPersonalDeposit: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  totalWithdrawn: { type: Number, default: 0 },
}, { collection: 'futurepilotcols' });

const User = mongoose.model('futurepilotcol', userSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String,
  amount: Number,
  status: String,
  source: String,
  txHash: String,
  network: String,
  createdAt: Date,
}, { collection: 'transactions' });

const Transaction = mongoose.model('Transaction', transactionSchema);

// Withdrawal Schema
const withdrawalSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  status: String,
  type: String,
  walletAddress: String,
  network: String,
  txHash: String,
  createdAt: Date,
}, { collection: 'withdrawals' });

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

async function cleanupAllWithdrawals() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ========================================
    // STEP 1: Get current statistics
    // ========================================
    console.log('📊 Current Database Statistics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const totalUsers = await User.countDocuments();
    
    const withdrawalTransactions = await Transaction.countDocuments({ 
      type: 'withdrawal' 
    });
    const confirmedWithdrawals = await Transaction.countDocuments({ 
      type: 'withdrawal', 
      status: 'confirmed' 
    });

    const totalWithdrawalRecords = await Withdrawal.countDocuments();
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });
    const approvedWithdrawals = await Withdrawal.countDocuments({ status: 'approved' });
    const completedWithdrawals = await Withdrawal.countDocuments({ status: 'completed' });
    const rejectedWithdrawals = await Withdrawal.countDocuments({ status: 'rejected' });

    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalWithdrawn: { $sum: '$totalWithdrawn' },
          totalEarnings: { $sum: '$totalEarnings' },
        }
      }
    ]);

    const stats = userStats[0] || {
      totalWithdrawn: 0,
      totalEarnings: 0,
    };

    console.log(`Total Users: ${totalUsers}`);
    console.log(`\nWithdrawal Transactions:`);
    console.log(`  Total: ${withdrawalTransactions}`);
    console.log(`  Confirmed: ${confirmedWithdrawals}`);
    
    console.log(`\nWithdrawal Records:`);
    console.log(`  Total: ${totalWithdrawalRecords}`);
    console.log(`  Pending: ${pendingWithdrawals}`);
    console.log(`  Approved: ${approvedWithdrawals}`);
    console.log(`  Completed: ${completedWithdrawals}`);
    console.log(`  Rejected: ${rejectedWithdrawals}`);

    console.log(`\nUser Stats:`);
    console.log(`  Total Withdrawn: $${stats.totalWithdrawn.toFixed(2)}`);
    console.log(`  Total Earnings: $${stats.totalEarnings.toFixed(2)}`);

    // ========================================
    // STEP 2: Confirmation
    // ========================================
    console.log('\n⚠️  WARNING: This will DELETE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`❌ ${withdrawalTransactions} withdrawal transactions`);
    console.log(`❌ ${totalWithdrawalRecords} withdrawal records`);
    console.log(`❌ All totalWithdrawn values (reset to 0)`);
    console.log('\n✅ Will KEEP:');
    console.log('✓ User accounts and profiles');
    console.log('✓ User balances (not affected)');
    console.log('✓ Total earnings (not affected)');
    console.log('✓ Non-withdrawal transactions (deposits, commissions, etc.)');

    // Auto-confirm in production cleanup
    console.log('\n⏳ Starting cleanup in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // ========================================
    // STEP 3: Delete withdrawal transactions
    // ========================================
    console.log('\n🗑️  Step 1: Deleting withdrawal transactions...');
    const deleteTxResult = await Transaction.deleteMany({ type: 'withdrawal' });
    console.log(`✅ Deleted ${deleteTxResult.deletedCount} withdrawal transactions`);

    // ========================================
    // STEP 4: Delete withdrawal records
    // ========================================
    console.log('\n🗑️  Step 2: Deleting withdrawal records...');
    const deleteWithdrawalResult = await Withdrawal.deleteMany({});
    console.log(`✅ Deleted ${deleteWithdrawalResult.deletedCount} withdrawal records`);

    // ========================================
    // STEP 5: Reset totalWithdrawn
    // ========================================
    console.log('\n🔄 Step 3: Resetting totalWithdrawn...');
    const updateResult = await User.updateMany(
      {},
      {
        $set: {
          'totalWithdrawn': 0,
        }
      }
    );
    console.log(`✅ Reset totalWithdrawn for ${updateResult.modifiedCount} users`);

    // ========================================
    // STEP 6: Verification
    // ========================================
    console.log('\n✅ Step 4: Verifying cleanup...');
    
    const remainingWithdrawalTx = await Transaction.countDocuments({ type: 'withdrawal' });
    const remainingWithdrawals = await Withdrawal.countDocuments();
    const remainingStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalWithdrawn: { $sum: '$totalWithdrawn' },
        }
      }
    ]);

    const verifyStats = remainingStats[0] || { totalWithdrawn: 0 };

    console.log('\n📊 After Cleanup:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Remaining Withdrawal Transactions: ${remainingWithdrawalTx}`);
    console.log(`Remaining Withdrawal Records: ${remainingWithdrawals}`);
    console.log(`Total Withdrawn: $${verifyStats.totalWithdrawn.toFixed(2)}`);

    if (remainingWithdrawalTx === 0 && 
        remainingWithdrawals === 0 && 
        verifyStats.totalWithdrawn === 0) {
      console.log('\n✅ SUCCESS: All withdrawal data cleaned!');
    } else {
      console.log('\n⚠️  WARNING: Some data may still remain');
    }

    // ========================================
    // STEP 7: Show remaining transactions
    // ========================================
    const otherTransactions = await Transaction.countDocuments({ 
      type: { $ne: 'withdrawal' } 
    });
    console.log(`\n✅ Preserved ${otherTransactions} non-withdrawal transactions`);

    // Show transaction type breakdown
    const transactionTypes = await Transaction.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    if (transactionTypes.length > 0) {
      console.log('\nRemaining Transactions by Type:');
      transactionTypes.forEach(t => {
        const typeName = t._id || 'null';
        console.log(`  ${typeName}: ${t.count}`);
      });
    }

    console.log('\n✅ Database cleanup complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  cleanupAllWithdrawals()
    .then(() => {
      console.log('\n✅ Cleanup script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupAllWithdrawals };
