require('dotenv').config({ path: '.env' });
const { ethers } = require('ethers');
const mongoose = require('mongoose');

const USDT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const UserSchema = new mongoose.Schema({
  email: String,
  walletData: {
    erc20Address: String,
    bep20Address: String,
    balance: Number
  }
}, { timestamps: true });

const User = mongoose.models.futurepilotcol || mongoose.model('futurepilotcol', UserSchema);

async function debugUserDeposit() {
  console.log('🔍 Debugging User Deposit Detection\n');
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    const userEmail = 'helmi.andito@gmail.com';
    const user = await User.findOne({ email: userEmail });
    
    if (!user || !user.walletData) {
      console.log('❌ User or wallet not found!');
      return;
    }
    
    console.log('👤 User Info:');
    console.log(`   Email: ${user.email}`);
    console.log(`   BEP20: ${user.walletData.bep20Address}`);
    console.log(`   ERC20: ${user.walletData.erc20Address}`);
    console.log(`   Balance: ${user.walletData.balance || 0} USDT\n`);
    
    // Check BSC Testnet
    console.log('='.repeat(80));
    console.log('🔍 CHECKING BSC TESTNET\n');
    
    const bscRpc = process.env.TESTNET_BSC_RPC_URL;
    const bscUsdt = process.env.TESTNET_USDT_BEP20_CONTRACT;
    const userBep20 = user.walletData.bep20Address;
    
    console.log(`RPC: ${bscRpc}`);
    console.log(`USDT Contract: ${bscUsdt}`);
    console.log(`User Wallet: ${userBep20}\n`);
    
    const provider = new ethers.JsonRpcProvider(bscRpc);
    const contract = new ethers.Contract(bscUsdt, USDT_ABI, provider);
    
    // Get current balance
    const balance = await contract.balanceOf(userBep20);
    const decimals = await contract.decimals();
    const balanceFormatted = ethers.formatUnits(balance, decimals);
    
    console.log(`💰 Current On-Chain Balance: ${balanceFormatted} USDT (${decimals} decimals)\n`);
    
    // Get current block
    const currentBlock = await provider.getBlockNumber();
    console.log(`📦 Current Block: ${currentBlock}\n`);
    
    // Check different block ranges
    const ranges = [
      { name: '100 blocks', blocks: 100 },
      { name: '500 blocks', blocks: 500 },
      { name: '1000 blocks', blocks: 1000 },
      { name: '5000 blocks', blocks: 5000 },
    ];
    
    for (const range of ranges) {
      const fromBlock = Math.max(0, currentBlock - range.blocks);
      console.log(`\n🔎 Scanning ${range.name} (${fromBlock} to ${currentBlock})...`);
      
      try {
        const transfers = await contract.queryFilter(
          contract.filters.Transfer(null, userBep20),
          fromBlock,
          currentBlock
        );
        
        console.log(`   ✅ Found ${transfers.length} transfer(s)`);
        
        if (transfers.length > 0) {
          console.log(`\n   📋 Transfer Details:`);
          for (const transfer of transfers) {
            const eventLog = transfer;
            const from = eventLog.args?.[0] || 'unknown';
            const to = eventLog.args?.[1] || 'unknown';
            const value = eventLog.args?.[2] || '0';
            const amount = ethers.formatUnits(value, decimals);
            
            console.log(`\n   ────────────────────────────────────`);
            console.log(`   TxHash: ${transfer.transactionHash}`);
            console.log(`   Block: ${transfer.blockNumber}`);
            console.log(`   From: ${from}`);
            console.log(`   To: ${to}`);
            console.log(`   Amount: ${amount} USDT`);
            console.log(`   Explorer: https://testnet.bscscan.com/tx/${transfer.transactionHash}`);
          }
          
          // Stop after finding transfers
          break;
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.message.includes('rate limit')) {
          console.log(`   ⚠️  Rate limit hit, skipping remaining ranges`);
          break;
        }
      }
      
      // Small delay between queries
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('   1. If on-chain balance > 0 but no transfers found:');
    console.log('      → Deposit is older than 5000 blocks (~4 hours)');
    console.log('      → Use manual credit script');
    console.log('   2. If rate limit errors:');
    console.log('      → Use Moralis webhook (real-time, no rate limit)');
    console.log('   3. If transfers found but not in DB:');
    console.log('      → Check deposit button should add them');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

debugUserDeposit();
