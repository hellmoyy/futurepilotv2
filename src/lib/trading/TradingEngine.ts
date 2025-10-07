import { BinanceClient } from '../binance';
import { openai } from '../openai';
import { SafetyManager } from './SafetyManager';

export interface TradingConfig {
  symbol: string;
  leverage: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  positionSizePercent: number; // % of balance to use per trade
  maxDailyLoss: number; // Maximum loss per day in USDT
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

  constructor(
    userId: string,
    config: TradingConfig,
    apiKey: string,
    apiSecret: string,
    botInstanceId?: string
  ) {
    this.userId = userId;
    this.config = config;
    this.binanceApiKey = apiKey;
    this.binanceApiSecret = apiSecret;
    
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
    entryPrice: number
  ): Promise<void> {
    try {
      const binance = new BinanceClient(this.binanceApiKey, this.binanceApiSecret);

      const stopLossPrice =
        side === 'LONG'
          ? entryPrice * (1 - this.config.stopLossPercent / 100)
          : entryPrice * (1 + this.config.stopLossPercent / 100);

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

      // Close position
      await binance.futuresOrder({
        symbol: this.config.symbol,
        side: position.side === 'LONG' ? 'SELL' : 'BUY',
        type: 'MARKET',
        quantity: position.quantity.toString(),
        reduceOnly: 'true',
      });

      // Update daily P&L
      this.dailyPnL += position.pnl;
    } catch (error) {
      console.error('Error closing position:', error);
      throw error;
    }
  }

  // Check if daily loss limit exceeded
  checkDailyLossLimit(): boolean {
    const today = new Date();
    if (today.toDateString() !== this.lastResetDate.toDateString()) {
      this.dailyPnL = 0;
      this.lastResetDate = today;
    }

    return Math.abs(this.dailyPnL) >= this.config.maxDailyLoss;
  }

  // Calculate position size based on balance
  async calculatePositionSize(): Promise<number> {
    const balance = await this.getBalance();
    const positionValue = (balance * this.config.positionSizePercent) / 100;
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

      // Execute trade
      if (signal.action === 'BUY' || signal.action === 'SELL') {
        const quantity = await this.calculatePositionSize();
        const order = await this.executeOrder(signal.action, quantity);
        const entryPrice = await this.getCurrentPrice();

        // Place stop loss and take profit
        await this.placeStopOrders(
          signal.action === 'BUY' ? 'LONG' : 'SHORT',
          quantity,
          entryPrice
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
