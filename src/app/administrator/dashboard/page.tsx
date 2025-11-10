'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  totalUsers: number;
  usersWithWallets: number;
  activeReferrals: number;
  totalDeposits: number;
  totalDepositAmount: string;
  totalBalance: string;
  totalEarnings: string;
  newUsersToday: number;
  networkMode: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard-stats');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.stats);
      } else {
        console.error('Failed to fetch stats:', data.error);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome back, Administrator!
            </h2>
            <p className="text-purple-100">
              You have full access to manage the FuturePilot platform.
              <span className="ml-2 text-purple-200">
                🟢 Mainnet
              </span>
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-500/10 rounded-lg p-3">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Total Users</h3>
          <p className="text-3xl font-bold text-white">
            {loading ? '...' : (stats?.totalUsers || 0)}
          </p>
          {stats && stats.newUsersToday > 0 && (
            <p className="text-sm text-green-400 mt-2">
              +{stats.newUsersToday} new today
            </p>
          )}
        </div>

        {/* Active Referrals */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-500/10 rounded-lg p-3">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Active Referrals</h3>
          <p className="text-3xl font-bold text-white">
            {loading ? '...' : (stats?.activeReferrals || 0)}
          </p>
          {stats && (
            <p className="text-sm text-gray-400 mt-2">
              {stats.usersWithWallets} with wallets
            </p>
          )}
        </div>

        {/* Total Deposits */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-500/10 rounded-lg p-3">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Total Deposits</h3>
          <p className="text-3xl font-bold text-white">
            {loading ? '...' : `$${parseFloat(stats?.totalDepositAmount || '0').toFixed(2)}`}
          </p>
          {stats && (
            <p className="text-sm text-gray-400 mt-2">
              {stats.totalDeposits} transactions
            </p>
          )}
        </div>

        {/* Total Balance */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-500/10 rounded-lg p-3">
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Total Balance</h3>
          <p className="text-3xl font-bold text-white">
            {loading ? '...' : `$${parseFloat(stats?.totalBalance || '0').toFixed(2)}`}
          </p>
          {stats && (
            <p className="text-sm text-gray-400 mt-2">
              ${parseFloat(stats.totalEarnings || '0').toFixed(2)} earnings
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-4 text-left transition">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500/10 rounded-lg p-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Manage Users</h4>
                <p className="text-sm text-gray-400">View and edit users</p>
              </div>
            </div>
          </button>

          <button className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-4 text-left transition">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500/10 rounded-lg p-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Approve Withdrawals</h4>
                <p className="text-sm text-gray-400">Process pending requests</p>
              </div>
            </div>
          </button>

          <button className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-4 text-left transition">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-500/10 rounded-lg p-2">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">View Analytics</h4>
                <p className="text-sm text-gray-400">Platform statistics</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-400">No recent activity to display</p>
          <p className="text-gray-500 text-sm mt-2">Activity logs will appear here</p>
        </div>
      </div>
    </div>
  );
}
