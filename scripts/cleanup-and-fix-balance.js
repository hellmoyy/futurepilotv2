const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  email: String,
  walletData: {
    balance: Number,
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

async function cleanupAndFix() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔧 Cleanup and Fix Balance...\n');

    const user = await User.findOne({ email: 'helmi.andito@gmail.com' });
    
    console.log('📝 Plan:');
    console.log('   1. Delete all MANUAL_CREDIT transactions (duplicates)');
    console.log('   2. Ensure all 8 blockchain transactions are in database');
    console.log('   3. Set user balance to $420\n');

    // Step 1: Delete manual credits
    const deleteResult = await Transaction.deleteMany({
      userId: user._id,
      txHash: { $regex: /MANUAL_CREDIT/ }
    });
    console.log(`✅ Deleted ${deleteResult.deletedCount} manual credit transactions\n`);

    // Step 2: Fix the incorrectly updated transaction
    const wrongTx = await Transaction.findOne({
      txHash: '0x4529c3bbb171d6fa99e9fce2a3d3887727af096e1bca9dc56ab505310e3e7a8e'
    });
    
    if (wrongTx && wrongTx.amount !== 15) {
      await Transaction.updateOne(
        { _id: wrongTx._id },
        { $set: { amount: 15 } }
      );
      console.log('✅ Fixed ERC20 transaction: $35 → $15 (correct amount)\n');
    }

    // Step 3: Check for missing BEP20 transactions
    const missingBep20Txs = [
      { hash: '0x123f023230ded5b01636372043a3c390982aeb9d3d6ab30e2400e9d420bfc80d', amount: 125, date: '2025-11-02T04:57:36.000Z' },
      { hash: '0x74ec7a4109623874bffc4bb675dc3cfd85f56ca382580ffa92f15f5e0d37a33c', amount: 25, date: '2025-11-02T05:30:43.000Z' },
      { hash: '0x49cf4450ff1c2af17faba9d471c951ef1a4ec37df1302786345a577a9c5de295', amount: 35, date: '2025-11-02T05:50:33.000Z' },
    ];

    for (const tx of missingBep20Txs) {
      const exists = await Transaction.findOne({ txHash: tx.hash });
      if (!exists) {
        await Transaction.create({
          userId: user._id,
          amount: tx.amount,
          status: 'confirmed',
          type: 'deposit',
          network: 'BEP20',
          txHash: tx.hash,
          createdAt: new Date(tx.date)
        });
        console.log(`✅ Added missing BEP20 transaction: $${tx.amount}`);
      }
    }

    // Step 4: Update user balance
    await User.updateOne(
      { _id: user._id },
      { $set: { 'walletData.balance': 420 } }
    );
    console.log('\n✅ Set user balance to $420\n');

    // Verification
    const allTxs = await Transaction.find({
      userId: user._id,
      type: 'deposit',
      status: 'confirmed'
    }).sort({ createdAt: 1 });

    console.log(`📊 Final Transactions (${allTxs.length} total):`);
    console.log('━'.repeat(80));
    let total = 0;
    allTxs.forEach((tx, index) => {
      console.log(`${index + 1}. $${tx.amount} - ${tx.txHash.substring(0, 20)}...`);
      total += tx.amount;
    });
    console.log(`Total: $${total}\n`);

    const updatedUser = await User.findOne({ _id: user._id });
    console.log(`User Balance: $${updatedUser.walletData?.balance}\n`);

    if (total === 420 && updatedUser.walletData?.balance === 420) {
      console.log('✅ SUCCESS! Balance now matches blockchain ($420)');
    } else {
      console.log(`⚠️  WARNING: Total=$${total}, Balance=$${updatedUser.walletData?.balance}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

cleanupAndFix();
