/* eslint-disable @next/next/no-img-element */
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ExchangeConnection {
  _id: string;
  exchange: 'binance' | 'bybit' | 'kucoin' | 'okx';
  nickname: string;
  isActive: boolean;
  permissions: {
    spot?: boolean;
    futures?: boolean;
  };
  balances?: {
    spot?: number;
    futures?: number;
  };
  lastConnected?: string;
  createdAt: string;
}

const exchangeInfo = {
  binance: {
    name: 'Binance',
    color: 'from-yellow-500 to-yellow-600',
    logo: '/images/icons/binance.png',
    description: 'World\'s largest crypto exchange',
    guide: 'https://www.binance.com/en/support/faq/how-to-create-api-360002502072',
  },
  bybit: {
    name: 'Bybit',
    color: 'from-orange-500 to-red-600',
    logo: '/images/icons/bybit.png',
    description: 'Leading derivatives exchange',
    guide: 'https://www.bybit.com/en-US/help-center/article/How-to-Create-a-New-API-Key',
  },
  kucoin: {
    name: 'KuCoin',
    color: 'from-green-500 to-emerald-600',
    logo: '/images/icons/kucoin.png',
    description: 'The People\'s Exchange',
    guide: 'https://www.kucoin.com/support/360015102174-How-to-Create-an-API',
  },
  okx: {
    name: 'OKX',
    color: 'from-slate-600 to-slate-800',
    logo: '/images/icons/okx.png',
    description: 'Global crypto exchange',
    guide: 'https://www.okx.com/help/how-to-create-an-api-key',
  },
};

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [connections, setConnections] = useState<ExchangeConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<'binance' | 'bybit' | 'kucoin' | 'okx' | null>(null);
  const [formData, setFormData] = useState({
    apiKey: '',
    apiSecret: '',
    nickname: '',
    spot: false,
    futures: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchConnections = useCallback(async () => {
    try {
      const response = await fetch('/api/exchange/connections');
      const data = await response.json();
      const connections = data.connections || [];
      setConnections(connections);
      
      // Auto-fetch balance for active Binance connections
      connections.forEach((conn: ExchangeConnection) => {
        if (conn.isActive && conn.exchange === 'binance') {
          refreshBalance(conn._id);
        }
      });
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchConnections();
    }
  }, [status, fetchConnections]);

  const refreshBalance = async (connectionId: string) => {
    setLoadingBalances(prev => ({ ...prev, [connectionId]: true }));
    try {
      const response = await fetch(`/api/exchange/connections/${connectionId}/balance`);
      const data = await response.json();
      
      if (response.ok && data.balances) {
        setConnections(prev => 
          prev.map(conn => 
            conn._id === connectionId 
              ? { ...conn, balances: data.balances }
              : conn
          )
        );
      } else {
        console.error('Failed to fetch balance:', data.error);
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
    } finally {
      setLoadingBalances(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExchange) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/exchange/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchange: selectedExchange,
          apiKey: formData.apiKey,
          apiSecret: formData.apiSecret,
          nickname: formData.nickname || `${exchangeInfo[selectedExchange].name} Account`,
          permissions: {
            spot: formData.spot,
            futures: formData.futures,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to add connection');
        setIsSubmitting(false);
        return;
      }

      setSuccess(`${exchangeInfo[selectedExchange].name} connected successfully!`);
      
      // Store connection ID and exchange before clearing states
      const newConnectionId = data.connection?._id;
      const wasBindance = selectedExchange === 'binance';
      
      setShowAddModal(false);
      setSelectedExchange(null);
      setFormData({
        apiKey: '',
        apiSecret: '',
        nickname: '',
        spot: false,
        futures: false,
      });
      
      // Fetch connections and balance for new connection
      await fetchConnections();
      
      // Auto-fetch balance for newly added Binance connection
      if (wasBindance && newConnectionId) {
        setTimeout(() => {
          refreshBalance(newConnectionId);
        }, 500);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) return;

    try {
      const response = await fetch(`/api/exchange/connections?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Connection removed successfully');
        fetchConnections();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
    }
  };

  const handleToggleActive = async (connection: ExchangeConnection) => {
    try {
      const response = await fetch('/api/exchange/connections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: connection._id,
          isActive: !connection.isActive,
        }),
      });

      if (response.ok) {
        fetchConnections();
      }
    } catch (error) {
      console.error('Error toggling connection:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/10 dark:to-cyan-500/10 light:from-blue-100 light:to-cyan-100 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-white/20 dark:border-white/20 light:border-blue-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-400 dark:to-cyan-400 light:from-blue-600 light:to-cyan-600 bg-clip-text text-transparent">
              Exchange Connections
            </span>
          </h1>
          <p className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-sm sm:text-base lg:text-lg">Manage your CEX API connections</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="group relative px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl text-sm sm:text-base font-bold overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 text-white w-full sm:w-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="relative z-10 flex items-center justify-center space-x-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Connection</span>
          </span>
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/20 dark:bg-green-500/20 light:bg-green-100 backdrop-blur-xl border border-green-400/40 dark:border-green-400/40 light:border-green-300 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xl shadow-green-500/10">
          <p className="text-green-300 dark:text-green-300 light:text-green-700 font-bold text-sm sm:text-base lg:text-lg flex items-center space-x-2 sm:space-x-3">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </p>
        </div>
      )}

      {/* Connected Exchanges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {connections.map((connection) => {
          const info = exchangeInfo[connection.exchange];
          return (
            <div key={connection._id} className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-black/60 to-blue-900/20 dark:from-black/60 dark:to-blue-900/20 light:from-white light:to-blue-50 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 p-4 sm:p-5 lg:p-6 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-xl sm:rounded-2xl"></div>
                
                <div className="relative">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 sm:mb-5">
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={info.logo} alt={info.name} className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 object-contain flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white dark:text-white light:text-gray-900 mb-1 truncate">{info.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-300 dark:text-gray-300 light:text-gray-600 font-medium truncate">{connection.nickname}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleActive(connection)}
                      className={`px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${
                        connection.isActive
                          ? 'bg-green-500/30 dark:bg-green-500/30 light:bg-green-100 text-green-300 dark:text-green-300 light:text-green-700 border border-green-400/40 dark:border-green-400/40 light:border-green-300 shadow-lg shadow-green-500/20'
                          : 'bg-gray-500/30 dark:bg-gray-500/30 light:bg-gray-100 text-gray-300 dark:text-gray-300 light:text-gray-600 border border-gray-400/30 dark:border-gray-400/30 light:border-gray-300'
                      }`}
                    >
                      {connection.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Permissions */}
                  <div className="mb-4 sm:mb-5 bg-black/30 dark:bg-black/30 light:bg-blue-50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 dark:border-white/10 light:border-blue-200">
                    <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2 sm:mb-3 font-semibold uppercase tracking-wide">Permissions:</p>
                    <div className="flex flex-wrap gap-2">
                      {connection.permissions.spot && (
                        <span className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-500/30 dark:bg-blue-500/30 light:bg-blue-100 text-blue-300 dark:text-blue-300 light:text-blue-700 rounded-lg text-xs sm:text-sm font-bold border border-blue-400/30 dark:border-blue-400/30 light:border-blue-300">📊 Spot</span>
                      )}
                      {connection.permissions.futures && (
                        <span className="px-2 sm:px-3 py-1 sm:py-2 bg-cyan-500/30 dark:bg-cyan-500/30 light:bg-cyan-100 text-cyan-300 dark:text-cyan-300 light:text-cyan-700 rounded-lg text-xs sm:text-sm font-bold border border-cyan-400/30 dark:border-cyan-400/30 light:border-cyan-300">📈 Futures</span>
                      )}
                      {!connection.permissions.spot && !connection.permissions.futures && (
                        <span className="px-2 sm:px-3 py-1 sm:py-2 bg-gray-500/30 dark:bg-gray-500/30 light:bg-gray-100 text-gray-300 dark:text-gray-300 light:text-gray-600 rounded-lg text-xs sm:text-sm font-bold border border-gray-400/30 dark:border-gray-400/30 light:border-gray-300">❌ Not configured</span>
                      )}
                    </div>
                  </div>

                  {/* Balances */}
                  {connection.isActive && connection.exchange === 'binance' && (
                    <div className="mb-4 sm:mb-5 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/10 dark:to-cyan-500/10 light:from-blue-100 light:to-cyan-100 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-blue-400/30 dark:border-blue-400/30 light:border-blue-300">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs sm:text-sm text-gray-200 dark:text-gray-200 light:text-gray-700 font-bold uppercase tracking-wide">💰 Balance:</p>
                        <button
                          onClick={() => refreshBalance(connection._id)}
                          disabled={loadingBalances[connection._id]}
                          className="text-xs sm:text-sm text-blue-300 dark:text-blue-300 light:text-blue-600 hover:text-blue-200 dark:hover:text-blue-200 light:hover:text-blue-700 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 font-semibold"
                        >
                          {loadingBalances[connection._id] ? (
                            <>
                              <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="hidden sm:inline">Loading...</span>
                            </>
                          ) : (
                            <>
                              <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span>Refresh</span>
                            </>
                          )}
                        </button>
                      </div>
                      {connection.balances !== undefined && connection.balances !== null ? (
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          {connection.permissions.spot && (
                            <div className="bg-black/30 dark:bg-black/30 light:bg-white backdrop-blur-sm rounded-lg p-2.5 sm:p-3 border border-white/10 dark:border-white/10 light:border-blue-200">
                              <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1 font-semibold uppercase tracking-wide">Spot</p>
                              <p className="text-base sm:text-lg font-bold text-white dark:text-white light:text-gray-900">${(connection.balances.spot || 0).toFixed(2)}</p>
                            </div>
                          )}
                          {connection.permissions.futures && (
                            <div className="bg-black/30 dark:bg-black/30 light:bg-white backdrop-blur-sm rounded-lg p-2.5 sm:p-3 border border-white/10 dark:border-white/10 light:border-blue-200">
                              <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1 font-semibold uppercase tracking-wide">Futures</p>
                              <p className="text-base sm:text-lg font-bold text-white dark:text-white light:text-gray-900">${(connection.balances.futures || 0).toFixed(2)}</p>
                            </div>
                          )}
                        </div>
                      ) : loadingBalances[connection._id] ? (
                        <div className="text-center py-3 sm:py-4">
                          <div className="flex items-center justify-center gap-2 text-blue-300 dark:text-blue-300 light:text-blue-600">
                            <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-xs sm:text-sm font-semibold">Fetching...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2 sm:py-3">
                          <p className="text-xs sm:text-sm text-gray-300 dark:text-gray-300 light:text-gray-600 mb-2 sm:mb-3 font-medium">No balance data yet</p>
                          <button
                            onClick={() => refreshBalance(connection._id)}
                            disabled={loadingBalances[connection._id]}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500/30 dark:bg-blue-500/30 light:bg-blue-100 hover:bg-blue-500/40 dark:hover:bg-blue-500/40 light:hover:bg-blue-200 border border-blue-400/40 dark:border-blue-400/40 light:border-blue-300 rounded-lg text-blue-300 dark:text-blue-300 light:text-blue-700 text-xs sm:text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/20"
                          >
                            {loadingBalances[connection._id] ? 'Fetching...' : 'Fetch Balance'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Last Connected */}
                  {connection.lastConnected && (
                    <p className="text-xs sm:text-sm text-gray-300 dark:text-gray-300 light:text-gray-600 mb-4 sm:mb-5 font-medium">
                      🕒 Last used: {new Date(connection.lastConnected).toLocaleDateString()}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2 sm:space-x-3">
                    <button
                      onClick={() => handleDeleteConnection(connection._id)}
                      className="flex-1 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 bg-red-500/30 dark:bg-red-500/30 light:bg-red-100 hover:bg-red-500/40 dark:hover:bg-red-500/40 light:hover:bg-red-200 border border-red-400/40 dark:border-red-400/40 light:border-red-300 hover:border-red-400/60 rounded-xl text-red-300 dark:text-red-300 light:text-red-700 text-xs sm:text-sm font-bold transition-all hover:shadow-lg hover:shadow-red-500/20"
                    >
                      <span className="hidden sm:inline">🗑️ Remove Connection</span>
                      <span className="sm:hidden">🗑️ Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {connections.length === 0 && (
          <div className="col-span-full">
            <div className="relative bg-gradient-to-br from-black/60 to-blue-900/20 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/20 p-8 sm:p-12 lg:p-16 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-blue-400/30">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3">No Exchanges Connected</h3>
              <p className="text-gray-300 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 max-w-md mx-auto">Add your first exchange connection to start trading</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center justify-center space-x-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl text-sm sm:text-base font-bold hover:scale-105 transition-all hover:shadow-xl hover:shadow-blue-500/30 text-white w-full sm:w-auto"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Your First Connection</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Connection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6 backdrop-blur-sm bg-black/60">
          <div className="relative max-w-2xl w-full">
            <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-3xl opacity-50"></div>
            
            <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl sm:rounded-[2rem] border border-white/10 p-5 sm:p-6 lg:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 rounded-2xl sm:rounded-[2rem]"></div>
              
              <div className="relative">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-5 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Add Exchange Connection</h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedExchange(null);
                      setError('');
                    }}
                    className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {!selectedExchange ? (
                  /* Exchange Selection */
                  <div className="space-y-4">
                    <p className="text-gray-400 mb-6">Select an exchange to connect:</p>
                    {Object.entries(exchangeInfo).map(([key, info]) => {
                      const hasConnection = connections.some(c => c.exchange === key);
                      const isDisabled = key !== 'binance'; // Disable all except Binance
                      return (
                        <button
                          key={key}
                          onClick={() => !hasConnection && !isDisabled && setSelectedExchange(key as any)}
                          disabled={hasConnection || isDisabled}
                          className={`w-full group relative ${hasConnection || isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 p-6 transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <img src={info.logo} alt={info.name} className="w-14 h-14 object-contain" />
                                <div className="text-left">
                                  <h3 className="text-xl font-bold text-white">{info.name}</h3>
                                  <p className="text-sm text-gray-400">{info.description}</p>
                                </div>
                              </div>
                              {hasConnection ? (
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">Connected</span>
                              ) : isDisabled ? (
                                <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-semibold">Coming Soon</span>
                              ) : (
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Connection Form */
                  <form onSubmit={handleAddConnection} className="space-y-5">
                    {error && (
                      <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/50 rounded-xl p-4">
                        <p className="text-red-400 text-sm font-medium">{error}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-3 mb-6">
                      <img src={exchangeInfo[selectedExchange].logo} alt={exchangeInfo[selectedExchange].name} className="w-12 h-12 object-contain" />
                      <div>
                        <h3 className="text-lg font-bold text-white">{exchangeInfo[selectedExchange].name}</h3>
                        <p className="text-sm text-gray-400">Configure connection</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">
                        Nickname (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.nickname}
                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                        placeholder={`My ${exchangeInfo[selectedExchange].name} Account`}
                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:border-white/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">
                        API Key <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.apiKey}
                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                        placeholder="Enter API Key"
                        required
                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:border-white/20 transition-all font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">
                        API Secret <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="password"
                        value={formData.apiSecret}
                        onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                        placeholder="Enter API Secret"
                        required
                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:border-white/20 transition-all font-mono text-sm"
                      />
                    </div>

                    {/* Permissions */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-3">
                        Trading Permissions
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.spot}
                            onChange={(e) => setFormData({ ...formData, spot: e.target.checked })}
                            className="w-5 h-5 rounded bg-white/5 border-white/20 text-blue-500 focus:ring-2 focus:ring-blue-400"
                          />
                          <span className="text-gray-300">Spot Trading</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.futures}
                            onChange={(e) => setFormData({ ...formData, futures: e.target.checked })}
                            className="w-5 h-5 rounded bg-white/5 border-white/20 text-blue-500 focus:ring-2 focus:ring-blue-400"
                          />
                          <span className="text-gray-300">Futures Trading</span>
                        </label>
                      </div>
                    </div>

                    {/* Security Notice */}
                    <div className="bg-blue-500/10 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4">
                      <h4 className="text-blue-400 font-semibold mb-2 flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Security Tips</span>
                      </h4>
                      <ul className="text-sm text-gray-400 space-y-1">
                        <li>• Keys are encrypted and stored securely</li>
                        <li>• Enable IP whitelist on exchange</li>
                        <li>• Disable withdrawal permissions</li>
                        <li>• <a href={exchangeInfo[selectedExchange].guide} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Read API setup guide →</a></li>
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExchange(null);
                          setFormData({
                            apiKey: '',
                            apiSecret: '',
                            nickname: '',
                            spot: false,
                            futures: false,
                          });
                          setError('');
                        }}
                        className="flex-1 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl font-semibold hover:bg-white/10 hover:border-white/20 transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl font-semibold overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative z-10">
                          {isSubmitting ? 'Connecting...' : 'Connect Exchange'}
                        </span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
