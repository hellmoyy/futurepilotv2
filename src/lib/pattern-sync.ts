/**
 * Pattern Sync Library
 * 
 * Converts Bot Signal learning patterns to Bot Decision LearningPattern format
 * Enables cross-bot intelligence sharing
 */

import mongoose from 'mongoose';

export interface BotSignalLearning {
  summary: {
    totalBacktests: number;
    winTradesAnalyzed: number;
    lossTradesAnalyzed: number;
    avgROI: number;
  };
  winPatterns: {
    exitTypes: Record<string, number>;
    directions: Record<string, number>;
    avgProfit: number;
    avgProfitPercent: number;
    avgSize: number;
    largePositions: number;
    smallPositions: number;
    mostCommonExit: string;
    preferredDirection: string;
  };
  lossPatterns: {
    exitTypes: Record<string, number>;
    directions: Record<string, number>;
    avgLoss: number;
    avgLossPercent: number;
    avgSize: number;
    oversizedTrades: number;
    mostCommonExit: string;
    problematicDirection: string;
  };
  riskInsights: {
    avgRiskReward: number;
    avgWinSize: number;
    avgLossSize: number;
    goodRiskReward: number;
  };
  timingInsights: any;
  lessons: string[];
}

export interface BotDecisionPattern {
  userId: mongoose.Types.ObjectId;
  userBotId: mongoose.Types.ObjectId;
  pattern: {
    type: 'loss' | 'win';
    description: string;
    conditions: {
      rsi?: { min?: number; max?: number };
      macd?: { min?: number; max?: number };
      adx?: { min?: number; max?: number };
      volatility?: 'low' | 'medium' | 'high';
      trend?: 'up' | 'down' | 'sideways';
      timeOfDay?: number[];
      dayOfWeek?: number[];
      newsType?: string[];
      newsSentiment?: 'bearish' | 'bullish' | 'neutral';
      symbol?: string;
    };
  };
  occurrences: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfitLoss: number;
  avgProfit: number;
  avgLoss: number;
  confidence: number;
  strength: number;
  timesMatched: number;
  timesAvoided: number;
  avoidanceSuccessRate: number;
  firstSeen: Date;
  lastSeen: Date;
  lastUpdated: Date;
  isActive: boolean;
  aiGenerated: boolean;
  aiConfidence?: number;
  aiReasoning?: string;
}

/**
 * Convert Bot Signal learning data to Bot Decision patterns
 */
export function convertSignalPatternsToDecisionPatterns(
  signalLearning: BotSignalLearning,
  userId: string,
  userBotId: string,
  symbol: string = 'BTCUSDT'
): BotDecisionPattern[] {
  // Validate inputs
  if (!userId || typeof userId !== 'string' || userId.length !== 24) {
    throw new Error(`Invalid userId: ${userId}. Must be 24 character hex string.`);
  }
  
  if (!userBotId || typeof userBotId !== 'string' || userBotId.length !== 24) {
    throw new Error(`Invalid userBotId: ${userBotId}. Must be 24 character hex string.`);
  }
  
  const patterns: BotDecisionPattern[] = [];
  const now = new Date();

  // Extract win patterns
  if (signalLearning.winPatterns && signalLearning.summary.winTradesAnalyzed > 0) {
    const winData = signalLearning.winPatterns;
    
    // Pattern 1: Preferred direction wins
    if (winData.preferredDirection && winData.directions[winData.preferredDirection] > 0) {
      const direction = winData.preferredDirection;
      const count = winData.directions[direction];
      const successRate = count / signalLearning.summary.winTradesAnalyzed;
      
      patterns.push({
        userId: new mongoose.Types.ObjectId(userId),
        userBotId: new mongoose.Types.ObjectId(userBotId),
        pattern: {
          type: 'win',
          description: `${direction} trades with ${winData.mostCommonExit} exit - proven winner`,
          conditions: {
            trend: direction === 'LONG' ? 'up' : 'down',
            symbol,
          },
        },
        occurrences: count,
        successCount: count,
        failureCount: 0,
        successRate: successRate,
        totalProfit: winData.avgProfit * count,
        totalLoss: 0,
        netProfitLoss: winData.avgProfit * count,
        avgProfit: winData.avgProfit,
        avgLoss: 0,
        confidence: Math.min(count / 20, 1), // Max confidence at 20 samples
        strength: Math.round(successRate * 100),
        timesMatched: 0,
        timesAvoided: 0,
        avoidanceSuccessRate: 0,
        firstSeen: now,
        lastSeen: now,
        lastUpdated: now,
        isActive: true,
        aiGenerated: true,
        aiConfidence: Math.min(count / 20, 1),
        aiReasoning: `Bot Signal backtest shows ${count} ${direction} trades with ${(successRate * 100).toFixed(1)}% success rate via ${winData.mostCommonExit} exit`
      });
    }

    // Pattern 2: Take Profit exit strategy
    if (winData.exitTypes['TP'] && winData.exitTypes['TP'] > 0) {
      const tpCount = winData.exitTypes['TP'];
      const tpRate = tpCount / signalLearning.summary.winTradesAnalyzed;
      
      patterns.push({
        userId: new mongoose.Types.ObjectId(userId),
        userBotId: new mongoose.Types.ObjectId(userBotId),
        pattern: {
          type: 'win',
          description: `Take Profit exit captures avg ${winData.avgProfitPercent.toFixed(2)}% profit`,
          conditions: {
            symbol,
          },
        },
        occurrences: tpCount,
        successCount: tpCount,
        failureCount: 0,
        successRate: tpRate,
        totalProfit: winData.avgProfit * tpCount,
        totalLoss: 0,
        netProfitLoss: winData.avgProfit * tpCount,
        avgProfit: winData.avgProfit,
        avgLoss: 0,
        confidence: Math.min(tpCount / 15, 1),
        strength: Math.round(tpRate * 100),
        timesMatched: 0,
        timesAvoided: 0,
        avoidanceSuccessRate: 0,
        firstSeen: now,
        lastSeen: now,
        lastUpdated: now,
        isActive: true,
        aiGenerated: true,
        aiConfidence: Math.min(tpCount / 15, 1),
        aiReasoning: `Bot Signal data: ${tpCount} TP exits with ${winData.avgProfitPercent.toFixed(2)}% avg profit`
      });
    }

    // Pattern 3: Trailing Profit strategy
    if (winData.exitTypes['TRAILING_TP'] && winData.exitTypes['TRAILING_TP'] > 0) {
      const trailCount = winData.exitTypes['TRAILING_TP'];
      
      patterns.push({
        userId: new mongoose.Types.ObjectId(userId),
        userBotId: new mongoose.Types.ObjectId(userBotId),
        pattern: {
          type: 'win',
          description: `Trailing Profit maximizes gains - use this exit strategy`,
          conditions: {
            symbol,
          },
        },
        occurrences: trailCount,
        successCount: trailCount,
        failureCount: 0,
        successRate: trailCount / signalLearning.summary.winTradesAnalyzed,
        totalProfit: winData.avgProfit * trailCount,
        totalLoss: 0,
        netProfitLoss: winData.avgProfit * trailCount,
        avgProfit: winData.avgProfit,
        avgLoss: 0,
        confidence: Math.min(trailCount / 10, 1),
        strength: 80,
        timesMatched: 0,
        timesAvoided: 0,
        avoidanceSuccessRate: 0,
        firstSeen: now,
        lastSeen: now,
        lastUpdated: now,
        isActive: true,
        aiGenerated: true,
        aiConfidence: 0.8,
        aiReasoning: `Bot Signal: ${trailCount} trailing profit exits captured extended gains`
      });
    }
  }

  // Extract loss patterns
  if (signalLearning.lossPatterns && signalLearning.summary.lossTradesAnalyzed > 0) {
    const lossData = signalLearning.lossPatterns;
    
    // Pattern 4: Problematic direction losses
    if (lossData.problematicDirection && lossData.directions[lossData.problematicDirection] > 0) {
      const direction = lossData.problematicDirection;
      const count = lossData.directions[direction];
      const lossRate = count / signalLearning.summary.lossTradesAnalyzed;
      
      patterns.push({
        userId: new mongoose.Types.ObjectId(userId),
        userBotId: new mongoose.Types.ObjectId(userBotId),
        pattern: {
          type: 'loss',
          description: `${direction} trades frequently hit SL - avoid or reduce confidence`,
          conditions: {
            trend: direction === 'LONG' ? 'up' : 'down',
            symbol,
          },
        },
        occurrences: count,
        successCount: 0,
        failureCount: count,
        successRate: 0,
        totalProfit: 0,
        totalLoss: lossData.avgLoss * count, // Negative value (avgLoss is already negative)
        netProfitLoss: lossData.avgLoss * count, // Negative value (avgLoss is already negative)
        avgProfit: 0,
        avgLoss: lossData.avgLoss, // Keep original negative value
        confidence: Math.min(count / 20, 1),
        strength: Math.round(lossRate * 100),
        timesMatched: 0,
        timesAvoided: 0,
        avoidanceSuccessRate: 0,
        firstSeen: now,
        lastSeen: now,
        lastUpdated: now,
        isActive: true,
        aiGenerated: true,
        aiConfidence: Math.min(count / 20, 1),
        aiReasoning: `Bot Signal backtest: ${count} ${direction} trades resulted in ${lossData.mostCommonExit} with avg loss $${Math.abs(lossData.avgLoss).toFixed(2)}`
      });
    }

    // Pattern 5: Stop Loss hits
    if (lossData.exitTypes['STOP_LOSS'] && lossData.exitTypes['STOP_LOSS'] > 0) {
      const slCount = lossData.exitTypes['STOP_LOSS'];
      const slRate = slCount / signalLearning.summary.lossTradesAnalyzed;
      
      patterns.push({
        userId: new mongoose.Types.ObjectId(userId),
        userBotId: new mongoose.Types.ObjectId(userBotId),
        pattern: {
          type: 'loss',
          description: `Frequent SL hits with avg ${lossData.avgLossPercent.toFixed(2)}% loss - review entry timing`,
          conditions: {
            symbol,
          },
        },
        occurrences: slCount,
        successCount: 0,
        failureCount: slCount,
        successRate: 0,
        totalProfit: 0,
        totalLoss: lossData.avgLoss * slCount, // Negative (avgLoss is already negative)
        netProfitLoss: lossData.avgLoss * slCount, // Negative (avgLoss is already negative)
        avgProfit: 0,
        avgLoss: lossData.avgLoss, // Keep original negative value
        confidence: Math.min(slCount / 15, 1),
        strength: Math.round(slRate * 100),
        timesMatched: 0,
        timesAvoided: 0,
        avoidanceSuccessRate: 0,
        firstSeen: now,
        lastSeen: now,
        lastUpdated: now,
        isActive: true,
        aiGenerated: true,
        aiConfidence: Math.min(slCount / 15, 1),
        aiReasoning: `Bot Signal: ${slCount} SL hits indicate entry timing issues or tight SL`
      });
    }

    // Pattern 6: Emergency exits
    if (lossData.exitTypes['EMERGENCY_EXIT'] && lossData.exitTypes['EMERGENCY_EXIT'] > 0) {
      const emergCount = lossData.exitTypes['EMERGENCY_EXIT'];
      
      patterns.push({
        userId: new mongoose.Types.ObjectId(userId),
        userBotId: new mongoose.Types.ObjectId(userBotId),
        pattern: {
          type: 'loss',
          description: `Emergency exits detected - critical risk management issue`,
          conditions: {
            volatility: 'high',
            symbol,
          },
        },
        occurrences: emergCount,
        successCount: 0,
        failureCount: emergCount,
        successRate: 0,
        totalProfit: 0,
        totalLoss: lossData.avgLoss * emergCount, // Negative (avgLoss is already negative)
        netProfitLoss: lossData.avgLoss * emergCount, // Negative (avgLoss is already negative)
        avgProfit: 0,
        avgLoss: lossData.avgLoss, // Keep original negative value
        confidence: Math.min(emergCount / 5, 1),
        strength: 95, // Very strong pattern (emergency = critical)
        timesMatched: 0,
        timesAvoided: 0,
        avoidanceSuccessRate: 0,
        firstSeen: now,
        lastSeen: now,
        lastUpdated: now,
        isActive: true,
        aiGenerated: true,
        aiConfidence: 0.95,
        aiReasoning: `Bot Signal: ${emergCount} emergency exits indicate high-risk scenarios - avoid these conditions`
      });
    }
  }

  return patterns;
}

/**
 * Calculate confidence adjustment for AI decision based on patterns
 */
export function calculatePatternConfidenceAdjustment(
  signal: { action: 'LONG' | 'SHORT'; symbol: string },
  patterns: any[]
): {
  adjustment: number;
  matchedPatterns: string[];
  reason: string;
} {
  let adjustment = 0;
  const matchedPatterns: string[] = [];
  const reasons: string[] = [];

  for (const pattern of patterns) {
    if (!pattern.isActive) continue;
    if (pattern.pattern.conditions.symbol && pattern.pattern.conditions.symbol !== signal.symbol) continue;

    // Match direction
    const signalTrend = signal.action === 'LONG' ? 'up' : 'down';
    if (pattern.pattern.conditions.trend && pattern.pattern.conditions.trend === signalTrend) {
      if (pattern.pattern.type === 'win') {
        // Boost confidence for win patterns
        const boost = pattern.confidence * pattern.strength / 100 * 0.2; // Max 20% boost
        adjustment += boost;
        matchedPatterns.push(pattern._id?.toString() || 'unknown');
        reasons.push(`+${(boost * 100).toFixed(1)}% (${pattern.pattern.description})`);
      } else if (pattern.pattern.type === 'loss') {
        // Reduce confidence for loss patterns
        const penalty = pattern.confidence * pattern.strength / 100 * 0.15; // Max 15% penalty
        adjustment -= penalty;
        matchedPatterns.push(pattern._id?.toString() || 'unknown');
        reasons.push(`-${(penalty * 100).toFixed(1)}% (${pattern.pattern.description})`);
      }
    }
  }

  return {
    adjustment: Math.max(-0.3, Math.min(0.3, adjustment)), // Cap at ±30%
    matchedPatterns,
    reason: reasons.length > 0 ? reasons.join(' | ') : 'No patterns matched'
  };
}

/**
 * Generate insights from pattern sync
 */
export function generateSyncInsights(
  patterns: BotDecisionPattern[],
  signalLearning: BotSignalLearning
): string[] {
  const insights: string[] = [];

  const winPatterns = patterns.filter(p => p.pattern.type === 'win');
  const lossPatterns = patterns.filter(p => p.pattern.type === 'loss');

  if (winPatterns.length > 0) {
    const topWin = winPatterns.reduce((max, p) => 
      p.strength > max.strength ? p : max
    );
    insights.push(`🎯 Top win pattern: ${topWin.pattern.description} (${topWin.strength}% strength)`);
  }

  if (lossPatterns.length > 0) {
    const topLoss = lossPatterns.reduce((max, p) => 
      p.strength > max.strength ? p : max
    );
    insights.push(`⚠️ Critical loss pattern: ${topLoss.pattern.description} - Bot Decision will avoid this`);
  }

  if (signalLearning.winPatterns?.preferredDirection) {
    insights.push(`📈 Bot Decision will boost ${signalLearning.winPatterns.preferredDirection} signals by ~15-20%`);
  }

  if (signalLearning.lossPatterns?.problematicDirection) {
    insights.push(`📉 Bot Decision will reduce ${signalLearning.lossPatterns.problematicDirection} signals by ~10-15%`);
  }

  if (signalLearning.summary.avgROI) {
    insights.push(`💰 Bot Signal proven ROI: ${signalLearning.summary.avgROI.toFixed(2)}% - Bot Decision will use this benchmark`);
  }

  return insights;
}
