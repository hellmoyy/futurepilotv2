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

import { useState, useEffect } from 'react';

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
  const [selectedTab, setSelectedTab] = useState<'active' | 'history' | 'config' | 'backtest'>('active');
  const [sseConnected, setSseConnected] = useState(false);
  
  // Backtest state
  const [backtestPeriod, setBacktestPeriod] = useState<'1m' | '2m' | '3m'>('3m');
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [backtestResults, setBacktestResults] = useState<any>(null);
  
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
      const res = await fetch('/api/signal-center/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
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
    
    try {
      console.log(`🧪 Running backtest for ${backtestPeriod}...`);
      const res = await fetch('/api/backtest/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: 'BTCUSDT',
          period: backtestPeriod,
          balance: 10000,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        console.log('✅ Backtest completed:', data.results);
        setBacktestResults(data.results);
      } else {
        setError(data.error || 'Failed to run backtest');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBacktestLoading(false);
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
                  <div className="space-y-4">
                    {activeSignals.map((signal) => (
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
                  <div className="space-y-3">
                    {signalHistory.map((signal) => (
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
                        Running Backtest...
                      </>
                    ) : (
                      <>
                        🚀 Run Backtest ({backtestPeriod.toUpperCase()})
                      </>
                    )}
                  </button>
                  
                  {error && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-300">
                      ❌ {error}
                    </div>
                  )}
                </div>
                
                {/* Backtest Results */}
                {backtestResults && (
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                        ✅ Backtest Complete
                      </h3>
                      <p className="text-sm text-green-800 dark:text-green-300">
                        Strategy tested with {backtestResults.totalTrades} trades over {backtestResults.period}
                      </p>
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
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                        ⚙️ Configuration Used
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-blue-800 dark:text-blue-300">Risk per Trade: </span>
                          <span className="font-mono text-blue-900 dark:text-blue-200">2%</span>
                        </div>
                        <div>
                          <span className="text-blue-800 dark:text-blue-300">Leverage: </span>
                          <span className="font-mono text-blue-900 dark:text-blue-200">10x</span>
                        </div>
                        <div>
                          <span className="text-blue-800 dark:text-blue-300">Stop Loss: </span>
                          <span className="font-mono text-blue-900 dark:text-blue-200">0.8%</span>
                        </div>
                      </div>
                    </div>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
