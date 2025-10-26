/**
 * 🔍 PROFIT ANALYZER - Find why profit negative despite good WR
 */

const BinanceDataFetcher = require('./BinanceDataFetcher');

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
  
  let trend = 'NEUTRAL';
  if (ema5 > ema10 && ema10 > ema20) trend = 'STRONG_UP';
  else if (ema5 > ema10) trend = 'UP';
  else if (ema5 < ema10 && ema10 < ema20) trend = 'STRONG_DOWN';
  else if (ema5 < ema10) trend = 'DOWN';
  
  const macdPct = Math.abs(macd.histogram / price) * 100;
  const macdCrossUp = macd.histogram > 0 && macdPct > 0.002;
  const macdCrossDn = macd.histogram < 0 && macdPct > 0.002;
  const allEMAsUp = price > ema5 && ema5 > ema10 && ema10 > ema20;
  const allEMAsDown = price < ema5 && ema5 < ema10 && ema10 < ema20;
  
  let signal = 'HOLD';
  let confidence = 50;
  
  if (macdCrossUp && allEMAsUp && rsi > 30 && rsi < 70 && trend === 'STRONG_UP') {
    signal = 'BUY';
    confidence = 80;
  } else if (macdCrossDn && allEMAsDown && rsi > 30 && rsi < 70 && trend === 'STRONG_DOWN') {
    signal = 'SELL';
    confidence = 80;
  }
  
  return { signal, confidence, rsi, macd: macd.histogram, trend };
}

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
  
  const volumes = data1m.slice(Math.max(0, index - 20), index + 1).map(c => c.volume);
  const avgVol = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / 19;
  const currentVol = volumes[volumes.length - 1];
  const volRatio = currentVol / avgVol;
  
  const hist5m = data5m.slice(0, index5m + 1);
  const adx = calculateADX(hist5m);
  
  if (potentialSignal === 'BUY' || potentialSignal === 'SELL') {
    if (volRatio > 2.0 || volRatio < 0.8 || adx > 50 || adx < 20) {
      return { signal: 'HOLD', confidence: 0 };
    }
  } else {
    return { signal: 'HOLD', confidence: 0 };
  }
  
  if (buyCount === 3 && tf1m.confidence >= 75) {
    return { signal: 'BUY', confidence: 105 };
  } else if (sellCount === 3 && tf1m.confidence >= 75) {
    return { signal: 'SELL', confidence: 105 };
  }
  
  return { signal: 'HOLD', confidence: 0 };
}

async function analyzePairProfits(symbol) {
  const fetcher = new BinanceDataFetcher();
  
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`💰 ANALYZING ${symbol} PROFITS`);
  console.log(`${'='.repeat(70)}`);
  
  const data1m = await fetcher.fetchPeriod(symbol, '1m', startDate, endDate);
  const data3m = await fetcher.fetchPeriod(symbol, '3m', startDate, endDate);
  const data5m = await fetcher.fetchPeriod(symbol, '5m', startDate, endDate);
  
  const trades = [];
  let inTrade = false;
  let entry = null;
  
  const slPct = 0.008;
  const tpPct = 0.008;
  const trailActivate = 0.004;
  const trailDistance = 0.003;
  
  for (let i = 250; i < data1m.length; i++) {
    const candle = data1m[i];
    const price = candle.close;
    
    if (inTrade) {
      const change = entry.type === 'BUY' ? 
        (price - entry.price) / entry.price :
        (entry.price - price) / entry.price;
      
      let trailingActive = entry.trailingActive || false;
      let highestProfit = entry.highestProfit || 0;
      let trailingSL = entry.trailingSL || 0;
      
      if (!trailingActive && change >= trailActivate) {
        trailingActive = true;
        highestProfit = change;
        trailingSL = entry.type === 'BUY' ?
          price * (1 - trailDistance) :
          price * (1 + trailDistance);
        entry.trailingActive = trailingActive;
        entry.highestProfit = highestProfit;
        entry.trailingSL = trailingSL;
      }
      
      if (trailingActive) {
        if (change > highestProfit) {
          highestProfit = change;
          trailingSL = entry.type === 'BUY' ?
            price * (1 - trailDistance) :
            price * (1 + trailDistance);
          entry.highestProfit = highestProfit;
          entry.trailingSL = trailingSL;
        }
        
        const hitTrailing = entry.type === 'BUY' ? 
          price <= trailingSL :
          price >= trailingSL;
        
        if (hitTrailing) {
          const exitPct = entry.type === 'BUY' ?
            (trailingSL - entry.price) / entry.price :
            (entry.price - trailingSL) / entry.price;
          
          trades.push({
            ...entry,
            exit: trailingSL,
            exitPct: exitPct * 100,
            exitType: 'TRAILING'
          });
          
          inTrade = false;
          continue;
        }
      }
      
      const sl = entry.sl;
      const tp = entry.tp;
      
      const hitSL = entry.type === 'BUY' ? 
        candle.low <= sl :
        candle.high >= sl;
      const hitTP = entry.type === 'BUY' ?
        candle.high >= tp :
        candle.low <= tp;
      
      if (hitSL) {
        trades.push({
          ...entry,
          exit: sl,
          exitPct: -slPct * 100,
          exitType: 'SL'
        });
        inTrade = false;
      } else if (hitTP) {
        trades.push({
          ...entry,
          exit: tp,
          exitPct: tpPct * 100,
          exitType: 'TP'
        });
        inTrade = false;
      }
      
      continue;
    }
    
    const analysis = analyzeMultiTF(data1m, data3m, data5m, i);
    
    if (analysis.signal === 'BUY' || analysis.signal === 'SELL') {
      const sl = analysis.signal === 'BUY' ?
        price * (1 - slPct) :
        price * (1 + slPct);
      
      const tp = analysis.signal === 'BUY' ?
        price * (1 + tpPct) :
        price * (1 - tpPct);
      
      entry = {
        type: analysis.signal,
        price,
        sl,
        tp,
        time: candle.time
      };
      
      inTrade = true;
    }
  }
  
  if (inTrade && trades.length > 0) {
    const lastPrice = data1m[data1m.length - 1].close;
    const exitPct = entry.type === 'BUY' ?
      (lastPrice - entry.price) / entry.price * 100 :
      (entry.price - lastPrice) / entry.price * 100;
    
    trades.push({
      ...entry,
      exit: lastPrice,
      exitPct,
      exitType: 'END'
    });
  }
  
  // Analyze trades
  const wins = trades.filter(t => t.exitPct > 0);
  const losses = trades.filter(t => t.exitPct <= 0);
  
  const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.exitPct, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + t.exitPct, 0) / losses.length : 0;
  const totalPnL = trades.reduce((sum, t) => sum + t.exitPct, 0);
  
  console.log(`\n📊 Trade Statistics:`);
  console.log(`Total Trades: ${trades.length}`);
  console.log(`Wins: ${wins.length} (${(wins.length/trades.length*100).toFixed(1)}%)`);
  console.log(`Losses: ${losses.length} (${(losses.length/trades.length*100).toFixed(1)}%)`);
  console.log(`\n💰 P&L Analysis:`);
  console.log(`Avg Win: ${avgWin.toFixed(3)}%`);
  console.log(`Avg Loss: ${avgLoss.toFixed(3)}%`);
  console.log(`Total P&L: ${totalPnL.toFixed(2)}%`);
  console.log(`Profit Factor: ${Math.abs(avgWin / avgLoss).toFixed(2)}`);
  
  // Exit type analysis
  const exitTypes = {
    TP: trades.filter(t => t.exitType === 'TP').length,
    SL: trades.filter(t => t.exitType === 'SL').length,
    TRAILING: trades.filter(t => t.exitType === 'TRAILING').length,
    END: trades.filter(t => t.exitType === 'END').length
  };
  
  console.log(`\n🚪 Exit Types:`);
  console.log(`TP: ${exitTypes.TP} (${(exitTypes.TP/trades.length*100).toFixed(1)}%)`);
  console.log(`SL: ${exitTypes.SL} (${(exitTypes.SL/trades.length*100).toFixed(1)}%)`);
  console.log(`Trailing: ${exitTypes.TRAILING} (${(exitTypes.TRAILING/trades.length*100).toFixed(1)}%)`);
  console.log(`End: ${exitTypes.END} (${(exitTypes.END/trades.length*100).toFixed(1)}%)`);
  
  // Trailing profit analysis
  const trailingTrades = trades.filter(t => t.exitType === 'TRAILING');
  const avgTrailing = trailingTrades.length > 0 ? 
    trailingTrades.reduce((sum, t) => sum + t.exitPct, 0) / trailingTrades.length : 0;
  
  console.log(`\n📈 Trailing Analysis:`);
  console.log(`Avg Trailing Exit: ${avgTrailing.toFixed(3)}%`);
  console.log(`Trailing Wins: ${trailingTrades.filter(t => t.exitPct > 0).length}`);
  console.log(`Trailing Losses: ${trailingTrades.filter(t => t.exitPct <= 0).length}`);
  
  // Best/Worst trades
  const sorted = [...trades].sort((a, b) => b.exitPct - a.exitPct);
  
  console.log(`\n🏆 Best 3 Trades:`);
  sorted.slice(0, 3).forEach((t, i) => {
    console.log(`  ${i+1}. ${t.type} @ $${t.price.toFixed(2)} → ${t.exitType}: ${t.exitPct.toFixed(2)}%`);
  });
  
  console.log(`\n❌ Worst 3 Trades:`);
  sorted.slice(-3).reverse().forEach((t, i) => {
    console.log(`  ${i+1}. ${t.type} @ $${t.price.toFixed(2)} → ${t.exitType}: ${t.exitPct.toFixed(2)}%`);
  });
  
  return {
    symbol,
    trades: trades.length,
    winRate: wins.length / trades.length * 100,
    avgWin,
    avgLoss,
    totalPnL,
    profitFactor: Math.abs(avgWin / avgLoss)
  };
}

async function main() {
  const pairs = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔍 PROFIT ANALYSIS - Why Negative Despite Good WR?`);
  console.log(`${'='.repeat(70)}`);
  
  const results = [];
  
  for (const pair of pairs) {
    const result = await analyzePairProfits(pair);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 SUMMARY - All Pairs`);
  console.log(`${'='.repeat(70)}\n`);
  
  results.forEach(r => {
    console.log(`${r.symbol}:`);
    console.log(`  WR: ${r.winRate.toFixed(1)}% | Avg Win: ${r.avgWin.toFixed(3)}% | Avg Loss: ${r.avgLoss.toFixed(3)}%`);
    console.log(`  Total P&L: ${r.totalPnL.toFixed(2)}% | PF: ${r.profitFactor.toFixed(2)}\n`);
  });
  
  const totalPnL = results.reduce((sum, r) => sum + r.totalPnL, 0);
  const avgWR = results.reduce((sum, r) => sum + r.winRate, 0) / results.length;
  
  console.log(`Portfolio Total P&L: ${totalPnL.toFixed(2)}%`);
  console.log(`Portfolio Avg WR: ${avgWR.toFixed(1)}%`);
  
  console.log(`\n💡 RECOMMENDATIONS:`);
  if (totalPnL < 0) {
    console.log(`❌ Negative P&L despite ${avgWR.toFixed(1)}% WR`);
    console.log(`\nPossible Issues:`);
    console.log(`1. Avg Loss > Avg Win (bad R:R)`);
    console.log(`2. Trailing stops exiting too early`);
    console.log(`3. Not enough TP hits (trailing locks small profits)`);
    console.log(`\nSolutions:`);
    console.log(`✅ Widen TP to 1.0-1.2% (from 0.8%)`);
    console.log(`✅ Tighten SL to 0.6% (from 0.8%)`);
    console.log(`✅ Adjust trailing: activate 0.5%, trail 0.4%`);
    console.log(`✅ Or remove trailing, use pure 1:1.5 R:R`);
  } else {
    console.log(`✅ Strategy profitable!`);
  }
}

main().catch(console.error);
