/**
 * Script to backfill referral commissions for existing deposits
 * This will calculate and distribute commissions for deposits made before commission system was implemented
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  totalEarnings: { type: Number, default: 0 },
  totalPersonalDeposit: { type: Number, default: 0 },
  membershipLevel: { type: String, default: 'bronze' },
  referralCode: String,
  referredBy: mongoose.Schema.Types.ObjectId,
}, { collection: 'futurepilotcols' });

const settingsSchema = new mongoose.Schema({
  key: String,
  value: mongoose.Schema.Types.Mixed,
}, { collection: 'settings' });

const referralCommissionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  referralUserId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  level: Number,
  depositAmount: Number,
  commissionRate: Number,
  createdAt: { type: Date, default: Date.now },
}, { collection: 'referralcommissions' });

const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', userSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
const ReferralCommission = mongoose.models.ReferralCommission || mongoose.model('ReferralCommission', referralCommissionSchema);

async function backfillCommissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get commission rates from settings
    const tierRatesSetting = await Settings.findOne({ key: 'tierCommissionRates' });
    const tierRates = tierRatesSetting?.value || {
      bronze: { level1: 10, level2: 5, level3: 5 },
      silver: { level1: 20, level2: 5, level3: 5 },
      gold: { level1: 30, level2: 5, level3: 5 },
      platinum: { level1: 40, level2: 5, level3: 5 },
    };

    console.log('📊 Commission Rates:', JSON.stringify(tierRates, null, 2));
    console.log('');

    // Find users with deposits who were referred
    const usersWithDeposits = await User.find({ 
      totalPersonalDeposit: { $gt: 0 },
      referredBy: { $exists: true, $ne: null }
    }).select('email name totalPersonalDeposit referredBy');

    console.log(`💰 Found ${usersWithDeposits.length} referred users with deposits\n`);

    if (usersWithDeposits.length === 0) {
      console.log('No deposits to process. Exiting...\n');
      return;
    }

    let totalCommissionsCreated = 0;
    let totalAmountDistributed = 0;

    for (const user of usersWithDeposits) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Processing: ${user.email}`);
      console.log(`Deposit Amount: $${user.totalPersonalDeposit.toFixed(2)}`);

      // Check if commission already exists for this user
      const existingCommission = await ReferralCommission.findOne({ referralUserId: user._id });
      if (existingCommission) {
        console.log(`⚠️  Commission already exists. Skipping...`);
        continue;
      }

      const depositAmount = user.totalPersonalDeposit;
      let currentUserId = user._id;
      let currentReferrerId = user.referredBy;
      let level = 1;

      // Distribute to 3 levels
      while (currentReferrerId && level <= 3) {
        const referrer = await User.findById(currentReferrerId).select('email name membershipLevel totalEarnings referredBy');
        
        if (!referrer) {
          console.log(`   Level ${level}: Referrer not found. Stopping...`);
          break;
        }

        // Get commission rate based on referrer's tier
        const tierKey = referrer.membershipLevel || 'bronze';
        const rate = tierRates[tierKey][`level${level}`] || 0;
        const commissionAmount = (depositAmount * rate) / 100;

        if (commissionAmount > 0) {
          // Create commission record
          // IMPORTANT: referralUserId should ALWAYS be the original deposit user (user._id),
          // NOT currentUserId which changes during the loop
          const commission = new ReferralCommission({
            userId: referrer._id,
            referralUserId: user._id, // ✅ FIX: Always use original user who made the deposit
            amount: commissionAmount,
            level: level,
            depositAmount: depositAmount,
            commissionRate: rate,
            createdAt: new Date(),
          });
          await commission.save();

          // Update referrer's totalEarnings
          referrer.totalEarnings = (referrer.totalEarnings || 0) + commissionAmount;
          await referrer.save();

          console.log(`   ✅ Level ${level}: ${referrer.email}`);
          console.log(`      Tier: ${tierKey}, Rate: ${rate}%`);
          console.log(`      Commission: $${commissionAmount.toFixed(2)}`);
          console.log(`      New Total Earnings: $${referrer.totalEarnings.toFixed(2)}`);

          totalCommissionsCreated++;
          totalAmountDistributed += commissionAmount;
        } else {
          console.log(`   ⚠️  Level ${level}: Rate is 0%, skipping...`);
        }

        // Move to next level
        currentUserId = referrer._id;
        currentReferrerId = referrer.referredBy;
        level++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 Backfill Summary:\n');
    console.log(`   Users Processed: ${usersWithDeposits.length}`);
    console.log(`   Commission Records Created: ${totalCommissionsCreated}`);
    console.log(`   Total Amount Distributed: $${totalAmountDistributed.toFixed(2)}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
console.log('🚀 Starting Referral Commission Backfill...\n');
backfillCommissions();
