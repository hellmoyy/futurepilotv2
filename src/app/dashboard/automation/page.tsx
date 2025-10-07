'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const tradingBots = [
  {
    id: 1,
    name: 'Bitcoin Pro',
    icon: '/images/icon-coin/bitcoin.webp',
    description: 'AI-powered Bitcoin trading with proven track record',
    risk: 'Medium',
    riskColor: 'blue',
    winRate: '71%',
    avgProfit: '+3.2%',
    recommended: true,
    leverage: 10,
    stopLoss: 3,
    takeProfit: 6
  },
  {
    id: 2,
    name: 'Ethereum Master',
    icon: '/images/icon-coin/etehreum.webp',
    description: 'Smart ETH trading with advanced algorithms',
    risk: 'Medium',
    riskColor: 'blue',
    winRate: '69%',
    avgProfit: '+2.8%',
    recommended: false,
    leverage: 10,
    stopLoss: 3,
    takeProfit: 6
  },
  {
    id: 3,
    name: 'Safe Trader',
    icon: '/images/icon-coin/safe.webp',
    description: 'Multi Currency - Low risk steady gains for beginners',
    risk: 'Low',
    riskColor: 'green',
    winRate: '68%',
    avgProfit: '+1.5%',
    recommended: false,
    leverage: 5,
    stopLoss: 2,
    takeProfit: 3
  },
  {
    id: 4,
    name: 'Aggressive Trader',
    icon: '/images/icon-coin/aggresive.webp',
    description: 'Multi Currency - High risk high reward for experienced traders',
    risk: 'High',
    riskColor: 'orange',
    winRate: '64%',
    avgProfit: '+5.1%',
    recommended: false,
    leverage: 20,
    stopLoss: 5,
    takeProfit: 10
  },
];

export default function AutomationPage() {
  const { data: session } = useSession();
  const [activeBots, setActiveBots] = useState<number[]>([]);
  const [botInstances, setBotInstances] = useState<any[]>([]);
  const [exchangeConnections, setExchangeConnections] = useState<any[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch active bot instances and exchange connections
  useEffect(() => {
    fetchBotInstances();
    fetchExchangeConnections();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetchBotInstances();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchBotInstances = async () => {
    try {
      const response = await fetch('/api/bots');
      if (response.ok) {
        const data = await response.json();
        setBotInstances(data.bots || []);
        
        // Update active bots list
        const active = data.bots
          .filter((bot: any) => bot.status === 'ACTIVE')
          .map((bot: any) => bot.botId);
        setActiveBots(active);
      }
    } catch (error) {
      console.error('Error fetching bot instances:', error);
    }
  };

  const fetchExchangeConnections = async () => {
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
  };

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
        
        const response = await fetch('/api/bots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            botId,
            exchangeConnectionId: selectedExchange,
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

  return (
    <div className="space-y-6 p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-400 dark:to-cyan-400 light:from-blue-600 light:to-cyan-600 bg-clip-text text-transparent">
            Auto Trading Bots
          </span>
        </h1>
        <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-lg">Choose your bot and start trading instantly</p>
      </div>

      {/* Exchange Selection */}
      {exchangeConnections.length > 0 && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-white/5 dark:bg-white/5 light:bg-white border border-white/10 dark:border-white/10 light:border-blue-200 rounded-xl p-4">
            <label className="block text-sm font-semibold text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2">
              Trading Account
            </label>
            <select
              value={selectedExchange}
              onChange={(e) => setSelectedExchange(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 dark:bg-white/10 light:bg-blue-50 border border-white/20 dark:border-white/20 light:border-blue-300 rounded-lg text-white dark:text-white light:text-gray-900 focus:outline-none focus:border-blue-500"
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
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-400 mb-1">Error</p>
                <p className="text-xs text-red-300">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Exchange Connection Warning */}
      {exchangeConnections.length === 0 && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-yellow-500/10 dark:bg-yellow-500/10 light:bg-yellow-50 border border-yellow-500/30 dark:border-yellow-500/30 light:border-yellow-300 rounded-xl p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-500 dark:text-yellow-500 light:text-yellow-700 mb-1">No Exchange Connected</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 light:text-yellow-600">
                  Please connect your exchange account in <a href="/dashboard/settings" className="underline font-semibold">Settings</a> to start trading.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {tradingBots.map((bot) => {
          const active = isActive(bot.id);
          
          return (
            <div
              key={bot.id}
              className={`relative group rounded-3xl border-2 transition-all duration-300 ${
                active
                  ? 'border-green-500 bg-gradient-to-br from-green-500/20 to-emerald-500/20 dark:from-green-500/20 dark:to-emerald-500/20 light:from-green-100 light:to-emerald-100 shadow-xl shadow-green-500/20'
                  : 'border-white/10 dark:border-white/10 light:border-blue-200 bg-gradient-to-br from-white/5 to-blue-500/5 dark:from-white/5 dark:to-blue-500/5 light:from-white light:to-blue-50 hover:border-blue-400/50'
              }`}
            >
              {bot.recommended && !active && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-xs font-bold text-white shadow-lg z-10">
                  ⭐ Recommended
                </div>
              )}

              {active && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-xs font-bold text-white shadow-lg z-10 animate-pulse">
                  🟢 Trading Active
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-16 h-16 flex-shrink-0 transition-all ${active ? 'animate-bounce' : ''}`}>
                    <img 
                      src={bot.icon} 
                      alt={bot.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white dark:text-white light:text-gray-900 mb-1">
                      {bot.name}
                    </h3>
                    <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mb-2">
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
                {active && getBotInstance(bot.id)?.currentPosition && (
                  <div className="mb-4 p-3 bg-blue-500/10 dark:bg-blue-500/10 light:bg-blue-50 border border-blue-500/30 dark:border-blue-500/30 light:border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-400 dark:text-blue-400 light:text-blue-700">CURRENT POSITION</span>
                      <span className={`text-xs font-bold ${getBotInstance(bot.id)?.currentPosition.side === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                        {getBotInstance(bot.id)?.currentPosition.side}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-500 light:text-gray-600">Entry</span>
                        <p className="font-bold text-white dark:text-white light:text-gray-900">
                          ${getBotInstance(bot.id)?.currentPosition.entryPrice?.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-500 light:text-gray-600">P&L</span>
                        <p className={`font-bold ${(getBotInstance(bot.id)?.currentPosition.pnl || 0) >= 0 ? 'text-green-400 dark:text-green-400 light:text-green-600' : 'text-red-400 dark:text-red-400 light:text-red-600'}`}>
                          {(getBotInstance(bot.id)?.currentPosition.pnl || 0) >= 0 ? '+' : ''}
                          ${getBotInstance(bot.id)?.currentPosition.pnl?.toFixed(2)} ({getBotInstance(bot.id)?.currentPosition.pnlPercent?.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl border border-white/10 dark:border-white/10 light:border-blue-200">
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">Win Rate</p>
                    <p className="text-xl font-bold text-green-400 dark:text-green-400 light:text-green-600">
                      {active && getBotInstance(bot.id)?.statistics?.winRate 
                        ? `${getBotInstance(bot.id)?.statistics.winRate.toFixed(1)}%` 
                        : bot.winRate}
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl border border-white/10 dark:border-white/10 light:border-blue-200">
                    <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">
                      {active ? 'Total P&L' : 'Avg Profit'}
                    </p>
                    <p className={`text-xl font-bold ${
                      active && getBotInstance(bot.id)?.statistics 
                        ? (getBotInstance(bot.id)!.statistics.totalProfit + getBotInstance(bot.id)!.statistics.totalLoss) >= 0 
                          ? 'text-green-400 dark:text-green-400 light:text-green-600' 
                          : 'text-red-400 dark:text-red-400 light:text-red-600'
                        : 'text-blue-400 dark:text-blue-400 light:text-blue-600'
                    }`}>
                      {active && getBotInstance(bot.id)?.statistics
                        ? `${(getBotInstance(bot.id)!.statistics.totalProfit + getBotInstance(bot.id)!.statistics.totalLoss) >= 0 ? '+' : ''}$${(getBotInstance(bot.id)!.statistics.totalProfit + getBotInstance(bot.id)!.statistics.totalLoss).toFixed(2)}`
                        : bot.avgProfit}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white/5 dark:bg-white/5 light:bg-blue-50 rounded-xl border border-white/10 dark:border-white/10 light:border-blue-200 mb-4">
                  <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 font-semibold mb-2">AUTO SETTINGS</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">Leverage</p>
                      <p className="font-bold text-white dark:text-white light:text-gray-900">{bot.leverage}x</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">Stop Loss</p>
                      <p className="font-bold text-red-400 dark:text-red-400 light:text-red-600">-{bot.stopLoss}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">Take Profit</p>
                      <p className="font-bold text-green-400 dark:text-green-400 light:text-green-600">+{bot.takeProfit}%</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleBot(bot.id)}
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

      <div className="max-w-6xl mx-auto mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-500/10 dark:bg-blue-500/10 light:bg-blue-50 border border-blue-500/30 dark:border-blue-500/30 light:border-blue-200 rounded-xl p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-400 dark:text-blue-400 light:text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-blue-400 dark:text-blue-400 light:text-blue-700 mb-1">How It Works</p>
                <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">
                  Each bot has pre-configured settings optimized for performance. Just click Start Bot and it will trade automatically 24/7.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 dark:bg-yellow-500/10 light:bg-yellow-50 border border-yellow-500/30 dark:border-yellow-500/30 light:border-yellow-300 rounded-xl p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-500 dark:text-yellow-500 light:text-yellow-700 mb-1">Risk Warning</p>
                <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">
                  Trading involves risk. Only trade with money you can afford to lose. Past performance does not guarantee future results.
                </p>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  );
}
