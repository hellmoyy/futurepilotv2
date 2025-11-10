import { BinanceClient } from '../binance';
import { openai } from '../openai';
import { SafetyManager } from './SafetyManager';
import { TradeManager } from './TradeManager';
import { PositionMonitor } from './PositionMonitor';
import { beforeTrade, afterTrade } from './hooks';
import {
  createTradeExecution,
  closeTradeExecution,
  updateBotStatistics,
  calculateTradeFees,
} from './tradeTracking';

export interface TradingConfig {
  symbol: string;
  leverage: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  positionSizePercent: number; // % of balance to use per trade
  maxDailyLoss: number; // Maximum loss per day in USDT
  // Tier 1 - Critical Features
  trailingStopLoss?: {
    enabled: boolean;
    distance: number; // % trailing distance
  };
  maxPositionSize?: number; // Maximum position size in USDT
  maxConcurrentPositions?: number; // Max number of concurrent positions
  maxDailyTrades?: number; // Max trades per day
  // Tier 2 - Important Features
  breakEvenStop?: {
    enabled: boolean;
    triggerProfit: number; // % profit to trigger break even
  };
  partialTakeProfit?: {
    enabled: boolean;
    levels: Array<{
      profit: number; // % profit level
      closePercent: number; // % of position to close
    }>;
  };
}

export interface Position {
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  quantity: number;
  leverage: number;
  stopLoss: number;
  takeProfit: number;
  pnl: number;
  pnlPercent: number;
  openTime: Date;
}

export interface TradeSignal {
  action: 'BUY' | 'SELL' | 'CLOSE' | 'HOLD';
  confidence: number; // 0-100
  reason: string;
  atr?: number; // Optional ATR for dynamic stop loss
  indicators?: {
    rsi?: number;
    macd?: { macd: number; signal: number; histogram: number };
    ema?: { ema20: number; ema50: number; ema200: number };
    trend?: string;
  };
}

export class TradingEngine {
  private config: TradingConfig;
  private userId: string;
  private binanceApiKey: string;
  private binanceApiSecret: string;
  private dailyPnL: number = 0;
  private lastResetDate: Date = new Date();
  protected safetyManager: SafetyManager | null = null;
  protected botInstanceId: string | null = null;
  private currentTradeId: string | null = null; // Track current trade record
  private positionMonitor: PositionMonitor | null = null; // Position monitor instance
  private exchangeConnectionId: string | null = null; // Track exchange connection
  private botId: number | null = null; // Track bot ID
  private botName: string | null = null; // Track bot name
  // 📊 Advanced Risk Management Counters
  private dailyTradeCount: number = 0;
  private lastTradeResetDate: Date = new Date();

  constructor(
    userId: string,
    config: TradingConfig,
    apiKey: string,
    apiSecret: string,
    botInstanceId?: string,
    exchangeConnectionId?: string,
    botId?: number,
    botName?: string
  ) {
    this.userId = userId;
    this.config = config;
    this.binanceApiKey = apiKey;
    this.binanceApiSecret = apiSecret;
    this.exchangeConnectionId = exchangeConnectionId || null;
    this.botId = botId || null;
    this.botName = botName || null;
    
    if (botInstanceId) {
      this.botInstanceId = botInstanceId;
      this.safetyManager = new SafetyManager(botInstanceId, userId, config);
    }
  }

  // Get current market data
  async getMarketData(symbol: string, interval: string = '15m', limit: number = 100) {
    try {
      const binance = new BinanceClient(this.binanceApiKey, this.binanceApiSecret);
      const candles = await binance.futuresCandles({
        symbol,
        interval,
        limit,
      });

      return candles.map((candle: any) => ({
        timestamp: candle.openTime,
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseFloat(candle.volume),
      }));
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  }

  // Calculate technical indicators
  calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    return rsi;
  }

  calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;

    // For signal line, we'd need to calculate EMA of MACD values
    // Simplified version here
    const signal = macd * 0.9; // Approximation
    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  // ============================================================================
  // 🚀 ACCURACY IMPROVEMENTS
  // ============================================================================

  /**
   * 📊 Calculate ATR (Average True Range) for volatility-based stop loss
   */
  calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
    if (highs.length < period + 1) return 0;

    const trueRanges: number[] = [];
    
    for (let i = 1; i < highs.length; i++) {
      const high = highs[i];
      const low = lows[i];
      const prevClose = closes[i - 1];
      
      // True Range = max of:
      // 1. Current High - Current Low
      // 2. abs(Current High - Previous Close)
      // 3. abs(Current Low - Previous Close)
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      
      trueRanges.push(tr);
    }

    // Calculate average of last 'period' true ranges
    const recentTR = trueRanges.slice(-period);
    const atr = recentTR.reduce((sum, tr) => sum + tr, 0) / period;
    
    return atr;
  }

  /**
   * 📊 Check volume confirmation for signal strength
   */
  checkVolumeConfirmation(candles: any[]): { 
    confidence: number; 
    reason: string;
    volumeRatio: number;
  } {
    if (candles.length < 20) {
      return { confidence: 0, reason: 'Insufficient data', volumeRatio: 1 };
    }

    const volumes = candles.map((c: any) => c.volume);
    const recentVolumes = volumes.slice(-20, -1); // Last 20 excluding current
    const avgVolume = recentVolumes.reduce((sum: number, v: number) => sum + v, 0) / recentVolumes.length;
    const currentVolume = volumes[volumes.length - 1];
    
    const volumeRatio = currentVolume / avgVolume;
    
    // Volume surge (50%+ above average) = strong confirmation
    if (volumeRatio >= 1.5) {
      return {
        confidence: +10,
        reason: `🔊 High volume surge (${volumeRatio.toFixed(2)}x average) - strong signal confirmation`,
        volumeRatio
      };
    }
    
    // Low volume (<80% of average) = weak signal
    if (volumeRatio < 0.8) {
      return {
        confidence: -15,
        reason: `⚠️ Low volume (${volumeRatio.toFixed(2)}x average) - signal weakened`,
        volumeRatio
      };
    }
    
    // Normal volume
    return {
      confidence: 0,
      reason: `📊 Normal volume (${volumeRatio.toFixed(2)}x average)`,
      volumeRatio
    };
  }

  /**
   * ⏰ Check if current time is optimal for trading
   */
  checkTradingHours(): {
    shouldTrade: boolean;
    confidence: number;
    reason: string;
  } {
    const now = new Date();
    const hour = now.getUTCHours();
    const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
    
    // Avoid very low liquidity hours (Asia late night: 0-3 UTC)
    if (hour >= 0 && hour <= 3) {
      return {
        shouldTrade: false,
        confidence: -20,
        reason: '🌙 Low liquidity hours (0-3 UTC) - trading paused'
      };
    }
    
    // High volatility/volume hours (good for trading)
    // London open: 7-9 UTC, NY open: 13-15 UTC
    if ((hour >= 7 && hour <= 9) || (hour >= 13 && hour <= 15)) {
      return {
        shouldTrade: true,
        confidence: +5,
        reason: '🔥 High volume hours (London/NY session) - optimal trading time'
      };
    }
    
    // Weekend (crypto still trades but typically lower volume)
    if (day === 0 || day === 6) {
      return {
        shouldTrade: true,
        confidence: -5,
        reason: '📅 Weekend trading - slightly lower confidence'
      };
    }
    
    // Normal trading hours
    return {
      shouldTrade: true,
      confidence: 0,
      reason: '✅ Normal trading hours'
    };
  }

  /**
   * 🛡️ Calculate optimal stop loss based on ATR (dynamic)
   */
  calculateOptimalStopLoss(
    entryPrice: number,
    side: 'LONG' | 'SHORT',
    atr: number
  ): {
    stopLoss: number;
    stopLossPercent: number;
    reason: string;
  } {
    // ATR-based stop loss (2x ATR is standard)
    const atrMultiplier = 2.0;
    const atrStopDistance = (atr / entryPrice) * 100 * atrMultiplier;
    
    // Clamp between 2% (minimum) and 5% (maximum)
    const stopLossPercent = Math.max(2, Math.min(5, atrStopDistance));
    
    const stopLoss = side === 'LONG'
      ? entryPrice * (1 - stopLossPercent / 100)
      : entryPrice * (1 + stopLossPercent / 100);
    
    return {
      stopLoss,
      stopLossPercent,
      reason: `ATR-based dynamic SL: ${stopLossPercent.toFixed(2)}% (ATR: ${atr.toFixed(2)}, ${atrStopDistance.toFixed(2)}% raw)`
    };
  }

  /**
   * 🎯 MARKET REGIME FILTER - Detect market condition
   * Returns: TRENDING_UP, TRENDING_DOWN, RANGING, CHOPPY
   * 
   * Algorithm:
   * 1. ADX (Average Directional Index) - Trend strength
   * 2. Price vs EMAs - Trend direction
   * 3. ATR volatility - Market behavior
   */
  detectMarketRegime(
    prices: number[],
    highs: number[],
    lows: number[],
    ema20: number,
    ema50: number,
    ema200: number
  ): {
    regime: 'TRENDING_UP' | 'TRENDING_DOWN' | 'RANGING' | 'CHOPPY';
    shouldTrade: boolean;
    confidence: number;
    reason: string;
    adx: number;
  } {
    const currentPrice = prices[prices.length - 1];
    
    // 1. Calculate ADX (Average Directional Index) for trend strength
    const adx = this.calculateADX(highs, lows, prices, 14);
    
    // 2. Determine trend direction using EMAs
    const isAboveEMAs = currentPrice > ema20 && ema20 > ema50 && ema50 > ema200;
    const isBelowEMAs = currentPrice < ema20 && ema20 < ema50 && ema50 < ema200;
    
    // 3. Calculate ATR for volatility
    const atr = this.calculateATR(highs, lows, prices, 14);
    const atrPercent = (atr / currentPrice) * 100;
    
    // 4. Calculate price range (highest high - lowest low) / current price
    const recentPrices = prices.slice(-20);
    const highestHigh = Math.max(...recentPrices);
    const lowestLow = Math.min(...recentPrices);
    const priceRangePercent = ((highestHigh - lowestLow) / currentPrice) * 100;
    
    // 5. REGIME DETECTION LOGIC
    
    // ADX Interpretation:
    // < 20: Weak/no trend (ranging/choppy)
    // 20-25: Emerging trend
    // 25-50: Strong trend (IDEAL FOR TRADING!)
    // > 50: Very strong trend (watch for exhaustion)
    
    if (adx < 20) {
      // WEAK TREND - Ranging or Choppy
      if (priceRangePercent < 2) {
        // Low volatility = RANGING (tight consolidation)
        return {
          regime: 'RANGING',
          shouldTrade: false,
          confidence: -20,
          reason: `📊 RANGING Market (ADX: ${adx.toFixed(1)}, Range: ${priceRangePercent.toFixed(1)}%) - Avoid trading, wait for breakout`,
          adx
        };
      } else {
        // High volatility but no trend = CHOPPY (noise)
        return {
          regime: 'CHOPPY',
          shouldTrade: false,
          confidence: -30,
          reason: `⚠️ CHOPPY Market (ADX: ${adx.toFixed(1)}, ATR: ${atrPercent.toFixed(1)}%) - High risk, no clear direction`,
          adx
        };
      }
    } else if (adx >= 20 && adx < 25) {
      // EMERGING TREND - Be cautious
      if (isAboveEMAs) {
        return {
          regime: 'TRENDING_UP',
          shouldTrade: true,
          confidence: +5,
          reason: `📈 Emerging UPTREND (ADX: ${adx.toFixed(1)}) - Moderate confidence, trend forming`,
          adx
        };
      } else if (isBelowEMAs) {
        return {
          regime: 'TRENDING_DOWN',
          shouldTrade: true,
          confidence: +5,
          reason: `📉 Emerging DOWNTREND (ADX: ${adx.toFixed(1)}) - Moderate confidence, trend forming`,
          adx
        };
      } else {
        // EMAs not aligned = still ranging
        return {
          regime: 'RANGING',
          shouldTrade: false,
          confidence: -15,
          reason: `📊 Weak trend signal (ADX: ${adx.toFixed(1)}, EMAs not aligned) - Wait for clarity`,
          adx
        };
      }
    } else if (adx >= 25 && adx <= 50) {
      // STRONG TREND - IDEAL FOR TRADING! 🎯
      if (isAboveEMAs) {
        return {
          regime: 'TRENDING_UP',
          shouldTrade: true,
          confidence: +15,
          reason: `🚀 Strong UPTREND (ADX: ${adx.toFixed(1)}) - Excellent trading conditions!`,
          adx
        };
      } else if (isBelowEMAs) {
        return {
          regime: 'TRENDING_DOWN',
          shouldTrade: true,
          confidence: +15,
          reason: `🔻 Strong DOWNTREND (ADX: ${adx.toFixed(1)}) - Excellent trading conditions!`,
          adx
        };
      } else {
        // High ADX but EMAs not aligned = transitioning
        return {
          regime: 'CHOPPY',
          shouldTrade: false,
          confidence: -10,
          reason: `⚠️ Trend transition (ADX: ${adx.toFixed(1)}, EMAs misaligned) - Wait for direction`,
          adx
        };
      }
    } else {
      // ADX > 50 - Very strong trend (watch for exhaustion)
      if (isAboveEMAs) {
        return {
          regime: 'TRENDING_UP',
          shouldTrade: true,
          confidence: +10,
          reason: `📈 Very strong UPTREND (ADX: ${adx.toFixed(1)}) - Caution: possible exhaustion`,
          adx
        };
      } else if (isBelowEMAs) {
        return {
          regime: 'TRENDING_DOWN',
          shouldTrade: true,
          confidence: +10,
          reason: `📉 Very strong DOWNTREND (ADX: ${adx.toFixed(1)}) - Caution: possible exhaustion`,
          adx
        };
      } else {
        return {
          regime: 'CHOPPY',
          shouldTrade: false,
          confidence: -15,
          reason: `⚠️ Extreme volatility (ADX: ${adx.toFixed(1)}) - High risk environment`,
          adx
        };
      }
    }
  }

  /**
   * 📊 Calculate ADX (Average Directional Index)
   * Measures trend strength (0-100, typically 0-60)
   */
  private calculateADX(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number = 14
  ): number {
    if (highs.length < period + 1) return 0;
    
    const trueRanges: number[] = [];
    const plusDM: number[] = [];
    const minusDM: number[] = [];
    
    // Calculate True Range, +DM, -DM
    for (let i = 1; i < highs.length; i++) {
      const high = highs[i];
      const low = lows[i];
      const prevHigh = highs[i - 1];
      const prevLow = lows[i - 1];
      const prevClose = closes[i - 1];
      
      // True Range
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      trueRanges.push(Math.max(tr1, tr2, tr3));
      
      // Directional Movement
      const highDiff = high - prevHigh;
      const lowDiff = prevLow - low;
      
      if (highDiff > lowDiff && highDiff > 0) {
        plusDM.push(highDiff);
        minusDM.push(0);
      } else if (lowDiff > highDiff && lowDiff > 0) {
        plusDM.push(0);
        minusDM.push(lowDiff);
      } else {
        plusDM.push(0);
        minusDM.push(0);
      }
    }
    
    // Calculate smoothed TR, +DM, -DM
    const smoothTR = this.smoothedAverage(trueRanges, period);
    const smoothPlusDM = this.smoothedAverage(plusDM, period);
    const smoothMinusDM = this.smoothedAverage(minusDM, period);
    
    // Calculate +DI and -DI
    const plusDI = (smoothPlusDM / smoothTR) * 100;
    const minusDI = (smoothMinusDM / smoothTR) * 100;
    
    // Calculate DX
    const dx = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
    
    // ADX is smoothed DX
    // For simplicity, return DX (in production, smooth over 14 periods)
    return Math.min(100, dx);
  }

  /**
   * Calculate smoothed average (similar to EMA)
   */
  private smoothedAverage(values: number[], period: number): number {
    if (values.length < period) return 0;
    
    // Simple average of last 'period' values
    const recentValues = values.slice(-period);
    const sum = recentValues.reduce((a, b) => a + b, 0);
    return sum / period;
  }

  // Get current position
  async getCurrentPosition(): Promise<Position | null> {
    try {
      const binance = new BinanceClient(this.binanceApiKey, this.binanceApiSecret);
      const positions = await binance.futuresPositionRisk();

      const position = positions.find(
        (p: any) => p.symbol === this.config.symbol && parseFloat(p.positionAmt) !== 0
      );

      if (!position) return null;

      const positionAmt = parseFloat(position.positionAmt);
      const entryPrice = parseFloat(position.entryPrice);
      const markPrice = parseFloat(position.markPrice);
      const unRealizedProfit = parseFloat(position.unRealizedProfit);

      return {
        symbol: position.symbol,
        side: positionAmt > 0 ? 'LONG' : 'SHORT',
        entryPrice,
        quantity: Math.abs(positionAmt),
        leverage: parseInt(position.leverage),
        stopLoss: entryPrice * (1 - this.config.stopLossPercent / 100),
        takeProfit: entryPrice * (1 + this.config.takeProfitPercent / 100),
        pnl: unRealizedProfit,
        pnlPercent: (unRealizedProfit / (entryPrice * Math.abs(positionAmt))) * 100,
        openTime: new Date(),
      };
    } catch (error) {
      console.error('Error getting position:', error);
      return null;
    }
  }

  // Get account balance
  async getBalance(): Promise<number> {
    try {
      const binance = new BinanceClient(this.binanceApiKey, this.binanceApiSecret);
      const account = await binance.futuresAccountBalance();
      const usdtBalance = account.find((b: any) => b.asset === 'USDT');
      return parseFloat(usdtBalance?.balance || '0');
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  // Set leverage for symbol
  async setLeverage(leverage: number): Promise<void> {
    try {
      const binance = new BinanceClient(this.binanceApiKey, this.binanceApiSecret);
      await binance.futuresLeverage({
        symbol: this.config.symbol,
        leverage: leverage.toString(),
      });
    } catch (error) {
      console.error('Error setting leverage:', error);
      throw error;
    }
  }

  // Execute market order
  async executeOrder(
    side: 'BUY' | 'SELL',
    quantity: number
  ): Promise<any> {
    try {
      const binance = new BinanceClient(this.binanceApiKey, this.binanceApiSecret);

      // Set leverage first
      await this.setLeverage(this.config.leverage);

      // Place market order
      const order = await binance.futuresOrder({
        symbol: this.config.symbol,
        side,
        type: 'MARKET',
        quantity: quantity.toString(),
      });

      // Get entry price
      const entryPrice = await this.getCurrentPrice();

      // Calculate stop loss and take profit prices
      const stopLossPrice =
        side === 'BUY'
          ? entryPrice * (1 - this.config.stopLossPercent / 100)
          : entryPrice * (1 + this.config.stopLossPercent / 100);

      const takeProfitPrice =
        side === 'BUY'
          ? entryPrice * (1 + this.config.takeProfitPercent / 100)
          : entryPrice * (1 - this.config.takeProfitPercent / 100);

      // Create Trade record (old system - still used for compatibility)
      try {
        const trade = await TradeManager.createTrade({
          userId: this.userId,
          botInstanceId: this.botInstanceId || undefined,
          symbol: this.config.symbol,
          type: side === 'BUY' ? 'buy' : 'sell',
          side: side === 'BUY' ? 'long' : 'short',
          entryPrice,
          quantity,
          stopLoss: stopLossPrice,
          takeProfit: takeProfitPrice,
          exchange: 'binance',
          leverage: this.config.leverage,
          notes: `Order ID: ${order.orderId}, Entry: $${entryPrice}, SL: $${stopLossPrice.toFixed(2)}, TP: $${takeProfitPrice.toFixed(2)}`,
        });

        // Store trade ID for later reference
        this.currentTradeId = trade._id.toString();

        console.log(`✅ Trade record created (old): ${this.currentTradeId}`);
      } catch (tradeError) {
        console.error('❌ Failed to create trade record:', tradeError);
        // Don't throw - order was placed successfully
      }

      // Create TradeExecution record (NEW - for real tracking)
      if (this.botInstanceId && this.exchangeConnectionId && this.botId && this.botName) {
        try {
          const tradeExecutionId = await createTradeExecution({
            userId: this.userId,
            botInstanceId: this.botInstanceId,
            botId: this.botId,
            botName: this.botName,
            symbol: this.config.symbol,
            side: side === 'BUY' ? 'LONG' : 'SHORT',
            entryPrice,
            quantity,
            leverage: this.config.leverage,
            stopLoss: stopLossPrice,
            takeProfit: takeProfitPrice,
            exchangeConnectionId: this.exchangeConnectionId,
            orderId: order.orderId?.toString(),
          });

          // Override currentTradeId with TradeExecution ID
          this.currentTradeId = tradeExecutionId;

          console.log(`✅ TradeExecution record created: ${tradeExecutionId}`);
          console.log(`   ${side} ${quantity} ${this.config.symbol} @ $${entryPrice}`);
          console.log(`   SL: $${stopLossPrice.toFixed(2)} | TP: $${takeProfitPrice.toFixed(2)}`);
        } catch (execError) {
          console.error('❌ Failed to create TradeExecution record:', execError);
          // Don't throw - order was placed successfully
        }
      }

      return order;
    } catch (error) {
      console.error('Error executing order:', error);
      throw error;
    }
  }

  // Place stop loss and take profit orders
  async placeStopOrders(
    side: 'LONG' | 'SHORT',
    quantity: number,
    entryPrice: number,
    atr?: number // Optional ATR for dynamic stop loss
  ): Promise<void> {
    try {
      const binance = new BinanceClient(this.binanceApiKey, this.binanceApiSecret);

      // 📊 Use ATR-based dynamic stop loss if available
      let stopLossPercent = this.config.stopLossPercent;
      
      if (atr && atr > 0) {
        const optimalSL = this.calculateOptimalStopLoss(entryPrice, side, atr);
        stopLossPercent = optimalSL.stopLossPercent;
        console.log(`📊 Dynamic Stop Loss: ${stopLossPercent.toFixed(2)}% (${optimalSL.reason})`);
      } else {
        console.log(`📊 Fixed Stop Loss: ${stopLossPercent}% (no ATR data)`);
      }

      const stopLossPrice =
        side === 'LONG'
          ? entryPrice * (1 - stopLossPercent / 100)
          : entryPrice * (1 + stopLossPercent / 100);

      const takeProfitPrice =
        side === 'LONG'
          ? entryPrice * (1 + this.config.takeProfitPercent / 100)
          : entryPrice * (1 - this.config.takeProfitPercent / 100);

      // Stop Loss
      await binance.futuresOrder({
        symbol: this.config.symbol,
        side: side === 'LONG' ? 'SELL' : 'BUY',
        type: 'STOP_MARKET',
        stopPrice: stopLossPrice.toFixed(2),
        quantity: quantity.toString(),
        closePosition: 'true',
      });

      // Take Profit
      await binance.futuresOrder({
        symbol: this.config.symbol,
        side: side === 'LONG' ? 'SELL' : 'BUY',
        type: 'TAKE_PROFIT_MARKET',
        stopPrice: takeProfitPrice.toFixed(2),
        quantity: quantity.toString(),
        closePosition: 'true',
      });
    } catch (error) {
      console.error('Error placing stop orders:', error);
      throw error;
    }
  }

  // Close current position
  async closePosition(): Promise<void> {
    try {
      const position = await this.getCurrentPosition();
      if (!position) return;

      const binance = new BinanceClient(this.binanceApiKey, this.binanceApiSecret);

      // Cancel all open orders for this symbol
      await binance.futuresCancelAllOpenOrders({ symbol: this.config.symbol });

      // Get exit price before closing
      const exitPrice = await this.getCurrentPrice();

      // Close position
      await binance.futuresOrder({
        symbol: this.config.symbol,
        side: position.side === 'LONG' ? 'SELL' : 'BUY',
        type: 'MARKET',
        quantity: position.quantity.toString(),
        reduceOnly: 'true',
      });

      // Update Trade record (old system - for compatibility)
      if (this.currentTradeId) {
        try {
          // Try to close TradeExecution (NEW system)
          const fees = calculateTradeFees(position.entryPrice, position.quantity, this.config.leverage);
          
          await closeTradeExecution(this.currentTradeId, {
            exitPrice,
            exitReason: 'MANUAL', // Will be updated based on actual reason
            fees,
          });

          console.log(`✅ TradeExecution closed: ${this.currentTradeId}`);
          
          // 💰 TRADING COMMISSION: Deduct commission if profitable
          if (position.pnl > 0) {
            console.log(`💰 Deducting trading commission from profit: $${position.pnl.toFixed(2)}`);
            const commissionResult = await afterTrade(this.userId, position.pnl, this.currentTradeId);
            
            if (commissionResult.success) {
              console.log(`✅ Commission deducted: $${commissionResult.commission?.toFixed(2)}`);
              console.log(`💵 Remaining gas fee balance: $${commissionResult.remainingBalance?.toFixed(2)}`);
            } else {
              console.error(`❌ Failed to deduct commission: ${commissionResult.error}`);
            }
          } else {
            console.log(`📊 No commission (position closed at loss: $${position.pnl.toFixed(2)})`);
          }
          
          // Clear current trade ID
          this.currentTradeId = null;
        } catch (tradeError: any) {
          console.error('❌ Failed to close TradeExecution:', tradeError);
          
          // Fallback: Try old TradeManager system
          try {
            await TradeManager.closeTrade(this.currentTradeId!, {
              exitPrice,
              exitTime: new Date(),
              notes: `Position closed at $${exitPrice}, P&L: $${position.pnl.toFixed(2)}`,
            });
            console.log(`✅ Trade record closed (old system): ${this.currentTradeId}`);
          } catch (oldError) {
            console.error('❌ Failed to update old trade record:', oldError);
          }
        }
      }

      // Update daily P&L
      this.dailyPnL += position.pnl;
    } catch (error) {
      console.error('Error closing position:', error);
      throw error;
    }
  }

    // Check if daily loss limit exceeded
  checkDailyLossLimit(): boolean {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate.toDateString()) {
      this.dailyPnL = 0;
      this.lastResetDate = new Date();
    }

    return Math.abs(this.dailyPnL) >= this.config.maxDailyLoss;
  }

  // 🛡️ ENFORCEMENT: Check daily trade limit
  checkDailyTradeLimit(): boolean {
    const today = new Date().toDateString();
    if (today !== this.lastTradeResetDate.toDateString()) {
      // Reset counter at midnight
      this.dailyTradeCount = 0;
      this.lastTradeResetDate = new Date();
      console.log('📅 Daily trade counter reset');
    }

    if (this.config.maxDailyTrades && this.dailyTradeCount >= this.config.maxDailyTrades) {
      console.log(`🛑 Max daily trades reached: ${this.dailyTradeCount}/${this.config.maxDailyTrades}`);
      return true;
    }

    return false;
  }

  // 🛡️ ENFORCEMENT: Count concurrent open positions
  async countOpenPositions(): Promise<number> {
    try {
      const binance = new BinanceClient(this.binanceApiKey, this.binanceApiSecret);
      const positions = await binance.futuresPositionRisk();
      
      // Count positions with non-zero quantity
      const openPositions = positions.filter((pos: any) => {
        const positionAmt = parseFloat(pos.positionAmt);
        return Math.abs(positionAmt) > 0;
      });

      return openPositions.length;
    } catch (error) {
      console.error('Error counting open positions:', error);
      return 0; // Fail-safe: allow trade if can't check
    }
  }

  // Calculate position size based on balance
  async calculatePositionSize(): Promise<number> {
    const balance = await this.getBalance();
    let positionValue = (balance * this.config.positionSizePercent) / 100;
    
    // 🛡️ ENFORCEMENT: Max Position Size
    if (this.config.maxPositionSize && positionValue > this.config.maxPositionSize) {
      console.log(`⚠️ Position size capped: $${positionValue.toFixed(2)} → $${this.config.maxPositionSize} (Max Position Size limit)`);
      positionValue = this.config.maxPositionSize;
    }
    
    const currentPrice = await this.getCurrentPrice();
    const quantity = (positionValue * this.config.leverage) / currentPrice;

    // Round to appropriate decimal places
    return parseFloat(quantity.toFixed(3));
  }

  // Get current price
  async getCurrentPrice(): Promise<number> {
    try {
      const binance = new BinanceClient(this.binanceApiKey, this.binanceApiSecret);
      const ticker = await binance.futuresMarkPrice({ symbol: this.config.symbol });
      return parseFloat(ticker.markPrice);
    } catch (error) {
      console.error('Error getting current price:', error);
      throw error;
    }
  }

  // Main analysis method to be overridden by strategies
  async analyze(): Promise<TradeSignal> {
    throw new Error('analyze() method must be implemented by strategy class');
  }

  // Execute trading cycle
  async executeTradingCycle(): Promise<{
    success: boolean;
    message: string;
    position?: Position | null;
    safetyWarnings?: string[];
  }> {
    try {
      const safetyWarnings: string[] = [];

      // Check daily loss limit
      if (this.checkDailyLossLimit()) {
        if (this.safetyManager) {
          await this.safetyManager.emergencyStop('Daily loss limit exceeded');
        }
        return {
          success: false,
          message: 'Daily loss limit exceeded. Trading paused.',
        };
      }

      // 🛡️ ENFORCEMENT: Check daily trade limit
      if (this.checkDailyTradeLimit()) {
        return {
          success: false,
          message: `Max daily trades reached (${this.dailyTradeCount}/${this.config.maxDailyTrades}). No new trades today.`,
        };
      }

      // 🛡️ ENFORCEMENT: Check max concurrent positions
      if (this.config.maxConcurrentPositions) {
        const openPositionsCount = await this.countOpenPositions();
        if (openPositionsCount >= this.config.maxConcurrentPositions) {
          console.log(`🛑 Max concurrent positions reached: ${openPositionsCount}/${this.config.maxConcurrentPositions}`);
          return {
            success: false,
            message: `Max concurrent positions reached (${openPositionsCount}/${this.config.maxConcurrentPositions}). Wait for position to close.`,
          };
        }
      }

      // Get current position
      const currentPosition = await this.getCurrentPosition();

      // If we have a position, check if we should close it
      if (currentPosition) {
        // Log position status
        if (this.safetyManager) {
          await this.safetyManager.logAnalysis(
            { action: 'HOLD', confidence: 100 },
            `Position active: ${currentPosition.side} ${currentPosition.quantity} @ $${currentPosition.entryPrice}, P&L: $${currentPosition.pnl}`
          );
        }

        // Check stop loss and take profit (already handled by exchange orders)
        // Just return current position status
        return {
          success: true,
          message: 'Position active',
          position: currentPosition,
        };
      }

      // No position, analyze for entry
      const signal = await this.analyze();

      // Log analysis
      if (this.safetyManager) {
        await this.safetyManager.logAnalysis(
          signal,
          `Analysis complete: ${signal.action} (${signal.confidence}%) - ${signal.reason}`
        );
      }

      if (signal.action === 'HOLD' || signal.confidence < 70) {
        return {
          success: true,
          message: `No trade signal. Action: ${signal.action}, Confidence: ${signal.confidence}%`,
          position: null,
        };
      }

      // Run pre-trade safety checks
      if (this.safetyManager) {
        const quantity = await this.calculatePositionSize();
        const currentPrice = await this.getCurrentPrice();
        const balance = await this.getBalance();

        const safetyResult = await this.safetyManager.runPreTradeChecks({
          currentDailyPnL: this.dailyPnL,
          proposedQuantity: quantity,
          currentPrice,
          balance,
          leverage: this.config.leverage,
          recentTrades: [], // TODO: Get from database
        });

        if (!safetyResult.passed) {
          const reasons = safetyResult.failures.map((f) => f.reason).join(', ');
          await this.safetyManager.emergencyStop(`Safety checks failed: ${reasons}`);
          
          return {
            success: false,
            message: `Trade blocked by safety checks: ${reasons}`,
            position: null,
          };
        }

        // Collect warnings
        safetyResult.failures
          .filter((f) => f.action === 'WARN')
          .forEach((f) => {
            if (f.reason) safetyWarnings.push(f.reason);
          });
      }

      // 💰 TRADING COMMISSION: Check if user can trade (gas fee balance >= $10)
      console.log('💰 Checking trading commission eligibility...');
      const tradeEligibility = await beforeTrade(this.userId);
      
      if (!tradeEligibility.allowed) {
        console.log(`🚫 Trading blocked: ${tradeEligibility.reason}`);
        console.log(`📊 Gas Fee Balance: $${tradeEligibility.gasFeeBalance.toFixed(2)}`);
        
        return {
          success: false,
          message: `Trading blocked: ${tradeEligibility.reason}. Gas fee balance: $${tradeEligibility.gasFeeBalance.toFixed(2)}`,
          position: null,
        };
      }
      
      console.log(`✅ Trading allowed! Gas Fee: $${tradeEligibility.gasFeeBalance.toFixed(2)}, Max Profit: $${tradeEligibility.maxProfit.toFixed(2)}`);
      safetyWarnings.push(`Max profit before auto-close: $${tradeEligibility.maxProfit.toFixed(2)}`);

      // Execute trade
      if (signal.action === 'BUY' || signal.action === 'SELL') {
        const quantity = await this.calculatePositionSize();
        const order = await this.executeOrder(signal.action, quantity);
        const entryPrice = await this.getCurrentPrice();

        // Place stop loss and take profit (with ATR-based dynamic stop loss)
        await this.placeStopOrders(
          signal.action === 'BUY' ? 'LONG' : 'SHORT',
          quantity,
          entryPrice,
          signal.atr // Pass ATR for dynamic stop loss
        );

        // Log trade
        if (this.safetyManager) {
          await this.safetyManager.logTrade('OPEN_POSITION', {
            symbol: this.config.symbol,
            side: signal.action === 'BUY' ? 'LONG' : 'SHORT',
            entryPrice,
            quantity,
            leverage: this.config.leverage,
            orderId: order.orderId,
          });
        }

        // 🛡️ ENFORCEMENT: Increment daily trade counter
        this.dailyTradeCount++;
        console.log(`📊 Daily trades: ${this.dailyTradeCount}${this.config.maxDailyTrades ? `/${this.config.maxDailyTrades}` : ''}`);

        // Create trade record in database
        const side = signal.action === 'BUY' ? 'LONG' : 'SHORT';
        const stopLossPrice = side === 'LONG' 
          ? entryPrice * (1 - this.config.stopLossPercent / 100)
          : entryPrice * (1 + this.config.stopLossPercent / 100);
        const takeProfitPrice = side === 'LONG'
          ? entryPrice * (1 + this.config.takeProfitPercent / 100)
          : entryPrice * (1 - this.config.takeProfitPercent / 100);

        const tradeRecord = await TradeManager.createTrade({
          userId: this.userId,
          botInstanceId: this.botInstanceId || undefined,
          symbol: this.config.symbol,
          type: signal.action === 'BUY' ? 'buy' : 'sell',
          side: side.toLowerCase() as 'long' | 'short',
          entryPrice,
          quantity,
          stopLoss: stopLossPrice,
          takeProfit: takeProfitPrice,
          exchange: 'binance',
          leverage: this.config.leverage,
          notes: `Opened by ${this.botInstanceId || 'manual'} - ${signal.reason}`,
        });

        // 🚀 START POSITION MONITOR (with all advanced features)
        if (tradeRecord && tradeRecord._id) {
          const tradeIdString = tradeRecord._id.toString();
          this.currentTradeId = tradeIdString;
          
          console.log('🔍 Starting Position Monitor for trade:', tradeIdString);
          
          // Configure monitor with advanced features from bot settings
          const monitorConfig = {
            checkInterval: 10, // Check every 10 seconds
            enableTrailingStop: this.config.trailingStopLoss?.enabled ?? false,
            trailingStopPercent: this.config.trailingStopLoss?.distance ?? 2.0,
            enableBreakEven: this.config.breakEvenStop?.enabled ?? false,
            breakEvenTriggerPercent: this.config.breakEvenStop?.triggerProfit ?? 2.0,
            enablePartialTP: this.config.partialTakeProfit?.enabled ?? false,
            partialTPLevels: this.config.partialTakeProfit?.levels ?? [],
            enableNewsIntervention: true, // Always enable news monitoring
            enableSmartValidation: true, // Always enable smart validation
          };

          this.positionMonitor = new PositionMonitor(
            this.userId,
            tradeIdString,
            this.binanceApiKey,
            this.binanceApiSecret,
            monitorConfig
          );

          // Start monitoring in background (don't wait)
          this.positionMonitor.startMonitoring().catch((error) => {
            console.error('❌ Position Monitor error:', error);
          });

          console.log('✅ Position Monitor started successfully with config:', {
            trailingStop: monitorConfig.enableTrailingStop,
            breakEven: monitorConfig.enableBreakEven,
            partialTP: monitorConfig.enablePartialTP,
            newsIntervention: monitorConfig.enableNewsIntervention,
            smartValidation: monitorConfig.enableSmartValidation,
          });
        }

        return {
          success: true,
          message: `Opened ${signal.action} position: ${quantity} @ ${entryPrice}`,
          position: await this.getCurrentPosition(),
          safetyWarnings: safetyWarnings.length > 0 ? safetyWarnings : undefined,
        };
      }

      return {
        success: true,
        message: 'No action taken',
        position: null,
      };
    } catch (error: any) {
      console.error('Error in trading cycle:', error);
      
      // Log error
      if (this.safetyManager) {
        await this.safetyManager.logError(error, 'TRADING_CYCLE_ERROR');
      }

      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }
}
