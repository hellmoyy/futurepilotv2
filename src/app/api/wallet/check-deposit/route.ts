import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';
import { ethers } from 'ethers';
import { createBalanceUpdate, getUserBalance } from '@/lib/network-balance';
import { calculateReferralCommission } from '@/lib/referralCommission';
import { notificationManager } from '@/lib/notifications/NotificationManager';
import { Settings } from '@/models/Settings';

const USDT_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

// ✅ MAINNET ONLY - Network configurations
const NETWORKS = {
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
};

// ✅ NOTE: Now using centralized rate limiter from @/lib/rateLimit
// Old local implementation removed to avoid duplication

export async function POST(request: NextRequest) {
  try {
    // ✅ CSRF Protection
    const { validateCSRF } = await import('@/lib/csrf');
    if (!validateCSRF(request)) {
      return NextResponse.json(
        { error: 'CSRF validation failed. Request origin not allowed.' },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // ✅ CRITICAL: Rate limiting using centralized limiter
    const rateLimiter = (await import('@/lib/rateLimit')).default;
    const { RateLimitConfigs } = await import('@/lib/rateLimit');
    const rateLimitResult = rateLimiter.check(
      session.user.email,
      RateLimitConfigs.DEPOSIT_CHECK
    );

    if (!rateLimitResult.allowed) {
      const waitTime = rateLimitResult.retryAfter 
        ? Math.ceil(rateLimitResult.retryAfter / 1000) 
        : 5;
      
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. Please wait ${waitTime} seconds before checking again.`,
          retryAfter: waitTime,
          rateLimitExceeded: true 
        },
        { status: 429 }
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
          NETWORKS.bsc,
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
          NETWORKS.ethereum,
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

      // Get decimals from env (mainnet only)
      let usdtDecimals = 6;
      if (networkKey === 'bsc') {
        usdtDecimals = parseInt(process.env.USDT_BEP20_DECIMAL || '18');
      } else if (networkKey === 'ethereum') {
        usdtDecimals = parseInt(process.env.USDT_ERC20_DECIMAL || '6');
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

      // ✅ CRITICAL: Calculate TOTAL PERSONAL DEPOSIT from SUM of all confirmed deposits
      // This ensures accuracy even if webhook/cron missed some deposits
      const depositSum = await Transaction.aggregate([
        {
          $match: {
            userId: user._id,
            type: { $in: ['deposit', undefined] }, // Include undefined for old records
            status: 'confirmed',
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const previousDeposit = user.totalPersonalDeposit || 0;
      const newTotalDeposit = depositSum.length > 0 ? depositSum[0].total : 0;
      
      console.log(`📊 [DEPOSIT DETECTION] User: ${user.email}`);
      console.log(`   Previous total: $${previousDeposit}`);
      console.log(`   Calculated from DB: $${newTotalDeposit}`);
      console.log(`   Current deposit: $${amount}`);
      
      // Calculate previous tier before update
      const previousTier = !user.tierSetManually 
        ? (previousDeposit >= 10000 ? 'platinum' 
          : previousDeposit >= 2000 ? 'gold' 
          : previousDeposit >= 1000 ? 'silver' 
          : 'bronze')
        : user.membershipLevel;

      // Auto-upgrade tier based on total deposit (only if NOT manually set by admin)
      let tierUpgraded = false;
      let newTier = previousTier;
      
      if (!user.tierSetManually) {
        if (newTotalDeposit >= 10000) {
          newTier = 'platinum';
        } else if (newTotalDeposit >= 2000) {
          newTier = 'gold';
        } else if (newTotalDeposit >= 1000) {
          newTier = 'silver';
        } else {
          newTier = 'bronze';
        }
        
        // Check if tier changed
        if (newTier !== previousTier) {
          tierUpgraded = true;
        }
      }

      // Update totalPersonalDeposit and tier (if upgraded)
      const updateData: any = { totalPersonalDeposit: newTotalDeposit };
      if (tierUpgraded) {
        updateData.membershipLevel = newTier;
      }
      await User.findByIdAndUpdate(user._id, { $set: updateData });

      // Update user object for commission calculation
      user.totalPersonalDeposit = newTotalDeposit;
      if (tierUpgraded) {
        user.membershipLevel = newTier;
      }

      // Send tier upgrade notification if tier changed
      if (tierUpgraded) {
        try {
          // Get commission rates from settings
          const settings = await Settings.findOne();
          const tierRates = settings?.tierCommissionRates || {
            bronze: { level1: 10, level2: 5, level3: 5 },
            silver: { level1: 20, level2: 5, level3: 5 },
            gold: { level1: 30, level2: 5, level3: 5 },
            platinum: { level1: 40, level2: 5, level3: 5 },
          };

          const oldRates = tierRates[previousTier as keyof typeof tierRates] || { level1: 10, level2: 5, level3: 5 };
          const newRates = tierRates[newTier as keyof typeof tierRates] || { level1: 10, level2: 5, level3: 5 };

          await notificationManager.notifyTierUpgrade(
            (user._id as any).toString(),
            previousTier || 'bronze',
            newTier || 'bronze',
            newTotalDeposit,
            oldRates,
            newRates
          );
          
          console.log(`✅ Tier upgrade notification sent: ${previousTier} → ${newTier}`);
        } catch (notificationError) {
          console.error('❌ Error sending tier upgrade notification:', notificationError);
          // Don't fail the deposit if notification fails
        }
      }

      // ✅ CRITICAL: Calculate referral commission from FULL deposit amount
      try {
        await calculateReferralCommission({
          userId: user._id as any,
          amount: amount, // Full deposit amount
          source: 'gas_fee_topup',
          sourceTransactionId: newTransaction._id as any,
          notes: `Gas fee topup commission from $${amount.toFixed(2)} deposit (${config.name})`,
        });
        console.log(`✅ Referral commission calculated for deposit: $${amount.toFixed(2)}`);
      } catch (commissionError: any) {
        console.error('❌ CRITICAL: Error calculating referral commission:', commissionError);
        console.error('   User:', user.email);
        console.error('   Amount:', amount);
        console.error('   TxHash:', txHash);
        console.error('   Stack:', commissionError.stack);
        // Don't fail the deposit if commission calculation fails
        // But log extensively for debugging
      }

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
