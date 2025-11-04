'use client';

import { useEffect, useState } from 'react';

interface Referral {
  _id: string;
  referrer: {
    _id: string;
    name: string;
    email: string;
    referralCode: string;
  };
  referred: {
    _id: string;
    name: string;
    email: string;
    membershipLevel: string;
    createdAt: string;
  };
  totalEarnings: number;
  commissionsPaid: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface ReferralStats {
  userId: string;
  userName: string;
  userEmail: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  averagePerReferral: number;
}

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [topReferrers, setTopReferrers] = useState<ReferralStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'top'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch referrals
  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/admin/referrals');
      const data = await response.json();
      
      if (data.success) {
        setReferrals(data.referrals || []);
        setTopReferrers(data.topReferrers || []);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  // Filter referrals
  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = 
      (referral.referrer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (referral.referrer?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (referral.referred?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (referral.referred?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredReferrals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReferrals = filteredReferrals.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, itemsPerPage]);

  // Calculate stats
  const stats = {
    total: referrals.length,
    active: referrals.filter(r => r.status === 'active').length,
    inactive: referrals.filter(r => r.status === 'inactive').length,
    totalEarnings: referrals.reduce((sum, r) => sum + (r.totalEarnings || 0), 0),
    avgPerReferral: referrals.length > 0 
      ? referrals.reduce((sum, r) => sum + (r.totalEarnings || 0), 0) / referrals.length 
      : 0,
  };

  const handleViewDetails = (referral: Referral) => {
    setSelectedReferral(referral);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? 'bg-green-500/10 text-green-500 border-green-500/50'
      : 'bg-gray-500/10 text-gray-500 border-gray-500/50';
  };

  const getMembershipColor = (level: string) => {
    const colors = {
      bronze: 'bg-orange-900/20 text-orange-400 border-orange-600',
      silver: 'bg-gray-400/20 text-gray-300 border-gray-400',
      gold: 'bg-yellow-600/20 text-yellow-400 border-yellow-500',
      platinum: 'bg-purple-600/20 text-purple-300 border-purple-500',
    };
    return colors[level?.toLowerCase() as keyof typeof colors] || colors.bronze;
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
          <h1 className="text-3xl font-bold text-white mb-2">Referrals Management</h1>
          <p className="text-gray-400">Monitor referral network and earnings</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setView(view === 'list' ? 'top' : 'list')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>{view === 'list' ? 'Top Referrers' : 'All Referrals'}</span>
          </button>
          <button
            onClick={fetchReferrals}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-200">Total Referrals</p>
            <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm text-purple-200 mt-1">All time</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-200">Active</p>
            <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.active}</p>
          <p className="text-sm text-green-200 mt-1">Currently active</p>
        </div>

        <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-200">Inactive</p>
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.inactive}</p>
          <p className="text-sm text-gray-200 mt-1">No longer active</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-200">Total Commission</p>
            <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
          <p className="text-sm text-blue-200 mt-1">Paid to referrers</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-yellow-200">Avg per Referral</p>
            <svg className="w-8 h-8 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-3xl font-bold">${stats.avgPerReferral.toFixed(2)}</p>
          <p className="text-sm text-yellow-200 mt-1">Per relationship</p>
        </div>
      </div>

      {view === 'list' ? (
        <>
          {/* Filters */}
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by referrer or referred user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'active', 'inactive'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as any)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      statusFilter === status
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

          {/* Referrals Table */}
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Referrer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Referred User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Membership</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Commission Earned</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Joined</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {paginatedReferrals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        {filteredReferrals.length === 0 ? 'No referrals found' : 'No results for current page'}
                      </td>
                    </tr>
                  ) : (
                    paginatedReferrals.map((referral) => (
                      <tr key={referral._id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white font-medium">{referral.referrer?.name || 'Unknown'}</p>
                            <p className="text-gray-400 text-sm">{referral.referrer?.email || '-'}</p>
                            <p className="text-purple-400 text-xs font-mono mt-1">
                              Code: {referral.referrer?.referralCode || '-'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white font-medium">{referral.referred?.name || 'Unknown'}</p>
                            <p className="text-gray-400 text-sm">{referral.referred?.email || '-'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getMembershipColor(referral.referred?.membershipLevel || 'bronze')}`}>
                            {(referral.referred?.membershipLevel || 'bronze').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-green-500 font-bold text-lg">${(referral.totalEarnings || 0).toFixed(2)}</p>
                          <p className="text-gray-400 text-xs">From this referral</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(referral.status || 'active')}`}>
                            {(referral.status || 'active').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-300 text-sm">
                            {new Date(referral.referred?.createdAt || referral.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewDetails(referral)}
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
            {filteredReferrals.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
                {/* Items per page selector */}
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
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredReferrals.length)} of {filteredReferrals.length}
                  </span>
                </div>

                {/* Page navigation */}
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
                  
                  {/* Page numbers */}
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
        </>
      ) : (
        /* Top Referrers View */
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white">Top Referrers Leaderboard</h3>
            <p className="text-gray-400 text-sm mt-1">Users with most successful referrals</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topReferrers.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No referrers data available</p>
              ) : (
                topReferrers.map((referrer, index) => (
                  <div key={referrer.userId} className="bg-gray-700/50 rounded-lg p-6 flex items-center justify-between hover:bg-gray-700 transition">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                        index === 0 ? 'bg-yellow-600 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-700 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">{referrer.userName}</p>
                        <p className="text-gray-400 text-sm">{referrer.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Total Referrals</p>
                        <p className="text-white font-bold text-2xl">{referrer.totalReferrals}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Active</p>
                        <p className="text-green-500 font-bold text-2xl">{referrer.activeReferrals}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Total Commission</p>
                        <p className="text-blue-500 font-bold text-2xl">${referrer.totalEarnings.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Avg per Referral</p>
                        <p className="text-purple-500 font-bold text-2xl">${referrer.averagePerReferral.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedReferral && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Referral Details</h3>
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
            
            <div className="p-6 space-y-6">
              {/* Referrer Info */}
              <div>
                <p className="text-gray-400 text-sm mb-3">Referrer</p>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-white font-semibold text-lg">{selectedReferral.referrer?.name || 'Unknown'}</p>
                  <p className="text-gray-400 text-sm">{selectedReferral.referrer?.email || '-'}</p>
                  <p className="text-purple-400 text-sm font-mono mt-2">
                    Referral Code: <span className="font-bold">{selectedReferral.referrer?.referralCode || '-'}</span>
                  </p>
                </div>
              </div>

              {/* Referred User Info */}
              <div>
                <p className="text-gray-400 text-sm mb-3">Referred User</p>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-white font-semibold text-lg">{selectedReferral.referred?.name || 'Unknown'}</p>
                  <p className="text-gray-400 text-sm">{selectedReferral.referred?.email || '-'}</p>
                  <div className="mt-2">
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getMembershipColor(selectedReferral.referred?.membershipLevel || 'bronze')}`}>
                      {(selectedReferral.referred?.membershipLevel || 'bronze').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Earnings Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Commission Earned</p>
                  <p className="text-green-500 font-bold text-2xl">${(selectedReferral.totalEarnings || 0).toFixed(2)}</p>
                  <p className="text-gray-500 text-xs mt-1">By referrer from this user</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Commission Paid</p>
                  <p className="text-blue-500 font-bold text-2xl">${(selectedReferral.commissionsPaid || 0).toFixed(2)}</p>
                  <p className="text-gray-500 text-xs mt-1">Already withdrawn</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(selectedReferral.status || 'active')}`}>
                    {(selectedReferral.status || 'active').toUpperCase()}
                  </span>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Joined</p>
                  <p className="text-white font-medium">
                    {new Date(selectedReferral.referred?.createdAt || selectedReferral.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
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
