/**
 * 🌊 MARKET REGIME DETECTOR
 * 
 * Identifies market conditions to optimize signal strategy:
 * - TRENDING: Strong directional movement
 * - RANGING: Sideways consolidation
 * - VOLATILE: High volatility, unpredictable
 * 
 * Different regimes require different trading strategies!
 */

import { Candle } from './TechnicalAnalyzer';

export type MarketRegime = 'trending_up' | 'trending_down' | 'ranging' | 'volatile' | 'unknown';

export interface RegimeAnalysis {
  regime: MarketRegime;
  confidence: number; // 0-100
  trendStrength: number; // 0-100 (for trending markets)
  volatilityLevel: number; // 0-100
  recommendations: string[];
  warnings: string[];
}

export class MarketRegimeDetector {
  
  /**
   * Detect current market regime from candle data
   */
  public detectRegime(candles: Candle[]): RegimeAnalysis {
    if (candles.length < 50) {
      return {
        regime: 'unknown',
        confidence: 0,
        trendStrength: 0,
        volatilityLevel: 0,
        recommendations: [],
        warnings: ['⚠️ Insufficient data for regime detection (need 50+ candles)'],
      };
    }

    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Calculate metrics
    const trendMetrics = this.calculateTrendStrength(candles);
    const volatilityMetrics = this.calculateVolatility(candles);
    const rangeMetrics = this.calculateRangeBound(candles);

    // Determine regime
    let regime: MarketRegime = 'unknown';
    let confidence = 0;

    // HIGH VOLATILITY CHECK (priority)
    if (volatilityMetrics.level > 70) {
      regime = 'volatile';
      confidence = volatilityMetrics.level;
      warnings.push('⚠️ High volatility detected - reduce position sizes');
      warnings.push('⚠️ Widen stop losses to avoid false triggers');
      recommendations.push('💡 Use smaller positions (50% of normal size)');
      recommendations.push('💡 Focus on quick scalps, avoid swing trades');
    }
    // TRENDING MARKET CHECK
    else if (trendMetrics.strength > 60 && rangeMetrics.isRanging === false) {
      if (trendMetrics.direction === 'up') {
        regime = 'trending_up';
        confidence = trendMetrics.strength;
        recommendations.push('🟢 LONG bias - trade with the trend');
        recommendations.push('💡 Use momentum indicators (MACD, EMA crossovers)');
        recommendations.push('💡 Buy dips to support levels');
        recommendations.push('💡 Trail stop losses to lock profits');
      } else {
        regime = 'trending_down';
        confidence = trendMetrics.strength;
        recommendations.push('🔴 SHORT bias - trade with the trend');
        recommendations.push('💡 Use momentum indicators (MACD, EMA crossovers)');
        recommendations.push('💡 Short rallies to resistance levels');
        recommendations.push('💡 Trail stop losses to lock profits');
      }
    }
    // RANGING MARKET CHECK
    else if (rangeMetrics.isRanging && trendMetrics.strength < 40) {
      regime = 'ranging';
      confidence = rangeMetrics.confidence;
      recommendations.push('📊 Range-bound market - trade the range');
      recommendations.push('💡 Buy near support, sell near resistance');
      recommendations.push('💡 Use mean reversion indicators (RSI, Bollinger Bands)');
      recommendations.push('💡 Take profits quickly, don\'t expect big moves');
      recommendations.push('💡 Watch for breakout signals');
      warnings.push('⚠️ Avoid momentum strategies in ranging market');
    }
    // TRANSITIONING/UNCLEAR
    else {
      regime = 'unknown';
      confidence = 30;
      warnings.push('⚠️ Market regime unclear - trade with caution');
      warnings.push('⚠️ Reduce position sizes until clearer picture emerges');
      recommendations.push('💡 Wait for clearer signals');
      recommendations.push('💡 Use tighter stops');
    }

    return {
      regime,
      confidence,
      trendStrength: trendMetrics.strength,
      volatilityLevel: volatilityMetrics.level,
      recommendations,
      warnings,
    };
  }

  /**
   * Calculate trend strength and direction
   */
  private calculateTrendStrength(candles: Candle[]): {
    strength: number;
    direction: 'up' | 'down' | 'sideways';
  } {
    const closes = candles.map(c => c.close);
    const n = closes.length;
    
    // Linear regression to find trend
    const x = Array.from({ length: n }, (_, i) => i);
    const avgX = x.reduce((a, b) => a + b) / n;
    const avgY = closes.reduce((a, b) => a + b) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - avgX) * (closes[i] - avgY);
      denominator += (x[i] - avgX) ** 2;
    }
    
    const slope = numerator / denominator;
    const intercept = avgY - slope * avgX;
    
    // Calculate R-squared (goodness of fit)
    let ssRes = 0;
    let ssTot = 0;
    
    for (let i = 0; i < n; i++) {
      const predicted = slope * x[i] + intercept;
      ssRes += (closes[i] - predicted) ** 2;
      ssTot += (closes[i] - avgY) ** 2;
    }
    
    const rSquared = 1 - (ssRes / ssTot);
    
    // Trend strength based on R-squared (0-100)
    const strength = Math.min(100, Math.max(0, rSquared * 100));
    
    // Determine direction based on slope
    const priceChange = ((closes[n - 1] - closes[0]) / closes[0]) * 100;
    let direction: 'up' | 'down' | 'sideways' = 'sideways';
    
    if (Math.abs(priceChange) < 2) {
      direction = 'sideways';
    } else if (slope > 0) {
      direction = 'up';
    } else {
      direction = 'down';
    }
    
    return { strength, direction };
  }

  /**
   * Calculate volatility level
   */
  private calculateVolatility(candles: Candle[]): {
    level: number; // 0-100
    atr: number;
  } {
    // Calculate Average True Range (ATR)
    const trs: number[] = [];
    
    for (let i = 1; i < candles.length; i++) {
      const high = candles[i].high;
      const low = candles[i].low;
      const prevClose = candles[i - 1].close;
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trs.push(tr);
    }
    
    const atr = trs.reduce((a, b) => a + b, 0) / trs.length;
    const currentPrice = candles[candles.length - 1].close;
    const atrPercent = (atr / currentPrice) * 100;
    
    // Map ATR% to volatility level (0-100)
    // 0-1% = low (0-30)
    // 1-3% = medium (30-70)
    // 3%+ = high (70-100)
    let level = 0;
    if (atrPercent < 1) {
      level = atrPercent * 30;
    } else if (atrPercent < 3) {
      level = 30 + ((atrPercent - 1) / 2) * 40;
    } else {
      level = 70 + Math.min(30, (atrPercent - 3) * 10);
    }
    
    return { level: Math.min(100, level), atr };
  }

  /**
   * Check if market is range-bound
   */
  private calculateRangeBound(candles: Candle[]): {
    isRanging: boolean;
    confidence: number;
    support: number;
    resistance: number;
  } {
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    
    // Find potential support/resistance
    const recentHigh = Math.max(...highs.slice(-20));
    const recentLow = Math.min(...lows.slice(-20));
    const range = recentHigh - recentLow;
    const avgPrice = (recentHigh + recentLow) / 2;
    const rangePercent = (range / avgPrice) * 100;
    
    // Check if price is bouncing between levels
    const touchesSupport = lows.slice(-20).filter(l => Math.abs(l - recentLow) / recentLow < 0.01).length;
    const touchesResistance = highs.slice(-20).filter(h => Math.abs(h - recentHigh) / recentHigh < 0.01).length;
    
    const totalTouches = touchesSupport + touchesResistance;
    
    // Is ranging if:
    // 1. Range is relatively small (< 10% of price)
    // 2. Multiple touches of support/resistance
    // 3. Price contained within boundaries
    const isRanging = rangePercent < 10 && totalTouches >= 3;
    
    // Confidence based on number of touches and range tightness
    const confidence = Math.min(90, (totalTouches * 15) + ((10 - rangePercent) * 5));
    
    return {
      isRanging,
      confidence: isRanging ? confidence : 0,
      support: recentLow,
      resistance: recentHigh,
    };
  }

  /**
   * Get strategy recommendations for current regime
   */
  public getStrategyForRegime(regime: MarketRegime): {
    favoredIndicators: string[];
    avoidIndicators: string[];
    positionSizeMultiplier: number; // 0.5 = 50%, 1.0 = 100%, 1.5 = 150%
    minConfidence: number; // Minimum confidence to enter trade
  } {
    switch (regime) {
      case 'trending_up':
      case 'trending_down':
        return {
          favoredIndicators: ['MACD', 'EMA', 'Volume'],
          avoidIndicators: ['RSI_OVERBOUGHT', 'RSI_OVERSOLD'], // Don't fade the trend
          positionSizeMultiplier: 1.2, // Can take larger positions in trending markets
          minConfidence: 65,
        };
      
      case 'ranging':
        return {
          favoredIndicators: ['RSI', 'Bollinger_Bands', 'Support_Resistance'],
          avoidIndicators: ['MACD', 'EMA_CROSSOVER'], // Momentum lags in ranging
          positionSizeMultiplier: 1.0,
          minConfidence: 70, // Higher confidence needed for ranging
        };
      
      case 'volatile':
        return {
          favoredIndicators: ['ATR', 'Bollinger_Bands'],
          avoidIndicators: ['ALL'], // Be cautious
          positionSizeMultiplier: 0.5, // Reduce size significantly
          minConfidence: 60, // Lowered to 60% for testing
        };
      
      default:
        return {
          favoredIndicators: [],
          avoidIndicators: [],
          positionSizeMultiplier: 0.7, // Reduce when uncertain
          minConfidence: 75,
        };
    }
  }
}
