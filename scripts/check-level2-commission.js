#!/usr/bin/env node

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({}, { strict: false, collection: 'futurepilotcols' });
const User = mongoose.model('User', userSchema);

const commissionSchema = new mongoose.Schema({}, { strict: false, collection: 'referralcommissions' });
const ReferralCommission = mongoose.model('ReferralCommission', commissionSchema);

async function checkLevel2Commission() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const level2User = await User.findOne({ email: 'fplevel2@mailsac.com' });
    
    if (!level2User) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('📊 Level 2 User Analysis:\n');
    console.log('Email:', level2User.email);
    console.log('ID:', level2User._id.toString());
    console.log('Total Deposit: $' + (level2User.totalPersonalDeposit || 0));
    console.log('Referred By:', level2User.referredBy ? level2User.referredBy.toString() : 'None');
    console.log('');
    
    // Check conditions
    console.log('✅ Auto-fix Conditions:');
    console.log('  - Has deposit?', (level2User.totalPersonalDeposit || 0) > 0 ? '✅ YES' : '❌ NO');
    console.log('  - Has referrer?', level2User.referredBy ? '✅ YES' : '❌ NO');
    
    // Check existing commission
    const existing = await ReferralCommission.findOne({ referralUserId: level2User._id });
    console.log('  - Has commission?', existing ? '✅ YES (Will Skip)' : '❌ NO (SHOULD PROCESS)');
    console.log('');
    
    if (!existing) {
      console.log('⚠️  This user SHOULD BE PROCESSED by auto-fix cron!\n');
      
      // Find referrer chain
      console.log('📈 Referrer Chain (Who should get commission):');
      let currentId = level2User.referredBy;
      let level = 1;
      
      while (currentId && level <= 3) {
        const referrer = await User.findById(currentId).select('email membershipLevel referredBy totalEarnings');
        if (!referrer) {
          console.log(`  Level ${level}: ❌ NOT FOUND (Broken chain!)`);
          break;
        }
        
        const tier = referrer.membershipLevel || 'bronze';
        const earnings = referrer.totalEarnings || 0;
        
        console.log(`  Level ${level}: ${referrer.email}`);
        console.log(`    - Tier: ${tier}`);
        console.log(`    - Total Earnings: $${earnings}`);
        console.log(`    - Should get: $100 × ${getTierRate(tier, level)}% = $${(100 * getTierRate(tier, level) / 100).toFixed(2)}`);
        console.log('');
        
        currentId = referrer.referredBy;
        level++;
      }
    } else {
      console.log('✅ Commission already exists - No action needed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

function getTierRate(tier, level) {
  const rates = {
    bronze: { 1: 10, 2: 5, 3: 5 },
    silver: { 1: 20, 2: 5, 3: 5 },
    gold: { 1: 30, 2: 5, 3: 5 },
    platinum: { 1: 40, 2: 5, 3: 5 }
  };
  return rates[tier]?.[level] || 0;
}

checkLevel2Commission();
