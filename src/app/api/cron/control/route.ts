/**
 * 🎮 Control Auto Signal Generator
 * 
 * API untuk start/stop/status auto signal generation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  startSignalGenerator,
  stopSignalGenerator,
  getGeneratorStatus,
} from '@/lib/cron/signal-generator';

// ============================================================================
// 🚀 POST - Start Generator
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { intervalSeconds = 5 } = body;

    // Validate interval
    if (intervalSeconds < 1 || intervalSeconds > 3600) {
      return NextResponse.json(
        { error: 'Interval must be between 1 and 3600 seconds' },
        { status: 400 }
      );
    }

    await startSignalGenerator(intervalSeconds);

    return NextResponse.json({
      success: true,
      message: `Auto signal generator started (every ${intervalSeconds} seconds)`,
      intervalSeconds,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// 🛑 DELETE - Stop Generator
// ============================================================================

export async function DELETE(req: NextRequest) {
  try {
    stopSignalGenerator();

    return NextResponse.json({
      success: true,
      message: 'Auto signal generator stopped',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// 📊 GET - Generator Status
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const status = getGeneratorStatus();

    return NextResponse.json({
      success: true,
      status: status.isRunning ? 'running' : 'stopped',
      ...status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
