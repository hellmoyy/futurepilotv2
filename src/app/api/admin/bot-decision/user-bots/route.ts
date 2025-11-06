import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminAuth } from '@/lib/adminAuth';
import UserBot from '@/models/UserBot';

/**
 * GET /api/admin/bot-decision/user-bots
 * 
 * Get paginated list of all user bots with statistics.
 * 
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 50)
 * - status: 'active' | 'paused' | 'stopped' (optional filter)
 * - search: string (search by user email/username)
 * 
 * Protected: Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminAuth = await verifyAdminAuth(request);
    if (!adminAuth.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }
    
    // If search provided, first find matching users
    let userIds: any[] = [];
    if (search) {
      const User = (await import('@/models/User')).User;
      const users = await User.find({
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      
      userIds = users.map((u: any) => u._id);
      query.userId = { $in: userIds };
    }
    
    // Get total count
    const total = await UserBot.countDocuments(query);
    
    // Get paginated bots
    const bots = await UserBot.find(query)
      .populate('userId', 'email username')
      .sort({ lastActive: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const botsData = bots.map(bot => ({
      _id: bot._id,
      userId: bot.userId,
      status: bot.status,
      lastBalanceCheck: bot.lastBalanceCheck,
      aiConfig: bot.aiConfig,
      tradingConfig: bot.tradingConfig,
      stats: bot.stats,
      lastActive: bot.lastActive,
      dailyTradeCount: bot.dailyTradeCount,
      createdAt: bot.createdAt,
    }));
    
    return NextResponse.json({
      success: true,
      bots: botsData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching user bots:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch user bots',
      },
      { status: 500 }
    );
  }
}
