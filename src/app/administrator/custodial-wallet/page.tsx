'use client';

import { useState, useEffect } from 'react';

export default function CustodialWalletPage() {
  const [sweepLoading, setSweepLoading] = useState(false);
  const [sweepResults, setSweepResults] = useState<any>(null);
  const [masterWalletBalances, setMasterWalletBalances] = useState<any>(null);
  const [commissionWalletBalance, setCommissionWalletBalance] = useState<any>(null);
  
  // ✅ MAINNET ONLY - No more testnet switching
  const [selectedNetwork, setSelectedNetwork] = useState<'BSC_MAINNET' | 'ETHEREUM_MAINNET'>('BSC_MAINNET');
  const [minAmount, setMinAmount] = useState(10);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [commissionBalanceLoading, setCommissionBalanceLoading] = useState(false);
  const [tokenType, setTokenType] = useState<'USDT' | 'NATIVE' | 'CUSTOM'>('USDT');
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState(18); // Default 18 for BEP20, will be 6 for ERC20
  const [tokenSymbol, setTokenSymbol] = useState('USDT');
  const [tokenName, setTokenName] = useState('Tether USD');
  const [tokenInfoLoading, setTokenInfoLoading] = useState(false);
  const [userAccountsSummary, setUserAccountsSummary] = useState<any>(null);
  const [scanningAccounts, setScanningAccounts] = useState(false);

  // Pagination states for sweep results
  const [sweepResultsPage, setSweepResultsPage] = useState(1);
  const sweepResultsPerPage = 10;
  const [failedTxPage, setFailedTxPage] = useState(1);
  const failedTxPerPage = 10;

  // Auto-fetch balance on mount
  useEffect(() => {
    fetchMasterWalletBalance();
    fetchCommissionWalletBalance();
  }, []);

  // Fetch token info when token type or network changes
  useEffect(() => {
    if (tokenType === 'CUSTOM' && !customTokenAddress) {
      // Don't fetch for custom token without address
      return;
    }
    fetchTokenInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenType, selectedNetwork, customTokenAddress]);

  const getExplorerUrl = (network: string) => {
    switch (network) {
      case 'BSC_MAINNET':
        return 'https://bscscan.com';
      case 'ETHEREUM_MAINNET':
        return 'https://etherscan.io';
      default:
        return 'https://bscscan.com'; // Default to BSC mainnet
    }
  };

  const handleSweepWallets = async () => {
    if (!confirm('⚠️ Are you sure you want to sweep all user wallets to master wallet? This action cannot be undone.')) {
      return;
    }

    setSweepLoading(true);
    setSweepResults(null);

    try {
      const response = await fetch('/api/admin/sweep-wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          network: selectedNetwork,
          minAmount: minAmount,
          tokenType: tokenType,
          customTokenAddress: tokenType === 'CUSTOM' ? customTokenAddress : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sweep failed');
      }

      setSweepResults(data);
      
      // Refresh balance after sweep
      await fetchMasterWalletBalance();
      
      alert(`✅ Sweep completed!\n\nSuccess: ${data.summary.successful}\nFailed: ${data.summary.failed}\nSkipped: ${data.summary.skipped}\nTotal: $${data.summary.totalAmount} USDT`);
    } catch (error: any) {
      console.error('Sweep error:', error);
      alert(`❌ Sweep failed: ${error.message}`);
    } finally {
      setSweepLoading(false);
    }
  };

  const fetchMasterWalletBalance = async () => {
    setBalanceLoading(true);
    try {
      const response = await fetch(`/api/admin/master-wallet-balance`);
      const data = await response.json();
      
      if (response.ok) {
        setMasterWalletBalances(data);
      } else {
        console.error('Failed to fetch balance:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch master wallet balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchCommissionWalletBalance = async () => {
    setCommissionBalanceLoading(true);
    try {
      const response = await fetch(`/api/admin/commission-wallet-balance`);
      const data = await response.json();
      
      if (response.ok) {
        setCommissionWalletBalance(data);
      } else {
        console.error('Failed to fetch commission wallet balance:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch commission wallet balance:', error);
    } finally {
      setCommissionBalanceLoading(false);
    }
  };

  const fetchTokenInfo = async () => {
    setTokenInfoLoading(true);
    try {
      const params = new URLSearchParams({
        network: selectedNetwork,
        tokenType: tokenType,
      });

      if (tokenType === 'CUSTOM' && customTokenAddress) {
        params.append('tokenAddress', customTokenAddress);
      }

      const response = await fetch(`/api/admin/token-info?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setTokenDecimals(data.decimals);
        setTokenSymbol(data.symbol);
        setTokenName(data.name);
        console.log('✅ Token info loaded:', data);
      } else {
        console.error('Failed to fetch token info:', data.error);
        // Set defaults on error based on network (mainnet only)
        if (tokenType === 'USDT') {
          const defaultDecimals = selectedNetwork === 'BSC_MAINNET' ? 18 : 6; // BSC: 18, ETH: 6
          setTokenDecimals(defaultDecimals);
          setTokenSymbol('USDT');
          setTokenName('Tether USD');
        } else if (tokenType === 'NATIVE') {
          setTokenDecimals(18);
          setTokenSymbol(selectedNetwork.includes('BSC') ? 'BNB' : 'ETH');
          setTokenName(selectedNetwork.includes('BSC') ? 'Binance Coin' : 'Ethereum');
        }
      }
    } catch (error) {
      console.error('Failed to fetch token info:', error);
    } finally {
      setTokenInfoLoading(false);
    }
  };

  const scanUserAccounts = async () => {
    setScanningAccounts(true);
    setUserAccountsSummary(null);

    try {
      const response = await fetch('/api/admin/scan-user-balances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          networkMode: 'mainnet', // Always mainnet
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      setUserAccountsSummary(data);
    } catch (error: any) {
      console.error('Scan error:', error);
      alert(`❌ Scan failed: ${error.message}`);
    } finally {
      setScanningAccounts(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Custodial Wallet Management</h1>
        <p className="text-gray-400">
          Sweep all user wallet funds to master wallet (Binance/Coinbase model)
        </p>
      </div>

      {/* Master Wallet Info Card */}
      <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-600 rounded-lg p-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Master Wallet</h2>
              <p className="text-gray-400 text-sm">Central treasury for all user funds</p>
            </div>
          </div>
          <button
            onClick={fetchMasterWalletBalance}
            disabled={balanceLoading}
            className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-4 py-2 rounded-lg text-sm transition flex items-center space-x-2 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${balanceLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{balanceLoading ? 'Loading...' : 'Refresh Balance'}</span>
          </button>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-10 gap-4">
            {/* Wallet Address - 40% */}
            <div className="col-span-4">
              <p className="text-gray-400 text-xs mb-2 font-semibold uppercase tracking-wide">Wallet Address</p>
              <div className="flex items-center space-x-2">
                <p className="text-white font-mono text-xs break-all">
                  {masterWalletBalances?.address || process.env.NEXT_PUBLIC_MASTER_WALLET_ADDRESS || '0xdCdE...'}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(masterWalletBalances?.address || process.env.NEXT_PUBLIC_MASTER_WALLET_ADDRESS || '');
                    alert('✅ Copied to clipboard!');
                  }}
                  className="text-purple-400 hover:text-purple-300 flex-shrink-0"
                  title="Copy address"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* BNB Balance - 20% */}
            <div className="col-span-2">
              <p className="text-gray-400 text-xs mb-2 font-semibold uppercase tracking-wide">BNB Balance</p>
              {masterWalletBalances ? (
                <div className="space-y-1">
                  <p className="text-xl font-bold text-yellow-400">
                    {masterWalletBalances.totals.bnb}
                  </p>
                  <p className="text-gray-500 text-[10px]">
                    {masterWalletBalances.balances
                      .filter((b: any) => b.nativeSymbol === 'BNB')
                      .map((b: any) => `${b.label}: ${b.nativeBalance}`)
                      .join(' | ')}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-xs">Loading...</p>
              )}
            </div>

            {/* ETH Balance - 20% */}
            <div className="col-span-2">
              <p className="text-gray-400 text-xs mb-2 font-semibold uppercase tracking-wide">ETH Balance</p>
              {masterWalletBalances ? (
                <div className="space-y-1">
                  <p className="text-xl font-bold text-blue-400">
                    {masterWalletBalances.totals.eth}
                  </p>
                  <p className="text-gray-500 text-[10px]">
                    {masterWalletBalances.balances
                      .filter((b: any) => b.nativeSymbol === 'ETH')
                      .map((b: any) => `${b.label}: ${b.nativeBalance}`)
                      .join(' | ')}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-xs">Loading...</p>
              )}
            </div>

            {/* USDT Balance - 20% */}
            <div className="col-span-2">
              <p className="text-gray-400 text-xs mb-2 font-semibold uppercase tracking-wide">USDT Balance</p>
              {masterWalletBalances ? (
                <div className="space-y-1">
                  <p className="text-xl font-bold text-green-400">
                    ${masterWalletBalances.totals.usdt}
                  </p>
                  <p className="text-gray-500 text-[10px]">
                    {masterWalletBalances.balances
                      .map((b: any) => `${b.label}: $${b.usdtBalance}`)
                      .join(' | ')}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-xs">Loading...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Commission Wallet Info Card */}
      <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-green-600 rounded-lg p-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Commission Wallet</h2>
              <p className="text-gray-400 text-sm">Automatic withdrawal processor (ERC20 only)</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchCommissionWalletBalance}
              disabled={commissionBalanceLoading}
              className="bg-green-600/20 hover:bg-green-600/30 text-green-300 px-4 py-2 rounded-lg text-sm transition flex items-center space-x-2 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${commissionBalanceLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{commissionBalanceLoading ? 'Loading...' : 'Refresh Balance'}</span>
            </button>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/50">
              🟢 MAINNET
            </span>
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-10 gap-4">
            {/* Wallet Address - 40% */}
            <div className="col-span-4">
              <p className="text-gray-400 text-xs mb-2 font-semibold uppercase tracking-wide">Wallet Address</p>
              <div className="flex items-center space-x-2">
                <p className="text-white font-mono text-xs break-all">
                  {process.env.NEXT_PUBLIC_COMMISSION_WALLET_ADDRESS || 'Not configured'}
                </p>
                <button
                  onClick={() => {
                    const address = process.env.NEXT_PUBLIC_COMMISSION_WALLET_ADDRESS;
                    if (address) {
                      navigator.clipboard.writeText(address);
                      alert('✅ Copied to clipboard!');
                    }
                  }}
                  className="text-green-400 hover:text-green-300 flex-shrink-0"
                  title="Copy address"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ETH Balance - 20% */}
            <div className="col-span-2">
              <p className="text-gray-400 text-xs mb-2 font-semibold uppercase tracking-wide">ETH Balance</p>
              {commissionWalletBalance ? (
                <div className="space-y-1">
                  <p className="text-xl font-bold text-blue-400">
                    {commissionWalletBalance.ethBalance} ETH
                  </p>
                  <p className="text-gray-600 text-[10px]">
                    (For gas fees)
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-xs">
                  {commissionBalanceLoading ? 'Loading...' : 'Click Refresh'}
                </p>
              )}
            </div>

            {/* USDT Balance - 20% */}
            <div className="col-span-2">
              <p className="text-gray-400 text-xs mb-2 font-semibold uppercase tracking-wide">USDT Balance</p>
              {commissionWalletBalance ? (
                <div className="space-y-1">
                  <p className="text-xl font-bold text-green-400">
                    ${commissionWalletBalance.usdtBalance}
                  </p>
                  <p className="text-gray-600 text-[10px]">
                    (ERC20 only)
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-xs">
                  {commissionBalanceLoading ? 'Loading...' : 'Click Refresh'}
                </p>
              )}
            </div>

            {/* Status - 20% */}
            <div className="col-span-2">
              <p className="text-gray-400 text-xs mb-2 font-semibold uppercase tracking-wide">Status</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-green-400 text-xs font-semibold">Active</p>
              </div>
              <p className="text-gray-600 text-[10px] mt-1">
                Auto-withdrawal enabled
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Accounts Summary Card */}
      <div className="bg-gradient-to-br from-blue-900/30 to-green-900/30 border border-blue-500/30 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 rounded-lg p-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">User Accounts Summary</h2>
              <p className="text-gray-400 text-sm">Scan all user USDT balances from blockchain</p>
            </div>
          </div>
          <button
            onClick={scanUserAccounts}
            disabled={scanningAccounts}
            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-4 py-2 rounded-lg text-sm transition flex items-center space-x-2 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${scanningAccounts ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>{scanningAccounts ? 'Scanning...' : 'Scan All Users'}</span>
          </button>
        </div>

        {userAccountsSummary ? (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-xs mb-1 font-semibold uppercase tracking-wide">Total Users</p>
                <p className="text-2xl font-bold text-white">{userAccountsSummary.totalUsers}</p>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-xs mb-1 font-semibold uppercase tracking-wide">ERC20 Balance</p>
                <p className="text-2xl font-bold text-blue-400">${userAccountsSummary.erc20Total.toFixed(2)}</p>
                <p className="text-gray-500 text-xs mt-1">{userAccountsSummary.erc20Count} addresses</p>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-xs mb-1 font-semibold uppercase tracking-wide">BEP20 Balance</p>
                <p className="text-2xl font-bold text-yellow-400">${userAccountsSummary.bep20Total.toFixed(2)}</p>
                <p className="text-gray-500 text-xs mt-1">{userAccountsSummary.bep20Count} addresses</p>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-xs mb-1 font-semibold uppercase tracking-wide">Total USDT</p>
                <p className="text-2xl font-bold text-green-400">${userAccountsSummary.grandTotal.toFixed(2)}</p>
                <p className="text-gray-500 text-xs mt-1">Combined</p>
              </div>
            </div>

            {/* Network Mode Indicator */}
            <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700">
              <p className="text-gray-400 text-xs">
                <span className="font-semibold">Network Mode:</span>{' '}
                <span className="font-bold text-green-400">
                  🟢 MAINNET
                </span>
                {' '}- Scanning Ethereum & BSC Mainnet
              </p>
            </div>

            {/* Top Users Table */}
            {userAccountsSummary.topUsers && userAccountsSummary.topUsers.length > 0 && (
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                <h4 className="text-sm font-semibold text-blue-400 mb-3">📊 Top 10 Users by Balance</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Email</th>
                        <th className="text-right py-2 px-2 text-gray-400 font-medium">ERC20</th>
                        <th className="text-right py-2 px-2 text-gray-400 font-medium">BEP20</th>
                        <th className="text-right py-2 px-2 text-gray-400 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userAccountsSummary.topUsers.map((user: any, index: number) => (
                        <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                          <td className="py-2 px-2 text-white">{user.email}</td>
                          <td className="py-2 px-2 text-right text-blue-400">${user.erc20Balance.toFixed(2)}</td>
                          <td className="py-2 px-2 text-right text-yellow-400">${user.bep20Balance.toFixed(2)}</td>
                          <td className="py-2 px-2 text-right text-green-400 font-semibold">${user.totalBalance.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800/30 rounded-lg p-8 border border-gray-700 text-center">
            <p className="text-gray-400">Click &ldquo;Scan All Users&rdquo; to fetch real-time USDT balances from blockchain</p>
            <p className="text-gray-500 text-sm mt-2">
              This will scan all user wallets on Ethereum & BSC Mainnet
            </p>
          </div>
        )}
      </div>

      {/* Sweep Configuration */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Sweep Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Network
            </label>
            <select
              value={selectedNetwork}
              onChange={(e) => {
                setSelectedNetwork(e.target.value as any);
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            >
              <option value="BSC_MAINNET">🟢 BSC Mainnet</option>
              <option value="ETHEREUM_MAINNET">🔷 Ethereum Mainnet</option>
            </select>
            <p className="text-gray-500 text-xs mt-1">
              Current mode: <span className="text-green-400 font-semibold">MAINNET</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token Type
            </label>
            <select
              value={tokenType}
              onChange={(e) => {
                setTokenType(e.target.value as any);
                if (e.target.value !== 'CUSTOM') {
                  setCustomTokenAddress('');
                }
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            >
              <option value="USDT">💵 USDT (Stablecoin)</option>
              <option value="NATIVE">⚡ Native ({selectedNetwork.includes('BSC') ? 'BNB' : 'ETH'})</option>
              <option value="CUSTOM">🔧 Custom Token (ERC-20/BEP-20)</option>
            </select>
            <p className="text-gray-500 text-xs mt-1">
              {tokenType === 'USDT' && 'Sweep USDT stablecoin'}
              {tokenType === 'NATIVE' && `Sweep native ${selectedNetwork.includes('BSC') ? 'BNB' : 'ETH'}`}
              {tokenType === 'CUSTOM' && 'Sweep custom ERC-20/BEP-20 token'}
            </p>
          </div>
        </div>

        {/* Custom Token Address Input */}
        {tokenType === 'CUSTOM' && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom Token Address
              </label>
              <input
                type="text"
                value={customTokenAddress}
                onChange={(e) => setCustomTokenAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
              <p className="text-gray-500 text-xs mt-1">
                Enter the token contract address for {selectedNetwork.includes('BSC') ? 'BEP-20' : 'ERC-20'} token
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Token Decimals (Manual Override)
              </label>
              <input
                type="number"
                min="0"
                max="18"
                value={tokenDecimals}
                onChange={(e) => setTokenDecimals(parseInt(e.target.value) || 18)}
                placeholder="18"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
              <p className="text-gray-500 text-xs mt-1">
                💡 Usually 18 for most tokens. Click refresh button above to auto-fetch from blockchain.
              </p>
            </div>
          </div>
        )}

        {/* Token Info Display */}
        {tokenInfoLoading ? (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
              <p className="text-blue-400 text-sm">Loading token information...</p>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-400 mb-2">📋 Token Information</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Symbol</p>
                    <p className="text-white font-semibold">{tokenSymbol}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Name</p>
                    <p className="text-white font-semibold text-sm">{tokenName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Decimals</p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="18"
                        value={tokenDecimals}
                        onChange={(e) => setTokenDecimals(parseInt(e.target.value) || 18)}
                        className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        title="Manual override (editable)"
                      />
                      <span className="text-gray-500 text-xs">✏️</span>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={fetchTokenInfo}
                      className="text-blue-400 hover:text-blue-300 text-xs flex items-center space-x-1 transition"
                      title="Refresh from blockchain"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Auto-fetch</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-500/20">
              <p className="text-gray-400 text-xs">
                💡 <strong>Minimum Amount Calculation:</strong> User input {minAmount} {tokenSymbol} = {minAmount} × 10^{tokenDecimals} = {(minAmount * Math.pow(10, tokenDecimals)).toLocaleString()} (raw value)
              </p>
              {tokenType === 'NATIVE' && (
                <p className="text-yellow-400 text-xs mt-2">
                  ⚠️ <strong>Note:</strong> Native {tokenSymbol} is not an ERC-20/BEP-20 token. The 18 decimals is blockchain convention (1 {tokenSymbol} = 10^18 wei), not from a contract.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Minimum Amount
            </label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(Number(e.target.value))}
              min="0"
              step={tokenType === 'NATIVE' ? '0.001' : '10'}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              placeholder={tokenType === 'NATIVE' ? '0.01' : '10'}
            />
            <p className="text-gray-500 text-xs mt-1">
              Only sweep wallets with balance ≥ this amount
              {tokenType === 'USDT' && ' USDT'}
              {tokenType === 'NATIVE' && ` ${selectedNetwork.includes('BSC') ? 'BNB' : 'ETH'}`}
              {tokenType === 'CUSTOM' && ' tokens'}
            </p>
          </div>
        </div>
      </div>

      {/* Sweep Button */}
      <button
        onClick={handleSweepWallets}
        disabled={sweepLoading}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mb-6"
      >
        {sweepLoading ? (
          <>
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg">Sweeping Wallets...</span>
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-lg">🚀 Kumpulkan Saldo ke Master Wallet</span>
          </>
        )}
      </button>

      {/* Warning Notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-6">
        <div className="flex items-start space-x-3">
          <svg className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-sm text-yellow-300">
            <p className="font-semibold mb-2 text-base">⚠️ Important Security Notice</p>
            <ul className="list-disc list-inside space-y-1.5 text-yellow-200">
              <li>This will transfer <strong>ALL user USDT</strong> from individual wallets to master wallet</li>
              <li>Requires <strong>BNB/ETH for gas fees</strong> in each user wallet to execute transfer</li>
              <li><strong>Action cannot be undone</strong> - use with extreme caution</li>
              <li>Only wallets with balance <strong>≥ minimum amount</strong> will be swept</li>
              <li>This implements the <strong>Binance/Coinbase custodial model</strong> (1 master wallet vs 1000 individual wallets)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sweep Results */}
      {sweepResults && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h4 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Sweep Results - {sweepResults.summary.tokenSymbol || 'Token'}</span>
          </h4>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 text-sm mb-1">✅ Successful</p>
              <p className="text-3xl font-bold text-white">{sweepResults.summary.success}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm mb-1">❌ Failed</p>
              <p className="text-3xl font-bold text-white">{sweepResults.summary.failed}</p>
            </div>
            <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">⏭️ Skipped</p>
              <p className="text-3xl font-bold text-white">{sweepResults.summary.skipped}</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <p className="text-purple-400 text-sm mb-1">💰 Total Swept</p>
              <p className="text-3xl font-bold text-white">{sweepResults.summary.totalSwept.toFixed(6)} {sweepResults.summary.tokenSymbol}</p>
            </div>
          </div>

          {/* Detailed Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left p-3 text-gray-300 font-semibold">User</th>
                  <th className="text-left p-3 text-gray-300 font-semibold">Wallet Address</th>
                  <th className="text-right p-3 text-gray-300 font-semibold">Balance</th>
                  <th className="text-right p-3 text-gray-300 font-semibold">Swept Amount</th>
                  <th className="text-center p-3 text-gray-300 font-semibold">Status</th>
                  <th className="text-left p-3 text-gray-300 font-semibold">TX Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sweepResults.results.slice((sweepResultsPage - 1) * sweepResultsPerPage, sweepResultsPage * sweepResultsPerPage).map((result: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-700/30 transition">
                    <td className="p-3 text-white text-xs">
                      <div className="font-semibold">{result.userEmail}</div>
                      <div className="text-gray-400 font-mono text-[10px]">{result.userId.slice(0, 12)}...</div>
                    </td>
                    <td className="p-3 text-gray-300 font-mono text-xs">
                      {result.walletAddress ? `${result.walletAddress.slice(0, 10)}...${result.walletAddress.slice(-8)}` : '-'}
                    </td>
                    <td className="p-3 text-right text-gray-400 font-semibold">
                      {result.balance} {result.tokenSymbol}
                    </td>
                    <td className="p-3 text-right text-white font-semibold">
                      {result.sweptAmount} {result.tokenSymbol}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        {result.status === 'success' && (
                          <span className="text-green-400 flex items-center space-x-1 bg-green-500/10 px-3 py-1 rounded-full">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Success</span>
                          </span>
                        )}
                        {result.status === 'failed' && (
                          <span className="text-red-400 flex items-center space-x-1 bg-red-500/10 px-3 py-1 rounded-full">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>Failed</span>
                          </span>
                        )}
                        {result.status === 'skipped' && (
                          <span className="text-gray-400 bg-gray-500/10 px-3 py-1 rounded-full">Skipped</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {result.txHash ? (
                        <a
                          href={`${getExplorerUrl(selectedNetwork)}/tx/${result.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 font-mono text-xs flex items-center space-x-1"
                        >
                          <span>{result.txHash.slice(0, 12)}...</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination for Sweep Results */}
          {sweepResults.results.length > sweepResultsPerPage && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-700 pt-4">
              <div className="text-sm text-gray-400">
                Showing {((sweepResultsPage - 1) * sweepResultsPerPage) + 1} - {Math.min(sweepResultsPage * sweepResultsPerPage, sweepResults.results.length)} of {sweepResults.results.length} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSweepResultsPage(p => Math.max(1, p - 1))}
                  disabled={sweepResultsPage === 1}
                  className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {sweepResultsPage} of {Math.ceil(sweepResults.results.length / sweepResultsPerPage)}
                </span>
                <button
                  onClick={() => setSweepResultsPage(p => Math.min(Math.ceil(sweepResults.results.length / sweepResultsPerPage), p + 1))}
                  disabled={sweepResultsPage >= Math.ceil(sweepResults.results.length / sweepResultsPerPage)}
                  className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Error Details */}
          {sweepResults.results.some((r: any) => r.status === 'failed') && (
            <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <h5 className="text-red-400 font-semibold mb-2">Failed Transactions Details:</h5>
              <ul className="space-y-1 text-sm text-red-300">
                {sweepResults.results
                  .filter((r: any) => r.status === 'failed')
                  .slice((failedTxPage - 1) * failedTxPerPage, failedTxPage * failedTxPerPage)
                  .map((result: any, index: number) => (
                    <li key={index} className="font-mono text-xs">
                      • {result.userId.slice(0, 12)}: {result.error || 'Unknown error'}
                    </li>
                  ))}
              </ul>

              {/* Pagination for Failed Transactions */}
              {sweepResults.results.filter((r: any) => r.status === 'failed').length > failedTxPerPage && (
                <div className="mt-4 flex items-center justify-between border-t border-red-500/30 pt-3">
                  <div className="text-xs text-red-400">
                    Showing {((failedTxPage - 1) * failedTxPerPage) + 1} - {Math.min(failedTxPage * failedTxPerPage, sweepResults.results.filter((r: any) => r.status === 'failed').length)} of {sweepResults.results.filter((r: any) => r.status === 'failed').length} failed transactions
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFailedTxPage(p => Math.max(1, p - 1))}
                      disabled={failedTxPage === 1}
                      className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-red-400">
                      Page {failedTxPage} of {Math.ceil(sweepResults.results.filter((r: any) => r.status === 'failed').length / failedTxPerPage)}
                    </span>
                    <button
                      onClick={() => setFailedTxPage(p => Math.min(Math.ceil(sweepResults.results.filter((r: any) => r.status === 'failed').length / failedTxPerPage), p + 1))}
                      disabled={failedTxPage >= Math.ceil(sweepResults.results.filter((r: any) => r.status === 'failed').length / failedTxPerPage)}
                      className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-200">
              <p className="font-semibold mb-2">How It Works</p>
              <ul className="space-y-1">
                <li>• Scans all user wallets for USDT balance</li>
                <li>• Transfers funds to master wallet automatically</li>
                <li>• Skips wallets below minimum amount</li>
                <li>• Updates user internal balance records</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div className="text-sm text-purple-200">
              <p className="font-semibold mb-2">Security Benefits</p>
              <ul className="space-y-1">
                <li>• 1 master key vs 1000 individual keys</li>
                <li>• Industry standard (Binance/Coinbase)</li>
                <li>• Easier to secure with hardware wallet</li>
                <li>• Lower gas costs (batch transactions)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
