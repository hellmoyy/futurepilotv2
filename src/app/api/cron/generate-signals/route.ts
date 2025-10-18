/**
 * 🤖 CRON: Auto-Generate Signals
 * 
 * This endpoint is called by Upstash Cron to automatically generate trading signals
 * 
 * Setup:
 * 1. Go to https://console.upstash.com/qstash
 * 2. Create new scheduled request
 * 3. URL: https://yourdomain.com/api/cron/generate-signals
 * 4. Cron Expression: (star)(star)(star)(star)(star) - every minute (minimum for Upstash)
 *    Note: Upstash does not support sub-minute intervals (5 seconds not possible)
 * 5. Add Header: Authorization: Bearer YOUR_CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { LiveSignalEngine } from '@/lib/trading/engines/LiveSignalEngine';
import { fetchBinanceCandles } from '@/lib/trading/engines/CandleFetcher';
import TradingPairs from '@/config/trading-pairs';
import connectDB from '@/lib/mongodb';
import Signal from '@/models/Signal';

// ============================================================================
// 🔐 SECURITY: Verify Cron Secret
// ============================================================================

function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('❌ CRON_SECRET not configured in .env');
    return false;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ Missing or invalid Authorization header');
    return false;
  }

  const token = authHeader.substring(7);
  return token === cronSecret;
}

// ============================================================================
// 🚀 POST - Generate Signals (Called by Cron)
// ============================================================================

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify authentication
    if (!verifyCronAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid CRON_SECRET' },
        { status: 401 }
      );
    }

    console.log('🤖 [CRON] Auto-generating signals...');

    // Connect to database
    await connectDB();

    // Get enabled trading pairs
    const enabledPairs = TradingPairs.getEnabledPairs();
    console.log(`📊 [CRON] Found ${enabledPairs.length} enabled pairs`);

    if (enabledPairs.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No enabled trading pairs found',
      });
    }

    // Generate signals for all pairs
    const engine = new LiveSignalEngine();
    const results = await Promise.allSettled(
      enabledPairs.map(async (pair) => {
        try {
          // Fetch candles
          const candles = await fetchBinanceCandles(
            pair.symbol,
            '15m',
            100
          );

          if (candles.length < 50) {
            throw new Error('Insufficient candle data');
          }

          // Generate signal
          const signalData = await engine.generateSignal(
            pair.symbol,
            candles,
            {
              strategy: 'balanced',
              timeframe: '15m',
              minConfidence: 60, // Lowered to 60% for testing
              enabledPairsOnly: true,
            }
          );

          // Check if signal was generated
          if (!signalData) {
            throw new Error('Signal rejected (below confidence threshold or conflicting indicators)');
          }

          // Save to database
          const signal = new Signal({
            symbol: signalData.symbol,
            action: signalData.action,
            confidence: signalData.confidence,
            strength: signalData.strength,
            status: 'active',
            entryPrice: signalData.entryPrice,
            currentPrice: signalData.currentPrice,
            takeProfitLevels: signalData.takeProfitLevels,
            stopLoss: signalData.stopLoss,
            indicators: signalData.indicators,
            reasons: signalData.reasons,
            warnings: signalData.warnings,
            indicatorSummary: signalData.indicatorSummary,
            strategy: signalData.strategy,
            timeframe: signalData.timeframe,
            maxLeverage: signalData.maxLeverage,
            recommendedPositionSize: signalData.recommendedPositionSize,
            riskRewardRatio: signalData.riskRewardRatio,
            generatedAt: new Date(signalData.timestamp),
            expiresAt: new Date(signalData.expiresAt),
          });

          await signal.save();

          return {
            symbol: pair.symbol,
            action: signalData.action,
            confidence: signalData.confidence,
            saved: true,
          };
        } catch (error: any) {
          console.error(`❌ [CRON] Error generating signal for ${pair.symbol}:`, error.message);
          return {
            symbol: pair.symbol,
            error: error.message,
            saved: false,
          };
        }
      })
    );

    // Count successful signals
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.saved).length;
    const failed = results.length - successful;

    const duration = Date.now() - startTime;

    console.log(`✅ [CRON] Generated ${successful} signals in ${duration}ms`);
    if (failed > 0) {
      console.log(`⚠️ [CRON] Failed to generate ${failed} signals`);
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${successful} signals`,
      stats: {
        total: results.length,
        successful,
        failed,
        duration: `${duration}ms`,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ [CRON] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// 🔍 GET - Check Cron Status (Optional)
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    if (!verifyCronAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get recent signals (last 5 minutes)
    const recentSignals = await Signal.find({
      generatedAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    }).countDocuments();

    // Get active signals
    const activeSignals = await Signal.find({
      status: 'active',
      expiresAt: { $gt: new Date() }
    }).countDocuments();

    return NextResponse.json({
      status: 'ok',
      message: 'Cron endpoint is working',
      stats: {
        recentSignals5min: recentSignals,
        activeSignals,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
