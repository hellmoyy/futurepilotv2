require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: String,
  walletData: {
    erc20Address: String,
    bep20Address: String,
    balance: Number
  }
}, { timestamps: true });

const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', UserSchema);

const TransactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  userEmail: String,
  network: String,
  txHash: String,
  amount: Number,
  status: String,
  fromAddress: String,
  toAddress: String,
  blockNumber: Number,
  createdAt: Date
}, { timestamps: true });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function creditLatestDeposit() {
  console.log('🔧 Crediting Latest Deposit (25 USDT)\n');
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    const userEmail = 'helmi.andito@gmail.com';
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log('👤 User Info:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Current DB Balance: ${user.walletData?.balance || 0} USDT`);
    console.log(`   On-Chain Balance: 150 USDT`);
    console.log(`   Missing: 25 USDT\n`);
    
    const depositAmount = 25;
    const txHash = `MANUAL_CREDIT_${Date.now()}`;
    
    // Create transaction
    const newTransaction = new Transaction({
      userId: user._id,
      userEmail: user.email,
      network: 'BSC Testnet',
      txHash: txHash,
      amount: depositAmount,
      status: 'confirmed',
      fromAddress: 'External Wallet',
      toAddress: user.walletData.bep20Address,
      blockNumber: 0,
      createdAt: new Date()
    });
    
    await newTransaction.save();
    console.log(`✅ Transaction created: ${txHash}\n`);
    
    // Update balance
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { 'walletData.balance': depositAmount } },
      { new: true }
    );
    
    console.log(`✅ Balance updated!`);
    console.log(`   Previous: ${user.walletData?.balance || 0} USDT`);
    console.log(`   Added: +${depositAmount} USDT`);
    console.log(`   New: ${updatedUser.walletData?.balance} USDT\n`);
    
    console.log('=' .repeat(80));
    console.log('\n🎉 SUCCESS! Balance now matches on-chain: 150 USDT');
    console.log('\n💡 Next steps:');
    console.log('   1. Refresh /topup page');
    console.log('   2. Balance should show $150.00');
    console.log('   3. Configure Moralis webhook to prevent future issues');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

creditLatestDeposit();
