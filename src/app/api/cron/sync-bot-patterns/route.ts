/**
 * 🔄 QStash Cron: Sync Bot Signal Patterns to Bot Decision
 * 
 * Schedule: Every 15 minutes
 * Purpose: Automatically import latest patterns from Bot Signal Learning Center
 * 
 * QStash Setup:
 * 1. Go to: https://console.upstash.com/qstash
 * 2. Create schedule: "Sync Bot Patterns"
 * 3. URL: https://your-domain.com/api/cron/sync-bot-patterns
 * 4. Schedule: Every 15 minutes (cron expression)
 * 5. Method: POST
 * 6. Headers: Authorization with Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  insights: string[];
  source: {
    totalBacktests: number;
    avgROI: number;
    totalWinningTrades: number;
    totalLosingTrades: number;
    winRate: number;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify cron secret (security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error('❌ CRON_SECRET not configured');
      return NextResponse.json({ 
        success: false, 
        error: 'CRON_SECRET not configured' 
      }, { status: 500 });
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    console.log('🔄 [CRON] Starting Bot Signal → Bot Decision pattern sync...');

    // Call internal sync API endpoint
    const syncUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${syncUrl}/api/admin/bot-decision/sync-signal-patterns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'backtest-learning',
        symbol: 'BTCUSDT',
        overwrite: false,
        cronJob: true // Flag to indicate this is automated sync
      })
    });

    const data: SyncResult = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Sync API failed');
    }

    const duration = Date.now() - startTime;

    console.log('✅ [CRON] Pattern sync completed successfully');
    console.log(`   📊 Created: ${data.created}, Updated: ${data.updated}, Skipped: ${data.skipped}`);
    console.log(`   ⏱️  Duration: ${duration}ms`);
    console.log(`   📈 Source: ${data.source.totalBacktests} backtests (${data.source.avgROI.toFixed(2)}% avg ROI)`);

    // Return detailed result
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      sync: {
        created: data.created,
        updated: data.updated,
        skipped: data.skipped,
        total: data.created + data.updated,
        insights: data.insights
      },
      source: {
        backtests: data.source.totalBacktests,
        avgROI: data.source.avgROI,
        winRate: data.source.winRate,
        totalTrades: data.source.totalWinningTrades + data.source.totalLosingTrades
      },
      message: `Pattern sync completed: ${data.created} created, ${data.updated} updated in ${duration}ms`
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error('❌ [CRON] Pattern sync failed:', error.message);
    console.error('   ⏱️  Duration:', `${duration}ms`);
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      error: error.message,
      message: 'Pattern sync failed'
    }, { status: 500 });
  }
}

// GET endpoint to check cron status
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      return NextResponse.json({ 
        success: false, 
        error: 'CRON_SECRET not configured' 
      }, { status: 500 });
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Get sync status from main endpoint
    const syncUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${syncUrl}/api/admin/bot-decision/sync-signal-patterns`, {
      method: 'GET'
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      cron: {
        endpoint: '/api/cron/sync-bot-patterns',
        schedule: 'Every 15 minutes',
        method: 'POST',
        enabled: !!cronSecret
      },
      status: data,
      nextRun: 'Calculated by QStash scheduler'
    });

  } catch (error: any) {
    console.error('❌ [CRON] Status check failed:', error.message);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
