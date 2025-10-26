/**
 * 🔍 DEBUG: Why altcoins not getting signals
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

async function debugPair(symbol) {
  const fetcher = new BinanceDataFetcher();
  
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔍 DEBUGGING ${symbol}`);
  console.log(`${'='.repeat(70)}`);
  
  try {
    // Fetch data
    console.log(`\n📊 Fetching data...`);
    const data1m = await fetcher.fetchPeriod(symbol, '1m', startDate, endDate);
    const data3m = await fetcher.fetchPeriod(symbol, '3m', startDate, endDate);
    const data5m = await fetcher.fetchPeriod(symbol, '5m', startDate, endDate);
    
    console.log(`✅ Got ${data1m.length} 1m candles`);
    
    // Check last 100 candles for potential signals
    let potentialSignals = 0;
    let macdTooWeak = 0;
    let volumeTooLow = 0;
    let volumeTooHigh = 0;
    let adxTooLow = 0;
    let adxTooHigh = 0;
    let noTrendAlignment = 0;
    
    for (let i = data1m.length - 100; i < data1m.length; i++) {
      const prices = data1m.slice(Math.max(0, i - 50), i + 1).map(c => c.close);
      const macd = calculateMACD(prices);
      const rsi = calculateRSI(prices);
      const ema5 = calculateEMA(prices, 5);
      const ema10 = calculateEMA(prices, 10);
      const ema20 = calculateEMA(prices, 20);
      const price = prices[prices.length - 1];
      
      // Volume
      const volumes = data1m.slice(Math.max(0, i - 20), i + 1).map(c => c.volume);
      const avgVol = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / 19;
      const currentVol = volumes[volumes.length - 1];
      const volRatio = currentVol / avgVol;
      
      // ADX
      const index5m = Math.floor(i / 5);
      const hist5m = data5m.slice(0, index5m + 1);
      const adx = calculateADX(hist5m);
      
      // Check MACD
      const macdStrong = Math.abs(macd.histogram) > 2.0;
      
      // Check trend
      const trendUp = price > ema5 && ema5 > ema10 && ema10 > ema20;
      const trendDown = price < ema5 && ema5 < ema10 && ema10 < ema20;
      
      if ((trendUp && macd.histogram > 0) || (trendDown && macd.histogram < 0)) {
        potentialSignals++;
        
        // Analyze why it fails
        if (!macdStrong) {
          macdTooWeak++;
        }
        if (volRatio < 0.8) {
          volumeTooLow++;
        }
        if (volRatio > 2.0) {
          volumeTooHigh++;
        }
        if (adx < 20) {
          adxTooLow++;
        }
        if (adx > 50) {
          adxTooHigh++;
        }
        if (!trendUp && !trendDown) {
          noTrendAlignment++;
        }
      }
    }
    
    console.log(`\n📊 Analysis (last 100 candles):`);
    console.log(`Potential signals (trend + MACD direction): ${potentialSignals}`);
    console.log(`\nReasons for rejection:`);
    console.log(`  ❌ MACD too weak (<2.0): ${macdTooWeak} (${(macdTooWeak/potentialSignals*100).toFixed(1)}%)`);
    console.log(`  ❌ Volume too low (<0.8x): ${volumeTooLow} (${(volumeTooLow/potentialSignals*100).toFixed(1)}%)`);
    console.log(`  ❌ Volume too high (>2.0x): ${volumeTooHigh} (${(volumeTooHigh/potentialSignals*100).toFixed(1)}%)`);
    console.log(`  ❌ ADX too low (<20): ${adxTooLow} (${(adxTooLow/potentialSignals*100).toFixed(1)}%)`);
    console.log(`  ❌ ADX too high (>50): ${adxTooHigh} (${(adxTooHigh/potentialSignals*100).toFixed(1)}%)`);
    
    // Check recent MACD values
    console.log(`\n📈 Recent MACD histogram values (last 10):`);
    for (let i = data1m.length - 10; i < data1m.length; i++) {
      const prices = data1m.slice(Math.max(0, i - 50), i + 1).map(c => c.close);
      const macd = calculateMACD(prices);
      const time = new Date(data1m[i].time).toLocaleString();
      console.log(`  ${time}: ${macd.histogram.toFixed(4)} ${Math.abs(macd.histogram) > 2.0 ? '✅' : '❌'}`);
    }
    
    // Check ADX
    console.log(`\n📊 Recent ADX values (last 5):`);
    for (let i = data5m.length - 5; i < data5m.length; i++) {
      const hist5m = data5m.slice(0, i + 1);
      const adx = calculateADX(hist5m);
      const time = new Date(data5m[i].time).toLocaleString();
      console.log(`  ${time}: ${adx.toFixed(2)} ${adx >= 20 && adx <= 50 ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

async function main() {
  const pairs = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];
  
  for (const pair of pairs) {
    await debugPair(pair);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between pairs
  }
}

main().catch(console.error);
