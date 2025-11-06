'use client';

/**
 * 🧠 BOT DECISION LAYER - Admin Control Page
 * 
 * Features:
 * - AI decision monitoring (execute vs skip signals)
 * - Per-user bot management
 * - News sentiment integration
 * - Learning pattern insights
 * - Decision history logging
 * - DeepSeek API configuration
 * 
 * Architecture:
 * Signal Generator → AI Decision Layer → User Bot Execution
 */

import { useState, useEffect } from 'react';

type TabType = 'overview' | 'user-bots' | 'ai-config' | 'news' | 'learning' | 'decisions';

export default function BotDecisionPage() {
  const [selectedTab, setSelectedTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(false);

  // Tab configurations
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊', description: 'Statistics & performance' },
    { id: 'user-bots', label: 'User Bots', icon: '🤖', description: 'Active bot instances' },
    { id: 'ai-config', label: 'AI Configuration', icon: '⚙️', description: 'DeepSeek settings' },
    { id: 'news', label: 'News Monitor', icon: '📰', description: 'Real-time sentiment' },
    { id: 'learning', label: 'Learning Insights', icon: '🎓', description: 'Pattern recognition' },
    { id: 'decisions', label: 'Decision Log', icon: '📝', description: 'History & analytics' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg p-6 border border-purple-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              🧠 Bot Decision Layer
            </h1>
            <p className="text-purple-200">
              AI-powered decision engine for autonomous trading execution
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-purple-800/50 rounded-lg px-4 py-2 border border-purple-600">
              <div className="text-xs text-purple-300 mb-1">AI Provider</div>
              <div className="text-white font-bold flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                DeepSeek API
              </div>
            </div>
            <div className="bg-purple-800/50 rounded-lg px-4 py-2 border border-purple-600">
              <div className="text-xs text-purple-300 mb-1">Status</div>
              <div className="text-white font-bold flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                🚧 In Development
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
              🚧 Phase 1: Structure Setup Complete
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Bot Decision Layer is currently in development. This page will display real-time AI decision monitoring, 
              per-user bot management, news sentiment analysis, and learning pattern insights. 
              <strong> Coming soon: DeepSeek AI integration, automated learning system, and decision analytics.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>🏗️</span> Architecture Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Signal Generator */}
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📡</span>
              <h3 className="font-bold text-green-900 dark:text-green-200">Bot Signal</h3>
            </div>
            <p className="text-sm text-green-800 dark:text-green-300 mb-2">
              Technical analysis only
            </p>
            <ul className="text-xs text-green-700 dark:text-green-400 space-y-1">
              <li>• Triple timeframe (1m, 3m, 5m)</li>
              <li>• RSI, MACD, ADX, Volume</li>
              <li>• Generate raw signals</li>
              <li>• 75-85% base confidence</li>
            </ul>
          </div>

          {/* AI Decision Layer */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🧠</span>
              <h3 className="font-bold text-purple-900 dark:text-purple-200">Bot Decision</h3>
            </div>
            <p className="text-sm text-purple-800 dark:text-purple-300 mb-2">
              AI filtering + learning
            </p>
            <ul className="text-xs text-purple-700 dark:text-purple-400 space-y-1">
              <li>• News sentiment (+/- 10%)</li>
              <li>• Backtest performance (+/- 5%)</li>
              <li>• Pattern learning (+/- 3%)</li>
              <li>• Execute if ≥ 82% confidence</li>
            </ul>
          </div>

          {/* User Bot Execution */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚡</span>
              <h3 className="font-bold text-blue-900 dark:text-blue-200">User Bot</h3>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
              Autonomous execution
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Balance-aware sizing</li>
              <li>• Risk management (2%)</li>
              <li>• Trailing stops</li>
              <li>• Learn from results</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  selectedTab === tab.id
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <div className="text-left">
                  <div>{tab.label}</div>
                  {selectedTab === tab.id && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{tab.description}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {selectedTab === 'overview' && <OverviewTab />}
          {selectedTab === 'user-bots' && <UserBotsTab />}
          {selectedTab === 'ai-config' && <AIConfigTab />}
          {selectedTab === 'news' && <NewsTab />}
          {selectedTab === 'learning' && <LearningTab />}
          {selectedTab === 'decisions' && <DecisionsTab />}
        </div>
      </div>
    </div>
  );
}

// Tab Components

function OverviewTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOverviewStats();
  }, []);

  const fetchOverviewStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/bot-decision/overview');
      const data = await response.json();

      if (data.success) {
        setStats(data.overview);
      } else {
        setError(data.error || 'Failed to load stats');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-sm text-red-800 dark:text-red-300">
          ❌ <strong>Error:</strong> {error}
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📊</span> Overview & Statistics
        </h2>
        <button
          onClick={fetchOverviewStats}
          className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Bots */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90 mb-1">Active Bots</div>
          <div className="text-3xl font-bold">{stats.activeBots}</div>
          <div className="text-xs opacity-75 mt-2">
            {stats.totalBots} total ({stats.pausedBots} paused, {stats.stoppedBots} stopped)
          </div>
        </div>

        {/* Today's Decisions */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90 mb-1">Today's Decisions</div>
          <div className="text-3xl font-bold">{stats.todayDecisions}</div>
          <div className="text-xs opacity-75 mt-2">
            {stats.todayExecuted} executed • {stats.todaySkipped} skipped
          </div>
        </div>

        {/* Execution Rate */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90 mb-1">Execution Rate</div>
          <div className="text-3xl font-bold">{(stats.executionRate * 100).toFixed(1)}%</div>
          <div className="text-xs opacity-75 mt-2">
            Signals passed AI filter
          </div>
        </div>

        {/* AI Cost */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90 mb-1">AI Cost Today</div>
          <div className="text-3xl font-bold">${stats.todayAICost.toFixed(3)}</div>
          <div className="text-xs opacity-75 mt-2">
            DeepSeek API usage
          </div>
        </div>
      </div>

      {/* Win Rate Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          🎯 Performance Comparison
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Baseline (Technical Only)</div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {(stats.baselineWinRate * 100).toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">AI-Enhanced</div>
            <div className="text-4xl font-bold text-green-600 dark:text-green-400">
              {(stats.aiWinRate * 100).toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Improvement</div>
            <div className={`text-4xl font-bold ${stats.improvement > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {stats.improvement > 0 ? '+' : ''}{(stats.improvement * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Based on {stats.totalDecisionsWithResults} completed trades
        </div>
      </div>

      {/* Top Rejection Reasons */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          ⏭️ Top Rejection Reasons (Last 7 Days)
        </h3>
        {stats.topRejectionReasons.length > 0 ? (
          <div className="space-y-3">
            {stats.topRejectionReasons.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full flex items-center px-3 text-white text-sm font-medium"
                    style={{
                      width: `${(item.count / stats.topRejectionReasons[0].count) * 100}%`,
                      minWidth: '60px',
                    }}
                  >
                    {item.count}
                  </div>
                </div>
                <div className="w-48 text-sm text-gray-700 dark:text-gray-300">
                  {item.reason}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No rejections in the last 7 days</p>
        )}
      </div>

      {/* Daily Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          � 7-Day Decisions Trend
        </h3>
        <div className="space-y-2">
          {stats.dailyTrend.map((day: any) => (
            <div key={day.date} className="flex items-center gap-3">
              <div className="w-24 text-sm text-gray-600 dark:text-gray-400">
                {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded h-6 overflow-hidden flex">
                  <div
                    className="bg-green-500 hover:bg-green-600 transition"
                    style={{ width: `${(day.executed / Math.max(day.total, 1)) * 100}%` }}
                    title={`${day.executed} executed`}
                  ></div>
                  <div
                    className="bg-red-500 hover:bg-red-600 transition"
                    style={{ width: `${(day.skipped / Math.max(day.total, 1)) * 100}%` }}
                    title={`${day.skipped} skipped`}
                  ></div>
                </div>
                <div className="w-16 text-sm text-gray-600 dark:text-gray-400 text-right">
                  {day.total}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Executed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Skipped</span>
          </div>
        </div>
      </div>

      {/* Learning & News Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Learning Patterns */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🎓 Learning Patterns
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Patterns</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalLearningPatterns}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Loss Patterns</span>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">{stats.lossPatterns}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Win Patterns</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">{stats.winPatterns}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Patterns Avoided</span>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.patternsAvoided}</span>
            </div>
          </div>
        </div>

        {/* News Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            📰 News (Last 7 Days)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Articles</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.recentNewsCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bullish</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {stats.newsBySentiment?.bullish || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bearish</span>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {stats.newsBySentiment?.bearish || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">High Impact</span>
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {stats.newsByImpact?.high || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(stats.lowBalanceBots.length > 0 || stats.topPerformingBots.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Performers */}
          {stats.topPerformingBots.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-green-900 dark:text-green-200 mb-4">
                🏆 Top Performing Bots
              </h3>
              <div className="space-y-2">
                {stats.topPerformingBots.slice(0, 3).map((bot: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-green-800 dark:text-green-300">
                      User {bot.userId?.toString().slice(-6)}
                    </span>
                    <span className="font-bold text-green-900 dark:text-green-100">
                      {(bot.winRate * 100).toFixed(1)}% ({bot.totalTrades} trades)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Balance Alerts */}
          {stats.lowBalanceBots.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-orange-900 dark:text-orange-200 mb-4">
                ⚠️ Low Balance Alerts
              </h3>
              <div className="space-y-2">
                {stats.lowBalanceBots.slice(0, 3).map((bot: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-orange-800 dark:text-orange-300">
                      User {bot.userId?.toString().slice(-6)}
                    </span>
                    <span className="font-bold text-orange-900 dark:text-orange-100">
                      ${bot.gasFeeBalance.toFixed(2)} USDT
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UserBotsTab() {
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBot, setSelectedBot] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUserBots();
  }, [page, statusFilter, searchQuery]);

  const fetchUserBots = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/admin/bot-decision/user-bots?${params}`);
      const data = await response.json();

      if (data.success) {
        setBots(data.bots);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      } else {
        setError(data.error || 'Failed to load bots');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleBotAction = async (botId: string, userId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/bot-decision/user-bots/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchUserBots();
        if (selectedBot && selectedBot._id === botId) {
          setShowDetailModal(false);
          setSelectedBot(null);
        }
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const viewBotDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/bot-decision/user-bots/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedBot(data);
        setShowDetailModal(true);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>🤖</span> User Bots ({total})
        </h2>
        <button
          onClick={fetchUserBots}
          className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search User
            </label>
            <input
              type="text"
              placeholder="Email or username..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="stopped">Stopped</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bots List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading bots...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-300">
            ❌ <strong>Error:</strong> {error}
          </p>
        </div>
      ) : bots.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">No bots found</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Today
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      AI Threshold
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {bots.map((bot) => (
                    <tr key={bot._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/20 transition">
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {bot.userId?.email || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {bot.userId?.username || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bot.status === 'active'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : bot.status === 'paused'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {bot.status === 'active' ? '🟢' : bot.status === 'paused' ? '🟡' : '🔴'} {bot.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          ${bot.lastBalanceCheck?.binanceBalance?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Gas: ${bot.lastBalanceCheck?.gasFeeBalance?.toFixed(2) || '0'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {(bot.stats.winRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {bot.stats.totalTrades} trades
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {bot.dailyTradeCount || 0} / {bot.tradingConfig.maxDailyTrades}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {(bot.aiConfig.confidenceThreshold * 100).toFixed(0)}%
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => viewBotDetails(bot.userId._id)}
                            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                          >
                            View
                          </button>
                          {bot.status === 'active' && (
                            <button
                              onClick={() => handleBotAction(bot._id, bot.userId._id, 'pause')}
                              className="px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded transition"
                            >
                              Pause
                            </button>
                          )}
                          {bot.status === 'paused' && (
                            <button
                              onClick={() => handleBotAction(bot._id, bot.userId._id, 'resume')}
                              className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition"
                            >
                              Resume
                            </button>
                          )}
                          {bot.status !== 'stopped' && (
                            <button
                              onClick={() => {
                                if (confirm('Stop this bot? This action requires manual restart.')) {
                                  handleBotAction(bot._id, bot.userId._id, 'stop');
                                }
                              }}
                              className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition"
                            >
                              Stop
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Bot Detail Modal */}
      {showDetailModal && selectedBot && (
        <BotDetailModal
          bot={selectedBot}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedBot(null);
          }}
          onAction={(action: string) => handleBotAction(selectedBot.bot._id, selectedBot.bot.userId._id, action)}
          onRefresh={() => viewBotDetails(selectedBot.bot.userId._id)}
        />
      )}
    </div>
  );
}

// Bot Detail Modal Component
function BotDetailModal({ bot, onClose, onAction, onRefresh }: {
  bot: any;
  onClose: () => void;
  onAction: (action: string) => void;
  onRefresh: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'decisions' | 'patterns' | 'config'>('overview');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">🤖 Bot Details</h2>
              <p className="text-purple-200">
                {bot.bot.userId?.email || 'Unknown User'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                bot.bot.status === 'active'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  : bot.bot.status === 'paused'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              }`}>
                {bot.bot.status === 'active' ? '🟢' : bot.bot.status === 'paused' ? '🟡' : '🔴'} {bot.bot.status.toUpperCase()}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Last active: {bot.bot.lastActive ? new Date(bot.bot.lastActive).toLocaleString() : 'Never'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition"
              >
                🔄 Refresh
              </button>
              {bot.bot.status === 'active' && (
                <button
                  onClick={() => onAction('pause')}
                  className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded transition"
                >
                  ⏸️ Pause
                </button>
              )}
              {bot.bot.status === 'paused' && (
                <button
                  onClick={() => onAction('resume')}
                  className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition"
                >
                  ▶️ Resume
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
          <div className="flex gap-4">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'decisions', label: 'Recent Decisions', icon: '📝' },
              { id: 'patterns', label: 'Learning Patterns', icon: '🎓' },
              { id: 'config', label: 'Configuration', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90 mb-1">Binance Balance</div>
                  <div className="text-2xl font-bold">
                    ${bot.bot.lastBalanceCheck?.binanceBalance?.toLocaleString() || '0'}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90 mb-1">Gas Fee Balance</div>
                  <div className="text-2xl font-bold">
                    ${bot.bot.lastBalanceCheck?.gasFeeBalance?.toFixed(2) || '0'}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90 mb-1">Available Margin</div>
                  <div className="text-2xl font-bold">
                    ${bot.bot.lastBalanceCheck?.availableMargin?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📊 Trading Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Win Rate</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(bot.bot.stats.winRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Trades</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {bot.bot.stats.totalTrades}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Net Profit</div>
                    <div className={`text-2xl font-bold ${
                      bot.bot.stats.netProfit > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${bot.bot.stats.netProfit?.toFixed(2) || '0'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Daily Trades</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {bot.bot.dailyTradeCount} / {bot.bot.tradingConfig.maxDailyTrades}
                    </div>
                  </div>
                </div>
              </div>

              {/* Signal Stats */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📡 Signal Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Received</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {bot.bot.stats.totalSignalsReceived}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Executed</div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {bot.bot.stats.signalsExecuted}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Rejected</div>
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">
                      {bot.bot.stats.signalsRejected}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'decisions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">📝 Recent 20 Decisions</h3>
              {bot.recentDecisions && bot.recentDecisions.length > 0 ? (
                <div className="space-y-3">
                  {bot.recentDecisions.map((decision: any) => (
                    <div
                      key={decision._id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl ${decision.decision === 'EXECUTE' ? '✅' : '⏭️'}`}>
                            {decision.decision === 'EXECUTE' ? '✅' : '⏭️'}
                          </span>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">
                              {decision.signal.symbol} {decision.signal.action}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(decision.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {(decision.confidenceBreakdown.total * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            confidence
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {decision.reason}
                      </div>
                      {decision.execution && decision.execution.result && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between text-sm">
                            <span className={`font-medium ${
                              decision.execution.result === 'WIN' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {decision.execution.result === 'WIN' ? '🎉 WIN' : '❌ LOSS'}
                            </span>
                            <span className={`font-bold ${
                              decision.execution.profit > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${decision.execution.profit?.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No decisions yet</p>
              )}
            </div>
          )}

          {activeTab === 'patterns' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">🎓 Learning Patterns</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {bot.learningPatterns.total}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Patterns</div>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {bot.learningPatterns.lossPatterns}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loss Patterns</div>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {bot.learningPatterns.winPatterns}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Win Patterns</div>
                </div>
              </div>
              {bot.learningPatterns.topPatterns && bot.learningPatterns.topPatterns.length > 0 ? (
                <div className="space-y-3">
                  {bot.learningPatterns.topPatterns.map((pattern: any, index: number) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 dark:text-white mb-1">
                            {pattern.type === 'loss' ? '❌' : '✅'} {pattern.description}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Confidence: {(pattern.confidence * 100).toFixed(0)}% • 
                            Strength: {pattern.strength}/100 • 
                            Occurrences: {pattern.occurrences}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {(pattern.successRate * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            success
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No patterns learned yet</p>
              )}
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* AI Config */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🧠 AI Configuration</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">AI Enabled</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {bot.bot.aiConfig.enabled ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Confidence Threshold</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {(bot.bot.aiConfig.confidenceThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">News Weight</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ±{(bot.bot.aiConfig.newsWeight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Backtest Weight</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ±{(bot.bot.aiConfig.backtestWeight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Learning Weight</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ±{(bot.bot.aiConfig.learningWeight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Min Gas Fee Balance</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ${bot.bot.aiConfig.minGasFeeBalance} USDT
                    </span>
                  </div>
                </div>
              </div>

              {/* Trading Config */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">⚙️ Trading Configuration</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Risk Per Trade</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {(bot.bot.tradingConfig.riskPercent * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Max Leverage</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {bot.bot.tradingConfig.maxLeverage}x
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Max Daily Trades</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {bot.bot.tradingConfig.maxDailyTrades}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Allowed Pairs</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {bot.bot.tradingConfig.allowedPairs.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AIConfigTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <span>⚙️</span> AI Configuration
      </h2>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          🚧 <strong>Coming Soon:</strong> DeepSeek API configuration, confidence thresholds, news/backtest/learning weights, 
          cost tracking, and model selection.
        </p>
      </div>
    </div>
  );
}

function NewsTab() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [aggregate, setAggregate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/bot-decision/news');
      const data = await res.json();
      if (data.success) {
        setNews(data.news || []);
        setAggregate(data.aggregate || null);
      } else {
        setError(data.error || 'Failed to load news');
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const syncNews = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/bot-decision/news/fetch', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Synced ${data.added + data.updated} articles!\n\nAdded: ${data.added}\nUpdated: ${data.updated}\nSkipped: ${data.skipped}`);
        // Refresh news list
        await fetchNews();
      } else {
        setError(data.error || 'Failed to sync news');
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'very_bullish':
        return 'bg-green-500 text-white';
      case 'bullish':
        return 'bg-green-400 text-white';
      case 'neutral':
        return 'bg-gray-400 text-white';
      case 'bearish':
        return 'bg-red-400 text-white';
      case 'very_bearish':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-300 text-gray-700';
    }
  };

  const getSentimentEmoji = (label: string) => {
    switch (label) {
      case 'very_bullish': return '🚀';
      case 'bullish': return '📈';
      case 'neutral': return '➖';
      case 'bearish': return '📉';
      case 'very_bearish': return '💥';
      default: return '⚪';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 font-bold';
      case 'medium': return 'text-yellow-600 font-medium';
      case 'low': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📰</span> News Monitor
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={syncNews}
            disabled={syncing}
            className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {syncing ? (
              <>
                <span className="animate-spin">⏳</span>
                Syncing...
              </>
            ) : (
              <>
                <span>🔄</span>
                Fetch from CryptoNews
              </>
            )}
          </button>
          <button
            onClick={fetchNews}
            disabled={loading}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading news...</div>}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">❌ Error: {error}</p>
        </div>
      )}

      {aggregate && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Sentiment</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(aggregate.avgSentiment || 0).toFixed(2)}
            </div>
            <div className="text-xs text-gray-400 mt-1">{aggregate.label}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">📈 Bullish</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {aggregate.bullish || 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">articles</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">📉 Bearish</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {aggregate.bearish || 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">articles</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">🔴 High Impact</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {aggregate.highImpact || 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">articles</div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {news.length === 0 && !loading && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
              📭 No news in database. Click "Fetch from CryptoNews" to sync latest articles.
            </p>
            <button
              onClick={syncNews}
              disabled={syncing}
              className="px-6 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
            >
              {syncing ? '⏳ Syncing...' : '🔄 Fetch News Now'}
            </button>
          </div>
        )}

        {news.map((n: any) => (
          <div key={n._id || n.url} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* Header: Time, Source, Sentiment */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(n.publishedAt).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {n.source}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getSentimentColor(n.sentimentLabel)}`}>
                    {getSentimentEmoji(n.sentimentLabel)} {n.sentimentLabel.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`text-xs ${getImpactColor(n.impact)}`}>
                    {n.impact.toUpperCase()} IMPACT
                  </span>
                </div>

                {/* Title */}
                <a 
                  href={n.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="block font-bold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 mb-2"
                >
                  {n.title}
                </a>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {n.description || (n.content && n.content.slice(0, 200) + '...')}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <span>🎯 Confidence:</span>
                    <span className="font-medium">{(n.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>💯 Impact Score:</span>
                    <span className="font-medium">{n.impactScore || 0}/100</span>
                  </div>
                  {n.impactedDecisions > 0 && (
                    <div className="flex items-center gap-1">
                      <span>🤖 Used in:</span>
                      <span className="font-medium">{n.impactedDecisions} decisions</span>
                    </div>
                  )}
                </div>

                {/* Keywords/Tags */}
                {n.keywords && n.keywords.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {n.keywords.slice(0, 5).map((keyword: string, idx: number) => (
                      <span 
                        key={idx}
                        className="px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Image */}
              {n.imageUrl && (
                <div className="flex-shrink-0 w-40 h-28 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img 
                    src={n.imageUrl} 
                    alt={n.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LearningTab() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'loss' | 'win'>('all');
  const [sortBy, setSortBy] = useState<'strength' | 'confidence' | 'occurrences'>('strength');

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/bot-decision/learning/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load stats');
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchPatterns = async () => {
    setLoading(true);
    try {
      const type = filter === 'all' ? '' : filter;
      const res = await fetch(`/api/admin/bot-decision/learning/patterns?type=${type}&sortBy=${sortBy}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setPatterns(data.patterns || []);
      }
    } catch (err: any) {
      console.error('Error fetching patterns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPatterns();
  }, []);

  useEffect(() => {
    fetchPatterns();
  }, [filter, sortBy]);

  const getPatternTypeColor = (type: string) => {
    return type === 'loss' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  };

  const getPatternTypeEmoji = (type: string) => {
    return type === 'loss' ? '❌' : '✅';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>🎓</span> Learning Insights
        </h2>
        <button
          onClick={() => {
            fetchStats();
            fetchPatterns();
          }}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          🔄 Refresh
        </button>
      </div>

      {loading && !stats && <div className="text-sm text-gray-500 dark:text-gray-400">Loading learning data...</div>}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">❌ Error: {error}</p>
        </div>
      )}

      {stats && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Patterns</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalPatterns || 0}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {stats.lossPatterns || 0} loss • {stats.winPatterns || 0} win
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Success Rate</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {((stats.avgSuccessRate || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400 mt-2">across all patterns</div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Times Avoided</div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {stats.totalAvoided || 0}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                from {stats.totalMatched || 0} matched
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Net Profit/Loss</div>
              <div className={`text-3xl font-bold ${(stats.totalNetProfit || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${(stats.totalNetProfit || 0).toFixed(2)}
              </div>
              <div className="text-xs text-gray-400 mt-2">from pattern learning</div>
            </div>
          </div>

          {/* Pattern Age Distribution */}
          {stats.ageDistribution && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📊 Pattern Age Distribution</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.ageDistribution.new || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">New (&lt; 7 days)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.ageDistribution.recent || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Recent (7-30 days)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.ageDistribution.mature || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mature (30-90 days)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {stats.ageDistribution.old || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Old (&gt; 90 days)</div>
                </div>
              </div>
            </div>
          )}

          {/* Top Patterns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Loss Patterns */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>❌</span> Top Loss Patterns
              </h3>
              {stats.topLossPatterns && stats.topLossPatterns.length > 0 ? (
                <div className="space-y-3">
                  {stats.topLossPatterns.map((p: any, idx: number) => (
                    <div key={idx} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                            {p.pattern.description}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span>Strength: {p.strength}/100</span>
                            <span>•</span>
                            <span>Confidence: {(p.confidence * 100).toFixed(0)}%</span>
                            <span>•</span>
                            <span>Avoided: {p.timesAvoided}x</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No loss patterns yet</p>
              )}
            </div>

            {/* Top Win Patterns */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>✅</span> Top Win Patterns
              </h3>
              {stats.topWinPatterns && stats.topWinPatterns.length > 0 ? (
                <div className="space-y-3">
                  {stats.topWinPatterns.map((p: any, idx: number) => (
                    <div key={idx} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                            {p.pattern.description}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span>Success: {(p.successRate * 100).toFixed(0)}%</span>
                            <span>•</span>
                            <span>Confidence: {(p.confidence * 100).toFixed(0)}%</span>
                            <span>•</span>
                            <span>Profit: ${p.totalProfit?.toFixed(2) || '0'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No win patterns yet</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Pattern List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">📋 All Patterns</h3>
          <div className="flex items-center gap-3">
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="loss">Loss Only</option>
              <option value="win">Win Only</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="strength">Sort by Strength</option>
              <option value="confidence">Sort by Confidence</option>
              <option value="occurrences">Sort by Occurrences</option>
            </select>
          </div>
        </div>

        {patterns.length === 0 && !loading && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No patterns found. Patterns will be automatically discovered as the bot trades.
          </p>
        )}

        <div className="space-y-3">
          {patterns.map((p: any) => (
            <div key={p._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getPatternTypeColor(p.pattern.type)}`}>
                      {getPatternTypeEmoji(p.pattern.type)} {p.pattern.type.toUpperCase()}
                    </span>
                    {p.userId?.email && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        User: {p.userId.email}
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {p.pattern.description}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Strength:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">{p.strength}/100</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">{(p.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Success Rate:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">{(p.successRate * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Occurrences:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">{p.occurrences}</span>
                    </div>
                  </div>

                  {p.pattern.conditions && Object.keys(p.pattern.conditions).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.pattern.conditions.rsi && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs">
                          RSI: {p.pattern.conditions.rsi.min || 0}-{p.pattern.conditions.rsi.max || 100}
                        </span>
                      )}
                      {p.pattern.conditions.volatility && (
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs">
                          Volatility: {p.pattern.conditions.volatility}
                        </span>
                      )}
                      {p.pattern.conditions.trend && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                          Trend: {p.pattern.conditions.trend}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DecisionsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <span>📝</span> Decision Log
      </h2>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          🚧 <strong>Coming Soon:</strong> Real-time decision history with filters (executed/rejected), confidence breakdown, 
          AI reasoning for each decision, and export to CSV functionality.
        </p>
      </div>
    </div>
  );
}
