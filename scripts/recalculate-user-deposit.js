#!/usr/bin/env node

/**
 * Recalculate totalPersonalDeposit for a specific user
 * 
 * This script calculates the SUM of all confirmed deposit transactions
 * and updates the user's totalPersonalDeposit field.
 * 
 * Usage:
 *   node scripts/recalculate-user-deposit.js <email>
 *   node scripts/recalculate-user-deposit.js admin@futurepilot.pro
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

// Define schemas
const userSchema = new mongoose.Schema({}, { strict: false, collection: 'futurepilotcols' });
const transactionSchema = new mongoose.Schema({}, { strict: false, collection: 'transactions' });

const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

async function recalculateUserDeposit(email) {
  try {
    console.log('🔄 Connecting to MongoDB...\n');
    await mongoose.connect(MONGODB_URI);

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || 'N/A'} (${user.email})`);
    console.log(`   Current totalPersonalDeposit: $${user.totalPersonalDeposit || 0}\n`);

    // Calculate SUM of all confirmed deposits
    const depositSum = await Transaction.aggregate([
      {
        $match: {
          userId: user._id,
          type: { $in: ['deposit', undefined] }, // Include undefined for old records
          status: 'confirmed',
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const calculatedTotal = depositSum.length > 0 ? depositSum[0].total : 0;

    console.log('📊 Calculation Result:');
    console.log(`   SUM of confirmed deposits: $${calculatedTotal}`);
    console.log(`   Difference: $${(calculatedTotal - (user.totalPersonalDeposit || 0)).toFixed(2)}\n`);

    // Get all deposits for detail
    const deposits = await Transaction.find({
      userId: user._id,
      type: { $in: ['deposit', undefined] },
      status: 'confirmed',
    }).select('amount createdAt txHash type').sort({ createdAt: -1 });

    if (deposits.length > 0) {
      console.log(`📋 Deposit History (${deposits.length} transactions):`);
      deposits.forEach((dep, index) => {
        const date = new Date(dep.createdAt).toLocaleString();
        const txHash = dep.txHash ? dep.txHash.substring(0, 10) + '...' : 'N/A';
        console.log(`   ${index + 1}. $${dep.amount.toFixed(2)} - ${date} - ${txHash}`);
      });
      console.log('');
    }

    // Calculate tier based on new total
    let newTier = 'bronze';
    if (calculatedTotal >= 10000) {
      newTier = 'platinum';
    } else if (calculatedTotal >= 2000) {
      newTier = 'gold';
    } else if (calculatedTotal >= 1000) {
      newTier = 'silver';
    }

    console.log('🎖️  Tier Information:');
    console.log(`   Current tier: ${user.membershipLevel || 'bronze'}`);
    console.log(`   Calculated tier: ${newTier}`);
    console.log(`   Should update: ${!user.tierSetManually && newTier !== user.membershipLevel ? '✅ YES' : '❌ NO'}\n`);

    // Update user
    const updateData = { totalPersonalDeposit: calculatedTotal };
    if (!user.tierSetManually && newTier !== user.membershipLevel) {
      updateData.membershipLevel = newTier;
    }

    await User.findByIdAndUpdate(user._id, { $set: updateData });

    console.log('✅ User updated successfully!');
    console.log(`   New totalPersonalDeposit: $${calculatedTotal}`);
    if (updateData.membershipLevel) {
      console.log(`   New membershipLevel: ${updateData.membershipLevel}`);
    }
    console.log('');

    console.log('🎯 Next Steps:');
    console.log('   1. User should refresh https://futurepilot.pro/referral');
    console.log('   2. Membership progress should update automatically');
    console.log('   3. Tier upgrade will trigger if threshold reached\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

// Main
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/recalculate-user-deposit.js <email>');
  console.log('Example: node scripts/recalculate-user-deposit.js admin@futurepilot.pro');
  process.exit(1);
}

recalculateUserDeposit(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
