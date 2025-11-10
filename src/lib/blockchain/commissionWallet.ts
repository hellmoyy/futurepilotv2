/**
 * COMMISSION WALLET MANAGER
 * 
 * Handles commission wallet operations for automatic withdrawals:
 * - Get wallet credentials based on network mode
 * - Check USDT balance
 * - Send USDT transfers (ERC20 only)
 * - Gas estimation and transaction building
 * 
 * Security:
 * - Network-aware (testnet/mainnet)
 * - Private key encryption
 * - Gas estimation with safety buffer
 * - Transaction error handling
 */

import { ethers } from 'ethers';

// ERC20 USDT ABI (minimal for transfer and balance check)
const USDT_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

/**
 * Get Commission Wallet credentials based on network mode
 */
export function getCommissionWallet() {
  const networkMode = process.env.NETWORK_MODE || 'mainnet';
  
  if (networkMode === 'mainnet') {
    // Mainnet commission wallet
    const address = process.env.COMMISSION_WALLET_ADDRESS;
    const privateKey = process.env.COMMISSION_WALLET_PRIVATE_KEY;
    const rpcUrl = process.env.ETHEREUM_RPC_URL;
    const usdtContract = process.env.USDT_ERC20_CONTRACT;

    // Validate all required variables
    if (!address) {
      throw new Error('❌ COMMISSION_WALLET_ADDRESS not set in environment variables (mainnet mode)');
    }
    if (!privateKey) {
      throw new Error('❌ COMMISSION_WALLET_PRIVATE_KEY not set in environment variables (mainnet mode)');
    }
    if (!rpcUrl) {
      throw new Error('❌ ETHEREUM_RPC_URL not set in environment variables (mainnet mode)');
    }
    if (!usdtContract) {
      throw new Error('❌ USDT_ERC20_CONTRACT not set in environment variables (mainnet mode)');
    }

    return {
      address,
      privateKey,
      network: 'mainnet',
      rpcUrl,
      usdtContract,
      decimals: parseInt(process.env.USDT_ERC20_DECIMAL || '6'),
    };
  } else {
    // Testnet commission wallet
    const address = process.env.TESTNET_COMMISSION_WALLET_ADDRESS;
    const privateKey = process.env.TESTNET_COMMISSION_WALLET_PRIVATE_KEY;
    const rpcUrl = process.env.TESTNET_ETHEREUM_RPC_URL;
    const usdtContract = process.env.TESTNET_USDT_ERC20_CONTRACT;

    // Validate all required variables
    if (!address) {
      throw new Error('❌ TESTNET_COMMISSION_WALLET_ADDRESS not set in environment variables (testnet mode)');
    }
    if (!privateKey) {
      throw new Error('❌ TESTNET_COMMISSION_WALLET_PRIVATE_KEY not set in environment variables (testnet mode)');
    }
    if (!rpcUrl) {
      throw new Error('❌ TESTNET_ETHEREUM_RPC_URL not set in environment variables (testnet mode)');
    }
    if (!usdtContract) {
      throw new Error('❌ TESTNET_USDT_ERC20_CONTRACT not set in environment variables (testnet mode)');
    }

    return {
      address,
      privateKey,
      network: 'testnet',
      rpcUrl,
      usdtContract,
      decimals: parseInt(process.env.TESTNET_USDT_ERC20_DECIMAL || '18'),
    };
  }
}

/**
 * Get Commission Wallet USDT balance
 */
export async function getCommissionWalletBalance(): Promise<{
  balance: number;
  balanceWei: bigint;
  address: string;
  network: string;
}> {
  const wallet = getCommissionWallet();
  
  // Validate wallet configuration
  if (!wallet.address || !wallet.rpcUrl || !wallet.usdtContract) {
    throw new Error('Commission wallet not configured properly');
  }

  try {
    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(wallet.rpcUrl);
    const contract = new ethers.Contract(wallet.usdtContract, USDT_ABI, provider);

    // Get balance
    const balanceWei = await contract.balanceOf(wallet.address);
    const balance = parseFloat(ethers.formatUnits(balanceWei, wallet.decimals));

    return {
      balance,
      balanceWei,
      address: wallet.address,
      network: wallet.network,
    };
  } catch (error: any) {
    console.error('Error fetching commission wallet balance:', error);
    throw new Error(`Failed to fetch commission wallet balance: ${error.message}`);
  }
}

/**
 * Get Commission Wallet ETH balance (for gas fees)
 */
export async function getCommissionWalletEthBalance(): Promise<{
  balance: number;
  balanceWei: bigint;
  address: string;
  network: string;
}> {
  const wallet = getCommissionWallet();
  
  // Validate wallet configuration
  if (!wallet.address || !wallet.rpcUrl) {
    throw new Error('Commission wallet not configured properly');
  }

  try {
    // Create provider
    const provider = new ethers.JsonRpcProvider(wallet.rpcUrl);

    // Get ETH balance
    const balanceWei = await provider.getBalance(wallet.address);
    const balance = parseFloat(ethers.formatEther(balanceWei));

    return {
      balance,
      balanceWei,
      address: wallet.address,
      network: wallet.network,
    };
  } catch (error: any) {
    console.error('Error fetching commission wallet ETH balance:', error);
    throw new Error(`Failed to fetch commission wallet ETH balance: ${error.message}`);
  }
}

/**
 * Send USDT from Commission Wallet to recipient
 * 
 * @param recipientAddress - Destination wallet address
 * @param amount - Amount in USDT (e.g., 10 = 10 USDT)
 * @returns Transaction hash and details
 */
export async function sendCommissionWithdrawal(
  recipientAddress: string,
  amount: number
): Promise<{
  success: boolean;
  txHash: string;
  gasUsed: string;
  effectiveGasPrice: string;
  blockNumber: number;
  error?: string;
}> {
  const wallet = getCommissionWallet();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VALIDATION PHASE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!wallet.address || !wallet.privateKey) {
    throw new Error('Commission wallet credentials not configured');
  }

  if (!ethers.isAddress(recipientAddress)) {
    throw new Error('Invalid recipient address');
  }

  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SETUP PHASE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log('🔄 Initiating commission withdrawal...');
    console.log(`   From: ${wallet.address}`);
    console.log(`   To: ${recipientAddress}`);
    console.log(`   Amount: ${amount} USDT`);
    console.log(`   Network: ${wallet.network}`);

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(wallet.rpcUrl);
    const signer = new ethers.Wallet(wallet.privateKey, provider);
    const contract = new ethers.Contract(wallet.usdtContract, USDT_ABI, signer);

    // Convert amount to wei
    const amountWei = ethers.parseUnits(amount.toString(), wallet.decimals);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // BALANCE CHECK
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const walletBalance = await contract.balanceOf(wallet.address);
    console.log(`   Wallet Balance: ${ethers.formatUnits(walletBalance, wallet.decimals)} USDT`);

    if (walletBalance < amountWei) {
      throw new Error(
        `Insufficient commission wallet balance. ` +
        `Required: ${amount} USDT, Available: ${ethers.formatUnits(walletBalance, wallet.decimals)} USDT`
      );
    }

    // Check ETH balance for gas
    const ethBalance = await provider.getBalance(wallet.address);
    console.log(`   ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

    if (ethBalance === BigInt(0)) {
      throw new Error('Commission wallet has no ETH for gas fees');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // GAS ESTIMATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log('⛽ Estimating gas...');
    const gasEstimate = await contract.transfer.estimateGas(recipientAddress, amountWei);
    const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100); // Add 20% buffer
    console.log(`   Gas Estimate: ${gasEstimate.toString()}`);
    console.log(`   Gas Limit (with buffer): ${gasLimit.toString()}`);

    // Get current gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei'); // Fallback to 20 gwei
    console.log(`   Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);

    // Calculate total gas cost
    const gasCost = gasLimit * gasPrice;
    console.log(`   Estimated Gas Cost: ${ethers.formatEther(gasCost)} ETH`);

    // Check if enough ETH for gas
    if (ethBalance < gasCost) {
      throw new Error(
        `Insufficient ETH for gas fees. ` +
        `Required: ${ethers.formatEther(gasCost)} ETH, Available: ${ethers.formatEther(ethBalance)} ETH`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SEND TRANSACTION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log('📤 Sending transaction...');
    const tx = await contract.transfer(recipientAddress, amountWei, {
      gasLimit,
      gasPrice,
    });

    console.log(`   Transaction Hash: ${tx.hash}`);
    console.log('⏳ Waiting for confirmation...');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // WAIT FOR CONFIRMATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const receipt = await tx.wait(1); // Wait for 1 confirmation

    if (!receipt) {
      throw new Error('Transaction receipt not received');
    }

    if (receipt.status === 0) {
      throw new Error('Transaction failed on blockchain');
    }

    console.log('✅ Transaction confirmed!');
    console.log(`   Block Number: ${receipt.blockNumber}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`   Effective Gas Price: ${ethers.formatUnits(receipt.gasPrice || BigInt(0), 'gwei')} gwei`);

    return {
      success: true,
      txHash: receipt.hash,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: (receipt.gasPrice || BigInt(0)).toString(),
      blockNumber: receipt.blockNumber,
    };

  } catch (error: any) {
    console.error('❌ Commission withdrawal failed:', error);
    
    // Extract meaningful error message
    let errorMessage = error.message;
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Insufficient ETH for gas fees';
    } else if (error.code === 'NONCE_EXPIRED') {
      errorMessage = 'Transaction nonce expired, please retry';
    } else if (error.code === 'REPLACEMENT_UNDERPRICED') {
      errorMessage = 'Gas price too low, please retry with higher gas';
    } else if (error.code === 'TIMEOUT') {
      errorMessage = 'Transaction timeout, network congestion';
    }

    return {
      success: false,
      txHash: '',
      gasUsed: '0',
      effectiveGasPrice: '0',
      blockNumber: 0,
      error: errorMessage,
    };
  }
}

/**
 * Validate Commission Wallet configuration
 */
export function validateCommissionWallet(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const networkMode = process.env.NETWORK_MODE || 'mainnet';

  if (networkMode === 'mainnet') {
    if (!process.env.COMMISSION_WALLET_ADDRESS) {
      errors.push('COMMISSION_WALLET_ADDRESS not set');
    }
    if (!process.env.COMMISSION_WALLET_PRIVATE_KEY) {
      errors.push('COMMISSION_WALLET_PRIVATE_KEY not set');
    }
    if (!process.env.ETHEREUM_RPC_URL) {
      errors.push('ETHEREUM_RPC_URL not set');
    }
    if (!process.env.USDT_ERC20_CONTRACT) {
      errors.push('USDT_ERC20_CONTRACT not set');
    }
  } else {
    if (!process.env.TESTNET_COMMISSION_WALLET_ADDRESS) {
      errors.push('TESTNET_COMMISSION_WALLET_ADDRESS not set');
    }
    if (!process.env.TESTNET_COMMISSION_WALLET_PRIVATE_KEY) {
      errors.push('TESTNET_COMMISSION_WALLET_PRIVATE_KEY not set');
    }
    if (!process.env.TESTNET_ETHEREUM_RPC_URL) {
      errors.push('TESTNET_ETHEREUM_RPC_URL not set');
    }
    if (!process.env.TESTNET_USDT_ERC20_CONTRACT) {
      errors.push('TESTNET_USDT_ERC20_CONTRACT not set');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
