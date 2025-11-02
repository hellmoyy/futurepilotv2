const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { ethers } = require('ethers');

async function scanMissingDeposit() {
  try {
    console.log('🔍 Scanning for missing $10 deposit...\n');

    const address = '0x41C7aAF4c414C8bcF5A09684A0449A9188558AC7';
    
    // Setup testnet providers
    const ethProvider = new ethers.JsonRpcProvider(process.env.TESTNET_ETHEREUM_RPC_URL);
    const bscProvider = new ethers.JsonRpcProvider(process.env.TESTNET_BSC_RPC_URL);
    
    const usdtAddress = '0x46484Aee842A735Fbf4C05Af7e371792cf52b498';
    const decimals = 18;
    
    // ERC20 Transfer event signature
    const transferTopic = ethers.id('Transfer(address,address,uint256)');
    
    console.log('📊 Scanning ERC20 (Ethereum Sepolia)...\n');
    
    // Get latest block
    const latestBlock = await ethProvider.getBlockNumber();
    const fromBlock = latestBlock - 10000; // Last 10k blocks
    
    const ethFilter = {
      address: usdtAddress,
      topics: [
        transferTopic,
        null, // from (any)
        ethers.zeroPadValue(address, 32) // to (our address)
      ],
      fromBlock,
      toBlock: 'latest'
    };
    
    const ethLogs = await ethProvider.getLogs(ethFilter);
    console.log(`Found ${ethLogs.length} ERC20 transfer(s)\n`);
    
    for (const log of ethLogs) {
      const block = await ethProvider.getBlock(log.blockNumber);
      const amount = ethers.formatUnits(log.data, decimals);
      const date = new Date(block.timestamp * 1000);
      
      console.log(`📥 ERC20 Transfer:`);
      console.log(`   Amount: $${amount}`);
      console.log(`   TxHash: ${log.transactionHash}`);
      console.log(`   Block: ${log.blockNumber}`);
      console.log(`   Date: ${date.toISOString()}\n`);
    }
    
    console.log('📊 Scanning BEP20 (BSC Testnet)...\n');
    
    const bscLatestBlock = await bscProvider.getBlockNumber();
    const bscFromBlock = bscLatestBlock - 10000;
    
    const bscFilter = {
      address: usdtAddress,
      topics: [
        transferTopic,
        null,
        ethers.zeroPadValue(address, 32)
      ],
      fromBlock: bscFromBlock,
      toBlock: 'latest'
    };
    
    const bscLogs = await bscProvider.getLogs(bscFilter);
    console.log(`Found ${bscLogs.length} BEP20 transfer(s)\n`);
    
    for (const log of bscLogs) {
      const block = await bscProvider.getBlock(log.blockNumber);
      const amount = ethers.formatUnits(log.data, decimals);
      const date = new Date(block.timestamp * 1000);
      
      console.log(`📥 BEP20 Transfer:`);
      console.log(`   Amount: $${amount}`);
      console.log(`   TxHash: ${log.transactionHash}`);
      console.log(`   Block: ${log.blockNumber}`);
      console.log(`   Date: ${date.toISOString()}\n`);
    }
    
    console.log('✅ Scan complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

scanMissingDeposit();
