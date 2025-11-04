#!/usr/bin/env node

/**
 * Check User Total Personal Deposit
 * 
 * This script checks if user's totalPersonalDeposit matches
 * the SUM of all confirmed deposit transactions.
 * 
 * Usage:
 *   node scripts/check-user-total-deposit.js [email]
 *   node scripts/check-user-total-deposit.js admin@futurepilot.pro
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({}, { 
  strict: false,
  collection: 'futurepilotcols' 
});
const User = mongoose.model('User', userSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({}, { 
  strict: false,
  collection: 'transactions' 
});
const Transaction = mongoose.model('Transaction', transactionSchema);

async function checkUserDeposit(email) {
  try {
    console.log(`\n🔍 Checking deposit for: ${email}\n`);

    // Find user
    const user = await User.findOne({ email }).lean();
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return;
    }

    console.log('👤 User Info:');
    console.log(`   - Name: ${user.name}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Membership: ${user.membershipLevel || 'bronze'}`);
    console.log(`   - Total Personal Deposit (DB): $${user.totalPersonalDeposit || 0}`);
    console.log('');

    // Calculate from transactions
    const depositTransactions = await Transaction.find({
      userId: user._id,
      type: { $in: ['deposit', undefined, null] },
      status: 'confirmed'
    }).sort({ createdAt: -1 });

    console.log(`📊 Deposit Transactions (${depositTransactions.length}):`);
    
    let calculatedTotal = 0;
    depositTransactions.forEach((tx, index) => {
      calculatedTotal += tx.amount;
      console.log(`   ${index + 1}. $${tx.amount.toFixed(2)} - ${new Date(tx.createdAt).toLocaleString()} (${tx.txHash?.slice(0, 10)}...)`);
    });

    console.log('');
    console.log('💰 Summary:');
    console.log(`   - Total Personal Deposit (DB): $${user.totalPersonalDeposit || 0}`);
    console.log(`   - Calculated from Transactions: $${calculatedTotal.toFixed(2)}`);
    
    const difference = calculatedTotal - (user.totalPersonalDeposit || 0);
    
    if (Math.abs(difference) < 0.01) {
      console.log('   - Status: ✅ MATCH');
    } else {
      console.log(`   - Difference: $${difference.toFixed(2)}`);
      console.log('   - Status: ❌ MISMATCH');
      console.log('');
      console.log('💡 Fix: Run sync script to update totalPersonalDeposit');
      console.log('   node scripts/sync-total-personal-deposit.js');
    }

    // Check tier
    console.log('');
    console.log('🎖️ Tier Analysis:');
    console.log(`   - Current Tier: ${user.membershipLevel || 'bronze'}`);
    
    let expectedTier = 'bronze';
    if (calculatedTotal >= 10000) expectedTier = 'platinum';
    else if (calculatedTotal >= 2000) expectedTier = 'gold';
    else if (calculatedTotal >= 1000) expectedTier = 'silver';
    
    console.log(`   - Expected Tier (based on $${calculatedTotal}): ${expectedTier}`);
    
    if (expectedTier !== (user.membershipLevel || 'bronze')) {
      console.log('   - Status: ⚠️ TIER MISMATCH');
      console.log(`   - Should upgrade to: ${expectedTier}`);
    } else {
      console.log('   - Status: ✅ TIER CORRECT');
    }

    // Progress to next tier
    console.log('');
    console.log('📈 Progress to Next Tier:');
    
    if (calculatedTotal >= 10000) {
      console.log('   - You are at Platinum (highest tier) 💎');
    } else if (calculatedTotal >= 2000) {
      const toPlat = 10000 - calculatedTotal;
      console.log(`   - To Platinum: $${toPlat.toFixed(2)} more (${((calculatedTotal / 10000) * 100).toFixed(1)}%)`);
    } else if (calculatedTotal >= 1000) {
      const toGold = 2000 - calculatedTotal;
      console.log(`   - To Gold: $${toGold.toFixed(2)} more (${((calculatedTotal / 2000) * 100).toFixed(1)}%)`);
    } else {
      const toSilver = 1000 - calculatedTotal;
      console.log(`   - To Silver: $${toSilver.toFixed(2)} more (${((calculatedTotal / 1000) * 100).toFixed(1)}%)`);
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = process.argv[2] || 'admin@futurepilot.pro';
    
    await checkUserDeposit(email);

    console.log('✅ Check complete\n');
    process.exit(0);
  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

main();
