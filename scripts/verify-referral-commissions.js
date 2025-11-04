/**
 * Verification Script: Referral Commission Data Accuracy
 * 
 * Purpose: Verify that the admin referrals page displays accurate commission data
 * from the ReferralCommission collection, not from user.totalEarnings
 * 
 * Usage: node scripts/verify-referral-commissions.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

// Import models
const userSchema = new mongoose.Schema({}, { strict: false, collection: 'futurepilotcols' });
const User = mongoose.models.futurepilotcols || mongoose.model('futurepilotcols', userSchema);

const referralCommissionSchema = new mongoose.Schema({}, { strict: false, collection: 'referralcommissions' });
const ReferralCommission = mongoose.models.referralcommissions || mongoose.model('referralcommissions', referralCommissionSchema);

async function verifyReferralCommissions() {
  try {
    console.log('🔍 Verifying Referral Commission Data...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Get all users with referrals
    const referredUsers = await User.find({ referredBy: { $exists: true, $ne: null } })
      .select('name email totalEarnings referredBy')
      .lean();
    
    console.log(`📊 Total Referred Users: ${referredUsers.length}\n`);

    // 2. Get all referrers
    const referrerIds = referredUsers.map(u => u.referredBy).filter(Boolean);
    const referrers = await User.find({ _id: { $in: referrerIds } })
      .select('name email referralCode')
      .lean();
    
    const referrerMap = new Map(
      referrers.map(r => [r._id.toString(), r])
    );

    console.log(`👥 Total Referrers: ${referrers.length}\n`);

    // 3. Get actual commission data (PAID only)
    const commissionsByReferredUser = await ReferralCommission.aggregate([
      {
        $match: {
          status: 'paid',
          referralLevel: 1, // Level 1 only
        }
      },
      {
        $group: {
          _id: '$referralUserId',
          totalCommission: { $sum: '$amount' },
          count: { $sum: 1 },
        }
      }
    ]);

    const commissionMap = new Map(
      commissionsByReferredUser.map(c => [c._id.toString(), c])
    );

    console.log(`💰 Total Commission Records (Paid, Level 1): ${commissionsByReferredUser.length}\n`);

    // 4. Compare: OLD METHOD vs NEW METHOD
    console.log('=' .repeat(80));
    console.log('COMPARISON: OLD METHOD (user.totalEarnings * 0.1) vs NEW METHOD (ReferralCommission)');
    console.log('=' .repeat(80));
    console.log();

    let totalOldMethod = 0;
    let totalNewMethod = 0;
    let discrepancyCount = 0;

    for (const user of referredUsers) {
      const referrer = referrerMap.get(user.referredBy?.toString());
      const commission = commissionMap.get(user._id.toString());
      
      const oldMethodEarnings = (user.totalEarnings || 0) * 0.1; // OLD: 10% flat
      const newMethodEarnings = commission?.totalCommission || 0; // NEW: Actual from ReferralCommission
      
      totalOldMethod += oldMethodEarnings;
      totalNewMethod += newMethodEarnings;

      if (Math.abs(oldMethodEarnings - newMethodEarnings) > 0.01) {
        discrepancyCount++;
        
        if (discrepancyCount <= 10) { // Show first 10 discrepancies
          console.log(`Referred: ${user.name} (${user.email})`);
          console.log(`  Referrer: ${referrer?.name || 'Unknown'}`);
          console.log(`  User Total Earnings: $${(user.totalEarnings || 0).toFixed(2)}`);
          console.log(`  ❌ OLD METHOD (10% of user earnings): $${oldMethodEarnings.toFixed(2)}`);
          console.log(`  ✅ NEW METHOD (actual paid commissions): $${newMethodEarnings.toFixed(2)}`);
          console.log(`  📊 Difference: $${(newMethodEarnings - oldMethodEarnings).toFixed(2)}`);
          console.log();
        }
      }
    }

    console.log('=' .repeat(80));
    console.log('SUMMARY');
    console.log('=' .repeat(80));
    console.log(`Total Commission (OLD METHOD - 10% flat): $${totalOldMethod.toFixed(2)}`);
    console.log(`Total Commission (NEW METHOD - ReferralCommission): $${totalNewMethod.toFixed(2)}`);
    console.log(`Difference: $${(totalNewMethod - totalOldMethod).toFixed(2)}`);
    console.log(`Discrepancies Found: ${discrepancyCount} / ${referredUsers.length}`);
    console.log();

    // 5. Verify Top Referrers Data
    console.log('=' .repeat(80));
    console.log('TOP REFERRERS VERIFICATION');
    console.log('=' .repeat(80));
    console.log();

    const commissionsByReferrer = await ReferralCommission.aggregate([
      {
        $match: {
          status: 'paid',
        }
      },
      {
        $group: {
          _id: '$userId',
          totalEarnings: { $sum: '$amount' },
          commissionCount: { $sum: 1 },
        }
      },
      {
        $sort: { totalEarnings: -1 }
      },
      {
        $limit: 5
      }
    ]);

    for (const referrerCommission of commissionsByReferrer) {
      const referrer = await User.findById(referrerCommission._id).lean();
      
      // Count referrals
      const referralCount = await User.countDocuments({ referredBy: referrerCommission._id });
      
      console.log(`Referrer: ${referrer?.name || 'Unknown'} (${referrer?.email || 'Unknown'})`);
      console.log(`  Total Referrals: ${referralCount}`);
      console.log(`  Total Commission Earned: $${referrerCommission.totalEarnings.toFixed(2)}`);
      console.log(`  Avg per Referral: $${(referrerCommission.totalEarnings / referralCount).toFixed(2)}`);
      console.log();
    }

    console.log('✅ Verification Complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

verifyReferralCommissions();
