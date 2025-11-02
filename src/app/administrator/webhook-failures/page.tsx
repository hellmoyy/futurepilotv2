'use client';

import { useEffect, useState } from 'react';
import { WebhookRetryManager } from '@/lib/webhookRetry';

interface WebhookRetry {
  _id: string;
  webhookType: 'moralis' | 'binance' | 'other';
  payload: any;
  headers?: any;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date;
  status: 'pending' | 'retrying' | 'success' | 'failed' | 'dead_letter';
  errorHistory: Array<{
    attempt: number;
    error: string;
    timestamp: Date;
  }>;
  lastError?: string;
  movedToDLQAt?: Date;
  dlqReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Statistics {
  total: number;
  byStatus: {
    pending: number;
    retrying: number;
    success: number;
    failed: number;
    dead_letter: number;
  };
  byType: {
    moralis: number;
    binance: number;
    other: number;
  };
}

export default function WebhookFailuresPage() {
  const [webhooks, setWebhooks] = useState<WebhookRetry[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookRetry | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);

  // Fetch webhooks and statistics
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      
      // Fetch webhooks
      const webhooksResponse = await fetch(`/api/admin/webhook-retries?${params}`);
      const webhooksData = await webhooksResponse.json();
      
      if (webhooksData.success) {
        setWebhooks(webhooksData.webhooks);
      }
      
      // Fetch statistics
      const statsResponse = await fetch('/api/admin/webhook-retries/stats');
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setStatistics(statsData.statistics);
      }
      
    } catch (error) {
      console.error('Error fetching webhook data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [statusFilter, typeFilter]);

  // Manual retry
  const handleManualRetry = async (webhookId: string) => {
    if (!confirm('Are you sure you want to manually retry this webhook?')) {
      return;
    }
    
    try {
      setRetrying(webhookId);
      
      const response = await fetch('/api/admin/webhook-retries/manual-retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Webhook retry initiated successfully!');
        fetchData(); // Refresh data
      } else {
        alert(`Failed to retry webhook: ${data.error}`);
      }
    } catch (error) {
      console.error('Error retrying webhook:', error);
      alert('Error retrying webhook. Check console for details.');
    } finally {
      setRetrying(null);
    }
  };

  // Delete webhook
  const handleDelete = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook retry record?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/webhook-retries/${webhookId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Webhook deleted successfully!');
        fetchData(); // Refresh data
      } else {
        alert(`Failed to delete webhook: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      alert('Error deleting webhook. Check console for details.');
    }
  };

  // View details
  const handleViewDetails = (webhook: WebhookRetry) => {
    setSelectedWebhook(webhook);
    setShowDetailsModal(true);
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'retrying': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'dead_letter': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Webhook Failures & Retries
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor failed webhooks, view retry attempts, and manually retry from Dead Letter Queue
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Webhooks</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.total}</p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending</h3>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">
              {statistics.byStatus.pending}
            </p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Retrying</h3>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
              {statistics.byStatus.retrying}
            </p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">Dead Letter Queue</h3>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
              {statistics.byStatus.dead_letter}
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Success</h3>
            <p className="text-2xl font-bold text-green-900 dark:text-green-200">
              {statistics.byStatus.success}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="retrying">Retrying</option>
              <option value="dead_letter">Dead Letter Queue</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Webhook Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="moralis">Moralis</option>
              <option value="binance">Binance</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Webhooks Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Webhook Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Retry Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Next Retry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Error
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {webhooks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No webhook retries found
                  </td>
                </tr>
              ) : (
                webhooks.map((webhook) => (
                  <tr key={webhook._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {webhook.webhookType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(webhook.status)}`}>
                        {webhook.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {webhook.retryCount} / {webhook.maxRetries}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {webhook.status === 'pending' || webhook.status === 'retrying' ? (
                        <span className="text-sm text-gray-900 dark:text-white">
                          {new Date(webhook.nextRetryAt).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {webhook.lastError || 'No error'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {new Date(webhook.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewDetails(webhook)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </button>
                      
                      {webhook.status === 'dead_letter' && (
                        <button
                          onClick={() => handleManualRetry(webhook._id)}
                          disabled={retrying === webhook._id}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                        >
                          {retrying === webhook._id ? 'Retrying...' : 'Retry'}
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(webhook._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedWebhook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Webhook Retry Details
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              {/* Basic Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Webhook Type</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedWebhook.webhookType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedWebhook.status)}`}>
                      {selectedWebhook.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Retry Count</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedWebhook.retryCount} / {selectedWebhook.maxRetries}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Created At</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(selectedWebhook.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Error History */}
              {selectedWebhook.errorHistory && selectedWebhook.errorHistory.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Error History</h3>
                  <div className="space-y-3">
                    {selectedWebhook.errorHistory.map((error, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Attempt {error.attempt}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(error.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-400">{error.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Payload */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Payload</h3>
                <pre className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-xs overflow-x-auto text-gray-900 dark:text-white">
                  {JSON.stringify(selectedWebhook.payload, null, 2)}
                </pre>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                
                {selectedWebhook.status === 'dead_letter' && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleManualRetry(selectedWebhook._id);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Retry Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
