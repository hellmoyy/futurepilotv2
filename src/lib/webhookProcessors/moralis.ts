/**
 * Moralis Webhook Payload Processor
 * 
 * Extracted logic for processing Moralis webhooks
 * Used by both the main webhook route and retry system
 */

import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';
import { getUserBalance } from '@/lib/network-balance';

interface MoralisERC20Transfer {
  transactionHash: string;
  contract: string;
  from: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  valueWithDecimals: string;
}

interface MoralisWebhookPayload {
  confirmed: boolean;
  chainId: string;
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

// USDT Contract Addresses (Mainnet only)
const USDT_CONTRACTS = {
  ETHEREUM_MAINNET: process.env.USDT_ERC20_CONTRACT?.toLowerCase() || '0xdac17f958d2ee523a2206206994597c13d831ec7',
  BSC_MAINNET: process.env.USDT_BEP20_CONTRACT?.toLowerCase() || '0x55d398326f99059ff775485246999027b3197955',
};

const CHAIN_NETWORKS = {
  '0x1': 'ERC20',    // Ethereum Mainnet
  '0x38': 'BEP20',   // BSC Mainnet
} as const;

/**
 * Process Moralis webhook payload
 * Can be called from both the main route and retry system
 */
export async function processMoralisWebhookPayload(payload: MoralisWebhookPayload): Promise<void> {
  await connectDB();
  
  console.log('📦 Processing Moralis webhook payload:', {
    confirmed: payload.confirmed,
    chainId: payload.chainId,
    streamId: payload.streamId,
    transfersCount: payload.erc20Transfers?.length || 0,
  });
  
  // Only process confirmed transactions
  if (!payload.confirmed) {
    throw new Error('Transaction not confirmed yet');
  }
  
  // Check if we have ERC20 transfers
  if (!payload.erc20Transfers || payload.erc20Transfers.length === 0) {
    throw new Error('No ERC20 transfers in webhook');
  }
  
  const results = {
    processed: 0,
    skipped: 0,
    errors: 0
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
      
      // Verify it's a USDT transfer (mainnet only)
      const contractAddress = transfer.contract.toLowerCase();
      const isUSDT = contractAddress === USDT_CONTRACTS.ETHEREUM_MAINNET || 
                     contractAddress === USDT_CONTRACTS.BSC_MAINNET;
      
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
      
      // Determine network type
      const networkType = CHAIN_NETWORKS[payload.chainId as keyof typeof CHAIN_NETWORKS] || 'ERC20';
      
      // Parse amount
      const amount = parseFloat(transfer.valueWithDecimals);
      
      if (isNaN(amount) || amount <= 0) {
        console.log('⚠️ Invalid amount:', transfer.valueWithDecimals);
        results.skipped++;
        continue;
      }
      
      // Update user balance
      const currentBalance = getUserBalance(user);
      const newBalance = currentBalance + amount;
      
      // Create transaction record
      const transaction = new Transaction({
        user: user._id,
        type: 'deposit',
        amount: amount,
        status: 'confirmed',
        source: networkType,
        txHash: transfer.transactionHash,
        metadata: {
          from: transfer.from,
          to: transfer.to,
          contract: transfer.contract,
          blockNumber: payload.block.number,
          blockHash: payload.block.hash,
          timestamp: payload.block.timestamp,
          chainId: payload.chainId,
        }
      });
      
      await transaction.save();
      
      // Update user's wallet balance (mainnet only)
      user.set('walletData.mainnetBalance', newBalance);
      await user.save();
      
      console.log('✅ Deposit processed successfully:', {
        user: user.email,
        amount: amount,
        txHash: transfer.transactionHash,
        oldBalance: currentBalance,
        newBalance: newBalance
      });
      
      results.processed++;
      
      // TODO: Send notification to user
      
    } catch (error) {
      console.error('❌ Error processing transfer:', error);
      results.errors++;
    }
  }
  
  console.log('📊 Processing complete:', results);
  
  if (results.processed === 0 && results.errors > 0) {
    throw new Error(`Failed to process any transfers: ${results.errors} errors`);
  }
}
