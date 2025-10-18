/**
 * 📊 SUPPORT & RESISTANCE DETECTOR
 * 
 * Identifies key price levels where price tends to bounce or break through.
 * These levels are crucial for:
 * - Better entry points
 * - Optimal TP/SL placement
 * - Signal validation
 */

import { Candle } from './TechnicalAnalyzer';

export interface PriceLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: number; // 0-100 (based on touches and volume)
  touches: number; // How many times price touched this level
  lastTouch: number; // Timestamp of last touch
}

export interface SRAnalysis {
  supports: PriceLevel[];
  resistances: PriceLevel[];
  nearestSupport: PriceLevel | null;
  nearestResistance: PriceLevel | null;
  currentPrice: number;
  distanceToSupport: number; // % distance
  distanceToResistance: number; // % distance
  isNearLevel: boolean; // Within 1% of major S/R
}

export class SupportResistanceDetector {
  private readonly LEVEL_THRESHOLD = 0.015; // 1.5% tolerance for "same level"
  private readonly MIN_TOUCHES = 2; // Minimum touches to be valid S/R
  private readonly LOOKBACK_PERIODS = 100; // How many candles to analyze

  /**
   * Detect support and resistance levels
   */
  public detectLevels(candles: Candle[]): SRAnalysis {
    if (candles.length < 20) {
      return this.emptyAnalysis(candles[candles.length - 1].close);
    }

    const lookback = Math.min(this.LOOKBACK_PERIODS, candles.length);
    const recentCandles = candles.slice(-lookback);
    const currentPrice = candles[candles.length - 1].close;

    // Find pivot highs and lows
    const pivots = this.findPivots(recentCandles);
    
    // Cluster pivots into levels
    const supports = this.clusterLevels(pivots.lows, 'support', recentCandles);
    const resistances = this.clusterLevels(pivots.highs, 'resistance', recentCandles);

    // Find nearest levels
    const nearestSupport = this.findNearest(supports, currentPrice, 'below');
    const nearestResistance = this.findNearest(resistances, currentPrice, 'above');

    // Calculate distances
    const distanceToSupport = nearestSupport 
      ? ((currentPrice - nearestSupport.price) / currentPrice) * 100 
      : 100;
    const distanceToResistance = nearestResistance
      ? ((nearestResistance.price - currentPrice) / currentPrice) * 100
      : 100;

    // Check if near major level
    const isNearLevel = distanceToSupport < 1 || distanceToResistance < 1;

    return {
      supports: supports.filter(s => s.strength >= 50), // Only strong levels
      resistances: resistances.filter(r => r.strength >= 50),
      nearestSupport,
      nearestResistance,
      currentPrice,
      distanceToSupport,
      distanceToResistance,
      isNearLevel,
    };
  }

  /**
   * Find pivot highs and lows
   */
  private findPivots(candles: Candle[]): {
    highs: { price: number; timestamp: number }[];
    lows: { price: number; timestamp: number }[];
  } {
    const highs: { price: number; timestamp: number }[] = [];
    const lows: { price: number; timestamp: number }[] = [];
    const window = 5; // Look 5 candles on each side

    for (let i = window; i < candles.length - window; i++) {
      const current = candles[i];
      
      // Check if pivot high
      let isPivotHigh = true;
      let isPivotLow = true;

      for (let j = 1; j <= window; j++) {
        if (candles[i - j].high >= current.high || candles[i + j].high >= current.high) {
          isPivotHigh = false;
        }
        if (candles[i - j].low <= current.low || candles[i + j].low <= current.low) {
          isPivotLow = false;
        }
      }

      if (isPivotHigh) {
        highs.push({ price: current.high, timestamp: current.timestamp });
      }
      if (isPivotLow) {
        lows.push({ price: current.low, timestamp: current.timestamp });
      }
    }

    return { highs, lows };
  }

  /**
   * Cluster similar price levels together
   */
  private clusterLevels(
    pivots: { price: number; timestamp: number }[],
    type: 'support' | 'resistance',
    candles: Candle[]
  ): PriceLevel[] {
    if (pivots.length === 0) return [];

    const clusters: PriceLevel[] = [];

    for (const pivot of pivots) {
      // Check if this pivot belongs to existing cluster
      let foundCluster = false;

      for (const cluster of clusters) {
        const priceDiff = Math.abs(pivot.price - cluster.price) / cluster.price;
        
        if (priceDiff < this.LEVEL_THRESHOLD) {
          // Add to existing cluster
          cluster.touches++;
          cluster.lastTouch = Math.max(cluster.lastTouch, pivot.timestamp);
          // Recalculate average price
          cluster.price = (cluster.price * (cluster.touches - 1) + pivot.price) / cluster.touches;
          foundCluster = true;
          break;
        }
      }

      if (!foundCluster) {
        // Create new cluster
        clusters.push({
          price: pivot.price,
          type,
          strength: 0, // Will calculate after
          touches: 1,
          lastTouch: pivot.timestamp,
        });
      }
    }

    // Calculate strength for each level
    for (const cluster of clusters) {
      cluster.strength = this.calculateLevelStrength(cluster, candles);
    }

    // Sort by strength (strongest first)
    return clusters
      .filter(c => c.touches >= this.MIN_TOUCHES)
      .sort((a, b) => b.strength - a.strength);
  }

  /**
   * Calculate strength of S/R level
   */
  private calculateLevelStrength(level: PriceLevel, candles: Candle[]): number {
    let strength = 0;

    // Factor 1: Number of touches (more touches = stronger)
    strength += Math.min(40, level.touches * 10);

    // Factor 2: Recent touches are more relevant
    const now = candles[candles.length - 1].timestamp;
    const timeSinceTouch = (now - level.lastTouch) / (1000 * 60 * 60); // hours
    const recencyScore = Math.max(0, 30 - timeSinceTouch * 0.5);
    strength += recencyScore;

    // Factor 3: Volume at level (if available)
    const volumeAtLevel = this.getVolumeAtLevel(level, candles);
    strength += volumeAtLevel * 20;

    // Factor 4: Clean bounces vs breakouts
    const bounceRate = this.getBounceRate(level, candles);
    strength += bounceRate * 10;

    return Math.min(100, Math.max(0, strength));
  }

  /**
   * Get average volume when price was at this level
   */
  private getVolumeAtLevel(level: PriceLevel, candles: Candle[]): number {
    const tolerance = this.LEVEL_THRESHOLD;
    const volumes: number[] = [];

    for (const candle of candles) {
      const priceDiff = Math.abs(candle.close - level.price) / level.price;
      if (priceDiff < tolerance) {
        volumes.push(candle.volume);
      }
    }

    if (volumes.length === 0) return 0;

    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const overallAvg = candles.reduce((a, b) => a + b.volume, 0) / candles.length;

    // Return ratio (0-1)
    return Math.min(1, avgVolume / overallAvg);
  }

  /**
   * Calculate how often price bounced vs broke through
   */
  private getBounceRate(level: PriceLevel, candles: Candle[]): number {
    let bounces = 0;
    let breakouts = 0;

    for (let i = 1; i < candles.length; i++) {
      const prev = candles[i - 1];
      const curr = candles[i];
      
      const prevDiff = Math.abs(prev.close - level.price) / level.price;
      const currDiff = Math.abs(curr.close - level.price) / level.price;

      // Price approached level
      if (prevDiff < this.LEVEL_THRESHOLD * 2) {
        if (level.type === 'support') {
          // Check if bounced up or broke down
          if (curr.close > prev.close && curr.close > level.price) {
            bounces++;
          } else if (curr.close < level.price * 0.98) {
            breakouts++;
          }
        } else {
          // Resistance
          if (curr.close < prev.close && curr.close < level.price) {
            bounces++;
          } else if (curr.close > level.price * 1.02) {
            breakouts++;
          }
        }
      }
    }

    const total = bounces + breakouts;
    return total > 0 ? bounces / total : 0.5;
  }

  /**
   * Find nearest level to current price
   */
  private findNearest(
    levels: PriceLevel[],
    currentPrice: number,
    direction: 'above' | 'below'
  ): PriceLevel | null {
    const filtered = levels.filter(level =>
      direction === 'above' ? level.price > currentPrice : level.price < currentPrice
    );

    if (filtered.length === 0) return null;

    return filtered.reduce((nearest, level) => {
      const currentDist = Math.abs(currentPrice - level.price);
      const nearestDist = Math.abs(currentPrice - nearest.price);
      return currentDist < nearestDist ? level : nearest;
    });
  }

  /**
   * Get entry recommendation based on S/R
   */
  public getEntryRecommendation(
    action: 'LONG' | 'SHORT',
    currentPrice: number,
    analysis: SRAnalysis
  ): {
    isGoodEntry: boolean;
    confidence: number;
    reason: string;
    suggestedEntry?: number;
  } {
    if (action === 'LONG') {
      // LONG: Want to enter near support
      if (!analysis.nearestSupport) {
        return {
          isGoodEntry: false,
          confidence: 30,
          reason: 'No clear support level identified',
        };
      }

      const distPct = analysis.distanceToSupport;

      if (distPct < 1) {
        // Very close to support - excellent entry
        return {
          isGoodEntry: true,
          confidence: 90,
          reason: `Price at strong support level ($${analysis.nearestSupport.price.toFixed(2)})`,
        };
      } else if (distPct < 3) {
        // Near support - good entry
        return {
          isGoodEntry: true,
          confidence: 75,
          reason: `Price approaching support ($${analysis.nearestSupport.price.toFixed(2)}, ${distPct.toFixed(1)}% away)`,
          suggestedEntry: analysis.nearestSupport.price * 1.005, // 0.5% above support
        };
      } else if (distPct > 5) {
        // Far from support - wait
        return {
          isGoodEntry: false,
          confidence: 40,
          reason: `Price ${distPct.toFixed(1)}% above support - wait for pullback`,
          suggestedEntry: analysis.nearestSupport.price * 1.01, // 1% above support
        };
      }
    } else {
      // SHORT: Want to enter near resistance
      if (!analysis.nearestResistance) {
        return {
          isGoodEntry: false,
          confidence: 30,
          reason: 'No clear resistance level identified',
        };
      }

      const distPct = analysis.distanceToResistance;

      if (distPct < 1) {
        // Very close to resistance - excellent entry
        return {
          isGoodEntry: true,
          confidence: 90,
          reason: `Price at strong resistance level ($${analysis.nearestResistance.price.toFixed(2)})`,
        };
      } else if (distPct < 3) {
        // Near resistance - good entry
        return {
          isGoodEntry: true,
          confidence: 75,
          reason: `Price approaching resistance ($${analysis.nearestResistance.price.toFixed(2)}, ${distPct.toFixed(1)}% away)`,
          suggestedEntry: analysis.nearestResistance.price * 0.995, // 0.5% below resistance
        };
      } else if (distPct > 5) {
        // Far from resistance - wait
        return {
          isGoodEntry: false,
          confidence: 40,
          reason: `Price ${distPct.toFixed(1)}% below resistance - wait for bounce`,
          suggestedEntry: analysis.nearestResistance.price * 0.99, // 1% below resistance
        };
      }
    }

    return {
      isGoodEntry: true,
      confidence: 60,
      reason: 'Moderate entry point',
    };
  }

  /**
   * Get optimal TP/SL based on S/R levels
   */
  public getOptimalLevels(
    action: 'LONG' | 'SHORT',
    entryPrice: number,
    analysis: SRAnalysis
  ): {
    takeProfit: number[];
    stopLoss: number;
    riskReward: number;
  } {
    if (action === 'LONG') {
      // TP at resistance levels
      const tp: number[] = [];
      for (const resistance of analysis.resistances.slice(0, 3)) {
        if (resistance.price > entryPrice) {
          tp.push(resistance.price * 0.995); // Slightly before resistance
        }
      }
      
      // If no resistance found, use percentage-based
      if (tp.length === 0) {
        tp.push(entryPrice * 1.02, entryPrice * 1.03, entryPrice * 1.05);
      }

      // SL below nearest support
      const sl = analysis.nearestSupport
        ? analysis.nearestSupport.price * 0.995
        : entryPrice * 0.98;

      const riskReward = (tp[0] - entryPrice) / (entryPrice - sl);

      return { takeProfit: tp, stopLoss: sl, riskReward };
    } else {
      // SHORT
      // TP at support levels
      const tp: number[] = [];
      for (const support of analysis.supports.slice(0, 3)) {
        if (support.price < entryPrice) {
          tp.push(support.price * 1.005); // Slightly above support
        }
      }

      // If no support found, use percentage-based
      if (tp.length === 0) {
        tp.push(entryPrice * 0.98, entryPrice * 0.97, entryPrice * 0.95);
      }

      // SL above nearest resistance
      const sl = analysis.nearestResistance
        ? analysis.nearestResistance.price * 1.005
        : entryPrice * 1.02;

      const riskReward = (entryPrice - tp[0]) / (sl - entryPrice);

      return { takeProfit: tp, stopLoss: sl, riskReward };
    }
  }

  private emptyAnalysis(currentPrice: number): SRAnalysis {
    return {
      supports: [],
      resistances: [],
      nearestSupport: null,
      nearestResistance: null,
      currentPrice,
      distanceToSupport: 100,
      distanceToResistance: 100,
      isNearLevel: false,
    };
  }
}
