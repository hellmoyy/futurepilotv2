/**
 * 📊 LATEST SIGNALS API
 * 
 * GET /api/signals/latest
 * 
 * Retrieve latest trading signals from database
 * Supports filtering, pagination, and sorting
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Signal from '@/models/Signal';

// ============================================================================
// 🔧 INTERFACES
// ============================================================================

interface SignalsQuery {
  symbol?: string;
  action?: 'LONG' | 'SHORT' | 'HOLD';
  status?: 'active' | 'executed' | 'expired' | 'cancelled';
  strategy?: 'conservative' | 'balanced' | 'aggressive' | 'custom';
  minConfidence?: number;
  limit?: number;
  page?: number;
  sortBy?: 'confidence' | 'timestamp' | 'symbol';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// 🔍 GET - Fetch Latest Signals
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const query: SignalsQuery = {
      symbol: searchParams.get('symbol')?.toUpperCase() || undefined,
      action: searchParams.get('action')?.toUpperCase() as any || undefined,
      status: searchParams.get('status') as any || undefined,
      strategy: searchParams.get('strategy') as any || undefined,
      minConfidence: searchParams.get('minConfidence') 
        ? parseFloat(searchParams.get('minConfidence')!) 
        : undefined,
      limit: searchParams.get('limit') 
        ? parseInt(searchParams.get('limit')!) 
        : 20,
      page: searchParams.get('page') 
        ? parseInt(searchParams.get('page')!) 
        : 1,
      sortBy: searchParams.get('sortBy') as any || 'timestamp',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
    };
    
    // Build MongoDB filter
    const filter: any = {};
    
    if (query.symbol) {
      filter.symbol = query.symbol;
    }
    
    if (query.action && query.action !== 'HOLD') {
      filter.action = query.action;
    }
    
    if (query.status) {
      filter.status = query.status;
    }
    
    if (query.strategy) {
      filter.strategy = query.strategy;
    }
    
    if (query.minConfidence) {
      filter.confidence = { $gte: query.minConfidence };
    }
    
    // Build sort object
    const sortField = query.sortBy === 'timestamp' ? 'generatedAt' : query.sortBy!;
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, number> = {};
    sort[sortField] = sortOrder;
    
    // Add secondary sort by generatedAt if not primary sort
    if (sortField !== 'generatedAt') {
      sort.generatedAt = -1;
    }
    
    // Calculate pagination
    const limit = Math.min(query.limit!, 100); // Max 100 per page
    const skip = (query.page! - 1) * limit;
    
    // Execute query
    const [signals, totalCount] = await Promise.all([
      Signal.find(filter)
        .sort(sort as any)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Signal.countDocuments(filter),
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = query.page! < totalPages;
    const hasPrevPage = query.page! > 1;
    
    // Format response
    const response = {
      success: true,
      data: signals.map(signal => ({
        id: signal._id,
        symbol: signal.symbol,
        action: signal.action,
        confidence: signal.confidence,
        strength: signal.strength,
        status: signal.status,
        entryPrice: signal.entryPrice,
        currentPrice: signal.currentPrice,
        takeProfitLevels: signal.takeProfitLevels,
        stopLoss: signal.stopLoss,
        riskRewardRatio: signal.riskRewardRatio,
        maxLeverage: signal.maxLeverage,
        recommendedPositionSize: signal.recommendedPositionSize,
        reasons: signal.reasons,
        warnings: signal.warnings,
        indicatorSummary: signal.indicatorSummary,
        indicators: signal.indicators,
        strategy: signal.strategy,
        timeframe: signal.timeframe,
        generatedAt: signal.generatedAt,
        expiresAt: signal.expiresAt,
        executedAt: signal.executedAt,
        closedAt: signal.closedAt,
        execution: signal.execution,
        performance: signal.performance,
      })),
      pagination: {
        currentPage: query.page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        symbol: query.symbol,
        action: query.action,
        status: query.status,
        strategy: query.strategy,
        minConfidence: query.minConfidence,
      },
      sort: {
        by: query.sortBy,
        order: query.sortOrder,
      },
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Error fetching signals:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch signals',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// 📊 GET ACTIVE SIGNALS
// ============================================================================

export async function OPTIONS(req: NextRequest) {
  try {
    await connectDB();
    
    // Get only active, non-expired signals
    const activeSignals = await Signal.find({
      status: 'active',
      expiresAt: { $gt: new Date() },
    })
      .sort({ confidence: -1, generatedAt: -1 })
      .limit(50)
      .lean()
      .exec();
    
    // Group by symbol
    const signalsBySymbol: Record<string, any[]> = {};
    
    for (const signal of activeSignals) {
      if (!signalsBySymbol[signal.symbol]) {
        signalsBySymbol[signal.symbol] = [];
      }
      signalsBySymbol[signal.symbol].push({
        id: signal._id,
        action: signal.action,
        confidence: signal.confidence,
        strength: signal.strength,
        entryPrice: signal.entryPrice,
        takeProfitLevels: signal.takeProfitLevels,
        stopLoss: signal.stopLoss,
        generatedAt: signal.generatedAt,
        expiresAt: signal.expiresAt,
      });
    }
    
    return NextResponse.json({
      success: true,
      count: activeSignals.length,
      signalsBySymbol,
      generatedAt: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching active signals:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch active signals',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// 📈 GET SIGNAL STATS
// ============================================================================

export async function HEAD(req: NextRequest) {
  try {
    await connectDB();
    
    const stats = await (Signal as any).getPerformanceStats();
    
    // Get signal counts by action
    const signalCounts = await Signal.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
        },
      },
    ]);
    
    // Get recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSignals = await Signal.countDocuments({
      generatedAt: { $gte: oneDayAgo },
    });
    
    const activeSignals = await Signal.countDocuments({
      status: 'active',
      expiresAt: { $gt: new Date() },
    });
    
    return NextResponse.json({
      success: true,
      stats: {
        overall: stats,
        byAction: signalCounts,
        recent24h: recentSignals,
        activeCount: activeSignals,
      },
      generatedAt: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching signal stats:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch signal stats',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
