'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface WalletData {
  erc20Address: string;
  bep20Address: string;
  balance: number;
}

export default function TestTopUpPage() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNetwork, setActiveNetwork] = useState<'ERC20' | 'BEP20'>('ERC20');
  const [copied, setCopied] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Generate QR code when wallet data or network changes
  useEffect(() => {
    if (walletData) {
      const address = activeNetwork === 'ERC20' ? walletData.erc20Address : walletData.bep20Address;
      if (address) {
        generateQRCode(address);
      }
    }
  }, [walletData, activeNetwork]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wallet/test-topup');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWalletData(data);
        } else {
          console.error('Failed to fetch wallet data:', data.error);
          // Auto-generate if no wallet exists
          if (data.redirectUrl) {
            await generateTestWallet();
          }
        }
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTestWallet = async () => {
    try {
      const response = await fetch('/api/wallet/test-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ network: 'ethereum' })
      });
      
      if (response.ok) {
        // Fetch wallet data again after generation
        await fetchWalletData();
      }
    } catch (error) {
      console.error('Error generating test wallet:', error);
    }
  };

  const generateQRCode = async (address: string) => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(address, {
        width: 128,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading test wallet...</p>
        </div>
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load test wallet</p>
          <button 
            onClick={generateTestWallet}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Generate Test Wallet
          </button>
        </div>
      </div>
    );
  }

  const currentAddress = activeNetwork === 'ERC20' ? walletData.erc20Address : walletData.bep20Address;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            QR Code Test - USDT Top Up
          </h1>
          <p className="text-gray-400 mt-2">Testing QR code generation for wallet addresses</p>
        </div>

        {/* Main Content */}
        <div className="bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/10 p-8">
          {/* Network Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveNetwork('ERC20')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeNetwork === 'ERC20'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>🔷</span>
                    <span>ERC20 (Ethereum)</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveNetwork('BEP20')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeNetwork === 'BEP20'
                      ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>🟡</span>
                    <span>BEP20 (BSC)</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Wallet Info */}
            <div className="space-y-6">
              {/* Balance */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Current Balance</span>
                  <span className="text-2xl font-bold text-white">{walletData.balance.toFixed(2)} USDT</span>
                </div>
              </div>

              {/* Address Display */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">
                    {activeNetwork} Wallet Address
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-black/20 rounded-lg p-3">
                    <p className="text-sm font-mono text-white break-all">
                      {currentAddress}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(currentAddress, 'address')}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-colors group"
                    title="Copy address"
                  >
                    {copied === 'address' ? (
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Network Info */}
              <div className="bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-400">Network: {activeNetwork === 'ERC20' ? 'Ethereum' : 'Binance Smart Chain'}</p>
                    <p className="text-xs text-yellow-300 mt-1">
                      Only send USDT tokens on this network. Wrong network = permanent loss.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: QR Code */}
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center">
                <h3 className="text-lg font-semibold text-white mb-4">QR Code</h3>
                <div className="w-48 h-48 bg-white rounded-lg mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  {qrCodeUrl ? (
                    <img 
                      src={qrCodeUrl} 
                      alt="Wallet Address QR Code"
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="text-gray-500">Generating QR...</div>
                  )}
                </div>
                <p className="text-sm text-gray-400">Scan this QR code to get the wallet address</p>
                <p className="text-xs text-gray-500 mt-2">Address: {currentAddress?.slice(0, 10)}...{currentAddress?.slice(-8)}</p>
              </div>

              {/* QR Code Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => generateQRCode(currentAddress)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Regenerate QR
                </button>
                <button
                  onClick={() => window.open(`data:image/png;base64,${qrCodeUrl.split(',')[1]}`, '_blank')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  disabled={!qrCodeUrl}
                >
                  Download QR
                </button>
              </div>
            </div>
          </div>

          {/* Test Links */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <h4 className="text-lg font-semibold text-white mb-4">Test Links</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/api/wallet/test-rpc" target="_blank" className="bg-blue-600 hover:bg-blue-700 text-white text-center py-3 px-4 rounded-lg font-medium transition-colors">
                Test RPC
              </a>
              <a href="/api/wallet/test-get" target="_blank" className="bg-green-600 hover:bg-green-700 text-white text-center py-3 px-4 rounded-lg font-medium transition-colors">
                Test Wallet Data
              </a>
              <a href="/dashboard/topup" className="bg-purple-600 hover:bg-purple-700 text-white text-center py-3 px-4 rounded-lg font-medium transition-colors">
                Main Topup Page
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}