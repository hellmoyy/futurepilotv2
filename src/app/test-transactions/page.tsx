'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Transaction {
  id: string;
  network: 'ERC20' | 'BEP20';
  txHash: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
}

export default function TestTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wallet/test-transactions-get');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTransactions(result.data.transactions);
          setSummary(result.data.summary);
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSampleTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wallet/test-transactions', {
        method: 'POST'
      });
      if (response.ok) {
        // Refresh transactions after creating samples
        await fetchTransactions();
      }
    } catch (error) {
      console.error('Error creating sample transactions:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading transaction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Transaction History Test
          </h1>
          <p className="text-gray-400 mt-2">Testing transaction history functionality</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{summary.total}</div>
              <div className="text-sm text-gray-400">Total</div>
            </div>
            <div className="bg-green-500/10 backdrop-blur-xl border border-green-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{summary.confirmed}</div>
              <div className="text-sm text-gray-400">Confirmed</div>
            </div>
            <div className="bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{summary.pending}</div>
              <div className="text-sm text-gray-400">Pending</div>
            </div>
            <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{summary.failed}</div>
              <div className="text-sm text-gray-400">Failed</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4 justify-center">
          <button
            onClick={fetchTransactions}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Refresh Transactions
          </button>
          <button
            onClick={createSampleTransactions}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Create Sample Data
          </button>
        </div>

        {/* Transaction History */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <span>📊</span>
            <span>Transaction History</span>
          </h3>
          
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-400 mb-4">No transactions yet</p>
              <button
                onClick={createSampleTransactions}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Create Sample Transactions
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Network</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Transaction</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Image
                            src={tx.network === 'ERC20' ? '/images/icon-coin/etehreum.webp' : '/images/icon-coin/bnb.png'}
                            alt={tx.network === 'ERC20' ? 'Ethereum' : 'BNB'}
                            width={20}
                            height={20}
                            className="w-5 h-5"
                          />
                          <span className="text-white font-medium">{tx.network}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-green-400 font-semibold">
                        +${tx.amount.toFixed(2)} USDT
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          tx.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                          tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <a
                          href={`https://${tx.network === 'ERC20' ? 'etherscan.io' : 'bscscan.com'}/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 font-mono text-sm"
                        >
                          {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                        </a>
                      </td>
                      <td className="py-4 px-4 text-gray-400">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="text-center">
          <div className="space-x-4">
            <a href="/dashboard/topup" className="text-blue-400 hover:text-blue-300">
              Main Topup Page
            </a>
            <a href="/test-topup" className="text-blue-400 hover:text-blue-300">
              Test Topup Page
            </a>
            <a href="/api/wallet/test-transactions-get" target="_blank" className="text-blue-400 hover:text-blue-300">
              View Raw API Data
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}