'use client';

import { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions');
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPrices, setCurrentPrices] = useState<{ [key: string]: number }>({});

  // Fetch active bot positions
  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/bots');
      if (response.ok) {
        const data = await response.json();
        const activePositions = data.filter((bot: Position) => 
          bot.status === 'ACTIVE' && bot.currentPosition
        );
        setPositions(activePositions);
        
        // Fetch current prices for active positions
        activePositions.forEach((pos: Position) => {
          if (pos.currentPosition) {
            fetchCurrentPrice(pos.currentPosition.symbol);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  // Fetch closed trades history
  const fetchTrades = async () => {
    try {
      const response = await fetch('/api/trades');
      if (response.ok) {
        const data = await response.json();
        setTrades(data.filter((trade: Trade) => trade.status === 'closed'));
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current price from Binance
  const fetchCurrentPrice = async (symbol: string) => {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentPrices(prev => ({
          ...prev,
          [symbol]: parseFloat(data.price)
        }));
      }
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
    }
  };

  useEffect(() => {
    fetchPositions();
    fetchTrades();
    
    // Refresh positions every 10 seconds
    const interval = setInterval(() => {
      fetchPositions();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/10 dark:to-cyan-500/10 light:from-blue-100 light:to-cyan-100 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-white/20 dark:border-white/20 light:border-blue-200">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-400 dark:to-cyan-400 light:from-blue-600 light:to-cyan-600 bg-clip-text text-transparent">
            Trading Overview
          </span>
        </h1>
        <p className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-sm sm:text-base lg:text-lg">Monitor your open positions and trading history</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 sm:gap-3 bg-black/40 dark:bg-black/40 light:bg-white backdrop-blur-md rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-white/10 dark:border-white/10 light:border-gray-200">
        <button
          onClick={() => setActiveTab('positions')}
          className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-bold text-sm sm:text-base transition-all rounded-lg sm:rounded-xl relative ${
            activeTab === 'positions'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
              : 'text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-gray-900 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5 sm:gap-2">
            <span className="hidden sm:inline">My </span>Positions
            {activePositionsCount > 0 && (
              <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-bold ${
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
          className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-bold text-sm sm:text-base transition-all rounded-lg sm:rounded-xl relative ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
              : 'text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-gray-900 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5 sm:gap-2">
            <span className="hidden sm:inline">Trading </span>History
            {trades.length > 0 && (
              <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-bold ${
                activeTab === 'history' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-blue-500/20 text-blue-400 dark:bg-blue-500/20 dark:text-blue-400 light:bg-blue-100 light:text-blue-600'
              }`}>
                {trades.length}
              </span>
            )}
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
                href="/dashboard/automation"
                className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl font-bold text-white hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:scale-105"
              >
                Start Auto Trading
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {positions.map((position) => {
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
                  href="/dashboard/automation"
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
            <div className="space-y-4">
              {trades.map((trade) => (
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
          )}
        </div>
      )}
    </div>
  );
}
