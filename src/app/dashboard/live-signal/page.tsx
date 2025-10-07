'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface SignalData {
  _id: string;
  userId: string;
  botInstanceId: string;
  botName: string;
  logType: 'ANALYSIS';
  action: string;
  message: string;
  data: {
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    trend: string;
    indicators: {
      rsi: number;
      macd: {
        macd: number;
        signal: number;
        histogram: number;
      };
      ema20: number;
      ema50: number;
      ema200: number;
    };
    price: number;
    symbol: string;
    aiConfirmation?: {
      agrees: boolean;
      confidence: number;
      reasoning: string;
    };
  };
  createdAt: string;
}

export default function LiveSignalPage() {
  const { data: session } = useSession();
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'HOLD'>('ALL');

  const fetchSignals = async () => {
    try {
      const response = await fetch('/api/logs?logType=ANALYSIS&limit=50');
      if (response.ok) {
        const data = await response.json();
        setSignals(data);
      }
    } catch (error) {
      console.error('Error fetching signals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    
    // Poll for new signals every 5 seconds
    const interval = setInterval(fetchSignals, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredSignals = signals.filter(signal => {
    if (filter === 'ALL') return true;
    return signal.data?.signal === filter;
  });

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'from-green-500 to-emerald-600';
      case 'SELL':
        return 'from-red-500 to-rose-600';
      case 'HOLD':
        return 'from-yellow-500 to-orange-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getSignalTextColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'text-green-400 dark:text-green-400 light:text-green-600';
      case 'SELL':
        return 'text-red-400 dark:text-red-400 light:text-red-600';
      case 'HOLD':
        return 'text-yellow-400 dark:text-yellow-400 light:text-yellow-600';
      default:
        return 'text-gray-400 dark:text-gray-400 light:text-gray-600';
    }
  };

  const getSignalBgColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'bg-green-500/20 border-green-500/50 dark:bg-green-500/20 dark:border-green-500/50 light:bg-green-100 light:border-green-300';
      case 'SELL':
        return 'bg-red-500/20 border-red-500/50 dark:bg-red-500/20 dark:border-red-500/50 light:bg-red-100 light:border-red-300';
      case 'HOLD':
        return 'bg-yellow-500/20 border-yellow-500/50 dark:bg-yellow-500/20 dark:border-yellow-500/50 light:bg-yellow-100 light:border-yellow-300';
      default:
        return 'bg-gray-500/20 border-gray-500/50 dark:bg-gray-500/20 dark:border-gray-500/50 light:bg-gray-100 light:border-gray-300';
    }
  };

  const getTrendColor = (trend: string) => {
    if (trend?.includes('STRONG_UPTREND')) return 'text-green-500';
    if (trend?.includes('UPTREND')) return 'text-green-400';
    if (trend?.includes('STRONG_DOWNTREND')) return 'text-red-500';
    if (trend?.includes('DOWNTREND')) return 'text-red-400';
    return 'text-gray-400';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 dark:text-gray-400 light:text-gray-600">Loading signals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="relative">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-400 dark:to-cyan-400 light:from-blue-600 light:to-cyan-600 bg-clip-text text-transparent">
              Live Trading Signals
            </span>
          </h1>
        </div>
        <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-lg">
          Real-time signals from all active trading bots
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center gap-3 flex-wrap">
        {['ALL', 'BUY', 'SELL', 'HOLD'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption as any)}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              filter === filterOption
                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/5 dark:bg-white/5 light:bg-white border border-white/10 dark:border-white/10 light:border-gray-200 text-gray-400 dark:text-gray-400 light:text-gray-600 hover:border-blue-400/50'
            }`}
          >
            {filterOption}
            <span className="ml-2 text-xs opacity-75">
              ({filterOption === 'ALL' ? signals.length : signals.filter(s => s.data?.signal === filterOption).length})
            </span>
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 dark:from-green-500/20 dark:to-emerald-500/20 light:from-green-100 light:to-emerald-100 border border-green-500/50 dark:border-green-500/50 light:border-green-300 rounded-xl p-4">
          <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">BUY Signals</p>
          <p className="text-3xl font-bold text-green-400 dark:text-green-400 light:text-green-600">
            {signals.filter(s => s.data?.signal === 'BUY').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-500/20 to-rose-500/20 dark:from-red-500/20 dark:to-rose-500/20 light:from-red-100 light:to-rose-100 border border-red-500/50 dark:border-red-500/50 light:border-red-300 rounded-xl p-4">
          <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">SELL Signals</p>
          <p className="text-3xl font-bold text-red-400 dark:text-red-400 light:text-red-600">
            {signals.filter(s => s.data?.signal === 'SELL').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 dark:from-yellow-500/20 dark:to-orange-500/20 light:from-yellow-100 light:to-orange-100 border border-yellow-500/50 dark:border-yellow-500/50 light:border-yellow-300 rounded-xl p-4">
          <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">HOLD Signals</p>
          <p className="text-3xl font-bold text-yellow-400 dark:text-yellow-400 light:text-yellow-600">
            {signals.filter(s => s.data?.signal === 'HOLD').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 dark:from-blue-500/20 dark:to-cyan-500/20 light:from-blue-100 light:to-cyan-100 border border-blue-500/50 dark:border-blue-500/50 light:border-blue-300 rounded-xl p-4">
          <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">Total Signals</p>
          <p className="text-3xl font-bold text-blue-400 dark:text-blue-400 light:text-blue-600">
            {signals.length}
          </p>
        </div>
      </div>

      {/* Signals List */}
      <div className="max-w-6xl mx-auto space-y-4">
        {filteredSignals.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-20 h-20 mx-auto mb-4 text-gray-600 dark:text-gray-600 light:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-xl font-semibold text-gray-400 dark:text-gray-400 light:text-gray-600 mb-2">
              No {filter !== 'ALL' ? filter : ''} Signals Yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 light:text-gray-500">
              Signals will appear here when bots start analyzing the market
            </p>
          </div>
        ) : (
          filteredSignals.map((signal, index) => (
            <div
              key={signal._id}
              className={`relative group rounded-2xl border-2 transition-all duration-300 ${getSignalBgColor(signal.data?.signal)} hover:shadow-xl backdrop-blur-sm animate-fadeIn`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Signal Header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {/* Signal Badge */}
                    <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${getSignalColor(signal.data?.signal)} shadow-lg`}>
                      <p className="text-2xl font-bold text-white">
                        {signal.data?.signal}
                      </p>
                    </div>
                    
                    {/* Bot Info */}
                    <div>
                      <p className="text-lg font-bold text-white dark:text-white light:text-gray-900">
                        {signal.botName || 'Trading Bot'}
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">
                        {signal.data?.symbol || 'BTCUSDT'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-500 light:text-gray-500">
                      {formatTime(signal.createdAt)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-600 light:text-gray-400">
                      {new Date(signal.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Signal Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {/* Price */}
                  <div className="bg-white/5 dark:bg-white/5 light:bg-white/50 rounded-xl p-3 border border-white/10 dark:border-white/10 light:border-gray-200">
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">Price</p>
                    <p className="text-lg font-bold text-white dark:text-white light:text-gray-900">
                      ${signal.data?.price?.toFixed(2) || '0.00'}
                    </p>
                  </div>

                  {/* Confidence */}
                  <div className="bg-white/5 dark:bg-white/5 light:bg-white/50 rounded-xl p-3 border border-white/10 dark:border-white/10 light:border-gray-200">
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">Confidence</p>
                    <p className="text-lg font-bold text-blue-400 dark:text-blue-400 light:text-blue-600">
                      {signal.data?.confidence?.toFixed(1) || '0'}%
                    </p>
                  </div>

                  {/* Trend */}
                  <div className="bg-white/5 dark:bg-white/5 light:bg-white/50 rounded-xl p-3 border border-white/10 dark:border-white/10 light:border-gray-200">
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">Trend</p>
                    <p className={`text-sm font-bold ${getTrendColor(signal.data?.trend)}`}>
                      {signal.data?.trend?.replace('_', ' ') || 'NEUTRAL'}
                    </p>
                  </div>

                  {/* RSI */}
                  <div className="bg-white/5 dark:bg-white/5 light:bg-white/50 rounded-xl p-3 border border-white/10 dark:border-white/10 light:border-gray-200">
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">RSI</p>
                    <p className={`text-lg font-bold ${
                      (signal.data?.indicators?.rsi || 0) < 30 ? 'text-green-400' :
                      (signal.data?.indicators?.rsi || 0) > 70 ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {signal.data?.indicators?.rsi?.toFixed(1) || '0'}
                    </p>
                  </div>
                </div>

                {/* Technical Indicators */}
                <div className="bg-white/5 dark:bg-white/5 light:bg-white/50 rounded-xl p-4 border border-white/10 dark:border-white/10 light:border-gray-200 mb-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-500 light:text-gray-600 mb-3">TECHNICAL INDICATORS</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">MACD</p>
                      <p className="font-bold text-white dark:text-white light:text-gray-900">
                        {signal.data?.indicators?.macd?.macd?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">Signal Line</p>
                      <p className="font-bold text-white dark:text-white light:text-gray-900">
                        {signal.data?.indicators?.macd?.signal?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">Histogram</p>
                      <p className={`font-bold ${
                        (signal.data?.indicators?.macd?.histogram || 0) > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {signal.data?.indicators?.macd?.histogram?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">EMA 20</p>
                      <p className="font-bold text-white dark:text-white light:text-gray-900">
                        ${signal.data?.indicators?.ema20?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">EMA 50</p>
                      <p className="font-bold text-white dark:text-white light:text-gray-900">
                        ${signal.data?.indicators?.ema50?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">EMA 200</p>
                      <p className="font-bold text-white dark:text-white light:text-gray-900">
                        ${signal.data?.indicators?.ema200?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Confirmation */}
                {signal.data?.aiConfirmation && (
                  <div className={`rounded-xl p-4 border ${
                    signal.data.aiConfirmation.agrees
                      ? 'bg-green-500/10 border-green-500/50 dark:bg-green-500/10 dark:border-green-500/50 light:bg-green-50 light:border-green-300'
                      : 'bg-red-500/10 border-red-500/50 dark:bg-red-500/10 dark:border-red-500/50 light:bg-red-50 light:border-red-300'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {signal.data.aiConfirmation.agrees ? (
                          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">
                          AI CONFIRMATION ({signal.data.aiConfirmation.confidence}% confidence)
                        </p>
                        <p className="text-sm text-white dark:text-white light:text-gray-900">
                          {signal.data.aiConfirmation.reasoning}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message */}
                {signal.message && (
                  <div className="mt-4 p-3 bg-white/5 dark:bg-white/5 light:bg-white/50 rounded-xl border border-white/10 dark:border-white/10 light:border-gray-200">
                    <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700">
                      {signal.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-500">
          🔄 Auto-refreshing every 5 seconds
        </p>
      </div>
    </div>
  );
}
