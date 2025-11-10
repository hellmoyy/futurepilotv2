/**
 * 📡 API: Signal Center - Get Active Signals
 * 
 * GET /api/signal-center/signals
 * Returns active trading signals from Signal Center
 */

import { NextRequest, NextResponse } from 'next/server';
import { signalBroadcaster } from '@/lib/signal-center';
import { verifyAdminAuth } from '@/lib/adminAuth';
import connectDB from '@/lib/mongodb';
import SignalCenterSignal from '@/models/SignalCenterSignal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // ===== ADMIN AUTH CHECK =====
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    
    // Get active signals from MongoDB (primary source)
    await connectDB();
    
    // Auto-expire old signals first
    await SignalCenterSignal.expireOldSignals();
    
    const query: any = {
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() },
    };
    if (symbol) {
      query.symbol = symbol.toUpperCase();
    }
    
    const signals = await SignalCenterSignal.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
    
    // Get stats
    const stats = signalBroadcaster.getStats();
    
    return NextResponse.json({
      success: true,
      signals,
      stats,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('❌ Get active signals error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get active signals',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
