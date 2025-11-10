import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { ethers } from 'ethers';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

/**
 * Scan All User USDT Balances from Blockchain
 * Admin endpoint to get real-time USDT balances for all users
 */

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
    const decoded = verify(token, secret) as any;

    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { networkMode } = body;
    const mode = networkMode || process.env.NETWORK_MODE || 'mainnet'; // Default to mainnet for production

    // Connect to database
    await connectDB();

    // Get all users with wallets
    const users = await User.find({
      'walletData.erc20Address': { $exists: true, $ne: null }
    }).select('email walletData.erc20Address walletData.bep20Address').lean();

    console.log(`📊 Scanning ${users.length} user wallets on ${mode}...`);

    // ✅ MAINNET ONLY configuration
    const ethProvider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    const bscProvider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
    const ethUsdtAddress = process.env.USDT_ERC20_CONTRACT!;
    const bscUsdtAddress = process.env.USDT_BEP20_CONTRACT!;
    const ethDecimals = parseInt(process.env.USDT_ERC20_DECIMAL || '6');
    const bscDecimals = parseInt(process.env.USDT_BEP20_DECIMAL || '18');

    // ERC20 ABI (balanceOf function)
    const erc20Abi = [
      'function balanceOf(address owner) view returns (uint256)'
    ];

    const ethUsdtContract = new ethers.Contract(ethUsdtAddress, erc20Abi, ethProvider);
    const bscUsdtContract = new ethers.Contract(bscUsdtAddress, erc20Abi, bscProvider);

    // Scan all user balances
    const userBalances: any[] = [];
    let erc20Total = 0;
    let bep20Total = 0;
    let erc20Count = 0;
    let bep20Count = 0;

    for (const user of users) {
      try {
        const erc20Address = (user as any).walletData?.erc20Address;
        const bep20Address = (user as any).walletData?.bep20Address;

        let erc20Balance = 0;
        let bep20Balance = 0;

        // Fetch ERC20 balance (Ethereum)
        if (erc20Address) {
          try {
            const balance = await ethUsdtContract.balanceOf(erc20Address);
            erc20Balance = parseFloat(ethers.formatUnits(balance, ethDecimals));
            if (erc20Balance > 0) erc20Count++;
          } catch (error) {
            console.error(`Error fetching ERC20 balance for ${erc20Address}:`, error);
          }
        }

        // Fetch BEP20 balance (BSC)
        if (bep20Address) {
          try {
            const balance = await bscUsdtContract.balanceOf(bep20Address);
            bep20Balance = parseFloat(ethers.formatUnits(balance, bscDecimals));
            if (bep20Balance > 0) bep20Count++;
          } catch (error) {
            console.error(`Error fetching BEP20 balance for ${bep20Address}:`, error);
          }
        }

        const totalBalance = erc20Balance + bep20Balance;

        if (totalBalance > 0) {
          userBalances.push({
            email: (user as any).email,
            erc20Balance,
            bep20Balance,
            totalBalance,
            erc20Address,
            bep20Address
          });
        }

        erc20Total += erc20Balance;
        bep20Total += bep20Balance;

      } catch (error) {
        console.error(`Error processing user ${(user as any).email}:`, error);
      }
    }

    // Sort by total balance descending
    userBalances.sort((a, b) => b.totalBalance - a.totalBalance);

    // Get top 10 users
    const topUsers = userBalances.slice(0, 10);

    const summary = {
      totalUsers: users.length,
      erc20Total,
      bep20Total,
      grandTotal: erc20Total + bep20Total,
      erc20Count,
      bep20Count,
      networkMode: mode,
      topUsers,
      scannedAt: new Date().toISOString()
    };

    console.log(`✅ Scan complete: ${userBalances.length} users with balance, Total: $${summary.grandTotal.toFixed(2)}`);

    return NextResponse.json(summary);

  } catch (error: any) {
    console.error('❌ Scan user balances error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scan user balances' },
      { status: 500 }
    );
  }
}
