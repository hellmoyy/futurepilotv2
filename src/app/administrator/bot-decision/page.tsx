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

// Tab Components (Placeholders for now)

function OverviewTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <span>📊</span> Overview & Statistics
      </h2>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          🚧 <strong>Coming Soon:</strong> Real-time dashboard with active bots count, today's decisions (executed vs rejected), 
          win rate comparison (AI vs non-AI), and top rejection reasons.
        </p>
      </div>
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
