/* eslint-disable @next/next/no-img-element */
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';

interface ExchangeConnection {
  _id: string;
  exchange: 'binance' | 'bybit' | 'kucoin' | 'okx';
  nickname: string;
  isActive: boolean;
  testnet: boolean;
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

export default function ExchangeTab() {
  const { data: session } = useSession();
  const [connections, setConnections] = useState<ExchangeConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<'binance' | 'bybit' | 'kucoin' | 'okx' | null>(null);
  const [formData, setFormData] = useState({
    apiKey: '',
    apiSecret: '',
    nickname: '',
    testnet: false,
    spot: false,
    futures: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState<Record<string, boolean>>({});

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
    if (session) {
      fetchConnections();
    }
  }, [session, fetchConnections]);

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
          testnet: formData.testnet,
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
        testnet: false,
        spot: false,
        futures: false,
      });
      
      // Fetch connections and balance for new connection
      await fetchConnections();
      
      if (wasBindance && newConnectionId) {
        setTimeout(() => refreshBalance(newConnectionId), 1000);
      }

    } catch (error) {
      console.error('Error adding connection:', error);
      setError('Failed to add connection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (connection: ExchangeConnection) => {
    try {
      const response = await fetch(`/api/exchange/connections/${connection._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !connection.isActive }),
      });

      if (response.ok) {
        setConnections(prev => 
          prev.map(conn => 
            conn._id === connection._id 
              ? { ...conn, isActive: !conn.isActive }
              : conn
          )
        );
      }
    } catch (error) {
      console.error('Error toggling connection:', error);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) return;

    try {
      const response = await fetch(`/api/exchange/connections/${connectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConnections(prev => prev.filter(conn => conn._id !== connectionId));
        setSuccess('Connection removed successfully');
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 light:text-gray-600">Loading exchange connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white light:text-gray-900 mb-2">
            Exchange Connections
          </h2>
          <p className="text-gray-300 light:text-gray-700 text-sm">Manage your CEX API connections</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="group relative px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl text-sm font-bold overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 text-white"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="relative z-10 flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Connection</span>
          </span>
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/20 light:bg-green-100 backdrop-blur-xl border border-green-400/40 light:border-green-300 rounded-xl p-4 shadow-xl shadow-green-500/10">
          <p className="text-green-300 light:text-green-700 font-bold text-sm flex items-center space-x-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </p>
        </div>
      )}

      {/* Connections Grid */}
      {connections.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white light:text-gray-900 mb-2">No Exchanges Connected</h3>
          <p className="text-gray-300 light:text-gray-600 text-sm mb-6 max-w-md mx-auto">Add your first exchange connection to start trading</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl text-white font-semibold hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30"
          >
            Connect Exchange
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {connections.map((connection) => {
            const info = exchangeInfo[connection.exchange];
            return (
              <div key={connection._id} className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/[0.03] light:bg-white backdrop-blur-3xl rounded-xl border border-white/10 light:border-gray-200 p-4 transition-all duration-300 group-hover:border-white/20 light:group-hover:border-blue-300">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <img src={info.logo} alt={info.name} className="w-12 h-12 object-contain flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-white light:text-gray-900 mb-1 truncate">{info.name}</h3>
                        <p className="text-sm text-gray-300 light:text-gray-600 font-medium truncate">{connection.nickname}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleActive(connection)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        connection.isActive ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        connection.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {/* Status */}
                  <div className="flex items-center space-x-2 mb-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      connection.isActive
                        ? 'bg-green-500/30 light:bg-green-100 text-green-300 light:text-green-700 border border-green-400/40 light:border-green-300'
                        : 'bg-gray-500/30 light:bg-gray-100 text-gray-300 light:text-gray-700 border border-gray-400/40 light:border-gray-300'
                    }`}>
                      {connection.isActive ? '🟢 Active' : '⚫ Inactive'}
                    </span>
                    {connection.testnet && (
                      <span className="inline-block px-3 py-1 bg-yellow-500/30 light:bg-yellow-100 text-yellow-300 light:text-yellow-700 rounded-full text-xs font-bold border border-yellow-400/40 light:border-yellow-300">
                        🧪 Testnet
                      </span>
                    )}
                  </div>

                  {/* Permissions */}
                  <div className="mb-4 bg-black/30 light:bg-blue-50 backdrop-blur-sm rounded-xl p-3 border border-white/10 light:border-blue-200">
                    <p className="text-xs text-gray-300 light:text-gray-700 mb-2 font-semibold uppercase tracking-wide">Permissions:</p>
                    <div className="flex flex-wrap gap-2">
                      {connection.permissions.spot && (
                        <span className="px-2 py-1 bg-blue-500/30 light:bg-blue-100 text-blue-300 light:text-blue-700 rounded text-xs font-bold">Spot</span>
                      )}
                      {connection.permissions.futures && (
                        <span className="px-2 py-1 bg-purple-500/30 light:bg-purple-100 text-purple-300 light:text-purple-700 rounded text-xs font-bold">Futures</span>
                      )}
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-300 light:text-gray-700 font-semibold uppercase tracking-wide">Balance:</p>
                      <button
                        onClick={() => refreshBalance(connection._id)}
                        disabled={loadingBalances[connection._id]}
                        className="text-xs text-blue-400 light:text-blue-600 hover:text-blue-300 light:hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
                      >
                        {loadingBalances[connection._id] ? (
                          <>
                            <svg className="w-3 h-3 animate-spin inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Loading...
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                          </>
                        )}
                      </button>
                    </div>
                    {connection.balances !== undefined && connection.balances !== null ? (
                      <div className="grid grid-cols-2 gap-2">
                        {connection.permissions.spot && (
                          <div className="bg-black/30 light:bg-white backdrop-blur-sm rounded-lg p-2.5 border border-white/10 light:border-blue-200">
                            <p className="text-xs text-gray-400 light:text-gray-600 mb-1">Spot USDT</p>
                            <p className="text-lg font-bold text-white light:text-gray-900">${connection.balances.spot?.toFixed(2) || '0.00'}</p>
                          </div>
                        )}
                        {connection.permissions.futures && (
                          <div className="bg-black/30 light:bg-white backdrop-blur-sm rounded-lg p-2.5 border border-white/10 light:border-blue-200">
                            <p className="text-xs text-gray-400 light:text-gray-600 mb-1">Futures USDT</p>
                            <p className="text-lg font-bold text-white light:text-gray-900">${connection.balances.futures?.toFixed(2) || '0.00'}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 light:text-gray-600 italic">Click refresh to load balance</p>
                    )}
                  </div>

                  {/* Last Connected */}
                  {connection.lastConnected && (
                    <p className="text-xs text-gray-400 light:text-gray-600 mb-4">
                      🕒 Last used: {new Date(connection.lastConnected).toLocaleDateString()}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeleteConnection(connection._id)}
                      className="flex-1 px-3 py-2 bg-red-500/30 light:bg-red-100 hover:bg-red-500/40 light:hover:bg-red-200 border border-red-400/40 light:border-red-300 hover:border-red-400/60 rounded-xl text-red-300 light:text-red-700 text-xs font-bold transition-all hover:shadow-lg hover:shadow-red-500/20"
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Connection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-xl"></div>
            <div className="relative bg-gray-900 light:bg-white border border-white/10 light:border-gray-200 rounded-2xl p-6">
              
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white light:text-gray-900">Add Exchange Connection</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedExchange(null);
                    setError('');
                  }}
                  className="w-8 h-8 bg-white/5 light:bg-gray-100 hover:bg-white/10 light:hover:bg-gray-200 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
                >
                  <svg className="w-5 h-5 text-gray-400 light:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {!selectedExchange ? (
                /* Exchange Selection */
                <div className="space-y-4">
                  <p className="text-gray-400 light:text-gray-600 mb-6">Select an exchange to connect:</p>
                  {Object.entries(exchangeInfo).map(([key, info]) => {
                    const hasConnection = connections.some(c => c.exchange === key && !c.testnet);
                    const isDisabled = key !== 'binance'; // Disable all except Binance
                    return (
                      <button
                        key={key}
                        onClick={() => !hasConnection && !isDisabled && setSelectedExchange(key as any)}
                        disabled={hasConnection || isDisabled}
                        className={`w-full group relative ${hasConnection || isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative bg-white/5 light:bg-gray-50 backdrop-blur-xl rounded-2xl border border-white/10 light:border-gray-200 hover:border-white/20 light:hover:border-blue-300 p-6 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <img src={info.logo} alt={info.name} className="w-14 h-14 object-contain" />
                              <div className="text-left">
                                <h3 className="text-xl font-bold text-white light:text-gray-900">{info.name}</h3>
                                <p className="text-sm text-gray-400 light:text-gray-600">{info.description}</p>
                              </div>
                            </div>
                            {hasConnection ? (
                              <span className="px-3 py-1 bg-green-500/20 light:bg-green-100 text-green-400 light:text-green-700 rounded-full text-xs font-semibold">Connected</span>
                            ) : isDisabled ? (
                              <span className="px-3 py-1 bg-gray-500/20 light:bg-gray-100 text-gray-400 light:text-gray-600 rounded-full text-xs font-semibold">Coming Soon</span>
                            ) : (
                              <svg className="w-6 h-6 text-gray-400 light:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <div className="bg-red-500/10 light:bg-red-100 backdrop-blur-xl border border-red-500/50 light:border-red-300 rounded-xl p-4">
                      <p className="text-red-400 light:text-red-700 text-sm font-medium">{error}</p>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 mb-6">
                    <img src={exchangeInfo[selectedExchange].logo} alt={exchangeInfo[selectedExchange].name} className="w-12 h-12 object-contain" />
                    <div>
                      <h3 className="text-lg font-bold text-white light:text-gray-900">{exchangeInfo[selectedExchange].name}</h3>
                      <p className="text-sm text-gray-400 light:text-gray-600">Configure connection</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-2">
                      Nickname (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      placeholder={`My ${exchangeInfo[selectedExchange].name} Account`}
                      className="w-full px-4 py-3 bg-white/5 light:bg-white backdrop-blur-xl border border-white/10 light:border-gray-300 rounded-xl text-white light:text-gray-900 placeholder-gray-400 light:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:border-white/20 light:hover:border-blue-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-2">
                      API Key <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      required
                      placeholder="Enter your API key"
                      className="w-full px-4 py-3 bg-white/5 light:bg-white backdrop-blur-xl border border-white/10 light:border-gray-300 rounded-xl text-white light:text-gray-900 placeholder-gray-400 light:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:border-white/20 light:hover:border-blue-400 transition-all font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-2">
                      API Secret <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.apiSecret}
                      onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                      required
                      placeholder="Enter your API secret"
                      className="w-full px-4 py-3 bg-white/5 light:bg-white backdrop-blur-xl border border-white/10 light:border-gray-300 rounded-xl text-white light:text-gray-900 placeholder-gray-400 light:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:border-white/20 light:hover:border-blue-400 transition-all font-mono text-sm"
                    />
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-3">
                      Trading Permissions
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.spot}
                          onChange={(e) => setFormData({ ...formData, spot: e.target.checked })}
                          className="w-5 h-5 rounded bg-white/5 light:bg-white border-white/20 light:border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-400"
                        />
                        <span className="text-gray-300 light:text-gray-700">Spot Trading</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.futures}
                          onChange={(e) => setFormData({ ...formData, futures: e.target.checked })}
                          className="w-5 h-5 rounded bg-white/5 light:bg-white border-white/20 light:border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-400"
                        />
                        <span className="text-gray-300 light:text-gray-700">Futures Trading</span>
                      </label>
                    </div>
                  </div>

                  {/* Testnet */}
                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.testnet}
                        onChange={(e) => setFormData({ ...formData, testnet: e.target.checked })}
                        className="w-5 h-5 rounded bg-white/5 light:bg-white border-white/20 light:border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-400"
                      />
                      <span className="text-gray-300 light:text-gray-700">Use Testnet (for testing)</span>
                    </label>
                  </div>

                  {/* Security Tips */}
                  <div className="bg-blue-500/10 light:bg-blue-50 backdrop-blur-xl border border-blue-400/30 light:border-blue-200 rounded-xl p-4">
                    <h4 className="flex items-center text-sm font-semibold text-blue-300 light:text-blue-700 mb-2">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Security Tips</span>
                    </h4>
                    <ul className="text-sm text-gray-400 light:text-gray-600 space-y-1">
                      <li>• Keys are encrypted and stored securely</li>
                      <li>• Enable IP whitelist on exchange</li>
                      <li>• Disable withdrawal permissions</li>
                      <li>• <a href={exchangeInfo[selectedExchange].guide} target="_blank" rel="noopener noreferrer" className="text-blue-400 light:text-blue-600 hover:text-blue-300 light:hover:text-blue-700 underline">Read API setup guide →</a></li>
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
                          testnet: false,
                          spot: false,
                          futures: false,
                        });
                        setError('');
                      }}
                      className="flex-1 px-6 py-3 bg-white/5 light:bg-gray-100 backdrop-blur-xl border border-white/10 light:border-gray-300 rounded-2xl font-semibold hover:bg-white/10 light:hover:bg-gray-200 hover:border-white/20 light:hover:border-gray-400 transition-all text-white light:text-gray-700"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl font-semibold overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-white"
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
      )}
    </div>
  );
}
