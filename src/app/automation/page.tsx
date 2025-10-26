/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Interface for Trading Bot Configuration from database
interface TradingBotConfig {
  botId: number;
  name: string;
  icon: string;
  description: string;
  risk: string;
  riskColor: string;
  winRate: string;
  avgProfit: string;
  recommended: boolean;
  isActive: boolean;
  defaultSettings: {
    leverage: number;
    stopLoss: number;
    takeProfit: number;
  };
  supportedCurrencies: string[];
  features?: any;
}

export default function AutomationPage() {
  const { data: session } = useSession();
  const [tradingBots, setTradingBots] = useState<TradingBotConfig[]>([]);
  const [loadingBots, setLoadingBots] = useState(true);
  const [activeBots, setActiveBots] = useState<number[]>([]);
  const [botInstances, setBotInstances] = useState<any[]>([]);
  const [exchangeConnections, setExchangeConnections] = useState<any[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedBotForSettings, setSelectedBotForSettings] = useState<any>(null);
  const [botSettings, setBotSettings] = useState<{[key: number]: any}>({});
  const [expandedSettings, setExpandedSettings] = useState<{[key: number]: boolean}>({});

  // Fetch trading bot configurations from database
  const fetchTradingBots = useCallback(async () => {
    try {
      setLoadingBots(true);
      const response = await fetch('/api/trading-bots?isActive=true');
      if (response.ok) {
        const data = await response.json();
        setTradingBots(data.bots || []);
      } else {
        console.error('Failed to fetch trading bots');
      }
    } catch (error) {
      console.error('Error fetching trading bots:', error);
    } finally {
      setLoadingBots(false);
    }
  }, []);

  // Load trading bots on mount
  useEffect(() => {
    fetchTradingBots();
  }, [fetchTradingBots]);

  // Initialize bot settings with default values and fetch from database
  useEffect(() => {
    if (tradingBots.length === 0) return; // Wait for bots to load
    
    const initializeSettings = async () => {
      // Set default values first with new Tier 1 features
      const defaultSettings: {[key: number]: any} = {};
      tradingBots.forEach(bot => {
        defaultSettings[bot.botId] = {
          leverage: bot.defaultSettings.leverage,
          stopLoss: bot.defaultSettings.stopLoss,
          takeProfit: bot.defaultSettings.takeProfit,
          currency: bot.supportedCurrencies[0] || 'BTCUSDT', // Default to first currency
          positionSize: 10, // % of balance per trade
          maxDailyLoss: 100, // USDT
          // Tier 1 - Critical Features
          trailingStopLoss: {
            enabled: false,
            distance: 2 // % trailing distance
          },
          maxPositionSize: 100, // USDT
          maxConcurrentPositions: 3,
          maxDailyTrades: 10,
          // Tier 2 - Important Features
          breakEvenStop: {
            enabled: false,
            triggerProfit: 2 // % profit to trigger break even
          },
          partialTakeProfit: {
            enabled: false,
            levels: [
              { profit: 3, closePercent: 50 },
              { profit: 6, closePercent: 50 }
            ]
          }
        };
      });
      setBotSettings(defaultSettings);

      // Then fetch saved settings from database
      try {
        const response = await fetch('/api/bots/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.settings.length > 0) {
            const savedSettings: {[key: number]: any} = { ...defaultSettings };
            data.settings.forEach((setting: any) => {
              savedSettings[setting.botId] = {
                leverage: setting.leverage,
                stopLoss: setting.stopLoss,
                takeProfit: setting.takeProfit,
                currency: setting.currency || defaultSettings[setting.botId].currency,
                positionSize: setting.positionSize || defaultSettings[setting.botId].positionSize,
                maxDailyLoss: setting.maxDailyLoss || defaultSettings[setting.botId].maxDailyLoss,
                // Tier 1 features from database
                trailingStopLoss: setting.trailingStopLoss || defaultSettings[setting.botId].trailingStopLoss,
                maxPositionSize: setting.maxPositionSize || defaultSettings[setting.botId].maxPositionSize,
                maxConcurrentPositions: setting.maxConcurrentPositions || defaultSettings[setting.botId].maxConcurrentPositions,
                maxDailyTrades: setting.maxDailyTrades || defaultSettings[setting.botId].maxDailyTrades,
                // Tier 2 features from database
                breakEvenStop: setting.breakEvenStop || defaultSettings[setting.botId].breakEvenStop,
                partialTakeProfit: setting.partialTakeProfit || defaultSettings[setting.botId].partialTakeProfit
              };
            });
            setBotSettings(savedSettings);
          }
        }
      } catch (error) {
        console.error('Error fetching bot settings:', error);
      }
    };

    initializeSettings();
  }, [tradingBots]);

  const fetchBotInstances = useCallback(async () => {
    try {
      const response = await fetch('/api/bots');
      if (response.ok) {
        const data = await response.json();
        const bots = data.bots || [];
        setBotInstances(bots);
        
        // Update active bots list
        const active = bots
          .filter((bot: any) => bot.status === 'ACTIVE')
          .map((bot: any) => bot.botId);
        setActiveBots(active);
      }
    } catch (error) {
      console.error('Error fetching bot instances:', error);
    }
  }, []);

  const fetchExchangeConnections = useCallback(async () => {
    try {
      const response = await fetch('/api/exchange/connections');
      if (response.ok) {
        const data = await response.json();
        setExchangeConnections(data.connections || []);
        
        // Auto-select first exchange if available
        if (data.connections && data.connections.length > 0 && !selectedExchange) {
          setSelectedExchange(data.connections[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching exchange connections:', error);
    }
  }, [selectedExchange]);

  // Fetch active bot instances and exchange connections
  useEffect(() => {
    fetchBotInstances();
    fetchExchangeConnections();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetchBotInstances();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchBotInstances, fetchExchangeConnections]);

  const toggleBot = async (botId: number) => {
    if (loading) return;
    
    setLoading(true);
    setError('');

    try {
      const isActive = activeBots.includes(botId);
      
      if (isActive) {
        // Stop bot
        const botInstance = botInstances.find(b => b.botId === botId && b.status === 'ACTIVE');
        if (botInstance) {
          const response = await fetch(`/api/bots/${botInstance._id}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to stop bot');
          }
          
          await fetchBotInstances();
        }
      } else {
        // Start bot
        if (!selectedExchange) {
          setError('Please connect an exchange first in Settings');
          setLoading(false);
          return;
        }

        // Get current settings for this bot
        const currentSettings = botSettings[botId];
        
        const response = await fetch('/api/bots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            botId,
            exchangeConnectionId: selectedExchange,
            settings: currentSettings, // Include custom settings
          }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to start bot');
        }
        
        await fetchBotInstances();
      }
    } catch (error: any) {
      console.error('Error toggling bot:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isActive = (botId: number) => activeBots.includes(botId);

  const getBotInstance = (botId: number) => {
    return botInstances.find(b => b.botId === botId && b.status === 'ACTIVE');
  };

  const openSettingsModal = (bot: any) => {
    setSelectedBotForSettings(bot);
    setShowSettingsModal(true);
  };

  const closeSettingsModal = () => {
    setShowSettingsModal(false);
    setSelectedBotForSettings(null);
  };

  const updateBotSettings = (botId: number, field: string, value: any) => {
    setBotSettings(prev => ({
      ...prev,
      [botId]: {
        ...prev[botId],
        [field]: value
      }
    }));
  };

  const updateNestedBotSettings = (botId: number, parentField: string, childField: string, value: any) => {
    setBotSettings(prev => ({
      ...prev,
      [botId]: {
        ...prev[botId],
        [parentField]: {
          ...prev[botId][parentField],
          [childField]: value
        }
      }
    }));
  };

  const toggleSettingsExpand = (botId: number) => {
    setExpandedSettings(prev => ({
      ...prev,
      [botId]: !prev[botId]
    }));
  };

  const saveSettings = async () => {
    if (!selectedBotForSettings) return;

    setLoading(true);
    try {
      const settings = botSettings[selectedBotForSettings.id];
      
      const response = await fetch('/api/bots/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: selectedBotForSettings.id,
          leverage: settings.leverage,
          stopLoss: settings.stopLoss,
          takeProfit: settings.takeProfit,
          // Tier 1 features
          trailingStopLoss: settings.trailingStopLoss,
          maxPositionSize: settings.maxPositionSize,
          maxConcurrentPositions: settings.maxConcurrentPositions,
          maxDailyTrades: settings.maxDailyTrades,
          // Tier 2 features
          breakEvenStop: settings.breakEvenStop,
          partialTakeProfit: settings.partialTakeProfit,
          maxDailyLoss: settings.maxDailyLoss,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setError('');
        closeSettingsModal();
        // Show success message (optional)
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6 p-4 sm:p-5 lg:p-6">
      <div className="text-center mb-6 sm:mb-7 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-400 dark:to-cyan-400 light:from-blue-600 light:to-cyan-600 bg-clip-text text-transparent">
            Auto Trading Bots
          </span>
        </h1>
        <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm sm:text-base lg:text-lg px-4">Choose your bot and start trading instantly</p>
      </div>

      {/* Exchange Selection */}
      {exchangeConnections.length > 0 && (
        <div className="max-w-6xl mx-auto mb-4 sm:mb-5 lg:mb-6">
          <div className="bg-white/5 dark:bg-white/5 light:bg-white border border-white/10 dark:border-white/10 light:border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <label className="block text-xs sm:text-sm font-semibold text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1.5 sm:mb-2">
              Trading Account
            </label>
            <select
              value={selectedExchange}
              onChange={(e) => setSelectedExchange(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 dark:bg-white/10 light:bg-blue-50 border border-white/20 dark:border-white/20 light:border-blue-300 rounded-lg text-sm sm:text-base text-white dark:text-white light:text-gray-900 focus:outline-none focus:border-blue-500"
            >
              {exchangeConnections.map((conn) => (
                <option key={conn._id} value={conn._id} className="bg-gray-800 dark:bg-gray-800 light:bg-white">
                  {conn.exchange.toUpperCase()} - {conn.label || 'Main Account'}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-6xl mx-auto mb-4 sm:mb-5 lg:mb-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-red-400 mb-0.5 sm:mb-1">Error</p>
                <p className="text-xs text-red-300">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Exchange Connection Warning */}
      {exchangeConnections.length === 0 && (
        <div className="max-w-6xl mx-auto mb-4 sm:mb-5 lg:mb-6">
          <div className="bg-yellow-500/10 dark:bg-yellow-500/10 light:bg-yellow-50 border border-yellow-500/30 dark:border-yellow-500/30 light:border-yellow-300 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-yellow-500 dark:text-yellow-500 light:text-yellow-700 mb-0.5 sm:mb-1">No Exchange Connected</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 light:text-yellow-600">
                  Please connect your exchange account in <a href="/settings" className="underline font-semibold">Settings</a> to start trading.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 max-w-6xl mx-auto">
        {tradingBots.map((bot) => {
          const active = isActive(bot.botId);
          
          return (
            <div
              key={bot.botId}
              className={`relative group rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 ${
                active
                  ? 'border-green-500 bg-gradient-to-br from-green-500/20 to-emerald-500/20 dark:from-green-500/20 dark:to-emerald-500/20 light:from-green-100 light:to-emerald-100 shadow-xl shadow-green-500/20'
                  : 'border-white/10 dark:border-white/10 light:border-blue-200 bg-gradient-to-br from-white/5 to-blue-500/5 dark:from-white/5 dark:to-blue-500/5 light:from-white light:to-blue-50 hover:border-blue-400/50'
              }`}
            >
              {bot.recommended && !active && (
                <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-0.5 sm:py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-xs font-bold text-white shadow-lg z-10">
                  ⭐ Recommended
                </div>
              )}

              {active && (
                <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-0.5 sm:py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-xs font-bold text-white shadow-lg z-10 animate-pulse">
                  🟢 Trading Active
                </div>
              )}

              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex-shrink-0 transition-all ${active ? 'animate-bounce' : ''}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={bot.icon} 
                      alt={bot.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1 gap-2">
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white dark:text-white light:text-gray-900 truncate">
                        {bot.name}
                      </h3>
                      <button
                        onClick={() => openSettingsModal(bot)}
                        className="p-1.5 sm:p-2 rounded-lg bg-white/5 dark:bg-white/5 light:bg-blue-100 border border-white/10 dark:border-white/10 light:border-blue-300 hover:bg-blue-500/20 dark:hover:bg-blue-500/20 light:hover:bg-blue-200 transition-all group flex-shrink-0"
                        title="Bot Settings"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-400 light:text-gray-600 group-hover:text-blue-400 dark:group-hover:text-blue-400 light:group-hover:text-blue-600 transition-colors group-hover:rotate-90 transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1.5 sm:mb-2 line-clamp-2">
                      {bot.description}
                    </p>
                    
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      bot.riskColor === 'green' ? 'bg-green-500/20 text-green-400 dark:bg-green-500/20 dark:text-green-400 light:bg-green-100 light:text-green-700' :
                      bot.riskColor === 'blue' ? 'bg-blue-500/20 text-blue-400 dark:bg-blue-500/20 dark:text-blue-400 light:bg-blue-100 light:text-blue-700' :
                      'bg-orange-500/20 text-orange-400 dark:bg-orange-500/20 dark:text-orange-400 light:bg-orange-100 light:text-orange-700'
                    }`}>
                      {bot.risk} Risk
                    </span>
                  </div>
                </div>

                {/* Live Position Info */}
                {active && getBotInstance(bot.botId)?.currentPosition && (
                  <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-blue-500/10 dark:bg-blue-500/10 light:bg-blue-50 border border-blue-500/30 dark:border-blue-500/30 light:border-blue-200 rounded-lg sm:rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-400 dark:text-blue-400 light:text-blue-700">CURRENT POSITION</span>
                      <span className={`text-xs font-bold ${getBotInstance(bot.botId)?.currentPosition.side === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                        {getBotInstance(bot.botId)?.currentPosition.side}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-500 light:text-gray-600">Entry</span>
                        <p className="font-bold text-white dark:text-white light:text-gray-900">
                          ${getBotInstance(bot.botId)?.currentPosition.entryPrice?.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-500 light:text-gray-600">P&L</span>
                        <p className={`font-bold ${(getBotInstance(bot.botId)?.currentPosition.pnl || 0) >= 0 ? 'text-green-400 dark:text-green-400 light:text-green-600' : 'text-red-400 dark:text-red-400 light:text-red-600'}`}>
                          {(getBotInstance(bot.botId)?.currentPosition.pnl || 0) >= 0 ? '+' : ''}
                          ${getBotInstance(bot.botId)?.currentPosition.pnl?.toFixed(2)} ({getBotInstance(bot.botId)?.currentPosition.pnlPercent?.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl border border-white/10 dark:border-white/10 light:border-blue-200">
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">Win Rate</p>
                    <p className="text-xl font-bold text-green-400 dark:text-green-400 light:text-green-600">
                      {active && getBotInstance(bot.botId)?.statistics?.winRate 
                        ? `${getBotInstance(bot.botId)?.statistics.winRate.toFixed(1)}%` 
                        : bot.winRate}
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl border border-white/10 dark:border-white/10 light:border-blue-200">
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">
                      {active ? 'Total P&L' : 'Avg Profit'}
                    </p>
                    <p className={`text-xl font-bold ${
                      active && getBotInstance(bot.botId)?.statistics 
                        ? (getBotInstance(bot.botId)!.statistics.totalProfit + getBotInstance(bot.botId)!.statistics.totalLoss) >= 0 
                          ? 'text-green-400 dark:text-green-400 light:text-green-600' 
                          : 'text-red-400 dark:text-red-400 light:text-red-600'
                        : 'text-blue-400 dark:text-blue-400 light:text-blue-600'
                    }`}>
                      {active && getBotInstance(bot.botId)?.statistics
                        ? `${(getBotInstance(bot.botId)!.statistics.totalProfit + getBotInstance(bot.botId)!.statistics.totalLoss) >= 0 ? '+' : ''}$${(getBotInstance(bot.botId)!.statistics.totalProfit + getBotInstance(bot.botId)!.statistics.totalLoss).toFixed(2)}`
                        : bot.avgProfit}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl border border-white/10 dark:border-white/10 light:border-blue-200 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 font-semibold">CURRENT SETTINGS</p>
                    <button
                      onClick={() => toggleSettingsExpand(bot.botId)}
                      className="text-gray-400 hover:text-white dark:hover:text-white light:hover:text-gray-900 transition-colors"
                      title={expandedSettings[bot.botId] ? "Collapse settings" : "Expand settings"}
                    >
                      <svg 
                        className={`w-5 h-5 transition-transform duration-300 ${expandedSettings[bot.botId] ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div>
                      <p className="text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">Leverage</p>
                      <p className="font-bold text-white dark:text-white light:text-gray-900">
                        {botSettings[bot.botId]?.leverage || bot.defaultSettings.leverage}x
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">Stop Loss</p>
                      <p className="font-bold text-red-400 dark:text-red-400 light:text-red-600">
                        -{botSettings[bot.botId]?.stopLoss || bot.defaultSettings.stopLoss}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">Take Profit</p>
                      <p className="font-bold text-green-400 dark:text-green-400 light:text-green-600">
                        +{botSettings[bot.botId]?.takeProfit || bot.defaultSettings.takeProfit}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Collapsible Advanced Settings */}
                  <div className={`overflow-hidden transition-all duration-300 ${expandedSettings[bot.botId] ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="pt-3 border-t border-white/10 dark:border-white/10 light:border-blue-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span className="text-gray-400 dark:text-gray-400 light:text-gray-600">Trailing SL</span>
                        </div>
                        {botSettings[bot.botId]?.trailingStopLoss?.enabled ? (
                          <span className="text-purple-400 dark:text-purple-400 light:text-purple-600 font-bold">
                            {botSettings[bot.botId]?.trailingStopLoss?.distance}%
                          </span>
                        ) : (
                          <span className="text-gray-600 dark:text-gray-600 light:text-gray-500">OFF</span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-400 dark:text-gray-400 light:text-gray-600">Max Size</span>
                        </div>
                        <span className="text-yellow-400 dark:text-yellow-400 light:text-yellow-600 font-bold">
                          ${botSettings[bot.botId]?.maxPositionSize || 100}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          <span className="text-gray-400 dark:text-gray-400 light:text-gray-600">Max Positions</span>
                        </div>
                        <span className="text-cyan-400 dark:text-cyan-400 light:text-cyan-600 font-bold">
                          {botSettings[bot.botId]?.maxConcurrentPositions || 3}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-400 dark:text-gray-400 light:text-gray-600">Daily Trades</span>
                        </div>
                        <span className="text-orange-400 dark:text-orange-400 light:text-orange-600 font-bold">
                          {botSettings[bot.botId]?.maxDailyTrades || 10}
                        </span>
                      </div>
                      
                      {/* Tier 2 Features */}
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5 dark:border-white/5 light:border-blue-100">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-400 dark:text-gray-400 light:text-gray-600">Break Even</span>
                        </div>
                        {botSettings[bot.botId]?.breakEvenStop?.enabled ? (
                          <span className="text-green-400 dark:text-green-400 light:text-green-600 font-bold">
                            +{botSettings[bot.botId]?.breakEvenStop?.triggerProfit}%
                          </span>
                        ) : (
                          <span className="text-gray-600 dark:text-gray-600 light:text-gray-500">OFF</span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                          <span className="text-gray-400 dark:text-gray-400 light:text-gray-600">Partial TP</span>
                        </div>
                        {botSettings[bot.botId]?.partialTakeProfit?.enabled ? (
                          <span className="text-blue-400 dark:text-blue-400 light:text-blue-600 font-bold">
                            {botSettings[bot.botId]?.partialTakeProfit?.levels?.length || 2} Levels
                          </span>
                        ) : (
                          <span className="text-gray-600 dark:text-gray-600 light:text-gray-500">OFF</span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-gray-400 dark:text-gray-400 light:text-gray-600">Max Loss</span>
                        </div>
                        {botSettings[bot.botId]?.maxDailyLoss?.enabled ? (
                          <span className="text-red-400 dark:text-red-400 light:text-red-600 font-bold">
                            ${botSettings[bot.botId]?.maxDailyLoss?.amount}
                          </span>
                        ) : (
                          <span className="text-gray-600 dark:text-gray-600 light:text-gray-500">OFF</span>
                        )}
                      </div>

                      {/* Support Currency - For all bots */}
                      {bot.supportedCurrencies && (
                        <div className="pt-2 mt-2 border-t border-white/5 dark:border-white/5 light:border-blue-100">
                          <div className="flex items-start gap-2">
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs">Support Currency:</span>
                            </div>
                            <div className="flex flex-wrap gap-1 flex-1">
                              {bot.supportedCurrencies.map((currency: string) => (
                                <span 
                                  key={currency}
                                  className="px-2 py-0.5 bg-indigo-500/20 dark:bg-indigo-500/20 light:bg-indigo-100 text-indigo-400 dark:text-indigo-400 light:text-indigo-700 rounded text-xs font-medium border border-indigo-500/30 dark:border-indigo-500/30 light:border-indigo-300"
                                >
                                  {currency}
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-500 light:text-gray-500 mt-1.5 ml-4">
                            These are the currencies that will be used for trading
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleBot(bot.botId)}
                  disabled={loading || exchangeConnections.length === 0}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    active
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-xl hover:shadow-red-500/30 hover:scale-105'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105'
                  } ${(loading || exchangeConnections.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {active ? 'Stopping...' : 'Starting...'}
                    </>
                  ) : active ? (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                      Stop Bot
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Start Bot
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeBots.length > 0 && (
        <div className="max-w-6xl mx-auto mt-6">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 dark:from-green-500/20 dark:to-emerald-500/20 light:from-green-100 light:to-emerald-100 border-2 border-green-500 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="text-xl font-bold text-white dark:text-white light:text-gray-900">
                {activeBots.length} Bot{activeBots.length > 1 ? 's' : ''} Currently Trading
              </h3>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">
              Your bots are actively monitoring the market and executing trades 24/7
            </p>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedBotForSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-gray-900 to-blue-900/50 dark:from-gray-900 dark:to-blue-900/50 light:from-white light:to-blue-50 rounded-2xl border-2 border-blue-500/30 dark:border-blue-500/30 light:border-blue-300 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-t-2xl border-b-2 border-blue-400/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={selectedBotForSettings.icon} 
                      alt={selectedBotForSettings.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Bot Settings</h3>
                    <p className="text-sm text-blue-100">{selectedBotForSettings.name}</p>
                  </div>
                </div>
                <button
                  onClick={closeSettingsModal}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Info */}
              <div className="bg-blue-500/10 dark:bg-blue-500/10 light:bg-blue-50 border border-blue-500/30 dark:border-blue-500/30 light:border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-400 dark:text-blue-400 light:text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-blue-400 dark:text-blue-400 light:text-blue-700 mb-1">Customize Your Bot</p>
                    <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">
                      Adjust these settings to match your trading style. Default values are optimized for best performance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Leverage Setting */}
              <div className="bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl p-5 border border-white/10 dark:border-white/10 light:border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-white dark:text-white light:text-gray-900">Leverage</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">Higher leverage = Higher risk & reward</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-400 dark:text-blue-400 light:text-blue-600">
                      {botSettings[selectedBotForSettings.id]?.leverage || selectedBotForSettings.leverage}x
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">
                      Default: {selectedBotForSettings.leverage}x
                    </p>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={botSettings[selectedBotForSettings.id]?.leverage || selectedBotForSettings.leverage}
                  onChange={(e) => updateBotSettings(selectedBotForSettings.id, 'leverage', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 dark:bg-gray-700 light:bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-2">
                  <span>1x (Safe)</span>
                  <span>50x (Risky)</span>
                </div>
              </div>

              {/* Stop Loss Setting */}
              <div className="bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl p-5 border border-white/10 dark:border-white/10 light:border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-white dark:text-white light:text-gray-900">Stop Loss</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">Automatically close losing trades</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-400 dark:text-red-400 light:text-red-600">
                      -{botSettings[selectedBotForSettings.id]?.stopLoss || selectedBotForSettings.stopLoss}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">
                      Default: -{selectedBotForSettings.stopLoss}%
                    </p>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={botSettings[selectedBotForSettings.id]?.stopLoss || selectedBotForSettings.stopLoss}
                  onChange={(e) => updateBotSettings(selectedBotForSettings.id, 'stopLoss', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 dark:bg-gray-700 light:bg-blue-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-2">
                  <span>-1% (Tight)</span>
                  <span>-20% (Loose)</span>
                </div>
              </div>

              {/* Take Profit Setting */}
              <div className="bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl p-5 border border-white/10 dark:border-white/10 light:border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-white dark:text-white light:text-gray-900">Take Profit</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">Automatically close winning trades</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400 dark:text-green-400 light:text-green-600">
                      +{botSettings[selectedBotForSettings.id]?.takeProfit || selectedBotForSettings.takeProfit}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">
                      Default: +{selectedBotForSettings.takeProfit}%
                    </p>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="0.5"
                  value={botSettings[selectedBotForSettings.id]?.takeProfit || selectedBotForSettings.takeProfit}
                  onChange={(e) => updateBotSettings(selectedBotForSettings.id, 'takeProfit', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 dark:bg-gray-700 light:bg-blue-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-2">
                  <span>+1% (Conservative)</span>
                  <span>+30% (Aggressive)</span>
                </div>
              </div>

              {/* Currency Selection */}
              <div className="bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl p-5 border border-white/10 dark:border-white/10 light:border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-white dark:text-white light:text-gray-900">Trading Pair</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">Select cryptocurrency to trade</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-cyan-400 dark:text-cyan-400 light:text-cyan-600">
                      {botSettings[selectedBotForSettings.id]?.currency || selectedBotForSettings.supportedCurrencies[0]}
                    </p>
                  </div>
                </div>
                <select
                  value={botSettings[selectedBotForSettings.id]?.currency || selectedBotForSettings.supportedCurrencies[0]}
                  onChange={(e) => updateBotSettings(selectedBotForSettings.id, 'currency', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 dark:bg-gray-800/50 light:bg-white border border-gray-700 dark:border-gray-700 light:border-blue-300 rounded-lg text-white dark:text-white light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {selectedBotForSettings.supportedCurrencies.map((currency: string) => (
                    <option key={currency} value={currency} className="bg-gray-800 dark:bg-gray-800 light:bg-white">
                      {currency}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-2">
                  Bot will trade the selected pair on futures market
                </p>
              </div>

              {/* Position Size Setting */}
              <div className="bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl p-5 border border-white/10 dark:border-white/10 light:border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-white dark:text-white light:text-gray-900">Position Size</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">% of balance to use per trade</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-400 dark:text-yellow-400 light:text-yellow-600">
                      {botSettings[selectedBotForSettings.id]?.positionSize || 10}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">
                      Default: 10%
                    </p>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={botSettings[selectedBotForSettings.id]?.positionSize || 10}
                  onChange={(e) => updateBotSettings(selectedBotForSettings.id, 'positionSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 dark:bg-gray-700 light:bg-blue-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-2">
                  <span>1% (Very Safe)</span>
                  <span>50% (Very Risky)</span>
                </div>
                <div className="mt-2 p-2 bg-yellow-900/20 dark:bg-yellow-900/20 light:bg-yellow-50 border border-yellow-500/30 dark:border-yellow-500/30 light:border-yellow-300 rounded">
                  <p className="text-xs text-yellow-400 dark:text-yellow-400 light:text-yellow-700">
                    ⚠️ Recommended: 5-15% for balanced risk management
                  </p>
                </div>
              </div>

              {/* Max Daily Loss Setting */}
              <div className="bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl p-5 border border-white/10 dark:border-white/10 light:border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-white dark:text-white light:text-gray-900">Max Daily Loss</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">Stop trading if daily loss exceeds</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-400 dark:text-orange-400 light:text-orange-600">
                      ${botSettings[selectedBotForSettings.id]?.maxDailyLoss || 100}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">
                      Default: $100
                    </p>
                  </div>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={botSettings[selectedBotForSettings.id]?.maxDailyLoss || 100}
                  onChange={(e) => updateBotSettings(selectedBotForSettings.id, 'maxDailyLoss', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 dark:bg-gray-700 light:bg-blue-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-2">
                  <span>$10 (Conservative)</span>
                  <span>$500 (Aggressive)</span>
                </div>
                <div className="mt-2 p-2 bg-orange-900/20 dark:bg-orange-900/20 light:bg-orange-50 border border-orange-500/30 dark:border-orange-500/30 light:border-orange-300 rounded">
                  <p className="text-xs text-orange-400 dark:text-orange-400 light:text-orange-700">
                    🛡️ Bot will pause trading for the day if this loss limit is reached
                  </p>
                </div>
              </div>

              {/* TIER 1 FEATURES - Advanced Risk Management */}
              <div className="border-t-2 border-blue-500/30 dark:border-blue-500/30 light:border-blue-300 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h3 className="text-xl font-bold text-white dark:text-white light:text-gray-900">Advanced Risk Management</h3>
                </div>

                {/* Trailing Stop Loss */}
                <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 dark:from-purple-900/20 dark:to-blue-900/20 light:from-purple-50 light:to-blue-50 rounded-xl p-5 border border-purple-500/30 dark:border-purple-500/30 light:border-purple-300 mb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-bold text-white dark:text-white light:text-gray-900">Trailing Stop Loss</h4>
                        <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">PRO</span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">
                        Auto-adjust stop loss as profit increases, locking in gains
                      </p>
                      <p className="text-xs text-purple-400 dark:text-purple-400 light:text-purple-600 font-semibold">
                        Example: Price up 5% → Stop loss moves to -1% (protecting 4% profit)
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={botSettings[selectedBotForSettings.id]?.trailingStopLoss?.enabled || false}
                        onChange={(e) => updateNestedBotSettings(selectedBotForSettings.id, 'trailingStopLoss', 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  
                  {botSettings[selectedBotForSettings.id]?.trailingStopLoss?.enabled && (
                    <div className="mt-4 pt-4 border-t border-purple-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700">Trailing Distance</span>
                        <span className="text-lg font-bold text-purple-400 dark:text-purple-400 light:text-purple-600">
                          {botSettings[selectedBotForSettings.id]?.trailingStopLoss?.distance || 2}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={botSettings[selectedBotForSettings.id]?.trailingStopLoss?.distance || 2}
                        onChange={(e) => updateNestedBotSettings(selectedBotForSettings.id, 'trailingStopLoss', 'distance', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 dark:bg-gray-700 light:bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-1">
                        <span>0.5% (Tight)</span>
                        <span>10% (Loose)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Position Size & Concurrent Positions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Max Position Size */}
                  <div className="bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl p-5 border border-white/10 dark:border-white/10 light:border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="text-base font-bold text-white dark:text-white light:text-gray-900">Max Position Size</h4>
                        <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">Per single trade</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="number"
                        min="10"
                        max="10000"
                        step="10"
                        value={botSettings[selectedBotForSettings.id]?.maxPositionSize || 100}
                        onChange={(e) => updateBotSettings(selectedBotForSettings.id, 'maxPositionSize', parseInt(e.target.value) || 100)}
                        className="flex-1 bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-blue-300 rounded-lg px-3 py-2 text-white dark:text-white light:text-gray-900 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                      <span className="text-sm font-bold text-gray-400 dark:text-gray-400 light:text-gray-600">USDT</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Recommended: $50-$500 per trade</span>
                    </div>
                  </div>

                  {/* Max Concurrent Positions */}
                  <div className="bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl p-5 border border-white/10 dark:border-white/10 light:border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <div>
                        <h4 className="text-base font-bold text-white dark:text-white light:text-gray-900">Max Positions</h4>
                        <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">Open at same time</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center mb-2">
                      <button
                        onClick={() => {
                          const current = botSettings[selectedBotForSettings.id]?.maxConcurrentPositions || 3;
                          if (current > 1) updateBotSettings(selectedBotForSettings.id, 'maxConcurrentPositions', current - 1);
                        }}
                        className="w-10 h-10 bg-gray-800 dark:bg-gray-800 light:bg-blue-100 hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-blue-200 rounded-lg flex items-center justify-center transition-all"
                      >
                        <svg className="w-5 h-5 text-white dark:text-white light:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="mx-6 text-3xl font-bold text-cyan-400 dark:text-cyan-400 light:text-cyan-600 min-w-[60px] text-center">
                        {botSettings[selectedBotForSettings.id]?.maxConcurrentPositions || 3}
                      </span>
                      <button
                        onClick={() => {
                          const current = botSettings[selectedBotForSettings.id]?.maxConcurrentPositions || 3;
                          if (current < 20) updateBotSettings(selectedBotForSettings.id, 'maxConcurrentPositions', current + 1);
                        }}
                        className="w-10 h-10 bg-gray-800 dark:bg-gray-800 light:bg-blue-100 hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-blue-200 rounded-lg flex items-center justify-center transition-all"
                      >
                        <svg className="w-5 h-5 text-white dark:text-white light:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Range: 1-20 positions</span>
                    </div>
                  </div>
                </div>

                {/* Max Daily Trades */}
                <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 dark:from-orange-900/20 dark:to-red-900/20 light:from-orange-50 light:to-red-50 rounded-xl p-5 border border-orange-500/30 dark:border-orange-500/30 light:border-orange-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-white dark:text-white light:text-gray-900">Max Daily Trades</h4>
                      <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">Prevent overtrading & emotional decisions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-400 dark:text-orange-400 light:text-orange-600">
                        {botSettings[selectedBotForSettings.id]?.maxDailyTrades || 10}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">trades/day</p>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={botSettings[selectedBotForSettings.id]?.maxDailyTrades || 10}
                    onChange={(e) => updateBotSettings(selectedBotForSettings.id, 'maxDailyTrades', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 dark:bg-gray-700 light:bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-2">
                    <span>1 (Conservative)</span>
                    <span>50 (Very Active)</span>
                  </div>
                </div>
              </div>

              {/* TIER 2 FEATURES - Profit Protection & Loss Prevention */}
              <div className="border-t-2 border-cyan-500/30 dark:border-cyan-500/30 light:border-cyan-300 pt-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <h3 className="text-xl font-bold text-white dark:text-white light:text-gray-900">Profit Protection & Loss Prevention</h3>
                </div>

                {/* Break Even Stop */}
                <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 dark:from-green-900/20 dark:to-emerald-900/20 light:from-green-50 light:to-emerald-50 rounded-xl p-5 border border-green-500/30 dark:border-green-500/30 light:border-green-300 mb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-bold text-white dark:text-white light:text-gray-900">Break Even Stop</h4>
                        <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">SMART</span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">
                        Auto move stop loss to entry price when profit target is reached
                      </p>
                      <p className="text-xs text-green-400 dark:text-green-400 light:text-green-600 font-semibold">
                        Example: Profit hits +{botSettings[selectedBotForSettings.id]?.breakEvenStop?.triggerProfit || 2}% → Stop loss moves to $0 (no loss possible)
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={botSettings[selectedBotForSettings.id]?.breakEvenStop?.enabled || false}
                        onChange={(e) => updateNestedBotSettings(selectedBotForSettings.id, 'breakEvenStop', 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                  
                  {botSettings[selectedBotForSettings.id]?.breakEvenStop?.enabled && (
                    <div className="mt-4 pt-4 border-t border-green-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700">Trigger at Profit</span>
                        <span className="text-lg font-bold text-green-400 dark:text-green-400 light:text-green-600">
                          +{botSettings[selectedBotForSettings.id]?.breakEvenStop?.triggerProfit || 2}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={botSettings[selectedBotForSettings.id]?.breakEvenStop?.triggerProfit || 2}
                        onChange={(e) => updateNestedBotSettings(selectedBotForSettings.id, 'breakEvenStop', 'triggerProfit', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 dark:bg-gray-700 light:bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-1">
                        <span>0.5% (Quick)</span>
                        <span>10% (Patient)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Partial Take Profit */}
                <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 dark:from-blue-900/20 dark:to-indigo-900/20 light:from-blue-50 light:to-indigo-50 rounded-xl p-5 border border-blue-500/30 dark:border-blue-500/30 light:border-blue-300 mb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-bold text-white dark:text-white light:text-gray-900">Partial Take Profit</h4>
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">ADVANCED</span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">
                        Close position in stages to lock profits while staying in trend
                      </p>
                      <p className="text-xs text-blue-400 dark:text-blue-400 light:text-blue-600 font-semibold">
                        Example: Close 50% at +3%, keep 50% running to +6%
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={botSettings[selectedBotForSettings.id]?.partialTakeProfit?.enabled || false}
                        onChange={(e) => updateNestedBotSettings(selectedBotForSettings.id, 'partialTakeProfit', 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  {botSettings[selectedBotForSettings.id]?.partialTakeProfit?.enabled && (
                    <div className="mt-4 pt-4 border-t border-blue-500/20 space-y-4">
                      {/* Level 1 */}
                      <div className="bg-white/5 dark:bg-white/5 light:bg-blue-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-blue-400 dark:text-blue-400 light:text-blue-700">Level 1</span>
                          <span className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">First Exit</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 block mb-1">Profit Target</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0.5"
                                max="20"
                                step="0.5"
                                value={botSettings[selectedBotForSettings.id]?.partialTakeProfit?.levels?.[0]?.profit || 3}
                                onChange={(e) => {
                                  const newLevels = [...(botSettings[selectedBotForSettings.id]?.partialTakeProfit?.levels || [])];
                                  newLevels[0] = { ...newLevels[0], profit: parseFloat(e.target.value) || 3 };
                                  updateNestedBotSettings(selectedBotForSettings.id, 'partialTakeProfit', 'levels', newLevels);
                                }}
                                className="flex-1 bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-blue-300 rounded-lg px-3 py-2 text-white dark:text-white light:text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm font-bold text-green-400 dark:text-green-400 light:text-green-600">%</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 block mb-1">Close Amount</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="10"
                                max="90"
                                step="5"
                                value={botSettings[selectedBotForSettings.id]?.partialTakeProfit?.levels?.[0]?.closePercent || 50}
                                onChange={(e) => {
                                  const newLevels = [...(botSettings[selectedBotForSettings.id]?.partialTakeProfit?.levels || [])];
                                  newLevels[0] = { ...newLevels[0], closePercent: parseInt(e.target.value) || 50 };
                                  updateNestedBotSettings(selectedBotForSettings.id, 'partialTakeProfit', 'levels', newLevels);
                                }}
                                className="flex-1 bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-blue-300 rounded-lg px-3 py-2 text-white dark:text-white light:text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm font-bold text-blue-400 dark:text-blue-400 light:text-blue-600">%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Level 2 */}
                      <div className="bg-white/5 dark:bg-white/5 light:bg-blue-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-blue-400 dark:text-blue-400 light:text-blue-700">Level 2</span>
                          <span className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">Final Exit</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 block mb-1">Profit Target</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0.5"
                                max="30"
                                step="0.5"
                                value={botSettings[selectedBotForSettings.id]?.partialTakeProfit?.levels?.[1]?.profit || 6}
                                onChange={(e) => {
                                  const newLevels = [...(botSettings[selectedBotForSettings.id]?.partialTakeProfit?.levels || [])];
                                  newLevels[1] = { ...newLevels[1], profit: parseFloat(e.target.value) || 6 };
                                  updateNestedBotSettings(selectedBotForSettings.id, 'partialTakeProfit', 'levels', newLevels);
                                }}
                                className="flex-1 bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-blue-300 rounded-lg px-3 py-2 text-white dark:text-white light:text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm font-bold text-green-400 dark:text-green-400 light:text-green-600">%</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 block mb-1">Close Amount</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="10"
                                max="100"
                                step="5"
                                value={botSettings[selectedBotForSettings.id]?.partialTakeProfit?.levels?.[1]?.closePercent || 50}
                                onChange={(e) => {
                                  const newLevels = [...(botSettings[selectedBotForSettings.id]?.partialTakeProfit?.levels || [])];
                                  newLevels[1] = { ...newLevels[1], closePercent: parseInt(e.target.value) || 50 };
                                  updateNestedBotSettings(selectedBotForSettings.id, 'partialTakeProfit', 'levels', newLevels);
                                }}
                                className="flex-1 bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-blue-300 rounded-lg px-3 py-2 text-white dark:text-white light:text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm font-bold text-blue-400 dark:text-blue-400 light:text-blue-600">%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Percentages must total 100%. Adjust levels to match your strategy.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Max Daily Loss */}
                <div className="bg-gradient-to-br from-red-900/20 to-pink-900/20 dark:from-red-900/20 dark:to-pink-900/20 light:from-red-50 light:to-pink-50 rounded-xl p-5 border border-red-500/30 dark:border-red-500/30 light:border-red-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-bold text-white dark:text-white light:text-gray-900">Max Daily Loss Limit</h4>
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">PROTECTION</span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">
                        Automatically stop all bots when daily loss reaches limit
                      </p>
                      <p className="text-xs text-red-400 dark:text-red-400 light:text-red-600 font-semibold">
                        Protects your account from catastrophic losses on bad days
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={botSettings[selectedBotForSettings.id]?.maxDailyLoss?.enabled || false}
                        onChange={(e) => updateNestedBotSettings(selectedBotForSettings.id, 'maxDailyLoss', 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                  
                  {botSettings[selectedBotForSettings.id]?.maxDailyLoss?.enabled && (
                    <div className="mt-4 pt-4 border-t border-red-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1">
                          <label className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 block mb-1">Maximum Loss Amount</label>
                          <input
                            type="number"
                            min="10"
                            max="5000"
                            step="10"
                            value={botSettings[selectedBotForSettings.id]?.maxDailyLoss?.amount || 100}
                            onChange={(e) => updateNestedBotSettings(selectedBotForSettings.id, 'maxDailyLoss', 'amount', parseInt(e.target.value) || 100)}
                            className="w-full bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-red-300 rounded-lg px-4 py-3 text-white dark:text-white light:text-gray-900 font-bold text-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                        <div className="text-center pt-6">
                          <span className="text-2xl font-bold text-red-400 dark:text-red-400 light:text-red-600">USDT</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-red-500/10 dark:bg-red-500/10 light:bg-red-100 rounded-lg p-3 mt-3">
                        <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-xs text-red-400 dark:text-red-400 light:text-red-700 font-semibold">
                          When triggered, all active bots will stop trading for the rest of the day. Resets at 00:00 UTC.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-500/10 dark:bg-yellow-500/10 light:bg-yellow-50 border border-yellow-500/30 dark:border-yellow-500/30 light:border-yellow-300 rounded-xl p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-yellow-500 dark:text-yellow-500 light:text-yellow-700 mb-1">Important Notice</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 light:text-yellow-600">
                      Changes will apply to new trades only. Active trades will continue with previous settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-900/95 dark:bg-gray-900/95 light:bg-gray-50 p-6 rounded-b-2xl border-t-2 border-blue-400/30 dark:border-blue-400/30 light:border-blue-300">
              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <p className="text-sm text-red-400 text-center">{error}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Reset to default including Tier 1 & 2 features
                    setBotSettings(prev => ({
                      ...prev,
                      [selectedBotForSettings.id]: {
                        leverage: selectedBotForSettings.leverage,
                        stopLoss: selectedBotForSettings.stopLoss,
                        takeProfit: selectedBotForSettings.takeProfit,
                        // Tier 1
                        trailingStopLoss: {
                          enabled: false,
                          distance: 2
                        },
                        maxPositionSize: 100,
                        maxConcurrentPositions: 3,
                        maxDailyTrades: 10,
                        // Tier 2
                        breakEvenStop: {
                          enabled: false,
                          triggerProfit: 2
                        },
                        partialTakeProfit: {
                          enabled: false,
                          levels: [
                            { profit: 3, closePercent: 50 },
                            { profit: 6, closePercent: 50 }
                          ]
                        },
                        maxDailyLoss: {
                          enabled: false,
                          amount: 100
                        }
                      }
                    }));
                  }}
                  disabled={loading}
                  className={`flex-1 py-3 rounded-xl font-bold bg-gray-700 dark:bg-gray-700 light:bg-gray-200 text-white dark:text-white light:text-gray-700 hover:bg-gray-600 dark:hover:bg-gray-600 light:hover:bg-gray-300 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Reset to Default
                </button>
                <button
                  onClick={saveSettings}
                  disabled={loading}
                  className={`flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
