import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { ethers } from 'ethers';
import crypto from 'crypto';

/**
 * Sweep User Wallets to Master Wallet
 * Admin endpoint untuk collect semua USDT dari user wallets ke master wallet
 */

// Encryption functions (same as in wallet/generate)
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET_KEY || '';
const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedData = parts.join(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ERC-20/BEP-20 Token ABI for transfer function
const TOKEN_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

type TokenType = 'USDT' | 'NATIVE' | 'CUSTOM';

interface SweepResult {
  userId: string;
  userEmail: string;
  walletAddress: string;
  balance: string;
  sweptAmount: string;
  txHash: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  tokenType: TokenType;
  tokenSymbol?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify admin
    if (session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      network = 'BSC_TESTNET', 
      minAmount = 10,
      tokenType = 'USDT' as TokenType,
      customTokenAddress 
    } = body;

    // Validate token type
    if (!['USDT', 'NATIVE', 'CUSTOM'].includes(tokenType)) {
      return NextResponse.json(
        { error: 'Invalid token type. Must be USDT, NATIVE, or CUSTOM' },
        { status: 400 }
      );
    }

    // Validate custom token address if CUSTOM type
    if (tokenType === 'CUSTOM' && !customTokenAddress) {
      return NextResponse.json(
        { error: 'Custom token address is required for CUSTOM token type' },
        { status: 400 }
      );
    }

    // Validate ethereum address format for custom token
    if (tokenType === 'CUSTOM' && !ethers.isAddress(customTokenAddress)) {
      return NextResponse.json(
        { error: 'Invalid custom token address format' },
        { status: 400 }
      );
    }

    // Validate network based on NETWORK_MODE
    const networkMode = process.env.NETWORK_MODE || 'testnet';
    const availableNetworks = networkMode === 'mainnet' 
      ? ['BSC_MAINNET', 'ETHEREUM_MAINNET']
      : ['BSC_TESTNET', 'ETHEREUM_TESTNET'];
    
    if (!availableNetworks.includes(network)) {
      return NextResponse.json(
        { 
          error: `Invalid network for ${networkMode} mode`, 
          availableNetworks,
          currentMode: networkMode,
          providedNetwork: network
        },
        { status: 400 }
      );
    }

    console.log('🔄 Starting wallet sweep...');
    console.log('Network:', network);
    console.log('Network Mode:', networkMode);
    console.log('Token Type:', tokenType);
    console.log('Min amount:', minAmount);
    if (tokenType === 'CUSTOM') {
      console.log('Custom Token:', customTokenAddress);
    }

    // Master wallet config
    const MASTER_WALLET_PRIVATE_KEY = process.env.MASTER_WALLET_PRIVATE_KEY;
    const MASTER_WALLET_ADDRESS = process.env.MASTER_WALLET_ADDRESS;

    if (!MASTER_WALLET_PRIVATE_KEY || !MASTER_WALLET_ADDRESS) {
      return NextResponse.json(
        { error: 'Master wallet not configured' },
        { status: 500 }
      );
    }

    // Network configuration (4 networks)
    const networkConfig = {
      // Mainnet
      BSC_MAINNET: {
        name: 'BSC Mainnet',
        rpc: process.env.BSC_RPC_URL,
        usdtContract: process.env.USDT_BEP20_CONTRACT,
        chainId: 56,
        explorer: 'https://bscscan.com',
      },
      ETHEREUM_MAINNET: {
        name: 'Ethereum Mainnet',
        rpc: process.env.ETHEREUM_RPC_URL,
        usdtContract: process.env.USDT_ERC20_CONTRACT,
        chainId: 1,
        explorer: 'https://etherscan.io',
      },
      // Testnet
      BSC_TESTNET: {
        name: 'BSC Testnet',
        rpc: process.env.TESTNET_BSC_RPC_URL,
        usdtContract: process.env.TESTNET_USDT_BEP20_CONTRACT,
        chainId: 97,
        explorer: 'https://testnet.bscscan.com',
      },
      ETHEREUM_TESTNET: {
        name: 'Ethereum Sepolia',
        rpc: process.env.TESTNET_ETHEREUM_RPC_URL,
        usdtContract: process.env.TESTNET_USDT_ERC20_CONTRACT,
        chainId: 11155111,
        explorer: 'https://sepolia.etherscan.io',
      },
    };

    const config = networkConfig[network as keyof typeof networkConfig];
    if (!config) {
      return NextResponse.json(
        { error: 'Invalid network' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get all users with wallets
    const users = await User.find({
      'walletData.encryptedPrivateKey': { $exists: true }
    }).select('email walletData');

    console.log(`📊 Found ${users.length} users with wallets`);

    const provider = new ethers.JsonRpcProvider(config.rpc);
    
    // Setup contract based on token type
    let tokenContract: ethers.Contract | null = null;
    let tokenSymbol = '';
    let tokenDecimals = 18;

    if (tokenType === 'USDT') {
      tokenContract = new ethers.Contract(config.usdtContract!, TOKEN_ABI, provider);
      tokenSymbol = 'USDT';
      tokenDecimals = 6;
    } else if (tokenType === 'CUSTOM') {
      tokenContract = new ethers.Contract(customTokenAddress, TOKEN_ABI, provider);
      try {
        tokenSymbol = await tokenContract.symbol();
        tokenDecimals = Number(await tokenContract.decimals());
        console.log(`🔧 Custom Token: ${tokenSymbol} (${tokenDecimals} decimals)`);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid custom token contract. Cannot read token info.' },
          { status: 400 }
        );
      }
    } else if (tokenType === 'NATIVE') {
      // Native tokens (BNB/ETH) don't need contract
      tokenSymbol = network.includes('BSC') ? 'BNB' : 'ETH';
      tokenDecimals = 18;
    }

    const results: SweepResult[] = [];
    let totalSwept = 0;

    // Process each user wallet
    for (const user of users) {
      try {
        if (!user.walletData) {
          continue;
        }

        const walletAddress = user.walletData.bep20Address; // works for both BEP-20 and ERC-20
        const encryptedPrivateKey = user.walletData.encryptedPrivateKey;

        console.log(`\n💼 Processing: ${user.email} (${walletAddress})`);

        let balance = BigInt(0);
        let balanceFormatted = 0;

        // Get balance based on token type
        if (tokenType === 'NATIVE') {
          // Native token balance (BNB/ETH)
          balance = await provider.getBalance(walletAddress);
          balanceFormatted = parseFloat(ethers.formatEther(balance));
          console.log(`   ${tokenSymbol} Balance: ${balanceFormatted}`);
        } else if (tokenContract) {
          // ERC-20/BEP-20 token balance (USDT or Custom)
          balance = await tokenContract.balanceOf(walletAddress);
          balanceFormatted = parseFloat(ethers.formatUnits(balance, tokenDecimals));
          console.log(`   ${tokenSymbol} Balance: ${balanceFormatted}`);
        }

        // Skip if balance too low
        if (balanceFormatted < minAmount) {
          console.log(`   ⏭️  Skipped (below minimum ${minAmount})`);
          results.push({
            userId: String(user._id),
            userEmail: user.email,
            walletAddress,
            balance: balanceFormatted.toString(),
            sweptAmount: '0',
            txHash: '',
            status: 'skipped',
            tokenType,
            tokenSymbol,
          });
          continue;
        }

        // Decrypt private key
        const privateKey = decrypt(encryptedPrivateKey);
        const userWallet = new ethers.Wallet(privateKey, provider);

        // Check native token balance for gas (if sweeping non-native)
        if (tokenType !== 'NATIVE') {
          const nativeBalance = await provider.getBalance(walletAddress);
          const nativeBalanceFormatted = parseFloat(ethers.formatEther(nativeBalance));

          console.log(`   Gas Balance: ${nativeBalanceFormatted} ${network.includes('BSC') ? 'BNB' : 'ETH'}`);

          if (nativeBalanceFormatted < 0.001) {
            console.log(`   ❌ Insufficient gas (need 0.001 ${network.includes('BSC') ? 'BNB' : 'ETH'})`);
            results.push({
              userId: String(user._id),
              userEmail: user.email,
              walletAddress,
              balance: balanceFormatted.toString(),
              sweptAmount: '0',
              txHash: '',
              status: 'failed',
              error: 'Insufficient gas',
              tokenType,
              tokenSymbol,
            });
            continue;
          }
        }

        // Transfer tokens to master wallet
        console.log(`   📤 Sweeping ${balanceFormatted} ${tokenSymbol} to master...`);
        
        let tx: ethers.TransactionResponse;

        if (tokenType === 'NATIVE') {
          // Native token transfer (BNB/ETH)
          // Reserve 0.001 for gas
          const gasReserve = ethers.parseEther('0.001');
          const amountToSweep = balance > gasReserve ? balance - gasReserve : BigInt(0);

          if (amountToSweep <= BigInt(0)) {
            console.log(`   ❌ Balance too low to cover gas reserve`);
            results.push({
              userId: String(user._id),
              userEmail: user.email,
              walletAddress,
              balance: balanceFormatted.toString(),
              sweptAmount: '0',
              txHash: '',
              status: 'failed',
              error: 'Balance too low to cover gas',
              tokenType,
              tokenSymbol,
            });
            continue;
          }

          tx = await userWallet.sendTransaction({
            to: MASTER_WALLET_ADDRESS,
            value: amountToSweep,
          });

          balanceFormatted = parseFloat(ethers.formatEther(amountToSweep));

        } else if (tokenContract) {
          // ERC-20/BEP-20 token transfer (USDT or Custom)
          const tokenContractWithSigner = tokenContract.connect(userWallet) as ethers.Contract;
          tx = await tokenContractWithSigner.transfer(
            MASTER_WALLET_ADDRESS,
            balance
          ) as ethers.TransactionResponse;
        } else {
          throw new Error('Invalid token configuration');
        }

        console.log(`   ⏳ Transaction sent: ${tx.hash}`);
        console.log(`   ⏳ Waiting for confirmation...`);

        const receipt = await tx.wait();

        if (!receipt) {
          throw new Error('Transaction failed');
        }

        console.log(`   ✅ Confirmed! Block: ${receipt.blockNumber}`);

        totalSwept += balanceFormatted;

        results.push({
          userId: String(user._id),
          userEmail: user.email,
          walletAddress,
          balance: balanceFormatted.toString(),
          sweptAmount: balanceFormatted.toString(),
          txHash: tx.hash,
          status: 'success',
          tokenType,
          tokenSymbol,
        });

      } catch (error) {
        console.error(`   ❌ Error processing ${user.email}:`, error);
        results.push({
          userId: String(user._id),
          userEmail: user.email,
          walletAddress: user.walletData?.bep20Address || '',
          balance: '0',
          sweptAmount: '0',
          txHash: '',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          tokenType,
          tokenSymbol,
        });
      }
    }

    const summary = {
      total: users.length,
      success: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      totalSwept: totalSwept,
      tokenType,
      tokenSymbol,
      masterWallet: MASTER_WALLET_ADDRESS,
      network,
    };

    console.log('\n🎉 Sweep completed!');
    console.log('Summary:', summary);

    return NextResponse.json({
      success: true,
      message: 'Wallet sweep completed',
      summary,
      results,
    });

  } catch (error) {
    console.error('❌ Sweep error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Sweep failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for sweep status/info
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const MASTER_WALLET_ADDRESS = process.env.MASTER_WALLET_ADDRESS;

    await connectDB();

    const users = await User.find({
      'walletData.encryptedPrivateKey': { $exists: true }
    }).select('email walletData');

    const totalUsers = users.length;
    const totalBalance = users.reduce((sum, user) => sum + (user.walletData?.balance || 0), 0);

    return NextResponse.json({
      masterWallet: MASTER_WALLET_ADDRESS,
      totalUsers,
      totalDatabaseBalance: totalBalance,
      message: 'Ready to sweep',
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get sweep info' },
      { status: 500 }
    );
  }
}
