const { ethers } = require('ethers');

const USDT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)"
];

async function debugDeposit() {
  console.log('🔍 Debugging Deposit Detection\n');
  
  // User wallet address
  const userWallet = '0x41C7aAF4c414C8bcF5A09684A0449A9188558AC7';
  const usdtContract = '0x46484Aee842A735Fbf4C05Af7e371792cf52b498';
  
  console.log(`👤 User Wallet: ${userWallet}`);
  console.log(`💰 USDT Contract: ${usdtContract}\n`);
  
  // Connect to BSC Testnet
  const rpcUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
  console.log(`🌐 Connecting to BSC Testnet: ${rpcUrl}`);
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(usdtContract, USDT_ABI, provider);
  
  try {
    // Get current block
    const currentBlock = await provider.getBlockNumber();
    console.log(`📦 Current Block: ${currentBlock}`);
    
    // Check last 100 blocks (same as cron)
    const fromBlock = Math.max(0, currentBlock - 100);
    console.log(`📦 Checking from block: ${fromBlock}\n`);
    
    // Get USDT balance
    const balance = await contract.balanceOf(userWallet);
    const decimals = await contract.decimals();
    const balanceFormatted = ethers.formatUnits(balance, decimals);
    console.log(`💵 Current USDT Balance: ${balanceFormatted} USDT (${decimals} decimals)\n`);
    
    // Get all incoming transfers
    console.log('📨 Checking incoming transfers...');
    const transfers = await contract.queryFilter(
      contract.filters.Transfer(null, userWallet),
      fromBlock,
      currentBlock
    );
    
    console.log(`\n✅ Found ${transfers.length} incoming transfer(s):\n`);
    
    if (transfers.length === 0) {
      console.log('⚠️  NO TRANSFERS FOUND!');
      console.log('   Possible reasons:');
      console.log('   1. User has not made any deposit yet');
      console.log('   2. Deposit was made more than 1000 blocks ago');
      console.log('   3. Wrong contract address');
      console.log('   4. Wrong network (not BSC Testnet)');
    } else {
      for (const transfer of transfers) {
        const eventLog = transfer;
        const from = eventLog.args?.[0] || 'unknown';
        const to = eventLog.args?.[1] || 'unknown';
        const value = eventLog.args?.[2] || '0';
        const amount = ethers.formatUnits(value, decimals);
        
        console.log(`─────────────────────────────────────────────`);
        console.log(`📋 Transaction Hash: ${transfer.transactionHash}`);
        console.log(`📦 Block Number: ${transfer.blockNumber}`);
        console.log(`👤 From: ${from}`);
        console.log(`👤 To: ${to}`);
        console.log(`💰 Amount: ${amount} USDT`);
        console.log(`🔗 Explorer: https://testnet.bscscan.com/tx/${transfer.transactionHash}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugDeposit();
