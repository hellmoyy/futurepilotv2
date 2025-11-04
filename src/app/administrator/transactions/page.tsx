'use client';

import { useEffect, useState } from 'react';

interface Transaction {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  type: 'deposit' | 'withdrawal' | 'commission' | 'referral_bonus' | 'trading_profit' | 'trading_loss';
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  description?: string;
  txHash?: string;
  network?: string;
  walletAddress?: string;
  metadata?: any;
  createdAt: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/admin/transactions');
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      (transaction.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.userId?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.txHash || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    const transactionDate = new Date(transaction.createdAt);
    const matchesDateFrom = !dateFrom || transactionDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || transactionDate <= new Date(dateTo + 'T23:59:59');
    
    return matchesSearch && matchesType && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter, searchTerm, dateFrom, dateTo, itemsPerPage]);

  // Calculate stats
  const stats = {
    total: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
    deposits: transactions.filter(t => t.type === 'deposit' && t.status === 'confirmed').reduce((sum, t) => sum + t.amount, 0),
    withdrawals: transactions.filter(t => t.type === 'withdrawal' && t.status === 'confirmed').reduce((sum, t) => sum + Math.abs(t.amount), 0),
    commissions: transactions.filter(t => (t.type === 'commission' || t.type === 'referral_bonus') && t.status === 'confirmed').reduce((sum, t) => sum + t.amount, 0),
    confirmed: transactions.filter(t => t.status === 'confirmed').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    failed: transactions.filter(t => t.status === 'failed').length,
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      deposit: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      ),
      withdrawal: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      ),
      commission: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      referral_bonus: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      trading_profit: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      trading_loss: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      ),
    };
    return icons[type as keyof typeof icons] || icons.deposit;
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      deposit: 'bg-green-500/10 text-green-500 border-green-500/50',
      withdrawal: 'bg-red-500/10 text-red-500 border-red-500/50',
      commission: 'bg-blue-500/10 text-blue-500 border-blue-500/50',
      referral_bonus: 'bg-purple-500/10 text-purple-500 border-purple-500/50',
      trading_profit: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50',
      trading_loss: 'bg-orange-500/10 text-orange-500 border-orange-500/50',
    };
    return styles[type as keyof typeof styles] || styles.deposit;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50',
      confirmed: 'bg-green-500/10 text-green-500 border-green-500/50',
      failed: 'bg-red-500/10 text-red-500 border-red-500/50',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Email', 'Type', 'Amount', 'Status', 'TxHash', 'Description'];
    const rows = filteredTransactions.map(t => [
      new Date(t.createdAt).toLocaleString(),
      t.userId?.name || 'Unknown',
      t.userId?.email || '-',
      t.type,
      t.amount.toFixed(2),
      t.status,
      t.txHash || '-',
      t.description || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Transaction History</h1>
          <p className="text-gray-400">Monitor all platform transactions and activities</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchTransactions}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-200">Total Transactions</p>
            <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm text-purple-200 mt-1">${stats.totalAmount.toFixed(2)} volume</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-200">Total Deposits</p>
            <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
          <p className="text-3xl font-bold">${stats.deposits.toFixed(2)}</p>
          <p className="text-sm text-green-200 mt-1">Incoming funds</p>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-red-200">Total Withdrawals</p>
            <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </div>
          <p className="text-3xl font-bold">${stats.withdrawals.toFixed(2)}</p>
          <p className="text-sm text-red-200 mt-1">Outgoing funds</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-200">Total Commissions</p>
            <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">${stats.commissions.toFixed(2)}</p>
          <p className="text-sm text-blue-200 mt-1">Earned rewards</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by user, email, or transaction hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="commission">Commission</option>
              <option value="referral_bonus">Referral Bonus</option>
              <option value="trading_profit">Trading Profit</option>
              <option value="trading_loss">Trading Loss</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date & Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Description</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    {filteredTransactions.length === 0 ? 'No transactions found' : 'No results for current page'}
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">
                        {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {new Date(transaction.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{transaction.userId?.name || 'Unknown'}</p>
                        <p className="text-gray-400 text-sm">{transaction.userId?.email || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-full border ${getTypeBadge(transaction.type || 'deposit')}`}>
                          {getTypeIcon(transaction.type || 'deposit')}
                          <span>{(transaction.type || 'deposit').replace('_', ' ').toUpperCase()}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`font-bold text-lg ${transaction.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {transaction.amount >= 0 ? '+' : ''}{transaction.amount >= 0 ? '$' : '-$'}{Math.abs(transaction.amount).toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(transaction.status)}`}>
                        {transaction.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300 text-sm max-w-xs truncate">
                        {transaction.description || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(transaction)}
                        className="text-blue-500 hover:text-blue-400 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredTransactions.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-400">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded text-sm ${
                        currentPage === pageNum
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Transaction Details</h3>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">User</p>
                  <p className="text-white font-semibold text-lg">{selectedTransaction.userId?.name || 'Unknown'}</p>
                  <p className="text-gray-400 text-sm">{selectedTransaction.userId?.email || '-'}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Type</p>
                  <span className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-full border ${getTypeBadge(selectedTransaction.type || 'deposit')}`}>
                    {getTypeIcon(selectedTransaction.type || 'deposit')}
                    <span>{(selectedTransaction.type || 'deposit').replace('_', ' ').toUpperCase()}</span>
                  </span>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(selectedTransaction.status || 'pending')}`}>
                    {(selectedTransaction.status || 'pending').toUpperCase()}
                  </span>
                </div>

                <div className="col-span-2 bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Amount</p>
                  <p className={`font-bold text-3xl ${selectedTransaction.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedTransaction.amount >= 0 ? '+' : ''}{selectedTransaction.amount >= 0 ? '$' : '-$'}{Math.abs(selectedTransaction.amount).toFixed(2)}
                  </p>
                </div>

                {selectedTransaction.description && (
                  <div className="col-span-2 bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Description</p>
                    <p className="text-white">{selectedTransaction.description}</p>
                  </div>
                )}

                {selectedTransaction.txHash && (
                  <div className="col-span-2 bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Transaction Hash</p>
                    <p className="text-white font-mono text-sm break-all">{selectedTransaction.txHash}</p>
                  </div>
                )}

                {selectedTransaction.network && (
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Network</p>
                    <p className="text-white font-medium">{selectedTransaction.network}</p>
                  </div>
                )}

                {selectedTransaction.walletAddress && (
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Wallet Address</p>
                    <p className="text-white font-mono text-xs break-all">{selectedTransaction.walletAddress}</p>
                  </div>
                )}

                <div className="col-span-2 bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Date & Time</p>
                  <p className="text-white">
                    {new Date(selectedTransaction.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
