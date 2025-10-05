'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    testnet: false,
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

  useEffect(() => {
    if (status === 'authenticated') {
      fetchConnections();
    }
  }, [status]);

  const fetchConnections = async () => {
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
  };

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Exchange Connections
          </h1>
          <p className="text-gray-400 mt-1">Manage your CEX API connections</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl font-semibold overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="relative z-10 flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Connection</span>
          </span>
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/10 backdrop-blur-xl border border-green-500/50 rounded-2xl p-4">
          <p className="text-green-400 font-medium flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </p>
        </div>
      )}

      {/* Connected Exchanges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.map((connection) => {
          const info = exchangeInfo[connection.exchange];
          return (
            <div key={connection._id} className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl"></div>
                
                <div className="relative">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <img src={info.logo} alt={info.name} className="w-12 h-12 object-contain" />
                      <div>
                        <h3 className="text-lg font-bold text-white">{info.name}</h3>
                        <p className="text-xs text-gray-400">{connection.nickname}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleActive(connection)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        connection.isActive
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}
                    >
                      {connection.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Testnet Badge */}
                  {connection.testnet && (
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold border border-yellow-500/30">
                        Testnet
                      </span>
                    </div>
                  )}

                  {/* Permissions */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Permissions:</p>
                    <div className="flex flex-wrap gap-2">
                      {connection.permissions.spot && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs">Spot</span>
                      )}
                      {connection.permissions.futures && (
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs">Futures</span>
                      )}
                      {!connection.permissions.spot && !connection.permissions.futures && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-xs">Not configured</span>
                      )}
                    </div>
                  </div>

                  {/* Balances */}
                  {connection.isActive && connection.exchange === 'binance' && (
                    <div className="mb-4 bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500">Account Balance:</p>
                        <button
                          onClick={() => refreshBalance(connection._id)}
                          disabled={loadingBalances[connection._id]}
                          className="text-xs text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {loadingBalances[connection._id] ? (
                            <>
                              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Loading...
                            </>
                          ) : (
                            <>
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <div>
                              <p className="text-xs text-gray-400">Spot</p>
                              <p className="text-sm font-semibold text-white">${(connection.balances.spot || 0).toFixed(2)}</p>
                            </div>
                          )}
                          {connection.permissions.futures && (
                            <div>
                              <p className="text-xs text-gray-400">Futures</p>
                              <p className="text-sm font-semibold text-white">${(connection.balances.futures || 0).toFixed(2)}</p>
                            </div>
                          )}
                        </div>
                      ) : loadingBalances[connection._id] ? (
                        <div className="text-center py-3">
                          <div className="flex items-center justify-center gap-2 text-blue-400">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-xs">Fetching balance...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-xs text-gray-400 mb-2">No balance data yet</p>
                          <button
                            onClick={() => refreshBalance(connection._id)}
                            disabled={loadingBalances[connection._id]}
                            className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loadingBalances[connection._id] ? 'Fetching...' : 'Fetch Balance'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Last Connected */}
                  {connection.lastConnected && (
                    <p className="text-xs text-gray-500 mb-4">
                      Last used: {new Date(connection.lastConnected).toLocaleDateString()}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeleteConnection(connection._id)}
                      className="flex-1 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm font-semibold transition-all"
                    >
                      Remove
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
            <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/10 p-12 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Exchanges Connected</h3>
              <p className="text-gray-400 mb-6">Add your first exchange connection to start trading</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl font-semibold hover:scale-105 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Connection</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Connection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 backdrop-blur-sm bg-black/60">
          <div className="relative max-w-2xl w-full">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-3xl opacity-50"></div>
            
            <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] border border-white/10 p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 rounded-[2rem]"></div>
              
              <div className="relative">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Add Exchange Connection</h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedExchange(null);
                      setError('');
                    }}
                    className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-all"
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
                            testnet: false,
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
