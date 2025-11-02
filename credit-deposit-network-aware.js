require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: String,
  walletData: {
    erc20Address: String,
    bep20Address: String,
    balance: Number,
    mainnetBalance: Number
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
  walletAddress: String,
  fromAddress: String,
  toAddress: String,
  blockNumber: Number,
  createdAt: Date
}, { timestamps: true });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function creditDeposit() {
  console.log('🔧 Manual Deposit Credit (Network-Aware)\n');
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    // Configuration
    const userEmail = 'helmi.andito@gmail.com';
    const depositAmount = 25; // Amount to credit
    const networkMode = process.env.NETWORK_MODE || 'testnet';
    
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log('👤 User Info:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Wallet: ${user.walletData?.bep20Address || 'N/A'}`);
    console.log(`   Network Mode: ${networkMode.toUpperCase()}\n`);
    
    console.log('💰 Current Balances:');
    console.log(`   Testnet Balance: ${user.walletData?.balance || 0} USDT`);
    console.log(`   Mainnet Balance: ${user.walletData?.mainnetBalance || 0} USDT\n`);
    
    // Determine which balance to update
    const balanceField = networkMode === 'mainnet' 
      ? 'walletData.mainnetBalance' 
      : 'walletData.balance';
    
    const currentBalance = networkMode === 'mainnet'
      ? (user.walletData?.mainnetBalance || 0)
      : (user.walletData?.balance || 0);
    
    console.log(`📝 Crediting to: ${networkMode.toUpperCase()}`);
    console.log(`   Current: ${currentBalance} USDT`);
    console.log(`   Adding: +${depositAmount} USDT`);
    console.log(`   New Total: ${currentBalance + depositAmount} USDT\n`);
    
    // Create transaction record
    const txHash = `MANUAL_CREDIT_${networkMode.toUpperCase()}_${Date.now()}`;
    const networkName = networkMode === 'mainnet' ? 'BEP20' : 'BEP20'; // Enum value
    
    const newTransaction = new Transaction({
      userId: user._id,
      userEmail: user.email,
      network: networkName,
      txHash: txHash,
      amount: depositAmount,
      status: 'confirmed',
      walletAddress: user.walletData?.bep20Address || '',
      fromAddress: 'Manual Credit',
      toAddress: user.walletData?.bep20Address || '',
      blockNumber: 0,
      createdAt: new Date()
    });
    
    await newTransaction.save();
    console.log(`✅ Transaction created: ${txHash}\n`);
    
    // Update balance for correct network
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { [balanceField]: depositAmount } },
      { new: true }
    );
    
    console.log('✅ Balance Updated Successfully!\n');
    console.log('💰 New Balances:');
    console.log(`   Testnet Balance: ${updatedUser.walletData?.balance || 0} USDT`);
    console.log(`   Mainnet Balance: ${updatedUser.walletData?.mainnetBalance || 0} USDT\n`);
    
    console.log('=' .repeat(80));
    console.log(`\n🎉 SUCCESS! Added ${depositAmount} USDT to ${networkMode.toUpperCase()} balance`);
    console.log('\n💡 Next steps:');
    console.log('   1. Refresh /topup page');
    console.log(`   2. Balance should show updated amount`);
    console.log('   3. Verify transaction appears in history');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

creditDeposit();
