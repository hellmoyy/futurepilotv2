/**
 * Script to monitor and detect deposits without referral commissions
 * Run this regularly to ensure commission system is working correctly
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  totalEarnings: { type: Number, default: 0 },
  totalPersonalDeposit: { type: Number, default: 0 },
  referredBy: mongoose.Schema.Types.ObjectId,
}, { collection: 'futurepilotcols' });

const transactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String,
  amount: Number,
  status: String,
  createdAt: Date,
}, { collection: 'transactions' });

const referralCommissionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  referralUserId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  createdAt: Date,
}, { collection: 'referralcommissions' });

const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', userSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
const ReferralCommission = mongoose.models.ReferralCommission || mongoose.model('ReferralCommission', referralCommissionSchema);

async function monitorCommissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('🔍 Monitoring Referral Commission System...\n');

    // Get all referred users with deposits
    const referredUsers = await User.find({
      referredBy: { $exists: true, $ne: null }
    }).select('email name totalPersonalDeposit referredBy');

    console.log(`📊 Total Referred Users: ${referredUsers.length}\n`);

    // Find deposits without commissions
    const usersWithoutCommissions = [];

    for (const user of referredUsers) {
      // Get deposit transactions
      const deposits = await Transaction.find({
        userId: user._id,
        $or: [
          { type: 'deposit', status: 'confirmed' },
          { type: { $in: [null, undefined] }, status: 'confirmed' }
        ]
      });

      if (deposits.length === 0) continue; // Skip users with no deposits

      // Check if commission exists
      const commissions = await ReferralCommission.find({
        referralUserId: user._id
      });

      if (commissions.length === 0) {
        const totalDeposit = deposits.reduce((sum, tx) => sum + tx.amount, 0);
        const referrer = await User.findById(user.referredBy).select('email name');
        
        usersWithoutCommissions.push({
          user: user.email,
          referrer: referrer?.email || 'Unknown',
          totalDeposit: totalDeposit,
          depositCount: deposits.length,
          latestDeposit: deposits[deposits.length - 1].createdAt
        });
      }
    }

    if (usersWithoutCommissions.length > 0) {
      console.log('⚠️  ALERT: Found deposits without commissions!\n');
      console.log(`Total Issues: ${usersWithoutCommissions.length}\n`);

      usersWithoutCommissions.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.user}`);
        console.log(`   Referrer: ${issue.referrer}`);
        console.log(`   Total Deposit: $${issue.totalDeposit.toFixed(2)}`);
        console.log(`   Deposit Count: ${issue.depositCount}`);
        console.log(`   Latest: ${issue.latestDeposit}`);
        console.log('');
      });

      console.log('💡 Action Required:');
      console.log('   Run: node scripts/backfill-referral-commissions.js');
      console.log('   Or investigate why commission system failed\n');

    } else {
      console.log('✅ All deposits have corresponding commissions!\n');
    }

    // Statistics
    const totalCommissions = await ReferralCommission.countDocuments();
    const totalCommissionAmount = await ReferralCommission.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    console.log('📊 Commission System Statistics:');
    console.log(`   Total Commission Records: ${totalCommissions}`);
    console.log(`   Total Commissions Paid: $${(totalCommissionAmount[0]?.total || 0).toFixed(2)}`);
    console.log(`   Referred Users with Deposits: ${referredUsers.filter(u => u.totalPersonalDeposit > 0).length}`);
    console.log('');

    // Recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentCommissions = await ReferralCommission.find({
      createdAt: { $gte: yesterday }
    });

    console.log('📅 Recent Activity (Last 24 Hours):');
    console.log(`   New Commissions: ${recentCommissions.length}`);
    
    if (recentCommissions.length > 0) {
      const recentAmount = recentCommissions.reduce((sum, c) => sum + c.amount, 0);
      console.log(`   Amount Distributed: $${recentAmount.toFixed(2)}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Monitoring Complete');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run monitoring
monitorCommissions();
