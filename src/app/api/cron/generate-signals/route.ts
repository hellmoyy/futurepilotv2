import { NextRequest, NextResponse } from 'next/server';
import { SignalEngine, signalBroadcaster } from '@/lib/signal-center';
import { fetchMultiTimeframeCandlesWithRetry, validateCandles } from '@/lib/binance/candleFetcher';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

let stats = { 
  totalRuns: 0, 
  successfulRuns: 0, 
  failedRuns: 0, 
  signalsGenerated: 0, 
  lastRun: 0, 
  lastError: '' 
};

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🤖 SIGNAL GENERATOR START');
    stats.totalRuns++;
    stats.lastRun = startTime;
    
    const symbol = 'BTCUSDT';
    const candles = await fetchMultiTimeframeCandlesWithRetry(symbol, 100, 3, 1000);
    
    console.log(`✅ Candles fetched`);
    
    if (!validateCandles(candles['1m']) || !validateCandles(candles['3m']) || !validateCandles(candles['5m'])) {
      throw new Error('Invalid candles data');
    }
    
    const engine = new SignalEngine();
    const result = await engine.analyze(symbol, candles['1m'], candles['3m'], candles['5m']);
    
    if (!result.signal) {
      console.log('⚠️  No signal generated');
      stats.successfulRuns++;
      return NextResponse.json({ success: true, signal: null, message: 'No signal', stats });
    }
    
    const signal = result.signal;
    console.log(`🎯 Signal: ${signal.action} ${signal.symbol}`);
    signalBroadcaster.broadcast(signal);
    
    stats.successfulRuns++;
    stats.signalsGenerated++;
    
    console.log(`✅ Done (${Date.now() - startTime}ms)`);
    
    return NextResponse.json({ success: true, signal, stats });
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    stats.failedRuns++;
    stats.lastError = error.message;
    return NextResponse.json({ success: false, error: error.message, stats }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    status: 'ready', 
    stats, 
    broadcasterStats: signalBroadcaster.getStats() 
  });
}