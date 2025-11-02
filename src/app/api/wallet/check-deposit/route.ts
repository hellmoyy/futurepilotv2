import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';
import { ethers } from 'ethers';
import { createBalanceUpdate, getUserBalance } from '@/lib/network-balance';

const USDT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

const NETWORK_MODE = process.env.NETWORK_MODE || 'testnet';

const NETWORK_CONFIG = NETWORK_MODE === 'mainnet' ? {
  bsc: {
    rpc: process.env.BSC_RPC_URL,
    contract: process.env.USDT_BEP20_CONTRACT,
    name: 'BSC Mainnet',
  },
  ethereum: {
    rpc: process.env.ETHEREUM_RPC_URL,
    contract: process.env.USDT_ERC20_CONTRACT,
    name: 'Ethereum Mainnet',
  }
} : {
  bsc: {
    rpc: process.env.TESTNET_BSC_RPC_URL,
    contract: process.env.TESTNET_USDT_BEP20_CONTRACT,
    name: 'BSC Testnet',
  },
  ethereum: {
    rpc: process.env.TESTNET_ETHEREUM_RPC_URL,
    contract: process.env.TESTNET_USDT_ERC20_CONTRACT,
    name: 'Ethereum Sepolia Testnet',
  }
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.walletData) {
      return NextResponse.json(
        { error: 'User wallet not found' },
        { status: 404 }
      );
    }

    const results = {
      checked: [] as string[],
      newDeposits: [] as any[],
      totalNewAmount: 0,
      errors: [] as string[]
    };

    // Check BSC (using BEP20 address)
    if (user.walletData.bep20Address) {
      try {
        console.log(`Checking BSC for ${user.email}...`);
        const bscResult = await checkNetwork(
          NETWORK_CONFIG.bsc,
          user.walletData.bep20Address,
          user,
          'bsc'
        );
        results.checked.push('BSC');
        results.newDeposits.push(...bscResult.deposits);
        results.totalNewAmount += bscResult.totalAmount;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('BSC check error:', errorMsg);
        results.errors.push(`BSC: ${errorMsg}`);
      }
    }

    // Check Ethereum (using ERC20 address)
    if (user.walletData.erc20Address) {
      try {
        console.log(`Checking Ethereum for ${user.email}...`);
        const ethResult = await checkNetwork(
          NETWORK_CONFIG.ethereum,
          user.walletData.erc20Address,
          user,
          'ethereum'
        );
        results.checked.push('Ethereum');
        results.newDeposits.push(...ethResult.deposits);
        results.totalNewAmount += ethResult.totalAmount;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Ethereum check error:', errorMsg);
        results.errors.push(`Ethereum: ${errorMsg}`);
      }
    }

    // Get updated balance for current network
    const updatedUser = await User.findById(user._id);
    const currentBalance = getUserBalance(updatedUser);

    return NextResponse.json({
      success: true,
      balance: currentBalance, // Network-aware balance
      newDepositsCount: results.newDeposits.length,
      totalNewAmount: results.totalNewAmount,
      networksChecked: results.checked,
      deposits: results.newDeposits,
      errors: results.errors.length > 0 ? results.errors : undefined
    });

  } catch (error) {
    console.error('❌ Error checking deposit:', error);
    return NextResponse.json(
      { error: 'Failed to check deposit' },
      { status: 500 }
    );
  }
}

async function checkNetwork(
  config: any,
  userAddress: string,
  user: any,
  networkKey: string
) {
  const provider = new ethers.JsonRpcProvider(config.rpc);
  const contract = new ethers.Contract(config.contract, USDT_ABI, provider);
  
  const currentBlock = await provider.getBlockNumber();
  // Scan last 500 blocks (~25 minutes on BSC, ~100 minutes on ETH)
  // publicnode.com has better rate limits than official RPCs
  const fromBlock = Math.max(0, currentBlock - 500);
  
  console.log(`Checking ${config.name} blocks ${fromBlock} to ${currentBlock}`);

  try {
    const transfers = await contract.queryFilter(
      contract.filters.Transfer(null, userAddress.toLowerCase()),
      fromBlock,
      currentBlock
    );

    const deposits = [];
    let totalAmount = 0;

    for (const transfer of transfers) {
      const eventLog = transfer as ethers.EventLog;
      const txHash = transfer.transactionHash;

      // Check if already processed
      const existingTx = await Transaction.findOne({ txHash });
      if (existingTx) {
        console.log(`Already processed: ${txHash}`);
        continue;
      }

      // Get decimals from env
      let usdtDecimals = 6;
      if (networkKey === 'bsc') {
        usdtDecimals = NETWORK_MODE === 'testnet' 
          ? parseInt(process.env.TESTNET_USDT_BEP20_DECIMAL || '18')
          : parseInt(process.env.USDT_BEP20_DECIMAL || '18');
      } else if (networkKey === 'ethereum') {
        usdtDecimals = NETWORK_MODE === 'testnet'
          ? parseInt(process.env.TESTNET_USDT_ERC20_DECIMAL || '18')
          : parseInt(process.env.USDT_ERC20_DECIMAL || '6');
      }

      const amount = eventLog.args?.[2] ? parseFloat(ethers.formatUnits(eventLog.args[2], usdtDecimals)) : 0;

      console.log(`✅ NEW DEPOSIT: ${amount} USDT (${txHash})`);

      // Create transaction record
      const newTransaction = new Transaction({
        userId: user._id,
        userEmail: user.email,
        network: networkKey === 'bsc' ? 'BEP20' : 'ERC20', // Fix: Use correct enum values
        txHash,
        amount,
        status: 'confirmed',
        walletAddress: userAddress.toLowerCase(), // Fix: Add required walletAddress field
        fromAddress: eventLog.args?.[0] || 'unknown',
        toAddress: userAddress.toLowerCase(),
        blockNumber: transfer.blockNumber,
        createdAt: new Date()
      });

      await newTransaction.save();

      // Update user balance for current network
      const balanceUpdate = createBalanceUpdate(amount);
      await User.findByIdAndUpdate(user._id, balanceUpdate);

      deposits.push({
        txHash,
        amount,
        network: config.name, // Display name for frontend
        blockNumber: transfer.blockNumber
      });

      totalAmount += amount;
    }

    return { deposits, totalAmount };
  } catch (error) {
    // Re-throw to be caught by caller
    throw error;
  }
}
