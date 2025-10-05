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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-blue-300 to-blue-600 bg-clip-text text-transparent">
            Trading Overview
          </span>
        </h1>
        <p className="text-gray-400">Monitor your open positions and trading history</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('positions')}
          className={`px-6 py-3 font-semibold transition-all relative ${
            activeTab === 'positions'
              ? 'text-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          My Positions
          {activeTab === 'positions' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
          )}
          {mockPositions.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
              {mockPositions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-semibold transition-all relative ${
            activeTab === 'history'
              ? 'text-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Trading History
          {activeTab === 'history' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
          )}
        </button>
      </div>

      {/* My Positions Tab */}
      {activeTab === 'positions' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-xl rounded-xl border border-blue-500/30 p-4">
              <p className="text-sm text-gray-400 mb-1">Total Positions</p>
              <p className="text-2xl font-bold">{mockPositions.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-xl rounded-xl border border-green-500/30 p-4">
              <p className="text-sm text-gray-400 mb-1">Total PnL</p>
              <p className="text-2xl font-bold text-green-400">
                +${mockPositions.reduce((sum, pos) => sum + pos.pnl, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-black/50 backdrop-blur-xl rounded-xl border border-white/10 p-4">
              <p className="text-sm text-gray-400 mb-1">Total Margin</p>
              <p className="text-2xl font-bold">
                ${mockPositions.reduce((sum, pos) => sum + pos.margin, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-black/50 backdrop-blur-xl rounded-xl border border-white/10 p-4">
              <p className="text-sm text-gray-400 mb-1">Avg. ROI</p>
              <p className="text-2xl font-bold text-green-400">
                +{(mockPositions.reduce((sum, pos) => sum + pos.pnlPercentage, 0) / mockPositions.length).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Positions List */}
          <div className="space-y-3">
            {mockPositions.map((position) => (
              <div
                key={position.id}
                className="bg-black/50 backdrop-blur-xl rounded-xl border border-white/10 p-4 hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-lg flex items-center justify-center font-bold">
                      {position.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{position.symbol}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            position.type === 'LONG'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {position.type}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                          {position.leverage}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
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
                    <p className={`text-2xl font-bold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(2)} USDT
                    </p>
                    <p className={`text-sm ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {position.pnl >= 0 ? '+' : ''}{position.pnlPercentage.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Entry Price</p>
                    <p className="font-semibold">${position.entryPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Current Price</p>
                    <p className="font-semibold">${position.currentPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Quantity</p>
                    <p className="font-semibold">{position.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Margin</p>
                    <p className="font-semibold">${position.margin.toFixed(2)}</p>
                  </div>
                  {position.liquidationPrice && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Liquidation</p>
                      <p className="font-semibold text-red-400">${position.liquidationPrice.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm font-semibold text-red-400 transition-all">
                    Close Position
                  </button>
                  <button className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-all">
                    Add Margin
                  </button>
                  <button className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-all">
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
        <div className="bg-black/50 rounded-2xl border border-white/10 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">No Trading History Yet</h2>
          <p className="text-gray-400 mb-8">
            Your completed trades will appear here. Start trading to see your history.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/dashboard/futures"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              Start Trading
            </a>
            <a
              href="/dashboard"
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg font-semibold hover:bg-white/10 transition-all"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
