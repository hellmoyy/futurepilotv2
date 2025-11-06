/**
 * Backtest Analytics API - Performance insights and trends
 * 
 * GET /api/backtest/analytics?days=30&symbol=BTCUSDT
 * 
 * Returns:
 * - Performance trends over time
 * - Symbol comparison
 * - Config performance comparison
 * - Win/loss pattern analysis
 * - Best/worst time periods
 */

import { NextRequest, NextResponse } from 'next/server';
import BacktestResult from '@/models/BacktestResult';
import connectDB from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    const symbol = searchParams.get('symbol') || undefined;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Build base query
    const baseQuery: any = {
      status: 'completed',
      createdAt: { $gte: startDate }
    };
    if (symbol) baseQuery.symbol = symbol;
    
    // 1. Performance Trends (Daily aggregation)
    const dailyTrends = await BacktestResult.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          avgROI: { $avg: '$roi' },
          avgWinRate: { $avg: '$winRate' },
          totalRuns: { $sum: 1 },
          totalTrades: { $sum: '$totalTrades' },
          avgProfitFactor: { $avg: '$profitFactor' }
        }
      },
      { $sort: { '_id.date': 1 } },
      { $limit: days }
    ]);
    
    // 2. Symbol Performance Comparison
    const symbolComparison = await BacktestResult.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$symbol',
          avgROI: { $avg: '$roi' },
          bestROI: { $max: '$roi' },
          worstROI: { $min: '$roi' },
          avgWinRate: { $avg: '$winRate' },
          totalRuns: { $sum: 1 },
          totalTrades: { $sum: '$totalTrades' },
          avgProfitFactor: { $avg: '$profitFactor' },
          avgLargestWin: { $avg: '$largestWin' },
          avgLargestLoss: { $avg: '$largestLoss' }
        }
      },
      { $sort: { avgROI: -1 } }
    ]);
    
    // 3. Config Performance Comparison
    const configComparison = await BacktestResult.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: { configId: '$configId', configName: '$configName' },
          avgROI: { $avg: '$roi' },
          bestROI: { $max: '$roi' },
          avgWinRate: { $avg: '$winRate' },
          totalRuns: { $sum: 1 },
          totalTrades: { $sum: '$totalTrades' },
          consistency: { $stdDevPop: '$roi' } // Lower is more consistent
        }
      },
      { $sort: { avgROI: -1 } }
    ]);
    
    // 4. Win/Loss Pattern Analysis
    const allResults = await BacktestResult.find(baseQuery)
      .select('roi winRate profitFactor largestWin largestLoss avgWin avgLoss sampleTrades')
      .lean();
    
    // Analyze patterns
    const patterns = {
      // High performers (ROI > 500%)
      highPerformers: allResults.filter(r => r.roi > 500).length,
      // Consistent winners (win rate > 75%)
      consistentWinners: allResults.filter(r => r.winRate > 75).length,
      // Risk takers (largest loss > $300)
      highRiskTrades: allResults.filter(r => Math.abs(r.largestLoss) > 300).length,
      // Conservative (largest win < $300)
      conservativeTrades: allResults.filter(r => r.largestWin < 300).length,
      
      // Common exit patterns from sample trades
      exitPatterns: {
        takeProfit: 0,
        stopLoss: 0,
        trailingProfit: 0,
        trailingLoss: 0,
        emergencyExit: 0
      }
    };
    
    // Count exit patterns from best wins and worst losses
    allResults.forEach(result => {
      if (result.sampleTrades?.bestWin?.exitType) {
        const exitType = result.sampleTrades.bestWin.exitType.toLowerCase();
        if (exitType.includes('take_profit')) patterns.exitPatterns.takeProfit++;
        else if (exitType.includes('trailing') && exitType.includes('profit')) patterns.exitPatterns.trailingProfit++;
      }
      
      if (result.sampleTrades?.worstLoss?.exitType) {
        const exitType = result.sampleTrades.worstLoss.exitType.toLowerCase();
        if (exitType.includes('stop_loss')) patterns.exitPatterns.stopLoss++;
        else if (exitType.includes('trailing') && exitType.includes('loss')) patterns.exitPatterns.trailingLoss++;
        else if (exitType.includes('emergency')) patterns.exitPatterns.emergencyExit++;
      }
    });
    
    // 5. Time-based Performance (Hour of day if we have enough data)
    const timeBasedPerf = await BacktestResult.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            hour: { $hour: '$createdAt' }
          },
          avgROI: { $avg: '$roi' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.hour': 1 } }
    ]);
    
    // 6. Overall Summary Stats
    const summary = {
      totalBacktests: allResults.length,
      avgROI: allResults.reduce((sum, r) => sum + r.roi, 0) / allResults.length || 0,
      bestROI: Math.max(...allResults.map(r => r.roi)),
      worstROI: Math.min(...allResults.map(r => r.roi)),
      avgWinRate: allResults.reduce((sum, r) => sum + r.winRate, 0) / allResults.length || 0,
      avgProfitFactor: allResults.reduce((sum, r) => sum + r.profitFactor, 0) / allResults.length || 0,
      totalTrades: allResults.reduce((sum, r) => sum + r.totalTrades, 0),
      
      // Risk metrics
      avgRiskReward: allResults.reduce((sum, r) => {
        const rr = Math.abs(r.largestWin / (r.largestLoss || -1));
        return sum + (isFinite(rr) ? rr : 0);
      }, 0) / allResults.length || 0,
      
      // Consistency (lower std dev = more consistent)
      roiConsistency: calculateStdDev(allResults.map(r => r.roi))
    };
    
    // 7. Top Performers (Best 5 backtests)
    const topPerformers = await BacktestResult.find(baseQuery)
      .sort({ roi: -1 })
      .limit(5)
      .select('symbol period roi winRate totalTrades createdAt configName')
      .lean();
    
    // 8. Learning Insights (Pattern-based recommendations)
    const insights = generateInsights(allResults, symbolComparison, configComparison, patterns);
    
    console.log(`📊 Generated analytics for ${allResults.length} backtests over ${days} days`);
    
    return NextResponse.json({
      success: true,
      analytics: {
        summary,
        dailyTrends,
        symbolComparison,
        configComparison,
        patterns,
        timeBasedPerf,
        topPerformers,
        insights
      },
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('❌ Failed to generate analytics:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate analytics',
    }, { status: 500 });
  }
}

// Helper: Calculate standard deviation
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map(val => Math.pow(val - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(avgSquareDiff);
}

// Helper: Generate actionable insights from patterns
function generateInsights(
  allResults: any[],
  symbolComparison: any[],
  configComparison: any[],
  patterns: any
): string[] {
  const insights: string[] = [];
  
  if (allResults.length === 0) {
    insights.push("💡 Run more backtests to generate insights");
    return insights;
  }
  
  // Best symbol insight
  if (symbolComparison.length > 0) {
    const bestSymbol = symbolComparison[0];
    insights.push(`🏆 ${bestSymbol._id} is your top performer with ${bestSymbol.avgROI.toFixed(0)}% average ROI across ${bestSymbol.totalRuns} tests`);
    
    if (symbolComparison.length > 1) {
      const worstSymbol = symbolComparison[symbolComparison.length - 1];
      const gap = bestSymbol.avgROI - worstSymbol.avgROI;
      if (gap > 100) {
        insights.push(`⚠️ ${gap.toFixed(0)}% performance gap between best (${bestSymbol._id}) and worst (${worstSymbol._id}) symbols - focus on winners`);
      }
    }
  }
  
  // Best config insight
  if (configComparison.length > 1) {
    const bestConfig = configComparison[0];
    const consistency = bestConfig.consistency;
    
    if (consistency < 50) {
      insights.push(`✅ "${bestConfig._id.configName}" config is highly consistent (low variance) with ${bestConfig.avgROI.toFixed(0)}% ROI`);
    } else if (consistency > 200) {
      insights.push(`⚠️ "${bestConfig._id.configName}" config has high variance - results may be unpredictable`);
    }
  }
  
  // Win rate insight
  const avgWinRate = allResults.reduce((sum, r) => sum + r.winRate, 0) / allResults.length;
  if (avgWinRate > 80) {
    insights.push(`🎯 Excellent ${avgWinRate.toFixed(1)}% average win rate - strategy is highly reliable`);
  } else if (avgWinRate < 60) {
    insights.push(`⚠️ Win rate ${avgWinRate.toFixed(1)}% is below target - consider adjusting entry filters`);
  }
  
  // Exit pattern insights
  const totalExits = Object.values(patterns.exitPatterns).reduce((sum: number, val) => sum + (val as number), 0);
  if (totalExits > 0) {
    const tpPercent = (patterns.exitPatterns.takeProfit / totalExits) * 100;
    const slPercent = (patterns.exitPatterns.stopLoss / totalExits) * 100;
    
    if (tpPercent > 70) {
      insights.push(`✅ ${tpPercent.toFixed(0)}% of best wins hit take profit - targets are well-calibrated`);
    }
    
    if (slPercent > 70) {
      insights.push(`⚠️ ${slPercent.toFixed(0)}% of worst losses hit stop loss - consider tighter risk management`);
    }
    
    if (patterns.exitPatterns.trailingProfit > totalExits * 0.2) {
      insights.push(`📈 Trailing profit system captured ${((patterns.exitPatterns.trailingProfit / totalExits) * 100).toFixed(0)}% of wins - effective at riding trends`);
    }
  }
  
  // Risk/Reward insight
  const avgRR = allResults.reduce((sum, r) => {
    const rr = Math.abs(r.largestWin / (r.largestLoss || -1));
    return sum + (isFinite(rr) ? rr : 0);
  }, 0) / allResults.length;
  
  if (avgRR > 2.5) {
    insights.push(`🎖️ Excellent ${avgRR.toFixed(2)}:1 risk/reward ratio - winners significantly outweigh losers`);
  } else if (avgRR < 1.5) {
    insights.push(`⚠️ Risk/reward ratio ${avgRR.toFixed(2)}:1 is low - aim for at least 2:1 for long-term profitability`);
  }
  
  // Profit factor insight
  const avgPF = allResults.reduce((sum, r) => sum + r.profitFactor, 0) / allResults.length;
  if (avgPF > 5) {
    insights.push(`🚀 Outstanding ${avgPF.toFixed(2)} profit factor - strategy generates ${avgPF.toFixed(1)}x more profit than loss`);
  } else if (avgPF < 2) {
    insights.push(`⚠️ Profit factor ${avgPF.toFixed(2)} needs improvement - target at least 3.0 for strong performance`);
  }
  
  // Consistency insight
  const roiValues = allResults.map(r => r.roi);
  const stdDev = calculateStdDev(roiValues);
  const avgROI = roiValues.reduce((sum, val) => sum + val, 0) / roiValues.length;
  const coefficientOfVariation = (stdDev / avgROI) * 100;
  
  if (coefficientOfVariation < 20) {
    insights.push(`✅ Results are highly consistent (CV: ${coefficientOfVariation.toFixed(1)}%) - strategy is reliable across different periods`);
  } else if (coefficientOfVariation > 50) {
    insights.push(`⚠️ High result variation (CV: ${coefficientOfVariation.toFixed(1)}%) - performance may depend heavily on market conditions`);
  }
  
  return insights;
}
