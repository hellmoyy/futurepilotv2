/**
 * Script to check referral commission records
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  totalEarnings: { type: Number, default: 0 },
  totalPersonalDeposit: { type: Number, default: 0 },
  referralCode: String,
  referredBy: mongoose.Schema.Types.ObjectId,
}, { collection: 'futurepilotcols' });

const referralCommissionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  referralUserId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  level: Number,
  depositAmount: Number,
  commissionRate: Number,
  createdAt: Date,
}, { collection: 'referralcommissions' });

const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', userSchema);
const ReferralCommission = mongoose.models.ReferralCommission || mongoose.model('ReferralCommission', referralCommissionSchema);

async function checkCommissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all referral commissions
    const commissions = await ReferralCommission.find({}).sort({ createdAt: -1 });
    
    console.log(`📊 Total Referral Commissions: ${commissions.length}\n`);

    if (commissions.length === 0) {
      console.log('⚠️  No referral commission records found!\n');
      console.log('Possible reasons:');
      console.log('1. No deposits have been made by referred users yet');
      console.log('2. Commission distribution system not triggered');
      console.log('3. Need to manually trigger commission for existing deposits\n');
      
      // Check if there are users with deposits
      const usersWithDeposits = await User.find({ 
        totalPersonalDeposit: { $gt: 0 },
        referredBy: { $exists: true, $ne: null }
      }).select('email name totalPersonalDeposit referredBy');
      
      console.log(`👥 Referred users with deposits: ${usersWithDeposits.length}\n`);
      
      if (usersWithDeposits.length > 0) {
        console.log('💡 These users have deposits but no commissions distributed:\n');
        for (const user of usersWithDeposits) {
          const referrer = await User.findById(user.referredBy).select('email name');
          console.log(`   - ${user.email}: $${user.totalPersonalDeposit || 0}`);
          console.log(`     Referrer: ${referrer?.email || 'Unknown'}\n`);
        }
      }
      
    } else {
      console.log('📋 Commission Records:\n');
      
      for (const comm of commissions) {
        const user = await User.findById(comm.userId).select('email name');
        const referralUser = await User.findById(comm.referralUserId).select('email name');
        
        console.log(`Amount: $${comm.amount.toFixed(2)}`);
        console.log(`Level: ${comm.level}`);
        console.log(`Rate: ${comm.commissionRate}%`);
        console.log(`From Deposit: $${comm.depositAmount || 0}`);
        console.log(`Earned by: ${user?.email || 'Unknown'} (${user?.name || 'N/A'})`);
        console.log(`From: ${referralUser?.email || 'Unknown'} (${referralUser?.name || 'N/A'})`);
        console.log(`Date: ${comm.createdAt}\n`);
      }
      
      // Summary by user
      const userCommissions = {};
      
      for (const comm of commissions) {
        const userId = comm.userId.toString();
        if (!userCommissions[userId]) {
          const user = await User.findById(comm.userId).select('email name totalEarnings');
          userCommissions[userId] = {
            email: user?.email || 'Unknown',
            name: user?.name || 'Unknown',
            totalFromCommissions: 0,
            totalEarningsInDB: user?.totalEarnings || 0,
            count: 0
          };
        }
        userCommissions[userId].totalFromCommissions += comm.amount;
        userCommissions[userId].count++;
      }
      
      console.log('='.repeat(60));
      console.log('📊 Summary by User:\n');
      
      Object.values(userCommissions).forEach((stats) => {
        console.log(`${stats.email} (${stats.name})`);
        console.log(`   Total from Commissions: $${stats.totalFromCommissions.toFixed(2)}`);
        console.log(`   Total Earnings in DB: $${stats.totalEarningsInDB.toFixed(2)}`);
        console.log(`   Commission Records: ${stats.count}`);
        
        if (stats.totalFromCommissions !== stats.totalEarningsInDB) {
          console.log(`   ⚠️  MISMATCH! Difference: $${(stats.totalFromCommissions - stats.totalEarningsInDB).toFixed(2)}`);
        } else {
          console.log(`   ✅ Matches!`);
        }
        console.log('');
      });
    }

    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkCommissions();
