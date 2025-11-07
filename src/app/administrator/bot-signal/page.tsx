'use client';

/**
 * 📡 SIGNAL CENTER - Admin Control Page
 * 
 * Features:
 * - Start/Stop signal generation
 * - View active signals
 * - Signal history
 * - Performance metrics
 * - Configuration management
 */

import { useState, useEffect, Fragment } from 'react';

interface Signal {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  strength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
  expiresAt: number;
  status: 'ACTIVE' | 'EXPIRED' | 'EXECUTED' | 'CANCELLED';
  reason: string;
}

interface SignalCenterState {
  running: boolean;
  startedAt: number | null;
  config: any;
}

interface Stats {
  activeCount: number;
  totalBroadcast: number;
  listenerCount: number;
}

export default function SignalCenterPage() {
  const [state, setState] = useState<SignalCenterState>({
    running: false,
    startedAt: null,
    config: null,
  });
  const [uptime, setUptime] = useState<number>(0);
  const [activeSignals, setActiveSignals] = useState<Signal[]>([]);
  const [signalHistory, setSignalHistory] = useState<Signal[]>([]);
  const [stats, setStats] = useState<Stats>({
    activeCount: 0,
    totalBroadcast: 0,
    listenerCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState<'active' | 'history' | 'config' | 'backtest' | 'analytics' | 'learning'>('active');
  const [sseConnected, setSseConnected] = useState(false);
  
  // Backtest state
  const [backtestPeriod, setBacktestPeriod] = useState<'1m' | '2m' | '3m'>('1m');
  const [backtestSymbol, setBacktestSymbol] = useState<string>('BTCUSDT');
  const [backtestTimeframes, setBacktestTimeframes] = useState<string[]>(['1m', '3m', '5m']);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [backtestResults, setBacktestResults] = useState<any>(null);
  
  // Multi-symbol backtest state
  const [multiSymbolResults, setMultiSymbolResults] = useState<{[symbol: string]: any}>({});
  const [activeSymbolTab, setActiveSymbolTab] = useState<string>('BTCUSDT');
  const [backtestProgress, setBacktestProgress] = useState<{current: number, total: number}>({current: 0, total: 0});
  
  // Backtest History state
  const [backtestView, setBacktestView] = useState<'run' | 'history'>('run');
  const [historyResults, setHistoryResults] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySummary, setHistorySummary] = useState<any>(null);
  const [selectedHistoryResult, setSelectedHistoryResult] = useState<any>(null);
  
  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<number>(30);
  const [analyticsSymbol, setAnalyticsSymbol] = useState<string>('all');
  
  // Learning Center states
  const [learningData, setLearningData] = useState<any>(null);
  const [learningLoading, setLearningLoading] = useState(false);
  const [learningError, setLearningError] = useState('');
  const [selectedPattern, setSelectedPattern] = useState<'all' | 'wins' | 'losses'>('all');
  
  // Pagination for trade list
  const [tradePage, setTradePage] = useState(1);
  const tradesPerPage = 10;
  
  // Pagination for Active Signals
  const [activeSignalsPage, setActiveSignalsPage] = useState(1);
  const activeSignalsPerPage = 10;
  
  // Pagination for Signal History
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 10;
  
  // Pagination for Backtest History
  const [backtestHistoryPage, setBacktestHistoryPage] = useState(1);
  const backtestHistoryPerPage = 10;
  
  // Pagination for Learning Lessons
  const [lessonsPage, setLessonsPage] = useState(1);
  const lessonsPerPage = 10;
  
  // PIN Protection state
  const [configUnlocked, setConfigUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinAttempts, setPinAttempts] = useState(0);
  const [pinLoading, setPinLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('');
  
  // Configuration Edit state
  const [configData, setConfigData] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [configError, setConfigError] = useState('');
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
  
  // Check PIN attempt status on mount and when switching to Configuration tab
  useEffect(() => {
    // Only check when Configuration tab is active
    if (selectedTab !== 'config') return;
    
    const checkAttemptStatus = async () => {
      try {
        const res = await fetch('/api/admin/verify-config-pin');
        const data = await res.json();
        
        if (data.locked) {
          // User is locked out
          setIsLocked(true);
          setLockMessage(`Account locked for ${data.remainingMinutes} minutes due to too many failed attempts.`);
          setPinAttempts(5);
          setConfigUnlocked(false);
        } else if (data.unlocked) {
          // User already unlocked (has valid cookie)
          setConfigUnlocked(true);
          setPinAttempts(0);
          setIsLocked(false);
          setLockMessage('');
        } else {
          // Not unlocked, show attempt count
          setPinAttempts(data.attempts || 0);
          setConfigUnlocked(false);
          setIsLocked(false);
        }
      } catch (err) {
        console.error('Failed to check attempt status:', err);
      }
    };
    
    checkAttemptStatus();
  }, [selectedTab]); // Re-check when switching tabs
  
  // SSE Connection for real-time updates (Phase 4)
  useEffect(() => {
    console.log('🔌 Connecting to SSE stream...');
    const eventSource = new EventSource('/api/signal-center/stream');
    
    eventSource.addEventListener('open', () => {
      console.log('🟢 SSE Connected');
      setSseConnected(true);
    });
    
    eventSource.addEventListener('signal', (e) => {
      const signal = JSON.parse(e.data);
      console.log('📡 Real-time signal received:', signal);
      
      // Update active signals instantly
      setActiveSignals((prev) => {
        // Check if signal already exists
        const exists = prev.some(s => s.id === signal.id);
        if (exists) return prev;
        
        // Add new signal to top
        return [signal, ...prev];
      });
      
      // Update stats
      setStats((prev) => ({
        ...prev,
        activeCount: prev.activeCount + 1,
        totalBroadcast: prev.totalBroadcast + 1,
      }));
      
      // Refresh full data to sync
      fetchData();
    });
    
    eventSource.addEventListener('heartbeat', () => {
      // Keep-alive heartbeat
      console.log('💓 SSE Heartbeat');
    });
    
    eventSource.addEventListener('error', (err) => {
      console.error('❌ SSE Error:', err);
      setSseConnected(false);
      
      // Auto-reconnect handled by EventSource
      setTimeout(() => {
        console.log('🔄 SSE Reconnecting...');
      }, 1000);
    });
    
    return () => {
      console.log('🔴 SSE Disconnecting');
      eventSource.close();
      setSseConnected(false);
    };
  }, []);
  
  // Auto-refresh uptime
  useEffect(() => {
    if (state.running && state.startedAt) {
      const interval = setInterval(() => {
        setUptime(Date.now() - (state.startedAt || Date.now()));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [state.running, state.startedAt]);
  
  // Fetch data
  const fetchData = async () => {
    try {
      // Get state
      const stateRes = await fetch('/api/signal-center/control');
      const stateData = await stateRes.json();
      
      if (stateData.success) {
        setState(stateData.state);
        setUptime(stateData.uptime || 0);
      }
      
      // Get active signals
      const signalsRes = await fetch('/api/signal-center/signals');
      const signalsData = await signalsRes.json();
      
      if (signalsData.success) {
        setActiveSignals(signalsData.signals || []);
        setStats(signalsData.stats || { activeCount: 0, totalBroadcast: 0, listenerCount: 0 });
      }
      
      // Get history
      const historyRes = await fetch('/api/signal-center/history?limit=50');
      const historyData = await historyRes.json();
      
      if (historyData.success) {
        setSignalHistory(historyData.history || []);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
    
    // Reduced auto-refresh to 30 seconds (SSE handles real-time updates)
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Start/Stop Signal Center
  const handleControl = async (action: 'start' | 'stop') => {
    setActionLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/signal-center/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setState(data.state);
        await fetchData(); // Refresh data
      } else {
        setError(data.error || 'Failed to control Signal Center');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };
  
  // Manual trigger signal generation (Phase 1 + 4)
  const handleManualTrigger = async () => {
    setTriggerLoading(true);
    setError('');
    
    try {
      console.log('🎯 Manually triggering signal generation...');
      const res = await fetch('/api/cron/generate-signals', {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (data.success) {
        if (data.signal) {
          console.log('✅ Signal generated:', data.signal);
          // Signal will be received via SSE automatically
        } else {
          console.log('⚠️ No signal generated (market conditions not met)');
        }
      } else {
        setError(data.error || 'Failed to generate signal');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTriggerLoading(false);
    }
  };
  
  // Verify PIN for Configuration tab
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinLoading(true);
    setPinError('');
    
    try {
      const res = await fetch('/api/admin/verify-config-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin: pinInput }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Success: Unlock configuration
        setConfigUnlocked(true);
        setPinInput('');
        setPinAttempts(0);
        setPinError('');
      } else if (res.status === 429) {
        // Locked out
        setPinError(data.error);
        setPinInput('');
        setPinAttempts(5); // Max attempts reached
        
        // Auto logout after 3 seconds
        setTimeout(async () => {
          await fetch('/api/auth/signout', { method: 'POST' });
          window.location.href = '/login';
        }, 3000);
      } else {
        // Failed attempt - use server-provided remaining attempts
        const remainingAttempts = data.remainingAttempts || 0;
        setPinAttempts(5 - remainingAttempts); // Update to match server
        
        if (remainingAttempts === 0) {
          setPinError('Maximum attempts exceeded. Logging out...');
          setTimeout(async () => {
            await fetch('/api/auth/signout', { method: 'POST' });
            window.location.href = '/login';
          }, 2000);
        } else {
          setPinError(`Incorrect PIN. ${remainingAttempts} attempts remaining.`);
          setPinInput('');
        }
      }
    } catch (err: any) {
      setPinError(err.message || 'Failed to verify PIN');
    } finally {
      setPinLoading(false);
    }
  };
  
  // Load configuration from database when unlocked
  useEffect(() => {
    if (configUnlocked) {
      loadConfiguration();
    }
  }, [configUnlocked]);
  
  const loadConfiguration = async () => {
    setConfigLoading(true);
    setConfigError('');
    
    try {
      const res = await fetch('/api/signal-center/config');
      const data = await res.json();
      
      if (data.config) {
        setConfigData(data.config);
      } else {
        setConfigError('No configuration found');
      }
    } catch (err: any) {
      setConfigError(err.message || 'Failed to load configuration');
    } finally {
      setConfigLoading(false);
    }
  };
  
  // Handle configuration save
  const handleSaveConfiguration = async () => {
    setConfigSaving(true);
    setConfigError('');
    
    try {
      // Extract _id and prepare payload
      const { _id, __v, createdAt, updatedAt, ...cleanConfigData } = configData;
      
      const payload = _id 
        ? { configId: _id, ...cleanConfigData }  // Update existing config
        : cleanConfigData;                        // Create new config
      
      const res = await fetch('/api/signal-center/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (data.config) {
        setConfigData(data.config);
        setShowSaveConfirm(false);
        alert('✅ Configuration saved successfully!');
      } else {
        setConfigError(data.error || 'Failed to save configuration');
      }
    } catch (err: any) {
      setConfigError(err.message || 'Failed to save configuration');
    } finally {
      setConfigSaving(false);
    }
  };
  
  // Update config field
  const updateConfigField = (field: string, value: any) => {
    setConfigData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };
  
  // Toggle field editing
  const toggleFieldEdit = (field: string) => {
    setEditingFields((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  };
  
  // Enable all fields for editing
  const enableAllFields = () => {
    const allFields = [
      'riskPerTrade', 'leverage', 'stopLossPercent', 'takeProfitPercent',
      'trailProfitActivate', 'trailProfitDistance', 'trailLossActivate', 'trailLossDistance',
      'rsiMin', 'rsiMax', 'adxMin', 'adxMax', 'volumeMin', 'volumeMax',
      'entryConfirmationCandles', 'marketBiasPeriod', 'biasThreshold', 'signalExpiryMinutes'
    ];
    setEditingFields(new Set(allFields));
  };
  
  // Disable all fields
  const disableAllFields = () => {
    setEditingFields(new Set());
  };
  
  // Run backtest with selected period
  const handleRunBacktest = async () => {
    setBacktestLoading(true);
    setError('');
    setBacktestResults(null);
    setMultiSymbolResults({});
    
    // Get symbols from configuration
    const symbols = configData?.symbols || ['BTCUSDT'];
    setBacktestProgress({ current: 0, total: symbols.length });
    
    try {
      console.log(`🧪 Running backtest for ${symbols.length} symbol(s): ${symbols.join(', ')}`);
      
      const results: {[symbol: string]: any} = {};
      
      // Run backtest for each symbol sequentially
      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        setBacktestProgress({ current: i + 1, total: symbols.length });
        
        console.log(`📊 [${i + 1}/${symbols.length}] Running backtest for ${symbol}...`);
        
        const res = await fetch('/api/backtest/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symbol: symbol,
            period: backtestPeriod,
            balance: 10000,
            useActiveConfig: true, // ✅ Use configuration from Configuration tab
          }),
        });
        
        const data = await res.json();
        
        if (data.success) {
          console.log(`✅ [${i + 1}/${symbols.length}] ${symbol} completed: ${data.results.trades?.length || 0} trades`);
          results[symbol] = data.results;
        } else {
          console.error(`❌ [${i + 1}/${symbols.length}] ${symbol} failed:`, data.error);
          results[symbol] = { error: data.error || 'Failed to run backtest' };
        }
      }
      
      // Set results
      setMultiSymbolResults(results);
      
      // Set active tab to first symbol
      setActiveSymbolTab(symbols[0]);
      
      // Set backtestResults to first symbol for backward compatibility
      setBacktestResults(results[symbols[0]]);
      
      // Reset pagination
      setTradePage(1);
      
      console.log(`🎉 All backtests completed successfully!`);
      
    } catch (err: any) {
      console.error('❌ Backtest error:', err);
      setError(err.message || 'Failed to run backtest');
    } finally {
      setBacktestLoading(false);
      setBacktestProgress({ current: 0, total: 0 });
    }
  };
  
  // Fetch backtest history
  const fetchBacktestHistory = async (symbol?: string) => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '30');
      if (symbol) params.append('symbol', symbol);
      
      const res = await fetch(`/api/backtest/history?${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setHistoryResults(data.results);
        setHistorySummary(data.summary);
        console.log(`📊 Loaded ${data.results.length} backtest history results`);
      } else {
        setError(data.error || 'Failed to fetch history');
      }
    } catch (err: any) {
      console.error('❌ Failed to fetch history:', err);
      setError(err.message || 'Failed to fetch history');
    } finally {
      setHistoryLoading(false);
    }
  };
  
  // Delete backtest result
  const deleteBacktestResult = async (id: string) => {
    if (!confirm('Are you sure you want to delete this backtest result?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/backtest/history?id=${id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Refresh history
        fetchBacktestHistory();
        setSelectedHistoryResult(null);
      } else {
        alert(data.error || 'Failed to delete result');
      }
    } catch (err: any) {
      console.error('❌ Failed to delete:', err);
      alert(err.message || 'Failed to delete result');
    }
  };
  
  // Load history when switching to history view
  useEffect(() => {
    if (backtestView === 'history' && selectedTab === 'backtest') {
      fetchBacktestHistory();
    }
  }, [backtestView, selectedTab]);
  
  // Fetch analytics data
  const fetchAnalytics = async (period?: number, symbol?: string) => {
    setAnalyticsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('days', (period || analyticsPeriod).toString());
      if (symbol && symbol !== 'all') params.append('symbol', symbol);
      
      const res = await fetch(`/api/backtest/analytics?${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setAnalyticsData(data.analytics);
        console.log(`📊 Loaded analytics for ${data.analytics.summary.totalBacktests} backtests`);
      } else {
        setError(data.error || 'Failed to fetch analytics');
      }
    } catch (err: any) {
      console.error('❌ Failed to fetch analytics:', err);
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };
  
  // Fetch learning center data
  const fetchLearningData = async (type?: 'all' | 'wins' | 'losses') => {
    setLearningLoading(true);
    setLearningError('');
    try {
      const params = new URLSearchParams();
      params.append('type', type || selectedPattern);
      params.append('limit', '50');
      
      const res = await fetch(`/api/backtest/learning?${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setLearningData(data.learning);
        console.log(`🎓 Loaded learning insights from ${data.learning.summary?.totalBacktests || 0} backtests`);
      } else {
        setLearningError(data.error || 'Failed to fetch learning data');
      }
    } catch (err: any) {
      console.error('❌ Failed to fetch learning data:', err);
      setLearningError(err.message || 'Failed to fetch learning data');
    } finally {
      setLearningLoading(false);
    }
  };
  
  // Format uptime
  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };
  
  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Auto-load analytics data when tab selected
  useEffect(() => {
    if (selectedTab === 'analytics' && !analyticsData) {
      fetchAnalytics();
    }
  }, [selectedTab]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Auto-load learning data when tab selected
  useEffect(() => {
    if (selectedTab === 'learning' && !learningData) {
      fetchLearningData();
    }
  }, [selectedTab]); // eslint-disable-line react-hooks/exhaustive-deps
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading Signal Center...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                📡 Signal Center
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  state.running 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {state.running ? '🟢 RUNNING' : '⚫ STOPPED'}
                </span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Centralized signal generation & broadcasting system
              </p>
            </div>
            
            <div className="flex gap-3">
              {/* SSE Connection Status */}
              <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
                sseConnected 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {sseConnected ? '🟢 Live Connected' : '⚫ Connecting...'}
              </div>
              
              {/* Manual Trigger Button */}
              <button
                onClick={handleManualTrigger}
                disabled={triggerLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {triggerLoading ? '⏳' : '🎯'} Generate Signal Now
              </button>
              
              <button
                onClick={() => fetchData()}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
              >
                🔄 Refresh
              </button>
              
              {state.running ? (
                <button
                  onClick={() => handleControl('stop')}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? '⏳' : '🛑'} Stop Signal Center
                </button>
              ) : (
                <button
                  onClick={() => handleControl('start')}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? '⏳' : '🚀'} Start Signal Center
                </button>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
              ❌ {error}
            </div>
          )}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Signals</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {stats.activeCount}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Broadcast</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              {stats.totalBroadcast}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">Connected Bots</div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
              {stats.listenerCount}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">
              {state.running ? formatUptime(uptime) : '0s'}
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setSelectedTab('active')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'active'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Active Signals ({activeSignals.length})
              </button>
              <button
                onClick={() => setSelectedTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'history'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                History ({signalHistory.length})
              </button>
              <button
                onClick={() => setSelectedTab('config')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'config'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Configuration
              </button>
              <button
                onClick={() => setSelectedTab('backtest')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'backtest'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Backtest
              </button>
              <button
                onClick={() => setSelectedTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'analytics'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setSelectedTab('learning')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'learning'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                🎓 Learning Center
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {/* Active Signals Tab */}
            {selectedTab === 'active' && (
              <div>
                {activeSignals.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-gray-600 dark:text-gray-400">No active signals</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      {state.running ? 'Waiting for market conditions...' : 'Start Signal Center to generate signals'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {activeSignals.slice((activeSignalsPage - 1) * activeSignalsPerPage, activeSignalsPage * activeSignalsPerPage).map((signal) => (
                      <div
                        key={signal.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xl font-bold text-gray-900 dark:text-white">
                                {signal.symbol}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                signal.action === 'BUY'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {signal.action}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                signal.strength === 'VERY_STRONG' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                signal.strength === 'STRONG' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                signal.strength === 'MODERATE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              }`}>
                                {signal.strength}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {signal.confidence.toFixed(1)}% confidence
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Entry:</span>
                                <span className="ml-2 font-mono text-gray-900 dark:text-white">
                                  ${signal.entryPrice.toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Stop Loss:</span>
                                <span className="ml-2 font-mono text-red-600 dark:text-red-400">
                                  ${signal.stopLoss.toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Take Profit:</span>
                                <span className="ml-2 font-mono text-green-600 dark:text-green-400">
                                  ${signal.takeProfit.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {signal.reason}
                            </p>
                            
                            <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-500 mt-2">
                              <span>Created: {formatDate(signal.timestamp)}</span>
                              <span>Expires: {formatDate(signal.expiresAt)}</span>
                            </div>
                          </div>
                          
                          <div className="ml-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              signal.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              signal.status === 'EXECUTED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              signal.status === 'EXPIRED' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {signal.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>

                    {/* Pagination for Active Signals */}
                    {activeSignals.length > activeSignalsPerPage && (
                      <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Showing {((activeSignalsPage - 1) * activeSignalsPerPage) + 1} - {Math.min(activeSignalsPage * activeSignalsPerPage, activeSignals.length)} of {activeSignals.length} signals
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveSignalsPage(p => Math.max(1, p - 1))}
                            disabled={activeSignalsPage === 1}
                            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {activeSignalsPage} of {Math.ceil(activeSignals.length / activeSignalsPerPage)}
                          </span>
                          <button
                            onClick={() => setActiveSignalsPage(p => Math.min(Math.ceil(activeSignals.length / activeSignalsPerPage), p + 1))}
                            disabled={activeSignalsPage >= Math.ceil(activeSignals.length / activeSignalsPerPage)}
                            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            {/* History Tab */}
            {selectedTab === 'history' && (
              <div>
                {signalHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-gray-600 dark:text-gray-400">No signal history</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {signalHistory.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage).map((signal) => (
                        <div
                          key={signal.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-gray-900 dark:text-white">
                                {signal.symbol}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                signal.action === 'BUY'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {signal.action}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                ${signal.entryPrice.toFixed(2)}
                              </span>
                              <span className="text-gray-500 dark:text-gray-500">
                                {signal.confidence.toFixed(0)}%
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                signal.status === 'EXECUTED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                signal.status === 'EXPIRED' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                                signal.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {signal.status}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {formatDate(signal.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination for Signal History */}
                    {signalHistory.length > historyPerPage && (
                      <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Showing {((historyPage - 1) * historyPerPage) + 1} - {Math.min(historyPage * historyPerPage, signalHistory.length)} of {signalHistory.length} signals
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                            disabled={historyPage === 1}
                            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {historyPage} of {Math.ceil(signalHistory.length / historyPerPage)}
                          </span>
                          <button
                            onClick={() => setHistoryPage(p => Math.min(Math.ceil(signalHistory.length / historyPerPage), p + 1))}
                            disabled={historyPage >= Math.ceil(signalHistory.length / historyPerPage)}
                            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            {/* Configuration Tab */}
            {selectedTab === 'config' && (
              <div className="space-y-6">
                {!configUnlocked ? (
                  /* PIN Protection Screen */
                  <div className="max-w-md mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          🔒 Protected Configuration
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Enter 6-digit PIN to access strategy configuration
                        </p>
                      </div>
                      
                      {/* Lockout Message */}
                      {isLocked && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1">
                              <h4 className="font-semibold text-red-800 dark:text-red-300 mb-1">Account Locked</h4>
                              <p className="text-sm text-red-700 dark:text-red-400">{lockMessage}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <form onSubmit={handlePinSubmit} className="space-y-4">
                        <div>
                          <label htmlFor="pin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            PIN Code
                          </label>
                          <input
                            id="pin"
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                            disabled={pinLoading || isLocked}
                            className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed tracking-widest"
                            placeholder="••••••"
                            autoFocus={!isLocked}
                          />
                        </div>
                        
                        {pinError && (
                          <div className={`p-3 rounded-lg text-sm ${
                            pinAttempts >= 5 
                              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                              : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300'
                          }`}>
                            {pinError}
                          </div>
                        )}
                        
                        <button
                          type="submit"
                          disabled={pinLoading || pinInput.length !== 6 || isLocked}
                          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {pinLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              Verifying...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                              </svg>
                              Unlock Configuration
                            </>
                          )}
                        </button>
                        
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {pinAttempts > 0 && pinAttempts < 5 && (
                              <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                                ⚠️ {pinAttempts}/5 failed attempts
                              </span>
                            )}
                            {pinAttempts === 0 && (
                              <span>You have 5 attempts before auto logout</span>
                            )}
                          </p>
                        </div>
                      </form>
                      
                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                          <p className="text-xs text-yellow-800 dark:text-yellow-300">
                            <strong>⚠️ Security Notice:</strong> This configuration contains sensitive trading strategy parameters. Access is restricted to authorized administrators only.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Configuration Content (after PIN verified) */
                  <>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                        ⚙️ Strategy Configuration
                      </h3>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Click edit icons (✏️) to enable/disable editing per field
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingFields.size > 0 ? (
                        <button
                          onClick={disableAllFields}
                          className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
                        >
                          🔒 Disable All
                        </button>
                      ) : (
                        <button
                          onClick={enableAllFields}
                          className="px-3 py-2 text-sm bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-700 transition flex items-center gap-2"
                        >
                          ✏️ Enable All
                        </button>
                      )}
                      <button
                        onClick={() => setShowSaveConfirm(true)}
                        disabled={configSaving || configLoading || !configData || editingFields.size === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {configSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            💾 Save Changes
                          </>
                        )}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await fetch('/api/admin/verify-config-pin', {
                              method: 'DELETE',
                            });
                            setConfigUnlocked(false);
                            setPinInput('');
                            setPinError('');
                            setPinAttempts(0);
                            setConfigData(null);
                            setEditingFields(new Set());
                          } catch (err) {
                            console.error('Failed to lock configuration:', err);
                          }
                        }}
                        className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition"
                      >
                        🔒 Lock
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Strategy Overview - Ringkasan Strategi */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-purple-600 dark:bg-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🎯</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-purple-900 dark:text-purple-200 mb-3 flex items-center gap-2">
                        📋 Ringkasan Strategi Trading Bot
                      </h3>
                      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                        <p className="leading-relaxed">
                          <strong className="text-purple-700 dark:text-purple-300">🤖 Cara Kerja:</strong> Bot ini menganalisis pergerakan harga Bitcoin setiap menit menggunakan <strong>3 timeframe sekaligus</strong> (1 menit, 3 menit, 5 menit). Ketiga sinyal harus sinkron untuk memastikan trend benar-benar kuat sebelum masuk posisi.
                        </p>
                        
                        <p className="leading-relaxed">
                          <strong className="text-purple-700 dark:text-purple-300">💰 Manajemen Risiko:</strong> Bot hanya mempertaruhkan <strong>2% dari modal</strong> per trade dengan leverage 10x. Artinya jika modal $10,000, risiko maksimal per trade hanya <strong>$200</strong>. Stop loss dan take profit otomatis terpasang di 0.8%.
                        </p>
                        
                        <p className="leading-relaxed">
                          <strong className="text-purple-700 dark:text-purple-300">🎯 Target Profit:</strong> Bot menargetkan profit kecil tapi sering (<strong>scalping strategy</strong>). Dengan trailing profit system, bot bisa keluar otomatis saat profit mulai turun, mengamankan keuntungan sebelum harga berbalik.
                        </p>
                        
                        <p className="leading-relaxed">
                          <strong className="text-purple-700 dark:text-purple-300">🛡️ Proteksi Kerugian:</strong> Ada <strong>dual trailing system</strong>:
                          <br />
                          • <strong>Trailing Profit:</strong> Saat profit +0.4%, trailing aktif. Jika turun 0.3% dari puncak → exit otomatis
                          <br />
                          • <strong>Trailing Loss:</strong> Saat loss -0.3%, trailing aktif. Jika recovery 0.2% → exit sebelum loss lebih besar
                          <br />
                          • <strong>Emergency Exit:</strong> Hard cap -2%, bot akan keluar paksa untuk lindungi modal
                        </p>
                        
                        <p className="leading-relaxed">
                          <strong className="text-purple-700 dark:text-purple-300">📊 Filter Ketat:</strong> Bot tidak asal masuk! Harus lolos filter:
                          <br />
                          • Volume trading 0.8-2.0x dari rata-rata (cegah false breakout)
                          <br />
                          • RSI 35-68 (hindari overbought/oversold ekstrem)
                          <br />
                          • ADX 20-50 (pastikan trend cukup kuat tapi tidak overextended)
                          <br />
                          • MACD histogram harus kuat (minimal 0.00003)
                        </p>
                        
                        <p className="leading-relaxed bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                          <strong className="text-green-700 dark:text-green-300">✅ Hasil Backtest 3 Bulan:</strong> Modal $10,000 menjadi $77,529 (+675% ROI) dengan win rate <strong>80.5%</strong>. Ini adalah strategi yang sudah terbukti di data historis Bitcoin Agustus-Oktober 2025.
                        </p>
                        
                        <p className="text-xs text-gray-500 dark:text-gray-500 italic mt-2">
                          💡 <strong>Tips:</strong> Parameter di bawah ini sudah dioptimalkan berdasarkan backtest. Ubah hanya jika Anda paham konsekuensinya terhadap win rate dan risk management.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Error Display */}
                {configError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-800 dark:text-red-300">{configError}</p>
                  </div>
                )}
                
                {/* Loading State */}
                {configLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                )}
                
                {/* Configuration Form */}
                {!configLoading && configData && (
                <div className="space-y-6">
                
                {/* Trading Pairs Selection */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>📊</span> Trading Pairs
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Select pairs to generate trading signals for. Multiple pairs can be monitored simultaneously.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT'].map((pair) => {
                      const isSelected = configData.symbols?.includes(pair) || (pair === 'BTCUSDT' && !configData.symbols);
                      return (
                        <label
                          key={pair}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const currentSymbols = configData.symbols || ['BTCUSDT'];
                              let newSymbols;
                              if (e.target.checked) {
                                newSymbols = [...currentSymbols, pair];
                              } else {
                                newSymbols = currentSymbols.filter((s: string) => s !== pair);
                                // Ensure at least one symbol selected
                                if (newSymbols.length === 0) {
                                  newSymbols = ['BTCUSDT'];
                                }
                              }
                              updateConfigField('symbols', newSymbols);
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium text-sm text-gray-900 dark:text-white">
                              {pair.replace('USDT', '')}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {pair}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      💡 <strong>Selected:</strong> {(configData.symbols || ['BTCUSDT']).join(', ')}
                    </p>
                  </div>
                </div>
                
                {/* Risk Management */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>💰</span> Risk Management
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Risk per Trade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>Risk per Trade (%)</span>
                        <button
                          onClick={() => toggleFieldEdit('riskPerTrade')}
                          className={`p-1 rounded transition ${
                            editingFields.has('riskPerTrade')
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={editingFields.has('riskPerTrade') ? 'Disable editing' : 'Enable editing'}
                        >
                          {editingFields.has('riskPerTrade') ? '🔓' : '✏️'}
                        </button>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="10"
                        value={(configData.riskPerTrade * 100).toFixed(2)}
                        onChange={(e) => updateConfigField('riskPerTrade', parseFloat(e.target.value) / 100)}
                        disabled={!editingFields.has('riskPerTrade')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Range: 0.1% - 10%</p>
                    </div>
                    
                    {/* Leverage */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>Leverage (x)</span>
                        <button
                          onClick={() => toggleFieldEdit('leverage')}
                          className={`p-1 rounded transition ${
                            editingFields.has('leverage')
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={editingFields.has('leverage') ? 'Disable editing' : 'Enable editing'}
                        >
                          {editingFields.has('leverage') ? '🔓' : '✏️'}
                        </button>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={configData.leverage}
                        onChange={(e) => updateConfigField('leverage', parseInt(e.target.value))}
                        disabled={!editingFields.has('leverage')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Range: 1x - 20x</p>
                    </div>
                    
                    {/* Stop Loss */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>Stop Loss (%)</span>
                        <button
                          onClick={() => toggleFieldEdit('stopLossPercent')}
                          className={`p-1 rounded transition ${
                            editingFields.has('stopLossPercent')
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={editingFields.has('stopLossPercent') ? 'Disable editing' : 'Enable editing'}
                        >
                          {editingFields.has('stopLossPercent') ? '🔓' : '✏️'}
                        </button>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="5"
                        value={(configData.stopLossPercent * 100).toFixed(2)}
                        onChange={(e) => updateConfigField('stopLossPercent', parseFloat(e.target.value) / 100)}
                        disabled={!editingFields.has('stopLossPercent')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Range: 0.1% - 5%</p>
                    </div>
                    
                    {/* Take Profit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>Take Profit (%)</span>
                        <button
                          onClick={() => toggleFieldEdit('takeProfitPercent')}
                          className={`p-1 rounded transition ${
                            editingFields.has('takeProfitPercent')
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={editingFields.has('takeProfitPercent') ? 'Disable editing' : 'Enable editing'}
                        >
                          {editingFields.has('takeProfitPercent') ? '🔓' : '✏️'}
                        </button>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="10"
                        value={(configData.takeProfitPercent * 100).toFixed(2)}
                        onChange={(e) => updateConfigField('takeProfitPercent', parseFloat(e.target.value) / 100)}
                        disabled={!editingFields.has('takeProfitPercent')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Range: 0.1% - 10%</p>
                    </div>
                  </div>
                </div>
                
                {/* Trailing Stops */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>📊</span> Trailing Stops
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h5 className="text-sm font-medium text-green-700 dark:text-green-300">📈 Trailing Profit</h5>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                          <span>Activation Threshold (%)</span>
                          <button
                            onClick={() => toggleFieldEdit('trailProfitActivate')}
                            className={`p-1 rounded transition ${
                              editingFields.has('trailProfitActivate')
                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title={editingFields.has('trailProfitActivate') ? 'Disable editing' : 'Enable editing'}
                          >
                            {editingFields.has('trailProfitActivate') ? '🔓' : '✏️'}
                          </button>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="5"
                          value={(configData.trailProfitActivate * 100).toFixed(2)}
                          onChange={(e) => updateConfigField('trailProfitActivate', parseFloat(e.target.value) / 100)}
                          disabled={!editingFields.has('trailProfitActivate')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">When to start trailing profit</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                          <span>Trail Distance (%)</span>
                          <button
                            onClick={() => toggleFieldEdit('trailProfitDistance')}
                            className={`p-1 rounded transition ${
                              editingFields.has('trailProfitDistance')
                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title={editingFields.has('trailProfitDistance') ? 'Disable editing' : 'Enable editing'}
                          >
                            {editingFields.has('trailProfitDistance') ? '🔓' : '✏️'}
                          </button>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="5"
                          value={(configData.trailProfitDistance * 100).toFixed(2)}
                          onChange={(e) => updateConfigField('trailProfitDistance', parseFloat(e.target.value) / 100)}
                          disabled={!editingFields.has('trailProfitDistance')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Distance from peak to exit</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h5 className="text-sm font-medium text-red-700 dark:text-red-300">📉 Trailing Loss</h5>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                          <span>Activation Threshold (%)</span>
                          <button
                            onClick={() => toggleFieldEdit('trailLossActivate')}
                            className={`p-1 rounded transition ${
                              editingFields.has('trailLossActivate')
                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title={editingFields.has('trailLossActivate') ? 'Disable editing' : 'Enable editing'}
                          >
                            {editingFields.has('trailLossActivate') ? '🔓' : '✏️'}
                          </button>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="-5"
                          max="0"
                          value={(configData.trailLossActivate * 100).toFixed(2)}
                          onChange={(e) => updateConfigField('trailLossActivate', parseFloat(e.target.value) / 100)}
                          disabled={!editingFields.has('trailLossActivate')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">When to start trailing loss (negative)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                          <span>Trail Distance (%)</span>
                          <button
                            onClick={() => toggleFieldEdit('trailLossDistance')}
                            className={`p-1 rounded transition ${
                              editingFields.has('trailLossDistance')
                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title={editingFields.has('trailLossDistance') ? 'Disable editing' : 'Enable editing'}
                          >
                            {editingFields.has('trailLossDistance') ? '🔓' : '✏️'}
                          </button>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="5"
                          value={(configData.trailLossDistance * 100).toFixed(2)}
                          onChange={(e) => updateConfigField('trailLossDistance', parseFloat(e.target.value) / 100)}
                          disabled={!editingFields.has('trailLossDistance')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Distance from bottom to exit</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Technical Indicators */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>🔍</span> Technical Indicators
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>RSI Min</span>
                        <button
                          onClick={() => toggleFieldEdit('rsiMin')}
                          className={`p-1 rounded transition ${
                            editingFields.has('rsiMin')
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={editingFields.has('rsiMin') ? 'Disable editing' : 'Enable editing'}
                        >
                          {editingFields.has('rsiMin') ? '🔓' : '✏️'}
                        </button>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={configData.rsiMin}
                        onChange={(e) => updateConfigField('rsiMin', parseInt(e.target.value))}
                        disabled={!editingFields.has('rsiMin')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>RSI Max</span>
                        <button
                          onClick={() => toggleFieldEdit('rsiMax')}
                          className={`p-1 rounded transition ${
                            editingFields.has('rsiMax')
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={editingFields.has('rsiMax') ? 'Disable editing' : 'Enable editing'}
                        >
                          {editingFields.has('rsiMax') ? '🔓' : '✏️'}
                        </button>
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={configData.rsiMax}
                        onChange={(e) => updateConfigField('rsiMax', parseInt(e.target.value))}
                        disabled={!editingFields.has('rsiMax')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>ADX Min</span>
                        <button
                          onClick={() => toggleFieldEdit('adxMin')}
                          className={`p-1 rounded transition ${
                            editingFields.has('adxMin')
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={editingFields.has('adxMin') ? 'Disable editing' : 'Enable editing'}
                        >
                          {editingFields.has('adxMin') ? '🔓' : '✏️'}
                        </button>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={configData.adxMin}
                        onChange={(e) => updateConfigField('adxMin', parseInt(e.target.value))}
                        disabled={!editingFields.has('adxMin')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>ADX Max</span>
                        <button
                          onClick={() => toggleFieldEdit('adxMax')}
                          className={`p-1 rounded transition ${
                            editingFields.has('adxMax')
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={editingFields.has('adxMax') ? 'Disable editing' : 'Enable editing'}
                        >
                          {editingFields.has('adxMax') ? '🔓' : '✏️'}
                        </button>
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="100"
                        value={configData.adxMax}
                        onChange={(e) => updateConfigField('adxMax', parseInt(e.target.value))}
                        disabled={!editingFields.has('adxMax')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>Volume Min (x)</span>
                        <button
                          onClick={() => toggleFieldEdit('volumeMin')}
                          className={`p-1 rounded transition ${
                            editingFields.has('volumeMin')
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={editingFields.has('volumeMin') ? 'Disable editing' : 'Enable editing'}
                        >
                          {editingFields.has('volumeMin') ? '🔓' : '✏️'}
                        </button>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="2"
                        value={configData.volumeMin}
                        onChange={(e) => updateConfigField('volumeMin', parseFloat(e.target.value))}
                        disabled={!editingFields.has('volumeMin')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>Volume Max (x)</span>
                        <button
                          onClick={() => toggleFieldEdit('volumeMax')}
                          className={`p-1 rounded transition ${
                            editingFields.has('volumeMax')
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={editingFields.has('volumeMax') ? 'Disable editing' : 'Enable editing'}
                        >
                          {editingFields.has('volumeMax') ? '🔓' : '✏️'}
                        </button>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="10"
                        value={configData.volumeMax}
                        onChange={(e) => updateConfigField('volumeMax', parseFloat(e.target.value))}
                        disabled={!editingFields.has('volumeMax')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Confirmation Settings */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>⚡</span> Confirmation Settings
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>Entry Confirmation Candles</span>
                        <button
                          onClick={() => toggleFieldEdit('entryConfirmationCandles')}
                          className={`p-1 rounded transition ${
                            editingFields.has('entryConfirmationCandles')
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={editingFields.has('entryConfirmationCandles') ? 'Disable editing' : 'Enable editing'}
                        >
                          {editingFields.has('entryConfirmationCandles') ? '🔓' : '✏️'}
                        </button>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={configData.entryConfirmationCandles}
                        onChange={(e) => updateConfigField('entryConfirmationCandles', parseInt(e.target.value))}
                        disabled={!editingFields.has('entryConfirmationCandles')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Wait candles before entry</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>Market Bias Period</span>
                        <button
                          onClick={() => toggleFieldEdit('marketBiasPeriod')}
                          className={`p-1 rounded transition ${
                            editingFields.has('marketBiasPeriod')
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={editingFields.has('marketBiasPeriod') ? 'Disable editing' : 'Enable editing'}
                        >
                          {editingFields.has('marketBiasPeriod') ? '🔓' : '✏️'}
                        </button>
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="200"
                        value={configData.marketBiasPeriod}
                        onChange={(e) => updateConfigField('marketBiasPeriod', parseInt(e.target.value))}
                        disabled={!editingFields.has('marketBiasPeriod')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Candles for market regime detection</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>Bias Threshold (%)</span>
                        <button
                          onClick={() => toggleFieldEdit('biasThreshold')}
                          className={`p-1 rounded transition ${
                            editingFields.has('biasThreshold')
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={editingFields.has('biasThreshold') ? 'Disable editing' : 'Enable editing'}
                        >
                          {editingFields.has('biasThreshold') ? '🔓' : '✏️'}
                        </button>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="10"
                        value={(configData.biasThreshold * 100).toFixed(2)}
                        onChange={(e) => updateConfigField('biasThreshold', parseFloat(e.target.value) / 100)}
                        disabled={!editingFields.has('biasThreshold')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum trend strength</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>Signal Expiry (minutes)</span>
                        <button
                          onClick={() => toggleFieldEdit('signalExpiryMinutes')}
                          className={`p-1 rounded transition ${
                            editingFields.has('signalExpiryMinutes')
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={editingFields.has('signalExpiryMinutes') ? 'Disable editing' : 'Enable editing'}
                        >
                          {editingFields.has('signalExpiryMinutes') ? '🔓' : '✏️'}
                        </button>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={configData.signalExpiryMinutes}
                        onChange={(e) => updateConfigField('signalExpiryMinutes', parseInt(e.target.value))}
                        disabled={!editingFields.has('signalExpiryMinutes')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Signal validity duration</p>
                    </div>
                  </div>
                </div>
                
                {/* Save Button */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => loadConfiguration()}
                    disabled={configLoading || configSaving}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                  >
                    🔄 Reset
                  </button>
                  <button
                    onClick={() => setShowSaveConfirm(true)}
                    disabled={configSaving || configLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {configSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        💾 Save Configuration
                      </>
                    )}
                  </button>
                </div>
                
                </div>
                )}
                </>
                )}
              </div>
            )}
            
            {/* Save Confirmation Modal */}
            {showSaveConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full mb-4">
                      <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Confirm Configuration Save
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Are you sure you want to save these changes? This will update the active trading strategy configuration.
                    </p>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-left">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        <strong>⚠️ Impact:</strong> All systems (Signal Generator, Backtest, Bot) will use the new configuration immediately.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowSaveConfirm(false)}
                      disabled={configSaving}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveConfiguration}
                      disabled={configSaving}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {configSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          ✅ Confirm Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Backtest Tab */}
            {selectedTab === 'backtest' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                    🧪 Strategy Backtest
                  </h3>
                  <p className="text-sm text-purple-800 dark:text-purple-300">
                    Test the Futures Scalper strategy with historical data using the configuration from the Strategy Configuration tab.
                  </p>
                </div>
                
                {/* Sub-tabs: Run vs History */}
                <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setBacktestView('run')}
                    className={`px-6 py-3 font-medium transition-colors ${
                      backtestView === 'run'
                        ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    🚀 Run Backtest
                  </button>
                  <button
                    onClick={() => setBacktestView('history')}
                    className={`px-6 py-3 font-medium transition-colors ${
                      backtestView === 'history'
                        ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    📚 History ({historyResults.length})
                  </button>
                </div>
                
                {/* Run Backtest View */}
                {backtestView === 'run' && (
                <>
                
                {/* Configuration Summary */}
                {configData && (
                  <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                      <span>⚙️</span> Active Configuration
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700 dark:text-blue-400 font-medium">Trading Pairs:</span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {(configData.symbols || ['BTCUSDT']).map((symbol: string) => (
                            <span key={symbol} className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs font-semibold">
                              {symbol}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-blue-700 dark:text-blue-400 font-medium">Timeframes:</span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {backtestTimeframes.map((tf) => (
                            <span key={tf} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-semibold">
                              {tf}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                      💡 Backtest will use <strong>{(configData.symbols || ['BTCUSDT'])[0]}</strong> as primary pair with the timeframes selected below.
                    </p>
                  </div>
                )}
                
                {/* Timeframe Selector */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Select Timeframes (Multi-TF Strategy)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Select multiple timeframes for triple confirmation strategy. Minimum 1 timeframe required.
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'].map((tf) => {
                      const isSelected = backtestTimeframes.includes(tf);
                      return (
                        <label
                          key={tf}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition ${
                            isSelected
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBacktestTimeframes([...backtestTimeframes, tf]);
                              } else {
                                // Ensure at least 1 timeframe
                                if (backtestTimeframes.length > 1) {
                                  setBacktestTimeframes(backtestTimeframes.filter(t => t !== tf));
                                }
                              }
                            }}
                            className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                          />
                          <div className={`font-medium text-sm ${
                            isSelected
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {tf}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xs text-green-700 dark:text-green-300">
                      💡 <strong>Selected Timeframes:</strong> {backtestTimeframes.join(' + ')} 
                      {backtestTimeframes.length > 1 && ` (${backtestTimeframes.length}-way confirmation)`}
                    </p>
                  </div>
                </div>
                
                {/* Period Selector */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Select Backtest Period</h4>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <button
                      onClick={() => setBacktestPeriod('1m')}
                      className={`p-4 border-2 rounded-lg transition ${
                        backtestPeriod === '1m'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                      }`}
                    >
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">1 Month</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">~30 days of data</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">Expected: ~79% ROI</div>
                    </button>
                    
                    <button
                      onClick={() => setBacktestPeriod('2m')}
                      className={`p-4 border-2 rounded-lg transition ${
                        backtestPeriod === '2m'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                      }`}
                    >
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">2 Months</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">~60 days of data</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">Expected: ~96% ROI</div>
                    </button>
                    
                    <button
                      onClick={() => setBacktestPeriod('3m')}
                      className={`p-4 border-2 rounded-lg transition ${
                        backtestPeriod === '3m'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                      }`}
                    >
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">3 Months</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">~90 days of data</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">Expected: ~675% ROI</div>
                    </button>
                  </div>
                  
                  <button
                    onClick={handleRunBacktest}
                    disabled={backtestLoading}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {backtestLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {backtestProgress.total > 0 ? (
                          <>Running Backtest ({backtestProgress.current}/{backtestProgress.total})...</>
                        ) : (
                          <>Running Backtest ({backtestPeriod.toUpperCase()})...</>
                        )}
                      </>
                    ) : (
                      <>
                        🚀 Run Backtest ({backtestPeriod.toUpperCase()})
                      </>
                    )}
                  </button>
                  
                  {/* Progress Bar for Multi-Symbol */}
                  {backtestLoading && backtestProgress.total > 1 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Processing {(configData?.symbols || [])[backtestProgress.current - 1] || '...'}</span>
                        <span>{Math.round((backtestProgress.current / backtestProgress.total) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(backtestProgress.current / backtestProgress.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {error && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-300">
                      ❌ {error}
                    </div>
                  )}
                </div>
                
                {/* Symbol Tabs (Multi-Symbol Results) */}
                {Object.keys(multiSymbolResults).length > 1 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      📊 Select Trading Pair to View Results:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(multiSymbolResults).map((symbol) => {
                        const result = multiSymbolResults[symbol];
                        const hasError = result.error;
                        const isActive = activeSymbolTab === symbol;
                        
                        return (
                          <button
                            key={symbol}
                            onClick={() => {
                              setActiveSymbolTab(symbol);
                              setBacktestResults(result);
                              setTradePage(1); // Reset pagination
                            }}
                            className={`
                              px-4 py-2 rounded-lg font-medium text-sm transition-all
                              ${isActive 
                                ? 'bg-blue-500 text-white shadow-lg' 
                                : hasError
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }
                            `}
                          >
                            <span className="mr-2">{hasError ? '❌' : '✅'}</span>
                            {symbol.replace('USDT', '')}
                            {!hasError && result.roi && (
                              <span className={`ml-2 text-xs ${isActive ? 'text-white' : 'text-green-600 dark:text-green-400'}`}>
                                +{result.roi.toFixed(0)}%
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Comparison Summary */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(multiSymbolResults).map(([symbol, result]: [string, any]) => {
                          if (result.error) return null;
                          return (
                            <div key={symbol} className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                {symbol.replace('USDT', '')}
                              </div>
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                +{result.roi?.toFixed(0) || 0}%
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                {result.totalTrades || 0} trades
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Backtest Results */}
                {backtestResults && (
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                            ✅ Backtest Complete {Object.keys(multiSymbolResults).length > 0 && (
                              <span className="ml-2 px-2 py-1 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded text-xs">
                                {activeSymbolTab.replace('USDT', '')}
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-green-800 dark:text-green-300">
                            Strategy tested with {backtestResults.totalTrades} trades over {backtestResults.period}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-green-700 dark:text-green-400 mb-1">
                            Configuration Used:
                          </div>
                          <div className="px-3 py-1 bg-green-100 dark:bg-green-800 rounded-full text-xs font-medium text-green-800 dark:text-green-200">
                            ⚙️ Active Config from Configuration Tab
                          </div>
                          {configData && (
                            <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                              Risk: {(configData.riskPerTrade * 100).toFixed(1)}% | Leverage: {configData.leverage}x | SL: {(configData.stopLossPercent * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Performance Summary */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Initial Balance</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                          ${backtestResults.initialBalance?.toLocaleString() || '10,000'}
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Final Balance</div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                          ${backtestResults.finalBalance?.toLocaleString() || '0'}
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Profit</div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                          ${backtestResults.totalProfit?.toLocaleString() || '0'}
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">ROI</div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                          {backtestResults.roi?.toFixed(1) || '0'}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Trading Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Win Rate</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Total Trades:</span>
                            <span className="font-mono text-gray-900 dark:text-white">{backtestResults.totalTrades || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Winning:</span>
                            <span className="font-mono text-green-600 dark:text-green-400">{backtestResults.winningTrades || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Losing:</span>
                            <span className="font-mono text-red-600 dark:text-red-400">{backtestResults.losingTrades || 0}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Win Rate:</span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">
                              {backtestResults.winRate?.toFixed(1) || '0'}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Average Trades</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Avg Win:</span>
                            <span className="font-mono text-green-600 dark:text-green-400">
                              ${backtestResults.avgWin?.toFixed(2) || '0'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Avg Loss:</span>
                            <span className="font-mono text-red-600 dark:text-red-400">
                              ${backtestResults.avgLoss?.toFixed(2) || '0'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Largest Win:</span>
                            <span className="font-mono text-green-600 dark:text-green-400">
                              ${backtestResults.largestWin?.toFixed(2) || '0'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Largest Loss:</span>
                            <span className="font-mono text-red-600 dark:text-red-400">
                              ${backtestResults.largestLoss?.toFixed(2) || '0'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Performance</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Profit Factor:</span>
                            <span className="font-mono text-gray-900 dark:text-white">
                              {backtestResults.profitFactor?.toFixed(2) || '0'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Max Drawdown:</span>
                            <span className="font-mono text-red-600 dark:text-red-400">
                              {backtestResults.maxDrawdown?.toFixed(2) || '0'}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Sharpe Ratio:</span>
                            <span className="font-mono text-gray-900 dark:text-white">
                              {backtestResults.sharpeRatio?.toFixed(2) || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Recovery Factor:</span>
                            <span className="font-mono text-gray-900 dark:text-white">
                              {backtestResults.recoveryFactor?.toFixed(2) || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Monthly Breakdown */}
                    {backtestResults.monthlyBreakdown && backtestResults.monthlyBreakdown.length > 0 && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Monthly Performance</h4>
                        <div className="space-y-2">
                          {backtestResults.monthlyBreakdown.map((month: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white">{month.month}</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400 ml-3">
                                  {month.trades} trades
                                </span>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${
                                  month.profit >= 0 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {month.profit >= 0 ? '+' : ''}${month.profit.toFixed(2)}
                                </div>
                                <div className={`text-sm ${
                                  month.roi >= 0 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {month.roi >= 0 ? '+' : ''}{month.roi.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Strategy Configuration Used */}
                    {configData && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                          ⚙️ Configuration Parameters
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">
                            From Configuration Tab
                          </span>
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-blue-800 dark:text-blue-300">Risk per Trade: </span>
                            <span className="font-mono text-blue-900 dark:text-blue-200">{(configData.riskPerTrade * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-blue-800 dark:text-blue-300">Leverage: </span>
                            <span className="font-mono text-blue-900 dark:text-blue-200">{configData.leverage}x</span>
                          </div>
                          <div>
                            <span className="text-blue-800 dark:text-blue-300">Stop Loss: </span>
                            <span className="font-mono text-blue-900 dark:text-blue-200">{(configData.stopLossPercent * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-blue-800 dark:text-blue-300">Take Profit: </span>
                            <span className="font-mono text-blue-900 dark:text-blue-200">{(configData.takeProfitPercent * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-blue-800 dark:text-blue-300">Trailing Profit: </span>
                            <span className="font-mono text-blue-900 dark:text-blue-200">{(configData.trailProfitActivate * 100).toFixed(2)}%</span>
                          </div>
                          <div>
                            <span className="text-blue-800 dark:text-blue-300">Trailing Loss: </span>
                            <span className="font-mono text-blue-900 dark:text-blue-200">{(Math.abs(configData.trailLossActivate) * 100).toFixed(2)}%</span>
                          </div>
                          <div>
                            <span className="text-blue-800 dark:text-blue-300">RSI Range: </span>
                            <span className="font-mono text-blue-900 dark:text-blue-200">{configData.rsiMin}-{configData.rsiMax}</span>
                          </div>
                          <div>
                            <span className="text-blue-800 dark:text-blue-300">ADX Range: </span>
                            <span className="font-mono text-blue-900 dark:text-blue-200">{configData.adxMin}-{configData.adxMax}</span>
                          </div>
                          <div>
                            <span className="text-blue-800 dark:text-blue-300">Volume Filter: </span>
                            <span className="font-mono text-blue-900 dark:text-blue-200">{configData.volumeMin}x-{configData.volumeMax}x</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700 text-xs text-blue-700 dark:text-blue-400">
                          💡 These parameters are loaded from the active configuration in the Configuration tab. 
                          Edit and save configuration to test different strategies.
                        </div>
                      </div>
                    )}
                    
                    {/* Trade List Table */}
                    {backtestResults.trades && backtestResults.trades.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            📋 Trade History
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-normal">
                              {backtestResults.trades.length} Total Trades
                            </span>
                          </h4>
                        </div>
                        
                        {/* Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Token
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Type
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Entry
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Exit
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Size
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  PnL
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  PnL %
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Exit Type
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {backtestResults.trades
                                .slice((tradePage - 1) * tradesPerPage, tradePage * tradesPerPage)
                                .map((trade: any, index: number) => {
                                  // Format time: "2025-11-06 14:23:15" or full ISO if available
                                  let formattedTime = 'N/A';
                                  if (trade.time && trade.time !== 'N/A') {
                                    try {
                                      // Try to parse and format the time
                                      const timeStr = trade.time.replace(' ', 'T');
                                      const date = new Date(timeStr);
                                      if (!isNaN(date.getTime())) {
                                        formattedTime = date.toISOString()
                                          .replace('T', ' ')
                                          .substring(0, 19); // "2025-11-06 14:23:15"
                                      } else {
                                        formattedTime = trade.time.substring(0, 19);
                                      }
                                    } catch (e) {
                                      formattedTime = trade.time.substring(0, 19) || 'N/A';
                                    }
                                  }
                                  
                                  return (
                                <tr key={trade.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {trade.icon} #{trade.id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600 dark:text-orange-400">
                                    {activeSymbolTab.replace('USDT', '')}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400 font-mono">
                                    {formattedTime}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      trade.type === 'BUY' || trade.type === 'LONG'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    }`}>
                                      {trade.type}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900 dark:text-white">
                                    ${trade.entryPrice?.toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900 dark:text-white">
                                    ${trade.exitPrice?.toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-600 dark:text-gray-400">
                                    {trade.size?.toFixed(6)}
                                  </td>
                                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-semibold ${
                                    (trade.pnl || 0) >= 0 
                                      ? 'text-green-600 dark:text-green-400' 
                                      : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    ${trade.pnl?.toFixed(2)}
                                  </td>
                                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono ${
                                    (trade.pnlPct || 0) >= 0 
                                      ? 'text-green-600 dark:text-green-400' 
                                      : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {trade.pnlPct?.toFixed(2)}%
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                                    {trade.exitType}
                                  </td>
                                </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Pagination */}
                        {backtestResults.trades.length > tradesPerPage && (
                          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Showing {((tradePage - 1) * tradesPerPage) + 1} to {Math.min(tradePage * tradesPerPage, backtestResults.trades.length)} of {backtestResults.trades.length} trades
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setTradePage(Math.max(1, tradePage - 1))}
                                disabled={tradePage === 1}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                ← Previous
                              </button>
                              <div className="flex items-center gap-2">
                                {Array.from({ length: Math.ceil(backtestResults.trades.length / tradesPerPage) }, (_, i) => i + 1)
                                  .filter(page => {
                                    // Show first, last, current, and adjacent pages
                                    return page === 1 || 
                                           page === Math.ceil(backtestResults.trades.length / tradesPerPage) || 
                                           Math.abs(page - tradePage) <= 1;
                                  })
                                  .map((page, index, array) => (
                                    <Fragment key={page}>
                                      {index > 0 && array[index - 1] !== page - 1 && (
                                        <span className="text-gray-400">...</span>
                                      )}
                                      <button
                                        onClick={() => setTradePage(page)}
                                        className={`px-3 py-1 rounded text-sm transition ${
                                          tradePage === page
                                            ? 'bg-blue-600 text-white'
                                            : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                      >
                                        {page}
                                      </button>
                                    </Fragment>
                                  ))}
                              </div>
                              <button
                                onClick={() => setTradePage(Math.min(Math.ceil(backtestResults.trades.length / tradesPerPage), tradePage + 1))}
                                disabled={tradePage === Math.ceil(backtestResults.trades.length / tradesPerPage)}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                Next →
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Instructions */}
                {!backtestResults && !backtestLoading && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Ready to Test Strategy
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                      Select a period above and click &quot;Run Backtest&quot; to test the Futures Scalper strategy 
                      with historical Bitcoin (BTCUSDT) data. The backtest will use the same configuration 
                      shown in the Configuration tab.
                    </p>
                  </div>
                )}
                
                </>
                )}
                
                {/* History View */}
                {backtestView === 'history' && (
                  <div className="space-y-6">
                    {historyLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                      </div>
                    ) : historyResults.length === 0 ? (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
                        <div className="text-6xl mb-4">📚</div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          No History Yet
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Run your first backtest to start building history
                        </p>
                        <button
                          onClick={() => setBacktestView('run')}
                          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                          Run First Backtest
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Summary Stats */}
                        {historySummary && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                              <div className="text-sm text-gray-600 dark:text-gray-400">Total Runs (7d)</div>
                              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {historySummary.totalRuns}
                              </div>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                              <div className="text-sm text-gray-600 dark:text-gray-400">Avg ROI</div>
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                +{historySummary.avgROI.toFixed(0)}%
                              </div>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                              <div className="text-sm text-gray-600 dark:text-gray-400">Best ROI</div>
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                +{historySummary.bestROI.toFixed(0)}%
                              </div>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Win Rate</div>
                              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                                {historySummary.avgWinRate.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* History List */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              Backtest History
                            </h4>
                          </div>
                          
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {historyResults.slice((backtestHistoryPage - 1) * backtestHistoryPerPage, backtestHistoryPage * backtestHistoryPerPage).map((result) => (
                              <div
                                key={result._id}
                                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition"
                                onClick={() => setSelectedHistoryResult(result)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className="text-2xl">{result.symbol === 'BTCUSDT' ? '₿' : result.symbol === 'ETHUSDT' ? 'Ξ' : '🪙'}</span>
                                      <div>
                                        <h5 className="font-semibold text-gray-900 dark:text-white">
                                          {result.symbol.replace('USDT', '')} - {result.period.toUpperCase()}
                                        </h5>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {new Date(result.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-4 text-sm">
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">ROI:</span>
                                        <span className="ml-1 font-semibold text-green-600 dark:text-green-400">
                                          +{result.roi.toFixed(0)}%
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">Trades:</span>
                                        <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                                          {result.totalTrades}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">Win Rate:</span>
                                        <span className="ml-1 font-semibold text-purple-600 dark:text-purple-400">
                                          {result.winRate.toFixed(1)}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Config</div>
                                    <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full text-xs font-medium text-blue-800 dark:text-blue-200">
                                      {result.configName || 'default'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Pagination for Backtest History */}
                          {historyResults.length > backtestHistoryPerPage && (
                            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Showing {((backtestHistoryPage - 1) * backtestHistoryPerPage) + 1} - {Math.min(backtestHistoryPage * backtestHistoryPerPage, historyResults.length)} of {historyResults.length} results
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setBacktestHistoryPage(p => Math.max(1, p - 1))}
                                  disabled={backtestHistoryPage === 1}
                                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Previous
                                </button>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Page {backtestHistoryPage} of {Math.ceil(historyResults.length / backtestHistoryPerPage)}
                                </span>
                                <button
                                  onClick={() => setBacktestHistoryPage(p => Math.min(Math.ceil(historyResults.length / backtestHistoryPerPage), p + 1))}
                                  disabled={backtestHistoryPage >= Math.ceil(historyResults.length / backtestHistoryPerPage)}
                                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Analytics Tab */}
        {selectedTab === 'analytics' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span>📊</span> Performance Analytics & Insights
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Analyze backtest performance trends, compare strategies, and discover patterns to optimize your trading strategy.
              </p>
            </div>
            
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex gap-4 items-center">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Time Period</label>
                  <select
                    value={analyticsPeriod}
                    onChange={(e) => {
                      const period = parseInt(e.target.value);
                      setAnalyticsPeriod(period);
                      fetchAnalytics(period, analyticsSymbol);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={7}>Last 7 Days</option>
                    <option value={14}>Last 14 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={60}>Last 60 Days</option>
                    <option value={90}>Last 90 Days</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Symbol Filter</label>
                  <select
                    value={analyticsSymbol}
                    onChange={(e) => {
                      setAnalyticsSymbol(e.target.value);
                      fetchAnalytics(analyticsPeriod, e.target.value);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Symbols</option>
                    <option value="BTCUSDT">BTC</option>
                    <option value="ETHUSDT">ETH</option>
                    <option value="BNBUSDT">BNB</option>
                    <option value="SOLUSDT">SOL</option>
                  </select>
                </div>
                
                <button
                  onClick={() => fetchAnalytics()}
                  disabled={analyticsLoading}
                  className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {analyticsLoading ? '🔄 Loading...' : '🔄 Refresh'}
                </button>
              </div>
            </div>
            
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : !analyticsData ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  No Analytics Data
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Run some backtests first to generate analytics
                </p>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg shadow p-4 border border-green-200 dark:border-green-800">
                    <div className="text-xs text-green-700 dark:text-green-400 mb-1">Average ROI</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      +{analyticsData.summary?.avgROI?.toFixed(0) || '0'}%
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                      Best: +{analyticsData.summary?.bestROI?.toFixed(0) || '0'}%
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow p-4 border border-blue-200 dark:border-blue-800">
                    <div className="text-xs text-blue-700 dark:text-blue-400 mb-1">Avg Win Rate</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {analyticsData.summary?.avgWinRate?.toFixed(1) || '0'}%
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                      {analyticsData.summary?.totalBacktests || 0} tests
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg shadow p-4 border border-purple-200 dark:border-purple-800">
                    <div className="text-xs text-purple-700 dark:text-purple-400 mb-1">Profit Factor</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {analyticsData.summary?.avgProfitFactor?.toFixed(2) || '0'}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                      {analyticsData.summary?.totalTrades || 0} trades
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg shadow p-4 border border-orange-200 dark:border-orange-800">
                    <div className="text-xs text-orange-700 dark:text-orange-400 mb-1">Risk/Reward</div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {analyticsData.summary?.avgRiskReward?.toFixed(2) || '0'}:1
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                      Consistency: {analyticsData.summary?.roiConsistency?.toFixed(0) || '0'}
                    </div>
                  </div>
                </div>
                
                {/* AI Insights */}
                {analyticsData.insights && analyticsData.insights.length > 0 && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-4 flex items-center gap-2">
                      <span>🤖</span> AI-Powered Insights
                    </h4>
                    <div className="space-y-2">
                      {analyticsData.insights.map((insight: string, index: number) => (
                        <div key={index} className="text-sm text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
                          <span className="mt-0.5">•</span>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Symbol Comparison */}
                {analyticsData.symbolComparison && analyticsData.symbolComparison.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        📈 Symbol Performance Comparison
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Symbol</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Avg ROI</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Best</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Worst</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Win Rate</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tests</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Trades</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {analyticsData.symbolComparison.map((symbol: any, index: number) => (
                            <tr key={symbol._id} className={index === 0 ? 'bg-green-50 dark:bg-green-900/10' : ''}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {index === 0 && <span>🏆</span>}
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {symbol._id.replace('USDT', '')}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  +{symbol.avgROI.toFixed(0)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 dark:text-green-400">
                                +{symbol.bestROI.toFixed(0)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 dark:text-red-400">
                                +{symbol.worstROI.toFixed(0)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                                {symbol.avgWinRate.toFixed(1)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-400">
                                {symbol.totalRuns}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-400">
                                {symbol.totalTrades}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Top Performers */}
                {analyticsData.topPerformers && analyticsData.topPerformers.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                      🌟 Top 5 Best Backtests
                    </h4>
                    <div className="space-y-3">
                      {analyticsData.topPerformers.map((result: any, index: number) => (
                        <div key={result._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}</span>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {result.symbol.replace('USDT', '')} - {result.period.toUpperCase()}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(result.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600 dark:text-green-400">
                              +{result.roi.toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {result.totalTrades} trades
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Exit Pattern Analysis */}
                {analyticsData.patterns && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                      🎯 Exit Pattern Analysis
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {analyticsData.patterns.exitPatterns.takeProfit}
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300 mt-1">Take Profit</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {analyticsData.patterns.exitPatterns.stopLoss}
                        </div>
                        <div className="text-xs text-red-700 dark:text-red-300 mt-1">Stop Loss</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {analyticsData.patterns.exitPatterns.trailingProfit}
                        </div>
                        <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">Trail Profit</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {analyticsData.patterns.exitPatterns.trailingLoss}
                        </div>
                        <div className="text-xs text-orange-700 dark:text-orange-300 mt-1">Trail Loss</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {analyticsData.patterns.exitPatterns.emergencyExit}
                        </div>
                        <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">Emergency</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* History Detail Modal */}
        {selectedHistoryResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-2xl">{selectedHistoryResult.symbol === 'BTCUSDT' ? '₿' : selectedHistoryResult.symbol === 'ETHUSDT' ? 'Ξ' : '🪙'}</span>
                      {selectedHistoryResult.symbol.replace('USDT', '')} Backtest Details
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(selectedHistoryResult.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedHistoryResult(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Performance Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-xs text-gray-600 dark:text-gray-400">ROI</div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      +{selectedHistoryResult.roi.toFixed(0)}%
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Win Rate</div>
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {selectedHistoryResult.winRate.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Trades</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedHistoryResult.totalTrades}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Profit Factor</div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedHistoryResult.profitFactor.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                {/* Sample Trades for Learning */}
                {selectedHistoryResult.sampleTrades && Object.keys(selectedHistoryResult.sampleTrades).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <span>📚</span> Educational Trade Samples
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Best Win */}
                      {selectedHistoryResult.sampleTrades.bestWin && (
                        <div className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold text-green-900 dark:text-green-200 flex items-center gap-2">
                              <span>✅</span> Best Win
                            </div>
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              +${selectedHistoryResult.sampleTrades.bestWin.pnl.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-green-700 dark:text-green-300">Entry:</span>
                              <span className="font-mono text-green-900 dark:text-green-100">${selectedHistoryResult.sampleTrades.bestWin.entry.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700 dark:text-green-300">Exit:</span>
                              <span className="font-mono text-green-900 dark:text-green-100">${selectedHistoryResult.sampleTrades.bestWin.exit.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700 dark:text-green-300">Type:</span>
                              <span className="font-semibold text-green-900 dark:text-green-100">{selectedHistoryResult.sampleTrades.bestWin.type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700 dark:text-green-300">Exit:</span>
                              <span className="text-xs text-green-900 dark:text-green-100">{selectedHistoryResult.sampleTrades.bestWin.exitType}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Average Win */}
                      {selectedHistoryResult.sampleTrades.avgWin && (
                        <div className="border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                              <span>📊</span> Average Win
                            </div>
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              +${selectedHistoryResult.sampleTrades.avgWin.pnl.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-sm space-y-1 text-green-700 dark:text-green-300">
                            <div className="flex justify-between">
                              <span>Entry:</span>
                              <span className="font-mono">${selectedHistoryResult.sampleTrades.avgWin.entry.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Exit:</span>
                              <span className="font-mono">${selectedHistoryResult.sampleTrades.avgWin.exit.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Worst Loss */}
                      {selectedHistoryResult.sampleTrades.worstLoss && (
                        <div className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold text-red-900 dark:text-red-200 flex items-center gap-2">
                              <span>❌</span> Worst Loss
                            </div>
                            <div className="text-lg font-bold text-red-600 dark:text-red-400">
                              ${selectedHistoryResult.sampleTrades.worstLoss.pnl.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-red-700 dark:text-red-300">Entry:</span>
                              <span className="font-mono text-red-900 dark:text-red-100">${selectedHistoryResult.sampleTrades.worstLoss.entry.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-700 dark:text-red-300">Exit:</span>
                              <span className="font-mono text-red-900 dark:text-red-100">${selectedHistoryResult.sampleTrades.worstLoss.exit.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-700 dark:text-red-300">Type:</span>
                              <span className="font-semibold text-red-900 dark:text-red-100">{selectedHistoryResult.sampleTrades.worstLoss.type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-700 dark:text-red-300">Exit:</span>
                              <span className="text-xs text-red-900 dark:text-red-100">{selectedHistoryResult.sampleTrades.worstLoss.exitType}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Average Loss */}
                      {selectedHistoryResult.sampleTrades.avgLoss && (
                        <div className="border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/10 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-2">
                              <span>📊</span> Average Loss
                            </div>
                            <div className="text-lg font-bold text-red-600 dark:text-red-400">
                              ${selectedHistoryResult.sampleTrades.avgLoss.pnl.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-sm space-y-1 text-red-700 dark:text-red-300">
                            <div className="flex justify-between">
                              <span>Entry:</span>
                              <span className="font-mono">${selectedHistoryResult.sampleTrades.avgLoss.entry.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Exit:</span>
                              <span className="font-mono">${selectedHistoryResult.sampleTrades.avgLoss.exit.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Learning Insights */}
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h5 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                        <span>💡</span> Key Insights
                      </h5>
                      <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                        <div>• <strong>Risk/Reward Ratio:</strong> {selectedHistoryResult.sampleTrades.bestWin && selectedHistoryResult.sampleTrades.worstLoss ? 
                          `${(Math.abs(selectedHistoryResult.sampleTrades.bestWin.pnl / selectedHistoryResult.sampleTrades.worstLoss.pnl)).toFixed(2)}:1` : 'N/A'
                        }</div>
                        <div>• <strong>Largest Win:</strong> ${selectedHistoryResult.largestWin.toFixed(2)}</div>
                        <div>• <strong>Largest Loss:</strong> ${selectedHistoryResult.largestLoss.toFixed(2)}</div>
                        <div>• <strong>Average Win:</strong> ${selectedHistoryResult.avgWin.toFixed(2)} ({selectedHistoryResult.avgWinPercent.toFixed(2)}%)</div>
                        <div>• <strong>Average Loss:</strong> ${selectedHistoryResult.avgLoss.toFixed(2)} ({selectedHistoryResult.avgLossPercent.toFixed(2)}%)</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setSelectedHistoryResult(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => deleteBacktestResult(selectedHistoryResult._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* ========== LEARNING CENTER TAB ========== */}
        {selectedTab === 'learning' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  🎓 Learning Center - Pattern Analysis
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Discover winning patterns, analyze failures, and improve your trading strategy through data-driven insights
                </p>
              </div>
              <button
                onClick={() => fetchLearningData()}
                disabled={learningLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {learningLoading ? '⏳ Loading...' : '🔄 Refresh'}
              </button>
            </div>
            
            {/* Error state */}
            {learningError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-300">❌ {learningError}</p>
              </div>
            )}
            
            {/* Loading state */}
            {learningLoading && !learningData && (
              <div className="text-center py-12">
                <div className="animate-spin text-6xl mb-4">⏳</div>
                <p className="text-gray-600 dark:text-gray-400">Analyzing trade patterns...</p>
              </div>
            )}
            
            {/* Content */}
            {learningData && (
              <div className="space-y-8">
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Total Backtests Analyzed
                    </div>
                    <div className="mt-2 text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {learningData.summary?.totalBacktests || 0}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-6 border border-green-200 dark:border-green-800">
                    <div className="text-sm font-medium text-green-800 dark:text-green-300">
                      Winning Trades Analyzed
                    </div>
                    <div className="mt-2 text-3xl font-bold text-green-900 dark:text-green-100">
                      {learningData.summary?.winTradesAnalyzed || 0}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-lg p-6 border border-red-200 dark:border-red-800">
                    <div className="text-sm font-medium text-red-800 dark:text-red-300">
                      Losing Trades Analyzed
                    </div>
                    <div className="mt-2 text-3xl font-bold text-red-900 dark:text-red-100">
                      {learningData.summary?.lossTradesAnalyzed || 0}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
                    <div className="text-sm font-medium text-purple-800 dark:text-purple-300">
                      Average ROI
                    </div>
                    <div className="mt-2 text-3xl font-bold text-purple-900 dark:text-purple-100">
                      {learningData.summary?.avgROI?.toFixed(1) || 0}%
                    </div>
                  </div>
                </div>
                
                {/* Educational Lessons */}
                {learningData.lessons && learningData.lessons.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="text-2xl mr-2">💡</span>
                      Key Learnings & Insights
                    </h3>
                    <div className="space-y-3">
                      {learningData.lessons.slice((lessonsPage - 1) * lessonsPerPage, lessonsPage * lessonsPerPage).map((lesson: string, idx: number) => (
                        <div 
                          key={idx}
                          className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                          <span className="text-2xl mt-0.5">
                            {lesson.includes('✅') ? '✅' : 
                             lesson.includes('⚠️') ? '⚠️' : 
                             lesson.includes('🚨') ? '🚨' :
                             lesson.includes('🎯') ? '🎯' :
                             lesson.includes('📈') ? '📈' :
                             lesson.includes('📉') ? '📉' :
                             lesson.includes('💰') ? '💰' :
                             lesson.includes('💪') ? '💪' :
                             lesson.includes('🚀') ? '🚀' : '📚'}
                          </span>
                          <p className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed">
                            {lesson.replace(/[✅⚠️🚨🎯📈📉💰💪🚀]/g, '').trim()}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Pagination for Learning Lessons */}
                    {learningData.lessons.length > lessonsPerPage && (
                      <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Showing {((lessonsPage - 1) * lessonsPerPage) + 1} - {Math.min(lessonsPage * lessonsPerPage, learningData.lessons.length)} of {learningData.lessons.length} lessons
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setLessonsPage(p => Math.max(1, p - 1))}
                            disabled={lessonsPage === 1}
                            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {lessonsPage} of {Math.ceil(learningData.lessons.length / lessonsPerPage)}
                          </span>
                          <button
                            onClick={() => setLessonsPage(p => Math.min(Math.ceil(learningData.lessons.length / lessonsPerPage), p + 1))}
                            disabled={lessonsPage >= Math.ceil(learningData.lessons.length / lessonsPerPage)}
                            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Pattern Analysis Grid */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Winning Patterns */}
                  {learningData.winPatterns && Object.keys(learningData.winPatterns).length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                      <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4 flex items-center">
                        <span className="text-2xl mr-2">✅</span>
                        Winning Trade Patterns
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Exit Type Distribution */}
                        {learningData.winPatterns.exitTypes && (
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                              📊 Exit Methods (Winners)
                            </h4>
                            <div className="space-y-2">
                              {Object.entries(learningData.winPatterns.exitTypes).map(([type, count]) => (
                                <div key={type} className="flex items-center justify-between">
                                  <span className="text-gray-700 dark:text-gray-300">{type}</span>
                                  <span className="font-bold text-green-600 dark:text-green-400">
                                    {String(count)} trades
                                  </span>
                                </div>
                              ))}
                            </div>
                            {learningData.winPatterns.mostCommonExit && (
                              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  <strong>Most Reliable:</strong> {learningData.winPatterns.mostCommonExit}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Direction Preference */}
                        {learningData.winPatterns.directions && (
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                              🎯 Direction Analysis (Winners)
                            </h4>
                            <div className="space-y-2">
                              {Object.entries(learningData.winPatterns.directions).map(([dir, count]) => (
                                <div key={dir} className="flex items-center justify-between">
                                  <span className="text-gray-700 dark:text-gray-300">{dir}</span>
                                  <span className="font-bold text-green-600 dark:text-green-400">
                                    {String(count)} trades
                                  </span>
                                </div>
                              ))}
                            </div>
                            {learningData.winPatterns.preferredDirection && (
                              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  <strong>Best Direction:</strong> {learningData.winPatterns.preferredDirection}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Profit Stats */}
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                            💰 Profit Statistics
                          </h4>
                          <div className="space-y-2">
                            {learningData.winPatterns.avgProfit && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Average Profit</span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  ${learningData.winPatterns.avgProfit.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {learningData.winPatterns.avgProfitPercent && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Average Gain %</span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  {learningData.winPatterns.avgProfitPercent.toFixed(2)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Position Sizing */}
                        {(learningData.winPatterns.largePositions > 0 || learningData.winPatterns.smallPositions > 0) && (
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                              📏 Position Sizing (Winners)
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Large Positions</span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  {learningData.winPatterns.largePositions}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Small Positions</span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                  {learningData.winPatterns.smallPositions}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Losing Patterns */}
                  {learningData.lossPatterns && Object.keys(learningData.lossPatterns).length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                      <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center">
                        <span className="text-2xl mr-2">❌</span>
                        Losing Trade Patterns
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Exit Type Distribution */}
                        {learningData.lossPatterns.exitTypes && (
                          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                              📊 Exit Methods (Losers)
                            </h4>
                            <div className="space-y-2">
                              {Object.entries(learningData.lossPatterns.exitTypes).map(([type, count]) => (
                                <div key={type} className="flex items-center justify-between">
                                  <span className="text-gray-700 dark:text-gray-300">{type}</span>
                                  <span className="font-bold text-red-600 dark:text-red-400">
                                    {String(count)} trades
                                  </span>
                                </div>
                              ))}
                            </div>
                            {learningData.lossPatterns.mostCommonExit && (
                              <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  <strong>Most Common Exit:</strong> {learningData.lossPatterns.mostCommonExit}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Direction Issues */}
                        {learningData.lossPatterns.directions && (
                          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                              🎯 Direction Analysis (Losers)
                            </h4>
                            <div className="space-y-2">
                              {Object.entries(learningData.lossPatterns.directions).map(([dir, count]) => (
                                <div key={dir} className="flex items-center justify-between">
                                  <span className="text-gray-700 dark:text-gray-300">{dir}</span>
                                  <span className="font-bold text-red-600 dark:text-red-400">
                                    {String(count)} trades
                                  </span>
                                </div>
                              ))}
                            </div>
                            {learningData.lossPatterns.problematicDirection && (
                              <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  <strong>Problem Direction:</strong> {learningData.lossPatterns.problematicDirection}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Loss Stats */}
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                            💸 Loss Statistics
                          </h4>
                          <div className="space-y-2">
                            {learningData.lossPatterns.avgLoss && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Average Loss</span>
                                <span className="font-bold text-red-600 dark:text-red-400">
                                  ${learningData.lossPatterns.avgLoss.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {learningData.lossPatterns.avgLossPercent && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Average Loss %</span>
                                <span className="font-bold text-red-600 dark:text-red-400">
                                  {Math.abs(learningData.lossPatterns.avgLossPercent).toFixed(2)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Risk Warnings */}
                        {learningData.lossPatterns.oversizedTrades > 0 && (
                          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-600">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                              <span className="mr-2">🚨</span>
                              Risk Warning
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>{learningData.lossPatterns.oversizedTrades}</strong> oversized trades detected in losses.
                              Maintain consistent position sizing to limit risk exposure.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Risk Management Insights */}
                {learningData.riskInsights && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold text-orange-600 dark:text-orange-400 mb-4 flex items-center">
                      <span className="text-2xl mr-2">🛡️</span>
                      Risk Management Analysis
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {learningData.riskInsights.avgRiskReward && (
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <div className="text-sm font-medium text-orange-800 dark:text-orange-300">
                            Average Risk/Reward Ratio
                          </div>
                          <div className="mt-2 text-3xl font-bold text-orange-900 dark:text-orange-100">
                            {learningData.riskInsights.avgRiskReward.toFixed(2)}:1
                          </div>
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                            {learningData.riskInsights.avgRiskReward >= 2 ? '✅ Excellent' : 
                             learningData.riskInsights.avgRiskReward >= 1.5 ? '✅ Good' : 
                             '⚠️ Needs Improvement'}
                          </div>
                        </div>
                      )}
                      
                      {learningData.riskInsights.avgWinSize && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-sm font-medium text-green-800 dark:text-green-300">
                            Average Win Size
                          </div>
                          <div className="mt-2 text-3xl font-bold text-green-900 dark:text-green-100">
                            ${learningData.riskInsights.avgWinSize.toFixed(2)}
                          </div>
                        </div>
                      )}
                      
                      {learningData.riskInsights.avgLossSize && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="text-sm font-medium text-red-800 dark:text-red-300">
                            Average Loss Size
                          </div>
                          <div className="mt-2 text-3xl font-bold text-red-900 dark:text-red-100">
                            ${Math.abs(learningData.riskInsights.avgLossSize).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {learningData.riskInsights.goodRiskRewardPercent !== undefined && (
                      <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>{learningData.riskInsights.goodRiskRewardPercent.toFixed(1)}%</strong> of your backtests
                          ({learningData.riskInsights.goodRiskRewardCount} out of {learningData.summary?.totalBacktests || 0})
                          have good risk/reward ratios (≥2:1)
                        </p>
                        {learningData.riskInsights.riskConsistency && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <strong>Risk Consistency:</strong> {learningData.riskInsights.riskConsistency}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Empty state */}
            {!learningLoading && !learningData && !learningError && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎓</div>
                <p className="text-gray-600 dark:text-gray-400">No learning data available yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Run backtests to generate pattern analysis and educational insights
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

