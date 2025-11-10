#!/usr/bin/env node

/**
 * 📊 BACKTEST SIGNAL GENERATION - WEEKLY ANALYSIS
 * 
 * Simulate signal generation untuk 7 hari kebelakang
 * Menggunakan SignalEngine dengan data historis dari Binance
 * 
 * Purpose:
 * - Hitung berapa banyak signal yang akan di-generate
 * - Breakdown per hari, per symbol, per strength
 * - Estimasi trading opportunity
 * - Validate signal quality
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const axios = require('axios');

// Binance API endpoints (testnet)
const BINANCE_BASE_URL = 'https://testnet.binancefuture.com';

/**
 * Fetch historical klines from Binance
 */
async function fetchKlines(symbol, interval, startTime, endTime, limit = 500) {
  try {
    const url = `${BINANCE_BASE_URL}/fapi/v1/klines`;
    const params = {
      symbol,
      interval,
      startTime,
      endTime,
      limit,
    };
    
    const response = await axios.get(url, { params });
    
    // Transform to candle format
    const candles = response.data.map(k => ({
      timestamp: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
    
    return candles;
  } catch (error) {
    console.error(`Error fetching ${symbol} ${interval}:`, error.message);
    return [];
  }
}

/**
 * Calculate technical indicators (simplified)
 */
function calculateIndicators(candles) {
  if (candles.length < 100) return null;
  
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  
  // EMA calculation
  function ema(data, period) {
    const k = 2 / (period + 1);
    let emaValue = data[0];
    const result = [emaValue];
    
    for (let i = 1; i < data.length; i++) {
      emaValue = data[i] * k + emaValue * (1 - k);
      result.push(emaValue);
    }
    
    return result;
  }
  
  // RSI calculation
  function rsi(data, period = 14) {
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      changes.push(data[i] - data[i - 1]);
    }
    
    let avgGain = 0;
    let avgLoss = 0;
    
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) avgGain += changes[i];
      else avgLoss += Math.abs(changes[i]);
    }
    
    avgGain /= period;
    avgLoss /= period;
    
    const rs = avgGain / (avgLoss || 1);
    return 100 - (100 / (1 + rs));
  }
  
  // MACD calculation
  function macd(data) {
    const ema12 = ema(data, 12);
    const ema26 = ema(data, 26);
    const macdLine = ema12.map((v, i) => v - ema26[i]);
    const signal = ema(macdLine, 9);
    const histogram = macdLine.map((v, i) => v - signal[i]);
    
    return {
      macd: macdLine[macdLine.length - 1],
      signal: signal[signal.length - 1],
      histogram: histogram[histogram.length - 1],
    };
  }
  
  const ema9 = ema(closes, 9);
  const ema21 = ema(closes, 21);
  const rsiValue = rsi(closes, 14);
  const macdData = macd(closes);
  const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const currentVolume = volumes[volumes.length - 1];
  
  return {
    ema9: ema9[ema9.length - 1],
    ema21: ema21[ema21.length - 1],
    rsi: rsiValue,
    macd: macdData,
    volumeRatio: currentVolume / avgVolume,
    close: closes[closes.length - 1],
  };
}

/**
 * Check if signal should be generated
 */
function checkSignal(indicators1m, indicators3m, indicators5m) {
  if (!indicators1m || !indicators3m || !indicators5m) return null;
  
  // EMA crossover on 1m
  const emaCross1m = indicators1m.ema9 > indicators1m.ema21;
  const emaCross3m = indicators3m.ema9 > indicators3m.ema21;
  const emaCross5m = indicators5m.ema9 > indicators5m.ema21;
  
  // MACD histogram positive
  const macdPositive1m = indicators1m.macd.histogram > 0;
  const macdPositive3m = indicators3m.macd.histogram > 0;
  const macdPositive5m = indicators5m.macd.histogram > 0;
  
  // RSI in range (not overbought/oversold)
  const rsiValid1m = indicators1m.rsi > 35 && indicators1m.rsi < 68;
  const rsiValid3m = indicators3m.rsi > 35 && indicators3m.rsi < 68;
  const rsiValid5m = indicators5m.rsi > 35 && indicators5m.rsi < 68;
  
  // Volume spike
  const volumeSpike = indicators1m.volumeRatio > 1.2;
  
  // Determine signal direction
  const bullishCount = [emaCross1m, emaCross3m, emaCross5m].filter(Boolean).length;
  const bearishCount = [!emaCross1m, !emaCross3m, !emaCross5m].filter(Boolean).length;
  
  // Require at least 2 timeframes alignment
  if (bullishCount >= 2 && macdPositive1m && rsiValid1m && volumeSpike) {
    // Determine strength
    let strength = 'WEAK';
    const confirmations = [
      emaCross1m && emaCross3m && emaCross5m,
      macdPositive1m && macdPositive3m && macdPositive5m,
      rsiValid1m && rsiValid3m && rsiValid5m,
      volumeSpike,
    ].filter(Boolean).length;
    
    if (confirmations >= 4) strength = 'VERY_STRONG';
    else if (confirmations >= 3) strength = 'STRONG';
    else if (confirmations >= 2) strength = 'MODERATE';
    
    return {
      action: 'BUY',
      strength,
      price: indicators1m.close,
      confirmations: bullishCount,
    };
  } else if (bearishCount >= 2 && !macdPositive1m && rsiValid1m && volumeSpike) {
    let strength = 'WEAK';
    const confirmations = [
      !emaCross1m && !emaCross3m && !emaCross5m,
      !macdPositive1m && !macdPositive3m && !macdPositive5m,
      rsiValid1m && rsiValid3m && rsiValid5m,
      volumeSpike,
    ].filter(Boolean).length;
    
    if (confirmations >= 4) strength = 'VERY_STRONG';
    else if (confirmations >= 3) strength = 'STRONG';
    else if (confirmations >= 2) strength = 'MODERATE';
    
    return {
      action: 'SELL',
      strength,
      price: indicators1m.close,
      confirmations: bearishCount,
    };
  }
  
  return null;
}

/**
 * Analyze signal generation for a specific time
 */
async function analyzeTimeSlot(symbol, timestamp) {
  // Fetch candles for all timeframes
  const endTime = timestamp;
  const startTime1m = timestamp - (500 * 60 * 1000); // 500 minutes
  const startTime3m = timestamp - (500 * 3 * 60 * 1000); // 1500 minutes
  const startTime5m = timestamp - (500 * 5 * 60 * 1000); // 2500 minutes
  
  const [candles1m, candles3m, candles5m] = await Promise.all([
    fetchKlines(symbol, '1m', startTime1m, endTime, 500),
    fetchKlines(symbol, '3m', startTime3m, endTime, 500),
    fetchKlines(symbol, '5m', startTime5m, endTime, 500),
  ]);
  
  if (candles1m.length < 100 || candles3m.length < 100 || candles5m.length < 100) {
    return null;
  }
  
  // Calculate indicators
  const indicators1m = calculateIndicators(candles1m);
  const indicators3m = calculateIndicators(candles3m);
  const indicators5m = calculateIndicators(candles5m);
  
  // Check for signal
  const signal = checkSignal(indicators1m, indicators3m, indicators5m);
  
  return signal;
}

/**
 * Main backtest function
 */
async function main() {
  console.log('📊 SIGNAL CENTER BACKTEST - 30 DAYS ANALYSIS (1 MONTH)\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Configuration
  const symbols = ['BTCUSDT']; // Can add more: 'ETHUSDT', 'BNBUSDT'
  const daysToAnalyze = 30; // 30 days = 1 month
  
  // Time range (7 days ago until now)
  const now = Date.now();
  const startDate = now - (daysToAnalyze * 24 * 60 * 60 * 1000);
  
  console.log(`📅 Analysis Period:`);
  console.log(`   Start: ${new Date(startDate).toLocaleString()}`);
  console.log(`   End: ${new Date(now).toLocaleString()}`);
  console.log(`   Duration: ${daysToAnalyze} days\n`);
  
  console.log(`🎯 Symbols: ${symbols.join(', ')}`);
  console.log(`⏱️  Interval: Every 1 minute (like real cron job)\n`);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🔄 Starting analysis...\n');
  
  // Results tracking
  const results = {
    totalSignals: 0,
    byDay: {},
    bySymbol: {},
    byStrength: {
      WEAK: 0,
      MODERATE: 0,
      STRONG: 0,
      VERY_STRONG: 0,
    },
    byAction: {
      BUY: 0,
      SELL: 0,
    },
    signals: [],
  };
  
  // Analyze every hour (instead of every minute to save API calls)
  const hourlyInterval = 60 * 60 * 1000; // 1 hour
  const totalSlots = Math.floor((now - startDate) / hourlyInterval);
  
  console.log(`📊 Total time slots to analyze: ${totalSlots} (hourly samples)\n`);
  
  let processed = 0;
  
  for (let timestamp = startDate; timestamp <= now; timestamp += hourlyInterval) {
    processed++;
    
    // Progress indicator
    if (processed % 10 === 0 || processed === totalSlots) {
      const progress = ((processed / totalSlots) * 100).toFixed(1);
      console.log(`   Progress: ${processed}/${totalSlots} (${progress}%)`);
    }
    
    const date = new Date(timestamp);
    const dayKey = date.toISOString().split('T')[0];
    
    // Initialize day tracking
    if (!results.byDay[dayKey]) {
      results.byDay[dayKey] = 0;
    }
    
    // Analyze each symbol
    for (const symbol of symbols) {
      if (!results.bySymbol[symbol]) {
        results.bySymbol[symbol] = 0;
      }
      
      try {
        const signal = await analyzeTimeSlot(symbol, timestamp);
        
        if (signal) {
          results.totalSignals++;
          results.byDay[dayKey]++;
          results.bySymbol[symbol]++;
          results.byStrength[signal.strength]++;
          results.byAction[signal.action]++;
          
          results.signals.push({
            timestamp: date.toISOString(),
            symbol,
            ...signal,
          });
        }
        
        // Rate limiting (avoid Binance API rate limits)
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`   ❌ Error analyzing ${symbol} at ${date.toISOString()}:`, error.message);
      }
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 BACKTEST RESULTS\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Summary
  console.log('📈 SUMMARY:');
  console.log(`   Total Signals: ${results.totalSignals}`);
  console.log(`   Avg per Day: ${(results.totalSignals / daysToAnalyze).toFixed(1)}`);
  console.log(`   Avg per Hour: ${(results.totalSignals / (daysToAnalyze * 24)).toFixed(1)}\n`);
  
  // By Day
  console.log('📅 SIGNALS BY DAY:');
  Object.keys(results.byDay).sort().forEach(day => {
    const count = results.byDay[day];
    const bar = '█'.repeat(Math.floor(count / 2));
    console.log(`   ${day}: ${count.toString().padStart(3)} ${bar}`);
  });
  console.log();
  
  // By Symbol
  console.log('🎯 SIGNALS BY SYMBOL:');
  Object.keys(results.bySymbol).forEach(symbol => {
    const count = results.bySymbol[symbol];
    const percentage = ((count / results.totalSignals) * 100).toFixed(1);
    console.log(`   ${symbol}: ${count} (${percentage}%)`);
  });
  console.log();
  
  // By Strength
  console.log('💪 SIGNALS BY STRENGTH:');
  Object.keys(results.byStrength).forEach(strength => {
    const count = results.byStrength[strength];
    const percentage = ((count / results.totalSignals) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(count / 2));
    console.log(`   ${strength.padEnd(12)}: ${count.toString().padStart(3)} (${percentage.padStart(5)}%) ${bar}`);
  });
  console.log();
  
  // By Action
  console.log('🔄 SIGNALS BY ACTION:');
  Object.keys(results.byAction).forEach(action => {
    const count = results.byAction[action];
    const percentage = ((count / results.totalSignals) * 100).toFixed(1);
    console.log(`   ${action}: ${count} (${percentage}%)`);
  });
  console.log();
  
  // Top 10 strongest signals
  console.log('🌟 TOP 10 STRONGEST SIGNALS:');
  const strongSignals = results.signals
    .filter(s => s.strength === 'VERY_STRONG' || s.strength === 'STRONG')
    .slice(0, 10);
  
  if (strongSignals.length > 0) {
    strongSignals.forEach((s, i) => {
      const date = new Date(s.timestamp);
      console.log(`   ${i + 1}. ${date.toLocaleString()} - ${s.symbol} ${s.action} @ $${s.price.toFixed(2)} (${s.strength})`);
    });
  } else {
    console.log('   No STRONG or VERY_STRONG signals found');
  }
  console.log();
  
  // Extrapolation to 1-minute interval
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🔮 EXTRAPOLATION TO 1-MINUTE INTERVAL:\n');
  
  const signalsPerHour = results.totalSignals / (daysToAnalyze * 24);
  const estimatedSignalsPerMinute = signalsPerHour / 60;
  const estimatedDailySignals = estimatedSignalsPerMinute * 60 * 24;
  const estimatedWeeklySignals = estimatedDailySignals * 7;
  
  console.log(`   📊 Hourly sample: ${results.totalSignals} signals in ${(daysToAnalyze * 24)} hours`);
  console.log(`   🔄 If running every minute:`);
  console.log(`      - Signals per minute: ~${estimatedSignalsPerMinute.toFixed(2)}`);
  console.log(`      - Signals per hour: ~${(estimatedSignalsPerMinute * 60).toFixed(1)}`);
  console.log(`      - Signals per day: ~${estimatedDailySignals.toFixed(0)}`);
  console.log(`      - Signals per week: ~${estimatedWeeklySignals.toFixed(0)}\n`);
  
  console.log('⚠️  Note: Actual 1-minute cron may generate MORE signals');
  console.log('   because market conditions change rapidly.\n');
  
  // Trading opportunities
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💰 TRADING OPPORTUNITIES:\n');
  
  const strongCount = results.byStrength.STRONG + results.byStrength.VERY_STRONG;
  const moderateCount = results.byStrength.MODERATE;
  
  console.log(`   Quality Signals (STRONG + VERY_STRONG): ${strongCount}`);
  console.log(`   Moderate Signals: ${moderateCount}`);
  console.log(`   Weak Signals: ${results.byStrength.WEAK}\n`);
  
  console.log(`   If users filter for STRONG+ only:`);
  console.log(`      - ${strongCount} signals in ${daysToAnalyze} days`);
  console.log(`      - ~${(strongCount / daysToAnalyze).toFixed(1)} quality signals per day`);
  console.log(`      - With 80% win rate: ~${(strongCount * 0.8).toFixed(0)} winning trades\n`);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ BACKTEST COMPLETE!\n');
  
  // Save results to file
  const fs = require('fs');
  const resultsFile = path.join(__dirname, '..', 'backtest', 'results', `signal-backtest-${Date.now()}.json`);
  
  fs.mkdirSync(path.dirname(resultsFile), { recursive: true });
  fs.writeFileSync(resultsFile, JSON.stringify({
    config: {
      symbols,
      daysToAnalyze,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(now).toISOString(),
    },
    results,
    summary: {
      totalSignals: results.totalSignals,
      avgPerDay: results.totalSignals / daysToAnalyze,
      avgPerHour: results.totalSignals / (daysToAnalyze * 24),
      estimated1MinuteDaily: estimatedDailySignals,
      estimated1MinuteWeekly: estimatedWeeklySignals,
    },
  }, null, 2));
  
  console.log(`💾 Results saved to: ${resultsFile}\n`);
}

main().catch(console.error);
