import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/mongodb';
import { verifyAdminAuth } from '@/lib/adminAuth';
import LearningPattern from '@/models/LearningPattern';
import AIDecision from '@/models/AIDecision';

/**
 * GET /api/admin/bot-decision/learning/stats
 * 
 * Get comprehensive learning statistics untuk admin dashboard:
 * - Total patterns (loss/win)
 * - Pattern effectiveness trends
 * - Top performing patterns
 * - Learning improvement over time
 * - Pattern usage statistics
 * 
 * Protected: Admin only
 */
export async function GET(request: NextRequest) {
  try {
    const adminAuth = await verifyAdminAuth(request);
    if (!adminAuth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || undefined;

    console.log('📊 Fetching learning statistics...');

    // 1. Total Pattern Counts
    const query: any = { isActive: true };
    if (userId) {
      query.userId = userId;
    }

    const totalPatterns = await LearningPattern.countDocuments(query);
    const lossPatterns = await LearningPattern.countDocuments({ ...query, 'pattern.type': 'loss' });
    const winPatterns = await LearningPattern.countDocuments({ ...query, 'pattern.type': 'win' });

    // 2. Pattern Effectiveness
    // Note: Patterns are duplicated per user, so we average netProfitLoss instead of sum
    const effectivenessAgg = await LearningPattern.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          avgSuccessRate: { $avg: '$successRate' },
          avgConfidence: { $avg: '$confidence' },
          avgStrength: { $avg: '$strength' },
          totalOccurrences: { $sum: '$occurrences' },
          totalMatched: { $sum: '$timesMatched' },
          totalAvoided: { $sum: '$timesAvoided' },
          totalNetProfit: { $avg: '$netProfitLoss' }, // Changed from $sum to $avg (patterns are per-user duplicates)
        },
      },
    ]);

    const effectiveness = effectivenessAgg[0] || {
      avgSuccessRate: 0,
      avgConfidence: 0,
      avgStrength: 0,
      totalOccurrences: 0,
      totalMatched: 0,
      totalAvoided: 0,
      totalNetProfit: 0,
    };

    // 3. Top Loss Patterns (highest avoidance success rate)
    const topLossPatterns = await LearningPattern.find({
      ...query,
      'pattern.type': 'loss',
    })
      .sort({ avoidanceSuccessRate: -1, strength: -1 })
      .limit(5)
      .select('pattern.description confidence strength occurrences avoidanceSuccessRate timesAvoided');

    // 4. Top Win Patterns (highest success rate)
    const topWinPatterns = await LearningPattern.find({
      ...query,
      'pattern.type': 'win',
    })
      .sort({ successRate: -1, strength: -1 })
      .limit(5)
      .select('pattern.description confidence strength occurrences successRate totalProfit');

    // 5. Learning Impact on Decisions
    const decisionQuery: any = {};
    if (userId) {
      decisionQuery.userId = userId;
    }

    const decisionsWithLearning = await AIDecision.countDocuments({
      ...decisionQuery,
      'confidenceBreakdown.learning': { $exists: true, $ne: 0 },
    });

    const decisionsAvoidedByLearning = await AIDecision.countDocuments({
      ...decisionQuery,
      decision: 'SKIP',
      reason: { $regex: /learning|pattern/i },
    });

    // 6. Learning Improvement Trend (Last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const learningTrend = await AIDecision.aggregate([
      {
        $match: {
          ...decisionQuery,
          timestamp: { $gte: thirtyDaysAgo },
          execution: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          withLearning: {
            $sum: {
              $cond: [{ $ne: ['$confidenceBreakdown.learning', 0] }, 1, 0],
            },
          },
          withoutLearning: {
            $sum: {
              $cond: [{ $eq: ['$confidenceBreakdown.learning', 0] }, 1, 0],
            },
          },
          avgLearningImpact: { $avg: '$confidenceBreakdown.learning' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    // 7. Pattern Age Distribution
    const patterns = await LearningPattern.find(query).select('firstSeen');
    const ageDistribution = {
      new: 0,      // < 7 days
      recent: 0,   // 7-30 days
      mature: 0,   // 30-90 days
      old: 0,      // > 90 days
    };

    const now = Date.now();
    patterns.forEach((p) => {
      const ageInDays = Math.floor((now - p.firstSeen.getTime()) / (1000 * 60 * 60 * 24));
      if (ageInDays < 7) ageDistribution.new++;
      else if (ageInDays < 30) ageDistribution.recent++;
      else if (ageInDays < 90) ageDistribution.mature++;
      else ageDistribution.old++;
    });

    // 8. Most Common Conditions
    const conditionStats = await LearningPattern.aggregate([
      { $match: query },
      {
        $project: {
          hasRSI: { $cond: [{ $ifNull: ['$pattern.conditions.rsi', false] }, 1, 0] },
          hasMACD: { $cond: [{ $ifNull: ['$pattern.conditions.macd', false] }, 1, 0] },
          hasADX: { $cond: [{ $ifNull: ['$pattern.conditions.adx', false] }, 1, 0] },
          hasVolatility: { $cond: [{ $ifNull: ['$pattern.conditions.volatility', false] }, 1, 0] },
          hasTrend: { $cond: [{ $ifNull: ['$pattern.conditions.trend', false] }, 1, 0] },
          hasTime: { $cond: [{ $gt: [{ $size: { $ifNull: ['$pattern.conditions.timeOfDay', []] } }, 0] }, 1, 0] },
        },
      },
      {
        $group: {
          _id: null,
          rsiCount: { $sum: '$hasRSI' },
          macdCount: { $sum: '$hasMACD' },
          adxCount: { $sum: '$hasADX' },
          volatilityCount: { $sum: '$hasVolatility' },
          trendCount: { $sum: '$hasTrend' },
          timeCount: { $sum: '$hasTime' },
        },
      },
    ]);

    const conditions = conditionStats[0] || {
      rsiCount: 0,
      macdCount: 0,
      adxCount: 0,
      volatilityCount: 0,
      trendCount: 0,
      timeCount: 0,
    };

    console.log('✅ Learning statistics fetched successfully');

    return NextResponse.json({
      success: true,
      stats: {
        // Pattern counts
        totalPatterns,
        lossPatterns,
        winPatterns,

        // Effectiveness metrics
        ...effectiveness,

        // Top patterns
        topLossPatterns,
        topWinPatterns,

        // Decision impact
        decisionsWithLearning,
        decisionsAvoidedByLearning,
        learningUsageRate: decisionsWithLearning > 0
          ? (decisionsWithLearning / (decisionsWithLearning + decisionsAvoidedByLearning))
          : 0,

        // Trends
        learningTrend,

        // Age distribution
        ageDistribution,

        // Common conditions
        commonConditions: conditions,
      },
    });
  } catch (error: any) {
    console.error('❌ GET /api/admin/bot-decision/learning/stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}
