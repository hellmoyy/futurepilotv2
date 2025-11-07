/**
 * 📰 Control Auto News Fetcher
 * 
 * API untuk start/stop/status auto news fetching
 * 
 * POST /api/cron/control-news - Start fetcher
 * DELETE /api/cron/control-news - Stop fetcher
 * GET /api/cron/control-news - Get status
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  startNewsFetcher,
  stopNewsFetcher,
  getFetcherStatus,
  resetFetcherStats,
} from '@/lib/cron/news-fetcher';

// ============================================================================
// 🚀 POST - Start News Fetcher
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { intervalSeconds = 60 } = body; // Default 1 minute

    // Validate interval (minimum 60 seconds to avoid API rate limits)
    if (intervalSeconds < 60 || intervalSeconds > 3600) {
      return NextResponse.json(
        { error: 'Interval must be between 60 and 3600 seconds (1-60 minutes)' },
        { status: 400 }
      );
    }

    await startNewsFetcher(intervalSeconds);

    return NextResponse.json({
      success: true,
      message: `Auto news fetcher started (every ${intervalSeconds} seconds = ${intervalSeconds / 60} minutes)`,
      intervalSeconds,
      intervalMinutes: intervalSeconds / 60,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// 🛑 DELETE - Stop News Fetcher
// ============================================================================

export async function DELETE(req: NextRequest) {
  try {
    stopNewsFetcher();

    return NextResponse.json({
      success: true,
      message: 'Auto news fetcher stopped',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// 📊 GET - News Fetcher Status
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const status = getFetcherStatus();

    return NextResponse.json({
      success: true,
      status: status.isRunning ? 'running' : 'stopped',
      ...status,
      uptimeMinutes: status.uptime ? Math.floor(status.uptime / 60000) : 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// 🔄 PATCH - Reset Statistics
// ============================================================================

export async function PATCH(req: NextRequest) {
  try {
    resetFetcherStats();

    return NextResponse.json({
      success: true,
      message: 'News fetcher statistics reset',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
