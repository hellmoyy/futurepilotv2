'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Notification {
  _id: string;
  type: string;
  priority: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    read: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch notifications
  const fetchNotifications = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.read !== 'all') params.append('read', filters.read === 'true' ? 'true' : 'false');

      const response = await fetch(`/api/notifications?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setAllNotifications(data.notifications);
        setPagination(data.pagination);
        setCurrentPage(1); // Reset to first page when data changes
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    if (!confirm('⚠️ Are you sure you want to delete ALL notifications? This action cannot be undone!')) {
      return;
    }

    try {
      const response = await fetch('/api/notifications/delete-all', {
        method: 'DELETE',
      });

      if (response.ok) {
        setAllNotifications([]);
        setCurrentPage(1);
        alert('✅ All notifications have been deleted successfully!');
      } else {
        alert('❌ Failed to delete notifications. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      alert('❌ An error occurred. Please try again.');
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setAllNotifications(prev =>
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAllNotifications(prev => prev.filter(n => n._id !== notificationId));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Client-side pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setNotifications(allNotifications.slice(startIndex, endIndex));
  }, [currentPage, allNotifications]);

  // Initial load and filter changes
  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, filters]);

  // Priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '🚨';
      default: return '💡';
    }
  };

  // Priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'success': return 'text-green-400 dark:text-green-400 light:text-green-600';
      case 'warning': return 'text-yellow-400 dark:text-yellow-400 light:text-yellow-600';
      case 'error': return 'text-red-400 dark:text-red-400 light:text-red-600';
      default: return 'text-blue-400 dark:text-blue-400 light:text-blue-600';
    }
  };

  // Priority badge
  const getPriorityBadge = (priority: string) => {
    const colors = {
      success: 'bg-green-500/20 text-green-400',
      warning: 'bg-yellow-500/20 text-yellow-400',
      error: 'bg-red-500/20 text-red-400',
      info: 'bg-blue-500/20 text-blue-400',
    };
    return colors[priority as keyof typeof colors] || colors.info;
  };

  // Time ago helper
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white dark:text-white light:text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-400 dark:text-gray-400 light:text-gray-600">View and manage all your notifications</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-gray-900/50 dark:bg-gray-900/50 light:bg-white backdrop-blur-xl border border-white/10 dark:border-white/10 light:border-gray-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="bg-gray-800 dark:bg-gray-800 light:bg-gray-50 text-white dark:text-white light:text-gray-900 border border-white/10 dark:border-white/10 light:border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="trading_commission">Trading Commission</option>
              <option value="trading_autoclose">Auto Close</option>
              <option value="trading_low_gas">Low Gas Fee</option>
              <option value="position_opened">Position Opened</option>
              <option value="position_closed">Position Closed</option>
              <option value="tier_upgrade">Tier Upgrade</option>
              <option value="referral_commission">Referral Commission</option>
              <option value="deposit_confirmed">Deposit Confirmed</option>
              <option value="withdrawal_approved">Withdrawal Approved</option>
              <option value="system_alert">System Alert</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="bg-gray-800 dark:bg-gray-800 light:bg-gray-50 text-white dark:text-white light:text-gray-900 border border-white/10 dark:border-white/10 light:border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>

            {/* Read Filter */}
            <select
              value={filters.read}
              onChange={(e) => setFilters({ ...filters, read: e.target.value })}
              className="bg-gray-800 dark:bg-gray-800 light:bg-gray-50 text-white dark:text-white light:text-gray-900 border border-white/10 dark:border-white/10 light:border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={markAllAsRead}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Mark All as Read
            </button>
            <button
              onClick={deleteAllNotifications}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              title="Delete all notifications"
            >
              Delete All
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-gray-900/50 dark:bg-gray-900/50 light:bg-white backdrop-blur-xl border border-white/10 dark:border-white/10 light:border-gray-200 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="text-xl font-semibold text-white dark:text-white light:text-gray-900 mb-2">No notifications found</h3>
          <p className="text-gray-400 dark:text-gray-400 light:text-gray-600">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`bg-gray-900/50 dark:bg-gray-900/50 light:bg-white backdrop-blur-xl border border-white/10 dark:border-white/10 light:border-gray-200 rounded-xl p-6 hover:border-white/20 dark:hover:border-white/20 light:hover:border-gray-300 transition-all ${
                !notification.read ? 'ring-2 ring-blue-500/50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Icon and Content */}
                <div className="flex items-start gap-4 flex-1">
                  <div className={`text-3xl ${getPriorityColor(notification.priority)}`}>
                    {getPriorityIcon(notification.priority)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white dark:text-white light:text-gray-900">{notification.title}</h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${getPriorityBadge(notification.priority)}`}>
                        {notification.priority}
                      </span>
                    </div>
                    <p className="text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2">{notification.message}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 light:text-gray-600">{timeAgo(notification.createdAt)}</p>
                    {notification.actionUrl && (
                      <button
                        onClick={() => {
                          if (!notification.read) markAsRead(notification._id);
                          router.push(notification.actionUrl!);
                        }}
                        className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        View Details →
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="p-2 text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                      title="Mark as read"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="p-2 text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {allNotifications.length > itemsPerPage && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-900/50 dark:bg-gray-900/50 light:bg-white border border-white/10 dark:border-white/10 light:border-gray-200 rounded-xl p-4">
          {/* Page Info */}
          <div className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, allNotifications.length)} of {allNotifications.length} notifications
          </div>

          {/* Page Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-800 dark:bg-gray-800 light:bg-gray-100 text-white dark:text-white light:text-gray-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-200 transition text-sm"
              title="First page"
            >
              ««
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-800 dark:bg-gray-800 light:bg-gray-100 text-white dark:text-white light:text-gray-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-200 transition text-sm"
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.ceil(allNotifications.length / itemsPerPage) }, (_, i) => i + 1)
                .filter(page => {
                  const totalPages = Math.ceil(allNotifications.length / itemsPerPage);
                  if (totalPages <= 5) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, index, array) => {
                  if (index > 0 && page - array[index - 1] > 1) {
                    return [
                      <span key={`ellipsis-${page}`} className="px-2 text-gray-500">...</span>,
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm transition ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 dark:bg-gray-800 light:bg-gray-100 text-white dark:text-white light:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    ];
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm transition ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 dark:bg-gray-800 light:bg-gray-100 text-white dark:text-white light:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(allNotifications.length / itemsPerPage), prev + 1))}
              disabled={currentPage === Math.ceil(allNotifications.length / itemsPerPage)}
              className="px-4 py-2 bg-gray-800 dark:bg-gray-800 light:bg-gray-100 text-white dark:text-white light:text-gray-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-200 transition text-sm"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(Math.ceil(allNotifications.length / itemsPerPage))}
              disabled={currentPage === Math.ceil(allNotifications.length / itemsPerPage)}
              className="px-3 py-2 bg-gray-800 dark:bg-gray-800 light:bg-gray-100 text-white dark:text-white light:text-gray-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-200 transition text-sm"
              title="Last page"
            >
              »»
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
