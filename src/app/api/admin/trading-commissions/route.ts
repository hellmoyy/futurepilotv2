import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Transaction } from '@/models/Transaction';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/trading-commissions
 * Get all trading commission transactions with statistics
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    // Build query filter
    const filter: any = {
      type: 'trading_commission',
      status: 'confirmed',
    };

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // User filter
    if (userId) {
      filter.userId = userId;
    }

    // Get total count
    const totalCount = await Transaction.countDocuments(filter);

    // Get paginated transactions
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name email gasFeeBalance')
      .lean();

    // Calculate statistics
    const stats = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalProfit: { $sum: '$tradingMetadata.profit' },
          totalTrades: { $sum: 1 },
          avgCommission: { $avg: '$amount' },
          avgProfit: { $avg: '$tradingMetadata.profit' },
          avgRate: { $avg: '$tradingMetadata.commissionRate' },
        },
      },
    ]);

    const statistics = stats[0] || {
      totalRevenue: 0,
      totalProfit: 0,
      totalTrades: 0,
      avgCommission: 0,
      avgProfit: 0,
      avgRate: 0,
    };

    // Get top users by commission paid
    const topUsers = await Transaction.aggregate([
      { $match: { type: 'trading_commission', status: 'confirmed' } },
      {
        $group: {
          _id: '$userId',
          totalCommission: { $sum: '$amount' },
          totalProfit: { $sum: '$tradingMetadata.profit' },
          tradeCount: { $sum: 1 },
        },
      },
      { $sort: { totalCommission: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'futurepilotcol',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userEmail: '$user.email',
          totalCommission: 1,
          totalProfit: 1,
          tradeCount: 1,
        },
      },
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await Transaction.aggregate([
      {
        $match: {
          type: 'trading_commission',
          status: 'confirmed',
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
          trades: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        statistics,
        topUsers,
        recentActivity,
      },
    });
  } catch (error: any) {
    console.error('Error fetching trading commissions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trading commissions' },
      { status: 500 }
    );
  }
}
