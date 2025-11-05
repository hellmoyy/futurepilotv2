/**
 * 🧮 TECHNICAL INDICATORS LIBRARY
 * 
 * Pure functions for calculating technical indicators
 * Used by Signal Engine for market analysis
 */

import { Candle } from './types';

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  
  return ema;
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) return 50;
  
  const prices = candles.map(c => c.close);
  const changes: number[] = [];
  
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

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  candles: Candle[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { value: number; signal: number; histogram: number } | null {
  if (candles.length < slowPeriod) {
    return { value: 0, signal: 0, histogram: 0 };
  }
  
  const prices = candles.map(c => c.close);
  const emaFast = calculateEMA(prices, fastPeriod);
  const emaSlow = calculateEMA(prices, slowPeriod);
  
  if (!emaFast || !emaSlow) {
    return { value: 0, signal: 0, histogram: 0 };
  }
  
  const macdLine = emaFast - emaSlow;
  
  // For scalping, we use histogram (MACD direction) directly
  const histogram = macdLine;
  
  return {
    value: macdLine,
    signal: 0, // Simplified for speed
    histogram,
  };
}

/**
 * Calculate ADX (Average Directional Index)
 * Measures trend strength
 */
export function calculateADX(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) return 25;
  
  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevHigh = candles[i - 1].high;
    const prevLow = candles[i - 1].low;
    const prevClose = candles[i - 1].close;
    
    // True Range
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    tr.push(Math.max(tr1, tr2, tr3));
    
    // Directional Movement
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

/**
 * Calculate ATR (Average True Range)
 * Measures volatility
 */
export function calculateATR(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) return 0;
  
  const tr: number[] = [];
  
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    
    tr.push(Math.max(tr1, tr2, tr3));
  }
  
  return tr.slice(-period).reduce((a, b) => a + b, 0) / period;
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number; middle: number; lower: number } | null {
  if (prices.length < period) return null;
  
  const sma = calculateSMA(prices, period);
  if (!sma) return null;
  
  const slice = prices.slice(-period);
  const variance = slice.reduce((sum, price) => {
    return sum + Math.pow(price - sma, 2);
  }, 0) / period;
  
  const std = Math.sqrt(variance);
  
  return {
    upper: sma + (std * stdDev),
    middle: sma,
    lower: sma - (std * stdDev),
  };
}

/**
 * Calculate Volume Ratio
 * Current volume vs average volume
 */
export function calculateVolumeRatio(
  candles: Candle[],
  period: number = 20
): number {
  if (candles.length < period) return 1;
  
  const volumes = candles.map(c => c.volume);
  const avgVolume = calculateSMA(volumes, period);
  const currentVolume = volumes[volumes.length - 1];
  
  if (!avgVolume || avgVolume === 0) return 1;
  
  return currentVolume / avgVolume;
}

/**
 * Detect Market Regime
 * Returns: BULLISH, BEARISH, NEUTRAL, RANGING, VOLATILE
 */
export function detectMarketRegime(
  candles: Candle[],
  lookbackPeriod: number = 100,
  threshold: number = 0.02
): {
  regime: string;
  strength: number;
  volatility: number;
} {
  if (candles.length < lookbackPeriod) {
    return { regime: 'NEUTRAL', strength: 0, volatility: 0 };
  }
  
  const slice = candles.slice(-lookbackPeriod);
  const startPrice = slice[0].close;
  const endPrice = slice[slice.length - 1].close;
  const priceChange = (endPrice - startPrice) / startPrice;
  
  // Calculate volatility (ATR %)
  const atr = calculateATR(slice, 14);
  const volatility = (atr / endPrice) * 100;
  
  // High volatility = ranging market
  if (volatility > 1.5) {
    return { regime: 'VOLATILE', strength: volatility, volatility };
  }
  
  // Low volatility = ranging market
  if (Math.abs(priceChange) < 0.01) {
    return { regime: 'RANGING', strength: 0, volatility };
  }
  
  // Trending markets
  if (priceChange > threshold) {
    return {
      regime: 'BULLISH',
      strength: priceChange * 100,
      volatility,
    };
  } else if (priceChange < -threshold) {
    return {
      regime: 'BEARISH',
      strength: Math.abs(priceChange) * 100,
      volatility,
    };
  }
  
  return { regime: 'NEUTRAL', strength: 0, volatility };
}

/**
 * Check if current time is within trading hours
 * Avoid low liquidity periods
 */
export function checkTradingHours(): { shouldTrade: boolean; reason: string } {
  const now = new Date();
  const hour = now.getUTCHours();
  const day = now.getUTCDay();
  
  // Weekend (crypto trades 24/7, but lower liquidity)
  if (day === 0 || day === 6) {
    return {
      shouldTrade: false,
      reason: 'Weekend - Lower liquidity',
    };
  }
  
  // Late night UTC (low activity)
  if (hour >= 0 && hour < 6) {
    return {
      shouldTrade: false,
      reason: 'Low liquidity hours (00:00-06:00 UTC)',
    };
  }
  
  return {
    shouldTrade: true,
    reason: 'Trading hours active',
  };
}

/**
 * Calculate position size based on risk
 */
export function calculatePositionSize(
  balance: number,
  riskPercent: number,
  stopLossPercent: number,
  leverage: number
): {
  size: number;
  marginRequired: number;
  notionalValue: number;
} {
  const riskAmount = balance * riskPercent;
  const priceMove = stopLossPercent;
  const size = riskAmount / priceMove;
  
  const notionalValue = size;
  const marginRequired = notionalValue / leverage;
  
  return {
    size,
    marginRequired,
    notionalValue,
  };
}
