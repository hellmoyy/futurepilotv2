/**
 * Script to check referral data integrity
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  referralCode: String,
  referredBy: mongoose.Schema.Types.ObjectId,
  totalEarnings: { type: Number, default: 0 },
  totalPersonalDeposit: { type: Number, default: 0 },
  membershipLevel: { type: String, default: 'bronze' },
  createdAt: Date,
}, { collection: 'futurepilotcols' });

const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', userSchema);

async function checkReferralData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const allUsers = await User.find({}).select('email name referralCode referredBy totalEarnings createdAt');
    
    console.log(`📊 Total Users: ${allUsers.length}\n`);

    // Find users with referralCode (potential referrers)
    const usersWithCode = allUsers.filter(u => u.referralCode);
    console.log(`👥 Users with Referral Code: ${usersWithCode.length}\n`);

    // Find users who were referred
    const referredUsers = allUsers.filter(u => u.referredBy);
    console.log(`🔗 Users who were Referred: ${referredUsers.length}\n`);

    if (referredUsers.length > 0) {
      console.log('📋 Referral Relationships:\n');
      
      for (const user of referredUsers) {
        const referrer = await User.findById(user.referredBy).select('email name referralCode');
        
        if (referrer) {
          console.log(`✅ ${user.email} (${user.name})`);
          console.log(`   └─ Referred by: ${referrer.email} (${referrer.name})`);
          console.log(`   └─ Referral Code: ${referrer.referralCode}`);
          console.log(`   └─ Joined: ${user.createdAt}`);
          console.log(`   └─ Total Earnings: $${user.totalEarnings || 0}\n`);
        } else {
          console.log(`❌ ${user.email} (${user.name})`);
          console.log(`   └─ Referrer ID: ${user.referredBy} (NOT FOUND!)`);
          console.log(`   └─ Issue: Referrer user doesn't exist in database\n`);
        }
      }

      // Count referrals per user
      console.log('\n' + '='.repeat(60));
      console.log('📊 Referral Statistics by User:\n');

      const referrerStats = {};
      
      for (const user of referredUsers) {
        const referrerId = user.referredBy.toString();
        if (!referrerStats[referrerId]) {
          const referrer = await User.findById(user.referredBy).select('email name referralCode');
          referrerStats[referrerId] = {
            email: referrer?.email || 'Unknown',
            name: referrer?.name || 'Unknown',
            referralCode: referrer?.referralCode || 'N/A',
            count: 0,
            referrals: []
          };
        }
        referrerStats[referrerId].count++;
        referrerStats[referrerId].referrals.push({
          email: user.email,
          name: user.name,
          earnings: user.totalEarnings || 0
        });
      }

      const sortedReferrers = Object.values(referrerStats).sort((a, b) => b.count - a.count);

      sortedReferrers.forEach((stats, index) => {
        console.log(`${index + 1}. ${stats.email} (${stats.name})`);
        console.log(`   Referral Code: ${stats.referralCode}`);
        console.log(`   Total Referrals: ${stats.count}`);
        console.log(`   Referrals:`);
        stats.referrals.forEach(ref => {
          console.log(`     - ${ref.email} (${ref.name}) - Earnings: $${ref.earnings}`);
        });
        console.log('');
      });

    } else {
      console.log('⚠️  No referral relationships found!\n');
      console.log('Possible reasons:');
      console.log('1. No users have signed up with referral codes yet');
      console.log('2. referredBy field is not being set during registration');
      console.log('3. Data migration needed\n');
    }

    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkReferralData();
