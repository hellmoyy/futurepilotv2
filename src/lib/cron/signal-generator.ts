/**
 * 🤖 Internal Signal Generator
 * 
 * Background job yang berjalan setiap 5 detik
 * untuk generate trading signals otomatis
 */

import { LiveSignalEngine } from '@/lib/trading/engines/LiveSignalEngine';
import { fetchBinanceCandles } from '@/lib/trading/engines/CandleFetcher';
import TradingPairs from '@/config/trading-pairs';
import connectDB from '@/lib/mongodb';
import Signal from '@/models/Signal';

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

/**
 * Start auto signal generation
 * @param intervalSeconds - How often to generate (default: 5 seconds)
 */
export async function startSignalGenerator(intervalSeconds: number = 5) {
  if (isRunning) {
    console.log('⚠️  Signal generator already running');
    return;
  }

  isRunning = true;
  console.log(`🤖 Starting auto signal generator (every ${intervalSeconds} seconds)...`);

  // Run immediately
  await generateSignalsTask();

  // Then schedule recurring runs
  intervalId = setInterval(async () => {
    await generateSignalsTask();
  }, intervalSeconds * 1000);

  console.log(`✅ Signal generator started successfully`);
}

/**
 * Stop auto signal generation
 */
export function stopSignalGenerator() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
    console.log('🛑 Signal generator stopped');
  }
}

/**
 * Get generator status
 */
export function getGeneratorStatus() {
  return {
    isRunning,
    hasInterval: intervalId !== null,
  };
}

/**
 * Main task: Generate signals for all enabled pairs
 */
async function generateSignalsTask() {
  const startTime = Date.now();
  
  try {
    console.log('🔄 [AUTO] Generating signals...');

    // Connect to database
    await connectDB();

    // Get enabled trading pairs
    const enabledPairs = TradingPairs.getEnabledPairs();
    
    if (enabledPairs.length === 0) {
      console.log('⚠️  [AUTO] No enabled trading pairs found');
      return;
    }

    // Generate signals for all pairs in parallel
    const engine = new LiveSignalEngine();
    const results = await Promise.allSettled(
      enabledPairs.map(async (pair) => {
        try {
          // Fetch candles from Binance
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
              minConfidence: 80,
              enabledPairsOnly: true,
            }
          );

          // Save to MongoDB
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
          console.error(`❌ [AUTO] Error for ${pair.symbol}:`, error.message);
          return {
            symbol: pair.symbol,
            error: error.message,
            saved: false,
          };
        }
      })
    );

    // Count results
    const successful = results.filter(
      r => r.status === 'fulfilled' && r.value.saved
    ).length;
    const failed = results.length - successful;

    const duration = Date.now() - startTime;

    console.log(
      `✅ [AUTO] Generated ${successful} signals in ${duration}ms` +
      (failed > 0 ? ` (${failed} failed)` : '')
    );

  } catch (error: any) {
    console.error('❌ [AUTO] Fatal error:', error.message);
  }
}
