import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getAIDecisionEngine, Signal } from '@/lib/ai-bot/AIDecisionEngine';

/**
 * POST /api/bot/decision/evaluate
 * 
 * Evaluate a trading signal using AI decision layer.
 * 
 * Request Body:
 * {
 *   userId: string;
 *   signal: {
 *     id: string;
 *     symbol: string;
 *     action: 'LONG' | 'SHORT';
 *     confidence: number;
 *     entryPrice: number;
 *     stopLoss: number;
 *     takeProfit: number;
 *     indicators?: { rsi, macd, adx, volume };
 *   }
 * }
 * 
 * Response:
 * {
 *   success: true;
 *   decision: 'EXECUTE' | 'SKIP';
 *   confidenceBreakdown: { technical, news, backtest, learning, total };
 *   reason: string;
 *   newsContext?: { sentiment, headlines, sources, impactScore };
 *   backtestContext?: { recentWinRate, recentTrades, ... };
 *   learningContext?: { patternsMatched, patternsAvoided, ... };
 *   aiCost: number;
 *   balanceSnapshot: { binanceBalance, gasFeeBalance, availableMargin };
 * }
 */

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { userId, signal } = body;
    
    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }
    
    if (!signal || !signal.id || !signal.symbol || !signal.action) {
      return NextResponse.json(
        { success: false, error: 'Invalid signal data' },
        { status: 400 }
      );
    }
    
    // Validate signal structure
    const validatedSignal: Signal = {
      id: signal.id,
      symbol: signal.symbol,
      action: signal.action,
      confidence: signal.confidence || 0.80,
      entryPrice: signal.entryPrice || 0,
      stopLoss: signal.stopLoss || 0,
      takeProfit: signal.takeProfit || 0,
      indicators: signal.indicators || {},
      timestamp: new Date(),
    };
    
    console.log(`🧠 Evaluating signal ${validatedSignal.id} for user ${userId}`);
    
    // Get AI decision engine
    const engine = getAIDecisionEngine();
    
    // Evaluate signal
    const result = await engine.evaluate(userId, validatedSignal);
    
    console.log(`${result.decision === 'EXECUTE' ? '✅' : '⏭️'} Decision: ${result.decision}`);
    console.log(`📊 Confidence: ${(result.confidenceBreakdown.total * 100).toFixed(1)}%`);
    console.log(`💰 AI Cost: $${result.aiCost.toFixed(4)}`);
    
    return NextResponse.json({
      success: true,
      ...result,
    });
    
  } catch (error: any) {
    console.error('❌ Error evaluating signal:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to evaluate signal',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bot/decision/evaluate?userId=xxx
 * 
 * Get evaluation status/info for a user
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }
    
    // Import models
    const UserBot = (await import('@/models/UserBot')).default;
    const AIDecision = (await import('@/models/AIDecision')).default;
    
    // Get user bot
    const userBot = await UserBot.findOne({ userId });
    
    if (!userBot) {
      return NextResponse.json(
        { success: false, error: 'UserBot not found' },
        { status: 404 }
      );
    }
    
    // Get recent decisions
    const recentDecisions = await AIDecision.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10);
    
    // Get today's stats
    const todayStats = await AIDecision.getStats(userId, {
      start: new Date(new Date().setHours(0, 0, 0, 0)),
      end: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      userBot: {
        status: userBot.status,
        aiConfig: userBot.aiConfig,
        tradingConfig: userBot.tradingConfig,
        balance: userBot.lastBalanceCheck,
        stats: userBot.stats,
      },
      todayStats,
      recentDecisions: recentDecisions.map(d => ({
        id: d._id,
        signalId: d.signalId,
        symbol: d.signal.symbol,
        action: d.signal.action,
        decision: d.decision,
        confidence: d.confidenceBreakdown.total,
        timestamp: d.timestamp,
      })),
    });
    
  } catch (error: any) {
    console.error('❌ Error getting evaluation info:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get evaluation info',
      },
      { status: 500 }
    );
  }
}
