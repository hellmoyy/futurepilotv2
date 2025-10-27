/**
 * 🎯 SMALL BALANCE FUTURES SCALPER ($1,000 - $5,000)
 * 
 * Optimized for accounts with limited capital.
 * Key differences from standard version:
 * - Higher leverage (20x) for adequate position sizes
 * - Tighter stop loss (0.5%) to minimize losses
 * - Wider take profit (1.5%) for better risk/reward
 * - Lower emergency exit threshold (1.5%)
 * - Minimum position size filter ($100 notional)
 */

const BinanceDataFetcher = require('./BinanceDataFetcher');

// ============================================================================
// CONFIGURATION - OPTIMIZED FOR SMALL BALANCE
// ============================================================================

const CONFIG = {
  // Account settings
  INITIAL_BALANCE: 1000,
  
  // Risk management - ADJUSTED FOR SMALL BALANCE
  RISK_PER_TRADE: 0.025,          // 2.5% risk per trade ($25 on $1000)
  LEVERAGE: 20,                    // 20x leverage (vs 10x standard)
  
  // Exit parameters - TIGHTER & MORE AGGRESSIVE
  STOP_LOSS_PCT: 0.005,           // 0.5% stop loss (vs 0.8%)
  TAKE_PROFIT_PCT: 0.015,         // 1.5% take profit (vs 0.8%)
  EMERGENCY_EXIT_PCT: 0.015,      // 1.5% emergency exit (vs 2%)
  
  // Position sizing
  MIN_NOTIONAL_VALUE: 50,         // Minimum $50 position (lower for small balance)
  MAX_NOTIONAL_VALUE: 5000,       // Maximum $5000 position (safety cap)
  
  // Trailing stops - ADJUSTED
  TRAILING_PROFIT_ACTIVATE: 0.006, // Activate at +0.6% (vs +0.4%)
  TRAILING_PROFIT_DISTANCE: 0.004, // Trail 0.4% below peak (vs 0.3%)
  TRAILING_LOSS_ACTIVATE: 0.004,   // Activate at -0.4% (vs -0.3%)
  TRAILING_LOSS_DISTANCE: 0.003,   // Trail 0.3% above low (vs 0.2%)
  
  // Technical indicators - SAME AS STANDARD
  EMA_FAST: 9,
  EMA_SLOW: 21,
  RSI_PERIOD: 14,
  RSI_OVERSOLD: 35,
  RSI_OVERBOUGHT: 68,
  MACD_FAST: 12,
  MACD_SLOW: 26,
  MACD_SIGNAL: 9,
  ADX_PERIOD: 14,
  
  // Filters - SAME AS STANDARD
  MIN_VOLUME_MULTIPLIER: 0.8,      // Same as standard
  MAX_VOLUME_MULTIPLIER: 2.0,      // Same as standard
  MIN_ADX: 20,                     // Same as standard
  MAX_ADX: 50,                     // Same as standard
  MIN_MACD_STRENGTH_PCT: 0.003,    // Same as standard
  
  // Market bias
  MARKET_BIAS_LOOKBACK: 100,
  MARKET_BIAS_THRESHOLD: 0.02,
  
  // Entry confirmation
  ENTRY_CONFIRMATION_CANDLES: 2,
};

// ============================================================================
// FUTURES ACCOUNT - SAME AS STANDARD
// ============================================================================

class FuturesAccount {
  constructor(initialBalance) {
    this.balance = initialBalance;
    this.equity = initialBalance;
    this.initialBalance = initialBalance;
    this.usedMargin = 0;
    this.unrealizedPnL = 0;
  }

  openPosition(size, price, leverage) {
    const notionalValue = size * price;
    const marginRequired = notionalValue / leverage;
    
    if (marginRequired > this.balance) {
      return { success: false, reason: 'Insufficient margin' };
    }
    
    this.usedMargin += marginRequired;
    this.balance -= marginRequired;
    
    return { 
      success: true, 
      notionalValue,
      marginUsed: marginRequired 
    };
  }

  closePosition(pnl, marginUsed) {
    this.balance += marginUsed + pnl;
    this.usedMargin -= marginUsed;
    this.equity = this.balance + this.unrealizedPnL;
  }

  updateUnrealizedPnL(pnl) {
    this.unrealizedPnL = pnl;
    this.equity = this.balance + this.unrealizedPnL;
  }

  getAvailableBalance() {
    return this.balance;
  }

  getEquity() {
    return this.equity;
  }
}

// ============================================================================
// TECHNICAL INDICATORS
// ============================================================================

function calculateEMA(data, period) {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  ema[0] = data[0];
  
  for (let i = 1; i < data.length; i++) {
    ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }
  
  return ema;
}

function calculateRSI(data, period = 14) {
  const rsi = [];
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  for (let i = period; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    const rs = avgGain / avgLoss;
    rsi[i] = 100 - (100 / (1 + rs));
  }
  
  return rsi;
}

function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);
  
  const macdLine = emaFast.map((fast, i) => fast - emaSlow[i]);
  const signalLine = calculateEMA(macdLine.filter(v => !isNaN(v)), signalPeriod);
  
  const histogram = [];
  const offset = macdLine.length - signalLine.length;
  
  for (let i = 0; i < macdLine.length; i++) {
    if (i >= offset) {
      histogram[i] = macdLine[i] - signalLine[i - offset];
    }
  }
  
  return { macdLine, signalLine, histogram };
}

function calculateADX(high, low, close, period = 14) {
  const tr = [];
  const dmPlus = [];
  const dmMinus = [];
  
  for (let i = 1; i < close.length; i++) {
    const highDiff = high[i] - high[i - 1];
    const lowDiff = low[i - 1] - low[i];
    
    tr[i] = Math.max(
      high[i] - low[i],
      Math.abs(high[i] - close[i - 1]),
      Math.abs(low[i] - close[i - 1])
    );
    
    dmPlus[i] = (highDiff > lowDiff && highDiff > 0) ? highDiff : 0;
    dmMinus[i] = (lowDiff > highDiff && lowDiff > 0) ? lowDiff : 0;
  }
  
  const atrValues = calculateEMA(tr.filter(v => v !== undefined), period);
  const diPlus = calculateEMA(dmPlus.filter(v => v !== undefined), period);
  const diMinus = calculateEMA(dmMinus.filter(v => v !== undefined), period);
  
  const adx = [];
  for (let i = 0; i < diPlus.length; i++) {
    const diSum = diPlus[i] + diMinus[i];
    if (diSum === 0) {
      adx[i] = 0;
      continue;
    }
    const dx = Math.abs(diPlus[i] - diMinus[i]) / diSum * 100;
    adx[i] = dx;
  }
  
  return calculateEMA(adx, period);
}

// ============================================================================
// MARKET BIAS DETECTION
// ============================================================================

function detectMarketBias(candles, lookback = CONFIG.MARKET_BIAS_LOOKBACK) {
  if (candles.length < lookback) return 'NEUTRAL';
  
  const recentCandles = candles.slice(-lookback);
  const startPrice = recentCandles[0].close;
  const endPrice = recentCandles[recentCandles.length - 1].close;
  const priceChange = (endPrice - startPrice) / startPrice;
  
  if (priceChange > CONFIG.MARKET_BIAS_THRESHOLD) return 'BULLISH';
  if (priceChange < -CONFIG.MARKET_BIAS_THRESHOLD) return 'BEARISH';
  return 'NEUTRAL';
}

// ============================================================================
// SIGNAL ANALYSIS
// ============================================================================

function analyzeSingleTimeframe(candles, currentIndex) {
  if (currentIndex < 250) return null;
  
  const closePrices = candles.slice(0, currentIndex + 1).map(c => c.close);
  const emaFast = calculateEMA(closePrices, CONFIG.EMA_FAST);
  const emaSlow = calculateEMA(closePrices, CONFIG.EMA_SLOW);
  const rsi = calculateRSI(closePrices, CONFIG.RSI_PERIOD);
  const macd = calculateMACD(closePrices, CONFIG.MACD_FAST, CONFIG.MACD_SLOW, CONFIG.MACD_SIGNAL);
  
  const currentEmaFast = emaFast[emaFast.length - 1];
  const currentEmaSlow = emaSlow[emaSlow.length - 1];
  const prevEmaFast = emaFast[emaFast.length - 2];
  const prevEmaSlow = emaSlow[emaSlow.length - 2];
  const currentRSI = rsi[rsi.length - 1];
  const currentHistogram = macd.histogram[macd.histogram.length - 1];
  const prevHistogram = macd.histogram[macd.histogram.length - 2];
  
  const currentPrice = closePrices[closePrices.length - 1];
  
  // BUY signal
  if (
    currentEmaFast > currentEmaSlow &&
    prevEmaFast <= prevEmaSlow &&
    currentRSI > CONFIG.RSI_OVERSOLD &&
    currentRSI < CONFIG.RSI_OVERBOUGHT &&
    currentHistogram > 0 &&
    currentHistogram > prevHistogram
  ) {
    return {
      type: 'BUY',
      confidence: Math.min((currentEmaFast - currentEmaSlow) / currentPrice * 10000, 100),
      rsi: currentRSI,
      macdStrength: Math.abs(currentHistogram) / currentPrice
    };
  }
  
  // SELL signal
  if (
    currentEmaFast < currentEmaSlow &&
    prevEmaFast >= prevEmaSlow &&
    currentRSI > CONFIG.RSI_OVERSOLD &&
    currentRSI < CONFIG.RSI_OVERBOUGHT &&
    currentHistogram < 0 &&
    currentHistogram < prevHistogram
  ) {
    return {
      type: 'SELL',
      confidence: Math.min((currentEmaSlow - currentEmaFast) / currentPrice * 10000, 100),
      rsi: currentRSI,
      macdStrength: Math.abs(currentHistogram) / currentPrice
    };
  }
  
  return null;
}

function analyzeMultiTimeframe(data1m, data3m, data5m, index1m) {
  const signal1m = analyzeSingleTimeframe(data1m, index1m);
  if (!signal1m) return null;
  
  const index3m = Math.floor(index1m / 3);
  const index5m = Math.floor(index1m / 5);
  
  if (index3m >= data3m.length || index5m >= data5m.length) return null;
  
  const signal3m = analyzeSingleTimeframe(data3m, index3m);
  const signal5m = analyzeSingleTimeframe(data5m, index5m);
  
  if (!signal3m || !signal5m) return null;
  if (signal1m.type !== signal3m.type || signal1m.type !== signal5m.type) return null;
  
  // Volume filter
  const recentCandles = data1m.slice(Math.max(0, index1m - 20), index1m + 1);
  const avgVolume = recentCandles.reduce((sum, c) => sum + c.volume, 0) / recentCandles.length;
  const currentVolume = data1m[index1m].volume;
  const volumeRatio = currentVolume / avgVolume;
  
  if (volumeRatio < CONFIG.MIN_VOLUME_MULTIPLIER || volumeRatio > CONFIG.MAX_VOLUME_MULTIPLIER) {
    return null;
  }
  
  // ADX filter
  const highs = data1m.slice(0, index1m + 1).map(c => c.high);
  const lows = data1m.slice(0, index1m + 1).map(c => c.low);
  const closes = data1m.slice(0, index1m + 1).map(c => c.close);
  const adx = calculateADX(highs, lows, closes, CONFIG.ADX_PERIOD);
  const currentADX = adx[adx.length - 1];
  
  if (currentADX < CONFIG.MIN_ADX || currentADX > CONFIG.MAX_ADX) {
    return null;
  }
  
  // MACD strength filter
  const macdStrengthPct = signal1m.macdStrength * 100;
  if (macdStrengthPct < CONFIG.MIN_MACD_STRENGTH_PCT) {
    return null;
  }
  
  // Market bias filter
  const marketBias = detectMarketBias(data1m.slice(0, index1m + 1));
  let biasConfidenceAdjustment = 0;
  
  if (marketBias === 'BULLISH' && signal1m.type === 'SELL') {
    biasConfidenceAdjustment = -30;
  } else if (marketBias === 'BEARISH' && signal1m.type === 'BUY') {
    biasConfidenceAdjustment = -30;
  }
  
  const combinedConfidence = (signal1m.confidence + signal3m.confidence + signal5m.confidence) / 3;
  const adjustedConfidence = combinedConfidence + biasConfidenceAdjustment;
  
  // More lenient confidence threshold for small balance (more opportunities)
  if (adjustedConfidence < 50) return null;
  
  return {
    type: signal1m.type,
    confidence: adjustedConfidence,
    volumeRatio,
    adx: currentADX,
    macdStrength: macdStrengthPct,
    marketBias
  };
}

// ============================================================================
// BACKTEST ENGINE
// ============================================================================

async function backtestSmallBalance(symbol, period, initialBalance = CONFIG.INITIAL_BALANCE) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🎯 Small Balance Backtesting ${symbol} (${period})`);
  console.log(`💰 Initial Balance: $${initialBalance}`);
  console.log(`📊 Leverage: ${CONFIG.LEVERAGE}x`);
  console.log(`⚠️ Risk per Trade: ${(CONFIG.RISK_PER_TRADE * 100).toFixed(2)}%`);
  console.log(`${'='.repeat(70)}\n`);
  
  // Fetch data
  const fetcher = new BinanceDataFetcher();
  
  let startDate, endDate;
  endDate = new Date();
  
  if (period === '1w') {
    startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === '1m') {
    startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (period === '3m') {
    startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else if (period === '6m') {
    startDate = new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000);
  } else if (period === '1y') {
    startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  console.log('📊 Fetching data...\n');
  const data1m = await fetcher.fetchPeriod(symbol, '1m', startDate, endDate);
  const data3m = await fetcher.fetchPeriod(symbol, '3m', startDate, endDate);
  const data5m = await fetcher.fetchPeriod(symbol, '5m', startDate, endDate);
  
  console.log(`✅ Data fetched: ${data1m.length} candles (1m)\n`);
  
  // Initialize account and tracking
  const account = new FuturesAccount(initialBalance);
  const trades = [];
  let inPosition = false;
  let position = null;
  
  // Trailing stop state
  let trailingProfitActive = false;
  let trailingLossActive = false;
  let highestProfit = 0;
  let lowestLoss = 0;
  let trailingSL = 0;
  
  // Entry confirmation tracking
  let pendingSignal = null;
  let signalConfirmationCount = 0;
  
  // Start backtest loop
  let signalCount = 0;
  let confirmedSignalCount = 0;
  let skippedSmallPositions = 0;
  
  for (let i = 250; i < data1m.length; i++) {
    const candle = data1m[i];
    const currentPrice = candle.close;
    
    // === MANAGE EXISTING POSITION ===
    if (inPosition) {
      // Calculate current P&L
      const priceChange = position.type === 'BUY' ?
        (currentPrice - position.entryPrice) :
        (position.entryPrice - currentPrice);
      
      const pnl = position.size * priceChange;
      const pnlPct = priceChange / position.entryPrice;
      
      account.updateUnrealizedPnL(pnl);
      
      // Emergency exit check - TIGHTER AT 1.5%
      if (pnlPct <= -CONFIG.EMERGENCY_EXIT_PCT) {
        account.closePosition(pnl, position.marginUsed);
        trades.push({
          ...position,
          exitPrice: currentPrice,
          exitTime: candle.time,
          pnl,
          pnlPct,
          exitType: 'EMERGENCY_EXIT'
        });
        
        inPosition = false;
        position = null;
        trailingProfitActive = false;
        trailingLossActive = false;
        continue;
      }
      
      // Trailing profit logic
      if (pnlPct >= CONFIG.TRAILING_PROFIT_ACTIVATE) {
        trailingProfitActive = true;
        highestProfit = Math.max(highestProfit, pnlPct);
        
        const trailingStop = highestProfit - CONFIG.TRAILING_PROFIT_DISTANCE;
        if (pnlPct <= trailingStop) {
          account.closePosition(pnl, position.marginUsed);
          trades.push({
            ...position,
            exitPrice: currentPrice,
            exitTime: candle.time,
            pnl,
            pnlPct,
            exitType: 'TRAILING_PROFIT'
          });
          
          inPosition = false;
          position = null;
          trailingProfitActive = false;
          highestProfit = 0;
          continue;
        }
      }
      
      // Trailing loss logic
      if (pnlPct <= -CONFIG.TRAILING_LOSS_ACTIVATE && !trailingLossActive) {
        trailingLossActive = true;
        lowestLoss = pnlPct;
      }
      
      if (trailingLossActive) {
        lowestLoss = Math.min(lowestLoss, pnlPct);
        const trailingStop = lowestLoss + CONFIG.TRAILING_LOSS_DISTANCE;
        
        if (pnlPct >= trailingStop) {
          account.closePosition(pnl, position.marginUsed);
          trades.push({
            ...position,
            exitPrice: currentPrice,
            exitTime: candle.time,
            pnl,
            pnlPct,
            exitType: 'TRAILING_LOSS'
          });
          
          inPosition = false;
          position = null;
          trailingLossActive = false;
          lowestLoss = 0;
          continue;
        }
      }
      
      // Take profit check
      if (pnlPct >= CONFIG.TAKE_PROFIT_PCT) {
        account.closePosition(pnl, position.marginUsed);
        trades.push({
          ...position,
          exitPrice: currentPrice,
          exitTime: candle.time,
          pnl,
          pnlPct,
          exitType: 'TP'
        });
        
        inPosition = false;
        position = null;
        trailingProfitActive = false;
        trailingLossActive = false;
        continue;
      }
      
      // Stop loss check
      if (pnlPct <= -CONFIG.STOP_LOSS_PCT) {
        account.closePosition(pnl, position.marginUsed);
        trades.push({
          ...position,
          exitPrice: currentPrice,
          exitTime: candle.time,
          pnl,
          pnlPct,
          exitType: 'SL'
        });
        
        inPosition = false;
        position = null;
        trailingProfitActive = false;
        trailingLossActive = false;
        continue;
      }
      
      continue;
    }
    
    // === LOOK FOR NEW ENTRY ===
    const signal = analyzeMultiTimeframe(data1m, data3m, data5m, i);
    
    if (signal) {
      signalCount++;
    }
    
    if (!signal) {
      pendingSignal = null;
      signalConfirmationCount = 0;
      continue;
    }
    
    // Entry confirmation logic
    if (!pendingSignal) {
      pendingSignal = signal;
      signalConfirmationCount = 1;
      continue;
    }
    
    if (pendingSignal.type === signal.type) {
      signalConfirmationCount++;
      
      if (signalConfirmationCount >= CONFIG.ENTRY_CONFIRMATION_CANDLES) {
        confirmedSignalCount++;
        
        // Calculate position size with SMALL BALANCE logic
        const availableBalance = account.getAvailableBalance();
        const riskAmount = availableBalance * CONFIG.RISK_PER_TRADE;
        
        // Position sizing based on stop loss
        const stopLossDistance = CONFIG.STOP_LOSS_PCT;
        const size = riskAmount / (currentPrice * stopLossDistance);
        const notionalValue = size * currentPrice;
        
        // CHECK MINIMUM AND MAXIMUM NOTIONAL
        if (notionalValue < CONFIG.MIN_NOTIONAL_VALUE) {
          skippedSmallPositions++;
          console.log(`⚠️ Position too small ($${notionalValue.toFixed(2)} < $${CONFIG.MIN_NOTIONAL_VALUE}), skipping trade`);
          pendingSignal = null;
          signalConfirmationCount = 0;
          continue;
        }
        
        if (notionalValue > CONFIG.MAX_NOTIONAL_VALUE) {
          console.log(`⚠️ Position too large ($${notionalValue.toFixed(2)} > $${CONFIG.MAX_NOTIONAL_VALUE}), capping position`);
          const cappedSize = CONFIG.MAX_NOTIONAL_VALUE / currentPrice;
          const cappedNotional = CONFIG.MAX_NOTIONAL_VALUE;
          
          // Recalculate with capped size
          const result = account.openPosition(cappedSize, currentPrice, CONFIG.LEVERAGE);
          
          if (result.success) {
            const stopLoss = signal.type === 'BUY' ?
              currentPrice * (1 - CONFIG.STOP_LOSS_PCT) :
              currentPrice * (1 + CONFIG.STOP_LOSS_PCT);
            
            const takeProfit = signal.type === 'BUY' ?
              currentPrice * (1 + CONFIG.TAKE_PROFIT_PCT) :
              currentPrice * (1 - CONFIG.TAKE_PROFIT_PCT);
            
            position = {
              symbol,
              type: signal.type,
              entryPrice: currentPrice,
              entryTime: candle.time,
              size: cappedSize,
              notionalValue: cappedNotional,
              marginUsed: result.marginUsed,
              leverage: CONFIG.LEVERAGE,
              stopLoss,
              takeProfit,
              riskAmount,
              confidence: signal.confidence
            };
            
            inPosition = true;
          }
          
          pendingSignal = null;
          signalConfirmationCount = 0;
          continue;
        }
        
        // Open position with calculated size
        const result = account.openPosition(size, currentPrice, CONFIG.LEVERAGE);
        
        if (result.success) {
          const stopLoss = signal.type === 'BUY' ?
            currentPrice * (1 - CONFIG.STOP_LOSS_PCT) :
            currentPrice * (1 + CONFIG.STOP_LOSS_PCT);
          
          const takeProfit = signal.type === 'BUY' ?
            currentPrice * (1 + CONFIG.TAKE_PROFIT_PCT) :
            currentPrice * (1 - CONFIG.TAKE_PROFIT_PCT);
          
          position = {
            symbol,
            type: signal.type,
            entryPrice: currentPrice,
            entryTime: candle.time,
            size,
            notionalValue: result.notionalValue,
            marginUsed: result.marginUsed,
            leverage: CONFIG.LEVERAGE,
            stopLoss,
            takeProfit,
            riskAmount,
            confidence: signal.confidence
          };
          
          inPosition = true;
          trailingProfitActive = false;
          trailingLossActive = false;
          highestProfit = 0;
          lowestLoss = 0;
        }
        
        pendingSignal = null;
        signalConfirmationCount = 0;
      }
    } else {
      pendingSignal = signal;
      signalConfirmationCount = 1;
    }
  }
  
  // Close any remaining position
  if (inPosition) {
    const currentPrice = data1m[data1m.length - 1].close;
    const priceChange = position.type === 'BUY' ?
      (currentPrice - position.entryPrice) :
      (position.entryPrice - currentPrice);
    
    const pnl = position.size * priceChange;
    const pnlPct = priceChange / position.entryPrice;
    
    account.closePosition(pnl, position.marginUsed);
    trades.push({
      ...position,
      exitPrice: currentPrice,
      exitTime: data1m[data1m.length - 1].time,
      pnl,
      pnlPct,
      exitType: 'END_OF_PERIOD'
    });
  }
  
  console.log(`\n📊 Signal Analysis:`);
  console.log(`   Total Signals Detected: ${signalCount}`);
  console.log(`   Confirmed Signals (${CONFIG.ENTRY_CONFIRMATION_CANDLES} candles): ${confirmedSignalCount}`);
  console.log(`   Skipped (position too small): ${skippedSmallPositions}`);
  console.log(`   Actual Trades Executed: ${trades.length}\n`);
  
  // Calculate results
  const finalBalance = account.getEquity();
  const profit = finalBalance - initialBalance;
  const roi = (profit / initialBalance) * 100;
  
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl <= 0);
  
  const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
  
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins;
  
  // Print results
  console.log('\n' + '='.repeat(70));
  console.log(`📊 ${symbol} RESULTS`);
  console.log('='.repeat(70));
  
  console.log('\n💰 ACCOUNT SUMMARY:');
  console.log(`   Initial Balance: $${initialBalance.toFixed(2)}`);
  console.log(`   Final Balance: $${finalBalance.toFixed(2)}`);
  console.log(`   Total Profit: $${profit.toFixed(2)}`);
  console.log(`   ROI: ${roi.toFixed(2)}%`);
  
  console.log('\n📈 TRADE STATISTICS:');
  console.log(`   Total Trades: ${trades.length}`);
  console.log(`   Wins: ${wins.length} (${(wins.length / trades.length * 100).toFixed(2)}%)`);
  console.log(`   Losses: ${losses.length}`);
  
  console.log('\n💵 PROFIT/LOSS BREAKDOWN:');
  console.log(`   Total Wins: $${totalWins.toFixed(2)}`);
  console.log(`   Average Win: $${(totalWins / wins.length).toFixed(2)}`);
  console.log(`   Total Losses: $-${totalLosses.toFixed(2)}`);
  console.log(`   Average Loss: $${(totalLosses / losses.length).toFixed(2)}`);
  console.log(`   Profit Factor: ${profitFactor.toFixed(2)}`);
  
  // Top wins
  console.log('\n🏆 TOP 5 WINS:');
  const topWins = [...wins].sort((a, b) => b.pnl - a.pnl).slice(0, 5);
  topWins.forEach((trade, i) => {
    console.log(`   ${i + 1}. ${trade.type}: $${trade.pnl.toFixed(2)} (${(trade.pnlPct * 100).toFixed(2)}%) - ${trade.exitType}`);
  });
  
  // Top losses
  console.log('\n📉 TOP 5 LOSSES:');
  const topLosses = [...losses].sort((a, b) => a.pnl - b.pnl).slice(0, 5);
  topLosses.forEach((trade, i) => {
    console.log(`   ${i + 1}. ${trade.type}: $${trade.pnl.toFixed(2)} (${(trade.pnlPct * 100).toFixed(2)}%) - ${trade.exitType}`);
  });
  
  console.log('\n');
  
  return {
    symbol,
    initialBalance,
    finalBalance,
    profit,
    roi,
    trades,
    wins: wins.length,
    losses: losses.length,
    winRate: (wins.length / trades.length * 100),
    profitFactor,
    totalWins,
    totalLosses
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  const symbolArg = args.find(arg => arg.startsWith('--symbol='));
  const periodArg = args.find(arg => arg.startsWith('--period='));
  const balanceArg = args.find(arg => arg.startsWith('--balance='));
  
  const symbol = symbolArg ? symbolArg.split('=')[1] : 'BTCUSDT';
  const period = periodArg ? periodArg.split('=')[1] : '1m';
  const initialBalance = balanceArg ? parseFloat(balanceArg.split('=')[1]) : CONFIG.INITIAL_BALANCE;
  
  await backtestSmallBalance(symbol, period, initialBalance);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { backtestSmallBalance };
