/**
 * Enhanced Transaction History Component
 * Features:
 * - Advanced filters (type, source, date range, status)
 * - Search functionality
 * - Export to CSV/PDF
 * - Pagination
 * - Responsive design
 */

'use client';

import { useState, useMemo } from 'react';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Transaction {
  _id: string;
  amount: number;
  type: string;
  source: string;
  status: string;
  createdAt: string;
  referralLevel?: number;
  referralUserId?: {
    name: string;
    email: string;
  };
  commissionRate?: number;
  txHash?: string;
  notes?: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  loading?: boolean;
  title?: string;
  showExport?: boolean;
  showFilters?: boolean;
}

export default function EnhancedTransactionHistory({
  transactions,
  loading = false,
  title = 'Transaction History',
  showExport = true,
  showFilters = true,
}: TransactionHistoryProps) {
  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique values for filters
  const uniqueTypes = useMemo(() => {
    const types = new Set(transactions.map(t => t.type));
    return Array.from(types);
  }, [transactions]);

  const uniqueSources = useMemo(() => {
    const sources = new Set(transactions.map(t => t.source));
    return Array.from(sources);
  }, [transactions]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(transactions.map(t => t.status));
    return Array.from(statuses);
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Type filter
      if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;

      // Source filter
      if (sourceFilter !== 'all' && transaction.source !== sourceFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && transaction.status !== statusFilter) return false;

      // Date range filter
      const txDate = new Date(transaction.createdAt);
      if (dateFrom && txDate < new Date(dateFrom)) return false;
      if (dateTo && txDate > new Date(dateTo + 'T23:59:59')) return false;

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesAmount = transaction.amount.toString().includes(query);
        const matchesType = transaction.type.toLowerCase().includes(query);
        const matchesSource = transaction.source.toLowerCase().includes(query);
        const matchesStatus = transaction.status.toLowerCase().includes(query);
        const matchesName = transaction.referralUserId?.name?.toLowerCase().includes(query);
        const matchesEmail = transaction.referralUserId?.email?.toLowerCase().includes(query);
        const matchesTxHash = transaction.txHash?.toLowerCase().includes(query);

        if (!matchesAmount && !matchesType && !matchesSource && !matchesStatus && !matchesName && !matchesEmail && !matchesTxHash) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, typeFilter, sourceFilter, statusFilter, dateFrom, dateTo, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const byType: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    filteredTransactions.forEach(t => {
      byType[t.type] = (byType[t.type] || 0) + t.amount;
      bySource[t.source] = (bySource[t.source] || 0) + t.amount;
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    });

    return {
      total,
      count: filteredTransactions.length,
      byType,
      bySource,
      byStatus,
    };
  }, [filteredTransactions]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Amount', 'Type', 'Source', 'Status', 'Level', 'From', 'TxHash', 'Notes'];
    const rows = filteredTransactions.map(t => [
      new Date(t.createdAt).toLocaleDateString(),
      new Date(t.createdAt).toLocaleTimeString(),
      t.amount.toFixed(2),
      t.type,
      t.source,
      t.status,
      t.referralLevel?.toString() || '-',
      t.referralUserId?.name || '-',
      t.txHash || '-',
      t.notes || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `transactions-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Transaction History Report', 14, 20);

    // Date range
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    if (dateFrom || dateTo) {
      doc.text(`Period: ${dateFrom || 'Start'} to ${dateTo || 'Present'}`, 14, 34);
    }

    // Statistics
    doc.setFontSize(12);
    doc.text(`Total Transactions: ${stats.count}`, 14, 42);
    doc.text(`Total Amount: $${stats.total.toFixed(2)}`, 14, 48);

    // Table
    const tableData = filteredTransactions.map(t => [
      new Date(t.createdAt).toLocaleDateString(),
      `$${t.amount.toFixed(2)}`,
      t.type,
      t.source,
      t.status,
      t.referralLevel?.toString() || '-',
      t.referralUserId?.name || '-',
    ]);

    (doc as any).autoTable({
      head: [['Date', 'Amount', 'Type', 'Source', 'Status', 'Level', 'From']],
      body: tableData,
      startY: 55,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [102, 126, 234] },
    });

    doc.save(`transactions-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Reset filters
  const resetFilters = () => {
    setTypeFilter('all');
    setSourceFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 light:text-gray-600">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-white light:text-gray-900">{title}</h3>
          <p className="text-sm text-gray-400 light:text-gray-600">
            {stats.count} transactions · Total: ${stats.total.toFixed(2)}
          </p>
        </div>

        {showExport && filteredTransactions.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg border border-green-500/30 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 light:bg-blue-50 light:border-blue-200 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by amount, type, source, name, email, or txhash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 light:bg-white light:border-blue-200 light:text-gray-900"
            />
            <svg className="w-5 h-5 text-gray-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 light:bg-white light:border-blue-200 light:text-gray-900"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 light:bg-white light:border-blue-200 light:text-gray-900"
            >
              <option value="all">All Sources</option>
              {uniqueSources.map(source => (
                <option key={source} value={source}>{source.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 light:bg-white light:border-blue-200 light:text-gray-900"
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>

            {/* Date From */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 light:bg-white light:border-blue-200 light:text-gray-900"
              placeholder="From Date"
            />

            {/* Date To */}
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 light:bg-white light:border-blue-200 light:text-gray-900"
              placeholder="To Date"
            />
          </div>

          {/* Active Filters & Reset Button */}
          {(typeFilter !== 'all' || sourceFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo || searchQuery) && (
            <div className="flex justify-between items-center pt-2">
              <div className="flex flex-wrap gap-2">
                {typeFilter !== 'all' && (
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs border border-purple-500/30">
                    Type: {typeFilter}
                  </span>
                )}
                {sourceFilter !== 'all' && (
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs border border-blue-500/30">
                    Source: {sourceFilter}
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs border border-green-500/30">
                    Status: {statusFilter}
                  </span>
                )}
                {(dateFrom || dateTo) && (
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs border border-yellow-500/30">
                    Date: {dateFrom || 'Start'} to {dateTo || 'Now'}
                  </span>
                )}
              </div>
              <button
                onClick={resetFilters}
                className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs border border-red-500/30 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Transaction Table */}
      {paginatedTransactions.length === 0 ? (
        <div className="text-center py-12 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 light:bg-blue-50 light:border-blue-200">
          <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-4 light:bg-purple-100">
            <svg className="w-10 h-10 text-gray-500 light:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <p className="text-gray-400 mb-2 light:text-gray-600">No transactions found</p>
          <p className="text-gray-500 text-sm light:text-gray-600">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-4 sm:mx-0 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 light:bg-white light:border-blue-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 light:border-blue-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700 hidden md:table-cell">Source</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700 hidden lg:table-cell">From</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((transaction) => (
                  <tr key={transaction._id} className="border-b border-white/5 hover:bg-white/5 transition-colors light:border-blue-100 light:hover:bg-blue-50">
                    <td className="py-4 px-4">
                      <p className="text-sm text-white light:text-gray-900">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 light:text-gray-600">
                        {new Date(transaction.createdAt).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className={`text-sm font-bold ${transaction.amount >= 0 ? 'text-green-400 light:text-green-600' : 'text-red-400 light:text-red-600'}`}>
                        {transaction.amount >= 0 ? '+' : ''}${transaction.amount.toFixed(2)}
                      </p>
                      {transaction.commissionRate && (
                        <p className="text-xs text-gray-500 light:text-gray-600">
                          {transaction.commissionRate}% rate
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-block px-2 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {transaction.type.replace('_', ' ').toUpperCase()}
                      </span>
                      {transaction.referralLevel && (
                        <p className="text-xs text-gray-500 light:text-gray-600 mt-1">
                          Level {transaction.referralLevel}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <span className="text-xs text-gray-400 light:text-gray-600">
                        {transaction.source.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell">
                      {transaction.referralUserId ? (
                        <>
                          <p className="text-sm text-white light:text-gray-900">
                            {transaction.referralUserId.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 light:text-gray-600">
                            {transaction.referralUserId.email || '-'}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        transaction.status === 'pending' 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : transaction.status === 'confirmed' || transaction.status === 'paid'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-gray-400 light:text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors light:bg-blue-100 light:hover:bg-blue-200 light:border-blue-200 light:text-gray-900"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
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
                        className={`w-10 h-10 rounded-lg border transition-colors ${
                          currentPage === pageNum
                            ? 'bg-purple-500 text-white border-purple-500'
                            : 'bg-white/5 hover:bg-white/10 text-white border-white/10 light:bg-blue-100 light:hover:bg-blue-200 light:border-blue-200 light:text-gray-900'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors light:bg-blue-100 light:hover:bg-blue-200 light:border-blue-200 light:text-gray-900"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
