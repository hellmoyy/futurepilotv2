import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminAuth } from '@/lib/adminAuth';
import UserBot from '@/models/UserBot';
import { User } from '@/models/User';
import AIDecision from '@/models/AIDecision';
import NewsEvent from '@/models/NewsEvent';
import LearningPattern from '@/models/LearningPattern';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/bot-decision/overview
 * 
 * Get comprehensive statistics for Bot Decision Layer overview dashboard.
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
    
    // Register User model with alias for populate compatibility
    // UserBot references 'User' but model is registered as 'futurepilotcols'
    if (!mongoose.models.User) {
      const UserModel = mongoose.model('futurepilotcols');
      mongoose.model('User', UserModel.schema, 'futurepilotcols');
      console.log('✅ Registered User model alias for populate queries');
    }
    
    console.log('📊 Fetching Bot Decision overview statistics...');
    
    // 1. Active Bots Count
    const activeBots = await UserBot.countDocuments({ status: 'active' });
    const pausedBots = await UserBot.countDocuments({ status: 'paused' });
    const stoppedBots = await UserBot.countDocuments({ status: 'stopped' });
    const totalBots = activeBots + pausedBots + stoppedBots;
    
    // 2. Today's Decisions
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayDecisions = await AIDecision.countDocuments({
      timestamp: { $gte: todayStart },
    });
    
    const todayExecuted = await AIDecision.countDocuments({
      timestamp: { $gte: todayStart },
      decision: 'EXECUTE',
    });
    
    const todaySkipped = await AIDecision.countDocuments({
      timestamp: { $gte: todayStart },
      decision: 'SKIP',
    });
    
    const executionRate = todayDecisions > 0 ? todayExecuted / todayDecisions : 0;
    
    // 3. AI Cost Today
    const costAggregation = await AIDecision.aggregate([
      { $match: { timestamp: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$aiCost' } } },
    ]);
    
    const todayAICost = costAggregation[0]?.total || 0;
    
    // 4. Top Rejection Reasons (last 7 days)
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const rejectedDecisions = await AIDecision.find({
      timestamp: { $gte: last7Days },
      decision: 'SKIP',
    })
      .select('reason confidenceBreakdown')
      .limit(100);
    
    // Analyze rejection reasons
    const rejectionReasons: { [key: string]: number } = {};
    
    for (const decision of rejectedDecisions) {
      if (decision.confidenceBreakdown.total < 0.82) {
        if (decision.confidenceBreakdown.news < -0.05) {
          rejectionReasons['Negative news sentiment'] = (rejectionReasons['Negative news sentiment'] || 0) + 1;
        } else if (decision.confidenceBreakdown.learning < -0.01) {
          rejectionReasons['Loss pattern detected'] = (rejectionReasons['Loss pattern detected'] || 0) + 1;
        } else if (decision.confidenceBreakdown.backtest < -0.02) {
          rejectionReasons['Poor recent performance'] = (rejectionReasons['Poor recent performance'] || 0) + 1;
        } else {
          rejectionReasons['Low technical confidence'] = (rejectionReasons['Low technical confidence'] || 0) + 1;
        }
      } else if (decision.reason.includes('Trading blocked')) {
        rejectionReasons['Trading restrictions'] = (rejectionReasons['Trading restrictions'] || 0) + 1;
      }
    }
    
    const topRejectionReasons = Object.entries(rejectionReasons)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));
    
    // 5. Win Rate Comparison (AI vs baseline)
    const decisionsWithResults = await AIDecision.find({
      'execution.result': { $exists: true },
    }).select('execution');
    
    const totalWithResults = decisionsWithResults.length;
    const wins = decisionsWithResults.filter(d => d.execution?.result === 'WIN').length;
    const aiWinRate = totalWithResults > 0 ? wins / totalWithResults : 0;
    
    // Baseline win rate (technical only, ~75%)
    const baselineWinRate = 0.75;
    const improvement = aiWinRate - baselineWinRate;
    
    // 6. Recent News Summary
    const recentNews = await NewsEvent.countDocuments({
      publishedAt: { $gte: last7Days },
    });
    
    const newsStats = await NewsEvent.getStats({
      start: last7Days,
      end: new Date(),
    });
    
    // 7. Learning Patterns Summary
    const learningStats = await LearningPattern.getStats();
    
    // 8. Daily Decisions Trend (last 7 days)
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayDecisions = await AIDecision.countDocuments({
        timestamp: { $gte: dayStart, $lte: dayEnd },
      });
      
      const dayExecuted = await AIDecision.countDocuments({
        timestamp: { $gte: dayStart, $lte: dayEnd },
        decision: 'EXECUTE',
      });
      
      dailyTrend.push({
        date: dayStart.toISOString().split('T')[0],
        total: dayDecisions,
        executed: dayExecuted,
        skipped: dayDecisions - dayExecuted,
      });
    }
    
    // 9. Top Performing Bots (by win rate)
    const topBots = await UserBot.getTopPerformers(5);
    
    const topBotsData = topBots.map(bot => ({
      userId: bot.userId,
      winRate: bot.stats.winRate,
      totalTrades: bot.stats.totalTrades,
      netProfit: bot.stats.netProfit,
      status: bot.status,
    }));
    
    // 10. Bots with Low Balance (need attention)
    const lowBalanceBots = await UserBot.getBotsWithLowBalance(10);
    
    const lowBalanceData = lowBalanceBots.map(bot => ({
      userId: bot.userId,
      gasFeeBalance: bot.lastBalanceCheck?.gasFeeBalance || 0,
      status: bot.status,
    }));
    
    console.log('✅ Overview statistics fetched successfully');
    
    return NextResponse.json({
      success: true,
      overview: {
        // Bot counts
        totalBots,
        activeBots,
        pausedBots,
        stoppedBots,
        
        // Today's activity
        todayDecisions,
        todayExecuted,
        todaySkipped,
        executionRate,
        todayAICost,
        
        // Performance
        aiWinRate,
        baselineWinRate,
        improvement,
        totalDecisionsWithResults: totalWithResults,
        
        // Rejection analysis
        topRejectionReasons,
        
        // News & learning
        recentNewsCount: recentNews,
        newsBySentiment: newsStats.bySentiment || {},
        newsByImpact: newsStats.byImpact || {},
        totalLearningPatterns: learningStats.total,
        lossPatterns: learningStats.lossPatterns,
        winPatterns: learningStats.winPatterns,
        patternsAvoided: learningStats.totalAvoided,
        
        // Trends
        dailyTrend,
        
        // Alerts
        topPerformingBots: topBotsData,
        lowBalanceBots: lowBalanceData,
      },
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching overview:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch overview',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
