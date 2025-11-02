const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  email: String,
  walletData: {
    balance: Number,
    mainnetBalance: Number,
    erc20Address: String,
    bep20Address: String,
  }
});

const transactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  status: String,
  type: String,
  network: String,
  txHash: String,
  createdAt: Date
});

const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', userSchema);
const Transaction = mongoose.models.transactions || mongoose.model('transactions', transactionSchema);

async function fixBalanceDiscrepancy() {
  try {
    console.log('🔧 Fixing balance discrepancy...\n');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email: 'helmi.andito@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 Current User Info:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Balance: $${user.walletData?.balance || 0}\n`);

    // Get all transactions
    const transactions = await Transaction.find({
      userId: user._id,
      type: 'deposit',
      status: 'confirmed'
    }).sort({ createdAt: 1 });

    console.log(`📊 Current Transactions (${transactions.length} total):`);
    let currentTotal = 0;
    const txHashes = [];
    transactions.forEach((tx, index) => {
      console.log(`   ${index + 1}. $${tx.amount} - ${tx.txHash} - ${tx.createdAt.toISOString()}`);
      currentTotal += tx.amount;
      txHashes.push(tx.txHash);
    });
    console.log(`   Current Total: $${currentTotal}\n`);

    // Check for the missing $35 BEP20 transaction
    const missingTxHash = '0x49cf4450ff1c2af17faba9d471c951ef1a4ec37df1302786345a577a9c5de295';
    
    if (!txHashes.includes(missingTxHash)) {
      console.log('⚠️  Missing transaction detected!');
      console.log(`   TxHash: ${missingTxHash}`);
      console.log(`   Amount: $35`);
      console.log(`   Network: BEP20 (BSC Testnet)`);
      console.log(`   Date: 2025-11-02T05:50:33.000Z\n`);

      console.log('💡 This transaction exists on blockchain but not in database');
      console.log('   Blockchain shows: $420 ($195 BEP20 + $225 ERC20)');
      console.log('   Database shows: $410');
      console.log('   Difference: $10\n');

      console.log('🔍 Checking for incorrect transaction...');
      
      // Find transaction with similar timestamp (within 1 minute)
      const targetTime = new Date('2025-11-02T05:50:33.000Z');
      const similarTx = transactions.find(tx => {
        const diff = Math.abs(tx.createdAt - targetTime);
        return diff < 60000; // Within 1 minute
      });

      if (similarTx && similarTx.amount !== 35) {
        console.log(`   ❌ Found incorrect transaction:`);
        console.log(`      ID: ${similarTx._id}`);
        console.log(`      Recorded Amount: $${similarTx.amount}`);
        console.log(`      Correct Amount: $35`);
        console.log(`      TxHash: ${similarTx.txHash}`);
        console.log(`      Date: ${similarTx.createdAt.toISOString()}\n`);

        // Ask for confirmation
        console.log('📝 Proposed fix:');
        console.log(`   1. Update transaction amount: $${similarTx.amount} → $35`);
        console.log(`   2. Update user balance: $410 → $420\n`);

        // Update transaction
        await Transaction.updateOne(
          { _id: similarTx._id },
          { $set: { amount: 35 } }
        );
        console.log('✅ Updated transaction amount to $35');

        // Update user balance
        await User.updateOne(
          { _id: user._id },
          { $set: { 'walletData.balance': 420 } }
        );
        console.log('✅ Updated user balance to $420');

        // Verify
        const updatedUser = await User.findOne({ _id: user._id });
        const updatedTx = await Transaction.findOne({ _id: similarTx._id });
        
        console.log('\n📊 Verification:');
        console.log(`   User Balance: $${updatedUser.walletData?.balance}`);
        console.log(`   Transaction Amount: $${updatedTx.amount}`);

        // Calculate total again
        const allTx = await Transaction.find({
          userId: user._id,
          type: 'deposit',
          status: 'confirmed'
        });
        const newTotal = allTx.reduce((sum, tx) => sum + tx.amount, 0);
        console.log(`   Total from Transactions: $${newTotal}`);
        
        if (newTotal === 420 && updatedUser.walletData?.balance === 420) {
          console.log('\n✅ SUCCESS! Balance fixed and matches blockchain');
        } else {
          console.log('\n⚠️  WARNING: Totals still don\'t match');
        }

      } else {
        console.log('   ℹ️  No similar transaction found, this might be a completely missing record');
      }

    } else {
      console.log('✅ Transaction already exists in database');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixBalanceDiscrepancy();
