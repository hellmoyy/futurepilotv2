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

async function manualCreditDeposit() {
  console.log('🔧 Manual Credit Deposit for Helmi\n');
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    const userEmail = 'helmi.andito@gmail.com';
    const depositAmount = 125; // From on-chain verification
    const walletAddress = '0x41C7aAF4c414C8bcF5A09684A0449A9188558AC7';
    
    // Find user
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log('✅ User found!');
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Balance: ${user.walletData?.balance || 0} USDT\n`);
    
    // Create a manual transaction record
    const txHash = `MANUAL_CREDIT_${Date.now()}`; // Generate unique ID
    
    const newTransaction = new Transaction({
      userId: user._id,
      userEmail: user.email,
      network: 'BSC Testnet',
      txHash: txHash,
      amount: depositAmount,
      status: 'confirmed',
      fromAddress: 'External Wallet',
      toAddress: walletAddress,
      blockNumber: 0, // Manual entry
      createdAt: new Date()
    });
    
    await newTransaction.save();
    console.log(`✅ Transaction created:`);
    console.log(`   TxHash: ${txHash}`);
    console.log(`   Amount: ${depositAmount} USDT\n`);
    
    // Update user balance
    const updatedUser = await User.findByIdAndUpdate(
      user._id, 
      {
        $inc: { 'walletData.balance': depositAmount }
      },
      { new: true }
    );
    
    console.log(`✅ Balance updated!`);
    console.log(`   Previous: ${user.walletData?.balance || 0} USDT`);
    console.log(`   Added: +${depositAmount} USDT`);
    console.log(`   New Balance: ${updatedUser.walletData?.balance} USDT\n`);
    
    console.log('=' .repeat(80));
    console.log('\n🎉 SUCCESS! User can now see their balance on the platform!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

manualCreditDeposit();
