/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

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
  const [lottieAnimation, setLottieAnimation] = useState<any>(null);
  const [userBalance, setUserBalance] = useState<number>(0); // Gas fee balance
  
  // Animation states
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchCountdown, setLaunchCountdown] = useState(3);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [botStartInProgress, setBotStartInProgress] = useState(false); // Prevent duplicate API calls
  
  // Trading activity logs (terminal-style) - will be populated from real bot activity
  const [tradingLogs, setTradingLogs] = useState<Array<{
    id: number;
    time: string;
    type: 'signal' | 'open' | 'close' | 'profit' | 'loss' | 'info';
    message: string;
    color: string;
  }>>([
    { id: 1, time: new Date().toLocaleTimeString('en-US', { hour12: false }), type: 'info', message: '🔄 System ready. Start bot to begin trading...', color: 'text-gray-400' },
  ]);

  // Add log helper function - wrapped in useCallback to prevent re-creation
  const addLog = useCallback((type: 'signal' | 'open' | 'close' | 'profit' | 'loss' | 'info', message: string, color: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false });
    
    setTradingLogs(prev => {
      const newLog = {
        id: Date.now(),
        time,
        type,
        message,
        color
      };
      return [newLog, ...prev].slice(0, 50); // Keep last 50 logs
    });
  }, []);

  // Load Lottie animation
  useEffect(() => {
    fetch('/lottie/crypto-bitcoin.json')
      .then(res => res.json())
      .then(data => setLottieAnimation(data))
      .catch(err => console.error('Failed to load animation:', err));
  }, []);

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
      } else {
        console.error('Failed to fetch exchange connections:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching exchange connections:', error);
    }
  }, [selectedExchange]);

  // Fetch user balance (gas fee balance)
  const fetchUserBalance = useCallback(async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        const balance = data.user?.walletData?.balance || 0;
        setUserBalance(balance);
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  }, []);

  // Fetch active bot instances and exchange connections
  useEffect(() => {
    fetchBotInstances();
    fetchExchangeConnections();
    fetchUserBalance(); // Fetch user balance
    
    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetchBotInstances();
      fetchUserBalance(); // Also refresh balance
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchBotInstances, fetchExchangeConnections, fetchUserBalance]);

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
          setIsShuttingDown(false); // Reset shutdown state after success
        }
      } else {
        // Start bot - VALIDATE REQUIREMENTS FIRST
        
        // 1️⃣ Check if exchange is connected
        if (!selectedExchange) {
          throw new Error('❌ Please connect Binance exchange first in Settings → Exchange');
        }

        // 2️⃣ Check if gas fee balance >= $10
        if (userBalance < 10) {
          throw new Error(`❌ Insufficient gas fee balance. You have $${userBalance.toFixed(2)}, but need minimum $10.00 to start trading. Please top up your gas fee balance.`);
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
          const errorMsg = data.error || 'Failed to start bot';
          
          console.error('❌ Bot start failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorMsg,
            details: data.details
          });
          
          // Show user-friendly error for encryption issues
          if (errorMsg.includes('decrypt') || errorMsg.includes('credentials')) {
            throw new Error('⚠️ Your Binance connection expired. Please reconnect your exchange account in Settings → Exchange');
          }
          
          throw new Error(errorMsg);
        }
        
        await fetchBotInstances();
      }
    } catch (error: any) {
      console.error('Error toggling bot:', error);
      setError(error.message || 'An error occurred');
      
      // Reset animation states on error
      setIsLaunching(false);
      setIsShuttingDown(false);
      setBotStartInProgress(false); // Reset lock on error
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

  // Get Alpha Pilot bot
  const alphaPilotBot = tradingBots.find((bot) => bot.name === 'Alpha Pilot');
  
  // Use real bot state (connected to API)
  const isBotActive = alphaPilotBot ? activeBots.includes(alphaPilotBot.botId) : false;
  
  const botInstance = isBotActive && alphaPilotBot ? getBotInstance(alphaPilotBot.botId) : null;
  
  // Update logs based on bot activity
  useEffect(() => {
    if (botInstance) {
      // Bot is active, add initial log
      if (tradingLogs.length === 1 && tradingLogs[0]?.message.includes('ready')) {
        addLog('info', '✅ Bot started successfully! Monitoring market...', 'text-green-400');
      }
      
      // Poll for bot updates and positions every 10 seconds
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/bots/${botInstance._id}`);
          if (response.ok) {
            const data = await response.json();
            const updatedBot = data.bot;
            
            // Check for new position opened
            if (updatedBot.currentPosition && !botInstance.currentPosition) {
              addLog('open', `📈 OPEN ${updatedBot.currentPosition.side} ${updatedBot.currentPosition.symbol} @ $${updatedBot.currentPosition.entryPrice.toFixed(2)}`, 'text-blue-400');
            }
            // Check for position closed
            else if (!updatedBot.currentPosition && botInstance.currentPosition) {
              const pnl = botInstance.currentPosition.pnl || 0;
              if (pnl > 0) {
                addLog('profit', `✅ CLOSE ${botInstance.currentPosition.symbol} - Profit: +$${pnl.toFixed(2)}`, 'text-green-400');
              } else {
                addLog('loss', `❌ CLOSE ${botInstance.currentPosition.symbol} - Loss: $${pnl.toFixed(2)}`, 'text-red-400');
              }
            }
            
            // Update bot instance in state
            setBotInstances(prev => prev.map(b => b._id === updatedBot._id ? updatedBot : b));
          }
        } catch (error) {
          console.error('Error polling bot:', error);
        }
      }, 10000);
      
      return () => clearInterval(pollInterval);
    } else {
      // Bot stopped - add log if previously was running
      if (tradingLogs.length > 1 && tradingLogs[0]?.message.includes('Monitoring')) {
        addLog('info', '⏸️ Bot stopped. Ready to restart...', 'text-yellow-400');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botInstance?._id, botInstance?.currentPosition]); // Only re-run when bot ID or position changes
  
  // Monitor bot health - Auto-stop if conditions not met
  useEffect(() => {
    if (!isBotActive || !botInstance) return; // Only monitor when bot is active
    
    const checkBotHealth = async () => {
      try {
        // Check 1: Exchange still connected?
        const hasExchange = exchangeConnections.some(conn => 
          conn._id === botInstance.exchangeConnectionId && conn.isActive
        );
        
        // Check 2: Gas fee balance >= $10?
        const hasEnoughBalance = userBalance >= 10;
        
        // If ANY condition fails, force stop the bot
        if (!hasExchange || !hasEnoughBalance) {
          console.warn('⚠️ Bot health check failed - Auto-stopping bot:', {
            hasExchange,
            hasEnoughBalance,
            userBalance,
            exchangeConnections: exchangeConnections.length
          });
          
          // Build error message
          let reason = '';
          if (!hasExchange) {
            reason = '❌ Binance exchange disconnected';
            addLog('info', '🛑 AUTO-STOP: Exchange disconnected', 'text-red-400');
          } else if (!hasEnoughBalance) {
            reason = `❌ Gas fee balance below $10 (Current: $${userBalance.toFixed(2)})`;
            addLog('info', `🛑 AUTO-STOP: Insufficient balance ($${userBalance.toFixed(2)})`, 'text-red-400');
          }
          
          // Force stop the bot
          try {
            const response = await fetch(`/api/bots/${botInstance._id}`, {
              method: 'DELETE',
            });
            
            if (response.ok) {
              setError(reason);
              await fetchBotInstances();
              
              // Show notification
              addLog('info', '⏹️ Bot stopped automatically due to safety requirements', 'text-yellow-400');
            }
          } catch (error) {
            console.error('Error auto-stopping bot:', error);
          }
        }
      } catch (error) {
        console.error('Error in bot health check:', error);
      }
    };
    
    // Check immediately
    checkBotHealth();
    
    // Then check every 5 seconds while bot is running
    const healthCheckInterval = setInterval(checkBotHealth, 5000);
    
    return () => clearInterval(healthCheckInterval);
  }, [isBotActive, botInstance, exchangeConnections, userBalance, fetchBotInstances, addLog]);
  
  // Handle launch animation + real API call
  const handleStartBot = async () => {
    if (!alphaPilotBot || loading || isLaunching || botStartInProgress) return; // Prevent duplicate calls
    
    setBotStartInProgress(true); // Lock to prevent duplicate requests
    setIsLaunching(true);
    setLaunchCountdown(3);
    
    // Countdown 3, 2, 1, Lift Off!
    const countdownInterval = setInterval(() => {
      setLaunchCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setTimeout(async () => {
            setIsLaunching(false);
            // Actually start the bot via API
            await toggleBot(alphaPilotBot.botId);
            setBotStartInProgress(false); // Unlock after API call completes
          }, 1500); // Show "LIFT OFF!" for 1.5s
          return 0;
        }
        return prev - 1;
      });
    }, 800); // Count every 800ms
  };
  
  const handleStopBot = async () => {
    if (!alphaPilotBot || loading || isShuttingDown) return; // Prevent duplicate calls
    
    setIsShuttingDown(true);
    
    // Actually stop the bot via API
    await toggleBot(alphaPilotBot.botId);
    
    setTimeout(() => {
      setIsShuttingDown(false);
    }, 2000); // Show shutdown animation for 2 seconds
  };

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6 p-4 sm:p-5 lg:p-6 relative">
      
      {/* Launch Animation Overlay */}
      {isLaunching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
          <div className="text-center">
            {/* Rocket Animation */}
            <div className="relative mb-8">
              <div className={`text-9xl transition-all duration-500 ${launchCountdown === 0 ? 'animate-rocket-launch' : ''}`}>
                🚀
              </div>
              {launchCountdown === 0 && (
                <div className="absolute inset-x-0 top-full mt-4">
                  <div className="animate-pulse text-6xl">💨</div>
                </div>
              )}
            </div>
            
            {/* Countdown / Lift Off Text */}
            <div className="mb-4">
              {launchCountdown > 0 ? (
                <div className="text-8xl font-black text-blue-400 animate-bounce">
                  {launchCountdown}
                </div>
              ) : (
                <div className="text-6xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent animate-pulse">
                  LIFT OFF! 🎉
                </div>
              )}
            </div>
            
            {/* Loading Text */}
            <div className="space-y-2">
              <p className="text-xl text-gray-400 font-mono">
                {launchCountdown > 0 ? 'Preparing bot...' : 'Bot launched successfully!'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping delay-75"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping delay-150"></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Shutdown Animation Overlay */}
      {isShuttingDown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in">
          <div className="text-center">
            {/* Power Down Icon */}
            <div className="relative mb-8">
              <div className="text-9xl animate-power-down opacity-80">
                🔴
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl animate-fade-out">⚡</div>
              </div>
            </div>
            
            {/* Shutdown Text */}
            <div className="mb-4">
              <div className="text-5xl font-black bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent animate-pulse">
                Shutting Down...
              </div>
            </div>
            
            {/* Progress Text */}
            <div className="space-y-3">
              <p className="text-lg text-gray-400 font-mono animate-fade-out">
                Closing positions safely...
              </p>
              <p className="text-lg text-gray-400 font-mono animate-fade-out delay-500">
                Disconnecting from exchange...
              </p>
              <p className="text-lg text-gray-400 font-mono animate-fade-out delay-1000">
                Bot stopped successfully ✓
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="text-center mb-6 sm:mb-7 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-400 dark:to-cyan-400 light:from-blue-600 light:to-cyan-600 bg-clip-text text-transparent">
            FuturePilot Pro Trading Bot
          </span>
        </h1>
        <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm sm:text-base lg:text-lg px-4">
          AI-powered Bitcoin trading with proven track record
        </p>
      </div>

      {/* TEMPORARILY DISABLED - Exchange Selection & Warnings for UI Demo */}
      {/* 
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
      */}

      {/* Alpha Pilot Bot Not Found */}
      {false && !loadingBots && !alphaPilotBot && (
        <div className="max-w-6xl mx-auto mb-4 sm:mb-5 lg:mb-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-red-400 mb-0.5 sm:mb-1">Alpha Pilot Bot Not Found</p>
                <p className="text-xs text-red-300">
                  Please run: <code className="bg-black/30 px-2 py-0.5 rounded">node scripts/seed-trading-bots.js</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: 60% Bot Card + 40% Advanced Config */}
      {!loadingBots && alphaPilotBot && (
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
            
            {/* Left: Bot Status & Control (60% = 3/5 columns) - Order 2 on mobile, 1 on desktop */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <div className={`relative rounded-2xl sm:rounded-3xl border-2 transition-all duration-500 h-full ${
                isBotActive
                  ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-purple-500/20 shadow-xl shadow-blue-500/30'
                  : 'border-white/10 bg-gradient-to-br from-white/5 to-blue-500/5 hover:border-blue-400/50'
              }`}>
                
                {/* Status Badge */}
                {isBotActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-sm font-bold text-white shadow-lg z-10 animate-pulse">
                    🟢 Bot Active
                  </div>
                )}
                
                <div className="p-6">
                  {/* Bot Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 flex-shrink-0">
                      {/* Alpha Pilot Logo - Always show "A" text */}
                      <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                        <span className="text-3xl font-black text-white">A</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {alphaPilotBot.name}
                      </h2>
                      <p className="text-sm text-gray-400">
                        {alphaPilotBot.description}
                      </p>
                    </div>
                  </div>

                  {/* Bot Statistics */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-xs text-gray-500 mb-1">Win Rate</p>
                      <p className="text-2xl font-bold text-green-400">
                        {botInstance?.statistics?.winRate 
                          ? `${botInstance.statistics.winRate.toFixed(1)}%` 
                          : alphaPilotBot.winRate}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-xs text-gray-500 mb-1">
                        {isBotActive ? 'Total P&L' : 'Avg Profit'}
                      </p>
                      <p className={`text-2xl font-bold ${
                        isBotActive && botInstance?.statistics 
                          ? (botInstance.statistics.totalProfit + botInstance.statistics.totalLoss) >= 0 
                            ? 'text-green-400' 
                            : 'text-red-400'
                          : 'text-blue-400'
                      }`}>
                        {isBotActive && botInstance?.statistics
                          ? `${(botInstance.statistics.totalProfit + botInstance.statistics.totalLoss) >= 0 ? '+' : ''}$${(botInstance.statistics.totalProfit + botInstance.statistics.totalLoss).toFixed(2)}`
                          : alphaPilotBot.avgProfit}
                      </p>
                    </div>
                  </div>

                  {/* Trading Animation */}
                  {isBotActive && (
                    <div className="mb-6 bg-black/20 rounded-xl p-4 border border-green-500/30">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="relative">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute"></div>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <p className="text-sm font-semibold text-green-400">Analyzing market...</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Active Positions</span>
                          <span className="text-white font-bold">{botInstance?.currentPosition ? 1 : 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Wins / Losses</span>
                          <span className="text-white font-bold">
                            <span className="text-green-400">{botInstance?.statistics?.winningTrades || 0}</span>
                            {' / '}
                            <span className="text-red-400">{botInstance?.statistics?.losingTrades || 0}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Current Settings Preview */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
                    <p className="text-xs text-gray-500 font-semibold mb-3">CURRENT SETTINGS</p>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-gray-500 mb-1">Leverage</p>
                        <p className="font-bold text-white">
                          {botSettings[alphaPilotBot.botId]?.leverage || alphaPilotBot.defaultSettings.leverage}x
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Stop Loss</p>
                        <p className="font-bold text-red-400">
                          -{botSettings[alphaPilotBot.botId]?.stopLoss || alphaPilotBot.defaultSettings.stopLoss}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Take Profit</p>
                        <p className="font-bold text-green-400">
                          +{botSettings[alphaPilotBot.botId]?.takeProfit || alphaPilotBot.defaultSettings.takeProfit}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Start/Stop Button */}
                  <button
                    onClick={isBotActive ? handleStopBot : handleStartBot}
                    disabled={
                      !alphaPilotBot || // Disable if bot not loaded yet
                      loading || 
                      isLaunching || 
                      isShuttingDown || 
                      (!isBotActive && (exchangeConnections.length === 0 || userBalance < 10)) // Check exchange AND balance for START
                    }
                    className={`w-full py-5 rounded-xl font-bold text-xl transition-all duration-300 flex items-center justify-center gap-3 ${
                      isBotActive
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-2xl hover:shadow-red-500/40 hover:scale-105'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105'
                    } ${(!alphaPilotBot || loading || isLaunching || isShuttingDown || (!isBotActive && (exchangeConnections.length === 0 || userBalance < 10))) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? (
                      <>
                        <svg className="w-7 h-7 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {isBotActive ? 'Stopping Bot...' : 'Starting Bot...'}
                      </>
                    ) : isLaunching ? (
                      <>
                        <svg className="w-7 h-7 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25"></circle>
                          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                        </svg>
                        Launching...
                      </>
                    ) : isShuttingDown ? (
                      <>
                        <svg className="w-7 h-7 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25"></circle>
                          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                        </svg>
                        Shutting Down...
                      </>
                    ) : isBotActive ? (
                      <>
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                        Stop Bot
                      </>
                    ) : (
                      <>
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Start Bot
                      </>
                    )}
                  </button>

                  {/* Warning Messages - Only show when bot is NOT active */}
                  {!isBotActive && (
                    <div className="mt-4 space-y-2">
                      {/* Exchange not connected */}
                      {exchangeConnections.length === 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-start gap-3">
                          <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-yellow-400">Binance Not Connected</p>
                            <p className="text-xs text-yellow-300/80 mt-1">
                              Please connect your Binance exchange in{' '}
                              <a href="/settings?tab=exchange" className="underline hover:text-yellow-200">Settings → Exchange</a>
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Insufficient balance - ALWAYS show if balance < $10 */}
                      {userBalance < 10 && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-3">
                          <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-400">Insufficient Gas Fee Balance</p>
                            <p className="text-xs text-red-300/80 mt-1">
                              Current: <span className="font-bold">${userBalance.toFixed(2)}</span> | Required: <span className="font-bold">$10.00</span>
                              <br />
                              Please{' '}
                              <a href="/topup" className="underline hover:text-red-200">top up your gas fee balance</a>
                              {' '}to start trading.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* All good - Only show if BOTH conditions met */}
                      {exchangeConnections.length > 0 && userBalance >= 10 && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-400">Ready to Trade</p>
                            <p className="text-xs text-green-300/80 mt-1">
                              ✅ Exchange connected | ✅ Balance: ${userBalance.toFixed(2)} | Click &quot;Start Bot&quot; to begin!
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Trading Animation when active / Advanced Config when stopped - Order 1 on mobile, 2 on desktop */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              {isBotActive ? (
                // Show Lottie Animation when bot is running
                <div className="rounded-2xl sm:rounded-3xl border-2 border-blue-500/50 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-purple-500/20 h-full flex items-center justify-center p-8">
                  <div className="text-center w-full">
                    {lottieAnimation ? (
                      <Lottie 
                        animationData={lottieAnimation}
                        loop={true}
                        style={{ width: '100%', maxWidth: '400px', height: 'auto', margin: '0 auto' }}
                      />
                    ) : (
                      <div className="w-full max-w-md mx-auto">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-blue-400 mt-4">Loading animation...</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Show Advanced Config when bot is stopped
                <div className="rounded-2xl sm:rounded-3xl border-2 border-white/10 bg-gradient-to-br from-white/5 to-purple-500/5 h-full">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">
                        ⚙️ Advanced Config
                      </h3>
                      <button
                        onClick={() => {
                          setSelectedBotForSettings({
                            id: alphaPilotBot.botId,
                            name: alphaPilotBot.name,
                            leverage: alphaPilotBot.defaultSettings.leverage,
                            stopLoss: alphaPilotBot.defaultSettings.stopLoss,
                            takeProfit: alphaPilotBot.defaultSettings.takeProfit,
                            supportedCurrencies: alphaPilotBot.supportedCurrencies || ['BTC'],
                          });
                          setShowSettingsModal(true);
                        }}
                        className="text-sm px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors border border-blue-500/30"
                      >
                        📋 Detail Settings
                      </button>
                    </div>

                    <p className="text-xs text-gray-400 mb-6">
                      View trading parameters
                    </p>

                  {/* Quick Settings */}
                  <div className="space-y-4">
                    {/* Trailing Stop Loss */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span className="text-sm font-semibold text-white">Trailing Stop</span>
                        </div>
                        <span className={`text-sm font-bold ${
                          botSettings[alphaPilotBot.botId]?.trailingStopLoss?.enabled 
                            ? 'text-green-400' 
                            : 'text-gray-600'
                        }`}>
                          {botSettings[alphaPilotBot.botId]?.trailingStopLoss?.enabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>

                    {/* Max Position Size */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Max Position Size</span>
                        <span className="text-sm font-bold text-yellow-400">
                          {botSettings[alphaPilotBot.botId]?.positionSize || 10}%
                        </span>
                      </div>
                    </div>

                    {/* Max Concurrent */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Max Positions</span>
                        <span className="text-sm font-bold text-blue-400">
                          {botSettings[alphaPilotBot.botId]?.maxConcurrentPositions || 3}
                        </span>
                      </div>
                    </div>

                    {/* Max Daily Trades */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Max Daily Trades</span>
                        <span className="text-sm font-bold text-cyan-400">
                          {botSettings[alphaPilotBot.botId]?.maxDailyTrades || 10}
                        </span>
                      </div>
                    </div>

                    {/* Break Even Stop */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Break Even Stop</span>
                        <span className={`text-sm font-bold ${
                          botSettings[alphaPilotBot.botId]?.breakEvenStop?.enabled 
                            ? 'text-green-400' 
                            : 'text-gray-600'
                        }`}>
                          {botSettings[alphaPilotBot.botId]?.breakEvenStop?.enabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <div className="flex gap-2">
                      <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-gray-400">
                        Click <strong className="text-blue-400">Detail Settings</strong> to view all parameters
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Live Trading Activity Terminal */}
      {isBotActive && (
        <div className="max-w-6xl mx-auto mt-6">
          <div className="bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-purple-500/20 border-2 border-blue-500 rounded-xl overflow-hidden">
            {/* Terminal Header */}
            <div className="bg-black/30 border-b border-blue-500/30 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-sm font-mono text-green-400">trading@futurepilot:~$</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-mono">LIVE</span>
              </div>
            </div>
            
            {/* Terminal Body - Scrollable Logs */}
            <div className="bg-black/50 p-4 font-mono text-sm max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500/50 scrollbar-track-transparent">
              <div className="space-y-1">
                {tradingLogs.map((log, index) => (
                  <div 
                    key={log.id} 
                    className={`flex items-start gap-3 ${index === 0 ? 'animate-fadeIn' : ''}`}
                    style={{
                      animation: index === 0 ? 'fadeIn 0.3s ease-in' : 'none'
                    }}
                  >
                    <span className="text-gray-600 text-xs flex-shrink-0">[{log.time}]</span>
                    <span className={`${log.color} flex-1`}>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Terminal Footer - Stats */}
            <div className="bg-black/30 border-t border-blue-500/30 px-4 py-2 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-4">
                <span className="text-gray-400">Total Trades: <span className="text-green-400">
                  {botInstances.find(b => b.status === 'ACTIVE')?.statistics?.totalTrades || 0}
                </span></span>
                <span className="text-gray-400">Win Rate: <span className="text-green-400">
                  {botInstances.find(b => b.status === 'ACTIVE')?.statistics?.winRate 
                    ? `${botInstances.find(b => b.status === 'ACTIVE')?.statistics.winRate.toFixed(0)}%`
                    : '0%'}
                </span></span>
              </div>
              <span className="text-gray-400">P&L Today: <span className={
                (botInstances.find(b => b.status === 'ACTIVE')?.statistics?.dailyPnL || 0) >= 0
                  ? 'text-green-400'
                  : 'text-red-400'
              }>
                {(botInstances.find(b => b.status === 'ACTIVE')?.statistics?.dailyPnL || 0) >= 0 ? '+' : ''}
                ${(botInstances.find(b => b.status === 'ACTIVE')?.statistics?.dailyPnL || 0).toFixed(2)}
              </span></span>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loadingBots && (
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading bot...</p>
            </div>
          </div>
        </div>
      )}

      {false && ( // OLD HIDDEN CODE - DO NOT RENDER
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 max-w-3xl mx-auto">
        {tradingBots
          .filter((bot) => bot.name === 'Alpha Pilot') // Only show Alpha Pilot bot
          .map((bot) => {
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
                  disabled={loading || (!active && exchangeConnections.length === 0)} // ✅ Only check exchange for START
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    active
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-xl hover:shadow-red-500/30 hover:scale-105'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105'
                  } ${(loading || (!active && exchangeConnections.length === 0)) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        
        {/* Show message if Alpha Pilot bot not found */}
        {tradingBots.length > 0 && tradingBots.filter((bot) => bot.name === 'Alpha Pilot').length === 0 && (
          <div className="col-span-full">
            <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-xl font-bold text-yellow-500">FuturePilot Pro Bot Not Found</h3>
              </div>
              <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-4">
                The FuturePilot Pro trading bot is not available in the database. Please contact administrator.
              </p>
            </div>
          </div>
        )}
      </div>
      )} {/* END OF OLD HIDDEN CODE */}

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
                    {/* Alpha Pilot Logo */}
                    <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <span className="text-2xl font-black text-white">A</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">📋 Bot Settings Details</h3>
                    <p className="text-sm text-blue-100">{selectedBotForSettings.name} - Read Only</p>
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
            <div className="p-6 space-y-4">
              {/* Info */}
              <div className="bg-blue-500/10 dark:bg-blue-500/10 light:bg-blue-50 border border-blue-500/30 dark:border-blue-500/30 light:border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-400 dark:text-blue-400 light:text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-blue-400 dark:text-blue-400 light:text-blue-700 mb-1">View Bot Configuration</p>
                    <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">
                      These settings show how your bot is currently configured.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bot Settings - Simple Grid Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Leverage */}
                <div className="bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl p-4 border border-white/10 dark:border-white/10 light:border-blue-200">
                  <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">Leverage</p>
                  <p className="text-xl font-bold text-blue-400 dark:text-blue-400 light:text-blue-600">
                    {botSettings[selectedBotForSettings.id]?.leverage || selectedBotForSettings.leverage}x
                  </p>
                </div>

                {/* Max Risk */}
                <div className="bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl p-4 border border-white/10 dark:border-white/10 light:border-blue-200">
                  <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">Risk Per Trade</p>
                  <p className="text-xl font-bold text-yellow-400 dark:text-yellow-400 light:text-yellow-600">
                    2% of balance
                  </p>
                </div>

                {/* Stop Loss */}
                <div className="bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl p-4 border border-white/10 dark:border-white/10 light:border-blue-200">
                  <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">Stop Loss</p>
                  <p className="text-xl font-bold text-red-400 dark:text-red-400 light:text-red-600">
                    2% of balance
                  </p>
                </div>

                {/* Take Profit */}
                <div className="bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl p-4 border border-white/10 dark:border-white/10 light:border-blue-200">
                  <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">Take Profit</p>
                  <p className="text-xl font-bold text-green-400 dark:text-green-400 light:text-green-600">
                    2% of balance
                  </p>
                </div>

                {/* Trading Pair */}
                <div className="bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl p-4 border border-white/10 dark:border-white/10 light:border-blue-200">
                  <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">Trading Pair</p>
                  <p className="text-xl font-bold text-cyan-400 dark:text-cyan-400 light:text-cyan-600">
                    {botSettings[selectedBotForSettings.id]?.currency || selectedBotForSettings.supportedCurrencies?.[0] || 'BTC'}
                  </p>
                </div>

                {/* Max Daily Loss */}
                <div className="bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl p-4 border border-white/10 dark:border-white/10 light:border-blue-200">
                  <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">Max Daily Loss</p>
                  <p className="text-xl font-bold text-orange-400 dark:text-orange-400 light:text-orange-600">
                    4% of balance
                  </p>
                </div>
              </div>

              {/* Advanced Features Summary */}
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 dark:from-purple-900/20 dark:to-blue-900/20 light:from-purple-50 light:to-blue-50 rounded-xl p-4 border border-purple-500/30 dark:border-purple-500/30 light:border-purple-300">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h3 className="text-lg font-bold text-white dark:text-white light:text-gray-900">Advanced Features</h3>
                </div>
                
                <div className="space-y-2">
                  {/* Trailing Stop Loss */}
                  <div className="flex items-center justify-between py-2 border-b border-purple-500/20">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700">Trailing Stop Loss</span>
                    </div>
                    <span className={`text-sm font-semibold ${botSettings[selectedBotForSettings.id]?.trailingStopLoss?.enabled ? 'text-green-400' : 'text-gray-500'}`}>
                      {botSettings[selectedBotForSettings.id]?.trailingStopLoss?.enabled ? '✅ Enabled' : '❌ Disabled'}
                      {botSettings[selectedBotForSettings.id]?.trailingStopLoss?.enabled && 
                        ` (${botSettings[selectedBotForSettings.id]?.trailingStopLoss?.distance || 2}%)`
                      }
                    </span>
                  </div>

                  {/* Max Position Size */}
                  <div className="flex items-center justify-between py-2 border-b border-purple-500/20">
                    <span className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700">Max Position Size</span>
                    <span className="text-sm font-semibold text-yellow-400">
                      {botSettings[selectedBotForSettings.id]?.positionSize || 10}% of balance
                    </span>
                  </div>

                  {/* Max Concurrent Positions */}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700">Max Concurrent Positions</span>
                    <span className="text-sm font-semibold text-blue-400">
                      {botSettings[selectedBotForSettings.id]?.maxConcurrentPositions || 3} positions
                    </span>
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
              {/* Footer - Read Only Mode */}
              <button
                onClick={closeSettingsModal}
                className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:shadow-xl hover:shadow-gray-500/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom styles for terminal animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes rocketLaunch {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-500px) scale(0.5);
            opacity: 0;
          }
        }
        .animate-rocket-launch {
          animation: rocketLaunch 1.5s ease-in forwards;
        }
        
        @keyframes powerDown {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.5;
          }
          100% {
            transform: scale(0.8);
            opacity: 0.3;
          }
        }
        .animate-power-down {
          animation: powerDown 2s ease-in-out infinite;
        }
        
        @keyframes fadeOut {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(10px);
          }
        }
        .animate-fade-out {
          animation: fadeOut 2s ease-out forwards;
        }
        .delay-500 {
          animation-delay: 0.5s;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}

