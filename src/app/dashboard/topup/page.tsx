'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import QRCode from 'qrcode';

interface WalletData {
  erc20Address: string;
  bep20Address: string;
  balance: number;
}

interface Transaction {
  id: string;
  network: 'ERC20' | 'BEP20';
  txHash: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
}

export default function TopUpPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeNetwork, setActiveNetwork] = useState<'ERC20' | 'BEP20'>('ERC20');
  const [copied, setCopied] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchWalletData();
      fetchTransactions();
    }
  }, [status]);

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
      const response = await fetch('/api/wallet/get');
      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/wallet/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const generateWallet = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/wallet/generate', {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      }
    } catch (error) {
      console.error('Error generating wallet:', error);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
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

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 light:text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent light:from-blue-600 light:via-blue-700 light:to-cyan-600">
            USDT Top Up
          </h1>
          <p className="text-gray-400 mt-1 light:text-gray-600">Deposit USDT to add balance for trading</p>
        </div>
        
        {/* Balance Display */}
        <div className="bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 p-4 light:bg-blue-50 light:border-blue-200">
          <p className="text-sm text-gray-400 light:text-gray-600">Current Balance</p>
          <p className="text-2xl font-bold text-white light:text-gray-900">
            ${walletData?.balance.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Network Selection */}
      <div className="flex bg-white/5 backdrop-blur-xl rounded-xl p-1 light:bg-blue-100 w-fit">
        {(['ERC20', 'BEP20'] as const).map((network) => (
          <button
            key={network}
            onClick={() => setActiveNetwork(network)}
            className={`relative px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeNetwork === network
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/10 light:text-gray-600 light:hover:text-gray-800 light:hover:bg-blue-200'
            }`}
          >
            <span>{network === 'ERC20' ? '🔷' : '🟡'}</span>
            <span>
              {network === 'ERC20' ? 'Ethereum (ERC-20)' : 'Binance Smart Chain (BEP-20)'}
            </span>
          </button>
        ))}
      </div>

      {/* Wallet Section */}
      {!walletData ? (
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl opacity-50 light:from-green-200/40 light:to-emerald-200/40"></div>
          <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/10 p-8 text-center light:bg-gradient-to-br light:from-white light:to-green-50 light:border-green-200">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-3xl light:from-green-100/50 light:to-emerald-100/50"></div>
            
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3 light:text-gray-900">
                Generate Your USDT Wallet
              </h2>
              
              <p className="text-gray-400 mb-6 max-w-md mx-auto light:text-gray-600">
                Create a unique wallet address for USDT deposits. Your wallet will support both ERC-20 and BEP-20 networks.
              </p>
              
              <button
                onClick={generateWallet}
                disabled={generating}
                className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl font-semibold overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center space-x-2 text-white">
                  {generating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Generate Wallet</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deposit Address Card */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-xl opacity-50 light:from-blue-200/40 light:to-cyan-200/40"></div>
            <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/10 p-6 light:bg-gradient-to-br light:from-white light:to-blue-50 light:border-blue-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-3xl light:from-blue-100/50 light:to-cyan-100/50"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white light:text-gray-900 flex items-center space-x-2">
                    <span>{activeNetwork === 'ERC20' ? '🔷' : '🟡'}</span>
                    <span>Deposit Address</span>
                  </h3>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-green-400 font-medium">Active</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 light:bg-blue-50 light:border-blue-200">
                    <p className="text-xs text-gray-400 mb-2 light:text-gray-600">
                      {activeNetwork} Address:
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-mono text-gray-300 truncate mr-2 light:text-gray-700">
                        {activeNetwork === 'ERC20' ? walletData.erc20Address : walletData.bep20Address}
                      </p>
                      <button
                        onClick={() => copyToClipboard(
                          activeNetwork === 'ERC20' ? walletData.erc20Address : walletData.bep20Address,
                          activeNetwork
                        )}
                        className="group px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all light:bg-blue-100 light:border-blue-300 light:hover:bg-blue-200"
                      >
                        {copied === activeNetwork ? (
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors light:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center light:bg-blue-50 light:border-blue-200">
                    <div className="w-32 h-32 bg-white rounded-lg mx-auto mb-3 flex items-center justify-center overflow-hidden">
                      {qrCodeUrl ? (
                        <img 
                          src={qrCodeUrl} 
                          alt="Wallet Address QR Code"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-xs text-gray-500">Generating QR...</div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 light:text-gray-600">Scan to get address</p>
                  </div>

                  {/* Network Info */}
                  <div className="bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-4 light:bg-yellow-100 light:border-yellow-300">
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-yellow-400 mt-0.5 light:text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-yellow-400 light:text-yellow-700">Important Notice</p>
                        <p className="text-xs text-yellow-300 mt-1 light:text-yellow-600">
                          Only send USDT tokens to this address on {activeNetwork === 'ERC20' ? 'Ethereum' : 'Binance Smart Chain'} network. 
                          Sending other tokens or using wrong network may result in permanent loss.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions & Tips */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl opacity-50 light:from-purple-200/40 light:to-pink-200/40"></div>
            <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/10 p-6 h-full light:bg-gradient-to-br light:from-white light:to-purple-50 light:border-purple-200">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl light:from-purple-100/50 light:to-pink-100/50"></div>
              
              <div className="relative h-full flex flex-col">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-3 light:from-purple-200 light:to-pink-200">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white light:text-gray-900">How to Deposit</h3>
                </div>

                <div className="space-y-4 flex-1">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <p className="text-sm font-medium text-white light:text-gray-900">Copy Address</p>
                      <p className="text-xs text-gray-400 light:text-gray-600">Copy the wallet address above or scan QR code</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <p className="text-sm font-medium text-white light:text-gray-900">Send USDT</p>
                      <p className="text-xs text-gray-400 light:text-gray-600">Transfer USDT from your external wallet</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <p className="text-sm font-medium text-white light:text-gray-900">Auto Credit</p>
                      <p className="text-xs text-gray-400 light:text-gray-600">Balance updates automatically after confirmation</p>
                    </div>
                  </div>

                  <div className="bg-green-500/10 backdrop-blur-xl border border-green-500/30 rounded-xl p-4 light:bg-green-100 light:border-green-300">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-4 h-4 text-green-400 light:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <p className="text-sm font-medium text-green-400 light:text-green-700">Fast Processing</p>
                    </div>
                    <p className="text-xs text-green-300 light:text-green-600">
                      • ERC-20: ~2-5 minutes<br/>
                      • BEP-20: ~30 seconds<br/>
                      • Minimum: $10 USDT
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      {walletData && (
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-gray-500/10 to-gray-600/10 blur-xl light:from-gray-200/30 light:to-gray-300/30"></div>
          <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/10 p-6 light:bg-gradient-to-br light:from-white light:to-gray-50 light:border-gray-200">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-transparent rounded-3xl light:from-gray-100/50"></div>
            
            <div className="relative">
              <h3 className="text-xl font-semibold text-white mb-6 light:text-gray-900 flex items-center space-x-2">
                <span>📊</span>
                <span>Transaction History</span>
              </h3>
              
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-4 light:bg-gray-100">
                    <svg className="w-8 h-8 text-gray-500 light:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-400 mb-2 light:text-gray-600">No transactions yet</p>
                  <p className="text-gray-500 text-sm light:text-gray-600">Your deposit history will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 light:border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Network</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Transaction</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors light:border-gray-100 light:hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <span>{tx.network === 'ERC20' ? '🔷' : '🟡'}</span>
                              <span className="text-white font-medium light:text-gray-900">{tx.network}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-green-400 font-semibold light:text-green-600">
                            +${tx.amount.toFixed(2)} USDT
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              tx.status === 'confirmed' ? 'bg-green-500/20 text-green-300 light:bg-green-100 light:text-green-700' :
                              tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 light:bg-yellow-100 light:text-yellow-700' :
                              'bg-red-500/20 text-red-300 light:bg-red-100 light:text-red-700'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <a
                              href={`https://${tx.network === 'ERC20' ? 'etherscan.io' : 'bscscan.com'}/tx/${tx.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 font-mono text-sm light:text-blue-600 light:hover:text-blue-700"
                            >
                              {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                            </a>
                          </td>
                          <td className="py-4 px-4 text-gray-400 light:text-gray-700">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Support Info */}
      <div className="bg-blue-500/10 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 light:bg-blue-100 light:border-blue-300">
        <h3 className="text-blue-400 font-semibold mb-2 flex items-center space-x-2 light:text-blue-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Need Help?</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-gray-400 text-sm light:text-gray-700 mb-2">
              <strong>Supported Networks:</strong><br/>
              • Ethereum (ERC-20)<br/>
              • Binance Smart Chain (BEP-20)
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm light:text-gray-700">
              <strong>Processing Time:</strong><br/>
              • Confirmations required: 12 blocks<br/>
              • Contact support if delayed &gt;30 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
