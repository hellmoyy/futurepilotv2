'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper function to format symbol with slash
function formatSymbol(symbol: string): string {
  // Remove USDT suffix and add slash
  // BTCUSDT -> BTC/USDT
  // ETHUSDT -> ETH/USDT
  if (symbol.endsWith('USDT')) {
    const base = symbol.slice(0, -4);
    return `${base}/USDT`;
  }
  return symbol;
}

// Helper function to format time with date
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month} ${hours}:${minutes}`;
}

// Helper function to format countdown timer
function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

interface TradingSignal {
  id: string;
  symbol: string;
  action: 'LONG' | 'SHORT' | 'HOLD';
  confidence: number;
  strength: 'weak' | 'moderate' | 'strong';
  qualityGrade?: 'A' | 'B' | 'C' | 'D'; // NEW: Signal quality rating
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
  newsValidation?: {
    isValid: boolean;
    fundamentalScore: number;
    technicalScore: number;
    combinedScore: number;
  };
  newsSentiment?: {
    overall: 'bullish' | 'bearish' | 'neutral';
    score: number;
    confidence: number;
    reasons: string[];
    newsCount: number;
  };
  marketRegime?: { // NEW: Market context
    regime: 'trending_up' | 'trending_down' | 'ranging' | 'volatile' | 'unknown';
    confidence: number;
    trendStrength: number;
    volatilityLevel: number;
  };
  supportResistance?: { // NEW: S/R context
    nearestSupport: number | null;
    nearestResistance: number | null;
    distanceToSupport: number;
    distanceToResistance: number;
    isNearLevel: boolean;
  };
  strategy: string;
  timeframe: string;
  generatedAt: string;
  expiresAt: string;
  timeRemaining?: number; // milliseconds
  timeRemainingMinutes?: number;
  isExpiringSoon?: boolean;
  viewCount?: number;
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [filter, setFilter] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const minConfidence = 60; // Lowered to 60% for testing
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'confidence' | 'symbol'>('timestamp');
  
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState<any[]>([]);

  // Fetch ACTIVE signals only (not expired)
  const fetchSignals = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Use /api/signals/active for real-time active signals
      const params = new URLSearchParams({
        limit: '20',
        minConfidence: minConfidence.toString(),
      });
      
      const response = await fetch(`/api/signals/active?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch signals');
      }
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch signals');
      }
      
      // Only show active, non-expired signals (exclude HOLD)
      const activeSignals = (data.signals || []).filter((s: TradingSignal) => s.action !== 'HOLD');
      
      if (append) {
        setSignals(prev => [...prev, ...activeSignals]);
      } else {
        setSignals(activeSignals);
      }
      
      setTotalCount(activeSignals.length);
      setHasMore(false); // No pagination for active signals
      setLastRefresh(new Date());
      
      console.log(`✅ Loaded ${activeSignals.length} active signals`);
    } catch (err: any) {
      console.error('Error fetching signals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchSignals(nextPage, true);
    }
  };

  const generateSignals = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setCooldownInfo([]); // Clear previous cooldown info
      
      const response = await fetch('/api/signals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: 'balanced',
          timeframe: '15m',
          // minConfidence fixed at 75% in backend
          saveToDb: true,
        }),
      });
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        // Check if cooldown error
        if (data.cooldown && Array.isArray(data.cooldown) && data.cooldown.length > 0) {
          setCooldownInfo(data.cooldown);
          setError(`⏱️ Cooldown active: ${data.cooldown.length} symbols in cooldown. Please wait.`);
        } else {
          throw new Error(data.message || 'Failed to generate signals');
        }
        return;
      }
      
      console.log(`✅ Generated ${data.count} signals`);
      await fetchSignals();
    } catch (err: any) {
      console.error('Error generating signals:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-refresh every 30 seconds for active signals
  useEffect(() => {
    fetchSignals();
    const interval = setInterval(() => {
      fetchSignals();
    }, 30 * 1000); // 30 seconds
    return () => clearInterval(interval);
  }, [minConfidence]);

  // Update countdown timers every second
  useEffect(() => {
    const timer = setInterval(() => {
      setSignals(prevSignals => 
        prevSignals.map(signal => {
          const expiresAt = new Date(signal.expiresAt).getTime();
          const now = Date.now();
          const timeRemaining = Math.max(0, expiresAt - now);
          const timeRemainingMinutes = Math.floor(timeRemaining / 60000);
          
          return {
            ...signal,
            timeRemaining,
            timeRemainingMinutes,
            isExpiringSoon: timeRemainingMinutes < 15,
          };
        })
      );
    }, 1000); // Update every second
    
    return () => clearInterval(timer);
  }, []);

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
                onClick={() => {
                  setPage(1);
                  fetchSignals(1, false);
                }}
                className="px-6 py-3 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* Cooldown Information */}
        {cooldownInfo.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6"
          >
            <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center gap-2">
              ⏱️ Symbol Cooldown Active
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
              The following symbols are in cooldown to prevent signal spam. New signals will be available after the cooldown period:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cooldownInfo.map((item: any, index: number) => {
                const minutes = Math.ceil(item.remainingCooldown / 60);
                return (
                  <div 
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-yellow-300 dark:border-yellow-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {formatSymbol(item.symbol)}
                      </span>
                      <span className={`text-sm font-semibold px-2 py-1 rounded ${
                        minutes > 10 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : minutes > 5
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {minutes}m left
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="space-y-4">
            {/* Filter Controls */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Signal Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['ALL', 'LONG', 'SHORT'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`py-2 px-3 rounded-lg font-medium transition-all ${
                      filter === type
                        ? type === 'LONG'
                          ? 'bg-green-500 text-white shadow-lg'
                          : type === 'SHORT'
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'bg-blue-500 text-white shadow-lg'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
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
            Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredSignals.length}</span> signals
            {searchTerm && (
              <span className="ml-2">
                • Searching for &ldquo;<span className="font-semibold text-blue-600 dark:text-blue-400">{searchTerm}</span>&rdquo;
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
              <>
                <div className="space-y-4">
                  {filteredSignals.map((signal, index) => (
                    <SignalCard key={signal.id} signal={signal} index={index} />
                  ))}
                </div>

                {/* Loading More Indicator */}
                {loadingMore && (
                  <div className="flex justify-center mt-8 py-4">
                    <div className="text-center">
                      <div className="animate-spin h-8 w-8 mx-auto mb-2 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Loading more signals...</p>
                    </div>
                  </div>
                )}

                {/* Load More Button - Manual Only */}
                {hasMore && !loadingMore && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={loadMore}
                      className="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      📥 Load More
                    </button>
                  </div>
                )}

                {/* Pagination Info */}
                {!hasMore && signals.length > 0 && (
                  <div className="text-center mt-8 text-gray-500 dark:text-gray-400">
                    ✅ All signals loaded
                  </div>
                )}
              </>
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
  
  // Badge colors - hanya untuk label aksi
  const actionColors = signal.action === 'LONG'
    ? 'bg-green-500 text-white'
    : signal.action === 'SHORT'
    ? 'bg-red-500 text-white'
    : 'bg-gray-500 text-white';
  
  const isExpired = new Date(signal.expiresAt) < new Date();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      layout
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${
        isExpired ? 'opacity-60' : ''
      }`}
    >
      {/* Header - Soft background */}
      <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Symbol - Neutral color with formatted pair */}
            <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-bold text-xl">
              {formatSymbol(signal.symbol)}
            </div>
            <div className="flex items-center gap-3">
              {/* Action Badge - Only this has color! */}
              <span className={`${actionColors} px-4 py-1.5 rounded-lg font-bold text-lg shadow-sm`}>
                {signal.action}
              </span>
              <span className="text-gray-400 text-sm">•</span>
              <span className="text-gray-700 dark:text-gray-300 font-semibold">
                {signal.confidence.toFixed(1)}% confidence
              </span>
              <span className="text-gray-400 text-sm">•</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                {signal.strategy} • {signal.timeframe} • R/R: {signal.riskRewardRatio.toFixed(2)}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                signal.strength === 'strong'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : signal.strength === 'moderate'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {signal.strength.toUpperCase()}
              </span>
              {/* Quality Grade Badge */}
              {signal.qualityGrade && (
                <>
                  <span className="text-gray-400 text-sm">•</span>
                  <span className={`px-3 py-1 rounded-lg text-base font-black shadow-lg ${
                    signal.qualityGrade === 'A'
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                      : signal.qualityGrade === 'B'
                      ? 'bg-gradient-to-r from-green-400 to-green-600 text-white'
                      : signal.qualityGrade === 'C'
                      ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
                      : 'bg-gradient-to-r from-gray-400 to-gray-600 text-white'
                  }`}>
                    {signal.qualityGrade}
                  </span>
                </>
              )}
              <span className="text-gray-400 text-sm">•</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                🕐 {formatTime(signal.generatedAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Countdown Timer */}
            {signal.timeRemaining !== undefined && signal.timeRemaining > 0 && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                (signal.timeRemainingMinutes ?? 0) < 15
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : (signal.timeRemainingMinutes ?? 0) < 30
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              }`}>
                <span className="text-sm">⏱️</span>
                <span className="text-sm">
                  {formatCountdown(signal.timeRemaining)}
                </span>
                {signal.isExpiringSoon && (
                  <span className="text-xs ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                    ⚠️ Expiring Soon
                  </span>
                )}
              </div>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
            {/* Signal Composition - Multi-Factor Analysis */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                🎯 Multi-Factor Signal Analysis
                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                  Enhanced Probability
                </span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Technical Analysis */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📊</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Technical Analysis</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Price action & indicators</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Indicators</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {signal.indicatorSummary.length} Active
                    </span>
                  </div>
                </div>

                {/* Market Regime */}
                {signal.marketRegime && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🌊</span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">Market Regime</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Context analysis</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {signal.marketRegime.regime.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {signal.marketRegime.confidence.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* News Sentiment */}
                {signal.newsSentiment && signal.newsSentiment.newsCount > 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📰</span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">News Sentiment</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Fundamental analysis</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        signal.newsSentiment.overall === 'bullish' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : signal.newsSentiment.overall === 'bearish'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {signal.newsSentiment.overall.toUpperCase()}
                      </span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {signal.newsSentiment.newsCount} Articles
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 opacity-60">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📰</span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">News Sentiment</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">No recent news</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">N/A</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Alignment Status */}
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Signal Alignment:
                  </span>
                  <div className="flex items-center gap-2">
                    {signal.newsValidation?.isValid !== false && signal.newsSentiment ? (
                      <>
                        <span className="text-green-600 dark:text-green-400 text-sm font-bold">✓ All Factors Aligned</span>
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          High Probability
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-yellow-600 dark:text-yellow-400 text-sm font-bold">⚠ Partial Alignment</span>
                        <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                          Use Caution
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed News Sentiment */}
            {signal.newsSentiment && signal.newsSentiment.newsCount > 0 && (
              <div className={`rounded-lg p-4 ${
                signal.newsSentiment.overall === 'bullish' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
                signal.newsSentiment.overall === 'bearish' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  📰 News Sentiment
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    signal.newsSentiment.overall === 'bullish' ? 'bg-green-500 text-white' :
                    signal.newsSentiment.overall === 'bearish' ? 'bg-red-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {signal.newsSentiment.overall.toUpperCase()}
                  </span>
                </h4>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Sentiment Score</p>
                    <p className={`font-bold ${
                      signal.newsSentiment.score > 0 ? 'text-green-600 dark:text-green-400' :
                      signal.newsSentiment.score < 0 ? 'text-red-600 dark:text-red-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {signal.newsSentiment.score > 0 ? '+' : ''}{signal.newsSentiment.score.toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Confidence</p>
                    <p className="font-bold text-blue-600 dark:text-blue-400">{signal.newsSentiment.confidence.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">News Count</p>
                    <p className="font-bold text-gray-900 dark:text-white">{signal.newsSentiment.newsCount}</p>
                  </div>
                </div>
                {signal.newsSentiment.reasons && signal.newsSentiment.reasons.length > 0 && (
                  <ul className="space-y-1 text-sm">
                    {signal.newsSentiment.reasons.map((reason, i) => (
                      <li key={i} className="text-gray-700 dark:text-gray-300">{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Combined Score Breakdown */}
            {signal.newsValidation && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  🎯 Signal Confidence Breakdown
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Technical Score</p>
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {signal.newsValidation.technicalScore.toFixed(0)}%
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-200 dark:bg-blue-900">
                        <div 
                          style={{ width: `${signal.newsValidation.technicalScore}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                        ></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Price & Indicators</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Fundamental Score</p>
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {signal.newsValidation.fundamentalScore.toFixed(0)}%
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-green-200 dark:bg-green-900">
                        <div 
                          style={{ width: `${signal.newsValidation.fundamentalScore}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                        ></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">News Sentiment</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Combined Score</p>
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {signal.newsValidation.combinedScore.toFixed(0)}%
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-purple-200 dark:bg-purple-900">
                        <div 
                          style={{ width: `${signal.newsValidation.combinedScore}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"
                        ></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Final Confidence</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    💡 Combined score = Technical (60%) + Fundamental (40%)
                    {signal.newsValidation.isValid && (
                      <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">
                        ✓ Validated & Aligned
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {signal.reasons.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📊 Technical Analysis Reasons:</h4>
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
            
            {/* Take Profit Levels */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🎯 Take Profit Levels:</h4>
              <div className="flex flex-wrap gap-2">
                {signal.takeProfitLevels.map((tp, i) => (
                  <div key={i} className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg px-4 py-2">
                    <p className="text-green-700 dark:text-green-400 text-xs font-medium">TP{i + 1}</p>
                    <p className="text-green-900 dark:text-green-300 font-bold">${tp.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Stop Loss */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🛑 Stop Loss:</h4>
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg px-4 py-3 inline-block">
                <p className="text-red-700 dark:text-red-400 text-xs font-medium mb-1">Stop Loss</p>
                <p className="text-red-900 dark:text-red-300 font-bold text-xl">${signal.stopLoss.toFixed(2)}</p>
                <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                  Risk: {((Math.abs(signal.entryPrice - signal.stopLoss) / signal.entryPrice) * 100).toFixed(2)}%
                </p>
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
