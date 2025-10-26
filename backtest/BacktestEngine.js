/**
 * 🧪 Backtest Engine
 * 
 * Core engine untuk menjalankan backtest simulation
 * Simulasi complete trading dengan entry, stop loss, take profit
 */

class BacktestEngine {
  constructor(strategy, config = {}) {
    this.strategy = strategy;
    this.config = {
      initialCapital: config.initialCapital || 10000,
      positionSizePercent: config.positionSizePercent || 10,
      leverage: config.leverage || 10,
      minConfidence: config.minConfidence || 65 // Minimum confidence to trade
    };

    this.trades = [];
    this.capital = this.config.initialCapital;
    this.currentPosition = null;
    this.equity = [this.capital];
  }

  /**
   * Run backtest on historical candles
   */
  run(candles) {
    console.log(`\n🧪 Running backtest on ${candles.length} candles...`);
    console.log(`💰 Initial Capital: $${this.config.initialCapital}`);
    console.log(`📊 Position Size: ${this.config.positionSizePercent}% (${this.config.leverage}x leverage)`);
    console.log(`🎯 Min Confidence: ${this.config.minConfidence}%\n`);

    let progressCount = 0;

    for (let i = 200; i < candles.length; i++) {
      const candle = candles[i];

      // Update existing position (check SL/TP)
      if (this.currentPosition) {
        this.updatePosition(candle);
      }

      // Only enter new position if no current position
      if (!this.currentPosition) {
        const signal = this.strategy.analyze(candles, i);

        // Enter trade if signal meets criteria
        if ((signal.action === 'BUY' || signal.action === 'SELL') && signal.confidence >= this.config.minConfidence) {
          this.enterPosition(signal, candle);
        }
      }

      // Track equity
      const currentEquity = this.currentPosition 
        ? this.capital + this.calculateUnrealizedPnL(this.currentPosition, candle.close)
        : this.capital;
      this.equity.push(currentEquity);

      // Progress indicator
      if (i % 500 === 0) {
        progressCount++;
        const progress = ((i / candles.length) * 100).toFixed(1);
        process.stdout.write(`\r⏳ Progress: ${progress}% | Trades: ${this.trades.length} | Equity: $${currentEquity.toFixed(2)}`);
      }
    }

    // Close any remaining position
    if (this.currentPosition) {
      this.closePosition(candles[candles.length - 1], 'END_OF_BACKTEST');
    }

    console.log(`\n✅ Backtest complete! ${this.trades.length} trades executed\n`);

    return {
      trades: this.trades,
      finalCapital: this.capital,
      equity: this.equity
    };
  }

  /**
   * Enter a new position
   */
  enterPosition(signal, candle) {
    const entryPrice = candle.close;
    const side = signal.action === 'BUY' ? 'LONG' : 'SHORT';
    
    // Calculate position size
    const positionValue = (this.capital * this.config.positionSizePercent / 100) * this.config.leverage;
    const quantity = positionValue / entryPrice;

    // Calculate stop loss and take profit
    const levels = this.strategy.calculateLevels(entryPrice, side, signal.atr);

    this.currentPosition = {
      side,
      entryPrice,
      quantity,
      entryTime: candle.openTime,
      stopLoss: levels.stopLoss,
      takeProfit: levels.takeProfit,
      stopLossPercent: levels.stopLossPercent,
      confidence: signal.confidence,
      reason: signal.reason,
      indicators: signal.indicators
    };
  }

  /**
   * Update position (check if SL or TP hit)
   */
  updatePosition(candle) {
    if (!this.currentPosition) return;

    const pos = this.currentPosition;
    const high = candle.high;
    const low = candle.low;

    // Check LONG position
    if (pos.side === 'LONG') {
      // Stop Loss hit
      if (low <= pos.stopLoss) {
        this.closePosition(candle, 'STOP_LOSS', pos.stopLoss);
        return;
      }
      // Take Profit hit
      if (high >= pos.takeProfit) {
        this.closePosition(candle, 'TAKE_PROFIT', pos.takeProfit);
        return;
      }
    }

    // Check SHORT position
    if (pos.side === 'SHORT') {
      // Stop Loss hit
      if (high >= pos.stopLoss) {
        this.closePosition(candle, 'STOP_LOSS', pos.stopLoss);
        return;
      }
      // Take Profit hit
      if (low <= pos.takeProfit) {
        this.closePosition(candle, 'TAKE_PROFIT', pos.takeProfit);
        return;
      }
    }
  }

  /**
   * Close position
   */
  closePosition(candle, exitReason, exitPrice = null) {
    if (!this.currentPosition) return;

    const pos = this.currentPosition;
    const closePrice = exitPrice || candle.close;

    // Calculate P&L
    let pnl;
    if (pos.side === 'LONG') {
      pnl = (closePrice - pos.entryPrice) / pos.entryPrice * 100;
    } else {
      pnl = (pos.entryPrice - closePrice) / pos.entryPrice * 100;
    }

    // Apply leverage
    pnl = pnl * this.config.leverage;

    // Calculate dollar amount
    const positionValue = (this.capital * this.config.positionSizePercent / 100);
    const dollarPnL = positionValue * (pnl / 100);

    // Update capital
    this.capital += dollarPnL;

    // Record trade
    const trade = {
      side: pos.side,
      entryPrice: pos.entryPrice,
      exitPrice: closePrice,
      entryTime: pos.entryTime,
      exitTime: candle.openTime,
      duration: candle.openTime - pos.entryTime,
      pnl: pnl,
      dollarPnL: dollarPnL,
      exitReason: exitReason,
      confidence: pos.confidence,
      stopLossPercent: pos.stopLossPercent,
      reason: pos.reason,
      indicators: pos.indicators,
      win: dollarPnL > 0
    };

    this.trades.push(trade);
    this.currentPosition = null;
  }

  /**
   * Calculate unrealized P&L for current position
   */
  calculateUnrealizedPnL(position, currentPrice) {
    let pnlPercent;
    if (position.side === 'LONG') {
      pnlPercent = (currentPrice - position.entryPrice) / position.entryPrice * 100;
    } else {
      pnlPercent = (position.entryPrice - currentPrice) / position.entryPrice * 100;
    }

    pnlPercent = pnlPercent * this.config.leverage;

    const positionValue = (this.capital * this.config.positionSizePercent / 100);
    return positionValue * (pnlPercent / 100);
  }
}

module.exports = BacktestEngine;
