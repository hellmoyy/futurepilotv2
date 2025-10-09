import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';
import { ethers } from 'ethers';

// USDT Contract Addresses
const USDT_CONTRACTS = {
  ERC20: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Ethereum USDT
  BEP20: '0x55d398326f99059fF775485246999027B3197955', // BSC USDT
};

// RPC Providers (use your own RPC endpoints for production)
const PROVIDERS = {
  ERC20: new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'),
  BEP20: new ethers.JsonRpcProvider(process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/'),
};

// Simple USDT ABI (just the Transfer event)
const USDT_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

export async function POST(request: NextRequest) {
  try {
    const { network, txHash } = await request.json();

    if (!network || !txHash) {
      return NextResponse.json(
        { error: 'Network and transaction hash required' },
        { status: 400 }
      );
    }

    if (!['ERC20', 'BEP20'].includes(network)) {
      return NextResponse.json(
        { error: 'Invalid network. Must be ERC20 or BEP20' },
        { status: 400 }
      );
    }

    await connectDB();

    const provider = PROVIDERS[network as 'ERC20' | 'BEP20'];
    const usdtContract = new ethers.Contract(
      USDT_CONTRACTS[network as 'ERC20' | 'BEP20'],
      USDT_ABI,
      provider
    );

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Parse transfer events
    const transferEvents = receipt.logs
      .map(log => {
        try {
          return usdtContract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter(event => event && event.name === 'Transfer');

    if (transferEvents.length === 0) {
      return NextResponse.json(
        { error: 'No USDT transfer found in transaction' },
        { status: 404 }
      );
    }

    // Find transfers to our user wallets
    const processedTransfers = [];

    for (const event of transferEvents) {
      if (!event) continue;
      
      const toAddress = event.args.to.toLowerCase();
      const amount = parseFloat(ethers.formatUnits(event.args.value, 6)); // USDT has 6 decimals

      // Find user with this wallet address
      const user = await User.findOne({
        $or: [
          { 'walletData.erc20Address': { $regex: new RegExp(`^${toAddress}$`, 'i') } },
          { 'walletData.bep20Address': { $regex: new RegExp(`^${toAddress}$`, 'i') } }
        ]
      });

      if (user && amount > 0) {
        // Check if transaction already exists
        const existingTx = await Transaction.findOne({ txHash });
        
        if (!existingTx) {
          // Create new transaction record
          const transaction = new Transaction({
            userId: user._id,
            network,
            txHash,
            amount,
            status: receipt.status === 1 ? 'confirmed' : 'failed',
            blockNumber: receipt.blockNumber,
            walletAddress: toAddress,
          });

          await transaction.save();

          // Update user balance if confirmed
          if (receipt.status === 1) {
            await User.findByIdAndUpdate(user._id, {
              $inc: {
                'walletData.balance': amount,
                gasFeeBalance: amount // Also update gas fee balance
              }
            });

            console.log('✅ Balance updated for user:', user.email, '+$', amount);
          }

          processedTransfers.push({
            userEmail: user.email,
            amount,
            status: receipt.status === 1 ? 'confirmed' : 'failed'
          });
        } else {
          console.log('📋 Transaction already processed:', txHash);
        }
      }
    }

    return NextResponse.json({
      success: true,
      txHash,
      network,
      blockNumber: receipt.blockNumber,
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      processedTransfers
    });

  } catch (error) {
    console.error('❌ Error processing transaction:', error);
    return NextResponse.json(
      { error: 'Failed to process transaction' },
      { status: 500 }
    );
  }
}

// GET endpoint to manually check pending transactions
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const pendingTxs = await Transaction.find({ status: 'pending' })
      .populate('userId', 'email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      pendingTransactions: pendingTxs.length,
      transactions: pendingTxs.map(tx => ({
        id: tx._id,
        network: tx.network,
        txHash: tx.txHash,
        amount: tx.amount,
        userEmail: (tx.userId as any).email,
        createdAt: tx.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching pending transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending transactions' },
      { status: 500 }
    );
  }
}