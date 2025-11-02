import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';

/**
 * Admin Dashboard Stats API
 * Returns real-time statistics for admin dashboard
 */

export async function GET(request: NextRequest) {
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
        $match: {
          [balanceField]: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: `$${balanceField}` }
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

    // 8. Users by membership level
    const membershipBreakdown = await User.aggregate([
      {
        $group: {
          _id: '$membershipLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    // 9. Recent transactions (last 10)
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'email name')
      .lean();

    // 10. New users today
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
        newUsersToday,
        networkMode,
      },
      membershipBreakdown,
      recentTransactions: recentTransactions.map(tx => ({
        id: tx._id.toString(),
        user: tx.userId ? {
          email: (tx.userId as any).email,
          name: (tx.userId as any).name
        } : null,
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
