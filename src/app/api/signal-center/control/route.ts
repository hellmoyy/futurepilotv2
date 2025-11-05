/**
 * 📡 API: Signal Center - Control (Start/Stop)
 * 
 * POST /api/signal-center/control
 * Admin endpoint to start/stop signal generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ControlState {
  running: boolean;
  startedAt: number | null;
  config: any;
}

// In-memory state (will be replaced with Redis in production)
let signalCenterState: ControlState = {
  running: false,
  startedAt: null,
  config: null,
};

export async function POST(request: NextRequest) {
  try {
    // ===== ADMIN AUTH CHECK =====
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // ===== PARSE REQUEST =====
    const body = await request.json();
    const { action, config } = body; // action: 'start' | 'stop'
    
    if (!action || !['start', 'stop'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      );
    }
    
    // ===== START SIGNAL CENTER =====
    if (action === 'start') {
      if (signalCenterState.running) {
        return NextResponse.json({
          success: false,
          error: 'Signal Center already running',
          state: signalCenterState,
        });
      }
      
      signalCenterState = {
        running: true,
        startedAt: Date.now(),
        config: config || null,
      };
      
      console.log('🚀 Signal Center STARTED by admin:', authResult.admin?.email);
      
      return NextResponse.json({
        success: true,
        message: 'Signal Center started successfully',
        state: signalCenterState,
      });
    }
    
    // ===== STOP SIGNAL CENTER =====
    if (action === 'stop') {
      if (!signalCenterState.running) {
        return NextResponse.json({
          success: false,
          error: 'Signal Center not running',
          state: signalCenterState,
        });
      }
      
      const uptime = Date.now() - (signalCenterState.startedAt || 0);
      
      signalCenterState = {
        running: false,
        startedAt: null,
        config: null,
      };
      
      console.log('🛑 Signal Center STOPPED by admin:', authResult.admin?.email, `(uptime: ${Math.floor(uptime / 1000)}s)`);
      
      return NextResponse.json({
        success: true,
        message: 'Signal Center stopped successfully',
        uptime,
        state: signalCenterState,
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('❌ Signal Center control error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to control Signal Center',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

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
    
    // Return current state
    return NextResponse.json({
      success: true,
      state: signalCenterState,
      uptime: signalCenterState.running
        ? Date.now() - (signalCenterState.startedAt || 0)
        : 0,
    });
  } catch (error: any) {
    console.error('❌ Get Signal Center state error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get state',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
