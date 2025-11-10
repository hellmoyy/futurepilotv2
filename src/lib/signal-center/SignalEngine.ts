/**
 * 🚀 SIGNAL ENGINE
 * 
 * Core engine for generating trading signals
 * Based on proven futures-scalper strategy (675% ROI backtest)
 * 
 * Features:
 * - Multi-timeframe analysis (1m, 3m, 5m)
 * - Triple confirmation system
 * - Market regime detection
 * - Volume & momentum filters
 * - Modular & reusable
 */

import { v4 as uuidv4 } from 'uuid';
import {
  TradingSignal,
  SignalEngineConfig,
  SignalAnalysisResult,
  Candle,
  MarketRegime,
  SignalStrength,
  SignalAction,
  Timeframe,
} from './types';
import {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateADX,
  calculateATR,
  calculateVolumeRatio,
  detectMarketRegime,
  checkTradingHours,
} from './indicators';

/**
 * Default configuration (proven backtest params)
 */
export const DEFAULT_CONFIG: SignalEngineConfig = {
  symbols: ['BTCUSDT'],
  primaryTimeframe: '1m',
  confirmationTimeframes: ['3m', '5m'],
  
  // Risk (2% per trade, 10x leverage)
  riskPerTrade: 0.02,
  leverage: 10,
  stopLossPercent: 0.008, // 0.8%
  takeProfitPercent: 0.008, // 0.8%
  
  // Trailing stops
  trailProfitActivate: 0.004, // +0.4%
  trailProfitDistance: 0.003, // 0.3%
  trailLossActivate: -0.003, // -0.3%
  trailLossDistance: 0.002, // 0.2%
  
  // Strategy filters
  macdMinStrength: 0.00003, // 0.003% of price
  volumeMin: 0.8,
  volumeMax: 2.0,
  adxMin: 20,
  adxMax: 50,
  rsiMin: 35,
  rsiMax: 68,
  
  // Confirmation
  entryConfirmationCandles: 2,
  marketBiasPeriod: 100,
  biasThreshold: 0.02,
  
  // Signal expiry
  signalExpiryMinutes: 5,
  
  // Broadcasting
  broadcastEnabled: true,
  broadcastChannel: 'trading-signals',
};

export class SignalEngine {
  private config: SignalEngineConfig;
  
  constructor(config?: Partial<SignalEngineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * 🔥 NEW: Load config from database
   * Use active config from Configuration tab
   */
  static async createFromDatabase(): Promise<SignalEngine> {
    try {
      // Import SignalCenterConfig (dynamic to avoid circular deps)
      const { SignalCenterConfig } = await import('@/models/SignalCenterConfig');
      
      // Get active config from database
      const activeConfig = await SignalCenterConfig.getActiveConfig();
      
      if (activeConfig) {
        console.log('✅ SignalEngine loaded config from database:', activeConfig.name);
        
        // Convert database config to SignalEngineConfig
        const engineConfig: Partial<SignalEngineConfig> = {
          symbols: activeConfig.symbols,
          primaryTimeframe: activeConfig.primaryTimeframe as Timeframe,
          confirmationTimeframes: activeConfig.confirmationTimeframes as Timeframe[],
          riskPerTrade: activeConfig.riskPerTrade,
          leverage: activeConfig.leverage,
          stopLossPercent: activeConfig.stopLossPercent,
          takeProfitPercent: activeConfig.takeProfitPercent,
          trailProfitActivate: activeConfig.trailProfitActivate,
          trailProfitDistance: activeConfig.trailProfitDistance,
          trailLossActivate: activeConfig.trailLossActivate,
          trailLossDistance: activeConfig.trailLossDistance,
          macdMinStrength: activeConfig.macdMinStrength,
          volumeMin: activeConfig.volumeMin,
          volumeMax: activeConfig.volumeMax,
          adxMin: activeConfig.adxMin,
          adxMax: activeConfig.adxMax,
          rsiMin: activeConfig.rsiMin,
          rsiMax: activeConfig.rsiMax,
          entryConfirmationCandles: activeConfig.entryConfirmationCandles,
          marketBiasPeriod: activeConfig.marketBiasPeriod,
          biasThreshold: activeConfig.biasThreshold,
          signalExpiryMinutes: activeConfig.signalExpiryMinutes,
          broadcastEnabled: activeConfig.broadcastEnabled,
          broadcastChannel: activeConfig.broadcastChannel,
        };
        
        return new SignalEngine(engineConfig);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load config from database, using DEFAULT_CONFIG:', error);
    }
    
    // Fallback to default config
    console.log('📋 SignalEngine using DEFAULT_CONFIG');
    return new SignalEngine();
  }
  
  /**
   * 🧪 Enable testing mode (relaxed thresholds)
   * Use for testing signal generation in production
   */
  enableTestingMode(): void {
    console.log('🧪 TESTING MODE ENABLED - Relaxing thresholds');
    this.config.rsiMin = 30;
    this.config.rsiMax = 70;
    this.config.adxMin = 15;
    this.config.adxMax = 60;
    this.config.volumeMin = 0.5;
    this.config.volumeMax = 3.0;
    this.config.macdMinStrength = 0.00001;
  }
  
  /**
   * 🧪 Force generate signal (bypass all filters)
   * Use ONLY for testing - generates signal with ANY market conditions
   */
  async forceGenerateSignal(
    symbol: string,
    candles1m: Candle[]
  ): Promise<SignalAnalysisResult> {
    console.log('🧪 FORCE MODE: Bypassing all filters, generating signal with current data...');
    
    const currentPrice = candles1m[candles1m.length - 1].close;
    const prices = candles1m.map(c => c.close);
    const closes = candles1m.map(c => c.close);
    
    // Calculate indicators (with null checks)
    const rsi = calculateRSI(candles1m, 14) || 50;
    const macdData = calculateMACD(candles1m, 12, 26, 9);
    const ema9Array = calculateEMA(closes, 9);
    const ema21Array = calculateEMA(closes, 21);
    const adx = calculateADX(candles1m, 14) || 0;
    const atr = calculateATR(candles1m, 14) || 0;
    
    // Safe access to indicator values
    const ema9 = Array.isArray(ema9Array) ? ema9Array[ema9Array.length - 1] : currentPrice;
    const ema21 = Array.isArray(ema21Array) ? ema21Array[ema21Array.length - 1] : currentPrice;
    const macdHist = macdData ? macdData.histogram : 0;
    const macdValue = macdData ? macdData.value : 0;
    const macdSignal = macdData ? macdData.signal : 0;
    
    // Determine action based on EMA trend
    const action: SignalAction = ema9 > ema21 ? 'BUY' : 'SELL';
    
    // Determine strength based on RSI
    let strength: SignalStrength = 'MODERATE';
    if (rsi > 60 || rsi < 40) strength = 'STRONG';
    if (rsi > 65 || rsi < 35) strength = 'VERY_STRONG';
    
    const signal: TradingSignal = {
      id: uuidv4(),
      symbol,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.signalExpiryMinutes * 60 * 1000,
      action,
      strength,
      confidence: 50, // 0-100 scale for force mode
      entryPrice: currentPrice,
      stopLoss: action === 'BUY' 
        ? currentPrice * (1 - this.config.stopLossPercent)
        : currentPrice * (1 + this.config.stopLossPercent),
      takeProfit: action === 'BUY'
        ? currentPrice * (1 + this.config.takeProfitPercent)
        : currentPrice * (1 - this.config.takeProfitPercent),
      riskRewardRatio: 1.0,
      maxLossPercent: this.config.stopLossPercent * 100,
      maxProfitPercent: this.config.takeProfitPercent * 100,
      marketRegime: 'NEUTRAL',
      trend: ema9 > ema21 ? 'BULLISH' : 'BEARISH',
      volatility: atr / currentPrice * 100,
      indicators: {
        rsi,
        macd: {
          value: macdValue,
          signal: macdSignal,
          histogram: macdHist,
        },
        ema: {
          fast: ema9,
          slow: ema21,
        },
        adx,
        volume: {
          current: candles1m[candles1m.length - 1].volume,
          average: candles1m[candles1m.length - 1].volume,
          ratio: 1.0,
        },
      },
      timeframes: {
        '1m': {
          signal: action,
          confidence: 50,
          trend: ema9 > ema21 ? 'BULLISH' : 'BEARISH',
        },
      },
      trailingStop: {
        profitActivate: this.config.trailProfitActivate * 100,
        profitDistance: this.config.trailProfitDistance * 100,
        lossActivate: this.config.trailLossActivate * 100,
        lossDistance: this.config.trailLossDistance * 100,
      },
      reason: '🧪 FORCE MODE - Testing signal generation (all filters bypassed)',
      strategy: 'futures-scalper',
      status: 'ACTIVE',
    };
    
    return {
      signal,
      passed: true,
      filters: {
        timeCheck: { passed: true, reason: 'FORCE MODE - Bypassed' },
        volumeCheck: { passed: true, reason: 'FORCE MODE - Bypassed' },
        marketRegime: { passed: true, reason: 'FORCE MODE - Bypassed' },
        multiTimeframe: { passed: true, reason: 'FORCE MODE - Bypassed' },
        indicators: { passed: true, reason: 'FORCE MODE - Bypassed' },
      },
      marketData: {
        symbol,
        price: currentPrice,
        volume: candles1m[candles1m.length - 1].volume,
        change24h: 0,
      },
    };
  }
  
  /**
   * Analyze market and generate signal
   */
  async analyze(
    symbol: string,
    candles1m: Candle[],
    candles3m?: Candle[],
    candles5m?: Candle[]
  ): Promise<SignalAnalysisResult> {
    const result: SignalAnalysisResult = {
      signal: null,
      passed: false,
      filters: {
        timeCheck: { passed: false, reason: '' },
        volumeCheck: { passed: false, reason: '' },
        marketRegime: { passed: false, reason: '' },
        multiTimeframe: { passed: false, reason: '' },
        indicators: { passed: false, reason: '' },
      },
      marketData: {
        symbol,
        price: candles1m[candles1m.length - 1].close,
        volume: candles1m[candles1m.length - 1].volume,
        change24h: 0,
      },
    };
    
    // FILTER 1: Trading Hours
    const timeCheck = checkTradingHours();
    result.filters.timeCheck = {
      passed: timeCheck.shouldTrade,
      reason: timeCheck.reason,
    };
    
    if (!timeCheck.shouldTrade) {
      return result;
    }
    
    // FILTER 2: Market Regime
    const regime = detectMarketRegime(
      candles1m,
      this.config.marketBiasPeriod,
      this.config.biasThreshold
    );
    
    result.filters.marketRegime = {
      passed: regime.regime !== 'RANGING' && regime.regime !== 'VOLATILE',
      reason: `Market: ${regime.regime} (${regime.strength.toFixed(2)}% strength)`,
    };
    
    if (regime.regime === 'RANGING' || regime.regime === 'VOLATILE') {
      return result;
    }
    
    // FILTER 3: Volume Confirmation
    const volumeRatio = calculateVolumeRatio(candles1m, 20);
    result.filters.volumeCheck = {
      passed: volumeRatio >= this.config.volumeMin && volumeRatio <= this.config.volumeMax,
      reason: `Volume: ${volumeRatio.toFixed(2)}x average (${this.config.volumeMin}-${this.config.volumeMax}x)`,
    };
    
    if (volumeRatio < this.config.volumeMin || volumeRatio > this.config.volumeMax) {
      return result;
    }
    
    // FILTER 4: Multi-Timeframe Confirmation
    const mtfAnalysis = this.analyzeMultiTimeframe(
      candles1m,
      candles3m || candles1m,
      candles5m || candles1m
    );
    
    result.filters.multiTimeframe = {
      passed: mtfAnalysis.aligned,
      reason: mtfAnalysis.reason,
    };
    
    if (!mtfAnalysis.aligned) {
      return result;
    }
    
    // FILTER 5: Technical Indicators
    const currentPrice = candles1m[candles1m.length - 1].close;
    const prices = candles1m.map(c => c.close);
    
    const rsi = calculateRSI(candles1m, 14);
    const macd = calculateMACD(candles1m, 12, 26, 9);
    const emaFast = calculateEMA(prices, 9);
    const emaSlow = calculateEMA(prices, 21);
    const adx = calculateADX(candles1m, 14);
    const atr = calculateATR(candles1m, 14);
    
    if (!emaFast || !emaSlow || !macd) {
      result.filters.indicators = {
        passed: false,
        reason: 'Insufficient data for indicators',
      };
      return result;
    }
    
    // Check indicator ranges
    const macdStrength = Math.abs(macd.histogram / currentPrice);
    const rsiInRange = rsi >= this.config.rsiMin && rsi <= this.config.rsiMax;
    const adxInRange = adx >= this.config.adxMin && adx <= this.config.adxMax;
    const macdStrong = macdStrength >= this.config.macdMinStrength;
    
    result.filters.indicators = {
      passed: rsiInRange && adxInRange && macdStrong,
      reason: `RSI:${rsi.toFixed(1)} ADX:${adx.toFixed(1)} MACD:${(macdStrength * 100).toFixed(4)}%`,
    };
    
    if (!rsiInRange || !adxInRange || !macdStrong) {
      return result;
    }
    
    // ALL FILTERS PASSED - Generate Signal
    result.passed = true;
    
    const signal = this.generateSignal(
      symbol,
      mtfAnalysis.action,
      currentPrice,
      {
        rsi,
        macd,
        emaFast,
        emaSlow,
        adx,
        atr,
        volumeRatio,
        regime,
      },
      mtfAnalysis.confidence
    );
    
    result.signal = signal;
    return result;
  }
  
  /**
   * Analyze multiple timeframes for confirmation
   */
  private analyzeMultiTimeframe(
    candles1m: Candle[],
    candles3m: Candle[],
    candles5m: Candle[]
  ): {
    aligned: boolean;
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reason: string;
  } {
    const tf1m = this.analyzeSingleTimeframe(candles1m, '1m');
    const tf3m = this.analyzeSingleTimeframe(candles3m, '3m');
    const tf5m = this.analyzeSingleTimeframe(candles5m, '5m');
    
    // Check alignment
    if (tf1m.signal === 'HOLD' || tf3m.signal === 'HOLD' || tf5m.signal === 'HOLD') {
      return {
        aligned: false,
        action: 'HOLD',
        confidence: 0,
        reason: 'One or more timeframes show HOLD',
      };
    }
    
    // All timeframes must agree
    if (tf1m.signal === tf3m.signal && tf3m.signal === tf5m.signal) {
      const avgConfidence = (tf1m.confidence + tf3m.confidence + tf5m.confidence) / 3;
      
      return {
        aligned: true,
        action: tf1m.signal,
        confidence: avgConfidence,
        reason: `All timeframes aligned: ${tf1m.signal}`,
      };
    }
    
    return {
      aligned: false,
      action: 'HOLD',
      confidence: 0,
      reason: 'Timeframes not aligned',
    };
  }
  
  /**
   * Analyze single timeframe
   */
  private analyzeSingleTimeframe(
    candles: Candle[],
    timeframe: string
  ): {
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reason: string;
  } {
    if (candles.length < 50) {
      return { signal: 'HOLD', confidence: 0, reason: 'Insufficient data' };
    }
    
    const prices = candles.map(c => c.close);
    const currentPrice = prices[prices.length - 1];
    
    const emaFast = calculateEMA(prices, 9);
    const emaSlow = calculateEMA(prices, 21);
    const rsi = calculateRSI(candles, 14);
    const macd = calculateMACD(candles, 12, 26, 9);
    
    if (!emaFast || !emaSlow || !macd) {
      return { signal: 'HOLD', confidence: 0, reason: 'Indicator error' };
    }
    
    // BUY Conditions
    if (
      emaFast > emaSlow &&
      rsi > this.config.rsiMin &&
      rsi < this.config.rsiMax &&
      macd.histogram > 0
    ) {
      const emaGap = ((emaFast - emaSlow) / currentPrice) * 100;
      const rsiScore = rsi > 50 ? rsi - 50 : (50 - rsi) * 0.5;
      const macdStrength = Math.abs(macd.histogram / currentPrice) * 100;
      
      const confidence = Math.min(
        100,
        50 + emaGap * 1000 + rsiScore + macdStrength * 10000
      );
      
      return {
        signal: 'BUY',
        confidence,
        reason: `${timeframe}: Bullish EMA cross, RSI ${rsi.toFixed(1)}`,
      };
    }
    
    // SELL Conditions
    if (
      emaFast < emaSlow &&
      rsi > this.config.rsiMin &&
      rsi < this.config.rsiMax &&
      macd.histogram < 0
    ) {
      const emaGap = ((emaSlow - emaFast) / currentPrice) * 100;
      const rsiScore = rsi < 50 ? 50 - rsi : (rsi - 50) * 0.5;
      const macdStrength = Math.abs(macd.histogram / currentPrice) * 100;
      
      const confidence = Math.min(
        100,
        50 + emaGap * 1000 + rsiScore + macdStrength * 10000
      );
      
      return {
        signal: 'SELL',
        confidence,
        reason: `${timeframe}: Bearish EMA cross, RSI ${rsi.toFixed(1)}`,
      };
    }
    
    return {
      signal: 'HOLD',
      confidence: 0,
      reason: `${timeframe}: No clear signal`,
    };
  }
  
  /**
   * Generate final signal object
   */
  private generateSignal(
    symbol: string,
    action: 'BUY' | 'SELL' | 'HOLD',
    entryPrice: number,
    indicators: any,
    confidence: number
  ): TradingSignal {
    const timestamp = Date.now();
    const expiresAt = timestamp + this.config.signalExpiryMinutes * 60 * 1000;
    
    // Calculate stop loss & take profit
    const stopLoss =
      action === 'BUY'
        ? entryPrice * (1 - this.config.stopLossPercent)
        : entryPrice * (1 + this.config.stopLossPercent);
    
    const takeProfit =
      action === 'BUY'
        ? entryPrice * (1 + this.config.takeProfitPercent)
        : entryPrice * (1 - this.config.takeProfitPercent);
    
    const riskRewardRatio = Math.abs(takeProfit - entryPrice) / Math.abs(entryPrice - stopLoss);
    
    // Determine signal strength
    let strength: SignalStrength = 'MODERATE';
    if (confidence >= 90) strength = 'VERY_STRONG';
    else if (confidence >= 75) strength = 'STRONG';
    else if (confidence < 60) strength = 'WEAK';
    
    return {
      id: uuidv4(),
      symbol,
      timestamp,
      expiresAt,
      action,
      strength,
      confidence,
      entryPrice,
      stopLoss,
      takeProfit,
      riskRewardRatio,
      maxLossPercent: this.config.stopLossPercent,
      maxProfitPercent: this.config.takeProfitPercent,
      marketRegime: indicators.regime.regime as MarketRegime,
      trend: indicators.emaFast > indicators.emaSlow ? 'UPTREND' : 'DOWNTREND',
      volatility: (indicators.atr / entryPrice) * 100,
      indicators: {
        rsi: indicators.rsi,
        macd: {
          value: indicators.macd.value,
          signal: indicators.macd.signal,
          histogram: indicators.macd.histogram,
        },
        ema: {
          fast: indicators.emaFast,
          slow: indicators.emaSlow,
        },
        adx: indicators.adx,
        volume: {
          current: 0,
          average: 0,
          ratio: indicators.volumeRatio,
        },
      },
      timeframes: {
        '1m': {
          signal: action,
          confidence,
          trend: indicators.emaFast > indicators.emaSlow ? 'UPTREND' : 'DOWNTREND',
        },
      },
      trailingStop: {
        profitActivate: this.config.trailProfitActivate,
        profitDistance: this.config.trailProfitDistance,
        lossActivate: this.config.trailLossActivate,
        lossDistance: this.config.trailLossDistance,
      },
      reason: `${action} signal: ${strength} (${confidence.toFixed(1)}% confidence)`,
      strategy: 'futures-scalper',
      status: 'ACTIVE',
    };
  }
  
  /**
   * Update config
   */
  updateConfig(config: Partial<SignalEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current config
   */
  getConfig(): SignalEngineConfig {
    return { ...this.config };
  }
}
