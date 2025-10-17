/**
 * 📖 EXAMPLE: How to Use Trading Algorithms Config
 * 
 * File ini menunjukkan cara menggunakan centralized config
 * di trading strategy Anda.
 */

import TradingConfig from '@/config/trading-algorithms';

// ============================================================================
// EXAMPLE 1: Get Active Strategy Settings
// ============================================================================

export function getStrategySettings() {
  const strategy = TradingConfig.getActiveStrategy();
  
  console.log('📊 Active Strategy:', strategy.name);
  console.log('💰 Max Position Size:', strategy.maxPositionSize + '%');
  console.log('📈 Max Leverage:', strategy.maxLeverage + 'x');
  console.log('🛑 Stop Loss:', strategy.stopLossPercent + '%');
  console.log('🎯 Take Profit:', strategy.takeProfitPercent + '%');
  
  return strategy;
}

// ============================================================================
// EXAMPLE 2: Get Indicator Settings
// ============================================================================

export function calculateIndicators(prices: number[]) {
  const indicators = TradingConfig.getIndicators();
  
  // Calculate RSI
  if (indicators.rsi.enabled) {
    const rsi = calculateRSI(prices, indicators.rsi.period);
    
    // Check if overbought/oversold
    if (rsi > indicators.rsi.overbought) {
      console.log('⚠️ RSI Overbought:', rsi);
    } else if (rsi < indicators.rsi.oversold) {
      console.log('💡 RSI Oversold:', rsi);
    }
  }
  
  // Calculate MACD
  if (indicators.macd.enabled) {
    const macd = calculateMACD(
      prices,
      indicators.macd.fastPeriod,
      indicators.macd.slowPeriod,
      indicators.macd.signalPeriod
    );
    
    console.log('📈 MACD:', macd);
  }
  
  // Calculate EMA
  if (indicators.ema.enabled) {
    const emaShort = calculateEMA(prices, indicators.ema.shortPeriod);
    const emaLong = calculateEMA(prices, indicators.ema.longPeriod);
    
    // Check for crossover
    if (emaShort > emaLong) {
      console.log('🟢 Bullish EMA Crossover');
    } else {
      console.log('🔴 Bearish EMA Crossover');
    }
  }
}

// ============================================================================
// EXAMPLE 3: Generate Trading Signal with Config
// ============================================================================

export interface TradingSignal {
  action: 'LONG' | 'SHORT' | 'HOLD';
  confidence: number;
  reason: string;
  indicators: {
    rsi?: number;
    macd?: any;
    ema?: any;
  };
}

export function generateSignal(prices: number[]): TradingSignal {
  const indicators = TradingConfig.getIndicators();
  const signalRules = TradingConfig.getSignalRules();
  const strategy = TradingConfig.getActiveStrategy();
  
  let confidence = 0;
  const reasons: string[] = [];
  const indicatorValues: any = {};
  
  // Calculate RSI
  const rsi = calculateRSI(prices, indicators.rsi.period);
  indicatorValues.rsi = rsi;
  
  // Calculate MACD
  const macd = calculateMACD(
    prices,
    indicators.macd.fastPeriod,
    indicators.macd.slowPeriod,
    indicators.macd.signalPeriod
  );
  indicatorValues.macd = macd;
  
  // Calculate EMA
  const emaShort = calculateEMA(prices, indicators.ema.shortPeriod);
  const emaLong = calculateEMA(prices, indicators.ema.longPeriod);
  indicatorValues.ema = { short: emaShort, long: emaLong };
  
  const currentPrice = prices[prices.length - 1];
  
  // Check for LONG signal
  let longScore = 0;
  let shortScore = 0;
  
  // RSI Check
  if (rsi < indicators.rsi.oversold) {
    longScore += signalRules.confidenceWeights.rsi;
    reasons.push('RSI Oversold (' + rsi.toFixed(2) + ')');
  } else if (rsi > indicators.rsi.overbought) {
    shortScore += signalRules.confidenceWeights.rsi;
    reasons.push('RSI Overbought (' + rsi.toFixed(2) + ')');
  }
  
  // MACD Check
  if (macd.histogram > 0) {
    longScore += signalRules.confidenceWeights.macd;
    reasons.push('MACD Bullish');
  } else {
    shortScore += signalRules.confidenceWeights.macd;
    reasons.push('MACD Bearish');
  }
  
  // EMA Check
  if (emaShort > emaLong) {
    longScore += signalRules.confidenceWeights.ema;
    reasons.push('EMA Bullish Crossover');
  } else {
    shortScore += signalRules.confidenceWeights.ema;
    reasons.push('EMA Bearish Crossover');
  }
  
  // Determine action
  let action: 'LONG' | 'SHORT' | 'HOLD' = 'HOLD';
  
  if (longScore > shortScore && longScore >= strategy.minConfidenceScore) {
    action = 'LONG';
    confidence = longScore;
  } else if (shortScore > longScore && shortScore >= strategy.minConfidenceScore) {
    if (strategy.allowShortPositions) {
      action = 'SHORT';
      confidence = shortScore;
    }
  }
  
  return {
    action,
    confidence,
    reason: reasons.join(', '),
    indicators: indicatorValues,
  };
}

// ============================================================================
// EXAMPLE 4: Execute Trade with Safety Limits
// ============================================================================

export async function executeTrade(signal: TradingSignal, balance: number) {
  const strategy = TradingConfig.getActiveStrategy();
  const safetyLimits = TradingConfig.getSafetyLimits();
  
  // Check if trading is allowed
  if (!TradingConfig.isTradingAllowed()) {
    console.log('⏰ Trading not allowed at this time');
    return null;
  }
  
  // Validate settings
  const validation = TradingConfig.validateSettings();
  if (!validation.valid) {
    console.error('❌ Invalid settings:', validation.errors);
    return null;
  }
  
  // Check confidence threshold
  if (signal.confidence < strategy.minConfidenceScore) {
    console.log('⚠️ Signal confidence too low:', signal.confidence);
    return null;
  }
  
  // Calculate position size
  const maxPositionValue = balance * (strategy.maxPositionSize / 100);
  const positionSize = Math.min(maxPositionValue, safetyLimits.maxPositionValue);
  
  // Check leverage limit
  const leverage = Math.min(strategy.maxLeverage, safetyLimits.absoluteMaxLeverage);
  
  console.log('🎯 Trade Details:');
  console.log('   Action:', signal.action);
  console.log('   Confidence:', signal.confidence + '%');
  console.log('   Position Size: $' + positionSize);
  console.log('   Leverage:', leverage + 'x');
  console.log('   Stop Loss:', strategy.stopLossPercent + '%');
  console.log('   Take Profit:', strategy.takeProfitPercent + '%');
  console.log('   Reason:', signal.reason);
  
  // Here you would execute the actual trade via Binance API
  // This is just an example structure
  
  return {
    signal,
    positionSize,
    leverage,
    stopLoss: strategy.stopLossPercent,
    takeProfit: strategy.takeProfitPercent,
  };
}

// ============================================================================
// EXAMPLE 5: Real-time Strategy Updates
// ============================================================================

/**
 * Monitor strategy performance and adjust settings dynamically
 */
export function monitorAndAdjust(
  trades: any[],
  currentDrawdown: number
) {
  const strategy = TradingConfig.getActiveStrategy();
  const safetyLimits = TradingConfig.getSafetyLimits();
  
  // Check daily loss limit
  const todayTrades = trades.filter(
    t => new Date(t.timestamp).toDateString() === new Date().toDateString()
  );
  
  const todayLoss = todayTrades
    .filter(t => t.pnl < 0)
    .reduce((sum, t) => sum + Math.abs(t.pnl), 0);
  
  const dailyLossPercent = (todayLoss / trades[0].balance) * 100;
  
  if (dailyLossPercent >= safetyLimits.maxDailyLossPercent) {
    console.log('🚨 DAILY LOSS LIMIT REACHED!');
    console.log('   Loss:', dailyLossPercent.toFixed(2) + '%');
    console.log('   Action: STOP TRADING FOR TODAY');
    return { action: 'STOP', reason: 'Daily loss limit' };
  }
  
  // Check drawdown limit
  if (currentDrawdown >= safetyLimits.maxDrawdownPercent) {
    console.log('🚨 MAX DRAWDOWN REACHED!');
    console.log('   Drawdown:', currentDrawdown.toFixed(2) + '%');
    console.log('   Action: REDUCE POSITION SIZE');
    return { action: 'REDUCE', reason: 'Max drawdown' };
  }
  
  // Check consecutive losses
  const recentTrades = trades.slice(-5);
  const consecutiveLosses = recentTrades
    .reverse()
    .findIndex(t => t.pnl >= 0);
  
  if (consecutiveLosses >= safetyLimits.maxConsecutiveLosses) {
    console.log('⚠️ CIRCUIT BREAKER TRIGGERED!');
    console.log('   Consecutive Losses:', consecutiveLosses);
    console.log('   Action: COOLDOWN FOR', safetyLimits.circuitBreakerCooldown, 'MINUTES');
    return { 
      action: 'COOLDOWN', 
      reason: 'Circuit breaker',
      duration: safetyLimits.circuitBreakerCooldown 
    };
  }
  
  return { action: 'CONTINUE', reason: 'All checks passed' };
}

// ============================================================================
// HELPER FUNCTIONS (Simplified Examples)
// ============================================================================

function calculateRSI(prices: number[], period: number = 14): number {
  // Simplified RSI calculation
  // In production, use technical analysis library like 'technicalindicators'
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return rsi;
}

function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number; signal: number; histogram: number } {
  // Simplified MACD calculation
  const emaFast = calculateEMA(prices, fastPeriod);
  const emaSlow = calculateEMA(prices, slowPeriod);
  const macd = emaFast - emaSlow;
  
  // For signal line, you'd calculate EMA of MACD values
  // This is simplified
  const signal = macd * 0.9; // Simplified
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
}

function calculateEMA(prices: number[], period: number): number {
  // Simplified EMA calculation
  if (prices.length < period) return prices[prices.length - 1];
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

export async function runTradingBot() {
  console.log('🤖 Starting Trading Bot with Config');
  
  // 1. Load strategy
  const strategy = getStrategySettings();
  
  // 2. Get market data (example prices)
  const prices = [
    67000, 67100, 67050, 67200, 67150, 67300, 67250, 67400,
    67350, 67500, 67450, 67600, 67550, 67700, 67650, 67800
  ];
  
  // 3. Calculate indicators
  calculateIndicators(prices);
  
  // 4. Generate signal
  const signal = generateSignal(prices);
  console.log('\n📊 Trading Signal:', signal);
  
  // 5. Execute trade (if signal is valid)
  if (signal.action !== 'HOLD') {
    const balance = 10000; // $10,000 example balance
    const trade = await executeTrade(signal, balance);
    console.log('\n✅ Trade Executed:', trade);
  } else {
    console.log('\n⏸️  No trade signal');
  }
  
  // 6. Monitor and adjust
  const mockTrades = [
    { timestamp: new Date(), pnl: 100, balance: 10000 },
    { timestamp: new Date(), pnl: -50, balance: 10050 },
  ];
  const monitoring = monitorAndAdjust(mockTrades, 2.5);
  console.log('\n📈 Monitoring Result:', monitoring);
}

// Uncomment to test:
// runTradingBot();
