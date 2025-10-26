/**
 * 🧠 SMART INTERVENTION VALIDATOR
 * 
 * Intelligent validation system untuk memastikan intervensi hanya dilakukan
 * pada kondisi yang benar-benar memerlukan action, bukan fluktuasi normal.
 * 
 * Features:
 * - Multi-timeframe confirmation
 * - Trend strength validation
 * - Volume confirmation
 * - False signal filtering
 * - Market noise detection
 */

import { Candle } from './engines/TechnicalAnalyzer';
import { TradingSignal, SignalAction } from './engines/LiveSignalEngine';
import { NewsSentiment } from './NewsAnalyzer';

export interface ValidationResult {
  isValidIntervention: boolean;
  confidence: number; // 0-100
  reasons: string[];
  warnings: string[];
  shouldWait: boolean; // True jika perlu wait & observe
  recommendedAction: 'CLOSE_NOW' | 'ADJUST_SL' | 'HOLD_AND_MONITOR' | 'NO_ACTION';
}

export interface MarketCondition {
  volatility: 'low' | 'normal' | 'high' | 'extreme';
  trendStrength: number; // 0-100
  volumeConfirmation: boolean;
  isConsolidation: boolean;
  isBreakout: boolean;
}

export class SmartInterventionValidator {
  
  // ==========================================================================
  // 🎯 MAIN: Validate Signal Reversal
  // ==========================================================================
  
  /**
   * Validate apakah signal reversal benar-benar reversal atau hanya noise
   */
  static validateSignalReversal(
    currentPosition: {
      side: 'LONG' | 'SHORT';
      entryPrice: number;
      currentPrice: number;
      pnlPercent: number;
    },
    newSignal: TradingSignal,
    candles: Candle[],
    previousSignals?: TradingSignal[]
  ): ValidationResult {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let confidence = 0;
    let shouldWait = false;
    let recommendedAction: ValidationResult['recommendedAction'] = 'NO_ACTION';

    // 1. CHECK: Apakah ini reversal yang sebenarnya?
    const isActualReversal = 
      (currentPosition.side === 'LONG' && newSignal.action === 'SHORT') ||
      (currentPosition.side === 'SHORT' && newSignal.action === 'LONG');

    if (!isActualReversal) {
      return {
        isValidIntervention: false,
        confidence: 0,
        reasons: ['Not a reversal - signal direction matches current position'],
        warnings: [],
        shouldWait: false,
        recommendedAction: 'NO_ACTION',
      };
    }

    // 2. ANALYZE: Market condition
    const marketCondition = this.analyzeMarketCondition(candles);

    // 3. CHECK: Multiple timeframe confirmation
    const mtfConfirmation = this.checkMultiTimeframeAlignment(newSignal, marketCondition);

    // 4. CHECK: Trend strength
    if (marketCondition.trendStrength < 60) {
      warnings.push(`⚠️ Weak trend strength (${marketCondition.trendStrength.toFixed(0)}%) - Kemungkinan ranging/noise`);
      confidence -= 20;
      shouldWait = true;
    } else {
      reasons.push(`✅ Strong trend detected (${marketCondition.trendStrength.toFixed(0)}%)`);
      confidence += 25;
    }

    // 5. CHECK: Volume confirmation
    if (!marketCondition.volumeConfirmation) {
      warnings.push('⚠️ Low volume - Reversal tidak dikonfirmasi oleh volume');
      confidence -= 15;
      shouldWait = true;
    } else {
      reasons.push('✅ Volume confirms the reversal');
      confidence += 20;
    }

    // 6. CHECK: Consolidation vs Breakout
    if (marketCondition.isConsolidation) {
      warnings.push('⚠️ Market dalam fase consolidation - Normal price swing');
      confidence -= 25;
      shouldWait = true;
      
      reasons.push('💡 Recommendation: Hold and wait for clear breakout');
    } else if (marketCondition.isBreakout) {
      reasons.push('✅ Confirmed breakout detected');
      confidence += 20;
    }

    // 7. CHECK: Signal confidence threshold
    if (newSignal.confidence < 75) {
      warnings.push(`⚠️ Signal confidence below threshold (${newSignal.confidence.toFixed(0)}% < 75%)`);
      confidence -= 10;
      shouldWait = true;
    } else {
      reasons.push(`✅ High signal confidence (${newSignal.confidence.toFixed(0)}%)`);
      confidence += 15;
    }

    // 8. CHECK: News alignment
    if (newSignal.newsValidation) {
      if (newSignal.newsValidation.isValid) {
        reasons.push('✅ News sentiment confirms reversal');
        confidence += 20;
      } else {
        warnings.push('⚠️ News sentiment tidak mendukung reversal');
        confidence -= 15;
      }
    }

    // 9. CHECK: Market regime alignment
    if (newSignal.marketRegime) {
      const regimeAligned = this.checkRegimeAlignment(
        newSignal.action,
        newSignal.marketRegime.regime
      );
      
      if (regimeAligned) {
        reasons.push(`✅ Signal aligned with ${newSignal.marketRegime.regime} regime`);
        confidence += 10;
      } else {
        warnings.push(`⚠️ Signal conflicts with ${newSignal.marketRegime.regime} regime`);
        confidence -= 10;
      }
    }

    // 10. CHECK: Multiple false signals recently
    if (previousSignals && previousSignals.length >= 3) {
      const recentReversals = previousSignals.filter((sig, idx) => 
        idx > 0 && sig.action !== previousSignals[idx - 1].action
      ).length;

      if (recentReversals >= 2) {
        warnings.push('⚠️ Multiple signal changes detected recently - Kemungkinan choppy market');
        confidence -= 20;
        shouldWait = true;
      }
    }

    // 11. CHECK: Current P&L consideration
    if (currentPosition.pnlPercent > 2) {
      // Dalam profit besar - lebih aggressive untuk protect
      reasons.push(`✅ Position in good profit (${currentPosition.pnlPercent.toFixed(2)}%) - Worth protecting`);
      confidence += 10;
    } else if (currentPosition.pnlPercent < -3) {
      // Dalam loss besar - validate lebih ketat
      warnings.push(`⚠️ Position in significant loss (${currentPosition.pnlPercent.toFixed(2)}%) - Need strong confirmation`);
      confidence -= 5;
    }

    // 12. CALCULATE: Final confidence
    confidence = Math.max(0, Math.min(100, 50 + confidence)); // Base 50 + adjustments

    // 13. DETERMINE: Recommended action
    if (confidence >= 80 && !shouldWait) {
      recommendedAction = 'CLOSE_NOW';
      reasons.push('🎯 RECOMMENDATION: Close position immediately');
    } else if (confidence >= 65 && !shouldWait) {
      recommendedAction = 'ADJUST_SL';
      reasons.push('🎯 RECOMMENDATION: Tighten stop loss and monitor');
    } else if (confidence >= 50 || shouldWait) {
      recommendedAction = 'HOLD_AND_MONITOR';
      reasons.push('🎯 RECOMMENDATION: Hold and monitor for confirmation');
    } else {
      recommendedAction = 'NO_ACTION';
      reasons.push('🎯 RECOMMENDATION: No action needed - likely false signal');
    }

    // 14. FINAL DECISION
    const isValidIntervention = confidence >= 75 && !shouldWait;

    return {
      isValidIntervention,
      confidence,
      reasons,
      warnings,
      shouldWait,
      recommendedAction,
    };
  }

  // ==========================================================================
  // 📊 ANALYZE: Market Condition
  // ==========================================================================

  private static analyzeMarketCondition(candles: Candle[]): MarketCondition {
    const recentCandles = candles.slice(-50);
    
    // Calculate ATR for volatility
    const atr = this.calculateATR(recentCandles);
    const avgPrice = recentCandles.reduce((sum, c) => sum + c.close, 0) / recentCandles.length;
    const atrPercent = (atr / avgPrice) * 100;

    // Determine volatility level
    let volatility: MarketCondition['volatility'] = 'normal';
    if (atrPercent < 1) volatility = 'low';
    else if (atrPercent > 3) volatility = 'high';
    else if (atrPercent > 5) volatility = 'extreme';

    // Calculate trend strength using ADX-like method
    const trendStrength = this.calculateTrendStrength(recentCandles);

    // Check volume confirmation
    const volumeConfirmation = this.checkVolumeConfirmation(recentCandles);

    // Check consolidation
    const priceRange = this.calculatePriceRange(recentCandles);
    const isConsolidation = priceRange < 2; // Less than 2% range

    // Check breakout
    const isBreakout = this.detectBreakout(recentCandles);

    return {
      volatility,
      trendStrength,
      volumeConfirmation,
      isConsolidation,
      isBreakout,
    };
  }

  // ==========================================================================
  // 🎯 CHECK: Multi-Timeframe Alignment
  // ==========================================================================

  private static checkMultiTimeframeAlignment(
    signal: TradingSignal,
    marketCondition: MarketCondition
  ): boolean {
    // Check if signal aligns with overall market structure
    // In real implementation, would fetch multiple timeframes
    
    // For now, use market condition as proxy
    if (marketCondition.isConsolidation) {
      return false; // Don't trust signals in consolidation
    }

    if (marketCondition.trendStrength > 70) {
      return true; // Strong trend = good alignment
    }

    return marketCondition.volumeConfirmation;
  }

  // ==========================================================================
  // 🌊 CHECK: Regime Alignment
  // ==========================================================================

  private static checkRegimeAlignment(
    action: SignalAction,
    regime: string
  ): boolean {
    if (regime === 'trending_up' && action === 'LONG') return true;
    if (regime === 'trending_down' && action === 'SHORT') return true;
    if (regime === 'ranging') return false; // Don't trust reversals in ranging
    return true; // Neutral for other cases
  }

  // ==========================================================================
  // 📊 VALIDATE: Early Exit Signal
  // ==========================================================================

  static validateEarlyExit(
    currentPosition: {
      side: 'LONG' | 'SHORT';
      entryPrice: number;
      currentPrice: number;
      pnlPercent: number;
      holdingTimeMinutes: number;
    },
    newSignal: TradingSignal,
    candles: Candle[]
  ): ValidationResult {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let confidence = 0;
    let shouldWait = false;

    // 1. CHECK: Holding time
    if (currentPosition.holdingTimeMinutes < 15) {
      warnings.push('⚠️ Position opened less than 15 minutes ago - Too early to exit');
      confidence -= 30;
      shouldWait = true;
    }

    // 2. CHECK: Signal direction match
    const isSameDirection = 
      (currentPosition.side === 'LONG' && newSignal.action === 'LONG') ||
      (currentPosition.side === 'SHORT' && newSignal.action === 'SHORT');

    if (!isSameDirection) {
      // This is actually a reversal, not early exit
      return {
        isValidIntervention: false,
        confidence: 0,
        reasons: ['This is a reversal signal, not early exit'],
        warnings: ['Use validateSignalReversal() instead'],
        shouldWait: false,
        recommendedAction: 'NO_ACTION',
      };
    }

    // 3. CHECK: Signal weakness
    if (newSignal.confidence >= 60) {
      reasons.push('✅ Signal still strong enough - No need for early exit');
      return {
        isValidIntervention: false,
        confidence: 0,
        reasons,
        warnings: [],
        shouldWait: false,
        recommendedAction: 'NO_ACTION',
      };
    }

    // 4. CHECK: Market condition
    const marketCondition = this.analyzeMarketCondition(candles);
    
    if (marketCondition.isConsolidation) {
      warnings.push('⚠️ Market consolidating - Normal signal weakness');
      confidence -= 20;
      shouldWait = true;
    }

    // 5. CHECK: P&L consideration
    if (currentPosition.pnlPercent > 1.5) {
      // In profit - consider taking it
      reasons.push(`✅ Position in profit (${currentPosition.pnlPercent.toFixed(2)}%) - Good to exit`);
      confidence += 30;
    } else if (currentPosition.pnlPercent < -2) {
      // In loss - be more careful
      warnings.push(`⚠️ Position in loss (${currentPosition.pnlPercent.toFixed(2)}%) - Avoid panic exit`);
      confidence -= 20;
      shouldWait = true;
    }

    // 6. DETERMINE: Action
    confidence = Math.max(0, Math.min(100, 50 + confidence));

    let recommendedAction: ValidationResult['recommendedAction'] = 'NO_ACTION';
    
    if (confidence >= 70 && currentPosition.pnlPercent > 0.5) {
      recommendedAction = 'CLOSE_NOW';
      reasons.push('🎯 RECOMMENDATION: Exit with profit');
    } else if (confidence >= 50) {
      recommendedAction = 'ADJUST_SL';
      reasons.push('🎯 RECOMMENDATION: Tighten stop loss');
    } else {
      recommendedAction = 'HOLD_AND_MONITOR';
      reasons.push('🎯 RECOMMENDATION: Continue monitoring');
    }

    return {
      isValidIntervention: confidence >= 70 && !shouldWait,
      confidence,
      reasons,
      warnings,
      shouldWait,
      recommendedAction,
    };
  }

  // ==========================================================================
  // 🔧 HELPER FUNCTIONS
  // ==========================================================================

  private static calculateATR(candles: Candle[], period: number = 14): number {
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

    const recentTRs = trs.slice(-period);
    return recentTRs.reduce((sum, tr) => sum + tr, 0) / recentTRs.length;
  }

  private static calculateTrendStrength(candles: Candle[]): number {
    // Simple trend strength: Compare EMA slopes
    const closes = candles.map(c => c.close);
    const ema20 = this.calculateEMA(closes, 20);
    const ema50 = this.calculateEMA(closes, 50);
    
    // Calculate slope of EMA20
    const ema20Slope = (ema20[ema20.length - 1] - ema20[ema20.length - 10]) / ema20[ema20.length - 10];
    const ema50Slope = (ema50[ema50.length - 1] - ema50[ema50.length - 10]) / ema50[ema50.length - 10];
    
    // Alignment of EMAs
    const alignment = Math.abs(ema20Slope) * 100;
    const agreement = (Math.sign(ema20Slope) === Math.sign(ema50Slope)) ? 1.5 : 0.5;
    
    return Math.min(100, alignment * 1000 * agreement);
  }

  private static calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    ema.push(sum / period);
    
    // Calculate EMA
    for (let i = period; i < prices.length; i++) {
      ema.push((prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
    }
    
    return ema;
  }

  private static checkVolumeConfirmation(candles: Candle[]): boolean {
    const recentVolumes = candles.slice(-20).map(c => c.volume);
    const avgVolume = recentVolumes.reduce((sum, v) => sum + v, 0) / recentVolumes.length;
    
    // Check last 3 candles
    const lastVolumes = recentVolumes.slice(-3);
    const recentAvgVolume = lastVolumes.reduce((sum, v) => sum + v, 0) / lastVolumes.length;
    
    // Volume should be higher than average (1.2x threshold)
    return recentAvgVolume > avgVolume * 1.2;
  }

  private static calculatePriceRange(candles: Candle[]): number {
    const closes = candles.map(c => c.close);
    const high = Math.max(...closes);
    const low = Math.min(...closes);
    const avg = (high + low) / 2;
    
    return ((high - low) / avg) * 100;
  }

  private static detectBreakout(candles: Candle[]): boolean {
    const recentCandles = candles.slice(-20);
    const lastCandle = candles[candles.length - 1];
    
    // Calculate range
    const closes = recentCandles.slice(0, -1).map(c => c.close);
    const high = Math.max(...closes);
    const low = Math.min(...closes);
    
    // Check if last candle breaks out
    const breakoutThreshold = 1.005; // 0.5% beyond range
    
    if (lastCandle.close > high * breakoutThreshold) return true;
    if (lastCandle.close < low / breakoutThreshold) return true;
    
    return false;
  }

  // ==========================================================================
  // 📊 VALIDATE: Break-Even Trigger
  // ==========================================================================

  static validateBreakEvenTrigger(
    currentPosition: {
      pnlPercent: number;
      holdingTimeMinutes: number;
    },
    marketCondition: MarketCondition
  ): ValidationResult {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let confidence = 80; // Default high confidence for break-even

    // 1. CHECK: Minimum profit reached
    if (currentPosition.pnlPercent < 1.5) {
      return {
        isValidIntervention: false,
        confidence: 0,
        reasons: ['Profit threshold not reached yet'],
        warnings: [],
        shouldWait: true,
        recommendedAction: 'NO_ACTION',
      };
    }

    reasons.push(`✅ Profit target reached (${currentPosition.pnlPercent.toFixed(2)}%)`);

    // 2. CHECK: Avoid in consolidation
    if (marketCondition.isConsolidation) {
      warnings.push('⚠️ Market consolidating - May reverse quickly');
      confidence -= 10;
    }

    // 3. CHECK: Volatility
    if (marketCondition.volatility === 'extreme') {
      warnings.push('⚠️ Extreme volatility - Consider wider stop');
      confidence -= 15;
    }

    reasons.push('🎯 RECOMMENDATION: Move stop loss to break-even');

    return {
      isValidIntervention: confidence >= 70,
      confidence,
      reasons,
      warnings,
      shouldWait: false,
      recommendedAction: 'ADJUST_SL',
    };
  }

  // ==========================================================================
  // 📊 VALIDATE: Trailing Stop Adjustment
  // ==========================================================================

  static validateTrailingStopAdjustment(
    currentPosition: {
      side: 'LONG' | 'SHORT';
      entryPrice: number;
      currentPrice: number;
      stopLoss: number;
      highestPrice?: number;
      lowestPrice?: number;
    },
    proposedNewStopLoss: number,
    marketCondition: MarketCondition
  ): ValidationResult {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let confidence = 70;

    // 1. CHECK: Minimum improvement
    const currentSLDistance = Math.abs(currentPosition.stopLoss - currentPosition.entryPrice);
    const newSLDistance = Math.abs(proposedNewStopLoss - currentPosition.entryPrice);
    const improvement = ((newSLDistance - currentSLDistance) / currentSLDistance) * 100;

    if (improvement < 10) {
      warnings.push('⚠️ Stop loss improvement too small (<10%) - Avoid unnecessary adjustments');
      return {
        isValidIntervention: false,
        confidence: 0,
        reasons: ['Adjustment too small to justify'],
        warnings,
        shouldWait: true,
        recommendedAction: 'NO_ACTION',
      };
    }

    reasons.push(`✅ Significant improvement (${improvement.toFixed(0)}%)`);

    // 2. CHECK: Volatility consideration
    if (marketCondition.volatility === 'high' || marketCondition.volatility === 'extreme') {
      warnings.push(`⚠️ ${marketCondition.volatility} volatility - May hit stop prematurely`);
      confidence -= 15;
    }

    // 3. CHECK: Consolidation
    if (marketCondition.isConsolidation) {
      warnings.push('⚠️ Market consolidating - Tight stop may trigger on noise');
      confidence -= 10;
    } else {
      reasons.push('✅ Trending market - Good for trailing stop');
      confidence += 10;
    }

    reasons.push('🎯 RECOMMENDATION: Update trailing stop');

    return {
      isValidIntervention: confidence >= 60,
      confidence,
      reasons,
      warnings,
      shouldWait: false,
      recommendedAction: 'ADJUST_SL',
    };
  }
}
