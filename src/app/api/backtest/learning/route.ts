/**
 * Learning Center API - Pattern analysis and educational insights
 * 
 * GET /api/backtest/learning?type=wins|losses|all
 * 
 * Analyzes trade patterns to provide educational insights:
 * - Success patterns (what makes trades profitable)
 * - Failure patterns (what causes losses)
 * - Entry/exit timing analysis
 * - Risk management lessons
 * - Market condition correlations
 */

import { NextRequest, NextResponse } from 'next/server';
import BacktestResult from '@/models/BacktestResult';
import connectDB from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Get recent backtest results with sample trades
    const results = await BacktestResult.find({ 
      status: 'completed',
      'sampleTrades.bestWin': { $exists: true }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('symbol roi winRate profitFactor sampleTrades largestWin largestLoss avgWin avgLoss')
      .lean();
    
    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        learning: {
          patterns: {},
          lessons: ['Run more backtests to generate learning insights'],
          totalSamples: 0
        }
      });
    }
    
    // Extract all sample trades for analysis
    const winTrades: any[] = [];
    const lossTrades: any[] = [];
    
    results.forEach(result => {
      if (result.sampleTrades?.bestWin) winTrades.push({ ...result.sampleTrades.bestWin, symbol: result.symbol, resultROI: result.roi });
      if (result.sampleTrades?.avgWin) winTrades.push({ ...result.sampleTrades.avgWin, symbol: result.symbol, resultROI: result.roi });
      if (result.sampleTrades?.worstLoss) lossTrades.push({ ...result.sampleTrades.worstLoss, symbol: result.symbol, resultROI: result.roi });
      if (result.sampleTrades?.avgLoss) lossTrades.push({ ...result.sampleTrades.avgLoss, symbol: result.symbol, resultROI: result.roi });
    });
    
    // Analyze winning patterns
    const winPatterns = analyzeWinPatterns(winTrades, results);
    
    // Analyze losing patterns
    const lossPatterns = analyzeLossPatterns(lossTrades, results);
    
    // Generate educational lessons
    const lessons = generateLessons(winPatterns, lossPatterns, results);
    
    // Risk management insights
    const riskInsights = analyzeRiskManagement(results);
    
    // Market timing insights
    const timingInsights = analyzeTimingPatterns(winTrades, lossTrades);
    
    console.log(`🎓 Generated learning insights from ${results.length} backtests`);
    console.log(`   - ${winTrades.length} winning trades analyzed`);
    console.log(`   - ${lossTrades.length} losing trades analyzed`);
    
    return NextResponse.json({
      success: true,
      learning: {
        summary: {
          totalBacktests: results.length,
          winTradesAnalyzed: winTrades.length,
          lossTradesAnalyzed: lossTrades.length,
          avgROI: results.reduce((sum, r) => sum + r.roi, 0) / results.length
        },
        winPatterns,
        lossPatterns,
        riskInsights,
        timingInsights,
        lessons
      }
    });
    
  } catch (error: any) {
    console.error('❌ Failed to generate learning insights:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate learning insights',
    }, { status: 500 });
  }
}

// Analyze winning trade patterns
function analyzeWinPatterns(winTrades: any[], results: any[]) {
  if (winTrades.length === 0) return {};
  
  // Exit type distribution
  const exitTypes: Record<string, number> = {};
  winTrades.forEach(trade => {
    const exitType = trade.exitType || 'UNKNOWN';
    exitTypes[exitType] = (exitTypes[exitType] || 0) + 1;
  });
  
  // Direction preference
  const directions: Record<string, number> = {};
  winTrades.forEach(trade => {
    const type = trade.type || 'UNKNOWN';
    directions[type] = (directions[type] || 0) + 1;
  });
  
  // Average profit characteristics
  const avgProfit = winTrades.reduce((sum, t) => sum + t.pnl, 0) / winTrades.length;
  const avgProfitPercent = winTrades.reduce((sum, t) => sum + Math.abs(t.pnlPercent || 0), 0) / winTrades.length;
  
  // Size distribution (small vs large positions)
  const avgSize = winTrades.reduce((sum, t) => sum + t.size, 0) / winTrades.length;
  const largePositions = winTrades.filter(t => t.size > avgSize * 1.2).length;
  const smallPositions = winTrades.filter(t => t.size < avgSize * 0.8).length;
  
  return {
    exitTypes,
    directions,
    avgProfit,
    avgProfitPercent,
    avgSize,
    largePositions,
    smallPositions,
    mostCommonExit: Object.keys(exitTypes).reduce((a, b) => exitTypes[a] > exitTypes[b] ? a : b, ''),
    preferredDirection: Object.keys(directions).reduce((a, b) => directions[a] > directions[b] ? a : b, '')
  };
}

// Analyze losing trade patterns
function analyzeLossPatterns(lossTrades: any[], results: any[]) {
  if (lossTrades.length === 0) return {};
  
  // Exit type distribution
  const exitTypes: Record<string, number> = {};
  lossTrades.forEach(trade => {
    const exitType = trade.exitType || 'UNKNOWN';
    exitTypes[exitType] = (exitTypes[exitType] || 0) + 1;
  });
  
  // Direction issues
  const directions: Record<string, number> = {};
  lossTrades.forEach(trade => {
    const type = trade.type || 'UNKNOWN';
    directions[type] = (directions[type] || 0) + 1;
  });
  
  // Average loss characteristics
  const avgLoss = lossTrades.reduce((sum, t) => sum + t.pnl, 0) / lossTrades.length;
  const avgLossPercent = lossTrades.reduce((sum, t) => sum + Math.abs(t.pnlPercent || 0), 0) / lossTrades.length;
  
  // Size issues
  const avgSize = lossTrades.reduce((sum, t) => sum + t.size, 0) / lossTrades.length;
  const oversizedTrades = lossTrades.filter(t => t.size > avgSize * 1.5).length;
  
  return {
    exitTypes,
    directions,
    avgLoss,
    avgLossPercent,
    avgSize,
    oversizedTrades,
    mostCommonExit: Object.keys(exitTypes).reduce((a, b) => exitTypes[a] > exitTypes[b] ? a : b, ''),
    problematicDirection: Object.keys(directions).reduce((a, b) => directions[a] > directions[b] ? a : b, '')
  };
}

// Analyze risk management effectiveness
function analyzeRiskManagement(results: any[]) {
  const avgRiskReward = results.reduce((sum, r) => {
    const rr = Math.abs(r.largestWin / (r.largestLoss || -1));
    return sum + (isFinite(rr) ? rr : 0);
  }, 0) / results.length;
  
  const avgWinSize = results.reduce((sum, r) => sum + r.avgWin, 0) / results.length;
  const avgLossSize = results.reduce((sum, r) => sum + Math.abs(r.avgLoss), 0) / results.length;
  
  const goodRiskReward = results.filter(r => {
    const rr = Math.abs(r.largestWin / (r.largestLoss || -1));
    return isFinite(rr) && rr >= 2;
  }).length;
  
  return {
    avgRiskReward,
    avgWinSize,
    avgLossSize,
    goodRiskRewardCount: goodRiskReward,
    goodRiskRewardPercent: (goodRiskReward / results.length) * 100,
    riskConsistency: avgLossSize < avgWinSize * 0.8 ? 'Good' : 'Needs Improvement'
  };
}

// Analyze timing patterns
function analyzeTimingPatterns(winTrades: any[], lossTrades: any[]) {
  // Duration analysis would go here if we had duration data
  // For now, just placeholder structure
  
  return {
    avgWinDuration: 'N/A',
    avgLossDuration: 'N/A',
    quickWins: 0,
    quickLosses: 0,
    insight: 'Duration data not yet available in sample trades'
  };
}

// Generate educational lessons
function generateLessons(winPatterns: any, lossPatterns: any, results: any[]): string[] {
  const lessons: string[] = [];
  
  // Win pattern lessons
  if (winPatterns.mostCommonExit) {
    const exitPercent = (winPatterns.exitTypes[winPatterns.mostCommonExit] / Object.values(winPatterns.exitTypes).reduce((a: number, b) => a + (b as number), 0)) * 100;
    lessons.push(`🎯 ${exitPercent.toFixed(0)}% of winning trades exit via ${winPatterns.mostCommonExit} - this is your most reliable profit capture method`);
  }
  
  if (winPatterns.preferredDirection) {
    const dirPercent = (winPatterns.directions[winPatterns.preferredDirection] / Object.values(winPatterns.directions).reduce((a: number, b) => a + (b as number), 0)) * 100;
    lessons.push(`📈 ${winPatterns.preferredDirection} trades win ${dirPercent.toFixed(0)}% of the time - strategy has directional bias`);
  }
  
  if (winPatterns.avgProfitPercent) {
    lessons.push(`💰 Average winning trade captures ${winPatterns.avgProfitPercent.toFixed(2)}% profit - expect realistic gains around this level`);
  }
  
  // Loss pattern lessons
  if (lossPatterns.mostCommonExit) {
    const exitPercent = (lossPatterns.exitTypes[lossPatterns.mostCommonExit] / Object.values(lossPatterns.exitTypes).reduce((a: number, b) => a + (b as number), 0)) * 100;
    lessons.push(`⚠️ ${exitPercent.toFixed(0)}% of losses hit ${lossPatterns.mostCommonExit} - review stop loss placement and emergency exits`);
  }
  
  if (lossPatterns.oversizedTrades > 0) {
    lessons.push(`🚨 ${lossPatterns.oversizedTrades} oversized losing trades detected - maintain consistent position sizing to limit risk`);
  }
  
  if (lossPatterns.avgLossPercent) {
    lessons.push(`📉 Average loss is ${Math.abs(lossPatterns.avgLossPercent).toFixed(2)}% - losses are ${winPatterns.avgProfitPercent > Math.abs(lossPatterns.avgLossPercent) ? 'well-managed' : 'too large'} compared to wins`);
  }
  
  // Risk management lessons
  const avgWinRate = results.reduce((sum, r) => sum + r.winRate, 0) / results.length;
  if (avgWinRate > 75) {
    lessons.push(`✅ ${avgWinRate.toFixed(1)}% win rate shows strategy is highly selective - continue filtering low-probability setups`);
  } else if (avgWinRate < 60) {
    lessons.push(`⚠️ ${avgWinRate.toFixed(1)}% win rate suggests too many false signals - tighten entry criteria or improve filters`);
  }
  
  // Profit factor lessons
  const avgPF = results.reduce((sum, r) => sum + r.profitFactor, 0) / results.length;
  if (avgPF > 5) {
    lessons.push(`🚀 ${avgPF.toFixed(1)} profit factor indicates exceptional edge - ${avgPF.toFixed(1)}x more profit than loss is elite performance`);
  } else if (avgPF < 2) {
    lessons.push(`⚠️ ${avgPF.toFixed(1)} profit factor needs improvement - aim for at least 3.0 by increasing win rate or improving risk/reward`);
  }
  
  // Position sizing lessons
  if (winPatterns.largePositions > winPatterns.smallPositions) {
    lessons.push(`💪 Larger positions tend to win more often - consider scaling into high-confidence setups`);
  } else if (winPatterns.smallPositions > winPatterns.largePositions) {
    lessons.push(`🎯 Smaller positions are more profitable - avoid over-leveraging, stick to conservative sizing`);
  }
  
  // Consistency lessons
  const roiValues = results.map(r => r.roi);
  const avgROI = roiValues.reduce((sum, val) => sum + val, 0) / roiValues.length;
  const stdDev = Math.sqrt(roiValues.map(val => Math.pow(val - avgROI, 2)).reduce((sum, val) => sum + val, 0) / roiValues.length);
  const cv = (stdDev / avgROI) * 100;
  
  if (cv < 20) {
    lessons.push(`✅ Results are highly consistent (CV: ${cv.toFixed(1)}%) - strategy performs reliably across different market conditions`);
  } else if (cv > 50) {
    lessons.push(`⚠️ High result variation (CV: ${cv.toFixed(1)}%) - performance depends heavily on market conditions, consider adding filters`);
  }
  
  return lessons;
}
