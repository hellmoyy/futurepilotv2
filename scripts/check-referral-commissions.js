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
}, { collection: 'futurepilotcols' });

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
const ReferralCommission = mongoose.model('referralcommissions', commissionSchema);

async function checkCommissions() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!\n');

    // Get all users with referral relationships
    const users = await User.find({}).lean();
    console.log(`📊 Total Users: ${users.length}\n`);

    // Get all referral commissions
    const commissions = await ReferralCommission.find({})
      .populate('userId', 'name email membershipLevel')
      .populate('referralUserId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`💰 Total Commission Records: ${commissions.length}\n`);

    if (commissions.length === 0) {
      console.log('❌ No commission records found!');
      console.log('   This means calculateReferralCommission() is not being called,');
      console.log('   or no deposits have been made by referred users.\n');
    } else {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 COMMISSION RECORDS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      commissions.forEach((comm, index) => {
        console.log(`${index + 1}. Commission ID: ${comm._id}`);
        console.log(`   Referrer: ${comm.userId?.name || 'Unknown'} (${comm.userId?.email})`);
        console.log(`   Referred User: ${comm.referralUserId?.name || 'Unknown'} (${comm.referralUserId?.email})`);
        console.log(`   Level: ${comm.referralLevel}`);
        console.log(`   Amount: $${comm.amount.toFixed(2)}`);
        console.log(`   Rate: ${comm.commissionRate}%`);
        console.log(`   Source: ${comm.source}`);
        console.log(`   Status: ${comm.status}`);
        console.log(`   Created: ${new Date(comm.createdAt).toLocaleString()}`);
        if (comm.paidAt) {
          console.log(`   Paid: ${new Date(comm.paidAt).toLocaleString()}`);
        }
        console.log('');
      });

      // Summary by status
      const pending = commissions.filter(c => c.status === 'pending');
      const paid = commissions.filter(c => c.status === 'paid');
      const rejected = commissions.filter(c => c.status === 'rejected');

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 SUMMARY BY STATUS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log(`   Pending: ${pending.length} ($${pending.reduce((sum, c) => sum + c.amount, 0).toFixed(2)})`);
      console.log(`   Paid: ${paid.length} ($${paid.reduce((sum, c) => sum + c.amount, 0).toFixed(2)})`);
      console.log(`   Rejected: ${rejected.length} ($${rejected.reduce((sum, c) => sum + c.amount, 0).toFixed(2)})`);
      console.log('');
    }

    // Check users' totalEarnings
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👥 USERS WITH EARNINGS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const usersWithEarnings = users.filter(u => (u.totalEarnings || 0) > 0);
    
    if (usersWithEarnings.length === 0) {
      console.log('❌ No users with totalEarnings > 0');
      console.log('   This means totalEarnings is not being updated!\n');
    } else {
      usersWithEarnings.forEach((u, index) => {
        const available = (u.totalEarnings || 0) - (u.totalWithdrawn || 0);
        console.log(`${index + 1}. ${u.name} (${u.email})`);
        console.log(`   Membership: ${u.membershipLevel || 'bronze'}`);
        console.log(`   Total Earnings: $${(u.totalEarnings || 0).toFixed(2)}`);
        console.log(`   Total Withdrawn: $${(u.totalWithdrawn || 0).toFixed(2)}`);
        console.log(`   Available: $${available.toFixed(2)}`);
        console.log(`   Personal Deposit: $${(u.totalPersonalDeposit || 0).toFixed(2)}`);
        console.log('');
      });
    }

    // Check for users who have referrals
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 REFERRAL RELATIONSHIPS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const usersWithReferrer = users.filter(u => u.referredBy);
    console.log(`Users with referrer: ${usersWithReferrer.length}`);
    
    usersWithReferrer.forEach((u, index) => {
      const referrer = users.find(r => r._id.toString() === u.referredBy?.toString());
      console.log(`${index + 1}. ${u.name} (${u.email})`);
      console.log(`   Referred by: ${referrer?.name || 'Unknown'} (${referrer?.email || 'Unknown'})`);
      console.log(`   User's deposits: $${(u.totalPersonalDeposit || 0).toFixed(2)}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkCommissions();
