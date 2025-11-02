import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';

/**
 * Moralis Webhook Handler
 * Receives real-time notifications when USDT transfers occur
 * 
 * Moralis will POST to this endpoint when:
 * - User receives USDT on their ERC-20 address
 * - User receives USDT on their BEP-20 address
 */

interface MoralisERC20Transfer {
  transactionHash: string;
  contract: string; // USDT contract address
  from: string;
  to: string; // User's wallet address
  value: string; // Amount in smallest unit (6 decimals for USDT)
  tokenName: string;
  tokenSymbol: string;
  valueWithDecimals: string;
}

interface MoralisWebhookPayload {
  confirmed: boolean;
  chainId: string; // "0x1" for Ethereum, "0x38" for BSC
  abi: any[];
  streamId: string;
  tag: string;
  retries: number;
  block: {
    number: string;
    hash: string;
    timestamp: string;
  };
  logs: any[];
  txs: any[];
  erc20Transfers: MoralisERC20Transfer[];
}

// USDT Contract Addresses (support both mainnet and testnet)
const USDT_CONTRACTS = {
  // Mainnet
  ETHEREUM_MAINNET: process.env.USDT_ERC20_CONTRACT?.toLowerCase() || '0xdac17f958d2ee523a2206206994597c13d831ec7',
  BSC_MAINNET: process.env.USDT_BEP20_CONTRACT?.toLowerCase() || '0x55d398326f99059ff775485246999027b3197955',
  // Testnet
  ETHEREUM_TESTNET: process.env.TESTNET_USDT_ERC20_CONTRACT?.toLowerCase() || '0x46484aee842a735fbf4c05af7e371792cf52b498',
  BSC_TESTNET: process.env.TESTNET_USDT_BEP20_CONTRACT?.toLowerCase() || '0x46484aee842a735fbf4c05af7e371792cf52b498',
};

// Chain ID mapping
const CHAIN_NETWORKS = {
  '0x1': 'ERC20', // Ethereum Mainnet
  '0x38': 'BEP20', // BSC Mainnet
  '0xaa36a7': 'ERC20', // Sepolia Testnet
  '0x61': 'BEP20', // BSC Testnet
} as const;

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Moralis webhook received');

    // Parse webhook payload
    const payload: MoralisWebhookPayload = await request.json();
    
    console.log('📦 Webhook payload:', {
      confirmed: payload.confirmed,
      chainId: payload.chainId,
      streamId: payload.streamId,
      transfersCount: payload.erc20Transfers?.length || 0,
    });

    // Only process confirmed transactions
    if (!payload.confirmed) {
      console.log('⏳ Transaction not confirmed yet, skipping...');
      return NextResponse.json({ 
        success: true, 
        message: 'Transaction not confirmed yet' 
      });
    }

    // Check if we have ERC20 transfers
    if (!payload.erc20Transfers || payload.erc20Transfers.length === 0) {
      console.log('⚠️ No ERC20 transfers in webhook');
      return NextResponse.json({ 
        success: true, 
        message: 'No ERC20 transfers found' 
      });
    }

    await connectDB();

    const results = {
      processed: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    };

    // Process each transfer
    for (const transfer of payload.erc20Transfers) {
      try {
        console.log('💸 Processing transfer:', {
          txHash: transfer.transactionHash,
          from: transfer.from,
          to: transfer.to,
          value: transfer.valueWithDecimals,
          contract: transfer.contract,
        });

        // Verify it's a USDT transfer (check all USDT contracts: mainnet + testnet)
        const contractAddress = transfer.contract.toLowerCase();
        const isUSDT = contractAddress === USDT_CONTRACTS.ETHEREUM_MAINNET || 
                       contractAddress === USDT_CONTRACTS.BSC_MAINNET ||
                       contractAddress === USDT_CONTRACTS.ETHEREUM_TESTNET ||
                       contractAddress === USDT_CONTRACTS.BSC_TESTNET;

        if (!isUSDT) {
          console.log('⚠️ Not a USDT transfer, skipping...', contractAddress);
          results.skipped++;
          continue;
        }

        // Find user by wallet address
        const recipientAddress = transfer.to.toLowerCase();
        const user = await User.findOne({
          $or: [
            { 'walletData.erc20Address': { $regex: new RegExp(`^${recipientAddress}$`, 'i') } },
            { 'walletData.bep20Address': { $regex: new RegExp(`^${recipientAddress}$`, 'i') } }
          ]
        });

        if (!user) {
          console.log('⚠️ User not found for address:', recipientAddress);
          results.skipped++;
          continue;
        }

        console.log('✅ User found:', user.email);

        // Check if transaction already exists
        const existingTx = await Transaction.findOne({ 
          txHash: transfer.transactionHash 
        });

        if (existingTx) {
          console.log('⚠️ Transaction already processed:', transfer.transactionHash);
          results.skipped++;
          continue;
        }

        // Determine network
        const network = CHAIN_NETWORKS[payload.chainId as keyof typeof CHAIN_NETWORKS] || 'ERC20';
        
        // Get decimals from env based on chain and network mode
        const NETWORK_MODE = process.env.NETWORK_MODE || 'testnet';
        let usdtDecimals = 6; // Default
        
        if (payload.chainId === '0x61' || payload.chainId === '0x38') {
          // BSC (Testnet or Mainnet)
          usdtDecimals = NETWORK_MODE === 'testnet'
            ? parseInt(process.env.TESTNET_USDT_BEP20_DECIMAL || '18')
            : parseInt(process.env.USDT_BEP20_DECIMAL || '18');
        } else if (payload.chainId === '0xaa36a7' || payload.chainId === '0x1') {
          // Ethereum (Testnet or Mainnet)
          usdtDecimals = NETWORK_MODE === 'testnet'
            ? parseInt(process.env.TESTNET_USDT_ERC20_DECIMAL || '18')
            : parseInt(process.env.USDT_ERC20_DECIMAL || '6');
        }

        // Parse amount - Moralis already provides valueWithDecimals formatted
        // But we verify with raw value if needed
        let amount: number;
        if (transfer.valueWithDecimals) {
          amount = parseFloat(transfer.valueWithDecimals);
        } else {
          // Fallback: calculate from raw value
          const rawValue = BigInt(transfer.value);
          const divisor = BigInt(10 ** usdtDecimals);
          amount = Number(rawValue) / Number(divisor);
        }

        console.log('💰 Processing deposit:', {
          user: user.email,
          amount,
          decimals: usdtDecimals,
          network,
          chainId: payload.chainId,
          txHash: transfer.transactionHash,
        });

        // Create transaction record
        const newTransaction = new Transaction({
          userId: user._id,
          network,
          txHash: transfer.transactionHash,
          amount,
          status: 'confirmed',
          blockNumber: parseInt(payload.block.number),
          walletAddress: recipientAddress,
        });

        await newTransaction.save();

        // Update user balance
        const previousBalance = user.walletData?.balance || 0;
        if (!user.walletData) {
          user.walletData = {
            erc20Address: recipientAddress,
            bep20Address: recipientAddress,
            encryptedPrivateKey: '',
            balance: amount,
            createdAt: new Date(),
          };
        } else {
          user.walletData.balance = previousBalance + amount;
        }
        await user.save();

        console.log('✅ Deposit processed successfully:', {
          user: user.email,
          previousBalance,
          newBalance: user.walletData.balance,
          depositAmount: amount,
        });

        results.processed++;
        results.details.push({
          txHash: transfer.transactionHash,
          user: user.email,
          amount,
          network,
          status: 'success'
        });

      } catch (error) {
        console.error('❌ Error processing transfer:', error);
        results.errors++;
        results.details.push({
          txHash: transfer.transactionHash,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'error'
        });
      }
    }

    console.log('📊 Webhook processing complete:', results);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
      results,
    });

  } catch (error) {
    console.error('❌ Moralis webhook error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET method for testing/health check
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Moralis webhook endpoint is active',
    timestamp: new Date().toISOString(),
    supportedNetworks: Object.keys(CHAIN_NETWORKS),
  });
}
