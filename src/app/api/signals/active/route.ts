/**
 * 🎯 ACTIVE SIGNALS API
 * 
 * GET /api/signals/active
 * 
 * Fetch active trading signals yang belum expired
 * - Auto-filter expired signals
 * - Sort by confidence
 * - Limit results
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Signal from '@/models/Signal';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const symbol = searchParams.get('symbol');
    const minConfidence = 60; // Lowered to 60% for testing

    // Build query
    const query: any = {
      status: 'active',
      expiresAt: { $gt: new Date() }, // Not expired
      confidence: { $gte: minConfidence },
      isPublic: true,
      action: { $ne: 'HOLD' }, // Exclude HOLD signals
    };

    if (symbol) {
      query.symbol = symbol.toUpperCase();
    }

    // Fetch active signals
    const signals = await Signal.find(query)
      .sort({ confidence: -1, generatedAt: -1 })
      .limit(limit)
      .lean();

    // Calculate time remaining for each signal
    const now = Date.now();
    const signalsWithTimeRemaining = signals.map(signal => {
      const expiresAt = new Date(signal.expiresAt).getTime();
      const timeRemaining = Math.max(0, expiresAt - now);
      const timeRemainingMinutes = Math.floor(timeRemaining / 60000);

      return {
        ...signal,
        timeRemaining,
        timeRemainingMinutes,
        isExpiringSoon: timeRemainingMinutes < 15, // Less than 15 minutes
      };
    });

    // Auto-expire old signals (cleanup)
    const expiredCount = await Signal.updateMany(
      {
        status: 'active',
        expiresAt: { $lte: new Date() },
      },
      {
        $set: { status: 'expired' },
      }
    );

    if (expiredCount.modifiedCount > 0) {
      console.log(`🧹 Auto-expired ${expiredCount.modifiedCount} old signals`);
    }

    return NextResponse.json({
      success: true,
      count: signalsWithTimeRemaining.length,
      signals: signalsWithTimeRemaining,
      expiredCleanup: expiredCount.modifiedCount,
    });

  } catch (error: any) {
    console.error('❌ Error fetching active signals:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch active signals',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
