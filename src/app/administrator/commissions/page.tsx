'use client';

import { useEffect, useState } from 'react';

interface Commission {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  type: 'referral' | 'trading' | 'bonus' | 'other';
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  description?: string;
  sourceUserId?: {
    _id: string;
    name: string;
    email: string;
  };
  paymentMethod?: string;
  walletAddress?: string;
  txHash?: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processAction, setProcessAction] = useState<'approve' | 'reject' | 'pay'>('approve');
  const [txHash, setTxHash] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Fetch commissions
  const fetchCommissions = async () => {
    try {
      const response = await fetch('/api/admin/commissions');
      const data = await response.json();
      
      if (data.success) {
        setCommissions(data.commissions || []);
      }
    } catch (error) {
      console.error('Error fetching commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  // Filter commissions
  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = 
      (commission.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (commission.userId?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (commission.sourceUserId?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || commission.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || commission.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: commissions.length,
    pending: commissions.filter(c => c.status === 'pending').length,
    approved: commissions.filter(c => c.status === 'approved').length,
    paid: commissions.filter(c => c.status === 'paid').length,
    totalAmount: commissions.reduce((sum, c) => sum + c.amount, 0),
    pendingAmount: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0),
    paidAmount: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0),
  };

  const handleViewDetails = (commission: Commission) => {
    setSelectedCommission(commission);
    setShowDetailsModal(true);
  };

  const handleProcessCommission = (commission: Commission, action: 'approve' | 'reject' | 'pay') => {
    setSelectedCommission(commission);
    setProcessAction(action);
    setTxHash('');
    setNotes('');
    setShowProcessModal(true);
  };

  const submitProcessCommission = async () => {
    if (!selectedCommission) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/commissions/${selectedCommission._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: processAction,
          txHash: processAction === 'pay' ? txHash : undefined,
          notes,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Commission ${processAction}ed successfully!`);
        setShowProcessModal(false);
        fetchCommissions();
      } else {
        alert(data.message || 'Failed to process commission');
      }
    } catch (error) {
      console.error('Error processing commission:', error);
      alert('Failed to process commission');
    } finally {
      setProcessing(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      referral: 'bg-purple-500/10 text-purple-500 border-purple-500/50',
      trading: 'bg-blue-500/10 text-blue-500 border-blue-500/50',
      bonus: 'bg-green-500/10 text-green-500 border-green-500/50',
      other: 'bg-gray-500/10 text-gray-500 border-gray-500/50',
    };
    return styles[type as keyof typeof styles] || styles.other;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50',
      approved: 'bg-blue-500/10 text-blue-500 border-blue-500/50',
      paid: 'bg-green-500/10 text-green-500 border-green-500/50',
      rejected: 'bg-red-500/10 text-red-500 border-red-500/50',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Email', 'Type', 'Amount', 'Status', 'TxHash', 'Description'];
    const rows = filteredCommissions.map(c => [
      new Date(c.requestedAt).toLocaleString(),
      c.userId?.name || 'Unknown',
      c.userId?.email || '-',
      c.type,
      c.amount.toFixed(2),
      c.status,
      c.txHash || '-',
      c.description || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions_${new Date().toISOString().split('T')[0]}.csv`;
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
          <h1 className="text-3xl font-bold text-white mb-2">Withdrawal Management</h1>
          <p className="text-gray-400">Manage and approve referral commission withdrawals</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export</span>
          </button>
          <button
            onClick={fetchCommissions}
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
            <p className="text-purple-200">Total Commissions</p>
            <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          <p className="text-sm text-yellow-200 mt-1">${stats.pendingAmount.toFixed(2)} awaiting</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-200">Approved</p>
            <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.approved}</p>
          <p className="text-sm text-blue-200 mt-1">Ready to pay</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-200">Paid</p>
            <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.paid}</p>
          <p className="text-sm text-green-200 mt-1">${stats.paidAmount.toFixed(2)} disbursed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by user name, email, or source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              <option value="referral">Referral</option>
              <option value="trading">Trading</option>
              <option value="bonus">Bonus</option>
              <option value="other">Other</option>
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
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Commissions Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Description</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No commissions found
                  </td>
                </tr>
              ) : (
                filteredCommissions.map((commission) => (
                  <tr key={commission._id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">
                        {new Date(commission.requestedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {new Date(commission.requestedAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{commission.userId?.name || 'Unknown'}</p>
                        <p className="text-gray-400 text-sm">{commission.userId?.email || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getTypeBadge(commission.type || 'other')}`}>
                        {(commission.type || 'other').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-green-500 font-bold text-lg">${commission.amount.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(commission.status || 'pending')}`}>
                        {(commission.status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300 text-sm max-w-xs truncate">
                        {commission.description || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(commission)}
                          className="text-blue-500 hover:text-blue-400 text-sm font-medium"
                        >
                          View
                        </button>
                        {commission.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleProcessCommission(commission, 'approve')}
                              className="text-green-500 hover:text-green-400 text-sm font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleProcessCommission(commission, 'reject')}
                              className="text-red-500 hover:text-red-400 text-sm font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {commission.status === 'approved' && (
                          <button
                            onClick={() => handleProcessCommission(commission, 'pay')}
                            className="text-purple-500 hover:text-purple-400 text-sm font-medium"
                          >
                            Mark Paid
                          </button>
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
      {showDetailsModal && selectedCommission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Commission Details</h3>
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
                  <p className="text-white font-semibold text-lg">{selectedCommission.userId?.name || 'Unknown'}</p>
                  <p className="text-gray-400 text-sm">{selectedCommission.userId?.email || '-'}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Type</p>
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getTypeBadge(selectedCommission.type || 'other')}`}>
                    {(selectedCommission.type || 'other').toUpperCase()}
                  </span>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(selectedCommission.status || 'pending')}`}>
                    {(selectedCommission.status || 'pending').toUpperCase()}
                  </span>
                </div>

                <div className="col-span-2 bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Amount</p>
                  <p className="text-green-500 font-bold text-3xl">${selectedCommission.amount.toFixed(2)}</p>
                </div>

                {selectedCommission.description && (
                  <div className="col-span-2 bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Description</p>
                    <p className="text-white">{selectedCommission.description}</p>
                  </div>
                )}

                {selectedCommission.sourceUserId && (
                  <div className="col-span-2 bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Source User</p>
                    <p className="text-white font-medium">{selectedCommission.sourceUserId.name}</p>
                    <p className="text-gray-400 text-sm">{selectedCommission.sourceUserId.email}</p>
                  </div>
                )}

                {selectedCommission.walletAddress && (
                  <div className="col-span-2 bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Wallet Address</p>
                    <p className="text-white font-mono text-sm break-all">{selectedCommission.walletAddress}</p>
                  </div>
                )}

                {selectedCommission.txHash && (
                  <div className="col-span-2 bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Transaction Hash</p>
                    <p className="text-white font-mono text-sm break-all">{selectedCommission.txHash}</p>
                  </div>
                )}

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Requested At</p>
                  <p className="text-white text-sm">
                    {new Date(selectedCommission.requestedAt).toLocaleString()}
                  </p>
                </div>

                {selectedCommission.processedAt && (
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Processed At</p>
                    <p className="text-white text-sm">
                      {new Date(selectedCommission.processedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {selectedCommission.notes && (
                  <div className="col-span-2 bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Notes</p>
                    <p className="text-white">{selectedCommission.notes}</p>
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
      {showProcessModal && selectedCommission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">
                {processAction === 'approve' ? 'Approve' : processAction === 'reject' ? 'Reject' : 'Mark as Paid'} Commission
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">User</p>
                <p className="text-white font-semibold">{selectedCommission.userId?.name}</p>
                <p className="text-gray-400 text-sm">{selectedCommission.userId?.email}</p>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Amount</p>
                <p className="text-green-500 font-bold text-xl">${selectedCommission.amount.toFixed(2)}</p>
              </div>

              {processAction === 'pay' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Transaction Hash <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="Enter payment transaction hash"
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
                  placeholder="Add any notes..."
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
                onClick={submitProcessCommission}
                disabled={processing || (processAction === 'pay' && !txHash)}
                className={`flex-1 px-4 py-2 rounded-lg transition disabled:opacity-50 ${
                  processAction === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' :
                  processAction === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' :
                  'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {processing ? 'Processing...' : 
                 processAction === 'approve' ? 'Approve' : 
                 processAction === 'reject' ? 'Reject' : 
                 'Mark Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
