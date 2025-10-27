/**
 * 🚀 CACHED MULTI-PAIR BACKTESTER
 * 
 * Menggunakan data dari cache (folder data/)
 * Jauh lebih cepat karena tidak perlu download ulang
 * 
 * Usage:
 *   node run-cached-backtest.js --period 1w
 *   node run-cached-backtest.js --period 3m --coins BTC,ETH,BNB
 */

const fs = require('fs');
const path = require('path');
const { loadCachedData, COINS } = require('./download-data');

// Technical Indicators (same as run-multi-pair.js)
function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  let ema = data[0].close;
  const result = [ema];
  
  for (let i = 1; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

function calculateMACD(data) {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macdLine = ema12.map((val, i) => val - ema26[i]);
  
  const signalData = macdLine.map(val => ({ close: val }));
  const signal = calculateEMA(signalData, 9);
  const histogram = macdLine.map((val, i) => val - signal[i]);
  
  return macdLine.map((val, i) => ({
    macd: val,
    signal: signal[i],
    histogram: histogram[i]
  }));
}

function calculateRSI(data, period = 14) {
  const changes = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i].close - data[i - 1].close);
  }
  
  const result = new Array(period).fill(50);
  
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;
  
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    result.push(rsi);
  }
  
  return result;
}

function calculateADX(data, period = 14) {
  const tr = [];
  const plusDM = [];
  const minusDM = [];
  
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevHigh = data[i - 1].high;
    const prevLow = data[i - 1].low;
    const prevClose = data[i - 1].close;
    
    const hl = high - low;
    const hpc = Math.abs(high - prevClose);
    const lpc = Math.abs(low - prevClose);
    tr.push(Math.max(hl, hpc, lpc));
    
    const highDiff = high - prevHigh;
    const lowDiff = prevLow - low;
    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
  }
  
  let avgTR = tr.slice(0, period).reduce((a, b) => a + b, 0);
  let avgPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let avgMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);
  
  const adx = [25];
  for (let i = period; i < tr.length; i++) {
    avgTR = avgTR - (avgTR / period) + tr[i];
    avgPlusDM = avgPlusDM - (avgPlusDM / period) + plusDM[i];
    avgMinusDM = avgMinusDM - (avgMinusDM / period) + minusDM[i];
    
    const plusDI = (avgPlusDM / avgTR) * 100;
    const minusDI = (avgMinusDM / avgTR) * 100;
    const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
    adx.push(dx);
  }
  
  return adx[adx.length - 1];
}

// Single TF Analysis
function analyzeTF(data, index) {
  const candle = data[index];
  const price = candle.close;
  
  const hist = data.slice(0, index + 1);
  const ema5 = calculateEMA(hist, 5)[index];
  const ema10 = calculateEMA(hist, 10)[index];
  const ema20 = calculateEMA(hist, 20)[index];
  const macd = calculateMACD(hist)[index];
  const rsi = calculateRSI(hist, 14)[index];
  
  let trend = 'NEUTRAL';
  if (price > ema5 && ema5 > ema10 && ema10 > ema20) trend = 'STRONG_UP';
  else if (price < ema5 && ema5 < ema10 && ema10 < ema20) trend = 'STRONG_DOWN';
  
  const volume = candle.volume;
  const avgVolume = hist.slice(Math.max(0, index - 20), index).reduce((sum, c) => sum + c.volume, 0) / 20;
  
  const macdPct = Math.abs(macd.histogram / price) * 100;
  const macdCrossUp = macd.histogram > 0 && macdPct > 0.003;
  const macdCrossDn = macd.histogram < 0 && macdPct > 0.003;
  const allEMAsUp = price > ema5 && ema5 > ema10 && ema10 > ema20;
  const allEMAsDown = price < ema5 && ema5 < ema10 && ema10 < ema20;
  
  const rsiBuyRange = rsi > 35 && rsi < 68;
  const rsiSellRange = rsi > 35 && rsi < 68;
  
  let signal = 'HOLD';
  let confidence = 50;
  
  if (macdCrossUp && allEMAsUp && rsiBuyRange && trend === 'STRONG_UP') {
    signal = 'BUY';
    confidence = 80;
  } else if (macdCrossDn && allEMAsDown && rsiSellRange && trend === 'STRONG_DOWN') {
    signal = 'SELL';
    confidence = 80;
  }
  
  return { signal, confidence, rsi, macd, volume, avgVolume, trend, price, ema5, ema10, ema20 };
}

// Multi-TF Analysis
function analyzeMultiTF(data1m, data3m, data5m, index) {
  const index3m = Math.floor(index / 3);
  const index5m = Math.floor(index / 5);
  
  if (index < 250 || index3m < 50 || index5m < 50) {
    return { signal: 'HOLD', confidence: 0 };
  }
  
  const tf1m = analyzeTF(data1m, index);
  const tf3m = analyzeTF(data3m, index3m);
  const tf5m = analyzeTF(data5m, index5m);
  
  const signals = [tf1m.signal, tf3m.signal, tf5m.signal];
  const buyCount = signals.filter(s => s === 'BUY').length;
  const sellCount = signals.filter(s => s === 'SELL').length;
  const potentialSignal = buyCount === 3 ? 'BUY' : (sellCount === 3 ? 'SELL' : 'HOLD');
  
  let final = 'HOLD';
  let conf = 0;
  
  const volumes = data1m.slice(Math.max(0, index - 20), index + 1).map(c => c.volume);
  const avgVol = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / 19;
  const currentVol = volumes[volumes.length - 1];
  const volRatio = currentVol / avgVol;
  
  const hist5m = data5m.slice(0, index5m + 1);
  const adx = calculateADX(hist5m);
  
  if (potentialSignal === 'BUY' || potentialSignal === 'SELL') {
    if (volRatio > 2.0) return { signal: 'HOLD', confidence: 0, reason: 'Volume spike' };
    if (volRatio < 0.8) return { signal: 'HOLD', confidence: 0, reason: 'Low volume' };
    if (adx > 50) return { signal: 'HOLD', confidence: 0, reason: 'ADX exhaustion' };
    if (adx < 20) return { signal: 'HOLD', confidence: 0, reason: 'Weak trend' };
  } else {
    return { signal: 'HOLD', confidence: 0 };
  }
  
  if (buyCount === 3 && tf1m.confidence >= 75 && tf3m.confidence >= 75 && tf5m.confidence >= 75) {
    final = 'BUY';
    conf = 105;
  } else if (sellCount === 3 && tf1m.confidence >= 75 && tf3m.confidence >= 75 && tf5m.confidence >= 75) {
    final = 'SELL';
    conf = 105;
  }
  
  return { signal: final, confidence: conf, tf1m, tf3m, tf5m };
}

// Backtest single pair
async function backtestPair(coin, period) {
  console.log(`\n📊 Testing ${coin} - ${period}...`);
  
  const data1m = loadCachedData(coin, period, '1m');
  const data3m = loadCachedData(coin, period, '3m');
  const data5m = loadCachedData(coin, period, '5m');
  
  if (!data1m || !data3m || !data5m) {
    console.log(`❌ ${coin}: Missing cache data. Run: node download-data.js --coin ${coin.replace('USDT', '')} --period ${period}`);
    return null;
  }
  
  // Convert data format (add 'time' field from 'openTime')
  const candles1m = data1m.data.map(c => ({ ...c, time: c.openTime }));
  const candles3m = data3m.data.map(c => ({ ...c, time: c.openTime }));
  const candles5m = data5m.data.map(c => ({ ...c, time: c.openTime }));
  
  let balance = 10000;
  let equity = 10000;
  let position = null;
  const trades = [];
  
  const slPct = 0.008;
  const tpPct = 0.008;
  const trailActivate = 0.004;
  const trailDistance = 0.003;
  const trailLossActivate = -0.003;
  const trailLossDistance = 0.002;
  
  for (let i = 250; i < candles1m.length; i++) {
    const candle = candles1m[i];
    const price = candle.close;
    
    if (position) {
      const entry = position;
      const change = entry.type === 'BUY' ?
        (price - entry.price) / entry.price :
        (entry.price - price) / entry.price;
      
      let sl = entry.sl;
      let tp = entry.tp;
      let trailingActive = entry.trailingActive || false;
      let highestProfit = entry.highestProfit || 0;
      let trailingSL = entry.trailingSL || 0;
      let trailingLossActive = entry.trailingLossActive || false;
      let lowestLoss = entry.lowestLoss || 0;
      
      if (!trailingActive && change >= trailActivate) {
        trailingActive = true;
        highestProfit = change;
        trailingSL = entry.type === 'BUY' ?
          price * (1 - trailDistance) :
          price * (1 + trailDistance);
      }
      
      if (trailingActive) {
        if (change > highestProfit) {
          highestProfit = change;
          trailingSL = entry.type === 'BUY' ?
            price * (1 - trailDistance) :
            price * (1 + trailDistance);
        }
        
        const hitTrailing = entry.type === 'BUY' ?
          price <= trailingSL :
          price >= trailingSL;
        
        if (hitTrailing) {
          const pnl = (price - entry.price) * entry.size * (entry.type === 'BUY' ? 1 : -1);
          balance += pnl;
          trades.push({
            ...entry,
            exitPrice: price,
            exitTime: candle.time,
            pnl,
            exitType: 'TRAILING',
            profitPct: change * 100
          });
          position = null;
          continue;
        }
      }
      
      if (!trailingLossActive && !trailingActive && change <= trailLossActivate) {
        trailingLossActive = true;
        lowestLoss = change;
        sl = entry.type === 'BUY' ?
          price * (1 - trailLossDistance) :
          price * (1 + trailLossDistance);
      }
      
      if (trailingLossActive && !trailingActive) {
        if (change < lowestLoss) {
          lowestLoss = change;
          sl = entry.type === 'BUY' ?
            price * (1 - trailLossDistance) :
            price * (1 + trailLossDistance);
        }
      }
      
      const hitSL = entry.type === 'BUY' ? price <= sl : price >= sl;
      const hitTP = entry.type === 'BUY' ? price >= tp : price <= tp;
      
      if (hitSL) {
        const pnl = (sl - entry.price) * entry.size * (entry.type === 'BUY' ? 1 : -1);
        balance += pnl;
        trades.push({
          ...entry,
          exitPrice: sl,
          exitTime: candle.time,
          pnl,
          exitType: 'SL',
          profitPct: change * 100
        });
        position = null;
        continue;
      }
      
      if (hitTP) {
        const pnl = (tp - entry.price) * entry.size * (entry.type === 'BUY' ? 1 : -1);
        balance += pnl;
        trades.push({
          ...entry,
          exitPrice: tp,
          exitTime: candle.time,
          pnl,
          exitType: 'TP',
          profitPct: change * 100
        });
        position = null;
        continue;
      }
      
      position.trailingActive = trailingActive;
      position.highestProfit = highestProfit;
      position.trailingSL = trailingSL;
      position.trailingLossActive = trailingLossActive;
      position.lowestLoss = lowestLoss;
      position.sl = sl;
      
    } else {
      const analysis = analyzeMultiTF(candles1m, candles3m, candles5m, i);
      
      if (analysis.signal === 'BUY' || analysis.signal === 'SELL') {
        const leverage = 20;
        const size = balance / price;
        const sl = analysis.signal === 'BUY' ?
          price * (1 - slPct) :
          price * (1 + slPct);
        const tp = analysis.signal === 'BUY' ?
          price * (1 + tpPct) :
          price * (1 - tpPct);
        
        position = {
          type: analysis.signal,
          price,
          size,
          leverage,
          sl,
          tp,
          time: candle.time,
          confidence: analysis.confidence
        };
      }
    }
  }
  
  const profit = balance - 10000;
  const profitPct = (profit / 10000) * 100;
  
  return {
    coin,
    period,
    trades,
    profit,
    profitPct,
    finalBalance: balance
  };
}

// Main
async function main() {
  const args = process.argv.slice(2);
  let period = '1w';
  let selectedCoins = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--period') period = args[i + 1];
    if (args[i] === '--coins') selectedCoins = args[i + 1].split(',').map(c => c.toUpperCase() + 'USDT');
  }

  const pairs = selectedCoins || [
    'BTCUSDT',
    'ETHUSDT',
    'BNBUSDT',
    'XRPUSDT'
  ];

  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀 CACHED MULTI-PAIR BACKTESTER`);
  console.log(`${'='.repeat(70)}\n`);
  console.log(`Period: ${period}`);
  console.log(`Pairs: ${pairs.map(p => p.replace('USDT', '')).join(', ')}`);
  console.log(`Strategy: Dual Trailing System`);
  console.log(`Source: Cached data (fast!)\n`);

  const results = [];
  for (const pair of pairs) {
    const result = await backtestPair(pair, period);
    if (result) {
      results.push(result);
      
      const wins = result.trades.filter(t => t.pnl > 0).length;
      const losses = result.trades.filter(t => t.pnl < 0).length;
      const wr = result.trades.length > 0 ? (wins / result.trades.length * 100).toFixed(2) : 0;
      
      console.log(`✅ ${pair}: ${result.trades.length} trades, ${wr}% WR, ${result.profitPct.toFixed(2)}% ROI`);
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 PORTFOLIO RESULTS`);
  console.log(`${'='.repeat(70)}\n`);

  const totalTrades = results.reduce((sum, r) => sum + r.trades.length, 0);
  const totalWins = results.reduce((sum, r) => sum + r.trades.filter(t => t.pnl > 0).length, 0);
  const totalLosses = results.reduce((sum, r) => sum + r.trades.filter(t => t.pnl < 0).length, 0);
  const totalProfit = results.reduce((sum, r) => sum + r.profit, 0);
  const totalROI = (totalProfit / (10000 * results.length)) * 100;
  const overallWR = totalTrades > 0 ? (totalWins / totalTrades * 100).toFixed(2) : 0;

  console.log(`Total Pairs: ${results.length}`);
  console.log(`Total Trades: ${totalTrades}`);
  console.log(`Wins: ${totalWins}`);
  console.log(`Losses: ${totalLosses}`);
  console.log(`Overall Win Rate: ${overallWR}%`);
  console.log(`Total Profit: $${totalProfit.toFixed(2)}`);
  console.log(`Portfolio ROI: ${totalROI.toFixed(2)}%`);
  console.log(`\n${'='.repeat(70)}`);
}

main().catch(console.error);
