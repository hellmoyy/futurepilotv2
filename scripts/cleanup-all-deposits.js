#!/usr/bin/env node

/**
 * ⚠️ CRITICAL: Clean All Deposit Data
 * 
 * This script will DELETE ALL deposit-related data:
 * - All deposit transactions
 * - All user balances (mainnet + testnet)
 * - All gas fee balances
 * 
 * USE WITH CAUTION!
 * 
 * Usage:
 *   node scripts/cleanup-all-deposits.js
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
    erc20Address: String,
    bep20Address: String,
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

async function cleanupAllDeposits() {
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
    const usersWithBalance = await User.countDocuments({
      $or: [
        { 'walletData.balance': { $gt: 0 } },
        { 'walletData.mainnetBalance': { $gt: 0 } }
      ]
    });

    const totalDeposits = await Transaction.countDocuments({ type: 'deposit' });
    const confirmedDeposits = await Transaction.countDocuments({ 
      type: 'deposit', 
      status: 'confirmed' 
    });

    const balanceStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalTestnetBalance: { $sum: '$walletData.balance' },
          totalMainnetBalance: { $sum: '$walletData.mainnetBalance' },
          totalPersonalDeposit: { $sum: '$totalPersonalDeposit' },
          totalEarnings: { $sum: '$totalEarnings' },
        }
      }
    ]);

    const stats = balanceStats[0] || {
      totalTestnetBalance: 0,
      totalMainnetBalance: 0,
      totalPersonalDeposit: 0,
      totalEarnings: 0,
    };

    console.log(`Total Users: ${totalUsers}`);
    console.log(`Users with Balance: ${usersWithBalance}`);
    console.log(`Total Deposit Transactions: ${totalDeposits}`);
    console.log(`Confirmed Deposits: ${confirmedDeposits}`);
    console.log(`\nBalance Summary:`);
    console.log(`  Testnet Balance: $${stats.totalTestnetBalance.toFixed(2)}`);
    console.log(`  Mainnet Balance: $${stats.totalMainnetBalance.toFixed(2)}`);
    console.log(`  Total Personal Deposits: $${stats.totalPersonalDeposit.toFixed(2)}`);
    console.log(`  Total Earnings: $${stats.totalEarnings.toFixed(2)}`);

    // ========================================
    // STEP 2: Confirmation
    // ========================================
    console.log('\n⚠️  WARNING: This will DELETE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`❌ ${totalDeposits} deposit transactions`);
    console.log(`❌ All user balances (testnet + mainnet)`);
    console.log(`❌ All totalPersonalDeposit values`);
    console.log(`❌ Gas fee balances will be reset to 0`);
    console.log('\n✅ Will KEEP:');
    console.log('✓ User accounts and profiles');
    console.log('✓ Referral structure');
    console.log('✓ Non-deposit transactions (withdrawals, commissions)');
    console.log('✓ Wallet addresses (ERC20/BEP20)');

    // Auto-confirm in production cleanup
    console.log('\n⏳ Starting cleanup in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // ========================================
    // STEP 3: Delete deposit transactions
    // ========================================
    console.log('\n🗑️  Step 1: Deleting deposit transactions...');
    const deleteResult = await Transaction.deleteMany({ type: 'deposit' });
    console.log(`✅ Deleted ${deleteResult.deletedCount} deposit transactions`);

    // ========================================
    // STEP 4: Reset user balances
    // ========================================
    console.log('\n🔄 Step 2: Resetting user balances...');
    const updateResult = await User.updateMany(
      {},
      {
        $set: {
          'walletData.balance': 0,
          'walletData.mainnetBalance': 0,
          'totalPersonalDeposit': 0,
        }
      }
    );
    console.log(`✅ Reset balances for ${updateResult.modifiedCount} users`);

    // ========================================
    // STEP 5: Verification
    // ========================================
    console.log('\n✅ Step 3: Verifying cleanup...');
    
    const remainingDeposits = await Transaction.countDocuments({ type: 'deposit' });
    const remainingBalance = await User.aggregate([
      {
        $group: {
          _id: null,
          totalTestnetBalance: { $sum: '$walletData.balance' },
          totalMainnetBalance: { $sum: '$walletData.mainnetBalance' },
          totalPersonalDeposit: { $sum: '$totalPersonalDeposit' },
        }
      }
    ]);

    const verifyStats = remainingBalance[0] || {
      totalTestnetBalance: 0,
      totalMainnetBalance: 0,
      totalPersonalDeposit: 0,
    };

    console.log('\n📊 After Cleanup:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Remaining Deposits: ${remainingDeposits}`);
    console.log(`Testnet Balance: $${verifyStats.totalTestnetBalance.toFixed(2)}`);
    console.log(`Mainnet Balance: $${verifyStats.totalMainnetBalance.toFixed(2)}`);
    console.log(`Total Personal Deposits: $${verifyStats.totalPersonalDeposit.toFixed(2)}`);

    if (remainingDeposits === 0 && 
        verifyStats.totalTestnetBalance === 0 && 
        verifyStats.totalMainnetBalance === 0 &&
        verifyStats.totalPersonalDeposit === 0) {
      console.log('\n✅ SUCCESS: All deposit data cleaned!');
    } else {
      console.log('\n⚠️  WARNING: Some data may still remain');
    }

    // ========================================
    // STEP 6: Keep other transactions
    // ========================================
    const otherTransactions = await Transaction.countDocuments({ 
      type: { $ne: 'deposit' } 
    });
    console.log(`\n✅ Preserved ${otherTransactions} non-deposit transactions`);

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
        console.log(`  ${t._id}: ${t.count}`);
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
  cleanupAllDeposits()
    .then(() => {
      console.log('\n✅ Cleanup script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupAllDeposits };
