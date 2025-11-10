import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { BotInstance } from '@/models/BotInstance'; // Use BotInstance instead of UserBot
import { User } from '@/models/User';
import mongoose from 'mongoose';

/**
 * GET /api/admin/bot-decision/user-bots
 * 
 * Get paginated list of all bot instances (ACTIVE, STOPPED, ERROR, PAUSED)
 * 
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 50)
 * - status: 'ACTIVE' | 'STOPPED' | 'ERROR' | 'PAUSED' (optional filter)
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
    const statusParam = searchParams.get('status');
    const search = searchParams.get('search');
    
    // Build query
    const query: any = {};
    
    // Map status filter (lowercase 'active' → uppercase 'ACTIVE')
    if (statusParam) {
      query.status = statusParam.toUpperCase();
    }
    
    // If search provided, first find matching users
    let userIds: any[] = [];
    if (search) {
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
    const total = await BotInstance.countDocuments(query);
    
    console.log(`📊 Fetching ${total} bot instances with query:`, JSON.stringify(query));
    
    // Get paginated bot instances with user data
    const bots = await BotInstance.find(query)
      .populate('userId', 'email name walletData.gasFeeBalance')
      .populate('exchangeConnectionId', 'name exchange')
      .sort({ startedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    console.log(`✅ Fetched ${bots.length} bot instances`);
    
    // Transform to match admin UI expectations
    const botsData = bots.map((bot: any) => ({
      _id: bot._id,
      userId: bot.userId,
      status: bot.status.toLowerCase(), // ACTIVE → active for UI compatibility
      botId: bot.botId,
      botName: bot.botName,
      symbol: bot.symbol,
      exchangeConnection: bot.exchangeConnectionId,
      
      // Map to UserBot format for backward compatibility
      lastBalanceCheck: {
        timestamp: bot.lastAnalysis?.timestamp || bot.startedAt || new Date(),
        binanceBalance: 0, // TODO: Get from Binance API
        gasFeeBalance: bot.userId?.walletData?.gasFeeBalance || 0,
        availableMargin: 0,
        usedMargin: 0,
      },
      
      aiConfig: {
        enabled: true,
        confidenceThreshold: 82,
        newsWeight: 10,
        backtestWeight: 5,
        learningWeight: 3,
        minGasFeeBalance: 10,
      },
      
      tradingConfig: {
        riskPercent: bot.config?.riskPercent || 2,
        maxLeverage: bot.config?.leverage || 10,
        maxDailyTrades: bot.config?.maxDailyTrades || 50,
        allowedPairs: [bot.symbol],
        blacklistPairs: [],
      },
      
      stats: {
        totalSignalsReceived: bot.statistics?.totalTrades || 0,
        totalSignalsExecuted: bot.statistics?.totalTrades || 0,
        totalSignalsRejected: 0,
        totalTrades: bot.statistics?.totalTrades || 0,
        winRate: bot.statistics?.winRate || 0,
        totalProfit: (bot.statistics?.totalProfit || 0) - (bot.statistics?.totalLoss || 0),
        todayTradeCount: 0, // TODO: Calculate from today's trades
      },
      
      lastActive: bot.lastAnalysis?.timestamp || bot.startedAt,
      dailyTradeCount: 0,
      createdAt: bot.createdAt,
      startedAt: bot.startedAt,
      stoppedAt: bot.stoppedAt,
      currentPosition: bot.currentPosition,
      statistics: bot.statistics,
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
    console.error('❌ Error fetching bot instances:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch bot instances',
      },
      { status: 500 }
    );
  }
}
