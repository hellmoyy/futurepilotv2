/**
 * 🔍 LOSS ANALYSIS TOOL
 * 
 * Menganalisa faktor penyebab loss:
 * - Volume patterns
 * - ADX trends
 * - RSI behavior
 * - MACD signals
 * - Volatility
 * - Time of day
 * - Market conditions
 */

const BinanceDataFetcher = require('./BinanceDataFetcher');

// ============ TECHNICAL INDICATORS ============

function calculateEMA(prices, period) {
  const k = 2 / (period + 1);
  let ema = prices[0];
  const result = [ema];
  
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

function calculateRSI(prices, period = 7) {
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  const rsi = [];
  for (let i = period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  
  return rsi;
}

function calculateMACD(prices, fast = 5, slow = 13, signal = 5) {
  const emaFast = calculateEMA(prices, fast);
  const emaSlow = calculateEMA(prices, slow);
  
  const macdLine = emaFast.map((val, i) => val - emaSlow[i]);
  const signalLine = calculateEMA(macdLine, signal);
  const histogram = macdLine.map((val, i) => val - signalLine[i]);
  
  return {
    macd: macdLine[macdLine.length - 1],
    signal: signalLine[signalLine.length - 1],
    histogram: histogram[histogram.length - 1]
  };
}

function calculateADX(candles, period = 14) {
  if (candles.length < period + 1) return 0;
  
  const trueRanges = [];
  const plusDM = [];
  const minusDM = [];
  
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevHigh = candles[i - 1].high;
    const prevLow = candles[i - 1].low;
    const prevClose = candles[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
    
    const highDiff = high - prevHigh;
    const lowDiff = prevLow - low;
    
    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
  }
  
  if (trueRanges.length < period) return 0;
  
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let smoothPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);
  
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    smoothPlusDM = (smoothPlusDM * (period - 1) + plusDM[i]) / period;
    smoothMinusDM = (smoothMinusDM * (period - 1) + minusDM[i]) / period;
  }
  
  const plusDI = (smoothPlusDM / atr) * 100;
  const minusDI = (smoothMinusDM / atr) * 100;
  const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
  
  return dx;
}

function calculateATR(candles, period = 14) {
  if (candles.length < period + 1) return 0;
  
  const trueRanges = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  
  const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
  return atr;
}

// ============ ANALYSIS CLASS ============

class LossAnalyzer {
  constructor() {
    this.trades = [];
    this.wins = [];
    this.losses = [];
  }

  analyzeTrade(candle, signal, data1m, data3m, data5m, index) {
    const prices1m = data1m.slice(Math.max(0, index - 50), index + 1).map(c => c.close);
    const prices3m = data3m.slice(Math.max(0, Math.floor(index / 3) - 50), Math.floor(index / 3) + 1).map(c => c.close);
    const prices5m = data5m.slice(Math.max(0, Math.floor(index / 5) - 50), Math.floor(index / 5) + 1).map(c => c.close);
    
    // Calculate indicators at entry
    const rsi1m = calculateRSI(prices1m, 7);
    const rsi3m = calculateRSI(prices3m, 7);
    const rsi5m = calculateRSI(prices5m, 7);
    
    const macd1m = calculateMACD(prices1m);
    const macd3m = calculateMACD(prices3m);
    const macd5m = calculateMACD(prices5m);
    
    const adx1m = calculateADX(data1m.slice(Math.max(0, index - 20), index + 1));
    const adx3m = calculateADX(data3m.slice(Math.max(0, Math.floor(index / 3) - 20), Math.floor(index / 3) + 1));
    const adx5m = calculateADX(data5m.slice(Math.max(0, Math.floor(index / 5) - 20), Math.floor(index / 5) + 1));
    
    // Volume analysis
    const volumes1m = data1m.slice(Math.max(0, index - 20), index + 1).map(c => c.volume);
    const avgVol1m = volumes1m.slice(0, -1).reduce((a, b) => a + b, 0) / 19;
    const currentVol1m = volumes1m[volumes1m.length - 1];
    const volRatio1m = currentVol1m / avgVol1m;
    
    const volumes3m = data3m.slice(Math.max(0, Math.floor(index / 3) - 20), Math.floor(index / 3) + 1).map(c => c.volume);
    const avgVol3m = volumes3m.slice(0, -1).reduce((a, b) => a + b, 0) / 19;
    const currentVol3m = volumes3m[volumes3m.length - 1];
    const volRatio3m = currentVol3m / avgVol3m;
    
    // Volatility (ATR)
    const atr1m = calculateATR(data1m.slice(Math.max(0, index - 20), index + 1));
    const atr3m = calculateATR(data3m.slice(Math.max(0, Math.floor(index / 3) - 20), Math.floor(index / 3) + 1));
    const atr5m = calculateATR(data5m.slice(Math.max(0, Math.floor(index / 5) - 20), Math.floor(index / 5) + 1));
    const volatility = (atr1m / candle.close) * 100; // ATR as % of price
    
    // EMAs
    const ema5_1m = calculateEMA(prices1m, 5);
    const ema10_1m = calculateEMA(prices1m, 10);
    const ema20_1m = calculateEMA(prices1m, 20);
    
    // Price position relative to EMAs
    const priceAboveEMA5 = candle.close > ema5_1m[ema5_1m.length - 1];
    const priceAboveEMA10 = candle.close > ema10_1m[ema10_1m.length - 1];
    const priceAboveEMA20 = candle.close > ema20_1m[ema20_1m.length - 1];
    
    // Time analysis
    const date = new Date(candle.openTime); // Use openTime instead of timestamp
    const hour = date.getUTCHours();
    const dayOfWeek = date.getUTCDay(); // 0 = Sunday
    
    return {
      timestamp: candle.openTime,
      date: date.toISOString(),
      hour,
      dayOfWeek,
      signal,
      entry: candle.close,
      
      // RSI
      rsi1m: rsi1m[rsi1m.length - 1],
      rsi3m: rsi3m[rsi3m.length - 1],
      rsi5m: rsi5m[rsi5m.length - 1],
      
      // MACD
      macdHist1m: macd1m.histogram,
      macdHist3m: macd3m.histogram,
      macdHist5m: macd5m.histogram,
      
      // ADX
      adx1m,
      adx3m,
      adx5m,
      
      // Volume
      volRatio1m,
      volRatio3m,
      
      // Volatility
      volatility,
      atr1m,
      
      // EMA position
      priceAboveEMA5,
      priceAboveEMA10,
      priceAboveEMA20,
    };
  }

  async run(symbol = 'BTCUSDT', period = '1m') {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 LOSS ANALYSIS - Finding Patterns in Losing Trades');
    console.log('='.repeat(70) + '\n');
    
    const fetcher = new BinanceDataFetcher();
    const dateRange = BinanceDataFetcher.getDateRange(period);
    
    // Fetch data
    console.log('📊 Fetching data...\n');
    const data1m = await fetcher.fetchPeriod(symbol, '1m', dateRange.start, dateRange.end);
    const data3m = await fetcher.fetchPeriod(symbol, '3m', dateRange.start, dateRange.end);
    const data5m = await fetcher.fetchPeriod(symbol, '5m', dateRange.start, dateRange.end);
    
    console.log(`✅ Loaded: ${data1m.length} (1m), ${data3m.length} (3m), ${data5m.length} (5m)\n`);
    console.log('🎯 Analyzing all trades...\n');
    
    // Simulate trades with DETAILED tracking
    let balance = 10000;
    let position = null;
    
    for (let i = 100; i < data1m.length; i++) {
      const candle = data1m[i];
      
      // Check exit
      if (position) {
        const currentPrice = candle.close;
        let exitReason = null;
        let exitPrice = null;
        
        // Update trailing
        if (position.side === 'BUY' && currentPrice > position.highestPrice) {
          position.highestPrice = currentPrice;
        } else if (position.side === 'SELL' && currentPrice < position.lowestPrice) {
          position.lowestPrice = currentPrice;
        }
        
        const profitPercent = position.side === 'BUY' 
          ? ((currentPrice - position.entry) / position.entry) * 100
          : ((position.entry - currentPrice) / position.entry) * 100;
        
        if (!position.trailingActivated && profitPercent >= 0.4) {
          position.trailingActivated = true;
        }
        
        if (position.trailingActivated) {
          const trailingDistance = 0.003;
          if (position.side === 'BUY') {
            const newSL = position.highestPrice * (1 - trailingDistance);
            if (newSL > position.sl) {
              position.sl = newSL;
            }
          } else {
            const newSL = position.lowestPrice * (1 + trailingDistance);
            if (newSL < position.sl) {
              position.sl = newSL;
            }
          }
        }
        
        // Check SL/TP
        if (position.side === 'BUY') {
          if (currentPrice >= position.tp) {
            exitReason = 'TP';
            exitPrice = position.tp;
          } else if (currentPrice <= position.sl) {
            exitReason = position.trailingActivated ? 'Trailing_SL' : 'SL';
            exitPrice = position.sl;
          }
        } else {
          if (currentPrice <= position.tp) {
            exitReason = 'TP';
            exitPrice = position.tp;
          } else if (currentPrice >= position.sl) {
            exitReason = position.trailingActivated ? 'Trailing_SL' : 'SL';
            exitPrice = position.sl;
          }
        }
        
        if (exitReason) {
          const pnl = position.side === 'BUY'
            ? (exitPrice - position.entry) * position.qty
            : (position.entry - exitPrice) * position.qty;
          
          const pnlPercent = (pnl / (balance * 0.06)) * 100;
          balance += pnl;
          
          // Store trade result
          const trade = {
            ...position.analysis,
            exitReason,
            exitPrice,
            pnl,
            pnlPercent,
            result: pnl > 0 ? 'WIN' : 'LOSS',
            maxProfit: position.side === 'BUY' 
              ? ((position.highestPrice - position.entry) / position.entry) * 100
              : ((position.entry - position.lowestPrice) / position.entry) * 100,
            trailingActivated: position.trailingActivated,
          };
          
          this.trades.push(trade);
          if (pnl > 0) {
            this.wins.push(trade);
          } else {
            this.losses.push(trade);
          }
          
          position = null;
        }
      }
      
      // Look for entry
      if (!position) {
        const signal = this.analyzeEntry(data1m, data3m, data5m, i);
        
        if (signal && signal !== 'HOLD') {
          const size = balance * 0.06;
          const leverage = 20;
          const entry = candle.close;
          const qty = (size * leverage) / entry;
          
          const riskPercent = 0.8;
          const rewardPercent = 0.8;
          
          const sl = signal === 'BUY' 
            ? entry * (1 - riskPercent / 100)
            : entry * (1 + riskPercent / 100);
          
          const tp = signal === 'BUY'
            ? entry * (1 + rewardPercent / 100)
            : entry * (1 - rewardPercent / 100);
          
          // Analyze entry conditions
          const analysis = this.analyzeTrade(candle, signal, data1m, data3m, data5m, i);
          
          position = {
            side: signal,
            entry,
            sl,
            tp,
            qty,
            highestPrice: entry,
            lowestPrice: entry,
            trailingActivated: false,
            analysis
          };
        }
      }
    }
    
    // Analyze results
    this.printAnalysis();
  }

  analyzeEntry(data1m, data3m, data5m, index) {
    // Same logic as main strategy (85% confidence)
    const index3m = Math.floor(index / 3);
    const index5m = Math.floor(index / 5);
    
    if (index3m < 50 || index5m < 50) return 'HOLD';
    
    const tf1m = this.analyzeTimeframe(data1m, index, '1m');
    const tf3m = this.analyzeTimeframe(data3m, index3m, '3m');
    const tf5m = this.analyzeTimeframe(data5m, index5m, '5m');
    
    if (!tf1m || !tf3m || !tf5m) return 'HOLD';
    if (tf1m === 'HOLD' || tf3m === 'HOLD' || tf5m === 'HOLD') return 'HOLD';
    
    // All must agree
    if (tf1m === tf3m && tf3m === tf5m) {
      // Volume check
      const volumes = data1m.slice(Math.max(0, index - 20), index + 1).map(c => c.volume);
      const avgVol = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / 19;
      const volRatio = volumes[volumes.length - 1] / avgVol;
      
      // ADX check
      const adx = calculateADX(data5m.slice(Math.max(0, index5m - 20), index5m + 1));
      
      if (volRatio >= 0.8 && adx >= 20) {
        return tf1m;
      }
    }
    
    return 'HOLD';
  }

  analyzeTimeframe(data, index, tf) {
    const hist = data.slice(Math.max(0, index - 50), index + 1);
    const prices = hist.map(c => c.close);
    
    const rsi = calculateRSI(prices, 7);
    const macd = calculateMACD(prices);
    const ema5 = calculateEMA(prices, 5);
    const ema10 = calculateEMA(prices, 10);
    const ema20 = calculateEMA(prices, 20);
    
    const price = prices[prices.length - 1];
    
    let trend = 'NEUTRAL';
    if (ema5[ema5.length - 1] > ema10[ema10.length - 1] && ema10[ema10.length - 1] > ema20[ema20.length - 1]) {
      trend = 'STRONG_UP';
    } else if (ema5[ema5.length - 1] < ema10[ema10.length - 1] && ema10[ema10.length - 1] < ema20[ema20.length - 1]) {
      trend = 'STRONG_DOWN';
    }
    
    const macdCrossUp = macd.histogram > 0 && Math.abs(macd.histogram) < 6;
    const macdCrossDn = macd.histogram < 0 && Math.abs(macd.histogram) < 6;
    const allEMAsUp = price > ema5[ema5.length - 1] && ema5[ema5.length - 1] > ema10[ema10.length - 1] && ema10[ema10.length - 1] > ema20[ema20.length - 1];
    const allEMAsDown = price < ema5[ema5.length - 1] && ema5[ema5.length - 1] < ema10[ema10.length - 1] && ema10[ema10.length - 1] < ema20[ema20.length - 1];
    
    const currentRSI = rsi[rsi.length - 1];
    
    if (macdCrossUp && allEMAsUp && currentRSI > 40 && currentRSI < 70 && trend === 'STRONG_UP') {
      return 'BUY';
    } else if (macdCrossDn && allEMAsDown && currentRSI > 30 && currentRSI < 60 && trend === 'STRONG_DOWN') {
      return 'SELL';
    }
    
    return 'HOLD';
  }

  printAnalysis() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 OVERALL STATISTICS');
    console.log('='.repeat(70));
    console.log(`Total Trades: ${this.trades.length}`);
    console.log(`Wins: ${this.wins.length} (${((this.wins.length / this.trades.length) * 100).toFixed(2)}%)`);
    console.log(`Losses: ${this.losses.length} (${((this.losses.length / this.trades.length) * 100).toFixed(2)}%)`);
    
    if (this.losses.length === 0) {
      console.log('\n✅ NO LOSSES! Strategy is perfect!');
      return;
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('❌ LOSS ANALYSIS - Finding Common Patterns');
    console.log('='.repeat(70));
    
    // 1. RSI Analysis
    console.log('\n📊 1. RSI AT ENTRY (Losses vs Wins)');
    console.log('-'.repeat(70));
    const lossRSI1m = this.losses.map(t => t.rsi1m);
    const winRSI1m = this.wins.map(t => t.rsi1m);
    console.log(`Losses - Avg RSI (1m): ${this.avg(lossRSI1m).toFixed(2)} | Range: ${Math.min(...lossRSI1m).toFixed(1)}-${Math.max(...lossRSI1m).toFixed(1)}`);
    console.log(`Wins   - Avg RSI (1m): ${this.avg(winRSI1m).toFixed(2)} | Range: ${Math.min(...winRSI1m).toFixed(1)}-${Math.max(...winRSI1m).toFixed(1)}`);
    
    // 2. Volume Analysis
    console.log('\n📊 2. VOLUME RATIO AT ENTRY (Losses vs Wins)');
    console.log('-'.repeat(70));
    const lossVol = this.losses.map(t => t.volRatio1m);
    const winVol = this.wins.map(t => t.volRatio1m);
    console.log(`Losses - Avg Vol Ratio: ${this.avg(lossVol).toFixed(2)}x | Range: ${Math.min(...lossVol).toFixed(2)}-${Math.max(...lossVol).toFixed(2)}`);
    console.log(`Wins   - Avg Vol Ratio: ${this.avg(winVol).toFixed(2)}x | Range: ${Math.min(...winVol).toFixed(2)}-${Math.max(...winVol).toFixed(2)}`);
    
    // 3. ADX Analysis
    console.log('\n📊 3. ADX (TREND STRENGTH) AT ENTRY (Losses vs Wins)');
    console.log('-'.repeat(70));
    const lossADX = this.losses.map(t => t.adx5m);
    const winADX = this.wins.map(t => t.adx5m);
    console.log(`Losses - Avg ADX: ${this.avg(lossADX).toFixed(2)} | Range: ${Math.min(...lossADX).toFixed(1)}-${Math.max(...lossADX).toFixed(1)}`);
    console.log(`Wins   - Avg ADX: ${this.avg(winADX).toFixed(2)} | Range: ${Math.min(...winADX).toFixed(1)}-${Math.max(...winADX).toFixed(1)}`);
    
    // 4. Volatility Analysis
    console.log('\n📊 4. VOLATILITY (ATR%) AT ENTRY (Losses vs Wins)');
    console.log('-'.repeat(70));
    const lossVol_atr = this.losses.map(t => t.volatility);
    const winVol_atr = this.wins.map(t => t.volatility);
    console.log(`Losses - Avg Volatility: ${this.avg(lossVol_atr).toFixed(3)}% | Range: ${Math.min(...lossVol_atr).toFixed(3)}-${Math.max(...lossVol_atr).toFixed(3)}`);
    console.log(`Wins   - Avg Volatility: ${this.avg(winVol_atr).toFixed(3)}% | Range: ${Math.min(...winVol_atr).toFixed(3)}-${Math.max(...winVol_atr).toFixed(3)}`);
    
    // 5. Time Analysis
    console.log('\n📊 5. TIME OF DAY ANALYSIS (UTC Hours)');
    console.log('-'.repeat(70));
    const lossHours = {};
    const winHours = {};
    this.losses.forEach(t => lossHours[t.hour] = (lossHours[t.hour] || 0) + 1);
    this.wins.forEach(t => winHours[t.hour] = (winHours[t.hour] || 0) + 1);
    
    console.log('Most Losses at Hours:');
    const sortedLossHours = Object.entries(lossHours).sort((a, b) => b[1] - a[1]).slice(0, 5);
    sortedLossHours.forEach(([hour, count]) => {
      console.log(`  ${hour}:00 UTC - ${count} losses`);
    });
    
    // 6. Max Profit Analysis (Did it reach profit before reversing?)
    console.log('\n📊 6. MAX PROFIT REACHED BEFORE LOSS');
    console.log('-'.repeat(70));
    const lossMaxProfit = this.losses.map(t => t.maxProfit);
    const reachedProfit = this.losses.filter(t => t.maxProfit >= 0.4).length;
    console.log(`Losses that reached 0.4%+ profit: ${reachedProfit}/${this.losses.length} (${((reachedProfit / this.losses.length) * 100).toFixed(1)}%)`);
    console.log(`Avg max profit before loss: ${this.avg(lossMaxProfit).toFixed(2)}%`);
    console.log(`→ ${reachedProfit > 0 ? '⚠️ Some losses were "almost winners" that reversed!' : '✅ Most losses never reached profit'}`);
    
    // 7. MACD Histogram Analysis
    console.log('\n📊 7. MACD HISTOGRAM AT ENTRY (Losses vs Wins)');
    console.log('-'.repeat(70));
    const lossMacd = this.losses.map(t => Math.abs(t.macdHist1m));
    const winMacd = this.wins.map(t => Math.abs(t.macdHist1m));
    console.log(`Losses - Avg |MACD Hist|: ${this.avg(lossMacd).toFixed(2)}`);
    console.log(`Wins   - Avg |MACD Hist|: ${this.avg(winMacd).toFixed(2)}`);
    
    // 8. Signal Distribution
    console.log('\n📊 8. SIGNAL TYPE DISTRIBUTION');
    console.log('-'.repeat(70));
    const lossBuy = this.losses.filter(t => t.signal === 'BUY').length;
    const lossSell = this.losses.filter(t => t.signal === 'SELL').length;
    const winBuy = this.wins.filter(t => t.signal === 'BUY').length;
    const winSell = this.wins.filter(t => t.signal === 'SELL').length;
    console.log(`BUY  - Wins: ${winBuy}, Losses: ${lossBuy} (${((winBuy / (winBuy + lossBuy)) * 100).toFixed(1)}% WR)`);
    console.log(`SELL - Wins: ${winSell}, Losses: ${lossSell} (${((winSell / (winSell + lossSell)) * 100).toFixed(1)}% WR)`);
    
    // 9. RECOMMENDATIONS
    console.log('\n' + '='.repeat(70));
    console.log('💡 RECOMMENDATIONS TO REDUCE LOSSES');
    console.log('='.repeat(70));
    
    const recommendations = [];
    
    // Volume recommendation
    const volDiff = this.avg(winVol) - this.avg(lossVol);
    if (volDiff > 0.1) {
      recommendations.push(`✅ VOLUME: Winners have ${volDiff.toFixed(2)}x higher volume. Increase vol threshold to >${this.avg(winVol).toFixed(2)}x`);
    } else if (volDiff < -0.1) {
      recommendations.push(`⚠️ VOLUME: Losses have higher volume (${Math.abs(volDiff).toFixed(2)}x more). May indicate false breakouts.`);
    }
    
    // ADX recommendation
    const adxDiff = this.avg(winADX) - this.avg(lossADX);
    if (adxDiff > 2) {
      recommendations.push(`✅ ADX: Winners have stronger trends (+${adxDiff.toFixed(1)}). Increase ADX threshold to >${this.avg(winADX).toFixed(1)}`);
    } else if (adxDiff < -2) {
      recommendations.push(`⚠️ ADX: Losses occur in stronger trends. May need better entry timing.`);
    }
    
    // RSI recommendation
    const rsiDiff = this.avg(winRSI1m) - this.avg(lossRSI1m);
    if (Math.abs(rsiDiff) > 5) {
      if (rsiDiff > 0) {
        recommendations.push(`✅ RSI: Winners enter at higher RSI (+${rsiDiff.toFixed(1)}). Adjust RSI range to ${(this.avg(winRSI1m) - 5).toFixed(0)}-${(this.avg(winRSI1m) + 5).toFixed(0)}`);
      } else {
        recommendations.push(`✅ RSI: Winners enter at lower RSI (${Math.abs(rsiDiff).toFixed(1)}). Adjust RSI range to ${(this.avg(winRSI1m) - 5).toFixed(0)}-${(this.avg(winRSI1m) + 5).toFixed(0)}`);
      }
    }
    
    // Volatility recommendation
    const volDiff_atr = this.avg(lossVol_atr) - this.avg(winVol_atr);
    if (volDiff_atr > 0.05) {
      recommendations.push(`⚠️ VOLATILITY: Losses occur in higher volatility (+${(volDiff_atr * 100).toFixed(1)}%). Add volatility filter: ATR% < ${(this.avg(winVol_atr) * 1.2).toFixed(3)}%`);
    }
    
    // Almost winner recommendation
    if (reachedProfit > this.losses.length * 0.3) {
      recommendations.push(`⚠️ REVERSALS: ${((reachedProfit / this.losses.length) * 100).toFixed(0)}% of losses reached profit first! Consider tighter trailing or earlier profit taking.`);
    }
    
    // Signal type recommendation
    const buyWR = (winBuy / (winBuy + lossBuy)) * 100;
    const sellWR = (winSell / (winSell + lossSell)) * 100;
    if (Math.abs(buyWR - sellWR) > 15) {
      if (buyWR > sellWR) {
        recommendations.push(`⚠️ SIGNAL BIAS: BUY signals perform better (${buyWR.toFixed(1)}% vs ${sellWR.toFixed(1)}%). Consider stricter SELL filters.`);
      } else {
        recommendations.push(`⚠️ SIGNAL BIAS: SELL signals perform better (${sellWR.toFixed(1)}% vs ${buyWR.toFixed(1)}%). Consider stricter BUY filters.`);
      }
    }
    
    if (recommendations.length === 0) {
      console.log('✅ Current filters are well-optimized! No major improvements detected.');
    } else {
      recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
    
    // 10. SPECIFIC LOSING TRADES
    console.log('\n' + '='.repeat(70));
    console.log('🔍 DETAILED LOSING TRADES (First 5)');
    console.log('='.repeat(70));
    
    this.losses.slice(0, 5).forEach((trade, i) => {
      console.log(`\nLoss #${i + 1}:`);
      console.log(`  Date: ${trade.date}`);
      console.log(`  Signal: ${trade.signal} @ $${trade.entry.toFixed(2)}`);
      console.log(`  Exit: ${trade.exitReason} @ $${trade.exitPrice.toFixed(2)} (${trade.pnlPercent.toFixed(2)}%)`);
      console.log(`  Max Profit: ${trade.maxProfit.toFixed(2)}% ${trade.maxProfit > 0.4 ? '⚠️ REVERSAL!' : ''}`);
      console.log(`  RSI: ${trade.rsi1m.toFixed(1)} | Vol: ${trade.volRatio1m.toFixed(2)}x | ADX: ${trade.adx5m.toFixed(1)} | ATR%: ${trade.volatility.toFixed(3)}%`);
    });
    
    console.log('\n' + '='.repeat(70));
  }

  avg(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
}

// ============ MAIN ============

async function main() {
  const args = process.argv.slice(2);
  let period = '1m';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--period') period = args[i + 1];
  }
  
  const analyzer = new LossAnalyzer();
  await analyzer.run('BTCUSDT', period);
}

main().catch(console.error);
