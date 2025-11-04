#!/usr/bin/env node

/**
 * Fix Wrong referralUserId in Commission Records
 * 
 * Problem: Some commission records have wrong referralUserId
 * (using intermediate referrer ID instead of original deposit user ID)
 * 
 * Solution: Delete wrong records and recreate with correct referralUserId
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({}, { strict: false, collection: 'futurepilotcols' });
const User = mongoose.model('User', userSchema);

const commissionSchema = new mongoose.Schema({}, { strict: false, collection: 'referralcommissions' });
const ReferralCommission = mongoose.model('ReferralCommission', commissionSchema);

async function fixCommissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Helmi
    const helmi = await User.findOne({ email: 'helmi.andito@gmail.com' });
    const level1User = await User.findOne({ email: 'fplevel1@mailsac.com' });
    const level2User = await User.findOne({ email: 'fplevel2@mailsac.com' });

    console.log('📊 Current Commission Records for Helmi:\n');
    
    const currentCommissions = await ReferralCommission.find({ userId: helmi._id });
    for (const c of currentCommissions) {
      const refUser = await User.findById(c.referralUserId);
      console.log(`Amount: $${c.amount}`);
      console.log(`  Level: ${c.level}`);
      console.log(`  referralUserId: ${c.referralUserId} (${refUser.email})`);
      console.log('');
    }

    // Delete WRONG commission (Level 2 with wrong referralUserId)
    console.log('🗑️  Deleting wrong commission record...\n');
    
    const wrongCommission = await ReferralCommission.findOne({
      userId: helmi._id,
      level: 2,
      amount: 5,
      referralUserId: level1User._id // This is WRONG!
    });

    if (wrongCommission) {
      await wrongCommission.deleteOne();
      console.log('✅ Deleted wrong commission record');
      
      // Deduct from totalEarnings
      helmi.totalEarnings = (helmi.totalEarnings || 0) - 5;
      await helmi.save();
      console.log('✅ Updated Helmi totalEarnings: $' + helmi.totalEarnings);
    } else {
      console.log('⚠️  Wrong commission not found (maybe already deleted)');
    }

    console.log('');

    // Create CORRECT commission
    console.log('✅ Creating correct commission record...\n');
    
    const correctCommission = new ReferralCommission({
      userId: helmi._id,
      referralUserId: level2User._id, // ✅ CORRECT: Use level2 user ID
      amount: 5,
      level: 2,
      depositAmount: 100,
      commissionRate: 5,
      source: 'manual_fix',
      createdAt: new Date(),
    });
    await correctCommission.save();
    console.log('✅ Created correct commission record');

    // Add back to totalEarnings
    helmi.totalEarnings = (helmi.totalEarnings || 0) + 5;
    await helmi.save();
    console.log('✅ Updated Helmi totalEarnings: $' + helmi.totalEarnings);

    console.log('');
    console.log('📊 New Commission Records for Helmi:\n');
    
    const newCommissions = await ReferralCommission.find({ userId: helmi._id });
    for (const c of newCommissions) {
      const refUser = await User.findById(c.referralUserId);
      console.log(`Amount: $${c.amount}`);
      console.log(`  Level: ${c.level}`);
      console.log(`  referralUserId: ${c.referralUserId} (${refUser.email})`);
      console.log('');
    }

    console.log('✅ Fix complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixCommissions();
