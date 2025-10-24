'use client';

import { useEffect, useState } from 'react';

interface Withdrawal {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  walletAddress: string;
  network: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  txHash?: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve');
  const [txHash, setTxHash] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Fetch withdrawals
  const fetchWithdrawals = async () => {
    try {
      const response = await fetch('/api/admin/withdrawals');
      const data = await response.json();
      
      if (data.success) {
        setWithdrawals(data.withdrawals);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  // Filter withdrawals
  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = 
      (withdrawal.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (withdrawal.userId?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.walletAddress.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || withdrawal.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    approved: withdrawals.filter(w => w.status === 'approved').length,
    completed: withdrawals.filter(w => w.status === 'completed').length,
    totalAmount: withdrawals.reduce((sum, w) => sum + w.amount, 0),
    pendingAmount: withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0),
  };

  const handleViewDetails = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailsModal(true);
  };

  const handleProcessWithdrawal = (withdrawal: Withdrawal, action: 'approve' | 'reject') => {
    setSelectedWithdrawal(withdrawal);
    setProcessAction(action);
    setTxHash('');
    setNotes('');
    setShowProcessModal(true);
  };

  const submitProcessWithdrawal = async () => {
    if (!selectedWithdrawal) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${selectedWithdrawal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: processAction,
          txHash: processAction === 'approve' ? txHash : undefined,
          notes,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Withdrawal ${processAction}d successfully!`);
        setShowProcessModal(false);
        fetchWithdrawals();
      } else {
        alert(data.message || 'Failed to process withdrawal');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert('Failed to process withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50',
      approved: 'bg-blue-500/10 text-blue-500 border-blue-500/50',
      rejected: 'bg-red-500/10 text-red-500 border-red-500/50',
      completed: 'bg-green-500/10 text-green-500 border-green-500/50',
    };
    return styles[status as keyof typeof styles] || styles.pending;
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
          <h1 className="text-3xl font-bold text-white mb-2">Withdrawal Management</h1>
          <p className="text-gray-400">Review and process user withdrawal requests</p>
        </div>
        <button
          onClick={fetchWithdrawals}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-200">Total Requests</p>
            <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm text-purple-200 mt-1">${stats.totalAmount.toFixed(2)} total</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-yellow-200">Pending</p>
            <svg className="w-8 h-8 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.pending}</p>
          <p className="text-sm text-yellow-200 mt-1">${stats.pendingAmount.toFixed(2)} pending</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-200">Approved</p>
            <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.approved}</p>
          <p className="text-sm text-blue-200 mt-1">Awaiting transfer</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-200">Completed</p>
            <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.completed}</p>
          <p className="text-sm text-green-200 mt-1">Successfully processed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by user name, email, or wallet address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'approved', 'rejected', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Wallet Address</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Network</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Requested</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No withdrawals found
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal._id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{withdrawal.userId?.name || 'Unknown'}</p>
                        <p className="text-gray-400 text-sm">{withdrawal.userId?.email || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-semibold text-lg">${withdrawal.amount.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300 font-mono text-sm break-all max-w-xs">
                        {withdrawal.walletAddress.slice(0, 10)}...{withdrawal.walletAddress.slice(-8)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-gray-700 text-gray-300 border border-gray-600">
                        {withdrawal.network}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(withdrawal.status)}`}>
                        {withdrawal.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300 text-sm">
                        {new Date(withdrawal.requestedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(withdrawal)}
                          className="text-blue-500 hover:text-blue-400 text-sm font-medium"
                        >
                          View
                        </button>
                        {withdrawal.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleProcessWithdrawal(withdrawal, 'approve')}
                              className="text-green-500 hover:text-green-400 text-sm font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleProcessWithdrawal(withdrawal, 'reject')}
                              className="text-red-500 hover:text-red-400 text-sm font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Withdrawal Details</h3>
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
                  <p className="text-white font-semibold text-lg">{selectedWithdrawal.userId?.name || 'Unknown'}</p>
                  <p className="text-gray-400 text-sm">{selectedWithdrawal.userId?.email || '-'}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Amount</p>
                  <p className="text-white font-bold text-2xl">${selectedWithdrawal.amount.toFixed(2)}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(selectedWithdrawal.status)}`}>
                    {selectedWithdrawal.status.toUpperCase()}
                  </span>
                </div>

                <div className="col-span-2 bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Wallet Address</p>
                  <p className="text-white font-mono text-sm break-all">{selectedWithdrawal.walletAddress}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Network</p>
                  <p className="text-white font-medium">{selectedWithdrawal.network}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Requested At</p>
                  <p className="text-white text-sm">
                    {new Date(selectedWithdrawal.requestedAt).toLocaleString()}
                  </p>
                </div>

                {selectedWithdrawal.txHash && (
                  <div className="col-span-2 bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Transaction Hash</p>
                    <p className="text-white font-mono text-sm break-all">{selectedWithdrawal.txHash}</p>
                  </div>
                )}

                {selectedWithdrawal.notes && (
                  <div className="col-span-2 bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Notes</p>
                    <p className="text-white">{selectedWithdrawal.notes}</p>
                  </div>
                )}
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

      {/* Process Modal */}
      {showProcessModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">
                {processAction === 'approve' ? 'Approve' : 'Reject'} Withdrawal
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">User</p>
                <p className="text-white font-semibold">{selectedWithdrawal.userId?.name}</p>
                <p className="text-gray-400 text-sm">{selectedWithdrawal.userId?.email}</p>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Amount</p>
                <p className="text-white font-bold text-xl">${selectedWithdrawal.amount.toFixed(2)}</p>
              </div>

              {processAction === 'approve' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Transaction Hash <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="Enter blockchain transaction hash"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this withdrawal..."
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex space-x-3">
              <button
                onClick={() => setShowProcessModal(false)}
                disabled={processing}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitProcessWithdrawal}
                disabled={processing || (processAction === 'approve' && !txHash)}
                className={`flex-1 px-4 py-2 rounded-lg transition disabled:opacity-50 ${
                  processAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {processing ? 'Processing...' : processAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
