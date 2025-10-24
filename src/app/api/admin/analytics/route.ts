import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

// Verify admin token
async function verifyAdminToken(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { email: string; role: string };
    
    if (decoded.role !== 'admin') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

// GET - Fetch analytics data
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    let startDate = new Date();
    if (range === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (range === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    } else {
      startDate = new Date('2020-01-01'); // All time
    }

    // Connect to database
    await connectDB();

    // Fetch all users
    const allUsers = await User.find().lean();
    const usersInRange = await User.find({ 
      createdAt: { $gte: startDate } 
    }).lean();

    // Overview stats
    const overview = {
      totalUsers: allUsers.length,
      totalRevenue: allUsers.reduce((sum, u: any) => sum + (u.totalEarnings || 0), 0),
      totalTransactions: allUsers.reduce((sum, u: any) => sum + (u.transactionCount || 0), 0),
      activeUsers: allUsers.filter((u: any) => (u.totalEarnings || 0) > 0).length,
    };

    // User growth by day
    const userGrowthMap = new Map<string, number>();
    usersInRange.forEach((user: any) => {
      const date = new Date(user.createdAt).toISOString().split('T')[0];
      userGrowthMap.set(date, (userGrowthMap.get(date) || 0) + 1);
    });

    const userGrowth = Array.from(userGrowthMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Revenue by type (simulated - adjust based on your transaction model)
    const revenueByType = [
      { type: 'deposits', amount: overview.totalRevenue * 0.6 },
      { type: 'commissions', amount: overview.totalRevenue * 0.25 },
      { type: 'referrals', amount: overview.totalRevenue * 0.10 },
      { type: 'bonuses', amount: overview.totalRevenue * 0.05 },
    ];

    // Membership distribution
    const membershipCounts = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
    };

    allUsers.forEach((user: any) => {
      const level = (user.membershipLevel || 'bronze').toLowerCase();
      if (level in membershipCounts) {
        membershipCounts[level as keyof typeof membershipCounts]++;
      } else {
        membershipCounts.bronze++;
      }
    });

    const membershipDistribution = Object.entries(membershipCounts).map(([level, count]) => ({
      level,
      count,
      percentage: allUsers.length > 0 ? (count / allUsers.length) * 100 : 0,
    }));

    // Top users by earnings
    const topUsers = allUsers
      .filter((u: any) => (u.totalEarnings || 0) > 0)
      .sort((a: any, b: any) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
      .slice(0, 10)
      .map((u: any) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        totalEarnings: u.totalEarnings || 0,
        transactionCount: u.transactionCount || 0,
      }));

    // Recent activity (simulated - adjust based on your models)
    const recentActivity = [
      { 
        type: 'deposits', 
        count: Math.floor(usersInRange.length * 2.5), 
        amount: overview.totalRevenue * 0.4 
      },
      { 
        type: 'withdrawals', 
        count: Math.floor(usersInRange.length * 1.2), 
        amount: overview.totalRevenue * 0.2 
      },
      { 
        type: 'commissions', 
        count: Math.floor(usersInRange.length * 3), 
        amount: overview.totalRevenue * 0.15 
      },
      { 
        type: 'referrals', 
        count: Math.floor(usersInRange.length * 0.8), 
        amount: overview.totalRevenue * 0.1 
      },
    ];

    const analytics = {
      overview,
      userGrowth,
      revenueByType,
      membershipDistribution,
      topUsers,
      recentActivity,
    };

    return NextResponse.json({
      success: true,
      analytics,
      range,
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch analytics', error: error.message },
      { status: 500 }
    );
  }
}
