/**
 * 📡 API: Signal Center - History
 * 
 * GET /api/signal-center/history
 * Returns signal history with filters
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
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    
    // Get signal history from MongoDB (persistent)
    await connectDB();
    
    // Auto-expire old signals first
    await SignalCenterSignal.expireOldSignals();
    
    // Get history - ONLY non-active signals (EXECUTED, EXPIRED, CANCELLED)
    const history = await SignalCenterSignal.find({
      status: { $ne: 'ACTIVE' }
    })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return NextResponse.json({
      success: true,
      history,
      count: history.length,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('❌ Get signal history error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get signal history',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
