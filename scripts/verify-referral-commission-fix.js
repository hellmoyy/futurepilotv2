require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

// Define schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  gasFeeBalance: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  totalWithdrawn: { type: Number, default: 0 },
  totalPersonalDeposit: { type: Number, default: 0 },
  membershipLevel: String,
  referralCode: String,
  referredBy: mongoose.Schema.Types.ObjectId,
  tierSetManually: { type: Boolean, default: false },
}, { collection: 'futurepilotcols' });

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'futurepilotcol', required: true },
  userEmail: String,
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'commission', 'trading_profit', 'trading_loss', 'referral_bonus', 'trading_commission'],
  },
  source: String,
  network: String,
  txHash: String,
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  walletAddress: String,
  fromAddress: String,
  toAddress: String,
  blockNumber: Number,
  notes: String,
}, { timestamps: true });

const commissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'futurepilotcol', required: true },
  referralUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'futurepilotcol', required: true },
  referralLevel: { type: Number, required: true },
  amount: { type: Number, required: true },
  commissionRate: { type: Number, required: true },
  source: {
    type: String,
    required: true,
    enum: ['trading_fee', 'deposit_fee', 'withdrawal_fee', 'subscription', 'gas_fee_topup']
  },
  sourceTransactionId: { type: mongoose.Schema.Types.ObjectId },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'paid', 'rejected']
  },
  paidAt: Date,
  notes: String,
}, { timestamps: true });

const User = mongoose.model('futurepilotcol', userSchema);
const Transaction = mongoose.model('transactions', transactionSchema);
const ReferralCommission = mongoose.model('referralcommissions', commissionSchema);

async function verifyFix() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 VERIFYING REFERRAL COMMISSION FIX');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 1. Check users with referrals
    const usersWithReferrer = await User.find({ referredBy: { $exists: true, $ne: null } }).lean();
    console.log(`📊 Users dengan referral: ${usersWithReferrer.length}`);
    
    if (usersWithReferrer.length === 0) {
      console.log('⚠️  No users with referrals found. Create test users with referral relationships first.\n');
    } else {
      console.log('\n👥 Referral Relationships:');
      console.log('───────────────────────────────────────────────────────────────\n');
      
      for (const user of usersWithReferrer) {
        const referrer = await User.findById(user.referredBy).lean();
        console.log(`   ${user.name} (${user.email})`);
        console.log(`   ↳ Referred by: ${referrer?.name || 'Unknown'} (${referrer?.email || 'N/A'})`);
        console.log(`   ↳ Personal Deposit: $${(user.totalPersonalDeposit || 0).toFixed(2)}`);
        console.log(`   ↳ Membership: ${user.membershipLevel || 'bronze'}`);
        console.log('');
      }
    }

    // 2. Check recent deposits
    const recentDeposits = await Transaction.find({ 
      status: 'confirmed',
      network: { $in: ['ERC20', 'BEP20'] }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`💰 Recent Deposits: ${recentDeposits.length}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (recentDeposits.length === 0) {
      console.log('⚠️  No deposits found. Test by depositing USDT to a user wallet.\n');
    } else {
      for (const deposit of recentDeposits) {
        const user = await User.findById(deposit.userId).lean();
        console.log(`   User: ${user?.name || 'Unknown'} (${user?.email || 'N/A'})`);
        console.log(`   Amount: $${deposit.amount.toFixed(2)} USDT`);
        console.log(`   Network: ${deposit.network}`);
        console.log(`   TxHash: ${deposit.txHash}`);
        console.log(`   Date: ${new Date(deposit.createdAt).toLocaleString()}`);
        
        // Check if commission was calculated for this deposit
        const commission = await ReferralCommission.findOne({ 
          sourceTransactionId: deposit._id 
        }).lean();
        
        if (commission) {
          console.log(`   ✅ Commission Created: $${commission.amount.toFixed(2)} (Level ${commission.referralLevel})`);
        } else {
          if (user?.referredBy) {
            console.log(`   ❌ Commission NOT Created (User has referrer!)`);
          } else {
            console.log(`   ℹ️  No commission (user has no referrer)`);
          }
        }
        console.log('');
      }
    }

    // 3. Check commission records
    const commissions = await ReferralCommission.find({})
      .populate('userId', 'name email membershipLevel')
      .populate('referralUserId', 'name email')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`💵 Commission Records: ${commissions.length}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (commissions.length === 0) {
      console.log('❌ NO COMMISSION RECORDS FOUND!\n');
      console.log('This means:');
      console.log('   1. No deposits have been made after the fix, OR');
      console.log('   2. Users making deposits have no referrer, OR');
      console.log('   3. The fix is not working correctly\n');
      console.log('🧪 TO TEST:');
      console.log('   1. Create User A with a referral code');
      console.log('   2. Create User B using User A\'s referral code');
      console.log('   3. User B deposits USDT to their wallet');
      console.log('   4. Click "Check Deposit" button or wait for auto-detection');
      console.log('   5. Run this script again to verify commission\n');
    } else {
      const totalCommission = commissions.reduce((sum, c) => sum + c.amount, 0);
      console.log(`✅ COMMISSIONS ARE BEING CREATED!\n`);
      console.log(`   Total Commission Amount: $${totalCommission.toFixed(2)}`);
      console.log(`   By Status:`);
      console.log(`   - Pending: ${commissions.filter(c => c.status === 'pending').length}`);
      console.log(`   - Paid: ${commissions.filter(c => c.status === 'paid').length}`);
      console.log(`   - Rejected: ${commissions.filter(c => c.status === 'rejected').length}\n`);

      console.log('📋 Recent Commission Details:\n');
      commissions.slice(0, 5).forEach((c, i) => {
        console.log(`   ${i + 1}. Referrer: ${c.userId?.name || 'Unknown'} (${c.userId?.membershipLevel || 'bronze'})`);
        console.log(`      From: ${c.referralUserId?.name || 'Unknown'}`);
        console.log(`      Amount: $${c.amount.toFixed(2)} (${c.commissionRate}% at Level ${c.referralLevel})`);
        console.log(`      Source: ${c.source}`);
        console.log(`      Status: ${c.status}`);
        console.log(`      Date: ${new Date(c.createdAt).toLocaleString()}`);
        console.log('');
      });
    }

    // 4. Check users with earnings
    const usersWithEarnings = await User.find({ totalEarnings: { $gt: 0 } })
      .sort({ totalEarnings: -1 })
      .lean();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`👛 Users with Earnings: ${usersWithEarnings.length}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (usersWithEarnings.length === 0) {
      console.log('❌ NO USERS WITH EARNINGS!\n');
      console.log('totalEarnings should be updated when commission is created.\n');
    } else {
      console.log('✅ EARNINGS ARE BEING TRACKED!\n');
      usersWithEarnings.forEach((u, i) => {
        const available = (u.totalEarnings || 0) - (u.totalWithdrawn || 0);
        console.log(`   ${i + 1}. ${u.name} (${u.email})`);
        console.log(`      Membership: ${u.membershipLevel || 'bronze'}`);
        console.log(`      Total Earnings: $${(u.totalEarnings || 0).toFixed(2)}`);
        console.log(`      Withdrawn: $${(u.totalWithdrawn || 0).toFixed(2)}`);
        console.log(`      Available: $${available.toFixed(2)}`);
        console.log('');
      });
    }

    // 5. Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 VERIFICATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const hasReferrals = usersWithReferrer.length > 0;
    const hasDeposits = recentDeposits.length > 0;
    const hasCommissions = commissions.length > 0;
    const hasEarnings = usersWithEarnings.length > 0;

    console.log(`   Referral Relationships: ${hasReferrals ? '✅' : '⚠️'} ${usersWithReferrer.length}`);
    console.log(`   Recent Deposits: ${hasDeposits ? '✅' : '⚠️'} ${recentDeposits.length}`);
    console.log(`   Commission Records: ${hasCommissions ? '✅' : '❌'} ${commissions.length}`);
    console.log(`   Users with Earnings: ${hasEarnings ? '✅' : '❌'} ${usersWithEarnings.length}\n`);

    if (hasCommissions && hasEarnings) {
      console.log('🎉 FIX IS WORKING! Referral commissions are being calculated correctly!\n');
    } else if (hasReferrals && hasDeposits && !hasCommissions) {
      console.log('⚠️  FIX MAY NOT BE WORKING! Users have referrals and deposits, but no commissions.\n');
      console.log('Possible issues:');
      console.log('   - Deposits were made BEFORE the fix was deployed');
      console.log('   - Settings table missing referralCommission config');
      console.log('   - Error in calculateReferralCommission() function\n');
    } else if (!hasReferrals) {
      console.log('ℹ️  No referral relationships to test. Create test users with referrals.\n');
    } else if (!hasDeposits) {
      console.log('ℹ️  No deposits to test. Make a test deposit to verify the fix.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

verifyFix();
