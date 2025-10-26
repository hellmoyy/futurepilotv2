/**
 * 📊 Metrics Calculator
 * 
 * Calculate comprehensive trading metrics from backtest results
 */

class MetricsCalculator {
  static calculate(trades, initialCapital, finalCapital, equity) {
    const wins = trades.filter(t => t.win);
    const losses = trades.filter(t => !t.win);

    const metrics = {
      // Basic Stats
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: trades.length > 0 ? (wins.length / trades.length * 100).toFixed(2) : 0,

      // Profit Stats
      initialCapital,
      finalCapital: finalCapital.toFixed(2),
      totalProfit: (finalCapital - initialCapital).toFixed(2),
      roi: ((finalCapital - initialCapital) / initialCapital * 100).toFixed(2),

      // Per Trade Stats
      avgWin: wins.length > 0 
        ? (wins.reduce((sum, t) => sum + t.dollarPnL, 0) / wins.length).toFixed(2)
        : 0,
      avgLoss: losses.length > 0
        ? (losses.reduce((sum, t) => sum + t.dollarPnL, 0) / losses.length).toFixed(2)
        : 0,
      avgTrade: trades.length > 0
        ? (trades.reduce((sum, t) => sum + t.dollarPnL, 0) / trades.length).toFixed(2)
        : 0,

      // Best/Worst
      bestTrade: trades.length > 0
        ? Math.max(...trades.map(t => t.dollarPnL)).toFixed(2)
        : 0,
      worstTrade: trades.length > 0
        ? Math.min(...trades.map(t => t.dollarPnL)).toFixed(2)
        : 0,

      // Exit Reasons
      stopLossHits: trades.filter(t => t.exitReason === 'STOP_LOSS').length,
      takeProfitHits: trades.filter(t => t.exitReason === 'TAKE_PROFIT').length,

      // Drawdown
      maxDrawdown: this.calculateMaxDrawdown(equity),

      // Sharpe Ratio
      sharpeRatio: this.calculateSharpeRatio(trades),

      // Profit Factor
      profitFactor: this.calculateProfitFactor(wins, losses),

      // Side Distribution
      longTrades: trades.filter(t => t.side === 'LONG').length,
      shortTrades: trades.filter(t => t.side === 'SHORT').length,
      longWinRate: this.calculateSideWinRate(trades, 'LONG'),
      shortWinRate: this.calculateSideWinRate(trades, 'SHORT'),

      // Regime Analysis (if available)
      regimeStats: this.analyzeByRegime(trades)
    };

    return metrics;
  }

  static calculateMaxDrawdown(equity) {
    let maxDrawdown = 0;
    let peak = equity[0];

    for (const value of equity) {
      if (value > peak) {
        peak = value;
      }
      const drawdown = ((peak - value) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown.toFixed(2);
  }

  static calculateSharpeRatio(trades) {
    if (trades.length < 2) return 0;

    const returns = trades.map(t => t.pnl);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // Annualized Sharpe (assuming ~250 trading days)
    const sharpe = (avgReturn / stdDev) * Math.sqrt(250 / trades.length);
    
    return sharpe.toFixed(2);
  }

  static calculateProfitFactor(wins, losses) {
    const totalWins = wins.reduce((sum, t) => sum + t.dollarPnL, 0);
    const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.dollarPnL, 0));

    if (totalLosses === 0) return 'Infinity';

    return (totalWins / totalLosses).toFixed(2);
  }

  static calculateSideWinRate(trades, side) {
    const sideTrades = trades.filter(t => t.side === side);
    if (sideTrades.length === 0) return '0.00';

    const wins = sideTrades.filter(t => t.win).length;
    return ((wins / sideTrades.length) * 100).toFixed(2);
  }

  static analyzeByRegime(trades) {
    const regimes = {
      TRENDING_UP: { trades: [], wins: 0 },
      TRENDING_DOWN: { trades: [], wins: 0 },
      RANGING: { trades: [], wins: 0 },
      CHOPPY: { trades: [], wins: 0 },
      UNKNOWN: { trades: [], wins: 0 }
    };

    trades.forEach(trade => {
      const regime = trade.indicators?.trend || 'UNKNOWN';
      const regimeKey = regime.includes('UP') ? 'TRENDING_UP'
        : regime.includes('DOWN') ? 'TRENDING_DOWN'
        : regime === 'RANGING' ? 'RANGING'
        : regime === 'CHOPPY' ? 'CHOPPY'
        : 'UNKNOWN';

      if (!regimes[regimeKey]) regimes[regimeKey] = { trades: [], wins: 0 };
      
      regimes[regimeKey].trades.push(trade);
      if (trade.win) regimes[regimeKey].wins++;
    });

    const stats = {};
    for (const [regime, data] of Object.entries(regimes)) {
      if (data.trades.length > 0) {
        stats[regime] = {
          count: data.trades.length,
          wins: data.wins,
          winRate: ((data.wins / data.trades.length) * 100).toFixed(2),
          avgProfit: (data.trades.reduce((sum, t) => sum + t.dollarPnL, 0) / data.trades.length).toFixed(2)
        };
      }
    }

    return stats;
  }

  /**
   * Compare two backtest results
   */
  static compare(metrics1, metrics2, label1 = 'Strategy 1', label2 = 'Strategy 2') {
    return {
      [label1]: {
        winRate: `${metrics1.winRate}%`,
        totalProfit: `$${metrics1.totalProfit}`,
        roi: `${metrics1.roi}%`,
        sharpe: metrics1.sharpeRatio,
        maxDrawdown: `${metrics1.maxDrawdown}%`
      },
      [label2]: {
        winRate: `${metrics2.winRate}%`,
        totalProfit: `$${metrics2.totalProfit}`,
        roi: `${metrics2.roi}%`,
        sharpe: metrics2.sharpeRatio,
        maxDrawdown: `${metrics2.maxDrawdown}%`
      },
      improvement: {
        winRate: `${(parseFloat(metrics2.winRate) - parseFloat(metrics1.winRate)).toFixed(2)}%`,
        profit: `$${(parseFloat(metrics2.totalProfit) - parseFloat(metrics1.totalProfit)).toFixed(2)}`,
        roi: `${(parseFloat(metrics2.roi) - parseFloat(metrics1.roi)).toFixed(2)}%`
      }
    };
  }
}

module.exports = MetricsCalculator;
