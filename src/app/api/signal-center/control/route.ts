/**
 * 📡 API: Signal Center - Control (Start/Stop)
 * 
 * POST /api/signal-center/control
 * Admin endpoint to start/stop signal generation
 * 
 * ✅ FIXED: Now persists state to MongoDB (no more in-memory)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { connectDB } from '@/lib/mongodb';
import SignalCenterState from '@/models/SignalCenterState';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // ===== DATABASE CONNECTION =====
    await connectDB();
    
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
    
    const adminEmail = authResult.admin?.email || 'unknown';
    
    // ===== START SIGNAL CENTER =====
    if (action === 'start') {
      try {
        const state = await SignalCenterState.startSignalCenter(adminEmail, config);
        
        return NextResponse.json({
          success: true,
          message: 'Signal Center started successfully',
          state: {
            running: state.running,
            startedAt: state.startedAt?.getTime() || null,
            startedBy: state.startedBy,
            config: state.config,
          },
        });
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: error.message || 'Failed to start Signal Center',
        }, { status: 400 });
      }
    }
    
    // ===== STOP SIGNAL CENTER =====
    if (action === 'stop') {
      try {
        const { state, uptime } = await SignalCenterState.stopSignalCenter(adminEmail);
        
        return NextResponse.json({
          success: true,
          message: 'Signal Center stopped successfully',
          uptime,
          state: {
            running: state.running,
            startedAt: state.startedAt?.getTime() || null,
            stoppedAt: state.stoppedAt?.getTime() || null,
            stoppedBy: state.stoppedBy,
            totalUptime: state.uptime,
          },
        });
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: error.message || 'Failed to stop Signal Center',
        }, { status: 400 });
      }
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
    // ===== DATABASE CONNECTION =====
    await connectDB();
    
    // ===== ADMIN AUTH CHECK =====
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get current state from database
    const state = await SignalCenterState.getCurrentState();
    
    const uptime = state.running && state.startedAt
      ? Math.floor((Date.now() - state.startedAt.getTime()) / 1000)
      : 0;
    
    return NextResponse.json({
      success: true,
      state: {
        running: state.running,
        startedAt: state.startedAt?.getTime() || null,
        startedBy: state.startedBy,
        stoppedAt: state.stoppedAt?.getTime() || null,
        stoppedBy: state.stoppedBy,
        config: state.config,
        totalUptime: state.uptime,
      },
      uptime,
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
