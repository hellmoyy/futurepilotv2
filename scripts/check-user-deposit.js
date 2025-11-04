/**
 * Script to check user's deposit and totalPersonalDeposit
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

// Define schemas
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  totalPersonalDeposit: { type: Number, default: 0 },
  membershipLevel: { type: String, default: 'bronze' },
  walletData: {
    balance: { type: Number, default: 0 },
    mainnetBalance: { type: Number, default: 0 },
  }
}, { collection: 'futurepilotcols' });

const transactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String,
  amount: Number,
  status: String,
  source: String,
  transactionHash: String,
  createdAt: Date,
}, { collection: 'transactions' });

const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', userSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

async function checkUserDeposit() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const email = process.argv[2] || 'helmi.andito@gmail.com';

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log('👤 User Information:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Total Personal Deposit: $${(user.totalPersonalDeposit || 0).toFixed(2)}`);
    console.log(`   Membership Level: ${user.membershipLevel || 'bronze'}`);
    console.log(`   Balance (testnet): $${(user.walletData?.balance || 0).toFixed(2)}`);
    console.log(`   Balance (mainnet): $${(user.walletData?.mainnetBalance || 0).toFixed(2)}`);

    // Get all transactions
    const allTransactions = await Transaction.find({ userId: user._id }).sort({ createdAt: -1 });
    console.log(`\n📊 Total Transactions: ${allTransactions.length}`);
    
    // Show ALL transactions first
    console.log('\n📋 ALL Transactions:');
    allTransactions.forEach((tx, index) => {
      console.log(`\n${index + 1}. Type: ${tx.type} | Amount: $${tx.amount.toFixed(2)} | Status: ${tx.status}`);
      console.log(`   Source: ${tx.source || 'N/A'}`);
      console.log(`   Hash: ${tx.transactionHash || 'N/A'}`);
      console.log(`   Date: ${tx.createdAt || 'N/A'}`);
    });

    // Get confirmed deposits
    const deposits = await Transaction.find({
      userId: user._id,
      type: 'deposit',
      status: 'confirmed'
    }).sort({ createdAt: -1 });

    console.log(`\n💰 Confirmed Deposits: ${deposits.length}`);
    if (deposits.length > 0) {
      console.log('\nDeposit History:');
      deposits.forEach((tx, index) => {
        console.log(`\n${index + 1}. Amount: $${tx.amount.toFixed(2)}`);
        console.log(`   Source: ${tx.source || 'N/A'}`);
        console.log(`   Status: ${tx.status}`);
        console.log(`   Hash: ${tx.transactionHash || 'N/A'}`);
        console.log(`   Date: ${tx.createdAt || 'N/A'}`);
      });

      const totalDeposits = deposits.reduce((sum, tx) => sum + tx.amount, 0);
      console.log(`\n📈 Total Confirmed Deposits: $${totalDeposits.toFixed(2)}`);
      
      if (totalDeposits !== user.totalPersonalDeposit) {
        console.log(`\n⚠️  MISMATCH DETECTED!`);
        console.log(`   Database shows: $${(user.totalPersonalDeposit || 0).toFixed(2)}`);
        console.log(`   Actual deposits: $${totalDeposits.toFixed(2)}`);
        console.log(`   Difference: $${(totalDeposits - (user.totalPersonalDeposit || 0)).toFixed(2)}`);
      } else {
        console.log(`\n✅ Balance matches transaction total!`);
      }
    } else {
      console.log('\n⚠️  No confirmed deposits found!');
      console.log('   Checking all transaction types...');
      
      if (allTransactions.length > 0) {
        console.log('\n📋 All Transactions:');
        allTransactions.forEach((tx, index) => {
          console.log(`\n${index + 1}. Type: ${tx.type}, Amount: $${tx.amount.toFixed(2)}`);
          console.log(`   Status: ${tx.status}`);
          console.log(`   Source: ${tx.source || 'N/A'}`);
          console.log(`   Date: ${tx.createdAt || 'N/A'}`);
        });
      }
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkUserDeposit();
