'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TradingSignal {
  id: string;
  symbol: string;
  action: 'LONG' | 'SHORT' | 'HOLD';
  confidence: number;
  strength: 'weak' | 'moderate' | 'strong';
  status: 'active' | 'executed' | 'expired' | 'cancelled';
  entryPrice: number;
  currentPrice: number;
  takeProfitLevels: number[];
  stopLoss: number;
  riskRewardRatio: number;
  maxLeverage: number;
  recommendedPositionSize: number;
  reasons: string[];
  warnings: string[];
  indicatorSummary: string[];
  strategy: string;
  timeframe: string;
  generatedAt: string;
  expiresAt: string;
}

interface SignalsResponse {
  success: boolean;
  data: TradingSignal[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}

export default function LiveSignalPage() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filter, setFilter] = useState<'ALL' | 'LONG' | 'SHORT' | 'HOLD'>('ALL');
  const [minConfidence, setMinConfidence] = useState(80); // Default 80%
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'confidence' | 'symbol'>('timestamp');
  
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchSignals = async () => {
    try {
      setError(null);
      // SERVER-SIDE FILTERS (Heavy database queries)
      const params = new URLSearchParams({
        limit: '100', // Fetch more data, filter client-side for instant UX
        sortBy: 'timestamp',
        sortOrder: 'desc',
        minConfidence: minConfidence.toString(), // Server filter
        status: 'active', // Only active signals
      });
      
      // DON'T filter by action on server - do it client-side for instant toggle
      // This way users can switch between ALL/LONG/SHORT without API calls
      
      const response = await fetch(`/api/signals/latest?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch signals');
      }
      const data: SignalsResponse = await response.json();
      setSignals(data.data);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Error fetching signals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSignals = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const response = await fetch('/api/signals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: 'balanced',
          timeframe: '15m',
          minConfidence: 80, // Use 80% as default
          saveToDb: true,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate signals');
      }
      const data = await response.json();
      console.log(`Generated ${data.count} signals`);
      await fetchSignals();
    } catch (err: any) {
      console.error('Error generating signals:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(() => {
      fetchSignals();
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [minConfidence, refreshInterval]); // Removed 'filter' - client-side only

  // CLIENT-SIDE FILTERS (Instant UX, no API call)
  const filteredSignals = signals
    .filter(signal => {
      // Filter by signal type (LONG/SHORT/HOLD)
      if (filter !== 'ALL' && signal.action !== filter) {
        return false;
      }
      
      // Filter by search term (symbol)
      if (searchTerm && !signal.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Client-side sorting for instant UI feedback
      switch (sortBy) {
        case 'confidence':
          return b.confidence - a.confidence;
        case 'symbol':
          return a.symbol.localeCompare(b.symbol);
        case 'timestamp':
        default:
          return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🚀 Live Trading Signals
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time AI-powered trading signals • Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={generateSignals}
                disabled={isGenerating}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  isGenerating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isGenerating ? 'Generating...' : '⚡ Generate Signals'}
              </button>
              <button
                onClick={fetchSignals}
                className="px-6 py-3 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="space-y-4">
            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Signal Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['ALL', 'LONG', 'SHORT', 'HOLD'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilter(type)}
                      className={`py-2 px-3 rounded-lg font-medium transition-all ${
                        filter === type
                          ? type === 'LONG'
                            ? 'bg-green-500 text-white shadow-lg'
                            : type === 'SHORT'
                            ? 'bg-red-500 text-white shadow-lg'
                            : type === 'HOLD'
                            ? 'bg-gray-500 text-white shadow-lg'
                            : 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Min Confidence: {minConfidence}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Auto-refresh: {refreshInterval}s
                </label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="15">15 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="300">5 minutes</option>
                </select>
              </div>
            </div>

            {/* Search & Sort Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  🔍 Search Symbol
                </label>
                <input
                  type="text"
                  placeholder="Search BTC, ETH, SOL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  📊 Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="timestamp">⏰ Newest First</option>
                  <option value="confidence">📈 Highest Confidence</option>
                  <option value="symbol">🔤 Symbol (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results Counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between px-4"
        >
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredSignals.length}</span> of{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{signals.length}</span> signals
            {searchTerm && (
              <span className="ml-2">
                • Searching for "<span className="font-semibold text-blue-600 dark:text-blue-400">{searchTerm}</span>"
              </span>
            )}
            {filter !== 'ALL' && (
              <span className="ml-2">
                • Filtered by{' '}
                <span className={`font-semibold ${
                  filter === 'LONG' ? 'text-green-600 dark:text-green-400' : 
                  filter === 'SHORT' ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {filter}
                </span>
              </span>
            )}
          </div>
          {(searchTerm || filter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilter('ALL');
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear Filters
            </button>
          )}
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-xl p-4"
          >
            <p className="text-red-700 dark:text-red-400 font-medium">
              ❌ Error: {error}
            </p>
          </motion.div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading signals...</p>
            </div>
          </div>
        )}

        {!loading && (
          <AnimatePresence mode="popLayout">
            {filteredSignals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700"
              >
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  📭 No signals found. Try adjusting filters or generate new signals.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {filteredSignals.map((signal, index) => (
                  <SignalCard key={signal.id} signal={signal} index={index} />
                ))}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

interface SignalCardProps {
  signal: TradingSignal;
  index: number;
}

function SignalCard({ signal, index }: SignalCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const colors = signal.action === 'LONG'
    ? {
        gradient: 'from-green-500 to-emerald-600',
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-600 dark:text-green-400',
        badge: 'bg-green-500',
      }
    : signal.action === 'SHORT'
    ? {
        gradient: 'from-red-500 to-rose-600',
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-600 dark:text-red-400',
        badge: 'bg-red-500',
      }
    : {
        gradient: 'from-gray-500 to-gray-600',
        bg: 'bg-gray-50 dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-700',
        text: 'text-gray-600 dark:text-gray-400',
        badge: 'bg-gray-500',
      };
  
  const isExpired = new Date(signal.expiresAt) < new Date();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      layout
      className={`${colors.bg} ${colors.border} border-2 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow ${
        isExpired ? 'opacity-60' : ''
      }`}
    >
      <div className={`bg-gradient-to-r ${colors.gradient} p-1`}>
        <div className="bg-white dark:bg-gray-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`${colors.badge} text-white px-4 py-2 rounded-lg font-bold text-xl`}>
                {signal.symbol}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${colors.text}`}>{signal.action}</span>
                  <span className="text-gray-400 text-sm">•</span>
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">
                    {signal.confidence.toFixed(1)}% confidence
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    signal.strength === 'strong'
                      ? 'bg-purple-500 text-white'
                      : signal.strength === 'moderate'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-400 text-white'
                  }`}>
                    {signal.strength.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {signal.strategy} • {signal.timeframe} • R/R: {signal.riskRewardRatio.toFixed(2)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg
                className={`w-6 h-6 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Entry Price</p>
          <p className="text-gray-900 dark:text-white font-bold text-lg">${signal.entryPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Take Profit</p>
          <p className="text-green-600 dark:text-green-400 font-bold text-lg">
            ${signal.takeProfitLevels[1]?.toFixed(2) || signal.takeProfitLevels[0]?.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Stop Loss</p>
          <p className="text-red-600 dark:text-red-400 font-bold text-lg">${signal.stopLoss.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Position Size</p>
          <p className="text-gray-900 dark:text-white font-bold text-lg">
            {signal.recommendedPositionSize.toFixed(1)}%
          </p>
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 space-y-4"
          >
            {signal.reasons.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📊 Analysis Reasons:</h4>
                <ul className="space-y-1">
                  {signal.reasons.map((reason, i) => (
                    <li key={i} className="text-gray-700 dark:text-gray-300 text-sm">{reason}</li>
                  ))}
                </ul>
              </div>
            )}
            {signal.warnings.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">⚠️ Warnings:</h4>
                <ul className="space-y-1">
                  {signal.warnings.map((warning, i) => (
                    <li key={i} className="text-orange-600 dark:text-orange-400 text-sm">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            {signal.indicatorSummary.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📈 Technical Indicators:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {signal.indicatorSummary.map((indicator, i) => (
                    <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                      {indicator}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🎯 Take Profit Levels:</h4>
              <div className="flex gap-2">
                {signal.takeProfitLevels.map((tp, i) => (
                  <div key={i} className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg px-4 py-2">
                    <p className="text-green-700 dark:text-green-400 text-xs font-medium">TP{i + 1}</p>
                    <p className="text-green-900 dark:text-green-300 font-bold">${tp.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Generated: {new Date(signal.generatedAt).toLocaleString()}</span>
              <span>Expires: {new Date(signal.expiresAt).toLocaleString()}</span>
              <span>Max Leverage: {signal.maxLeverage}x</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
