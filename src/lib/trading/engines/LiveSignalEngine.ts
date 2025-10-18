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
import NewsAnalyzer, { NewsSentiment, SignalValidation } from '../NewsAnalyzer';
import { MarketRegimeDetector, RegimeAnalysis } from './MarketRegimeDetector';
import { SupportResistanceDetector, SRAnalysis } from './SupportResistanceDetector';

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
  qualityGrade?: 'A' | 'B' | 'C' | 'D'; // Signal quality rating
  
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
  
  // Fundamental Analysis (News)
  newsValidation?: SignalValidation;
  newsSentiment?: NewsSentiment;
  
  // Market Context (NEW)
  marketRegime?: RegimeAnalysis;
  supportResistance?: SRAnalysis;
  
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
  validateWithNews?: boolean; // Enable news validation
  requireNewsAlignment?: boolean; // Reject signals that conflict with news
}

// ============================================================================
// 🚀 LIVE SIGNAL ENGINE CLASS
// ============================================================================

export class LiveSignalEngine {
  private analyzer: TechnicalAnalyzer;
  private newsAnalyzer: NewsAnalyzer;
  private regimeDetector: MarketRegimeDetector;
  private srDetector: SupportResistanceDetector;
  private config = TradingConfig;

  constructor() {
    this.analyzer = new TechnicalAnalyzer();
    this.newsAnalyzer = new NewsAnalyzer();
    this.regimeDetector = new MarketRegimeDetector();
    this.srDetector = new SupportResistanceDetector();
  }

  // ==========================================================================
  // 🎯 MAIN: Generate Trading Signal
  // ==========================================================================

  public async generateSignal(
    symbol: string,
    candles: Candle[],
    options: SignalGenerationOptions = {}
  ): Promise<TradingSignal | null> {
    const {
      strategy = 'balanced',
      timeframe = '15m',
      minConfidence = 60, // Default 60% confidence threshold
      enabledPairsOnly = true,
      validateWithNews = true, // Default: validate with news
      requireNewsAlignment = true, // Default: reject conflicting signals
    } = options;

    // Validate pair
    const pair = TradingPairs.getPair(symbol);
    if (!pair || (enabledPairsOnly && !pair.settings.enabled)) {
      throw new Error(`Trading pair ${symbol} is not enabled`);
    }

    // 🌊 DETECT MARKET REGIME
    console.log(`🌊 Detecting market regime for ${symbol}...`);
    const marketRegime = this.regimeDetector.detectRegime(candles);
    console.log(`   Regime: ${marketRegime.regime} (${marketRegime.confidence.toFixed(1)}% confidence)`);

    // 📊 DETECT SUPPORT/RESISTANCE LEVELS
    console.log(`📊 Detecting support/resistance levels...`);
    const srAnalysis = this.srDetector.detectLevels(candles);
    console.log(`   Found ${srAnalysis.supports.length} supports, ${srAnalysis.resistances.length} resistances`);

    // Analyze technical indicators
    const indicators = this.analyzer.analyze(candles);
    const currentPrice = candles[candles.length - 1].close;

    // Get strategy config
    const strategyConfig = this.config.getActiveStrategy();

    // Generate signal action and confidence
    let { action, confidence, strength, reasons, warnings } = 
      this.calculateSignal(indicators, strategyConfig, pair, marketRegime);

    // 🎯 VALIDATE SIGNAL WITH MARKET REGIME
    if (action !== 'HOLD') {
      const regimeCheck = this.validateAgainstRegime(action, marketRegime, confidence);
      if (!regimeCheck.isValid) {
        console.log(`❌ Signal rejected: Conflicts with market regime`);
        console.log(`   Action: ${action} | Regime: ${marketRegime.regime}`);
        return null;
      }
      confidence = regimeCheck.adjustedConfidence;
      reasons.push(...regimeCheck.reasons);
      warnings.push(...regimeCheck.warnings);
    }

    // 📊 VALIDATE ENTRY WITH S/R LEVELS
    if (action !== 'HOLD') {
      const entryCheck = this.srDetector.getEntryRecommendation(action, currentPrice, srAnalysis);
      if (!entryCheck.isGoodEntry && entryCheck.confidence < 50) {
        console.log(`⚠️ Signal weakened: Poor entry location relative to S/R`);
        confidence *= 0.8; // Reduce confidence by 20%
      }
      reasons.push(`🎯 ${entryCheck.reason}`);
      
      if (entryCheck.suggestedEntry) {
        warnings.push(`💡 Suggested entry: $${entryCheck.suggestedEntry.toFixed(2)}`);
      }
    }

    // 📍 Calculate price levels with S/R optimization
    let entryPrice = currentPrice;
    let takeProfitLevels: number[] = [];
    let stopLoss = currentPrice;
    let riskRewardRatio = 2.0;

    if (action !== 'HOLD') {
      const srLevels = this.srDetector.getOptimalLevels(action, currentPrice, srAnalysis);
      entryPrice = currentPrice;
      takeProfitLevels = srLevels.takeProfit;
      stopLoss = srLevels.stopLoss;
      riskRewardRatio = srLevels.riskReward;
    } else {
      const fallbackLevels = this.calculatePriceLevels(action, currentPrice, indicators, strategyConfig);
      entryPrice = fallbackLevels.entryPrice;
      takeProfitLevels = fallbackLevels.takeProfitLevels;
      stopLoss = fallbackLevels.stopLoss;
      riskRewardRatio = fallbackLevels.riskRewardRatio;
    }

    // 💰 Calculate position sizing (adjusted for regime)
    const regimeStrategy = this.regimeDetector.getStrategyForRegime(marketRegime.regime);
    const basePositionSize = this.calculatePositionSize(
      confidence,
      riskRewardRatio,
      indicators.atr.volatility
    );
    const recommendedPositionSize = basePositionSize * regimeStrategy.positionSizeMultiplier;

    // Format indicator summary
    const indicatorSummary = this.analyzer.formatIndicators(indicators);

    // Calculate expiration (signals valid for 1 hour by default)
    const now = Date.now();
    const expiresAt = now + (60 * 60 * 1000);

    // ✅ VALIDATE WITH NEWS (if enabled)
    let newsValidation: SignalValidation | undefined;
    let newsSentiment: NewsSentiment | undefined;
    
    if (validateWithNews && action !== 'HOLD') {
      console.log(`📰 Validating ${symbol} ${action} signal with news...`);
      
      try {
        newsValidation = await this.newsAnalyzer.validateSignal(
          symbol,
          action,
          confidence,
          reasons
        );

        newsSentiment = newsValidation.sentiment;

        // ❌ REJECT signal if news conflicts (when requireNewsAlignment = true)
        if (requireNewsAlignment && !newsValidation.isValid) {
          console.log(`❌ Signal rejected: News conflicts with technical signal`);
          console.log(`   Technical: ${action} | News: ${newsSentiment.overall}`);
          return null; // Don't generate this signal
        }

        // Update signal with combined data
        reasons = newsValidation.reasons;
        warnings = [...warnings, ...newsValidation.warnings];
        
        // Use combined confidence (technical + fundamental)
        confidence = newsValidation.combinedScore;

        console.log(`✅ News validation: ${newsValidation.isValid ? 'PASS' : 'FAIL'}`);
        console.log(`   Combined confidence: ${confidence.toFixed(1)}%`);
        
      } catch (error) {
        console.error('Error validating with news:', error);
        warnings.push('⚠️ Could not validate with news - using technical analysis only');
      }
    }

    // 🏆 CALCULATE SIGNAL QUALITY GRADE
    const qualityGrade = this.calculateQualityGrade(
      confidence,
      marketRegime,
      srAnalysis,
      newsValidation,
      indicators
    );

    // Final confidence check
    if (confidence < minConfidence) {
      console.log(`❌ Signal rejected: Confidence ${confidence.toFixed(1)}% below minimum ${minConfidence}%`);
      return null;
    }

    return {
      symbol,
      action,
      confidence,
      strength,
      qualityGrade,
      entryPrice,
      currentPrice,
      takeProfitLevels,
      stopLoss,
      indicators,
      indicatorSummary,
      reasons,
      warnings,
      newsValidation,
      newsSentiment,
      marketRegime,
      supportResistance: srAnalysis,
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
  // 🌊 Validate Signal Against Market Regime
  // ==========================================================================

  private validateAgainstRegime(
    action: SignalAction,
    regime: RegimeAnalysis,
    currentConfidence: number
  ): {
    isValid: boolean;
    adjustedConfidence: number;
    reasons: string[];
    warnings: string[];
  } {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let adjustedConfidence = currentConfidence;
    let isValid = true;

    const strategy = this.regimeDetector.getStrategyForRegime(regime.regime);

    // Add regime context
    reasons.push(`🌊 Market regime: ${regime.regime} (${regime.confidence.toFixed(1)}%)`);

    switch (regime.regime) {
      case 'trending_up':
        if (action === 'SHORT') {
          // Shorting in uptrend - risky!
          warnings.push('⚠️ Counter-trend SHORT in uptrend market');
          adjustedConfidence *= 0.7; // Heavy penalty
        } else if (action === 'LONG') {
          // With the trend - good!
          reasons.push('✅ LONG aligned with uptrend');
          adjustedConfidence *= 1.1; // Bonus
        }
        break;

      case 'trending_down':
        if (action === 'LONG') {
          // Buying in downtrend - risky!
          warnings.push('⚠️ Counter-trend LONG in downtrend market');
          adjustedConfidence *= 0.7; // Heavy penalty
        } else if (action === 'SHORT') {
          // With the trend - good!
          reasons.push('✅ SHORT aligned with downtrend');
          adjustedConfidence *= 1.1; // Bonus
        }
        break;

      case 'ranging':
        // Both directions OK in ranging market
        reasons.push('📊 Trading range-bound market - use quick scalps');
        adjustedConfidence *= 0.95; // Slight penalty (ranging harder)
        break;

      case 'volatile':
        // High volatility - be very careful
        warnings.push('⚠️ Extreme volatility detected');
        adjustedConfidence *= 0.8; // Penalty for volatility
        if (adjustedConfidence < 75) {
          isValid = false; // Reject low confidence signals in volatile markets
        }
        break;

      default:
        warnings.push('⚠️ Market regime unclear');
        adjustedConfidence *= 0.85; // Penalty for uncertainty
    }

    // Add regime recommendations
    reasons.push(...regime.recommendations);
    warnings.push(...regime.warnings);

    // Cap confidence at 90%
    adjustedConfidence = Math.min(90, adjustedConfidence);

    return {
      isValid,
      adjustedConfidence,
      reasons,
      warnings,
    };
  }

  // ==========================================================================
  // 🏆 Calculate Signal Quality Grade
  // ==========================================================================

  private calculateQualityGrade(
    confidence: number,
    regime: RegimeAnalysis,
    srAnalysis: SRAnalysis,
    newsValidation?: SignalValidation,
    indicators?: IndicatorResult
  ): 'A' | 'B' | 'C' | 'D' {
    let score = 0;

    // Factor 1: Confidence (0-30 points)
    score += (confidence / 100) * 30;

    // Factor 2: Market regime clarity (0-20 points)
    score += (regime.confidence / 100) * 20;

    // Factor 3: S/R proximity (0-15 points)
    if (srAnalysis.isNearLevel) {
      score += 15; // At key level - excellent
    } else if (srAnalysis.distanceToSupport < 3 || srAnalysis.distanceToResistance < 3) {
      score += 10; // Near level - good
    } else {
      score += 5; // Far from levels - okay
    }

    // Factor 4: News alignment (0-20 points)
    if (newsValidation) {
      if (newsValidation.isValid) {
        score += 20; // News confirms - excellent
      } else {
        score += 5; // News conflicts - poor
      }
    } else {
      score += 10; // No news - neutral
    }

    // Factor 5: Multiple indicator confluence (0-15 points)
    if (indicators) {
      let confluenceCount = 0;
      if (indicators.rsi.signal !== 'neutral') confluenceCount++;
      if (indicators.macd.crossover !== 'none') confluenceCount++;
      if (indicators.ema.crossover !== 'none') confluenceCount++;
      if (indicators.bollingerBands.squeeze) confluenceCount++;
      
      score += (confluenceCount / 4) * 15;
    }

    // Grade based on total score (0-100)
    if (score >= 80) return 'A'; // Elite signal
    if (score >= 70) return 'B'; // Good signal
    if (score >= 60) return 'C'; // Average signal
    return 'D'; // Weak signal
  }

  // ==========================================================================
  // 🎯 Calculate Signal Action & Confidence
  // ==========================================================================

  private calculateSignal(
    indicators: IndicatorResult,
    strategy: any,
    pair: TradingPair,
    regime?: RegimeAnalysis
  ): {
    action: SignalAction;
    confidence: number;
    strength: SignalStrength;
    reasons: string[];
    warnings: string[];
  } {
    // Extract strategy rules with fallback defaults
    const rules = {
      minConfidence: strategy?.minConfidenceScore || strategy?.minConfidence || 60, // Increased to 60%
      requiredIndicators: strategy?.requiredIndicators || 3, // Need at least 3 indicators
      allowShortPositions: strategy?.allowShortPositions !== false,
      minBullishScore: 40, // Minimum score to trigger LONG
      minBearishScore: 40, // Minimum score to trigger SHORT
    };
    
    const reasons: string[] = [];
    const warnings: string[] = [];
    let bullishScore = 0;
    let bearishScore = 0;
    let indicatorCount = 0; // Track how many indicators triggered

    // ========================================================================
    // RSI Analysis
    // ========================================================================
    if (indicators.rsi.extremeOversold) {
      bullishScore += 25;
      reasons.push(`🟢 RSI extremely oversold (${indicators.rsi.value.toFixed(1)})`);
      indicatorCount++;
    } else if (indicators.rsi.signal === 'oversold') {
      bullishScore += 15;
      reasons.push(`🟢 RSI oversold (${indicators.rsi.value.toFixed(1)})`);
      indicatorCount++;
    }

    if (indicators.rsi.extremeOverbought) {
      bearishScore += 25;
      reasons.push(`🔴 RSI extremely overbought (${indicators.rsi.value.toFixed(1)})`);
      indicatorCount++;
    } else if (indicators.rsi.signal === 'overbought') {
      bearishScore += 15;
      reasons.push(`🔴 RSI overbought (${indicators.rsi.value.toFixed(1)})`);
      indicatorCount++;
    }

    // ========================================================================
    // MACD Analysis
    // ========================================================================
    if (indicators.macd.crossover === 'bullish') {
      bullishScore += 20;
      reasons.push('🟢 MACD bullish crossover');
      indicatorCount++;
    } else if (indicators.macd.bullish) {
      bullishScore += 10;
      reasons.push('🟢 MACD histogram positive');
      indicatorCount++;
    }

    if (indicators.macd.crossover === 'bearish') {
      bearishScore += 20;
      reasons.push('🔴 MACD bearish crossover');
      indicatorCount++;
    } else if (indicators.macd.bearish) {
      bearishScore += 10;
      reasons.push('🔴 MACD histogram negative');
      indicatorCount++;
    }

    // ========================================================================
    // EMA Trend Analysis
    // ========================================================================
    if (indicators.ema.crossover === 'golden') {
      bullishScore += 25;
      reasons.push('🟢 Golden cross (EMA)');
      indicatorCount++;
    } else if (indicators.ema.trend === 'bullish') {
      bullishScore += 15;
      reasons.push(`🟢 Strong uptrend (EMA gap: ${indicators.ema.distance.toFixed(2)}%)`);
      indicatorCount++;
    }

    if (indicators.ema.crossover === 'death') {
      bearishScore += 25;
      reasons.push('🔴 Death cross (EMA)');
      indicatorCount++;
    } else if (indicators.ema.trend === 'bearish') {
      bearishScore += 15;
      reasons.push(`🔴 Strong downtrend (EMA gap: ${Math.abs(indicators.ema.distance).toFixed(2)}%)`);
      indicatorCount++;
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
      // ✅ REALISTIC CONFIDENCE CALCULATION
      // Base confidence from score dominance (0-100)
      const scoreDominance = Math.abs(netScore) / Math.max(totalScore, 1);
      
      // Calculate base confidence (cap at 85 to avoid unrealistic 100%)
      let baseConfidence = scoreDominance * 85;
      
      // Apply quality multipliers
      const minRequiredScore = 30; // Minimum score for valid signal
      const maxRealisticScore = 150; // Beyond this, diminishing returns
      const winningScore = Math.max(bullishScore, bearishScore);
      
      // Quality factor based on winning score strength
      let qualityFactor = 1.0;
      if (winningScore < minRequiredScore) {
        // Penalize low scores
        qualityFactor = winningScore / minRequiredScore;
      } else if (winningScore > maxRealisticScore) {
        // Cap overconfidence
        qualityFactor = 1.0 + (Math.log(winningScore / maxRealisticScore) * 0.1);
      }
      
      // Apply quality factor
      confidence = baseConfidence * qualityFactor;
      
      // Penalize conflicting signals (both scores high)
      const losingScore = Math.min(bullishScore, bearishScore);
      if (losingScore > 30) {
        const conflictRatio = losingScore / winningScore;
        confidence *= (1 - conflictRatio * 0.3); // Reduce up to 30%
      }
      
      // Volatility penalty for high ATR
      if (indicators.atr.volatility === 'high') {
        confidence *= 0.9; // -10% for high volatility
      }
      
      // Final cap at 90% (never 100% confident)
      confidence = Math.min(Math.max(confidence, 0), 90);
      
      // ✅ VALIDATION: Check if signal meets minimum requirements
      const meetsMinimumScore = (
        (netScore > 0 && bullishScore >= rules.minBullishScore) ||
        (netScore < 0 && bearishScore >= rules.minBearishScore)
      );
      
      const meetsIndicatorCount = indicatorCount >= rules.requiredIndicators;
      
      // Determine action based on all criteria
      if (netScore > 0 && confidence >= rules.minConfidence && meetsMinimumScore && meetsIndicatorCount) {
        action = 'LONG';
      } else if (netScore < 0 && confidence >= rules.minConfidence && meetsMinimumScore && meetsIndicatorCount && rules.allowShortPositions) {
        action = 'SHORT';
      } else {
        action = 'HOLD';
        if (!meetsIndicatorCount) {
          warnings.push(`⚠️ Insufficient indicators (${indicatorCount}/${rules.requiredIndicators}) - signal quality too low`);
        }
        if (!meetsMinimumScore) {
          warnings.push(`⚠️ Score too low (${Math.max(bullishScore, bearishScore)} < ${rules.minBullishScore}) - weak signal`);
        }
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
        
        // Only include valid signals (not null) that meet minimum confidence
        if (signal && signal.confidence >= (options.minConfidence || 50)) {
          signals.push(signal);
        } else if (!signal) {
          console.log(`⏭️  Skipped ${pair.symbol}: Signal rejected by news validation`);
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
