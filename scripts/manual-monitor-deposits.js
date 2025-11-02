require('dotenv').config({ path: '.env' });
const { ethers } = require('ethers');
const mongoose = require('mongoose');

const USDT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function decimals() view returns (uint8)"
];

// Define User model with correct collection name
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

async function manualMonitorDeposits() {
  console.log('🔍 Manual Deposit Monitoring\n');
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    // Get users with wallets
    const users = await User.find({
      $or: [
        { 'walletData.erc20Address': { $exists: true, $ne: null } },
        { 'walletData.bep20Address': { $exists: true, $ne: null } }
      ]
    });
    
    console.log(`👥 Found ${users.length} user(s) with wallets\n`);
    
    users.forEach(u => {
      console.log(`   - ${u.email}`);
      console.log(`     ERC20: ${u.walletData?.erc20Address}`);
      console.log(`     BEP20: ${u.walletData?.bep20Address}`);
      console.log(`     Balance: ${u.walletData?.balance || 0} USDT\n`);
    });
    
    // Setup network config for BSC Testnet
    const config = {
      name: 'BSC Testnet',
      rpc: process.env.TESTNET_BSC_RPC_URL,
      contract: process.env.TESTNET_USDT_BEP20_CONTRACT
    };
    
    console.log(`\n🌐 Monitoring ${config.name}...`);
    console.log(`   RPC: ${config.rpc}`);
    console.log(`   USDT Contract: ${config.contract}\n`);
    
    const provider = new ethers.JsonRpcProvider(config.rpc);
    const contract = new ethers.Contract(config.contract, USDT_ABI, provider);
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 100);
    
    console.log(`📦 Current Block: ${currentBlock}`);
    console.log(`📦 Checking from block: ${fromBlock}\n`);
    
    let totalDeposits = 0;
    let newDeposits = 0;
    
    for (const user of users) {
      const address = user.walletData?.bep20Address;
      if (!address) continue;
      
      console.log(`🔎 Checking ${user.email} (${address})...`);
      
      try {
        const transfers = await contract.queryFilter(
          contract.filters.Transfer(null, address),
          fromBlock,
          currentBlock
        );
        
        console.log(`   Found ${transfers.length} transfer(s)`);
        
        for (const transfer of transfers) {
          const eventLog = transfer;
          const txHash = transfer.transactionHash;
          
          // Get decimals from env
          const usdtDecimals = parseInt(process.env.TESTNET_USDT_BEP20_DECIMAL || '18');
          const amount = eventLog.args?.[2] ? ethers.formatUnits(eventLog.args[2], usdtDecimals) : '0';
          
          totalDeposits++;
          
          // Check if already processed
          const existingTx = await Transaction.findOne({ txHash });
          if (existingTx) {
            console.log(`   ⏭️  Already processed: ${txHash}`);
            continue;
          }
          
          console.log(`   💰 NEW DEPOSIT: ${amount} USDT`);
          console.log(`      TxHash: ${txHash}`);
          console.log(`      Block: ${transfer.blockNumber}`);
          
          // Create transaction record
          const newTransaction = new Transaction({
            userId: user._id,
            userEmail: user.email,
            network: config.name,
            txHash,
            amount: parseFloat(amount),
            status: 'confirmed',
            fromAddress: eventLog.args?.[0] || 'unknown',
            toAddress: address,
            blockNumber: transfer.blockNumber,
            createdAt: new Date()
          });
          
          await newTransaction.save();
          console.log(`      ✅ Transaction saved`);
          
          // Update user balance
          await User.findByIdAndUpdate(user._id, {
            $inc: { 'walletData.balance': parseFloat(amount) }
          });
          
          console.log(`      ✅ Balance updated (+${amount} USDT)\n`);
          newDeposits++;
        }
        
      } catch (error) {
        console.error(`   ❌ Error checking ${user.email}:`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   Total deposits found: ${totalDeposits}`);
    console.log(`   New deposits processed: ${newDeposits}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

manualMonitorDeposits();
