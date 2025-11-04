/**
 * Check ReferralCommission Status Distribution
 * 
 * Purpose: Check how many commissions exist and their status
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const referralCommissionSchema = new mongoose.Schema({}, { strict: false, collection: 'referralcommissions' });
const ReferralCommission = mongoose.models.referralcommissions || mongoose.model('referralcommissions', referralCommissionSchema);

async function checkCommissionStatus() {
  try {
    console.log('🔍 Checking ReferralCommission Status...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Total records
    const totalCommissions = await ReferralCommission.countDocuments();
    console.log(`📊 Total ReferralCommission Records: ${totalCommissions}\n`);

    if (totalCommissions === 0) {
      console.log('⚠️  No ReferralCommission records found!');
      console.log('This means:');
      console.log('  1. No referral commissions have been generated yet');
      console.log('  2. Gas fee topup detection may not be creating commissions');
      console.log('  3. Check /api/user/balance endpoint (deposit detection)');
      await mongoose.disconnect();
      return;
    }

    // Status breakdown
    const statusBreakdown = await ReferralCommission.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        }
      }
    ]);

    console.log('Status Breakdown:');
    console.log('=' .repeat(60));
    statusBreakdown.forEach(status => {
      const statusName = status._id ? status._id.toUpperCase() : 'NULL';
      console.log(`${statusName}: ${status.count} records, Total: $${status.totalAmount.toFixed(2)}`);
    });
    console.log();

    // Level breakdown
    const levelBreakdown = await ReferralCommission.aggregate([
      {
        $group: {
          _id: '$referralLevel',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    console.log('Level Breakdown:');
    console.log('=' .repeat(60));
    levelBreakdown.forEach(level => {
      console.log(`Level ${level._id}: ${level.count} records, Total: $${level.totalAmount.toFixed(2)}`);
    });
    console.log();

    // Source breakdown
    const sourceBreakdown = await ReferralCommission.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        }
      }
    ]);

    console.log('Source Breakdown:');
    console.log('=' .repeat(60));
    sourceBreakdown.forEach(source => {
      console.log(`${source._id}: ${source.count} records, Total: $${source.totalAmount.toFixed(2)}`);
    });
    console.log();

    // Recent commissions (last 10)
    const recentCommissions = await ReferralCommission.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log('Recent Commissions (Last 10):');
    console.log('=' .repeat(60));
    for (const commission of recentCommissions) {
      console.log(`Amount: $${commission.amount.toFixed(2)} | Status: ${commission.status} | Level: ${commission.referralLevel} | Source: ${commission.source} | Date: ${new Date(commission.createdAt).toLocaleDateString()}`);
    }
    console.log();

    // Pending commissions
    const pendingCount = await ReferralCommission.countDocuments({ status: 'pending' });
    if (pendingCount > 0) {
      console.log(`⚠️  Found ${pendingCount} PENDING commissions!`);
      console.log('These should be automatically set to "paid" when created.');
      console.log('Check /lib/referralCommission.ts → calculateReferralCommission()');
      console.log('Status should be set to "paid" by default for gas_fee_topup commissions.');
    }

    console.log('\n✅ Check Complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkCommissionStatus();
