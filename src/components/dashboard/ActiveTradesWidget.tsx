/**
 * Active Trades Widget Component
 * Displays real-time active trades from Trade database
 * 
 * Usage:
 * import { ActiveTradesWidget } from '@/components/dashboard/ActiveTradesWidget';
 * <ActiveTradesWidget />
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Trade {
  _id: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  pnl: number;
  pnlPercentage: number;
  leverage: number;
  entryTime: string;
  status: string;
}

export function ActiveTradesWidget() {
  const { data: session } = useSession();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trades/active');
      
      if (!response.ok) {
        throw new Error('Failed to fetch trades');
      }

      const data = await response.json();
      setTrades(data.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching trades:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchTrades();

      // Auto-refresh every 10 seconds
      const interval = setInterval(fetchTrades, 10000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const handleCloseTrade = async (tradeId: string, exitPrice: number) => {
    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'close',
          exitPrice,
          notes: 'Manual close via dashboard',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to close trade');
      }

      // Refresh trades list
      await fetchTrades();
      
      alert('Trade closed successfully!');
    } catch (err: any) {
      console.error('Error closing trade:', err);
      alert(`Failed to close trade: ${err.message}`);
    }
  };

  if (!session) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-center text-gray-500">Please login to view trades</p>
      </div>
    );
  }

  if (loading && trades.length === 0) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        <button
          onClick={fetchTrades}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          No active trades
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Start a bot to begin trading
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Active Trades ({trades.length})
        </h3>
        <button
          onClick={fetchTrades}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-3">
        {trades.map((trade) => (
          <div
            key={trade._id}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  {trade.symbol}
                </h4>
                <span
                  className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                    trade.side === 'long'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {trade.side.toUpperCase()} {trade.leverage}x
                </span>
              </div>
              <div className="text-right">
                <div
                  className={`text-xl font-bold ${
                    trade.pnl >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {trade.pnlPercentage >= 0 ? '+' : ''}
                  {trade.pnlPercentage.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Trade Details */}
            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Entry Price</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  ${trade.entryPrice.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Quantity</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {trade.quantity}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Stop Loss</p>
                <p className="font-semibold text-red-600 dark:text-red-400">
                  ${trade.stopLoss.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Take Profit</p>
                <p className="font-semibold text-green-600 dark:text-green-400">
                  ${trade.takeProfit.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Entry Time */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Opened: {new Date(trade.entryTime).toLocaleString()}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const exitPrice = prompt(
                    'Enter exit price:',
                    trade.entryPrice.toString()
                  );
                  if (exitPrice) {
                    handleCloseTrade(trade._id, parseFloat(exitPrice));
                  }
                }}
                className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                Close Position
              </button>
              <button
                onClick={() => {
                  alert('View details feature coming soon!');
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
