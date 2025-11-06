/**
 * Backtest History API - Get saved backtest results
 * 
 * GET /api/backtest/history?limit=30&symbol=BTCUSDT
 * 
 * Returns recent backtest results with sample trades
 */

import { NextRequest, NextResponse } from 'next/server';
import BacktestResult from '@/models/BacktestResult';
import connectDB from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '30');
    const symbol = searchParams.get('symbol') || undefined;
    const configId = searchParams.get('configId') || undefined;
    
    // Build query
    const query: any = { status: 'completed' };
    if (symbol) query.symbol = symbol;
    if (configId) query.configId = configId;
    
    // Get results with pagination
    const results = await BacktestResult.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('configId', 'name description')
      .lean();
    
    // Get summary statistics (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentResults = await BacktestResult.find({
      status: 'completed',
      createdAt: { $gte: sevenDaysAgo }
    }).lean();
    
    // Calculate summary stats
    const summary = {
      totalRuns: recentResults.length,
      avgROI: recentResults.length > 0 
        ? recentResults.reduce((sum, r) => sum + r.roi, 0) / recentResults.length 
        : 0,
      bestROI: recentResults.length > 0 
        ? Math.max(...recentResults.map(r => r.roi)) 
        : 0,
      worstROI: recentResults.length > 0 
        ? Math.min(...recentResults.map(r => r.roi)) 
        : 0,
      avgWinRate: recentResults.length > 0 
        ? recentResults.reduce((sum, r) => sum + r.winRate, 0) / recentResults.length 
        : 0,
      totalTrades: recentResults.reduce((sum, r) => sum + r.totalTrades, 0),
    };
    
    // Get per-symbol performance
    const symbolPerformance = await BacktestResult.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: '$symbol',
          avgROI: { $avg: '$roi' },
          totalRuns: { $sum: 1 },
          avgWinRate: { $avg: '$winRate' },
          bestROI: { $max: '$roi' },
        }
      },
      {
        $sort: { avgROI: -1 }
      }
    ]);
    
    console.log(`📊 Fetched ${results.length} backtest history results`);
    console.log(`📈 Summary (last 7 days): ${summary.totalRuns} runs, avg ROI: ${summary.avgROI.toFixed(1)}%`);
    
    return NextResponse.json({
      success: true,
      results,
      summary,
      symbolPerformance,
      count: results.length,
    });
    
  } catch (error: any) {
    console.error('❌ Failed to fetch backtest history:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch backtest history',
    }, { status: 500 });
  }
}

/**
 * DELETE /api/backtest/history?id=xxx
 * Delete a specific backtest result
 */
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Result ID is required',
      }, { status: 400 });
    }
    
    const result = await BacktestResult.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Result not found',
      }, { status: 404 });
    }
    
    console.log(`🗑️ Deleted backtest result: ${id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Backtest result deleted',
    });
    
  } catch (error: any) {
    console.error('❌ Failed to delete backtest result:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete backtest result',
    }, { status: 500 });
  }
}
