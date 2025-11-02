import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';

// USDT Contract ABI for Transfer events
const USDT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function decimals() view returns (uint8)"
];

// Network configurations
const NETWORK_MODE = process.env.NETWORK_MODE || 'testnet';

const NETWORK_CONFIG = NETWORK_MODE === 'mainnet' ? {
  ethereum: {
    rpc: process.env.ETHEREUM_RPC_URL,
    contract: process.env.USDT_ERC20_CONTRACT,
    name: 'Ethereum Mainnet',
    chainId: '0x1'
  },
  bsc: {
    rpc: process.env.BSC_RPC_URL,
    contract: process.env.USDT_BEP20_CONTRACT,
    name: 'BSC Mainnet',
    chainId: '0x38'
  }
} : {
  ethereum: {
    rpc: process.env.TESTNET_ETHEREUM_RPC_URL,
    contract: process.env.TESTNET_USDT_ERC20_CONTRACT,
    name: 'Ethereum Sepolia Testnet',
    chainId: '0xaa36a7'
  },
  bsc: {
    rpc: process.env.TESTNET_BSC_RPC_URL,
    contract: process.env.TESTNET_USDT_BEP20_CONTRACT,
    name: 'BSC Testnet',
    chainId: '0x61'
  }
};

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const tokenFromQuery = request.nextUrl.searchParams.get('token');
  const cronSecret = process.env.CRON_SECRET;

  const isValidHeader = authHeader === `Bearer ${cronSecret}`;
  const isValidQuery = tokenFromQuery === cronSecret;

  if (!cronSecret || (!isValidHeader && !isValidQuery)) {
    return NextResponse.json({
      success: false,
      error: 'Unauthorized: Invalid or missing CRON_SECRET'
    }, { status: 401 });
  }

  console.log('🔍 Starting automatic deposit monitoring...');

  try {
    await connectDB();
    
    const results = {
      timestamp: new Date().toISOString(),
      networksChecked: 0,
      totalDepositsFound: 0,
      newDepositsProcessed: 0,
      errors: [] as string[],
      details: [] as any[]
    };

    // Get all users with wallet addresses
    const users = await User.find({
      $or: [
        { 'walletData.erc20Address': { $exists: true, $ne: null } },
        { 'walletData.bep20Address': { $exists: true, $ne: null } }
      ]
    });

    console.log(`📊 Monitoring ${users.length} user wallets`);

    // Check each network
    for (const [networkKey, config] of Object.entries(NETWORK_CONFIG)) {
      if (!config.rpc || !config.contract) {
        results.errors.push(`Missing configuration for ${networkKey}`);
        continue;
      }

      results.networksChecked++;
      console.log(`🌐 Checking ${config.name} network...`);

      try {
        const provider = new ethers.JsonRpcProvider(config.rpc);
        const contract = new ethers.Contract(config.contract, USDT_ABI, provider);
        const currentBlock = await provider.getBlockNumber();
        
        // Scan last 100 blocks (~5 minutes on BSC, ~20 minutes on ETH)
        // publicnode.com has excellent rate limits, no issues with larger windows
        // Cron runs every 1 minute, so this ensures we catch all deposits
        const fromBlock = Math.max(0, currentBlock - 100);

        // Collect all user addresses for this network
        const userAddresses = users
          .map(user => {
            const address = networkKey === 'ethereum' 
              ? user.walletData?.erc20Address 
              : user.walletData?.bep20Address;
            return address ? { address: address.toLowerCase(), user } : null;
          })
          .filter((item): item is { address: string; user: any } => item !== null);

        console.log(`📋 Checking ${userAddresses.length} addresses on ${config.name}`);

        let networkDeposits = 0;
        let networkProcessed = 0;

        // Process users one by one with delay to avoid rate limits
        for (let i = 0; i < userAddresses.length; i++) {
          const { address, user } = userAddresses[i];
          
          try {
            // Add small delay between queries to avoid rate limiting (except for first query)
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
            }
            
            // Get incoming transfers to this address
            const transfers = await contract.queryFilter(
              contract.filters.Transfer(null, address),
              fromBlock,
              currentBlock
            );

            if (transfers.length > 0) {
              console.log(`   📨 Found ${transfers.length} transfer(s) for ${user.email}`);
            }

            for (const transfer of transfers) {
              const eventLog = transfer as ethers.EventLog;
              const txHash = transfer.transactionHash;
              
              // Get decimals from env based on network
              let usdtDecimals = 6; // Default
              if (networkKey === 'bsc') {
                usdtDecimals = NETWORK_MODE === 'testnet' 
                  ? parseInt(process.env.TESTNET_USDT_BEP20_DECIMAL || '18')
                  : parseInt(process.env.USDT_BEP20_DECIMAL || '18');
              } else if (networkKey === 'ethereum') {
                usdtDecimals = NETWORK_MODE === 'testnet'
                  ? parseInt(process.env.TESTNET_USDT_ERC20_DECIMAL || '18')
                  : parseInt(process.env.USDT_ERC20_DECIMAL || '6');
              }
              
              const amount = eventLog.args?.[2] ? ethers.formatUnits(eventLog.args[2], usdtDecimals) : '0';
              
              networkDeposits++;

              // Check if transaction already processed
              const existingTx = await Transaction.findOne({ txHash });
              if (existingTx) {
                console.log(`⏭️  Transaction ${txHash} already processed`);
                continue;
              }

              // Create new transaction record
              const newTransaction = new Transaction({
                userId: user._id,
                userEmail: user.email,
                network: networkKey === 'bsc' ? 'BEP20' : 'ERC20', // Fix: Use correct enum values
                txHash,
                amount: parseFloat(amount),
                status: 'confirmed',
                walletAddress: address, // Fix: Add required walletAddress field
                fromAddress: eventLog.args?.[0] || 'unknown',
                toAddress: address,
                blockNumber: transfer.blockNumber,
                createdAt: new Date()
              });

              await newTransaction.save();

              // Update user balance
              await User.findByIdAndUpdate(user._id, {
                $inc: { 'walletData.balance': parseFloat(amount) }
              });

              networkProcessed++;
              
              console.log(`💰 Processed deposit: ${amount} USDT to ${user.email} (${txHash})`);
              
              results.details.push({
                user: user.email,
                network: config.name,
                amount: parseFloat(amount),
                txHash,
                processed: true
              });
            }

          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            
            // Check if it's a rate limit error
            if (errorMsg.includes('rate limit') || errorMsg.includes('-32005')) {
              console.warn(`⚠️ Rate limit hit for ${user.email}, skipping remaining users on this network`);
              console.log('💡 Relying on webhook for real-time detection');
              break; // Exit loop for this network, webhook will handle it
            }
            
            console.error(`❌ Error checking ${address}: ${errorMsg}`);
            results.errors.push(`${user.email}: ${errorMsg}`);
          }
        }

        results.totalDepositsFound += networkDeposits;
        results.newDepositsProcessed += networkProcessed;

        console.log(`✅ ${config.name}: Found ${networkDeposits} deposits, processed ${networkProcessed} new ones`);

      } catch (error) {
        const errorMsg = `${config.name} network error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    console.log(`🎉 Deposit monitoring completed: ${results.newDepositsProcessed} new deposits processed`);

    return NextResponse.json({
      success: true,
      message: 'Deposit monitoring completed',
      results
    });

  } catch (error) {
    console.error('💥 Deposit monitoring error:', error);
    return NextResponse.json({
      success: false,
      error: 'Deposit monitoring failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Support POST method for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}