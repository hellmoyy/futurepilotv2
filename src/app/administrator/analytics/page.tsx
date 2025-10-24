'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalRevenue: number;
    totalTransactions: number;
    activeUsers: number;
  };
  userGrowth: Array<{ date: string; count: number }>;
  revenueByType: Array<{ type: string; amount: number }>;
  membershipDistribution: Array<{ level: string; count: number; percentage: number }>;
  topUsers: Array<{
    _id: string;
    name: string;
    email: string;
    totalEarnings: number;
    transactionCount: number;
  }>;
  recentActivity: Array<{
    type: string;
    count: number;
    amount: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-400">No analytics data available</p>
      </div>
    );
  }

  const getMembershipColor = (level: string) => {
    const colors = {
      bronze: 'from-orange-600 to-orange-700',
      silver: 'from-gray-400 to-gray-500',
      gold: 'from-yellow-500 to-yellow-600',
      platinum: 'from-purple-600 to-purple-700',
    };
    return colors[level?.toLowerCase() as keyof typeof colors] || colors.bronze;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Platform Analytics</h1>
          <p className="text-gray-400">Comprehensive insights and statistics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-200">Total Users</p>
            <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{analytics.overview.totalUsers}</p>
          <p className="text-sm text-purple-200 mt-1">{analytics.overview.activeUsers} active</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-200">Total Revenue</p>
            <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">${analytics.overview.totalRevenue.toFixed(2)}</p>
          <p className="text-sm text-green-200 mt-1">Platform revenue</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-200">Total Transactions</p>
            <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{analytics.overview.totalTransactions}</p>
          <p className="text-sm text-blue-200 mt-1">All time</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-yellow-200">Avg per User</p>
            <svg className="w-8 h-8 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-3xl font-bold">
            ${analytics.overview.totalUsers > 0 
              ? (analytics.overview.totalRevenue / analytics.overview.totalUsers).toFixed(2) 
              : '0.00'}
          </p>
          <p className="text-sm text-yellow-200 mt-1">Revenue per user</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Membership Distribution */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Membership Distribution
          </h3>
          <div className="space-y-4">
            {analytics.membershipDistribution.map((item) => (
              <div key={item.level}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium capitalize">{item.level}</span>
                  <span className="text-gray-400">{item.count} users ({item.percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${getMembershipColor(item.level)} transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Type */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Revenue by Type
          </h3>
          <div className="space-y-4">
            {analytics.revenueByType.map((item) => {
              const total = analytics.revenueByType.reduce((sum, i) => sum + i.amount, 0);
              const percentage = total > 0 ? (item.amount / total) * 100 : 0;
              
              return (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium capitalize">{item.type}</span>
                    <span className="text-green-400 font-semibold">${item.amount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Growth Chart (Simple visualization) */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          User Growth Trend
        </h3>
        <div className="flex items-end space-x-2 h-64">
          {analytics.userGrowth.slice(-14).map((item, index) => {
            const maxCount = Math.max(...analytics.userGrowth.map(g => g.count));
            const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full relative group">
                  <div 
                    className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all hover:from-purple-500 hover:to-purple-300 cursor-pointer"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.count} users
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-top-left">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Top Users by Earnings
          </h3>
          <div className="space-y-3">
            {analytics.topUsers.slice(0, 5).map((user, index) => (
              <div key={user._id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-600 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-700 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.name}</p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-500 font-bold">${user.totalEarnings.toFixed(2)}</p>
                  <p className="text-gray-400 text-xs">{user.transactionCount} transactions</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Recent Activity Summary
          </h3>
          <div className="space-y-3">
            {analytics.recentActivity.map((activity) => (
              <div key={activity.type} className="p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium capitalize">{activity.type}</span>
                  <span className="text-purple-400 font-semibold">{activity.count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Total Amount</span>
                  <span className="text-green-400 font-semibold">${activity.amount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
