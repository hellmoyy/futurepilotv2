'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { ActiveTradesWidget } from '@/components/dashboard/ActiveTradesWidget';
import { TradeStatsWidget } from '@/components/dashboard/TradeStatsWidget';

interface CoinPrice {
  symbol: string;
  name: string;
  price: string;
  priceChangePercent: string;
  volume: string;
}

interface DashboardStats {
  totalBalance: number;
  balanceChangePercent: number;
  activeTrades: number;
  totalProfit: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  losingTrades: number;
  avgProfit: number;
  breakdown?: {
    spotBalance: number;
    futuresBalance: number;
    connectedExchanges: number;
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [coins, setCoins] = useState<CoinPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    balanceChangePercent: 0,
    activeTrades: 0,
    totalProfit: 0,
    winRate: 0,
    totalTrades: 0,
    profitableTrades: 0,
    losingTrades: 0,
    avgProfit: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshingBalance, setRefreshingBalance] = useState(false);

  // Function to refresh exchange balances
  const refreshExchangeBalances = async () => {
    try {
      setRefreshingBalance(true);
      console.log('🔄 Refreshing exchange balances...');
      
      // Get all exchange connections
      const connectionsRes = await fetch('/api/exchange/connections');
      const connectionsData = await connectionsRes.json();
      
      if (connectionsData.success && connectionsData.connections) {
        // Refresh balance for each connection
        const refreshPromises = connectionsData.connections.map((conn: any) => 
          fetch(`/api/exchange/connections/${conn._id}/balance`)
            .then(res => res.json())
            .catch(err => {
              console.error(`Failed to refresh balance for ${conn.exchange}:`, err);
              return null;
            })
        );
        
        await Promise.all(refreshPromises);
        console.log('✅ Exchange balances refreshed');
      }
    } catch (error) {
      console.error('❌ Error refreshing exchange balances:', error);
    } finally {
      setRefreshingBalance(false);
    }
  };

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('🔄 Fetching dashboard stats...');
        setStatsError('');
        const response = await fetch('/api/dashboard/stats');
        const result = await response.json();
        
        console.log('📊 Dashboard stats response:', result);
        
        if (result.success && result.data) {
          console.log('✅ Stats loaded:', result.data);
          setStats(result.data);
        } else {
          const errorMsg = result.error || 'Failed to load stats';
          console.error('❌ Failed to load stats:', errorMsg);
          setStatsError(errorMsg);
        }
        setStatsLoading(false);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Network error';
        console.error('💥 Error fetching dashboard stats:', error);
        setStatsError(errorMsg);
        setStatsLoading(false);
      }
    };

    if (session?.user) {
      console.log('👤 User session found, fetching stats...');
      
      // Initial fetch with balance refresh
      refreshExchangeBalances().then(() => {
        fetchStats();
      });
      
      // Auto refresh balances and stats every 30 seconds
      const interval = setInterval(() => {
        refreshExchangeBalances().then(() => {
          fetchStats();
        });
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      console.log('⚠️ No user session, skipping stats fetch');
      setStatsLoading(false);
    }
  }, [session]);

  // Fetch market prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await response.json();
        
        // Filter top coins
        const topCoins = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'MATICUSDT'];
        const coinNames: { [key: string]: string } = {
          'BTCUSDT': 'Bitcoin',
          'ETHUSDT': 'Ethereum',
          'BNBUSDT': 'BNB',
          'SOLUSDT': 'Solana',
          'XRPUSDT': 'Ripple',
          'ADAUSDT': 'Cardano',
          'DOGEUSDT': 'Dogecoin',
          'MATICUSDT': 'Polygon'
        };
        
        const filtered = data
          .filter((item: any) => topCoins.includes(item.symbol))
          .map((item: any) => ({
            symbol: item.symbol,
            name: coinNames[item.symbol] || item.symbol,
            price: parseFloat(item.lastPrice).toFixed(2),
            priceChangePercent: parseFloat(item.priceChangePercent).toFixed(2),
            volume: (parseFloat(item.volume) / 1000000).toFixed(2) + 'M'
          }));
        
        setCoins(filtered);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching prices:', error);
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/10 dark:to-cyan-500/10 light:from-blue-100 light:to-cyan-100 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-white/20 dark:border-white/20 light:border-blue-200">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3">
          <span className="hidden sm:inline">Welcome back,{' '}</span>
          <span className="sm:hidden">Hi,{' '}</span>
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-400 dark:to-cyan-400 light:from-blue-600 light:to-cyan-600 bg-clip-text text-transparent">
            {session?.user?.name}!
          </span>
        </h1>
        <p className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-sm sm:text-base lg:text-lg">
          <span className="hidden sm:inline">Here&apos;s an overview of your trading activity</span>
          <span className="sm:hidden">Your trading overview</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 dark:from-blue-900/50 dark:to-cyan-900/50 light:from-white light:to-blue-50 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-blue-400/30 dark:border-blue-400/30 light:border-blue-200 shadow-xl shadow-blue-500/10">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-xs sm:text-sm font-semibold uppercase tracking-wide">Total Balance</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  await refreshExchangeBalances();
                  // Refresh stats after balance update
                  const response = await fetch('/api/dashboard/stats');
                  const result = await response.json();
                  if (result.success && result.data) {
                    setStats(result.data);
                  }
                }}
                disabled={refreshingBalance}
                className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                title="Refresh balance from exchange"
              >
                <svg 
                  className={`w-4 h-4 text-blue-300 group-hover:text-blue-200 ${refreshingBalance ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/30 dark:bg-blue-500/30 light:bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm border border-blue-400/30 dark:border-blue-400/30 light:border-blue-300">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-300 dark:text-blue-300 light:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          {statsLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-400 text-sm">Loading...</span>
            </div>
          ) : statsError ? (
            <div className="space-y-2">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-400 mb-1 sm:mb-2 tracking-tight">
                Error
              </div>
              <div className="text-xs sm:text-sm text-red-400">
                {statsError}
              </div>
            </div>
          ) : (
            <>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white dark:text-white light:text-gray-900 mb-1 sm:mb-2 tracking-tight">
                ${stats.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`text-xs sm:text-sm font-medium mb-2 ${stats.balanceChangePercent >= 0 ? 'text-green-400 dark:text-green-400 light:text-green-600' : 'text-red-400 dark:text-red-400 light:text-red-600'}`}>
                {stats.balanceChangePercent >= 0 ? '+' : ''}{stats.balanceChangePercent.toFixed(2)}% from last month
              </div>
              {stats.breakdown && (
                <div className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 space-y-1 mt-2 pt-2 border-t border-white/10 dark:border-white/10 light:border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Spot Balance:
                    </span>
                    <span className="font-medium text-white dark:text-white light:text-gray-900">${stats.breakdown.spotBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Futures Balance:
                    </span>
                    <span className="font-medium text-white dark:text-white light:text-gray-900">${stats.breakdown.futuresBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-white/5 dark:border-white/5 light:border-gray-100">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Connected Exchanges:
                    </span>
                    <span className="font-medium text-blue-400 dark:text-blue-400 light:text-blue-600">{stats.breakdown.connectedExchanges}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 dark:from-cyan-900/50 dark:to-blue-900/50 light:from-white light:to-cyan-50 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-cyan-400/30 dark:border-cyan-400/30 light:border-cyan-200 shadow-xl shadow-cyan-500/10">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-xs sm:text-sm font-semibold uppercase tracking-wide">Active Trades</h3>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500/30 dark:bg-cyan-500/30 light:bg-cyan-100 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm border border-cyan-400/30 dark:border-cyan-400/30 light:border-cyan-300">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300 dark:text-cyan-300 light:text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          {statsLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-400 text-sm">Loading...</span>
            </div>
          ) : (
            <>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white dark:text-white light:text-gray-900 mb-1 sm:mb-2 tracking-tight">
                {stats.activeTrades}
              </div>
              <div className="text-xs sm:text-sm text-gray-300 dark:text-gray-300 light:text-gray-600 font-medium">
                {stats.activeTrades === 0 ? 'No active positions' : `${stats.activeTrades} position${stats.activeTrades > 1 ? 's' : ''} open`}
              </div>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 dark:from-blue-900/50 dark:to-blue-800/50 light:from-white light:to-green-50 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-green-400/30 dark:border-green-400/30 light:border-green-200 shadow-xl shadow-green-500/10">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-xs sm:text-sm font-semibold uppercase tracking-wide">Total Profit</h3>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/30 dark:bg-green-500/30 light:bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm border border-green-400/30 dark:border-green-400/30 light:border-green-300">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-300 dark:text-green-300 light:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          {statsLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-400 text-sm">Loading...</span>
            </div>
          ) : (
            <>
              <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 tracking-tight ${stats.totalProfit >= 0 ? 'text-green-400 dark:text-green-400 light:text-green-600' : 'text-red-400 dark:text-red-400 light:text-red-600'}`}>
                {stats.totalProfit >= 0 ? '+' : ''}${Math.abs(stats.totalProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs sm:text-sm text-gray-300 dark:text-gray-300 light:text-gray-600 font-medium">
                All time earnings ({stats.totalTrades} trades)
              </div>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-800/50 to-purple-900/50 dark:from-blue-800/50 dark:to-purple-900/50 light:from-white light:to-purple-50 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-purple-400/30 dark:border-purple-400/30 light:border-purple-200 shadow-xl shadow-purple-500/10">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-xs sm:text-sm font-semibold uppercase tracking-wide">Win Rate</h3>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/30 dark:bg-purple-500/30 light:bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm border border-purple-400/30 dark:border-purple-400/30 light:border-purple-300">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-300 dark:text-purple-300 light:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          {statsLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-400 text-sm">Loading...</span>
            </div>
          ) : (
            <>
              <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 tracking-tight ${stats.winRate >= 50 ? 'text-green-400 dark:text-green-400 light:text-green-600' : stats.winRate > 0 ? 'text-yellow-400 dark:text-yellow-400 light:text-yellow-600' : 'text-white dark:text-white light:text-gray-900'}`}>
                {stats.winRate.toFixed(1)}%
              </div>
              <div className="text-xs sm:text-sm text-gray-300 dark:text-gray-300 light:text-gray-600 font-medium">
                {stats.totalTrades === 0 ? 'No trades yet' : `${stats.profitableTrades}W / ${stats.losingTrades}L`}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Market Overview */}
      <div className="bg-gradient-to-br from-black/60 to-blue-900/30 dark:from-black/60 dark:to-blue-900/30 light:from-white light:to-blue-50 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 p-4 sm:p-6 lg:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white dark:text-white light:text-gray-900">Market Overview</h3>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm text-gray-300 dark:text-gray-300 light:text-gray-600">Live</span>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-10 lg:py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {coins.map((coin) => (
              <div
                key={coin.symbol}
                className="bg-gradient-to-br from-black/40 to-blue-900/20 dark:from-black/40 dark:to-blue-900/20 light:from-blue-50 light:to-white backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-5 border border-white/10 dark:border-white/10 light:border-blue-200 hover:border-blue-400/50 dark:hover:border-blue-400/50 light:hover:border-blue-400 transition-all hover:shadow-xl hover:shadow-blue-500/10 group"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1 uppercase tracking-wide">
                      {coin.symbol.replace('USDT', '/USDT')}
                    </p>
                    <h4 className="text-base sm:text-lg font-bold text-white dark:text-white light:text-gray-900 truncate">
                      {coin.name}
                    </h4>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 dark:bg-blue-500/20 light:bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 dark:text-blue-400 light:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl sm:text-2xl font-bold text-white dark:text-white light:text-gray-900">
                      ${coin.price}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-white/10 dark:border-white/10 light:border-blue-200">
                    <span className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">24h Change</span>
                    <span
                      className={`text-xs sm:text-sm font-bold flex items-center ${
                        parseFloat(coin.priceChangePercent) >= 0
                          ? 'text-green-400 dark:text-green-400 light:text-green-600'
                          : 'text-red-400 dark:text-red-400 light:text-red-600'
                      }`}
                    >
                      {parseFloat(coin.priceChangePercent) >= 0 ? (
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17H5m0 0V9m0 8l8-8 4 4 6-6" />
                        </svg>
                      )}
                      {parseFloat(coin.priceChangePercent) >= 0 ? '+' : ''}
                      {coin.priceChangePercent}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trading Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trade Statistics Widget */}
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 dark:from-blue-900/30 dark:to-purple-900/30 light:from-white light:to-blue-50 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-blue-400/30 dark:border-blue-400/30 light:border-blue-200 shadow-xl">
          <TradeStatsWidget />
        </div>

        {/* Active Trades Widget */}
        <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 dark:from-cyan-900/30 dark:to-blue-900/30 light:from-white light:to-cyan-50 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-cyan-400/30 dark:border-cyan-400/30 light:border-cyan-200 shadow-xl">
          <ActiveTradesWidget />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-black/60 to-blue-900/30 dark:from-black/60 dark:to-blue-900/30 light:from-white light:to-blue-50 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 p-4 sm:p-6 lg:p-8 shadow-xl">
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-5 lg:mb-6 text-white dark:text-white light:text-gray-900">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <a
            href="/settings"
            className="flex items-center space-x-3 sm:space-x-4 p-4 sm:p-5 lg:p-6 bg-gradient-to-br from-blue-900/40 to-blue-700/40 dark:from-blue-900/40 dark:to-blue-700/40 light:from-blue-50 light:to-blue-100 backdrop-blur-sm rounded-lg sm:rounded-xl border border-blue-400/30 dark:border-blue-400/30 light:border-blue-300 hover:border-blue-400/60 dark:hover:border-blue-400/60 light:hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/20 transition-all group"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-white dark:text-white light:text-gray-900 text-base sm:text-lg mb-0.5 sm:mb-1">Configure CEX</h4>
              <p className="text-xs sm:text-sm text-gray-300 dark:text-gray-300 light:text-gray-600">Connect your exchange</p>
            </div>
          </a>

          <a
            href="/automation"
            className="flex items-center space-x-3 sm:space-x-4 p-4 sm:p-5 lg:p-6 bg-gradient-to-br from-cyan-900/40 to-blue-900/40 dark:from-cyan-900/40 dark:to-blue-900/40 light:from-cyan-50 light:to-cyan-100 backdrop-blur-sm rounded-lg sm:rounded-xl border border-cyan-400/30 dark:border-cyan-400/30 light:border-cyan-300 hover:border-cyan-400/60 dark:hover:border-cyan-400/60 light:hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/20 transition-all group"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/30">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-white dark:text-white light:text-gray-900 text-base sm:text-lg mb-0.5 sm:mb-1">Auto Trading</h4>
              <p className="text-xs sm:text-sm text-gray-300 dark:text-gray-300 light:text-gray-600">Automate your strategies</p>
            </div>
          </a>

          <a
            href="/ai-agent"
            className="flex items-center space-x-3 sm:space-x-4 p-4 sm:p-5 lg:p-6 bg-gradient-to-br from-purple-900/40 to-blue-900/40 dark:from-purple-900/40 dark:to-blue-900/40 light:from-purple-50 light:to-purple-100 backdrop-blur-sm rounded-lg sm:rounded-xl border border-purple-400/30 dark:border-purple-400/30 light:border-purple-300 hover:border-purple-400/60 dark:hover:border-purple-400/60 light:hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/20 transition-all group"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-400 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-white dark:text-white light:text-gray-900 text-base sm:text-lg mb-0.5 sm:mb-1">AI Agent</h4>
              <p className="text-xs sm:text-sm text-gray-300 dark:text-gray-300 light:text-gray-600">Let AI trade for you</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
