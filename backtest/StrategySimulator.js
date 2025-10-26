/**
 * 🎯 Strategy Simulator
 * 
 * Simulasi strategi Bitcoin Pro dengan semua improvements
 * - Quick Wins (Time + Volume + ATR)
 * - Market Regime Filter
 */

class StrategySimulator {
  constructor(config = {}) {
    this.config = {
      leverage: config.leverage || 10,
      stopLossPercent: config.stopLossPercent || 3,
      takeProfitPercent: config.takeProfitPercent || 6,
      positionSizePercent: config.positionSizePercent || 10,
      
      // Strategy toggles
      useTimeFilter: config.useTimeFilter !== false,
      useVolumeFilter: config.useVolumeFilter !== false,
      useDynamicStopLoss: config.useDynamicStopLoss !== false,
      useMarketRegimeFilter: config.useMarketRegimeFilter !== false
    };
  }

  /**
   * Analyze candles and generate signal
   * (Copy logic dari BitcoinProStrategy.ts)
   */
  analyze(candles, currentIndex) {
    // Need at least 200 candles for EMA200
    if (currentIndex < 200) {
      return { action: 'HOLD', confidence: 0, reason: 'Insufficient data' };
    }

    // Get data window
    const window = candles.slice(Math.max(0, currentIndex - 200), currentIndex + 1);
    const prices = window.map(c => c.close);
    const highs = window.map(c => c.high);
    const lows = window.map(c => c.low);
    const current = candles[currentIndex];

    // 1. TIME FILTER
    if (this.config.useTimeFilter) {
      const timeCheck = this.checkTradingHours(current.openTime);
      if (!timeCheck.shouldTrade) {
        return { action: 'HOLD', confidence: 0, reason: timeCheck.reason };
      }
    }

    // Calculate indicators
    const rsi = this.calculateRSI(prices);
    const macd = this.calculateMACD(prices);
    const ema20 = this.calculateEMA(prices, 20);
    const ema50 = this.calculateEMA(prices, 50);
    const ema200 = this.calculateEMA(prices, 200);
    const currentPrice = prices[prices.length - 1];

    // 2. MARKET REGIME FILTER
    if (this.config.useMarketRegimeFilter) {
      const regime = this.detectMarketRegime(prices, highs, lows, ema20, ema50, ema200);
      if (!regime.shouldTrade) {
        return { 
          action: 'HOLD', 
          confidence: 0, 
          reason: regime.reason,
          regime: regime.regime
        };
      }
    }

    // Technical analysis
    let signal = 'HOLD';
    let confidence = 50;
    let reason = 'Analyzing...';

    const isOversold = rsi < 30;
    const isOverbought = rsi > 70;
    const macdBullish = macd.histogram > 0 && macd.macd > macd.signal;
    const macdBearish = macd.histogram < 0 && macd.macd < macd.signal;
    const priceAboveEMA = currentPrice > ema20 && currentPrice > ema50;
    const priceBelowEMA = currentPrice < ema20 && currentPrice < ema50;

    // Determine trend
    let trend = 'NEUTRAL';
    if (ema20 > ema50 && ema50 > ema200) {
      trend = 'STRONG_UPTREND';
    } else if (ema20 > ema50) {
      trend = 'UPTREND';
    } else if (ema20 < ema50 && ema50 < ema200) {
      trend = 'STRONG_DOWNTREND';
    } else if (ema20 < ema50) {
      trend = 'DOWNTREND';
    }

    // BUY SIGNAL
    if (
      (isOversold || (rsi >= 30 && rsi <= 45)) &&
      macdBullish &&
      (trend === 'UPTREND' || trend === 'STRONG_UPTREND' || (trend === 'NEUTRAL' && priceAboveEMA))
    ) {
      signal = 'BUY';
      confidence = 75;
      reason = `BUY: RSI ${rsi.toFixed(1)}, MACD bullish, ${trend}`;
      if (trend === 'STRONG_UPTREND') confidence = 85;
    }
    // SELL SIGNAL
    else if (
      (isOverbought || (rsi >= 55 && rsi <= 70)) &&
      macdBearish &&
      (trend === 'DOWNTREND' || trend === 'STRONG_DOWNTREND' || (trend === 'NEUTRAL' && priceBelowEMA))
    ) {
      signal = 'SELL';
      confidence = 75;
      reason = `SELL: RSI ${rsi.toFixed(1)}, MACD bearish, ${trend}`;
      if (trend === 'STRONG_DOWNTREND') confidence = 85;
    }
    // Moderate signals
    else if (macdBullish && !isOverbought && (trend === 'UPTREND' || trend === 'NEUTRAL')) {
      signal = 'BUY';
      confidence = 65;
      reason = `Moderate BUY: MACD bullish, ${trend}`;
    } else if (macdBearish && !isOversold && (trend === 'DOWNTREND' || trend === 'NEUTRAL')) {
      signal = 'SELL';
      confidence = 65;
      reason = `Moderate SELL: MACD bearish, ${trend}`;
    }

    // 3. VOLUME CONFIRMATION
    if (this.config.useVolumeFilter && signal !== 'HOLD') {
      const volumeCheck = this.checkVolumeConfirmation(window);
      confidence += volumeCheck.confidence;
    }

    // 4. CALCULATE ATR for dynamic stop loss
    const atr = this.calculateATR(highs, lows, prices, 14);

    return {
      action: signal,
      confidence,
      reason,
      atr,
      indicators: { rsi, macd, ema20, ema50, ema200, trend }
    };
  }

  /**
   * Calculate optimal stop loss and take profit
   */
  calculateLevels(entryPrice, side, atr) {
    let stopLossPercent = this.config.stopLossPercent;

    // Dynamic stop loss based on ATR
    if (this.config.useDynamicStopLoss && atr > 0) {
      const atrMultiplier = 2.0;
      const atrStopDistance = (atr / entryPrice) * 100 * atrMultiplier;
      stopLossPercent = Math.max(2, Math.min(5, atrStopDistance));
    }

    const stopLoss = side === 'LONG'
      ? entryPrice * (1 - stopLossPercent / 100)
      : entryPrice * (1 + stopLossPercent / 100);

    const takeProfit = side === 'LONG'
      ? entryPrice * (1 + this.config.takeProfitPercent / 100)
      : entryPrice * (1 - this.config.takeProfitPercent / 100);

    return { stopLoss, takeProfit, stopLossPercent };
  }

  // ==================== TECHNICAL INDICATORS ====================

  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(prices) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;
    
    // Signal line (EMA of MACD) - simplified
    const signal = macd * 0.9; // Approximation
    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  calculateEMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = prices[prices.length - period];

    for (let i = prices.length - period + 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  calculateATR(highs, lows, closes, period = 14) {
    if (highs.length < period + 1) return 0;

    const trueRanges = [];
    for (let i = 1; i < highs.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    const recent = trueRanges.slice(-period);
    return recent.reduce((a, b) => a + b, 0) / period;
  }

  // ==================== FILTERS ====================

  checkTradingHours(timestamp) {
    const date = new Date(timestamp);
    const hour = date.getUTCHours();
    const day = date.getUTCDay();

    // Block overnight hours (0-3 UTC)
    if (hour >= 0 && hour < 3) {
      return { shouldTrade: false, reason: 'Overnight hours (low liquidity)' };
    }

    return { shouldTrade: true, confidence: 0 };
  }

  checkVolumeConfirmation(candles) {
    if (candles.length < 20) return { confidence: 0 };

    const volumes = candles.map(c => c.volume);
    const avgVolume = volumes.slice(-20, -1).reduce((a, b) => a + b, 0) / 19;
    const currentVolume = volumes[volumes.length - 1];
    const volumeRatio = currentVolume / avgVolume;

    if (volumeRatio > 1.5) {
      return { confidence: 10, reason: 'High volume confirmation' };
    } else if (volumeRatio < 0.8) {
      return { confidence: -15, reason: 'Low volume warning' };
    }

    return { confidence: 0 };
  }

  detectMarketRegime(prices, highs, lows, ema20, ema50, ema200) {
    const currentPrice = prices[prices.length - 1];
    const adx = this.calculateADX(highs, lows, prices);

    const isAboveEMAs = currentPrice > ema20 && ema20 > ema50 && ema50 > ema200;
    const isBelowEMAs = currentPrice < ema20 && ema20 < ema50 && ema50 < ema200;

    // ADX < 20: Weak trend (ranging/choppy)
    if (adx < 20) {
      return {
        regime: 'RANGING',
        shouldTrade: false,
        reason: `RANGING market (ADX: ${adx.toFixed(1)}) - Avoid trading`,
        adx
      };
    }

    // ADX 20-25: Emerging trend
    if (adx >= 20 && adx < 25) {
      if (isAboveEMAs || isBelowEMAs) {
        return {
          regime: isAboveEMAs ? 'TRENDING_UP' : 'TRENDING_DOWN',
          shouldTrade: true,
          confidence: 5,
          adx
        };
      }
      return { regime: 'RANGING', shouldTrade: false, adx };
    }

    // ADX 25-50: Strong trend (IDEAL!)
    if (adx >= 25 && adx <= 50) {
      if (isAboveEMAs) {
        return {
          regime: 'TRENDING_UP',
          shouldTrade: true,
          confidence: 15,
          reason: `Strong UPTREND (ADX: ${adx.toFixed(1)})`,
          adx
        };
      } else if (isBelowEMAs) {
        return {
          regime: 'TRENDING_DOWN',
          shouldTrade: true,
          confidence: 15,
          reason: `Strong DOWNTREND (ADX: ${adx.toFixed(1)})`,
          adx
        };
      }
    }

    // ADX > 50: Very strong (watch exhaustion)
    if (isAboveEMAs || isBelowEMAs) {
      return {
        regime: isAboveEMAs ? 'TRENDING_UP' : 'TRENDING_DOWN',
        shouldTrade: true,
        confidence: 10,
        adx
      };
    }

    return { regime: 'CHOPPY', shouldTrade: false, adx };
  }

  calculateADX(highs, lows, closes, period = 14) {
    if (highs.length < period + 1) return 0;

    const trueRanges = [];
    const plusDM = [];
    const minusDM = [];

    for (let i = 1; i < highs.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));

      const highDiff = highs[i] - highs[i - 1];
      const lowDiff = lows[i - 1] - lows[i];

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

    const avgTR = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgPlusDM = plusDM.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgMinusDM = minusDM.slice(-period).reduce((a, b) => a + b, 0) / period;

    const plusDI = (avgPlusDM / avgTR) * 100;
    const minusDI = (avgMinusDM / avgTR) * 100;

    const dx = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;

    return Math.min(100, dx);
  }
}

module.exports = StrategySimulator;
