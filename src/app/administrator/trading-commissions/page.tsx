'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Transaction {
  _id: string;
  amount: number;
  createdAt: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    gasFeeBalance: number;
  };
  tradingMetadata: {
    profit: number;
    commissionRate: number;
    positionId?: string;
    closedAt?: string;
  };
}

interface Statistics {
  totalRevenue: number;
  totalProfit: number;
  totalTrades: number;
  avgCommission: number;
  avgProfit: number;
  avgRate: number;
}

interface TopUser {
  userId: string;
  userName: string;
  userEmail: string;
  totalCommission: number;
  totalProfit: number;
  tradeCount: number;
}

interface RecentActivity {
  _id: string;
  revenue: number;
  trades: number;
}

export default function TradingCommissionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/admin/trading-commissions?${params}`);
      const data = await response.json();

      if (data.success) {
        setTransactions(data.data.transactions);
        setStatistics(data.data.statistics);
        setTopUsers(data.data.topUsers);
        setRecentActivity(data.data.recentActivity);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching trading commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const exportToCSV = () => {
    const csv = [
      ['Date', 'User', 'Email', 'Profit', 'Commission', 'Rate', 'Position ID'],
      ...transactions.map((tx) => [
        formatDate(tx.createdAt),
        tx.userId?.name || 'N/A',
        tx.userId?.email || 'N/A',
        tx.tradingMetadata.profit,
        tx.amount,
        `${tx.tradingMetadata.commissionRate}%`,
        tx.tradingMetadata.positionId || 'N/A',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-commissions-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (loading && !statistics) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Trading Commissions</h1>
          <p className="text-gray-400 mt-1">Platform revenue from trading bot profits</p>
        </div>
        <button
          onClick={() => router.push('/administrator')}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-green-400 mt-2">
                  {formatCurrency(statistics.totalRevenue)}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Trades</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">
                  {statistics.totalTrades.toLocaleString()}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Commission</p>
                <p className="text-3xl font-bold text-purple-400 mt-2">
                  {formatCurrency(statistics.avgCommission)}
                </p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Rate</p>
                <p className="text-3xl font-bold text-yellow-400 mt-2">
                  {statistics.avgRate.toFixed(1)}%
                </p>
              </div>
              <div className="text-4xl">⚡</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
        <h3 className="text-xl font-bold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Top Users */}
      {topUsers.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Top 10 Users by Commission</h3>
            <span className="text-sm text-gray-400">All time</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">#</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">User</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Trades</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Total Profit</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Commission</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map((user, index) => (
                  <tr key={user.userId} className="border-b border-gray-700/50">
                    <td className="py-3 px-4">
                      <span className="text-yellow-400 font-bold">{index + 1}</span>
                    </td>
                    <td className="py-3 px-4">{user.userName}</td>
                    <td className="py-3 px-4 text-gray-400">{user.userEmail}</td>
                    <td className="py-3 px-4 text-right">{user.tradeCount}</td>
                    <td className="py-3 px-4 text-right text-green-400">
                      {formatCurrency(user.totalProfit)}
                    </td>
                    <td className="py-3 px-4 text-right text-purple-400 font-semibold">
                      {formatCurrency(user.totalCommission)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Recent Transactions</h3>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition flex items-center gap-2"
          >
            <span>📥</span>
            Export CSV
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No trading commissions found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">User</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Profit</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Rate</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Commission</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Gas Fee</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-3 px-4 text-sm">{formatDate(tx.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{tx.userId?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-400">{tx.userId?.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-green-400 font-semibold">
                        {formatCurrency(tx.tradingMetadata.profit)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-400">
                        {tx.tradingMetadata.commissionRate}%
                      </td>
                      <td className="py-3 px-4 text-right text-purple-400 font-semibold">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-400">
                        {formatCurrency(tx.userId?.gasFeeBalance || 0)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {tx.tradingMetadata.positionId || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <span className="text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
