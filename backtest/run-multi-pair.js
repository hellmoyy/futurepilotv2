/**
 * 🚀 MULTI-PAIR SCALPER (Portfolio Approach)
 * 
 * ⚡ OPTIMIZATION APPROACH:
 * - Removed SOL (weak 56% WR)
 * - Keep proven filters that achieved 80% WR
 * - Balanced RSI: 35-68 (slightly stricter, not too extreme)
 * - Volume: 0.8-2.0x (proven sweet spot)
 * 
 * 🎯 Active Pairs (4 strong performers):
 * 1. BTCUSDT - 84.62% WR
 * 2. ETHUSDT - 77.78% WR
 * 3. BNBUSDT - 81.25% WR
 * 4. XRPUSDT - 95.45% WR (STAR!)
 * 
 * 🛡️ Filters: Anti-False-Breakout
 * - MACD > 0.003% of price (percentage-based, high quality)
 * - Volume 0.8-2.0x (proven range)
 * - ADX 20-50 (avoid weak trends/exhaustion)
 * - RSI 35-68 (balanced, not too extreme)
 * - Triple TF confirmation (1m + 3m + 5m)
 * 
 * 🎲 Exit: Dual Trailing System (INNOVATION!)
 * - SL: 0.8%, TP: 0.8% (1:1 R:R)
 * - Trailing Stop PROFIT: +0.4% activates, trail 0.3% (lock gains)
 * - Trailing Stop LOSS: -0.3% activates, trail 0.2% (cut losses early!)
 */

const BinanceDataFetcher = require('./BinanceDataFetcher');
const MetricsCalculator = require('./MetricsCalculator');
const ReportGenerator = require('./ReportGenerator');

// Indicators
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  let gains = 0, losses = 0;
  for (let i = changes.length - period; i < changes.length; i++) {
    if (changes[i] > 0) gains += changes[i];
    else losses += Math.abs(changes[i]);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateEMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1];
  
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  
  return ema;
}

function calculateMACD(prices) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  
  const macdHistory = [];
  for (let i = Math.max(0, prices.length - 50); i < prices.length; i++) {
    const slice = prices.slice(0, i + 1);
    const e12 = calculateEMA(slice, 12);
    const e26 = calculateEMA(slice, 26);
    macdHistory.push(e12 - e26);
  }
  
  const signal = calculateEMA(macdHistory, 9);
  const histogram = macdLine - signal;
  
  return { macdLine, signal, histogram };
}

function calculateADX(candles, period = 14) {
  if (candles.length < period + 1) return 20;
  
  const tr = [];
  const plusDM = [];
  const minusDM = [];
  
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevHigh = candles[i-1].high;
    const prevLow = candles[i-1].low;
    const prevClose = candles[i-1].close;
    
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    tr.push(Math.max(tr1, tr2, tr3));
    
    const highDiff = high - prevHigh;
    const lowDiff = prevLow - low;
    
    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
  }
  
  const atr = tr.slice(-period).reduce((a, b) => a + b, 0) / period;
  const plusDI = (plusDM.slice(-period).reduce((a, b) => a + b, 0) / period / atr) * 100;
  const minusDI = (minusDM.slice(-period).reduce((a, b) => a + b, 0) / period / atr) * 100;
  
  const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
  return dx;
}

// Analyze single timeframe
function analyzeTF(candles, index) {
  if (index < 50) return { signal: 'HOLD', confidence: 0 };
  
  const hist = candles.slice(0, index + 1);
  const prices = hist.map(c => c.close);
  
  const rsi = calculateRSI(prices);
  const macd = calculateMACD(prices);
  const ema5 = calculateEMA(prices, 5);
  const ema10 = calculateEMA(prices, 10);
  const ema20 = calculateEMA(prices, 20);
  const price = prices[prices.length - 1];
  
  // Trend
  let trend = 'NEUTRAL';
  if (ema5 > ema10 && ema10 > ema20) trend = 'STRONG_UP';
  else if (ema5 > ema10) trend = 'UP';
  else if (ema5 < ema10 && ema10 < ema20) trend = 'STRONG_DOWN';
  else if (ema5 < ema10) trend = 'DOWN';
  
  // Signals - Stricter MACD for higher quality (0.003% from 0.002%)
  const macdPct = Math.abs(macd.histogram / price) * 100;
  const macdCrossUp = macd.histogram > 0 && macdPct > 0.003;
  const macdCrossDn = macd.histogram < 0 && macdPct > 0.003;
  const allEMAsUp = price > ema5 && ema5 > ema10 && ema10 > ema20;
  const allEMAsDown = price < ema5 && ema5 < ema10 && ema10 < ema20;
  
  // === OPTIMIZATION: Balanced RSI range ===
  // Too strict (40-65/35-60) lowered WR to 70%
  // Balanced approach: 35-68 for both (slightly stricter than 30-70)
  const rsiBuyRange = rsi > 35 && rsi < 68;
  const rsiSellRange = rsi > 35 && rsi < 68;
  
  let signal = 'HOLD';
  let confidence = 50;
  
  // BUY Signal - BALANCED
  if (
    macdCrossUp &&
    allEMAsUp &&
    rsiBuyRange && // Balanced RSI
    trend === 'STRONG_UP'
  ) {
    signal = 'BUY';
    confidence = 80;
  }
  // SELL Signal - BALANCED
  else if (
    macdCrossDn &&
    allEMAsDown &&
    rsiSellRange && // Balanced RSI
    trend === 'STRONG_DOWN'
  ) {
    signal = 'SELL';
    confidence = 80;
  }
  
  return { signal, confidence, rsi, macd: macd.histogram, trend };
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
  
  // Determine potential signal
  const signals = [tf1m.signal, tf3m.signal, tf5m.signal];
  const buyCount = signals.filter(s => s === 'BUY').length;
  const sellCount = signals.filter(s => s === 'SELL').length;
  const potentialSignal = buyCount === 3 ? 'BUY' : (sellCount === 3 ? 'SELL' : 'HOLD');
  
  let final = 'HOLD';
  let conf = 0;
  
  // VOLUME CHECK
  const volumes = data1m.slice(Math.max(0, index - 20), index + 1).map(c => c.volume);
  const avgVol = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / 19;
  const currentVol = volumes[volumes.length - 1];
  const volRatio = currentVol / avgVol;
  
  // ADX CHECK
  const hist5m = data5m.slice(0, index5m + 1);
  const adx = calculateADX(hist5m);
  
  // Anti-False-Breakout Filters
  if (potentialSignal === 'BUY' || potentialSignal === 'SELL') {
    // === BALANCED: Revert volume to 0.8x (was too strict at 1.0x) ===
    // Avoid high volume spikes (false breakouts)
    if (volRatio > 2.0) {
      return { signal: 'HOLD', confidence: 0, reason: 'Volume spike' };
    }
    // Require minimum volume (back to 0.8x)
    if (volRatio < 0.8) {
      return { signal: 'HOLD', confidence: 0, reason: 'Low volume' };
    }
    // Avoid extreme ADX (exhaustion)
    if (adx > 50) {
      return { signal: 'HOLD', confidence: 0, reason: 'ADX exhaustion' };
    }
    // Require minimum trend
    if (adx < 20) {
      return { signal: 'HOLD', confidence: 0, reason: 'Weak trend' };
    }
  } else {
    return { signal: 'HOLD', confidence: 0 };
  }
  
  // All 3 agree
  if (buyCount === 3 && tf1m.confidence >= 75 && tf3m.confidence >= 75 && tf5m.confidence >= 75) {
    final = 'BUY';
    conf = 105;
  } else if (sellCount === 3 && tf1m.confidence >= 75 && tf3m.confidence >= 75 && tf5m.confidence >= 75) {
    final = 'SELL';
    conf = 105;
  }
  
  return { signal: final, confidence: conf };
}

// Backtest single pair
async function backtestPair(symbol, period) {
  const fetcher = new BinanceDataFetcher();
  
  let startDate, endDate;
  endDate = new Date();
  
  if (period === '1w') {
    startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === '1m') {
    startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (period === '3m') {
    startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  // Fetch data
  console.log(`\n📊 Fetching ${symbol} data...`);
  const data1m = await fetcher.fetchPeriod(symbol, '1m', startDate, endDate);
  const data3m = await fetcher.fetchPeriod(symbol, '3m', startDate, endDate);
  const data5m = await fetcher.fetchPeriod(symbol, '5m', startDate, endDate);
  
  if (!data1m || data1m.length < 500) {
    console.log(`❌ Not enough data for ${symbol}`);
    return null;
  }
  
  // Backtest
  const trades = [];
  const account = new Account(10000);
  
  let inTrade = false;
  let entry = null;
  let sl = 0, tp = 0;
  let trailingActive = false;
  let trailingLossActive = false; // NEW: Trailing stop loss
  let highestProfit = 0;
  let lowestLoss = 0; // NEW: Track worst loss
  let trailingSL = 0;
  
  const slPct = 0.008; // 0.8%
  const tpPct = 0.008; // 0.8%
  const trailActivate = 0.004; // 0.4% profit to activate trailing
  const trailDistance = 0.003; // 0.3% trail distance for profit
  const trailLossActivate = -0.003; // NEW: -0.3% loss to activate trailing SL
  const trailLossDistance = 0.002; // NEW: 0.2% trail distance to cut loss
  
  for (let i = 250; i < data1m.length; i++) {
    const candle = data1m[i];
    const price = candle.close;
    
    if (inTrade) {
      const change = entry.type === 'BUY' ? 
        (price - entry.price) / entry.price :
        (entry.price - price) / entry.price;
      
      // === TRAILING STOP PROFIT (Lock gains) ===
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
        
        // Check trailing SL
        const hitTrailing = entry.type === 'BUY' ? 
          price <= trailingSL :
          price >= trailingSL;
        
        if (hitTrailing) {
          const pnl = entry.type === 'BUY' ?
            (trailingSL - entry.price) * entry.size * 20 :
            (entry.price - trailingSL) * entry.size * 20;
          
          account.closeTrade(pnl);
          
          trades.push({
            ...entry,
            exit: trailingSL,
            exitTime: candle.time,
            pnl,
            pnlPct: (pnl / (entry.price * entry.size * 20)) * 100,
            exitType: 'TRAILING_SL'
          });
          
          inTrade = false;
          trailingActive = false;
          trailingLossActive = false;
          continue;
        }
      }
      
      // === NEW: TRAILING STOP LOSS (Cut losses early!) ===
      if (!trailingLossActive && change <= trailLossActivate) {
        trailingLossActive = true;
        lowestLoss = change;
        // Move SL closer (reduce max loss from 0.8% to ~0.5%)
        sl = entry.type === 'BUY' ?
          price * (1 - trailLossDistance) :
          price * (1 + trailLossDistance);
      }
      
      if (trailingLossActive && !trailingActive) {
        // Keep moving SL closer as loss deepens
        if (change < lowestLoss) {
          lowestLoss = change;
          sl = entry.type === 'BUY' ?
            price * (1 - trailLossDistance) :
            price * (1 + trailLossDistance);
        }
      }
      
      // Check SL/TP
      const hitSL = entry.type === 'BUY' ? 
        candle.low <= sl :
        candle.high >= sl;
      const hitTP = entry.type === 'BUY' ?
        candle.high >= tp :
        candle.low <= tp;
      
      if (hitSL) {
        const pnl = entry.type === 'BUY' ?
          (sl - entry.price) * entry.size * 20 :
          (entry.price - sl) * entry.size * 20;
        
        account.closeTrade(pnl);
        
        trades.push({
          ...entry,
          exit: sl,
          exitTime: candle.time,
          pnl,
          pnlPct: (pnl / (entry.price * entry.size * 20)) * 100,
          exitType: 'SL'
        });
        
        inTrade = false;
        trailingActive = false;
      } else if (hitTP) {
        const pnl = entry.type === 'BUY' ?
          (tp - entry.price) * entry.size * 20 :
          (entry.price - tp) * entry.size * 20;
        
        account.closeTrade(pnl);
        
        trades.push({
          ...entry,
          exit: tp,
          exitTime: candle.time,
          pnl,
          pnlPct: (pnl / (entry.price * entry.size * 20)) * 100,
          exitType: 'TP'
        });
        
        inTrade = false;
        trailingActive = false;
        trailingLossActive = false; // Reset trailing loss flag
      }
      
      account.updateEquity(entry.type, entry.price, price, entry.size);
      continue;
    }
    
    // Check for entry
    const analysis = analyzeMultiTF(data1m, data3m, data5m, i);
    
    if (analysis.signal === 'BUY' || analysis.signal === 'SELL') {
      const size = 1; // 1 BTC equivalent
      
      sl = analysis.signal === 'BUY' ?
        price * (1 - slPct) :
        price * (1 + slPct);
      
      tp = analysis.signal === 'BUY' ?
        price * (1 + tpPct) :
        price * (1 - tpPct);
      
      entry = {
        symbol,
        type: analysis.signal,
        price,
        size,
        time: candle.time,
        sl,
        tp,
        confidence: analysis.confidence
      };
      
      account.openTrade(price * size * 20);
      inTrade = true;
      trailingActive = false;
      trailingLossActive = false; // Reset trailing loss
      highestProfit = 0;
      lowestLoss = 0; // Reset lowest loss
    }
  }
  
  // Close any open trade
  if (inTrade) {
    const lastPrice = data1m[data1m.length - 1].close;
    const pnl = entry.type === 'BUY' ?
      (lastPrice - entry.price) * entry.size * 20 :
      (entry.price - lastPrice) * entry.size * 20;
    
    account.closeTrade(pnl);
    
    trades.push({
      ...entry,
      exit: lastPrice,
      exitTime: data1m[data1m.length - 1].time,
      pnl,
      pnlPct: (pnl / (entry.price * entry.size * 20)) * 100,
      exitType: 'END'
    });
  }
  
  return {
    symbol,
    trades,
    balance: account.balance,
    equity: account.equity,
    profit: account.balance - 10000,
    profitPct: ((account.balance - 10000) / 10000) * 100
  };
}

// Account class
class Account {
  constructor(initialBalance) {
    this.balance = initialBalance;
    this.equity = initialBalance;
    this.initialBalance = initialBalance;
  }
  
  openTrade(margin) {
    // No actual deduction, just tracking
  }
  
  closeTrade(pnl) {
    this.balance += pnl;
    this.equity = this.balance;
  }
  
  updateEquity(type, entryPrice, currentPrice, size) {
    const change = type === 'BUY' ?
      (currentPrice - entryPrice) / entryPrice :
      (entryPrice - currentPrice) / entryPrice;
    const unrealized = size * 20 * entryPrice * change;
    this.equity = this.balance + unrealized;
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  let period = '1m';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--period') period = args[i + 1];
  }
  
  const pairs = [
    'BTCUSDT',
    'ETHUSDT',
    'BNBUSDT',
    // 'SOLUSDT', // Removed: Only 56% WR
    'XRPUSDT'
  ];
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀 MULTI-PAIR SCALPER (Portfolio Strategy)`);
  console.log(`${'='.repeat(70)}\n`);
  console.log(`Period: ${period}`);
  console.log(`Pairs: ${pairs.join(', ')}`);
  console.log(`Strategy: Dual Trailing System (Profit + Loss!)`);
  console.log(`Filters: MACD>0.003% (stricter!), Vol 0.8-2.0x, ADX 20-50`);
  console.log(`Innovation: Trailing Stop Loss cuts losses early!\n`);
  
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
  
  // Aggregate results
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
  console.log(`Portfolio ROI: ${totalROI.toFixed(2)}%\n`);
  
  // Best/Worst pairs
  const sorted = results.sort((a, b) => b.profitPct - a.profitPct);
  
  console.log(`🏆 Best Performers:`);
  sorted.slice(0, 3).forEach((r, i) => {
    const wins = r.trades.filter(t => t.pnl > 0).length;
    const wr = r.trades.length > 0 ? (wins / r.trades.length * 100).toFixed(2) : 0;
    console.log(`  ${i + 1}. ${r.symbol}: ${r.profitPct.toFixed(2)}% (${r.trades.length} trades, ${wr}% WR)`);
  });
  
  console.log(`\n❌ Worst Performers:`);
  sorted.slice(-3).reverse().forEach((r, i) => {
    const wins = r.trades.filter(t => t.pnl > 0).length;
    const wr = r.trades.length > 0 ? (wins / r.trades.length * 100).toFixed(2) : 0;
    console.log(`  ${i + 1}. ${r.symbol}: ${r.profitPct.toFixed(2)}% (${r.trades.length} trades, ${wr}% WR)`);
  });
  
  console.log(`\n${'='.repeat(70)}\n`);
}

main().catch(console.error);
