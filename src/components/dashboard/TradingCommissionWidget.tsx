'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface TradingLimits {
  gasFeeBalance: number;
  maxProfit: number;
  autoCloseThreshold: number;
  commissionRate: number;
  canTrade: boolean;
}

interface CommissionTransaction {
  id: string;
  profit: number;
  commission: number;
  rate: number;
  positionId: string;
  date: string;
}

interface CommissionSummary {
  totalCommissionPaid: number;
  totalProfits: number;
  averageCommissionRate: number;
  transactionCount: number;
  transactions: CommissionTransaction[];
}

export function TradingCommissionWidget() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [limits, setLimits] = useState<TradingLimits | null>(null);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch trading limits
      const limitsResponse = await fetch(
        `/api/trading/commission?userId=${session?.user?.id}&action=max-profit`
      );
      const limitsData = await limitsResponse.json();

      // Fetch eligibility
      const eligibilityResponse = await fetch(
        `/api/trading/commission?userId=${session?.user?.id}&action=check`
      );
      const eligibilityData = await eligibilityResponse.json();

      // Fetch commission summary
      const summaryResponse = await fetch(
        `/api/trading/commission?userId=${session?.user?.id}&action=summary`
      );
      const summaryData = await summaryResponse.json();

      if (limitsData.success && eligibilityData.success) {
        setLimits({
          ...limitsData.data,
          canTrade: eligibilityData.data.canTrade,
        });
      }

      if (summaryData.success) {
        setSummary(summaryData.data);
      }
    } catch (error) {
      console.error('Error fetching trading commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 dark:bg-gray-700 light:bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-700 dark:bg-gray-700 light:bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-white dark:text-white light:text-gray-900 flex items-center gap-2">
            💰 Trading Commission
          </h3>
          {!limits?.canTrade && (
            <span className="px-3 py-1 bg-red-500/20 dark:bg-red-500/20 light:bg-red-100 border border-red-500/50 dark:border-red-500/50 light:border-red-300 text-red-400 dark:text-red-400 light:text-red-700 text-xs font-semibold rounded-full">
              Cannot Trade
            </span>
          )}
        </div>
        <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm">
          Monitor your trading costs and limits
        </p>
      </div>

      {/* Trading Limits Cards */}
      {limits && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 dark:from-blue-900/30 dark:to-blue-800/20 light:from-blue-50 light:to-blue-100 border border-blue-500/30 dark:border-blue-500/30 light:border-blue-300 rounded-lg p-4">
            <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm mb-1">Max Profit Allowed</p>
            <p className="text-2xl font-bold text-blue-400 dark:text-blue-400 light:text-blue-700">
              {formatCurrency(limits.maxProfit)}
            </p>
            <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs mt-2">
              Auto-close at {formatCurrency(limits.autoCloseThreshold)}
            </p>
          </div>

          {summary && (
            <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 dark:from-yellow-900/30 dark:to-yellow-800/20 light:from-yellow-50 light:to-yellow-100 border border-yellow-500/30 dark:border-yellow-500/30 light:border-yellow-300 rounded-lg p-4">
              <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm mb-1">Total Commission Paid</p>
              <p className="text-2xl font-bold text-yellow-400 dark:text-yellow-400 light:text-yellow-700">
                {formatCurrency(summary.totalCommissionPaid)}
              </p>
              <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs mt-2">
                From {summary.transactionCount} trades
              </p>
            </div>
          )}
        </div>
      )}

      {/* Commission Summary */}
      {summary && summary.transactionCount > 0 && (
        <>
          <div className="bg-gray-700/50 dark:bg-gray-700/50 light:bg-gray-100 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs mb-1">Total Profits</p>
                <p className="text-lg font-semibold text-green-400 dark:text-green-400 light:text-green-700">
                  {formatCurrency(summary.totalProfits)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs mb-1">Total Commission</p>
                <p className="text-lg font-semibold text-purple-400 dark:text-purple-400 light:text-purple-700">
                  {formatCurrency(summary.totalCommissionPaid)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs mb-1">Avg Rate</p>
                <p className="text-lg font-semibold text-blue-400 dark:text-blue-400 light:text-blue-700">
                  {summary.averageCommissionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* History Toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-4 py-2 bg-gray-700 dark:bg-gray-700 light:bg-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600 light:hover:bg-gray-300 rounded-lg transition text-white dark:text-white light:text-gray-900 text-sm font-medium"
          >
            {showHistory ? '▲ Hide History' : '▼ Show Commission History'}
          </button>

          {/* Transaction History */}
          {showHistory && (
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
              {summary.transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  className="bg-gray-700/50 dark:bg-gray-700/50 light:bg-gray-100 rounded-lg p-3 flex justify-between items-center hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-200 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-400 dark:text-green-400 light:text-green-700 font-semibold">
                        +{formatCurrency(tx.profit)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-500 light:text-gray-400">→</span>
                      <span className="text-purple-400 dark:text-purple-400 light:text-purple-700 font-semibold">
                        -{formatCurrency(tx.commission)}
                      </span>
                      <span className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs">
                        ({tx.rate}%)
                      </span>
                    </div>
                    <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs">
                      {formatDate(tx.date)} • {tx.positionId}
                    </p>
                  </div>
                </div>
              ))}
              {summary.transactions.length > 10 && (
                <p className="text-center text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm py-2">
                  Showing last 10 of {summary.transactions.length} transactions
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Info Box */}
      <div className="mt-4 bg-blue-500/10 dark:bg-blue-500/10 light:bg-blue-50 border border-blue-500/50 dark:border-blue-500/50 light:border-blue-300 rounded-lg p-4">
        <p className="text-blue-400 dark:text-blue-400 light:text-blue-700 text-sm">
          <strong>ℹ️ How it works:</strong> Commission is automatically deducted from your gas fee balance after each profitable trade. Your position will auto-close if profit reaches the threshold to prevent negative balance.
        </p>
      </div>
    </div>
  );
}
