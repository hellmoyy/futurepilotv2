'use client';

import { useState, useEffect } from 'react';

interface DBStatus {
  success: boolean;
  status: string;
  database?: string;
  collections?: string[];
  error?: string;
}

interface Trade {
  _id: string;
  symbol: string;
  type: string;
  side: string;
  entryPrice: number;
  quantity: number;
  status: string;
  pnl?: number;
  entryTime: string;
}

export default function Dashboard() {
  const [dbStatus, setDbStatus] = useState<DBStatus | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDBStatus();
    fetchTrades();
  }, []);

  const fetchDBStatus = async () => {
    try {
      const res = await fetch('/api/db/test');
      const data = await res.json();
      setDbStatus(data);
    } catch (error) {
      console.error('Failed to fetch DB status:', error);
    }
  };

  const fetchTrades = async () => {
    try {
      const res = await fetch('/api/trades');
      const data = await res.json();
      if (data.success) {
        setTrades(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-blue-600 bg-clip-text text-transparent">
                FuturePilot
              </span>
            </a>
            <div className="flex items-center space-x-4">
              <a href="/ai-demo" className="text-gray-300 hover:text-white transition-colors">AI Demo</a>
              <span className="text-sm text-gray-400">Dashboard</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-blue-300 to-blue-600 bg-clip-text text-transparent">
                Trading Dashboard
              </span>
            </h1>
            <p className="text-gray-400">Monitor your trades and strategies</p>
          </div>

          {/* Database Status */}
          <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-2xl p-6 border border-white/10 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Database Status</h3>
                {dbStatus ? (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`w-3 h-3 rounded-full ${dbStatus.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-gray-300">{dbStatus.status === 'connected' ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    {dbStatus.database && (
                      <p className="text-sm text-gray-400">Database: {dbStatus.database}</p>
                    )}
                    {dbStatus.collections && dbStatus.collections.length > 0 && (
                      <p className="text-sm text-gray-400">Collections: {dbStatus.collections.join(', ')}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400">Loading...</p>
                )}
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Trades Section */}
          <div className="bg-black/50 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Recent Trades</h3>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all">
                New Trade
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-gray-400">Loading trades...</p>
              </div>
            ) : trades.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-400">No trades yet</p>
                <p className="text-sm text-gray-500 mt-2">Create your first trade to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Symbol</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Side</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-semibold">Entry</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-semibold">Quantity</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-semibold">PnL</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => (
                      <tr key={trade._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">{trade.symbol}</td>
                        <td className="py-3 px-4 text-gray-300">{trade.type}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            trade.side === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {trade.side}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-300">${trade.entryPrice.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-gray-300">{trade.quantity}</td>
                        <td className="py-3 px-4 text-right">
                          {trade.pnl ? (
                            <span className={trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                              ${trade.pnl.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            trade.status === 'open' ? 'bg-blue-500/20 text-blue-400' :
                            trade.status === 'closed' ? 'bg-green-500/20 text-green-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {trade.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
