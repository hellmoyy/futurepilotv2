/**
 * 📊 TECHNICAL ANALYZER
 * 
 * Core engine untuk calculate technical indicators.
 * Menggunakan konfigurasi dari trading-algorithms.ts
 * 
 * Indicators:
 * - RSI (Relative Strength Index)
 * - MACD (Moving Average Convergence Divergence)
 * - EMA (Exponential Moving Average)
 * - Bollinger Bands
 * - Volume Analysis
 * - ATR (Average True Range)
 */

import TradingConfig from '@/config/trading-algorithms';

// ============================================================================
// 📊 INTERFACES
// ============================================================================

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorResult {
  rsi: {
    value: number;
    signal: 'overbought' | 'oversold' | 'neutral';
    extremeOverbought: boolean;
    extremeOversold: boolean;
  };
  macd: {
    macd: number;
    signal: number;
    histogram: number;
    bullish: boolean;
    bearish: boolean;
    crossover: 'bullish' | 'bearish' | 'none';
  };
  ema: {
    short: number;
    long: number;
    trend: 'bullish' | 'bearish' | 'neutral';
    crossover: 'golden' | 'death' | 'none';
    distance: number; // % distance between EMAs
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    position: 'above_upper' | 'at_upper' | 'middle' | 'at_lower' | 'below_lower';
    bandwidth: number;
    squeeze: boolean; // Low volatility
  };
  volume: {
    current: number;
    average: number;
    surge: boolean;
    ratio: number; // current / average
  };
  atr: {
    value: number;
    volatility: 'low' | 'normal' | 'high';
    percentOfPrice: number;
  };
}

export interface MarketData {
  symbol: string;
  currentPrice: number;
  priceChange24h: number;
  volume24h: number;
  timestamp: number;
}

// ============================================================================
// 🔧 TECHNICAL ANALYZER CLASS
// ============================================================================

export class TechnicalAnalyzer {
  private config = TradingConfig.getIndicators();

  /**
   * Analyze market data and calculate all indicators
   */
  public analyze(candles: Candle[]): IndicatorResult {
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);

    return {
      rsi: this.calculateRSI(closes),
      macd: this.calculateMACD(closes),
      ema: this.calculateEMA(closes),
      bollingerBands: this.calculateBollingerBands(closes),
      volume: this.calculateVolume(volumes),
      atr: this.calculateATR(highs, lows, closes),
    };
  }

  // ==========================================================================
  // RSI (Relative Strength Index)
  // ==========================================================================

  private calculateRSI(prices: number[]): IndicatorResult['rsi'] {
    const { period, overbought, oversold, extremeOverbought, extremeOversold } = this.config.rsi;

    if (prices.length < period + 1) {
      return {
        value: 50,
        signal: 'neutral',
        extremeOverbought: false,
        extremeOversold: false,
      };
    }

    // Calculate price changes
    const changes: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    // Calculate average gains and losses
    let avgGain = 0;
    let avgLoss = 0;

    // First average
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) {
        avgGain += changes[i];
      } else {
        avgLoss += Math.abs(changes[i]);
      }
    }
    avgGain /= period;
    avgLoss /= period;

    // Smoothed averages
    for (let i = period; i < changes.length; i++) {
      if (changes[i] > 0) {
        avgGain = (avgGain * (period - 1) + changes[i]) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period;
      }
    }

    // Calculate RSI
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    // Determine signal
    let signal: 'overbought' | 'oversold' | 'neutral' = 'neutral';
    if (rsi > overbought) signal = 'overbought';
    if (rsi < oversold) signal = 'oversold';

    return {
      value: rsi,
      signal,
      extremeOverbought: rsi > extremeOverbought,
      extremeOversold: rsi < extremeOversold,
    };
  }

  // ==========================================================================
  // MACD (Moving Average Convergence Divergence)
  // ==========================================================================

  private calculateMACD(prices: number[]): IndicatorResult['macd'] {
    const { fastPeriod, slowPeriod, signalPeriod } = this.config.macd;

    const emaFast = this.calculateEMAValue(prices, fastPeriod);
    const emaSlow = this.calculateEMAValue(prices, slowPeriod);
    const macdLine = emaFast - emaSlow;

    // Calculate signal line (EMA of MACD)
    // For simplicity, using a smoothed version
    const signalLine = macdLine * 0.9; // Simplified

    const histogram = macdLine - signalLine;

    // Determine trend
    const bullish = histogram > 0;
    const bearish = histogram < 0;

    // Detect crossover (simplified - would need previous values in production)
    let crossover: 'bullish' | 'bearish' | 'none' = 'none';
    if (Math.abs(histogram) < 0.0001) {
      crossover = bullish ? 'bullish' : 'bearish';
    }

    return {
      macd: macdLine,
      signal: signalLine,
      histogram,
      bullish,
      bearish,
      crossover,
    };
  }

  // ==========================================================================
  // EMA (Exponential Moving Average)
  // ==========================================================================

  private calculateEMA(prices: number[]): IndicatorResult['ema'] {
    const { shortPeriod, longPeriod, minCrossoverGap } = this.config.ema;

    const emaShort = this.calculateEMAValue(prices, shortPeriod);
    const emaLong = this.calculateEMAValue(prices, longPeriod);

    const distance = ((emaShort - emaLong) / emaLong) * 100;

    // Determine trend
    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (emaShort > emaLong && Math.abs(distance) > minCrossoverGap * 100) {
      trend = 'bullish';
    } else if (emaShort < emaLong && Math.abs(distance) > minCrossoverGap * 100) {
      trend = 'bearish';
    }

    // Detect crossover
    let crossover: 'golden' | 'death' | 'none' = 'none';
    if (Math.abs(distance) < minCrossoverGap * 50) {
      crossover = emaShort > emaLong ? 'golden' : 'death';
    }

    return {
      short: emaShort,
      long: emaLong,
      trend,
      crossover,
      distance,
    };
  }

  private calculateEMAValue(prices: number[], period: number): number {
    if (prices.length < period) {
      return prices[prices.length - 1];
    }

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  // ==========================================================================
  // Bollinger Bands
  // ==========================================================================

  private calculateBollingerBands(prices: number[]): IndicatorResult['bollingerBands'] {
    const { period, stdDev } = this.config.bollingerBands;

    if (prices.length < period) {
      const current = prices[prices.length - 1];
      return {
        upper: current * 1.02,
        middle: current,
        lower: current * 0.98,
        position: 'middle',
        bandwidth: 4,
        squeeze: false,
      };
    }

    // Calculate SMA (middle band)
    const recentPrices = prices.slice(-period);
    const sma = recentPrices.reduce((a, b) => a + b, 0) / period;

    // Calculate standard deviation
    const squaredDiffs = recentPrices.map(price => Math.pow(price - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const standardDeviation = Math.sqrt(variance);

    // Calculate bands
    const upper = sma + (standardDeviation * stdDev);
    const lower = sma - (standardDeviation * stdDev);
    const currentPrice = prices[prices.length - 1];

    // Determine position
    let position: IndicatorResult['bollingerBands']['position'] = 'middle';
    const upperThreshold = upper * 0.98;
    const lowerThreshold = lower * 1.02;

    if (currentPrice > upper) position = 'above_upper';
    else if (currentPrice >= upperThreshold) position = 'at_upper';
    else if (currentPrice <= lowerThreshold) position = 'at_lower';
    else if (currentPrice < lower) position = 'below_lower';

    // Calculate bandwidth
    const bandwidth = ((upper - lower) / sma) * 100;

    // Detect squeeze (low volatility)
    const squeeze = bandwidth < 10; // Less than 10%

    return {
      upper,
      middle: sma,
      lower,
      position,
      bandwidth,
      squeeze,
    };
  }

  // ==========================================================================
  // Volume Analysis
  // ==========================================================================

  private calculateVolume(volumes: number[]): IndicatorResult['volume'] {
    const { period, surgeMultiplier } = this.config.volume;

    if (volumes.length < period) {
      return {
        current: volumes[volumes.length - 1] || 0,
        average: volumes[volumes.length - 1] || 0,
        surge: false,
        ratio: 1,
      };
    }

    const recentVolumes = volumes.slice(-period);
    const average = recentVolumes.reduce((a, b) => a + b, 0) / period;
    const current = volumes[volumes.length - 1];
    
    // Prevent NaN: if average is 0 or invalid, return safe defaults
    if (!average || average === 0 || !isFinite(average)) {
      return {
        current: current || 0,
        average: 0,
        surge: false,
        ratio: 1,
      };
    }

    const ratio = current / average;
    
    // Ensure ratio is a valid finite number
    const safeRatio = isFinite(ratio) ? ratio : 1;
    const surge = safeRatio >= surgeMultiplier;

    return {
      current,
      average,
      surge,
      ratio: safeRatio,
    };
  }

  // ==========================================================================
  // ATR (Average True Range)
  // ==========================================================================

  private calculateATR(
    highs: number[],
    lows: number[],
    closes: number[]
  ): IndicatorResult['atr'] {
    const { period, lowVolatility, highVolatility } = this.config.atr;

    if (highs.length < period + 1) {
      const currentPrice = closes[closes.length - 1];
      return {
        value: currentPrice * 0.02,
        volatility: 'normal',
        percentOfPrice: 2,
      };
    }

    // Calculate True Ranges
    const trueRanges: number[] = [];
    for (let i = 1; i < highs.length; i++) {
      const high = highs[i];
      const low = lows[i];
      const prevClose = closes[i - 1];

      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }

    // Calculate ATR (simple average for first period, then smoothed)
    const recentTRs = trueRanges.slice(-period);
    const atr = recentTRs.reduce((a, b) => a + b, 0) / period;

    const currentPrice = closes[closes.length - 1];
    const percentOfPrice = (atr / currentPrice) * 100;

    // Determine volatility level
    let volatility: 'low' | 'normal' | 'high' = 'normal';
    if (percentOfPrice < lowVolatility) {
      volatility = 'low';
    } else if (percentOfPrice > highVolatility) {
      volatility = 'high';
    }

    return {
      value: atr,
      volatility,
      percentOfPrice,
    };
  }

  // ==========================================================================
  // Helper: Get Simple Moving Average
  // ==========================================================================

  public calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return prices.reduce((a, b) => a + b, 0) / prices.length;
    }

    const recentPrices = prices.slice(-period);
    return recentPrices.reduce((a, b) => a + b, 0) / period;
  }

  // ==========================================================================
  // Helper: Format Indicator Results for Display
  // ==========================================================================

  public formatIndicators(indicators: IndicatorResult): string[] {
    const formatted: string[] = [];

    // RSI
    formatted.push(
      `RSI: ${indicators.rsi.value.toFixed(2)} (${indicators.rsi.signal})`
    );

    // MACD
    formatted.push(
      `MACD: ${indicators.macd.histogram > 0 ? 'Bullish' : 'Bearish'} (${indicators.macd.histogram.toFixed(4)})`
    );

    // EMA
    formatted.push(
      `EMA: ${indicators.ema.trend} trend (${indicators.ema.distance.toFixed(2)}% gap)`
    );

    // Bollinger Bands
    formatted.push(
      `BB: Price ${indicators.bollingerBands.position} (BW: ${indicators.bollingerBands.bandwidth.toFixed(2)}%)`
    );

    // Volume
    formatted.push(
      `Volume: ${indicators.volume.surge ? '📈 SURGE' : 'Normal'} (${indicators.volume.ratio.toFixed(2)}x avg)`
    );

    // ATR
    formatted.push(
      `ATR: ${indicators.atr.volatility} volatility (${indicators.atr.percentOfPrice.toFixed(2)}%)`
    );

    return formatted;
  }
}

// ============================================================================
// 📊 EXPORT DEFAULT
// ============================================================================

export default TechnicalAnalyzer;
