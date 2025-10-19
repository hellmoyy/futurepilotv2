'use client';

import { useState } from 'react';

interface Position {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT' | 'BUY';
  leverage: string;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  margin: number;
  pnl: number;
  pnlPercentage: number;
  liquidationPrice?: number;
  openTime: Date;
}

// Sample open positions
const mockPositions: Position[] = [
  {
    id: '1',
    symbol: 'BTCUSDT',
    type: 'LONG',
    leverage: '10x',
    entryPrice: 65000,
    currentPrice: 67234.50,
    quantity: 0.5,
    margin: 3250,
    pnl: 1117.25,
    pnlPercentage: 34.37,
    liquidationPrice: 58500,
    openTime: new Date('2024-10-05T10:30:00'),
  },
  {
    id: '2',
    symbol: 'ETHUSDT',
    type: 'LONG',
    leverage: '5x',
    entryPrice: 3200,
    currentPrice: 3456.78,
    quantity: 2,
    margin: 1280,
    pnl: 513.56,
    pnlPercentage: 40.12,
    liquidationPrice: 2560,
    openTime: new Date('2024-10-05T14:20:00'),
  },
  {
    id: '3',
    symbol: 'SOLUSDT',
    type: 'SHORT',
    leverage: '3x',
    entryPrice: 160,
    currentPrice: 156.78,
    quantity: 10,
    margin: 533.33,
    pnl: 96.60,
    pnlPercentage: 18.11,
    liquidationPrice: 213.33,
    openTime: new Date('2024-10-06T08:15:00'),
  },
];

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions');

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
            {mockPositions.length > 0 && (
              <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-bold ${
                activeTab === 'positions' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-blue-500/20 text-blue-400 dark:bg-blue-500/20 dark:text-blue-400 light:bg-blue-100 light:text-blue-600'
              }`}>
                {mockPositions.length}
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
          <span className="hidden sm:inline">Trading </span>History
        </button>
      </div>

      {/* My Positions Tab */}
      {activeTab === 'positions' && (
        <div className="space-y-4 sm:space-y-5 lg:space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 dark:from-blue-900/50 dark:to-cyan-900/50 light:from-white light:to-blue-50 backdrop-blur-md rounded-2xl border border-blue-400/30 dark:border-blue-400/30 light:border-blue-200 p-6 shadow-xl shadow-blue-500/10">
              <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2 font-semibold uppercase tracking-wide">Total Positions</p>
              <p className="text-3xl font-bold text-white dark:text-white light:text-gray-900">{mockPositions.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 dark:from-green-900/50 dark:to-emerald-900/50 light:from-white light:to-green-50 backdrop-blur-md rounded-2xl border border-green-400/30 dark:border-green-400/30 light:border-green-200 p-6 shadow-xl shadow-green-500/10">
              <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2 font-semibold uppercase tracking-wide">Total PnL</p>
              <p className="text-3xl font-bold text-green-400 dark:text-green-400 light:text-green-600">
                +${mockPositions.reduce((sum, pos) => sum + pos.pnl, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 dark:from-blue-900/50 dark:to-blue-800/50 light:from-white light:to-blue-50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 p-6 shadow-xl">
              <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2 font-semibold uppercase tracking-wide">Total Margin</p>
              <p className="text-3xl font-bold text-white dark:text-white light:text-gray-900">
                ${mockPositions.reduce((sum, pos) => sum + pos.margin, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 dark:from-purple-900/50 dark:to-blue-900/50 light:from-white light:to-purple-50 backdrop-blur-md rounded-2xl border border-purple-400/30 dark:border-purple-400/30 light:border-purple-200 p-6 shadow-xl shadow-purple-500/10">
              <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2 font-semibold uppercase tracking-wide">Avg. ROI</p>
              <p className="text-3xl font-bold text-green-400 dark:text-green-400 light:text-green-600">
                +{(mockPositions.reduce((sum, pos) => sum + pos.pnlPercentage, 0) / mockPositions.length).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Positions List */}
          <div className="space-y-4">
            {mockPositions.map((position) => (
              <div
                key={position.id}
                className="bg-gradient-to-br from-black/60 to-blue-900/20 dark:from-black/60 dark:to-blue-900/20 light:from-white light:to-blue-50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 p-6 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg">
                      {position.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-xl text-white dark:text-white light:text-gray-900">{position.symbol}</h3>
                        <span
                          className={`px-3 py-1 rounded-lg text-sm font-bold ${
                            position.type === 'LONG'
                              ? 'bg-green-500/30 text-green-300 border border-green-400/30 dark:bg-green-500/30 dark:text-green-300 dark:border-green-400/30 light:bg-green-100 light:text-green-700 light:border-green-300'
                              : 'bg-red-500/30 text-red-300 border border-red-400/30 dark:bg-red-500/30 dark:text-red-300 dark:border-red-400/30 light:bg-red-100 light:text-red-700 light:border-red-300'
                          }`}
                        >
                          {position.type}
                        </span>
                        <span className="px-3 py-1 bg-blue-500/30 dark:bg-blue-500/30 light:bg-blue-100 text-blue-300 dark:text-blue-300 light:text-blue-700 rounded-lg text-sm font-bold border border-blue-400/30 dark:border-blue-400/30 light:border-blue-300">
                          {position.leverage}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-600 font-medium">
                        Opened {position.openTime.toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${position.pnl >= 0 ? 'text-green-400 dark:text-green-400 light:text-green-600' : 'text-red-400 dark:text-red-400 light:text-red-600'}`}>
                      {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(2)} USDT
                    </p>
                    <p className={`text-base font-semibold ${position.pnl >= 0 ? 'text-green-400 dark:text-green-400 light:text-green-600' : 'text-red-400 dark:text-red-400 light:text-red-600'}`}>
                      {position.pnl >= 0 ? '+' : ''}{position.pnlPercentage.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 bg-black/30 dark:bg-black/30 light:bg-blue-50 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-white/10 light:border-blue-200">
                  <div>
                    <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1 font-semibold uppercase tracking-wide">Entry Price</p>
                    <p className="font-bold text-white dark:text-white light:text-gray-900 text-lg">${position.entryPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1 font-semibold uppercase tracking-wide">Current Price</p>
                    <p className="font-bold text-white dark:text-white light:text-gray-900 text-lg">${position.currentPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1 font-semibold uppercase tracking-wide">Quantity</p>
                    <p className="font-bold text-white dark:text-white light:text-gray-900 text-lg">{position.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1 font-semibold uppercase tracking-wide">Margin</p>
                    <p className="font-bold text-white dark:text-white light:text-gray-900 text-lg">${position.margin.toFixed(2)}</p>
                  </div>
                  {position.liquidationPrice && (
                    <div>
                      <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1 font-semibold uppercase tracking-wide">Liquidation</p>
                      <p className="font-bold text-red-400 dark:text-red-400 light:text-red-600 text-lg">${position.liquidationPrice.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 px-5 py-3 bg-red-500/30 hover:bg-red-500/40 border border-red-400/40 hover:border-red-400/60 rounded-xl text-sm font-bold text-red-300 transition-all hover:shadow-lg hover:shadow-red-500/20">
                    Close Position
                  </button>
                  <button className="flex-1 px-5 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 hover:border-blue-400/50 rounded-xl text-sm font-bold text-blue-300 transition-all hover:shadow-lg hover:shadow-blue-500/20">
                    Add Margin
                  </button>
                  <button className="flex-1 px-5 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 hover:border-green-400/50 rounded-xl text-sm font-bold text-green-300 transition-all hover:shadow-lg hover:shadow-green-500/20">
                    Set TP/SL
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trading History Tab */}
      {activeTab === 'history' && (
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
      )}
    </div>
  );
}
