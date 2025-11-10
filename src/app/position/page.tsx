'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';

interface Position {
  _id: string;
  botId: number;
  botName: string;
  symbol: string;
  status: string;
  currentPosition?: {
    symbol: string;
    side: string;
    entryPrice: number;
    quantity: number;
    leverage: number;
    stopLoss: number;
    takeProfit: number;
    pnl: number;
    pnlPercent: number;
    openTime: string;
  };
  statistics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    totalProfit: number;
    totalLoss: number;
    winRate: number;
    avgProfit: number;
    dailyPnL: number;
  };
}

interface Trade {
  _id: string;
  symbol: string;
  type: string;
  side: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  status: string;
  pnl?: number;
  pnlPercentage?: number;
  entryTime: string;
  exitTime?: string;
  exchange?: string;
  fees?: number;
}

export default function PositionPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'metrics'>('positions');
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrices, setCurrentPrices] = useState<{ [key: string]: number }>({});
  const [priceLoading, setPriceLoading] = useState(false);
  
  // Pagination states
  const [positionsPage, setPositionsPage] = useState(1);
  const [positionsPerPage, setPositionsPerPage] = useState(10);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(10);

  // Batch fetch current prices from Binance (multiple symbols at once)
  const fetchCurrentPrices = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return;
    
    try {
      setPriceLoading(true);
      
      // Binance supports batch ticker fetch with array of symbols
      const symbolsParam = JSON.stringify(symbols);
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${symbolsParam}`);
      
      // Handle rate limiting
      if (response.status === 429) {
        console.warn('⚠️ Binance API rate limit reached, using cached prices');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Update prices in batch
      const priceMap: { [key: string]: number } = {};
      data.forEach((item: any) => {
        priceMap[item.symbol] = parseFloat(item.price);
      });
      
      setCurrentPrices(prev => ({ ...prev, ...priceMap }));
    } catch (error) {
      console.error('Error fetching prices:', error);
      // Don't clear existing prices on error, keep cached values
    } finally {
      setPriceLoading(false);
    }
  }, []);

  // Fetch active bot positions
  const fetchPositions = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/bots');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.status}`);
      }
      
      const result = await response.json();
      
      // API returns { bots: [...] } not just [...]
      const data = Array.isArray(result) ? result : (result.bots || []);
      
      const activePositions = data.filter((bot: Position) => 
        bot.status === 'ACTIVE' && bot.currentPosition
      );
      setPositions(activePositions);
      
      // Batch fetch current prices for all active positions
      const symbols = activePositions
        .map((pos: Position) => pos.currentPosition?.symbol)
        .filter(Boolean) as string[];
      
      if (symbols.length > 0) {
        fetchCurrentPrices(symbols);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load positions');
    }
  }, [fetchCurrentPrices]);

  // Fetch closed trades history
  const fetchTrades = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/trades');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Ensure we have an array
      const data = Array.isArray(result) ? result : (result.trades || []);
      
      setTrades(data.filter((trade: Trade) => trade.status === 'closed'));
    } catch (error) {
      console.error('Error fetching trades:', error);
      setError(error instanceof Error ? error.message : 'Failed to load trade history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
    fetchTrades();
    
    // Refresh positions every 10 seconds
    const interval = setInterval(() => {
      fetchPositions();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchPositions, fetchTrades]);

  // Calculate live PnL
  const calculateLivePnL = (position: Position['currentPosition'], currentPrice: number) => {
    if (!position) return { pnl: 0, pnlPercent: 0 };
    
    const priceDiff = position.side.toLowerCase() === 'long' 
      ? currentPrice - position.entryPrice
      : position.entryPrice - currentPrice;
    
    const pnl = priceDiff * position.quantity * position.leverage;
    const pnlPercent = (priceDiff / position.entryPrice) * 100 * position.leverage;
    
    return { pnl, pnlPercent };
  };

  // Calculate liquidation price
  const calculateLiquidationPrice = (position: Position['currentPosition']) => {
    if (!position) return 0;
    
    const maintenanceMarginRate = 0.004; // 0.4% for most pairs
    const liquidationBuffer = 1 - (1 / position.leverage) - maintenanceMarginRate;
    
    if (position.side.toLowerCase() === 'long') {
      return position.entryPrice * liquidationBuffer;
    } else {
      return position.entryPrice * (2 - liquidationBuffer);
    }
  };

  // Get total active positions count
  const activePositionsCount = positions.filter(p => p.currentPosition).length;

  // Calculate total PnL across all positions
  const totalPnL = positions.reduce((sum, pos) => {
    if (pos.currentPosition && currentPrices[pos.currentPosition.symbol]) {
      const { pnl } = calculateLivePnL(pos.currentPosition, currentPrices[pos.currentPosition.symbol]);
      return sum + pnl;
    }
    return sum;
  }, 0);

  // Calculate total margin
  const totalMargin = positions.reduce((sum, pos) => {
    if (pos.currentPosition) {
      return sum + (pos.currentPosition.entryPrice * pos.currentPosition.quantity);
    }
    return sum;
  }, 0);

  // Calculate average ROI
  const avgROI = activePositionsCount > 0
    ? positions.reduce((sum, pos) => {
        if (pos.currentPosition && currentPrices[pos.currentPosition.symbol]) {
          const { pnlPercent } = calculateLivePnL(pos.currentPosition, currentPrices[pos.currentPosition.symbol]);
          return sum + pnlPercent;
        }
        return sum;
      }, 0) / activePositionsCount
    : 0;

  // ============ PERFORMANCE METRICS CALCULATIONS ============

  // Memoize returns calculation (used by multiple metrics)
  const cachedReturns = useMemo(() => {
    return trades
      .filter(t => t.status === 'closed' && t.pnlPercentage !== undefined)
      .map(t => ({
        pnlPercentage: t.pnlPercentage || 0,
        entryTime: t.entryTime
      }))
      .sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime())
      .map(t => t.pnlPercentage);
  }, [trades]);

  // Calculate returns array for metrics (from closed trades)
  const calculateReturns = () => {
    return cachedReturns;
  };

  // Calculate Sharpe Ratio (risk-adjusted return)
  const calculateSharpeRatio = () => {
    const returns = calculateReturns();
    if (returns.length < 2) return 0;

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    const riskFreeRate = 0; // Assuming 0% risk-free rate for crypto
    const sharpeRatio = (avgReturn - riskFreeRate) / stdDev;

    // Annualize it (assuming ~250 trading days)
    return sharpeRatio * Math.sqrt(250);
  };

  // Calculate Maximum Drawdown
  const calculateMaxDrawdown = () => {
    const returns = calculateReturns();
    if (returns.length === 0) return 0;

    let peak = 100; // Starting with 100%
    let maxDrawdown = 0;
    let equity = 100;

    returns.forEach(ret => {
      equity = equity * (1 + ret / 100);
      if (equity > peak) {
        peak = equity;
      }
      const drawdown = ((peak - equity) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return maxDrawdown;
  };

  // Calculate Profit Factor (gross profit / gross loss)
  const calculateProfitFactor = () => {
    const profits = trades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0);
    const losses = Math.abs(trades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0));
    
    if (losses === 0) return profits > 0 ? 999 : 0;
    return profits / losses;
  };

  // Calculate Win Rate
  const calculateWinRate = () => {
    const closedTrades = trades.filter(t => t.status === 'closed');
    if (closedTrades.length === 0) return 0;
    
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
    return (winningTrades / closedTrades.length) * 100;
  };

  // Calculate Average Win/Loss
  const calculateAvgWinLoss = () => {
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0);

    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
      : 0;

    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length)
      : 0;

    return { avgWin, avgLoss };
  };

  // Calculate Expectancy (average $ per trade)
  const calculateExpectancy = () => {
    const closedTrades = trades.filter(t => t.status === 'closed');
    if (closedTrades.length === 0) return 0;
    
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    return totalPnL / closedTrades.length;
  };

  // Calculate Recovery Factor (net profit / max drawdown)
  const calculateRecoveryFactor = () => {
    const netProfit = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const maxDD = calculateMaxDrawdown();
    
    if (maxDD === 0) return netProfit > 0 ? 999 : 0;
    return (netProfit / maxDD) * 100;
  };

  // Calculate Calmar Ratio (annualized return / max drawdown)
  const calculateCalmarRatio = () => {
    const returns = calculateReturns();
    if (returns.length === 0) return 0;

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const annualizedReturn = avgReturn * 250; // Assuming 250 trading days
    const maxDD = calculateMaxDrawdown();

    if (maxDD === 0) return annualizedReturn > 0 ? 999 : 0;
    return annualizedReturn / maxDD;
  };

  // Calculate Longest Winning/Losing Streak
  const calculateStreaks = () => {
    const closedTrades = trades.filter(t => t.status === 'closed').sort((a, b) => 
      new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime()
    );

    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;

    closedTrades.forEach(trade => {
      if ((trade.pnl || 0) > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else if ((trade.pnl || 0) < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    });

    return { maxWinStreak, maxLossStreak };
  };

  // Calculate total fees paid
  const calculateTotalFees = () => {
    return trades.reduce((sum, t) => sum + (t.fees || 0), 0);
  };

  // Pagination calculations for positions
  const activePositions = positions.filter(p => p.currentPosition);
  const totalPositionsPages = Math.ceil(activePositions.length / positionsPerPage);
  const positionsStartIndex = (positionsPage - 1) * positionsPerPage;
  const positionsEndIndex = positionsStartIndex + positionsPerPage;
  const paginatedPositions = activePositions.slice(positionsStartIndex, positionsEndIndex);

  // Pagination calculations for history
  const totalHistoryPages = Math.ceil(trades.length / historyPerPage);
  const historyStartIndex = (historyPage - 1) * historyPerPage;
  const historyEndIndex = historyStartIndex + historyPerPage;
  const paginatedTrades = trades.slice(historyStartIndex, historyEndIndex);

  // Reset page when tab changes
  useEffect(() => {
    setPositionsPage(1);
    setHistoryPage(1);
  }, [activeTab]);

  // Get performance metrics (memoized to prevent recalculation)
  const performanceMetrics = useMemo(() => ({
    sharpeRatio: calculateSharpeRatio(),
    maxDrawdown: calculateMaxDrawdown(),
    profitFactor: calculateProfitFactor(),
    winRate: calculateWinRate(),
    avgWinLoss: calculateAvgWinLoss(),
    expectancy: calculateExpectancy(),
    recoveryFactor: calculateRecoveryFactor(),
    calmarRatio: calculateCalmarRatio(),
    streaks: calculateStreaks(),
    totalFees: calculateTotalFees(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [trades]); // Only recalculate when trades change

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm sm:text-base">Loading positions...</p>
        </div>
      </div>
    );
  }

  // Error state with retry button
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white dark:text-white light:text-gray-900 mb-2">Failed to Load Data</h2>
          <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchPositions();
              fetchTrades();
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-semibold text-white hover:shadow-xl transition-all hover:scale-105"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/10 dark:to-cyan-500/10 light:from-blue-100 light:to-cyan-100 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-white/20 dark:border-white/20 light:border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-400 dark:to-cyan-400 light:from-blue-600 light:to-cyan-600 bg-clip-text text-transparent">
                Trading Overview
              </span>
            </h1>
            <p className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-sm sm:text-base lg:text-lg">Monitor your open positions and trading history</p>
          </div>
          {priceLoading && (
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="hidden sm:inline">Updating prices...</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 sm:gap-3 bg-black/40 dark:bg-black/40 light:bg-white backdrop-blur-md rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-white/10 dark:border-white/10 light:border-gray-200">
        <button
          onClick={() => setActiveTab('positions')}
          className={`flex-1 px-3 sm:px-5 py-3 sm:py-4 font-bold text-xs sm:text-base transition-all rounded-lg sm:rounded-xl relative ${
            activeTab === 'positions'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
              : 'text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-gray-900 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center justify-center gap-1 sm:gap-2">
            <span className="hidden lg:inline">My </span>Positions
            {activePositionsCount > 0 && (
              <span className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-bold ${
                activeTab === 'positions' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-blue-500/20 text-blue-400 dark:bg-blue-500/20 dark:text-blue-400 light:bg-blue-100 light:text-blue-600'
              }`}>
                {activePositionsCount}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-3 sm:px-5 py-3 sm:py-4 font-bold text-xs sm:text-base transition-all rounded-lg sm:rounded-xl relative ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
              : 'text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-gray-900 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center justify-center gap-1 sm:gap-2">
            <span className="hidden lg:inline">Trading </span>History
            {trades.length > 0 && (
              <span className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-bold ${
                activeTab === 'history' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-blue-500/20 text-blue-400 dark:bg-blue-500/20 dark:text-blue-400 light:bg-blue-100 light:text-blue-600'
              }`}>
                {trades.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 px-3 sm:px-5 py-3 sm:py-4 font-bold text-xs sm:text-base transition-all rounded-lg sm:rounded-xl relative ${
            activeTab === 'metrics'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
              : 'text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-gray-900 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center justify-center gap-1 sm:gap-2">
            <svg className="w-4 h-4 hidden sm:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Metrics
          </span>
        </button>
      </div>

      {/* My Positions Tab */}
      {activeTab === 'positions' && (
        <div className="space-y-4 sm:space-y-5 lg:space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 dark:from-blue-900/50 dark:to-cyan-900/50 light:from-white light:to-blue-50 backdrop-blur-md rounded-xl sm:rounded-2xl border border-blue-400/30 dark:border-blue-400/30 light:border-blue-200 p-4 sm:p-5 lg:p-6 shadow-xl shadow-blue-500/10">
              <p className="text-xs sm:text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1.5 sm:mb-2 font-semibold uppercase tracking-wide">Total Positions</p>
              <p className="text-2xl sm:text-3xl font-bold text-white dark:text-white light:text-gray-900">{activePositionsCount}</p>
            </div>
            <div className={`bg-gradient-to-br backdrop-blur-md rounded-xl sm:rounded-2xl border p-4 sm:p-5 lg:p-6 shadow-xl ${
              totalPnL >= 0 
                ? 'from-green-900/50 to-emerald-900/50 dark:from-green-900/50 dark:to-emerald-900/50 light:from-white light:to-green-50 border-green-400/30 dark:border-green-400/30 light:border-green-200 shadow-green-500/10'
                : 'from-red-900/50 to-rose-900/50 dark:from-red-900/50 dark:to-rose-900/50 light:from-white light:to-red-50 border-red-400/30 dark:border-red-400/30 light:border-red-200 shadow-red-500/10'
            }`}>
              <p className="text-xs sm:text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1.5 sm:mb-2 font-semibold uppercase tracking-wide">Total PnL</p>
              <p className={`text-2xl sm:text-3xl font-bold ${
                totalPnL >= 0 
                  ? 'text-green-400 dark:text-green-400 light:text-green-600'
                  : 'text-red-400 dark:text-red-400 light:text-red-600'
              }`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 dark:from-blue-900/50 dark:to-blue-800/50 light:from-white light:to-blue-50 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 p-4 sm:p-5 lg:p-6 shadow-xl">
              <p className="text-xs sm:text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1.5 sm:mb-2 font-semibold uppercase tracking-wide">Total Margin</p>
              <p className="text-2xl sm:text-3xl font-bold text-white dark:text-white light:text-gray-900">
                ${totalMargin.toFixed(2)}
              </p>
            </div>
            <div className={`bg-gradient-to-br backdrop-blur-md rounded-xl sm:rounded-2xl border p-4 sm:p-5 lg:p-6 shadow-xl ${
              avgROI >= 0
                ? 'from-purple-900/50 to-blue-900/50 dark:from-purple-900/50 dark:to-blue-900/50 light:from-white light:to-purple-50 border-purple-400/30 dark:border-purple-400/30 light:border-purple-200 shadow-purple-500/10'
                : 'from-red-900/50 to-rose-900/50 dark:from-red-900/50 dark:to-rose-900/50 light:from-white light:to-red-50 border-red-400/30 dark:border-red-400/30 light:border-red-200 shadow-red-500/10'
            }`}>
              <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2 font-semibold uppercase tracking-wide">Avg. ROI</p>
              <p className={`text-3xl font-bold ${
                avgROI >= 0
                  ? 'text-green-400 dark:text-green-400 light:text-green-600'
                  : 'text-red-400 dark:text-red-400 light:text-red-600'
              }`}>
                {avgROI >= 0 ? '+' : ''}{avgROI.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Positions List */}
          {activePositionsCount === 0 ? (
            <div className="bg-gradient-to-br from-black/60 to-blue-900/20 dark:from-black/60 dark:to-blue-900/20 light:from-white light:to-blue-50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 p-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/30">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-white dark:text-white light:text-gray-900">No Open Positions</h2>
              <p className="text-gray-300 dark:text-gray-300 light:text-gray-600 text-lg mb-10 max-w-md mx-auto">
                Start trading with your bots to see active positions here
              </p>
              <a
                href="/automation"
                className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl font-bold text-white hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:scale-105"
              >
                Start Auto Trading
              </a>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedPositions.map((position) => {
                  if (!position.currentPosition) return null;
                  
                  const currentPrice = currentPrices[position.currentPosition.symbol] || position.currentPosition.entryPrice;
                const { pnl, pnlPercent } = calculateLivePnL(position.currentPosition, currentPrice);
                const liquidationPrice = calculateLiquidationPrice(position.currentPosition);
                const margin = position.currentPosition.entryPrice * position.currentPosition.quantity;

                return (
                  <div
                    key={position._id}
                    className="bg-gradient-to-br from-black/60 to-blue-900/20 dark:from-black/60 dark:to-blue-900/20 light:from-white light:to-blue-50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 p-6 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg">
                          {position.currentPosition.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-xl text-white dark:text-white light:text-gray-900">{position.currentPosition.symbol}</h3>
                            <span
                              className={`px-3 py-1 rounded-lg text-sm font-bold ${
                                position.currentPosition.side.toLowerCase() === 'long'
                                  ? 'bg-green-500/30 text-green-300 border border-green-400/30 dark:bg-green-500/30 dark:text-green-300 dark:border-green-400/30 light:bg-green-100 light:text-green-700 light:border-green-300'
                                  : 'bg-red-500/30 text-red-300 border border-red-400/30 dark:bg-red-500/30 dark:text-red-300 dark:border-red-400/30 light:bg-red-100 light:text-red-700 light:border-red-300'
                              }`}
                            >
                              {position.currentPosition.side.toUpperCase()}
                            </span>
                            <span className="px-3 py-1 bg-blue-500/30 dark:bg-blue-500/30 light:bg-blue-100 text-blue-300 dark:text-blue-300 light:text-blue-700 rounded-lg text-sm font-bold border border-blue-400/30 dark:border-blue-400/30 light:border-blue-300">
                              {position.currentPosition.leverage}x
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-600 font-medium">
                            Bot: {position.botName} • Opened {new Date(position.currentPosition.openTime).toLocaleString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-bold ${pnl >= 0 ? 'text-green-400 dark:text-green-400 light:text-green-600' : 'text-red-400 dark:text-red-400 light:text-red-600'}`}>
                          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} USDT
                        </p>
                        <p className={`text-base font-semibold ${pnl >= 0 ? 'text-green-400 dark:text-green-400 light:text-green-600' : 'text-red-400 dark:text-red-400 light:text-red-600'}`}>
                          {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 bg-black/30 dark:bg-black/30 light:bg-blue-50 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-white/10 light:border-blue-200">
                      <div>
                        <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1 font-semibold uppercase tracking-wide">Entry Price</p>
                        <p className="font-bold text-white dark:text-white light:text-gray-900 text-lg">${position.currentPosition.entryPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1 font-semibold uppercase tracking-wide">Current Price</p>
                        <p className="font-bold text-white dark:text-white light:text-gray-900 text-lg">${currentPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1 font-semibold uppercase tracking-wide">Quantity</p>
                        <p className="font-bold text-white dark:text-white light:text-gray-900 text-lg">{position.currentPosition.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1 font-semibold uppercase tracking-wide">Margin</p>
                        <p className="font-bold text-white dark:text-white light:text-gray-900 text-lg">${margin.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1 font-semibold uppercase tracking-wide">Liquidation</p>
                        <p className="font-bold text-red-400 dark:text-red-400 light:text-red-600 text-lg">${liquidationPrice.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 bg-black/30 dark:bg-black/30 light:bg-blue-50 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-white/10 light:border-blue-200">
                      <div>
                        <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1 font-semibold uppercase tracking-wide">Stop Loss</p>
                        <p className="font-bold text-red-400 dark:text-red-400 light:text-red-600 text-lg">${position.currentPosition.stopLoss.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1 font-semibold uppercase tracking-wide">Take Profit</p>
                        <p className="font-bold text-green-400 dark:text-green-400 light:text-green-600 text-lg">${position.currentPosition.takeProfit.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          if (confirm(`Are you sure you want to close this ${position.currentPosition?.side} position on ${position.currentPosition?.symbol}?`)) {
                            fetch(`/api/bots/${position._id}`, { method: 'DELETE' })
                              .then(() => fetchPositions());
                          }
                        }}
                        className="flex-1 px-5 py-3 bg-red-500/30 hover:bg-red-500/40 border border-red-400/40 hover:border-red-400/60 rounded-xl text-sm font-bold text-red-300 transition-all hover:shadow-lg hover:shadow-red-500/20"
                      >
                        Close Position
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls for Positions */}
            {activePositions.length > 0 && (
              <div className="mt-6 px-6 py-4 bg-gradient-to-br from-black/60 to-blue-900/20 dark:from-black/60 dark:to-blue-900/20 light:from-white light:to-blue-50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700">Show:</label>
                  <select
                    value={positionsPerPage}
                    onChange={(e) => setPositionsPerPage(Number(e.target.value))}
                    className="px-3 py-1 bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-300 rounded text-white dark:text-white light:text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700">
                    Showing {positionsStartIndex + 1}-{Math.min(positionsEndIndex, activePositions.length)} of {activePositions.length}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPositionsPage(1)}
                    disabled={positionsPage === 1}
                    className="px-3 py-1 bg-gray-800 dark:bg-gray-800 light:bg-gray-200 text-white dark:text-white light:text-gray-900 rounded text-sm hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setPositionsPage(prev => Math.max(1, prev - 1))}
                    disabled={positionsPage === 1}
                    className="px-3 py-1 bg-gray-800 dark:bg-gray-800 light:bg-gray-200 text-white dark:text-white light:text-gray-900 rounded text-sm hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPositionsPages) }, (_, i) => {
                      let pageNum;
                      if (totalPositionsPages <= 5) {
                        pageNum = i + 1;
                      } else if (positionsPage <= 3) {
                        pageNum = i + 1;
                      } else if (positionsPage >= totalPositionsPages - 2) {
                        pageNum = totalPositionsPages - 4 + i;
                      } else {
                        pageNum = positionsPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPositionsPage(pageNum)}
                          className={`px-3 py-1 rounded text-sm ${
                            positionsPage === pageNum
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-800 dark:bg-gray-800 light:bg-gray-200 text-gray-300 dark:text-gray-300 light:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPositionsPage(prev => Math.min(totalPositionsPages, prev + 1))}
                    disabled={positionsPage === totalPositionsPages}
                    className="px-3 py-1 bg-gray-800 dark:bg-gray-800 light:bg-gray-200 text-white dark:text-white light:text-gray-900 rounded text-sm hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setPositionsPage(totalPositionsPages)}
                    disabled={positionsPage === totalPositionsPages}
                    className="px-3 py-1 bg-gray-800 dark:bg-gray-800 light:bg-gray-200 text-white dark:text-white light:text-gray-900 rounded text-sm hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
          )}
        </div>
      )}

      {/* Trading History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {trades.length === 0 ? (
            <div className="bg-gradient-to-br from-black/60 to-blue-900/20 dark:from-black/60 dark:to-blue-900/20 light:from-white light:to-blue-50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 p-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/30">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-white dark:text-white light:text-gray-900">No Trading History Yet</h2>
              <p className="text-gray-300 dark:text-gray-300 light:text-gray-600 text-lg mb-10 max-w-md mx-auto">
                Your completed trades will appear here. Start trading to see your history.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/automation"
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl font-bold text-white hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:scale-105"
                >
                  Start Auto Trading
                </a>
                <a
                  href="/dashboard"
                  className="px-8 py-4 bg-white/10 dark:bg-white/10 light:bg-blue-100 border border-white/20 dark:border-white/20 light:border-blue-300 rounded-xl font-bold text-white dark:text-white light:text-gray-900 hover:bg-white/20 dark:hover:bg-white/20 light:hover:bg-blue-200 transition-all hover:scale-105"
                >
                  Back to Dashboard
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedTrades.map((trade) => (
                <div
                  key={trade._id}
                  className="bg-gradient-to-br from-black/60 to-blue-900/20 dark:from-black/60 dark:to-blue-900/20 light:from-white light:to-blue-50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 p-6 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg">
                        {trade.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-white dark:text-white light:text-gray-900">{trade.symbol}</h3>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              trade.side === 'long'
                                ? 'bg-green-500/30 text-green-300 dark:bg-green-500/30 dark:text-green-300 light:bg-green-100 light:text-green-700'
                                : 'bg-red-500/30 text-red-300 dark:bg-red-500/30 dark:text-red-300 light:bg-red-100 light:text-red-700'
                            }`}
                          >
                            {trade.side.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">
                          {new Date(trade.entryTime).toLocaleString()} - {trade.exitTime ? new Date(trade.exitTime).toLocaleString() : 'Ongoing'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${(trade.pnl || 0) >= 0 ? 'text-green-400 dark:text-green-400 light:text-green-600' : 'text-red-400 dark:text-red-400 light:text-red-600'}`}>
                        {(trade.pnl || 0) >= 0 ? '+' : ''}{(trade.pnl || 0).toFixed(2)} USDT
                      </p>
                      <p className={`text-sm font-semibold ${(trade.pnlPercentage || 0) >= 0 ? 'text-green-400 dark:text-green-400 light:text-green-600' : 'text-red-400 dark:text-red-400 light:text-red-600'}`}>
                        {(trade.pnlPercentage || 0) >= 0 ? '+' : ''}{(trade.pnlPercentage || 0).toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">Entry Price</p>
                      <p className="font-bold text-white dark:text-white light:text-gray-900">${trade.entryPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">Exit Price</p>
                      <p className="font-bold text-white dark:text-white light:text-gray-900">${(trade.exitPrice || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">Quantity</p>
                      <p className="font-bold text-white dark:text-white light:text-gray-900">{trade.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">Fees</p>
                      <p className="font-bold text-white dark:text-white light:text-gray-900">${(trade.fees || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls for History */}
            {trades.length > 0 && (
              <div className="mt-6 px-6 py-4 bg-gradient-to-br from-black/60 to-blue-900/20 dark:from-black/60 dark:to-blue-900/20 light:from-white light:to-blue-50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700">Show:</label>
                  <select
                    value={historyPerPage}
                    onChange={(e) => setHistoryPerPage(Number(e.target.value))}
                    className="px-3 py-1 bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-300 rounded text-white dark:text-white light:text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700">
                    Showing {historyStartIndex + 1}-{Math.min(historyEndIndex, trades.length)} of {trades.length}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setHistoryPage(1)}
                    disabled={historyPage === 1}
                    className="px-3 py-1 bg-gray-800 dark:bg-gray-800 light:bg-gray-200 text-white dark:text-white light:text-gray-900 rounded text-sm hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                    disabled={historyPage === 1}
                    className="px-3 py-1 bg-gray-800 dark:bg-gray-800 light:bg-gray-200 text-white dark:text-white light:text-gray-900 rounded text-sm hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalHistoryPages) }, (_, i) => {
                      let pageNum;
                      if (totalHistoryPages <= 5) {
                        pageNum = i + 1;
                      } else if (historyPage <= 3) {
                        pageNum = i + 1;
                      } else if (historyPage >= totalHistoryPages - 2) {
                        pageNum = totalHistoryPages - 4 + i;
                      } else {
                        pageNum = historyPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setHistoryPage(pageNum)}
                          className={`px-3 py-1 rounded text-sm ${
                            historyPage === pageNum
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-800 dark:bg-gray-800 light:bg-gray-200 text-gray-300 dark:text-gray-300 light:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setHistoryPage(prev => Math.min(totalHistoryPages, prev + 1))}
                    disabled={historyPage === totalHistoryPages}
                    className="px-3 py-1 bg-gray-800 dark:bg-gray-800 light:bg-gray-200 text-white dark:text-white light:text-gray-900 rounded text-sm hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setHistoryPage(totalHistoryPages)}
                    disabled={historyPage === totalHistoryPages}
                    className="px-3 py-1 bg-gray-800 dark:bg-gray-800 light:bg-gray-200 text-white dark:text-white light:text-gray-900 rounded text-sm hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
          )}
        </div>
      )}

      {/* Performance Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-4 sm:space-y-5 lg:space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 dark:from-purple-900/50 dark:to-pink-900/50 light:from-white light:to-purple-50 backdrop-blur-md rounded-xl sm:rounded-2xl border border-purple-400/30 dark:border-purple-400/30 light:border-purple-200 p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white dark:text-white light:text-gray-900">Performance Metrics</h2>
                <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-600">Advanced trading analytics based on {trades.length} trades</p>
              </div>
            </div>
          </div>

          {trades.length === 0 ? (
            <div className="bg-white/5 dark:bg-white/5 light:bg-gray-50 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/10 dark:border-white/10 light:border-gray-200 p-8 text-center">
              <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-xl font-bold text-white dark:text-white light:text-gray-900 mb-2">No Trading Data Yet</h3>
              <p className="text-gray-400 dark:text-gray-400 light:text-gray-600">Start trading to see your performance metrics</p>
            </div>
          ) : (
            <>
              {/* Risk-Adjusted Returns */}
              <div>
                <h3 className="text-lg font-bold text-white dark:text-white light:text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Risk-Adjusted Returns
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Sharpe Ratio */}
                  <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 dark:from-blue-900/40 dark:to-cyan-900/40 light:from-white light:to-blue-50 backdrop-blur-md rounded-xl border border-blue-400/30 dark:border-blue-400/30 light:border-blue-200 p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 font-semibold uppercase tracking-wide">Sharpe Ratio</p>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-gray-900 dark:bg-gray-900 light:bg-white text-xs text-white dark:text-white light:text-gray-900 rounded-lg shadow-xl -right-2 top-6 border border-white/10 dark:border-white/10 light:border-gray-200">
                          Measures risk-adjusted return. &gt;1 is good, &gt;2 is excellent
                        </div>
                      </div>
                    </div>
                    <p className={`text-3xl font-bold ${
                      performanceMetrics.sharpeRatio >= 2 ? 'text-green-400 dark:text-green-400 light:text-green-600' :
                      performanceMetrics.sharpeRatio >= 1 ? 'text-yellow-400 dark:text-yellow-400 light:text-yellow-600' :
                      'text-red-400 dark:text-red-400 light:text-red-600'
                    }`}>
                      {performanceMetrics.sharpeRatio.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mt-1">
                      {performanceMetrics.sharpeRatio >= 2 ? '🎯 Excellent' :
                       performanceMetrics.sharpeRatio >= 1 ? '👍 Good' :
                       performanceMetrics.sharpeRatio >= 0 ? '⚠️ Fair' : '❌ Poor'}
                    </p>
                  </div>

                  {/* Max Drawdown */}
                  <div className="bg-gradient-to-br from-red-900/40 to-rose-900/40 dark:from-red-900/40 dark:to-rose-900/40 light:from-white light:to-red-50 backdrop-blur-md rounded-xl border border-red-400/30 dark:border-red-400/30 light:border-red-200 p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 font-semibold uppercase tracking-wide">Max Drawdown</p>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-gray-900 dark:bg-gray-900 light:bg-white text-xs text-white dark:text-white light:text-gray-900 rounded-lg shadow-xl -right-2 top-6 border border-white/10 dark:border-white/10 light:border-gray-200">
                          Largest peak-to-trough decline. Lower is better
                        </div>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-red-400 dark:text-red-400 light:text-red-600">
                      {performanceMetrics.maxDrawdown.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mt-1">
                      {performanceMetrics.maxDrawdown <= 10 ? '✅ Excellent' :
                       performanceMetrics.maxDrawdown <= 20 ? '👍 Good' :
                       performanceMetrics.maxDrawdown <= 30 ? '⚠️ High' : '🚨 Very High'}
                    </p>
                  </div>

                  {/* Calmar Ratio */}
                  <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 dark:from-purple-900/40 dark:to-pink-900/40 light:from-white light:to-purple-50 backdrop-blur-md rounded-xl border border-purple-400/30 dark:border-purple-400/30 light:border-purple-200 p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 font-semibold uppercase tracking-wide">Calmar Ratio</p>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-gray-900 dark:bg-gray-900 light:bg-white text-xs text-white dark:text-white light:text-gray-900 rounded-lg shadow-xl -right-2 top-6 border border-white/10 dark:border-white/10 light:border-gray-200">
                          Return vs max drawdown. Higher is better
                        </div>
                      </div>
                    </div>
                    <p className={`text-3xl font-bold ${
                      performanceMetrics.calmarRatio >= 3 ? 'text-green-400 dark:text-green-400 light:text-green-600' :
                      performanceMetrics.calmarRatio >= 1 ? 'text-yellow-400 dark:text-yellow-400 light:text-yellow-600' :
                      'text-red-400 dark:text-red-400 light:text-red-600'
                    }`}>
                      {Math.min(performanceMetrics.calmarRatio, 999).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mt-1">
                      {performanceMetrics.calmarRatio >= 3 ? '🎯 Excellent' :
                       performanceMetrics.calmarRatio >= 1 ? '👍 Good' : '⚠️ Fair'}
                    </p>
                  </div>

                  {/* Recovery Factor */}
                  <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 dark:from-green-900/40 dark:to-emerald-900/40 light:from-white light:to-green-50 backdrop-blur-md rounded-xl border border-green-400/30 dark:border-green-400/30 light:border-green-200 p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 font-semibold uppercase tracking-wide">Recovery Factor</p>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-gray-900 dark:bg-gray-900 light:bg-white text-xs text-white dark:text-white light:text-gray-900 rounded-lg shadow-xl -right-2 top-6 border border-white/10 dark:border-white/10 light:border-gray-200">
                          Net profit / max drawdown. Higher is better
                        </div>
                      </div>
                    </div>
                    <p className={`text-3xl font-bold ${
                      performanceMetrics.recoveryFactor >= 2 ? 'text-green-400 dark:text-green-400 light:text-green-600' :
                      performanceMetrics.recoveryFactor >= 1 ? 'text-yellow-400 dark:text-yellow-400 light:text-yellow-600' :
                      'text-red-400 dark:text-red-400 light:text-red-600'
                    }`}>
                      {Math.min(performanceMetrics.recoveryFactor, 999).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mt-1">
                      {performanceMetrics.recoveryFactor >= 2 ? '🎯 Excellent' :
                       performanceMetrics.recoveryFactor >= 1 ? '👍 Good' : '⚠️ Fair'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profitability Metrics */}
              <div>
                <h3 className="text-lg font-bold text-white dark:text-white light:text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Profitability Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Profit Factor */}
                  <div className="bg-white/5 dark:bg-white/5 light:bg-white backdrop-blur-md rounded-xl border border-white/10 dark:border-white/10 light:border-gray-200 p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 font-semibold uppercase tracking-wide">Profit Factor</p>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-gray-900 dark:bg-gray-900 light:bg-white text-xs text-white dark:text-white light:text-gray-900 rounded-lg shadow-xl -right-2 top-6 border border-white/10 dark:border-white/10 light:border-gray-200">
                          Gross profit / gross loss. &gt;1.5 is good
                        </div>
                      </div>
                    </div>
                    <p className={`text-3xl font-bold ${
                      performanceMetrics.profitFactor >= 2 ? 'text-green-400 dark:text-green-400 light:text-green-600' :
                      performanceMetrics.profitFactor >= 1.5 ? 'text-yellow-400 dark:text-yellow-400 light:text-yellow-600' :
                      performanceMetrics.profitFactor >= 1 ? 'text-orange-400 dark:text-orange-400 light:text-orange-600' :
                      'text-red-400 dark:text-red-400 light:text-red-600'
                    }`}>
                      {Math.min(performanceMetrics.profitFactor, 99).toFixed(2)}
                    </p>
                  </div>

                  {/* Win Rate */}
                  <div className="bg-white/5 dark:bg-white/5 light:bg-white backdrop-blur-md rounded-xl border border-white/10 dark:border-white/10 light:border-gray-200 p-5 shadow-lg">
                    <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 font-semibold uppercase tracking-wide mb-2">Win Rate</p>
                    <p className={`text-3xl font-bold ${
                      performanceMetrics.winRate >= 60 ? 'text-green-400 dark:text-green-400 light:text-green-600' :
                      performanceMetrics.winRate >= 50 ? 'text-yellow-400 dark:text-yellow-400 light:text-yellow-600' :
                      'text-red-400 dark:text-red-400 light:text-red-600'
                    }`}>
                      {performanceMetrics.winRate.toFixed(1)}%
                    </p>
                  </div>

                  {/* Average Win */}
                  <div className="bg-white/5 dark:bg-white/5 light:bg-white backdrop-blur-md rounded-xl border border-white/10 dark:border-white/10 light:border-gray-200 p-5 shadow-lg">
                    <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 font-semibold uppercase tracking-wide mb-2">Avg Win</p>
                    <p className="text-3xl font-bold text-green-400 dark:text-green-400 light:text-green-600">
                      ${performanceMetrics.avgWinLoss.avgWin.toFixed(2)}
                    </p>
                  </div>

                  {/* Average Loss */}
                  <div className="bg-white/5 dark:bg-white/5 light:bg-white backdrop-blur-md rounded-xl border border-white/10 dark:border-white/10 light:border-gray-200 p-5 shadow-lg">
                    <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 font-semibold uppercase tracking-wide mb-2">Avg Loss</p>
                    <p className="text-3xl font-bold text-red-400 dark:text-red-400 light:text-red-600">
                      ${performanceMetrics.avgWinLoss.avgLoss.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div>
                <h3 className="text-lg font-bold text-white dark:text-white light:text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Additional Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Expectancy */}
                  <div className="bg-white/5 dark:bg-white/5 light:bg-white backdrop-blur-md rounded-xl border border-white/10 dark:border-white/10 light:border-gray-200 p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 font-semibold uppercase tracking-wide">Expectancy</p>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-gray-900 dark:bg-gray-900 light:bg-white text-xs text-white dark:text-white light:text-gray-900 rounded-lg shadow-xl -right-2 top-6 border border-white/10 dark:border-white/10 light:border-gray-200">
                          Average $ per trade (positive is profitable)
                        </div>
                      </div>
                    </div>
                    <p className={`text-3xl font-bold ${
                      performanceMetrics.expectancy >= 0 
                        ? 'text-green-400 dark:text-green-400 light:text-green-600' 
                        : 'text-red-400 dark:text-red-400 light:text-red-600'
                    }`}>
                      ${performanceMetrics.expectancy.toFixed(2)}
                    </p>
                  </div>

                  {/* Total Fees */}
                  <div className="bg-white/5 dark:bg-white/5 light:bg-white backdrop-blur-md rounded-xl border border-white/10 dark:border-white/10 light:border-gray-200 p-5 shadow-lg">
                    <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 font-semibold uppercase tracking-wide mb-2">Total Fees</p>
                    <p className="text-3xl font-bold text-orange-400 dark:text-orange-400 light:text-orange-600">
                      ${performanceMetrics.totalFees.toFixed(2)}
                    </p>
                  </div>

                  {/* Max Win Streak */}
                  <div className="bg-white/5 dark:bg-white/5 light:bg-white backdrop-blur-md rounded-xl border border-white/10 dark:border-white/10 light:border-gray-200 p-5 shadow-lg">
                    <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 font-semibold uppercase tracking-wide mb-2">Win Streak</p>
                    <p className="text-3xl font-bold text-green-400 dark:text-green-400 light:text-green-600">
                      {performanceMetrics.streaks.maxWinStreak} 🔥
                    </p>
                  </div>

                  {/* Max Loss Streak */}
                  <div className="bg-white/5 dark:bg-white/5 light:bg-white backdrop-blur-md rounded-xl border border-white/10 dark:border-white/10 light:border-gray-200 p-5 shadow-lg">
                    <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 font-semibold uppercase tracking-wide mb-2">Loss Streak</p>
                    <p className="text-3xl font-bold text-red-400 dark:text-red-400 light:text-red-600">
                      {performanceMetrics.streaks.maxLossStreak} ❄️
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 dark:bg-blue-500/10 light:bg-blue-50 border border-blue-400/30 dark:border-blue-400/30 light:border-blue-200 rounded-xl p-5">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-bold text-blue-300 dark:text-blue-300 light:text-blue-600 mb-1">Understanding These Metrics</h4>
                    <ul className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 space-y-1">
                      <li>• <strong>Sharpe Ratio:</strong> Higher is better (&gt;1 good, &gt;2 excellent)</li>
                      <li>• <strong>Max Drawdown:</strong> Lower is better (&lt;20% good)</li>
                      <li>• <strong>Profit Factor:</strong> &gt;1.5 indicates profitable strategy</li>
                      <li>• <strong>Expectancy:</strong> Positive means profitable on average</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
