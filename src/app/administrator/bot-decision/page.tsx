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
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <span>🤖</span> Active User Bots
      </h2>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          🚧 <strong>Coming Soon:</strong> List of all user bots with real-time status, balance, win rate, today's performance, 
          gas fee balance, and individual bot management (pause/resume/restart).
        </p>
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
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <span>📰</span> News Monitor
      </h2>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          🚧 <strong>Coming Soon:</strong> Real-time crypto news feed with AI sentiment analysis (bullish/bearish/neutral), 
          impact tracking on decisions, and source filtering.
        </p>
      </div>
    </div>
  );
}

function LearningTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <span>🎓</span> Learning Insights
      </h2>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          🚧 <strong>Coming Soon:</strong> Top loss/win patterns identified by AI, pattern avoidance success metrics, 
          win rate improvement over time, and adaptive threshold adjustments.
        </p>
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
