/**
 * 🚀 FUTURES SCALPER BACKTEST ENGINE - FIXED DOLLAR TP/SL
 * 
 * ⚡ FUTURES TRADING LOGIC (Binance Futures):
 * - Starting Balance: $10,000 USD (USDT Margin)
 * - Risk per Trade: 2% of BALANCE = $200 (fixed dollar amount)
 * - Take Profit: 2% of BALANCE = $200 (fixed dollar amount)
 * - Stop Loss: 2% of BALANCE = $200 (fixed dollar amount)
 * - Leverage: 10x (optimal for scalping)
 * 
 * 📊 FIXED DOLLAR SYSTEM:
 * Example Trade (Balance $10,000):
 * - Target Profit: $200 (always 2% of current balance)
 * - Max Loss: $200 (always 2% of current balance)
 * - Position Size: Calculated to achieve exact dollar amount
 * 
 * Example Trade (Balance $1,000):
 * - Target Profit: $20 (2% of $1,000)
 * - Max Loss: $20 (2% of $1,000)
 * - Position Size: Auto-scaled for smaller balance
 * 
 * 🛡️ RISK MANAGEMENT:
 * - Stop Loss: 2% of balance (e.g., $200 on $10k) - FIXED DOLLAR
 * - Take Profit: 2% of balance (e.g., $200 on $10k) - FIXED DOLLAR
 * - Position Size: Dynamically calculated for exact TP/SL amounts
 * - Max Price Move: 1-2% to achieve target (varies by entry)
 * - Trailing Profit: Activates at +1%, trails at 0.5%
 * - Trailing Loss: Activates at -0.5%, trails at 0.3%
 * 
 * 🎯 STRATEGY FILTERS (Anti-False-Breakout):
 * - MACD Strength: >0.003% of price
 * - Volume: 0.8x - 2.0x average
 * - ADX: 20-50 (avoid weak trends)
 * - RSI: 35-68 (balanced)
 * - Triple Timeframe: 1m + 3m + 5m confirmation
 */

const BinanceDataFetcher = require('./BinanceDataFetcher');

// ==================== CONFIGURATION ====================

const CONFIG = {
  // Account Settings
  INITIAL_BALANCE: 10000,
  RISK_PER_TRADE: 0.02,          // 2% of current balance (FIXED DOLLAR)
  TARGET_PROFIT_PCT: 0.02,        // 2% of current balance (FIXED DOLLAR)
  LEVERAGE: 10,                   // 10x leverage for optimal risk
  
  // Fixed Dollar TP/SL System
  // Position size will be calculated to achieve exact dollar amounts
  // Example: $10k balance → $200 profit/loss, $1k balance → $20 profit/loss
  USE_FIXED_DOLLAR: true,
  
  // Max price move percentage (for position sizing calculation)
  // 1.34% move = 15% margin usage (with 10x leverage) - BALANCED
  MAX_PRICE_MOVE_PCT: 0.0134,    // 1.34% max price move for SL/TP
  
  // Trailing Stops (Optimized for Fixed Dollar system)
  TRAIL_PROFIT_ACTIVATE: 0.004,  // +0.4% activates trailing profit (early protection)
  TRAIL_PROFIT_DISTANCE: 0.003,  // Trail 0.3% behind peak
  TRAIL_LOSS_ACTIVATE: -0.003,   // -0.3% activates trailing loss
  TRAIL_LOSS_DISTANCE: 0.002,    // Trail 0.2% to cut losses early
  EMERGENCY_EXIT_PCT: 0.04,      // -4% emergency exit (2x risk)
  
  // Cooldown System (Risk Management)
  MAX_CONSECUTIVE_LOSSES: 3,     // Max consecutive losses before cooldown (changed from 2 to 3)
  COOLDOWN_PERIOD_HOURS: 24,     // 24-hour cooldown after max losses
  MAX_DAILY_LOSS_PCT: 0.06,      // 6% max daily loss (3x single trade risk)
  
  // Strategy Filters
  MACD_MIN_STRENGTH: 0.00003,    // 0.003% of price (percentage-based)
  VOLUME_MIN: 0.8,               // Min 0.8x average volume
  VOLUME_MAX: 2.0,               // Max 2.0x (avoid spikes)
  ADX_MIN: 20,                   // Min trend strength
  ADX_MAX: 50,                   // Max (avoid exhaustion)
  RSI_MIN: 35,                   // Min RSI
  RSI_MAX: 68,                   // Max RSI
  
  // Market Bias & Confirmation
  ENTRY_CONFIRMATION_CANDLES: 2, // Wait 2 candles for confirmation
  MARKET_BIAS_PERIOD: 100,       // Look back 100 candles for bias
  BIAS_THRESHOLD: 0.02,          // 2% move to determine bias
  
  // Technical Indicators
  EMA_FAST: 9,
  EMA_SLOW: 21,
  RSI_PERIOD: 14,
  MACD_FAST: 12,
  MACD_SLOW: 26,
  MACD_SIGNAL: 9,
};

// ==================== ACCOUNT CLASS ====================

class FuturesAccount {
  constructor(initialBalance) {
    this.balance = initialBalance;           // Available balance
    this.equity = initialBalance;            // Balance + unrealized PnL
    this.initialBalance = initialBalance;
    this.usedMargin = 0;                     // Margin locked in positions
    this.unrealizedPnL = 0;                  // Unrealized profit/loss
  }
  
  canOpenPosition(marginRequired) {
    return this.balance - this.usedMargin >= marginRequired;
  }
  
  openPosition(marginRequired) {
    this.usedMargin += marginRequired;
  }
  
  closePosition(marginReleased, realizedPnL) {
    this.usedMargin -= marginReleased;
    this.balance += realizedPnL;
    this.equity = this.balance;
    this.unrealizedPnL = 0;
  }
  
  updateUnrealizedPnL(unrealizedPnL) {
    this.unrealizedPnL = unrealizedPnL;
    this.equity = this.balance + unrealizedPnL;
  }
  
  getAvailableBalance() {
    return this.balance - this.usedMargin;
  }
}

// ==================== TECHNICAL INDICATORS ====================

function calculateEMA(data, period) {
  if (data.length < period) return null;
  
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
  
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  
  return ema;
}

function calculateRSI(data, period = 14) {
  if (data.length < period + 1) return 50;
  
  const prices = data.map(c => c.close);
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const gains = changes.slice(-period).map(c => c > 0 ? c : 0);
  const losses = changes.slice(-period).map(c => c < 0 ? -c : 0);
  
  const avgGain = gains.reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(data) {
  if (data.length < CONFIG.MACD_SLOW) return { macd: 0, signal: 0, histogram: 0 };
  
  const prices = data.map(c => c.close);
  const emaFast = calculateEMA(prices, CONFIG.MACD_FAST);
  const emaSlow = calculateEMA(prices, CONFIG.MACD_SLOW);
  
  if (!emaFast || !emaSlow) return { macd: 0, signal: 0, histogram: 0 };
  
  const macdLine = emaFast - emaSlow;
  
  // Simplified: Just use the MACD line directly (skip signal line calculation for speed)
  // For scalping, the histogram (MACD direction) is what matters
  const histogram = macdLine;
  
  return { macd: macdLine, signal: 0, histogram };
}

function calculateADX(data, period = 14) {
  if (data.length < period + 1) return 25;
  
  const tr = [];
  const plusDM = [];
  const minusDM = [];
  
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevHigh = data[i - 1].high;
    const prevLow = data[i - 1].low;
    const prevClose = data[i - 1].close;
    
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    tr.push(Math.max(tr1, tr2, tr3));
    
    const dmPlus = high - prevHigh;
    const dmMinus = prevLow - low;
    
    if (dmPlus > dmMinus && dmPlus > 0) {
      plusDM.push(dmPlus);
      minusDM.push(0);
    } else if (dmMinus > dmPlus && dmMinus > 0) {
      plusDM.push(0);
      minusDM.push(dmMinus);
    } else {
      plusDM.push(0);
      minusDM.push(0);
    }
  }
  
  const atr = tr.slice(-period).reduce((a, b) => a + b, 0) / period;
  const plusDI = (plusDM.slice(-period).reduce((a, b) => a + b, 0) / period / atr) * 100;
  const minusDI = (minusDM.slice(-period).reduce((a, b) => a + b, 0) / period / atr) * 100;
  
  const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
  return dx;
}

// ==================== STRATEGY ANALYSIS ====================

function detectMarketBias(data, index) {
  // Detect overall market trend (bullish/bearish/neutral)
  if (index < CONFIG.MARKET_BIAS_PERIOD) {
    return 'NEUTRAL';
  }
  
  const startPrice = data[index - CONFIG.MARKET_BIAS_PERIOD].close;
  const currentPrice = data[index].close;
  const priceChange = (currentPrice - startPrice) / startPrice;
  
  if (priceChange > CONFIG.BIAS_THRESHOLD) {
    return 'BULLISH'; // Market trending up
  } else if (priceChange < -CONFIG.BIAS_THRESHOLD) {
    return 'BEARISH'; // Market trending down
  }
  
  return 'NEUTRAL';
}

function analyzeSingleTimeframe(data, index) {
  if (index < 50) {
    return { signal: 'HOLD', confidence: 0 };
  }
  
  const history = data.slice(0, index + 1);
  const candle = data[index];
  const price = candle.close;
  
  // EMAs
  const closes = history.map(c => c.close);
  const emaFast = calculateEMA(closes, CONFIG.EMA_FAST);
  const emaSlow = calculateEMA(closes, CONFIG.EMA_SLOW);
  
  if (!emaFast || !emaSlow) {
    return { signal: 'HOLD', confidence: 0 };
  }
  
  // RSI
  const rsi = calculateRSI(history, CONFIG.RSI_PERIOD);
  
  // MACD
  const { macd, signal: macdSignal, histogram } = calculateMACD(history);
  
  // Determine signal
  let signal = 'HOLD';
  let confidence = 0;
  
  // BUY Conditions
  if (emaFast > emaSlow && 
      rsi > CONFIG.RSI_MIN && rsi < CONFIG.RSI_MAX && 
      histogram > 0) {
    signal = 'BUY';
    
    // Calculate confidence
    const emaGap = ((emaFast - emaSlow) / price) * 100;
    const rsiScore = rsi > 50 ? (rsi - 50) : (50 - rsi) * 0.5;
    const macdStrength = Math.abs(histogram / price) * 100;
    
    confidence = 50 + (emaGap * 1000) + rsiScore + (macdStrength * 10000);
  }
  // SELL Conditions
  else if (emaFast < emaSlow && 
           rsi > CONFIG.RSI_MIN && rsi < CONFIG.RSI_MAX && 
           histogram < 0) {
    signal = 'SELL';
    
    const emaGap = ((emaSlow - emaFast) / price) * 100;
    const rsiScore = rsi < 50 ? (50 - rsi) : (rsi - 50) * 0.5;
    const macdStrength = Math.abs(histogram / price) * 100;
    
    confidence = 50 + (emaGap * 1000) + rsiScore + (macdStrength * 10000);
  }
  
  return { signal, confidence, rsi, macd, histogram, emaFast, emaSlow };
}

function analyzeMultiTimeframe(data1m, data3m, data5m, index) {
  const index3m = Math.floor(index / 3);
  const index5m = Math.floor(index / 5);
  
  if (index < 250 || index3m < 50 || index5m < 50) {
    return { signal: 'HOLD', confidence: 0, reason: 'Not enough data' };
  }
  
  // Analyze each timeframe
  const tf1m = analyzeSingleTimeframe(data1m, index);
  const tf3m = analyzeSingleTimeframe(data3m, index3m);
  const tf5m = analyzeSingleTimeframe(data5m, index5m);
  
  // Check alignment
  const signals = [tf1m.signal, tf3m.signal, tf5m.signal];
  const buyCount = signals.filter(s => s === 'BUY').length;
  const sellCount = signals.filter(s => s === 'SELL').length;
  
  // Require all 3 timeframes to agree
  if (buyCount !== 3 && sellCount !== 3) {
    return { signal: 'HOLD', confidence: 0, reason: 'Timeframes not aligned' };
  }
  
  const potentialSignal = buyCount === 3 ? 'BUY' : 'SELL';
  
  // === ANTI-FALSE-BREAKOUT FILTERS ===
  
  // 1. Volume Check
  const volumes = data1m.slice(Math.max(0, index - 20), index + 1).map(c => c.volume);
  const avgVol = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / 19;
  const currentVol = volumes[volumes.length - 1];
  const volRatio = currentVol / avgVol;
  
  if (volRatio < CONFIG.VOLUME_MIN) {
    return { signal: 'HOLD', confidence: 0, reason: 'Low volume' };
  }
  if (volRatio > CONFIG.VOLUME_MAX) {
    return { signal: 'HOLD', confidence: 0, reason: 'Volume spike' };
  }
  
  // 2. ADX Check
  const hist5m = data5m.slice(0, index5m + 1);
  const adx = calculateADX(hist5m);
  
  if (adx < CONFIG.ADX_MIN) {
    return { signal: 'HOLD', confidence: 0, reason: 'Weak trend' };
  }
  if (adx > CONFIG.ADX_MAX) {
    return { signal: 'HOLD', confidence: 0, reason: 'ADX exhaustion' };
  }
  
  // 3. MACD Strength Check (percentage-based)
  const price = data1m[index].close;
  const macdStrengthPct = Math.abs(tf1m.histogram) / price;
  
  if (macdStrengthPct < CONFIG.MACD_MIN_STRENGTH) {
    return { signal: 'HOLD', confidence: 0, reason: 'Weak MACD' };
  }
  
  // 4. Check confidence levels
  if (tf1m.confidence < 75 || tf3m.confidence < 75 || tf5m.confidence < 75) {
    return { signal: 'HOLD', confidence: 0, reason: 'Low confidence' };
  }
  
  // === NEW: MARKET BIAS FILTER ===
  // Detect overall market bias and filter against-trend trades
  const marketBias = detectMarketBias(data5m, index5m);
  
  // In bullish market, be more selective with SELL signals
  if (marketBias === 'BULLISH' && potentialSignal === 'SELL') {
    // Only take SELL if very strong signal (higher confidence)
    const avgConfidenceTemp = (tf1m.confidence + tf3m.confidence + tf5m.confidence) / 3;
    if (avgConfidenceTemp < 100) {
      return { signal: 'HOLD', confidence: 0, reason: 'Weak SELL in bullish market' };
    }
  }
  
  // In bearish market, be more selective with BUY signals
  if (marketBias === 'BEARISH' && potentialSignal === 'BUY') {
    const avgConfidenceTemp = (tf1m.confidence + tf3m.confidence + tf5m.confidence) / 3;
    if (avgConfidenceTemp < 100) {
      return { signal: 'HOLD', confidence: 0, reason: 'Weak BUY in bearish market' };
    }
  }
  
  // All filters passed!
  const avgConfidence = (tf1m.confidence + tf3m.confidence + tf5m.confidence) / 3;
  
  return {
    signal: potentialSignal,
    confidence: avgConfidence,
    volRatio,
    adx,
    macdStrength: macdStrengthPct,
    marketBias
  };
}

// ==================== BACKTEST ENGINE ====================

async function backtestFuturesPair(symbol, period, initialBalance = CONFIG.INITIAL_BALANCE) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 Backtesting ${symbol} (${period})`);
  console.log(`${'='.repeat(70)}\n`);
  
  // Fetch data
  const fetcher = new BinanceDataFetcher();
  
  let startDate, endDate;
  endDate = new Date();
  
  if (period === '1w') {
    startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === '1m') {
    startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (period === '2m') {
    startDate = new Date(endDate.getTime() - 60 * 24 * 60 * 60 * 1000);
  } else if (period === '3m') {
    startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else if (period === '6m') {
    startDate = new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000);
  } else if (period === '1y') {
    startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  console.log(`📊 Fetching ${symbol} data...`);
  const data1m = await fetcher.fetchPeriod(symbol, '1m', startDate, endDate);
  const data3m = await fetcher.fetchPeriod(symbol, '3m', startDate, endDate);
  const data5m = await fetcher.fetchPeriod(symbol, '5m', startDate, endDate);
  
  if (!data1m || data1m.length < 500) {
    console.log(`❌ Not enough data for ${symbol}`);
    return null;
  }
  
  console.log(`✅ Data fetched: ${data1m.length} candles (1m)\n`);
  
  // Initialize account and trading state
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
  
  // Cooldown tracking
  let consecutiveLosses = 0;
  let cooldownUntil = null;
  let dailyLoss = 0;
  let dailyLossResetTime = null;
  let totalCooldowns = 0;
  let lastLossDate = null; // Track date of last loss
  
  // Entry confirmation tracking
  let pendingSignal = null;
  let signalConfirmationCount = 0;
  
  // Helper function to get timestamp
  const getTimestamp = (time) => {
    if (!time) return Date.now();
    return typeof time === 'number' ? time : new Date(time).getTime();
  };
  
  // Start backtest loop
  for (let i = 250; i < data1m.length; i++) {
    const candle = data1m[i];
    const currentPrice = candle.close;
    const candleTime = getTimestamp(candle.time);
    
    // === CHECK COOLDOWN STATUS ===
    if (cooldownUntil && candleTime < cooldownUntil.getTime()) {
      // Still in cooldown, skip entry signals
      continue;
    } else if (cooldownUntil && candleTime >= cooldownUntil.getTime()) {
      // Cooldown period ended
      console.log(`✅ Cooldown ended at ${new Date(candleTime).toISOString()}`);
      cooldownUntil = null;
      consecutiveLosses = 0;
      dailyLoss = 0;
    }
    
    // === RESET DAILY LOSS COUNTER (every 24 hours) ===
    if (!dailyLossResetTime) {
      dailyLossResetTime = candleTime;
    }
    const hoursSinceReset = (candleTime - dailyLossResetTime) / (1000 * 60 * 60);
    if (hoursSinceReset >= 24) {
      dailyLoss = 0;
      dailyLossResetTime = candleTime;
    }
    
    // === MANAGE EXISTING POSITION ===
    if (inPosition) {
      // Calculate current P&L
      const priceChange = position.type === 'BUY' ?
        (currentPrice - position.entryPrice) :
        (position.entryPrice - currentPrice);
      const unrealizedPnL = position.size * priceChange;
      const changePct = priceChange / position.entryPrice;
      
      account.updateUnrealizedPnL(unrealizedPnL);
      
      // === TRAILING STOP PROFIT (Lock gains) ===
      if (!trailingProfitActive && changePct >= CONFIG.TRAIL_PROFIT_ACTIVATE) {
        trailingProfitActive = true;
        highestProfit = changePct;
        trailingSL = position.type === 'BUY' ?
          currentPrice * (1 - CONFIG.TRAIL_PROFIT_DISTANCE) :
          currentPrice * (1 + CONFIG.TRAIL_PROFIT_DISTANCE);
      }
      
      if (trailingProfitActive) {
        if (changePct > highestProfit) {
          highestProfit = changePct;
          trailingSL = position.type === 'BUY' ?
            currentPrice * (1 - CONFIG.TRAIL_PROFIT_DISTANCE) :
            currentPrice * (1 + CONFIG.TRAIL_PROFIT_DISTANCE);
        }
        
        const hitTrailingSL = position.type === 'BUY' ?
          currentPrice <= trailingSL :
          currentPrice >= trailingSL;
        
        if (hitTrailingSL) {
          const exitPriceChange = position.type === 'BUY' ?
            (trailingSL - position.entryPrice) :
            (position.entryPrice - trailingSL);
          const realizedPnL = position.size * exitPriceChange;
          
          // Fixed Dollar System: Cap profit at targetProfit if exceeded
          const finalPnL = Math.min(realizedPnL, position.targetProfit);
          
          account.closePosition(position.marginUsed, finalPnL);
          
          trades.push({
            ...position,
            exitPrice: trailingSL,
            exitTime: candle.time,
            pnl: finalPnL,
            pnlPct: (finalPnL / account.balance) * 100,
            exitType: 'TRAILING_TP'
          });
          
          // === RESET CONSECUTIVE LOSSES on profitable exit ===
          if (finalPnL > 0) {
            consecutiveLosses = 0;
          }
          
          inPosition = false;
          trailingProfitActive = false;
          trailingLossActive = false;
          continue;
        }
      }
      
      // === TRAILING STOP LOSS (Cut losses early) ===
      if (!trailingLossActive && changePct <= CONFIG.TRAIL_LOSS_ACTIVATE) {
        trailingLossActive = true;
        lowestLoss = changePct;
        position.stopLoss = position.type === 'BUY' ?
          currentPrice * (1 - CONFIG.TRAIL_LOSS_DISTANCE) :
          currentPrice * (1 + CONFIG.TRAIL_LOSS_DISTANCE);
      }
      
      if (trailingLossActive && !trailingProfitActive) {
        if (changePct < lowestLoss) {
          lowestLoss = changePct;
          position.stopLoss = position.type === 'BUY' ?
            currentPrice * (1 - CONFIG.TRAIL_LOSS_DISTANCE) :
            currentPrice * (1 + CONFIG.TRAIL_LOSS_DISTANCE);
        }
      }
      
      // === EMERGENCY EXIT: Force close if loss exceeds -4% ===
      if (changePct <= -CONFIG.EMERGENCY_EXIT_PCT) {
        const emergencyExitPrice = position.type === 'BUY' ?
          position.entryPrice * (1 - CONFIG.EMERGENCY_EXIT_PCT) :
          position.entryPrice * (1 + CONFIG.EMERGENCY_EXIT_PCT);
        const exitPriceChange = position.type === 'BUY' ?
          (emergencyExitPrice - position.entryPrice) :
          (position.entryPrice - emergencyExitPrice);
        const realizedPnL = position.size * exitPriceChange;
        
        // Fixed Dollar System: Cap at targetLoss
        const finalPnL = Math.max(realizedPnL, -position.targetLoss);
        
        account.closePosition(position.marginUsed, finalPnL);
        
        trades.push({
          ...position,
          exitPrice: emergencyExitPrice,
          exitTime: candle.time,
          pnl: finalPnL,
          pnlPct: (finalPnL / account.balance) * 100,
          exitType: 'EMERGENCY_EXIT'
        });
        
        // === COOLDOWN LOGIC: Track consecutive losses WITHIN same day ===
        const currentDate = new Date(getTimestamp(candle.time)).toDateString();
        
        // Reset consecutive losses if loss happened on different day
        if (lastLossDate && lastLossDate !== currentDate) {
          consecutiveLosses = 0;
        }
        
        consecutiveLosses++;
        lastLossDate = currentDate;
        dailyLoss += Math.abs(finalPnL);
        
        // Trigger cooldown ONLY if 2 consecutive losses WITHIN same day
        if (consecutiveLosses >= CONFIG.MAX_CONSECUTIVE_LOSSES && lastLossDate === currentDate) {
          const currentTime = getTimestamp(candle.time);
          cooldownUntil = new Date(currentTime + CONFIG.COOLDOWN_PERIOD_HOURS * 60 * 60 * 1000);
          totalCooldowns++;
          try {
            console.log(`⏸️  COOLDOWN TRIGGERED at ${new Date(currentTime).toISOString()}`);
            console.log(`   Reason: ${consecutiveLosses} consecutive losses IN SAME DAY (${currentDate})`);
            console.log(`   Daily loss: $${dailyLoss.toFixed(2)}`);
            console.log(`   Cooldown until: ${cooldownUntil.toISOString()}`);
          } catch (e) {
            console.log(`⏸️  COOLDOWN TRIGGERED (time parsing error)`);
          }
        }
        
        inPosition = false;
        trailingProfitActive = false;
        trailingLossActive = false;
        continue;
      }
      
      // === CHECK STOP LOSS / TAKE PROFIT ===
      const hitSL = position.type === 'BUY' ?
        candle.low <= position.stopLoss :
        candle.high >= position.stopLoss;
      const hitTP = position.type === 'BUY' ?
        candle.high >= position.takeProfit :
        candle.low <= position.takeProfit;
      
      if (hitSL) {
        const exitPriceChange = position.type === 'BUY' ?
          (position.stopLoss - position.entryPrice) :
          (position.entryPrice - position.stopLoss);
        const realizedPnL = position.size * exitPriceChange;
        
        // Fixed Dollar System: Loss capped at exact targetLoss amount
        const finalPnL = Math.max(realizedPnL, -position.targetLoss);
        
        account.closePosition(position.marginUsed, finalPnL);
        
        trades.push({
          ...position,
          exitPrice: position.stopLoss,
          exitTime: candle.time,
          pnl: finalPnL,
          pnlPct: (finalPnL / account.balance) * 100,
          exitType: 'SL'
        });
        
        // === COOLDOWN LOGIC: Track consecutive losses WITHIN same day ===
        const currentDate = new Date(getTimestamp(candle.time)).toDateString();
        
        // Reset consecutive losses if loss happened on different day
        if (lastLossDate && lastLossDate !== currentDate) {
          consecutiveLosses = 0;
        }
        
        consecutiveLosses++;
        lastLossDate = currentDate;
        dailyLoss += Math.abs(finalPnL);
        
        // Trigger cooldown ONLY if 2 consecutive losses WITHIN same day
        if (consecutiveLosses >= CONFIG.MAX_CONSECUTIVE_LOSSES && lastLossDate === currentDate) {
          const currentTime = getTimestamp(candle.time);
          cooldownUntil = new Date(currentTime + CONFIG.COOLDOWN_PERIOD_HOURS * 60 * 60 * 1000);
          totalCooldowns++;
          try {
            console.log(`⏸️  COOLDOWN TRIGGERED at ${new Date(currentTime).toISOString()}`);
            console.log(`   Reason: ${consecutiveLosses} consecutive losses IN SAME DAY (${currentDate})`);
            console.log(`   Daily loss: $${dailyLoss.toFixed(2)}`);
            console.log(`   Cooldown until: ${cooldownUntil.toISOString()}`);
          } catch (e) {
            console.log(`⏸️  COOLDOWN TRIGGERED (time parsing error)`);
          }
        }
        
        inPosition = false;
        trailingProfitActive = false;
        trailingLossActive = false;
      } else if (hitTP) {
        const exitPriceChange = position.type === 'BUY' ?
          (position.takeProfit - position.entryPrice) :
          (position.entryPrice - position.takeProfit);
        const realizedPnL = position.size * exitPriceChange;
        
        // Fixed Dollar System: Profit should match targetProfit
        const finalPnL = Math.min(realizedPnL, position.targetProfit);
        
        account.closePosition(position.marginUsed, finalPnL);
        
        trades.push({
          ...position,
          exitPrice: position.takeProfit,
          exitTime: candle.time,
          pnl: finalPnL,
          pnlPct: (finalPnL / account.balance) * 100,
          exitType: 'TP'
        });
        
        // === RESET CONSECUTIVE LOSSES on winning trade ===
        consecutiveLosses = 0;
        
        inPosition = false;
        trailingProfitActive = false;
        trailingLossActive = false;
      }
      
      continue;
    }
    
    // === LOOK FOR NEW ENTRY ===
    const analysis = analyzeMultiTimeframe(data1m, data3m, data5m, i);
    
    if (analysis.signal === 'BUY' || analysis.signal === 'SELL') {
      // === ENTRY CONFIRMATION: Wait for signal to persist ===
      if (!pendingSignal) {
        // First time seeing this signal, start confirmation
        pendingSignal = {
          type: analysis.signal,
          price: currentPrice,
          time: candle.time,
          confidence: analysis.confidence,
          marketBias: analysis.marketBias
        };
        signalConfirmationCount = 1;
        continue; // Wait for next candle
      }
      
      // Check if signal is still the same
      if (pendingSignal.type === analysis.signal) {
        signalConfirmationCount++;
        
        // Check if we have enough confirmations
        if (signalConfirmationCount < CONFIG.ENTRY_CONFIRMATION_CANDLES) {
          continue; // Keep waiting
        }
        
        // Signal confirmed! Proceed with entry
      } else {
        // Signal changed, reset
        pendingSignal = {
          type: analysis.signal,
          price: currentPrice,
          time: candle.time,
          confidence: analysis.confidence,
          marketBias: analysis.marketBias
        };
        signalConfirmationCount = 1;
        continue;
      }
      
      // === FIXED DOLLAR TP/SL POSITION SIZING ===
      // Calculate exact dollar amounts for profit/loss
      const targetProfit = account.balance * CONFIG.TARGET_PROFIT_PCT; // e.g., $200 on $10k
      const targetLoss = account.balance * CONFIG.RISK_PER_TRADE;       // e.g., $200 on $10k
      
      // Use MAX_PRICE_MOVE_PCT to calculate position size
      // This ensures position size is appropriate for exact dollar TP/SL
      const priceMoveDollar = currentPrice * CONFIG.MAX_PRICE_MOVE_PCT; // e.g., 1.5% move
      
      // Position size calculation for fixed dollar loss
      // Size = Target Loss / Price Move
      // Example: $200 / ($68,000 × 1.5%) = $200 / $1,020 = 0.196 BTC
      const positionSize = targetLoss / priceMoveDollar;
      
      // Calculate notional value and margin
      const notionalValue = positionSize * currentPrice;
      const marginRequired = notionalValue / CONFIG.LEVERAGE;
      
      // Check if we have enough margin
      if (!account.canOpenPosition(marginRequired)) {
        continue; // Skip this trade
      }
      
      // Calculate exact SL and TP prices for fixed dollar amounts
      // SL Distance = Target Loss / Position Size
      // TP Distance = Target Profit / Position Size
      const slDistance = targetLoss / positionSize;
      const tpDistance = targetProfit / positionSize;
      
      const stopLoss = analysis.signal === 'BUY' ?
        currentPrice - slDistance :
        currentPrice + slDistance;
      
      const takeProfit = analysis.signal === 'BUY' ?
        currentPrice + tpDistance :
        currentPrice - tpDistance;
      
      // Open position
      position = {
        symbol,
        type: analysis.signal,
        entryPrice: currentPrice,
        entryTime: candle.time,
        size: positionSize,
        notionalValue,
        marginUsed: marginRequired,
        leverage: CONFIG.LEVERAGE,
        stopLoss,
        takeProfit,
        targetProfit,        // Fixed dollar profit target
        targetLoss,          // Fixed dollar loss limit
        confidence: analysis.confidence
      };
      
      account.openPosition(marginRequired);
      inPosition = true;
      trailingProfitActive = false;
      trailingLossActive = false;
      highestProfit = 0;
      lowestLoss = 0;
      
      // Reset pending signal after entry
      pendingSignal = null;
      signalConfirmationCount = 0;
    } else {
      // No signal or signal changed to HOLD, reset pending
      if (pendingSignal && analysis.signal === 'HOLD') {
        pendingSignal = null;
        signalConfirmationCount = 0;
      }
    }
  }
  
  // Close any remaining position at the end
  if (inPosition) {
    const lastPrice = data1m[data1m.length - 1].close;
    const exitPriceChange = position.type === 'BUY' ?
      (lastPrice - position.entryPrice) :
      (position.entryPrice - lastPrice);
    let realizedPnL = position.size * exitPriceChange;
    
    // Cap loss at max risk amount ($200)
    const maxLoss = -CONFIG.INITIAL_BALANCE * CONFIG.RISK_PER_TRADE;
    if (realizedPnL < maxLoss) {
      realizedPnL = maxLoss;
    }
    
    account.closePosition(position.marginUsed, realizedPnL);
    
    trades.push({
      ...position,
      exitPrice: lastPrice,
      exitTime: data1m[data1m.length - 1].time,
      pnl: realizedPnL,
      pnlPct: (realizedPnL / initialBalance) * 100,
      exitType: 'END'
    });
  }
  
  // Calculate metrics
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl <= 0);
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const totalProfit = account.balance - initialBalance;
  const roi = (totalProfit / initialBalance) * 100;
  
  const totalWinAmount = wins.reduce((sum, t) => sum + t.pnl, 0);
  const totalLossAmount = losses.reduce((sum, t) => sum + t.pnl, 0);
  const avgWin = wins.length > 0 ? totalWinAmount / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLossAmount / losses.length : 0;
  const profitFactor = Math.abs(totalLossAmount) > 0 ? totalWinAmount / Math.abs(totalLossAmount) : 0;
  
  // Print results
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 ${symbol} RESULTS`);
  console.log(`${'='.repeat(70)}\n`);
  
  console.log(`💰 ACCOUNT SUMMARY:`);
  console.log(`   Initial Balance: $${initialBalance.toFixed(2)}`);
  console.log(`   Final Balance: $${account.balance.toFixed(2)}`);
  console.log(`   Total Profit: $${totalProfit.toFixed(2)}`);
  console.log(`   ROI: ${roi.toFixed(2)}%\n`);
  
  console.log(`📈 TRADE STATISTICS:`);
  console.log(`   Total Trades: ${trades.length}`);
  console.log(`   Wins: ${wins.length} (${winRate.toFixed(2)}%)`);
  console.log(`   Losses: ${losses.length}`);
  console.log(`   Cooldowns Triggered: ${totalCooldowns}\n`);
  
  console.log(`💵 PROFIT/LOSS BREAKDOWN:`);
  console.log(`   Total Wins: $${totalWinAmount.toFixed(2)}`);
  console.log(`   Average Win: $${avgWin.toFixed(2)}`);
  console.log(`   Total Losses: $${totalLossAmount.toFixed(2)}`);
  console.log(`   Average Loss: $${avgLoss.toFixed(2)}`);
  console.log(`   Profit Factor: ${profitFactor.toFixed(2)}\n`);
  
  // Show top trades
  const sortedWins = wins.sort((a, b) => b.pnl - a.pnl).slice(0, 5);
  const sortedLosses = losses.sort((a, b) => a.pnl - b.pnl).slice(0, 5);
  
  if (sortedWins.length > 0) {
    console.log(`🏆 TOP 5 WINS:`);
    sortedWins.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.type}: $${t.pnl.toFixed(2)} (${t.pnlPct.toFixed(2)}%) - ${t.exitType}`);
    });
    console.log();
  }
  
  if (sortedLosses.length > 0) {
    console.log(`📉 TOP 5 LOSSES:`);
    sortedLosses.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.type}: $${t.pnl.toFixed(2)} (${t.pnlPct.toFixed(2)}%) - ${t.exitType}`);
    });
    console.log();
  }
  
  // Check for --verbose flag to show ALL trades
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  
  if (verbose && trades.length > 0) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📋 DETAILED TRADE LOG (ALL ${trades.length} TRADES)`);
    console.log(`${'='.repeat(70)}\n`);
    
    trades.forEach((trade, index) => {
      const icon = trade.pnl > 0 ? '✅' : '❌';
      let timeStr = 'N/A';
      try {
        if (trade.entryTime) {
          const date = typeof trade.entryTime === 'number' ? new Date(trade.entryTime) : trade.entryTime;
          timeStr = date.toISOString().replace('T', ' ').substring(0, 19);
        }
      } catch (e) {
        timeStr = String(trade.entryTime || 'N/A');
      }
      
      console.log(`${icon} Trade #${index + 1} - ${trade.type}`);
      console.log(`   Time: ${timeStr}`);
      console.log(`   Entry: $${trade.entryPrice.toFixed(2)}`);
      console.log(`   Exit:  $${trade.exitPrice.toFixed(2)}`);
      console.log(`   Size: ${trade.size.toFixed(6)} BTC (Notional: $${(trade.notionalValue || trade.size * trade.entryPrice).toFixed(2)})`);
      console.log(`   PnL: $${trade.pnl.toFixed(2)} (${trade.pnlPct.toFixed(2)}%)`);
      console.log(`   Exit Type: ${trade.exitType}`);
      console.log('');
    });
    
    console.log(`${'='.repeat(70)}\n`);
  }
  
  return {
    symbol,
    trades,
    finalBalance: account.balance,
    profit: totalProfit,
    roi,
    winRate,
    profitFactor,
    avgWin,
    avgLoss
  };
}

// ==================== MAIN EXECUTION ====================

async function main() {
  // Parse arguments first
  const args = process.argv.slice(2);
  const periodArg = args.find(arg => arg.startsWith('--period='));
  const period = periodArg ? periodArg.split('=')[1] : '1m';
  
  const symbolArg = args.find(arg => arg.startsWith('--symbol='));
  const symbol = symbolArg ? symbolArg.split('=')[1] : 'BTCUSDT';
  
  const balanceArg = args.find(arg => arg.startsWith('--balance='));
  const initialBalance = balanceArg ? parseFloat(balanceArg.split('=')[1]) : CONFIG.INITIAL_BALANCE;
  
  // Display configuration with actual balance
  console.log('\n' + '='.repeat(70));
  console.log('🚀 FUTURES SCALPER BACKTEST ENGINE');
  console.log('='.repeat(70));
  console.log(`\n⚙️  CONFIGURATION:`);
  console.log(`   Initial Balance: $${initialBalance}`);
  console.log(`   Risk per Trade: ${CONFIG.RISK_PER_TRADE * 100}%`);
  console.log(`   Leverage: ${CONFIG.LEVERAGE}x`);
  console.log(`   Target Profit/Loss: ${CONFIG.TARGET_PROFIT_PCT * 100}% of balance ($${initialBalance * CONFIG.TARGET_PROFIT_PCT})`);
  console.log(`   Max Price Move: ${(CONFIG.MAX_PRICE_MOVE_PCT * 100).toFixed(2)}%`);
  console.log(`   Estimated Margin: ~${((CONFIG.TARGET_PROFIT_PCT / CONFIG.MAX_PRICE_MOVE_PCT) / CONFIG.LEVERAGE * 100).toFixed(1)}% per trade`);
  console.log(`   Strategy: Triple TF + Dual Trailing + Fixed Dollar TP/SL\n`);
  
  // Run backtest
  const result = await backtestFuturesPair(symbol, period, initialBalance);
  
  if (result) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅ Backtest completed successfully!`);
    console.log(`${'='.repeat(70)}\n`);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { backtestFuturesPair, FuturesAccount };
