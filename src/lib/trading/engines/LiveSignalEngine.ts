/**
 * 🚀 LIVE SIGNAL ENGINE
 * 
 * Core engine untuk generate real-time trading signals.
 * Menggunakan TechnicalAnalyzer dan trading-algorithms config.
 * 
 * Features:
 * - Signal generation (BUY/SELL/HOLD)
 * - Confidence scoring
 * - Entry/TP/SL calculation
 * - Multi-strategy support
 * - Risk management
 */

import TechnicalAnalyzer, { Candle, IndicatorResult, MarketData } from './TechnicalAnalyzer';
import TradingConfig from '@/config/trading-algorithms';
import TradingPairs, { TradingPair } from '@/config/trading-pairs';

// ============================================================================
// 📊 INTERFACES
// ============================================================================

export type SignalAction = 'LONG' | 'SHORT' | 'HOLD';
export type SignalStrength = 'weak' | 'moderate' | 'strong';
export type StrategyName = 'conservative' | 'balanced' | 'aggressive' | 'custom';

export interface TradingSignal {
  // Basic Info
  symbol: string;
  action: SignalAction;
  confidence: number; // 0-100
  strength: SignalStrength;
  
  // Price Levels
  entryPrice: number;
  currentPrice: number; // Current market price
  takeProfitLevels: number[]; // Multiple TP levels
  stopLoss: number;
  
  // Technical Analysis
  indicators: IndicatorResult;
  indicatorSummary: string[];
  
  // Reasoning
  reasons: string[];
  warnings: string[];
  
  // Metadata
  strategy: StrategyName;
  timeframe: string;
  timestamp: number;
  expiresAt: number;
  
  // Risk Management
  riskRewardRatio: number;
  maxLeverage: number;
  recommendedPositionSize: number; // % of portfolio
}

export interface SignalGenerationOptions {
  strategy?: StrategyName;
  timeframe?: string;
  minConfidence?: number;
  enabledPairsOnly?: boolean;
}

// ============================================================================
// 🚀 LIVE SIGNAL ENGINE CLASS
// ============================================================================

export class LiveSignalEngine {
  private analyzer: TechnicalAnalyzer;
  private config = TradingConfig;

  constructor() {
    this.analyzer = new TechnicalAnalyzer();
  }

  // ==========================================================================
  // 🎯 MAIN: Generate Trading Signal
  // ==========================================================================

  public async generateSignal(
    symbol: string,
    candles: Candle[],
    options: SignalGenerationOptions = {}
  ): Promise<TradingSignal> {
    const {
      strategy = 'balanced',
      timeframe = '15m',
      minConfidence = 80, // Default 80% confidence threshold
      enabledPairsOnly = true,
    } = options;

    // Validate pair
    const pair = TradingPairs.getPair(symbol);
    if (!pair || (enabledPairsOnly && !pair.settings.enabled)) {
      throw new Error(`Trading pair ${symbol} is not enabled`);
    }

    // Analyze technical indicators
    const indicators = this.analyzer.analyze(candles);
    const currentPrice = candles[candles.length - 1].close;

    // Get strategy config
    const strategyConfig = this.config.getActiveStrategy();

    // Generate signal action and confidence
    const { action, confidence, strength, reasons, warnings } = 
      this.calculateSignal(indicators, strategyConfig, pair);

    // Calculate price levels
    const { entryPrice, takeProfitLevels, stopLoss, riskRewardRatio } = 
      this.calculatePriceLevels(action, currentPrice, indicators, strategyConfig);

    // Calculate position sizing
    const recommendedPositionSize = this.calculatePositionSize(
      confidence,
      riskRewardRatio,
      indicators.atr.volatility
    );

    // Format indicator summary
    const indicatorSummary = this.analyzer.formatIndicators(indicators);

    // Calculate expiration (signals valid for 1 hour by default)
    const now = Date.now();
    const expiresAt = now + (60 * 60 * 1000);

    return {
      symbol,
      action,
      confidence,
      strength,
      entryPrice,
      currentPrice, // ✅ Add currentPrice for MongoDB
      takeProfitLevels,
      stopLoss,
      indicators,
      indicatorSummary,
      reasons,
      warnings,
      strategy,
      timeframe,
      timestamp: now,
      expiresAt,
      riskRewardRatio,
      maxLeverage: pair.settings.maxLeverage,
      recommendedPositionSize,
    };
  }

  // ==========================================================================
  // 🎯 Calculate Signal Action & Confidence
  // ==========================================================================

  private calculateSignal(
    indicators: IndicatorResult,
    strategy: any,
    pair: TradingPair
  ): {
    action: SignalAction;
    confidence: number;
    strength: SignalStrength;
    reasons: string[];
    warnings: string[];
  } {
    // Extract strategy rules with fallback defaults
    const rules = {
      minConfidence: strategy?.minConfidenceScore || strategy?.minConfidence || 50,
      requiredIndicators: strategy?.requiredIndicators || 2,
      allowShortPositions: strategy?.allowShortPositions !== false,
    };
    
    const reasons: string[] = [];
    const warnings: string[] = [];
    let bullishScore = 0;
    let bearishScore = 0;

    // ========================================================================
    // RSI Analysis
    // ========================================================================
    if (indicators.rsi.extremeOversold) {
      bullishScore += 25;
      reasons.push(`🟢 RSI extremely oversold (${indicators.rsi.value.toFixed(1)})`);
    } else if (indicators.rsi.signal === 'oversold') {
      bullishScore += 15;
      reasons.push(`🟢 RSI oversold (${indicators.rsi.value.toFixed(1)})`);
    }

    if (indicators.rsi.extremeOverbought) {
      bearishScore += 25;
      reasons.push(`🔴 RSI extremely overbought (${indicators.rsi.value.toFixed(1)})`);
    } else if (indicators.rsi.signal === 'overbought') {
      bearishScore += 15;
      reasons.push(`🔴 RSI overbought (${indicators.rsi.value.toFixed(1)})`);
    }

    // ========================================================================
    // MACD Analysis
    // ========================================================================
    if (indicators.macd.crossover === 'bullish') {
      bullishScore += 20;
      reasons.push('🟢 MACD bullish crossover');
    } else if (indicators.macd.bullish) {
      bullishScore += 10;
      reasons.push('🟢 MACD histogram positive');
    }

    if (indicators.macd.crossover === 'bearish') {
      bearishScore += 20;
      reasons.push('🔴 MACD bearish crossover');
    } else if (indicators.macd.bearish) {
      bearishScore += 10;
      reasons.push('🔴 MACD histogram negative');
    }

    // ========================================================================
    // EMA Trend Analysis
    // ========================================================================
    if (indicators.ema.crossover === 'golden') {
      bullishScore += 25;
      reasons.push('🟢 Golden cross (EMA)');
    } else if (indicators.ema.trend === 'bullish') {
      bullishScore += 15;
      reasons.push(`🟢 Strong uptrend (EMA gap: ${indicators.ema.distance.toFixed(2)}%)`);
    }

    if (indicators.ema.crossover === 'death') {
      bearishScore += 25;
      reasons.push('🔴 Death cross (EMA)');
    } else if (indicators.ema.trend === 'bearish') {
      bearishScore += 15;
      reasons.push(`🔴 Strong downtrend (EMA gap: ${Math.abs(indicators.ema.distance).toFixed(2)}%)`);
    }

    // ========================================================================
    // Bollinger Bands Analysis
    // ========================================================================
    if (indicators.bollingerBands.position === 'below_lower') {
      bullishScore += 20;
      reasons.push('🟢 Price below lower BB (oversold)');
    } else if (indicators.bollingerBands.position === 'at_lower') {
      bullishScore += 10;
      reasons.push('🟢 Price at lower BB');
    }

    if (indicators.bollingerBands.position === 'above_upper') {
      bearishScore += 20;
      reasons.push('🔴 Price above upper BB (overbought)');
    } else if (indicators.bollingerBands.position === 'at_upper') {
      bearishScore += 10;
      reasons.push('🔴 Price at upper BB');
    }

    if (indicators.bollingerBands.squeeze) {
      warnings.push('⚠️ BB squeeze detected - potential breakout imminent');
    }

    // ========================================================================
    // Volume Analysis
    // ========================================================================
    if (indicators.volume.surge) {
      if (bullishScore > bearishScore) {
        bullishScore += 15;
        reasons.push(`🟢 Volume surge confirming uptrend (${indicators.volume.ratio.toFixed(2)}x)`);
      } else if (bearishScore > bullishScore) {
        bearishScore += 15;
        reasons.push(`🔴 Volume surge confirming downtrend (${indicators.volume.ratio.toFixed(2)}x)`);
      } else {
        warnings.push(`⚠️ High volume but no clear direction (${indicators.volume.ratio.toFixed(2)}x avg)`);
      }
    }

    // ========================================================================
    // ATR Volatility Analysis
    // ========================================================================
    if (indicators.atr.volatility === 'high') {
      warnings.push(`⚠️ High volatility (ATR: ${indicators.atr.percentOfPrice.toFixed(2)}%)`);
    } else if (indicators.atr.volatility === 'low') {
      warnings.push(`⚠️ Low volatility - potential consolidation`);
    }

    // ========================================================================
    // Calculate Final Action & Confidence
    // ========================================================================
    let action: SignalAction = 'HOLD';
    let confidence = 0;
    let strength: SignalStrength = 'weak';

    const totalScore = bullishScore + bearishScore;
    const netScore = bullishScore - bearishScore;

    if (totalScore === 0) {
      confidence = 0;
      reasons.push('📊 No clear signals - market consolidating');
    } else {
      // Fixed confidence calculation:
      // Use the winning score as percentage of total
      // Higher score difference = higher confidence
      const winningScore = Math.max(bullishScore, bearishScore);
      confidence = Math.min((winningScore / totalScore) * 100, 100);
      
      // Boost confidence if there's strong consensus (large score difference)
      const scoreDominance = Math.abs(netScore) / totalScore;
      confidence = Math.min(confidence * (1 + scoreDominance), 100);
      
      if (netScore > 0 && confidence >= rules.minConfidence) {
        action = 'LONG';
      } else if (netScore < 0 && confidence >= rules.minConfidence) {
        action = 'SHORT';
      }
    }

    // Determine signal strength
    if (confidence >= 75) {
      strength = 'strong';
    } else if (confidence >= 60) {
      strength = 'moderate';
    } else {
      strength = 'weak';
    }

    // Add confidence-based warnings
    if (action !== 'HOLD' && confidence < 70) {
      warnings.push(`⚠️ Moderate confidence (${confidence.toFixed(1)}%) - use tight stop loss`);
    }

    return {
      action,
      confidence,
      strength,
      reasons,
      warnings,
    };
  }

  // ==========================================================================
  // 💰 Calculate Price Levels (Entry, TP, SL)
  // ==========================================================================

  private calculatePriceLevels(
    action: SignalAction,
    currentPrice: number,
    indicators: IndicatorResult,
    strategy: any
  ): {
    entryPrice: number;
    takeProfitLevels: number[];
    stopLoss: number;
    riskRewardRatio: number;
  } {
    const atr = indicators.atr.value;
    
    // Entry price (slightly better than current for limit orders)
    const entryPrice = action === 'LONG'
      ? currentPrice * 0.999 // 0.1% below current
      : currentPrice * 1.001; // 0.1% above current

    if (action === 'HOLD') {
      // For HOLD signals, provide conservative TP levels (if price moves favorably)
      // This satisfies MongoDB validation (requires 1-5 TP levels)
      const conservativeTP = currentPrice * 1.02; // 2% profit target
      
      return {
        entryPrice: currentPrice,
        takeProfitLevels: [conservativeTP], // At least 1 TP level required
        stopLoss: currentPrice * 0.98, // 2% stop loss
        riskRewardRatio: 1.0, // 1:1 ratio for HOLD
      };
    }

    // ========================================================================
    // LONG Position
    // ========================================================================
    if (action === 'LONG') {
      // Stop Loss: Below lower BB or 2x ATR
      const bbStopLoss = indicators.bollingerBands.lower;
      const atrStopLoss = currentPrice - (atr * 2);
      const stopLoss = Math.max(bbStopLoss, atrStopLoss);

      // Take Profit Levels
      const tp1 = currentPrice + (atr * 2); // Conservative
      const tp2 = currentPrice + (atr * 3); // Moderate
      const tp3 = indicators.bollingerBands.upper; // Aggressive

      const takeProfitLevels = [tp1, tp2, tp3];

      // Calculate Risk/Reward Ratio (using TP2 as target)
      const risk = currentPrice - stopLoss;
      const reward = tp2 - currentPrice;
      const riskRewardRatio = reward / risk;

      return {
        entryPrice,
        takeProfitLevels,
        stopLoss,
        riskRewardRatio,
      };
    }

    // ========================================================================
    // SHORT Position
    // ========================================================================
    else {
      // Stop Loss: Above upper BB or 2x ATR
      const bbStopLoss = indicators.bollingerBands.upper;
      const atrStopLoss = currentPrice + (atr * 2);
      const stopLoss = Math.min(bbStopLoss, atrStopLoss);

      // Take Profit Levels
      const tp1 = currentPrice - (atr * 2); // Conservative
      const tp2 = currentPrice - (atr * 3); // Moderate
      const tp3 = indicators.bollingerBands.lower; // Aggressive

      const takeProfitLevels = [tp1, tp2, tp3];

      // Calculate Risk/Reward Ratio (using TP2 as target)
      const risk = stopLoss - currentPrice;
      const reward = currentPrice - tp2;
      const riskRewardRatio = reward / risk;

      return {
        entryPrice,
        takeProfitLevels,
        stopLoss,
        riskRewardRatio,
      };
    }
  }

  // ==========================================================================
  // 📊 Calculate Recommended Position Size
  // ==========================================================================

  private calculatePositionSize(
    confidence: number,
    riskRewardRatio: number,
    volatility: 'low' | 'normal' | 'high'
  ): number {
    // Base position size: 10% for moderate confidence
    let positionSize = 10;

    // Adjust for confidence
    if (confidence >= 85) {
      positionSize = 20;
    } else if (confidence >= 75) {
      positionSize = 15;
    } else if (confidence < 60) {
      positionSize = 5;
    }

    // Adjust for risk/reward
    if (riskRewardRatio >= 3) {
      positionSize *= 1.2;
    } else if (riskRewardRatio < 1.5) {
      positionSize *= 0.8;
    }

    // Adjust for volatility
    if (volatility === 'high') {
      positionSize *= 0.7;
    } else if (volatility === 'low') {
      positionSize *= 1.1;
    }

    // Cap at 25% max
    return Math.min(positionSize, 25);
  }

  // ==========================================================================
  // 🔄 Generate Signals for Multiple Pairs
  // ==========================================================================

  public async generateMultipleSignals(
    candlesData: Map<string, Candle[]>,
    options: SignalGenerationOptions = {}
  ): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];
    const enabledPairs = TradingPairs.getEnabledPairs();

    for (const pair of enabledPairs) {
      const candles = candlesData.get(pair.symbol);
      
      if (!candles || candles.length < 50) {
        continue; // Need at least 50 candles for accurate analysis
      }

      try {
        const signal = await this.generateSignal(pair.symbol, candles, options);
        
        // Only include signals that meet minimum confidence
        if (signal.confidence >= (options.minConfidence || 50)) {
          signals.push(signal);
        }
      } catch (error) {
        console.error(`Error generating signal for ${pair.symbol}:`, error);
      }
    }

    // Sort by confidence (highest first)
    return signals.sort((a, b) => b.confidence - a.confidence);
  }

  // ==========================================================================
  // 📈 Format Signal for Display
  // ==========================================================================

  public formatSignalSummary(signal: TradingSignal): string {
    const emoji = signal.action === 'LONG' ? '🟢' : signal.action === 'SHORT' ? '🔴' : '⚪';
    const arrow = signal.action === 'LONG' ? '↗️' : signal.action === 'SHORT' ? '↘️' : '➡️';
    
    return `${emoji} ${signal.symbol} ${arrow} ${signal.action} | ` +
           `Confidence: ${signal.confidence.toFixed(1)}% (${signal.strength}) | ` +
           `Entry: $${signal.entryPrice.toFixed(2)} | ` +
           `TP: $${signal.takeProfitLevels[1]?.toFixed(2)} | ` +
           `SL: $${signal.stopLoss.toFixed(2)} | ` +
           `R/R: ${signal.riskRewardRatio.toFixed(2)}`;
  }
}

// ============================================================================
// 📊 EXPORT DEFAULT
// ============================================================================

export default LiveSignalEngine;
