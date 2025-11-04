import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';

/**
 * Admin Dashboard Stats API
 * Returns real-time statistics for admin dashboard
 */

// Disable caching for this API route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Verify admin token (same as other admin endpoints)
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
    const decoded = verify(token, secret) as any;

    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get network mode
    const networkMode = process.env.NETWORK_MODE || 'testnet';

    // 1. Total Users
    const totalUsers = await User.countDocuments();

    // 2. Users with wallets
    const usersWithWallets = await User.countDocuments({
      'walletData.erc20Address': { $exists: true, $ne: null }
    });

    // 3. Active referrals (users who have referred someone)
    const activeReferrals = await User.countDocuments({
      referralCode: { $exists: true, $ne: null }
    });

    // 4. Total deposits (transactions)
    const totalDeposits = await Transaction.countDocuments({
      status: 'confirmed'
    });

    // 5. Total deposit amount
    const depositAggregate = await Transaction.aggregate([
      {
        $match: { status: 'confirmed' }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    const totalDepositAmount = depositAggregate.length > 0 ? depositAggregate[0].totalAmount : 0;

    // 6. Total balance in system (network-aware)
    const balanceField = networkMode === 'mainnet' ? 'walletData.mainnetBalance' : 'walletData.balance';
    const balanceAggregate = await User.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { 
            $sum: networkMode === 'mainnet' ? '$walletData.mainnetBalance' : '$walletData.balance'
          }
        }
      }
    ]);
    const totalBalance = balanceAggregate.length > 0 ? balanceAggregate[0].totalBalance : 0;

    // 7. Total earnings (sum of totalEarnings field)
    const earningsAggregate = await User.aggregate([
      {
        $match: {
          totalEarnings: { $exists: true, $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$totalEarnings' }
        }
      }
    ]);
    const totalEarnings = earningsAggregate.length > 0 ? earningsAggregate[0].totalEarnings : 0;

    // 8. Total withdrawals (confirmed withdrawal transactions)
    const withdrawalAggregate = await Transaction.aggregate([
      {
        $match: {
          type: 'withdrawal',
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: null,
          totalWithdrawals: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const totalWithdrawals = withdrawalAggregate.length > 0 ? withdrawalAggregate[0].totalWithdrawals : 0;
    const withdrawalCount = withdrawalAggregate.length > 0 ? withdrawalAggregate[0].count : 0;

    // 9. Users by membership level
    const membershipBreakdown = await User.aggregate([
      {
        $group: {
          _id: '$membershipLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    // 10. Recent transactions (last 10)
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // 11. New users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        usersWithWallets,
        activeReferrals,
        totalDeposits,
        totalDepositAmount: totalDepositAmount.toFixed(2),
        totalBalance: totalBalance.toFixed(2),
        totalEarnings: totalEarnings.toFixed(2),
        totalWithdrawals: totalWithdrawals.toFixed(2),
        withdrawalCount,
        newUsersToday,
        networkMode,
      },
      membershipBreakdown,
      recentTransactions: recentTransactions.map(tx => ({
        id: tx._id.toString(),
        user: null, // User info removed to avoid populate error
        amount: tx.amount,
        network: tx.network,
        status: tx.status,
        txHash: tx.txHash,
        createdAt: tx.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
