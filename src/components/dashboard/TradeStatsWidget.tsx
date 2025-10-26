/**
 * Trade Statistics Widget Component
 * Displays trading performance metrics
 * 
 * Usage:
 * import { TradeStatsWidget } from '@/components/dashboard/TradeStatsWidget';
 * <TradeStatsWidget />
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface TradeStats {
  openTrades: number;
  closedTrades: number;
  totalProfit: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgProfit: number;
}

export function TradeStatsWidget() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trades/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStats(data.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchStats();

      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  if (!session) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-center text-gray-500">Please login to view statistics</p>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
          >
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        <button
          onClick={fetchStats}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      label: 'Active Trades',
      value: stats.openTrades,
      icon: '📊',
      color: 'blue',
      suffix: '',
    },
    {
      label: 'Total Profit',
      value: stats.totalProfit,
      icon: '💰',
      color: stats.totalProfit >= 0 ? 'green' : 'red',
      suffix: '',
      prefix: stats.totalProfit >= 0 ? '+$' : '-$',
      displayValue: Math.abs(stats.totalProfit).toFixed(2),
    },
    {
      label: 'Win Rate',
      value: stats.winRate,
      icon: '🎯',
      color: stats.winRate >= 50 ? 'green' : 'red',
      suffix: '%',
      displayValue: stats.winRate.toFixed(1),
    },
    {
      label: 'Closed Trades',
      value: stats.closedTrades,
      icon: '✅',
      color: 'gray',
      suffix: '',
      subtext: `${stats.winningTrades}W / ${stats.losingTrades}L`,
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      icon: 'text-blue-500',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      icon: 'text-green-500',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      icon: 'text-red-500',
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-800',
      text: 'text-gray-600 dark:text-gray-400',
      icon: 'text-gray-500',
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Trading Statistics
        </h3>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const colors = colorClasses[card.color as keyof typeof colorClasses];
          
          return (
            <div
              key={card.label}
              className={`p-4 rounded-lg shadow ${colors.bg}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.label}
                  </p>
                  <p className={`mt-2 text-3xl font-bold ${colors.text}`}>
                    {card.prefix || ''}
                    {card.displayValue || card.value}
                    {card.suffix}
                  </p>
                  {card.subtext && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {card.subtext}
                    </p>
                  )}
                </div>
                <div className={`text-3xl ${colors.icon}`}>
                  {card.icon}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Metrics */}
      {stats.closedTrades > 0 && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Performance Breakdown
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Avg Profit</p>
              <p
                className={`font-semibold ${
                  stats.avgProfit >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {stats.avgProfit >= 0 ? '+' : ''}${stats.avgProfit.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Total Trades</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {stats.openTrades + stats.closedTrades}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Win/Loss Ratio</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {stats.losingTrades > 0
                  ? (stats.winningTrades / stats.losingTrades).toFixed(2)
                  : '∞'}
              </p>
            </div>
          </div>

          {/* Progress Bar for Win Rate */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Win Rate</span>
              <span>{stats.winRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  stats.winRate >= 70
                    ? 'bg-green-500'
                    : stats.winRate >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(stats.winRate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.closedTrades === 0 && (
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No trading history yet. Start a bot to begin trading!
          </p>
        </div>
      )}
    </div>
  );
}
