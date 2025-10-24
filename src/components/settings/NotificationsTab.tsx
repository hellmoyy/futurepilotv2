'use client';

import { useState, useEffect } from 'react';

export default function NotificationsTab() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [notifications, setNotifications] = useState({
    email: {
      enabled: true,
      tradeAlerts: true,
      priceAlerts: true,
      newsAlerts: true,
      weeklyReport: true,
    },
    telegram: {
      enabled: false,
      chatId: '',
      tradeAlerts: true,
      priceAlerts: true,
      newsAlerts: false,
    },
    push: {
      enabled: false,
      tradeAlerts: true,
      priceAlerts: true,
    },
  });

  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch('/api/user/notifications');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setNotifications(data.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Notification settings updated successfully!');
      } else {
        setError(data.error || 'Failed to update notification settings');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white light:text-gray-900 mb-2">
          Notification Preferences
        </h2>
        <p className="text-gray-400 light:text-gray-600">
          Choose how you want to receive updates and alerts
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Notifications */}
        <div className="p-6 bg-white/5 rounded-xl light:bg-gray-50 border border-white/10 light:border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                notifications.email.enabled 
                  ? 'bg-blue-500/20 border border-blue-500/30' 
                  : 'bg-gray-500/20 border border-gray-500/30'
              }`}>
                <svg className={`w-5 h-5 ${notifications.email.enabled ? 'text-blue-400' : 'text-gray-400'}`} 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white light:text-gray-900">
                  Email Notifications
                </h3>
                <p className="text-sm text-gray-400 light:text-gray-600">
                  Receive updates via email
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotifications({
                ...notifications,
                email: { ...notifications.email, enabled: !notifications.email.enabled }
              })}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                notifications.email.enabled ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  notifications.email.enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {notifications.email.enabled && (
            <div className="space-y-3 ml-13 pl-4 border-l-2 border-blue-500/30">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-300 light:text-gray-700">Trade Execution Alerts</span>
                <input
                  type="checkbox"
                  checked={notifications.email.tradeAlerts}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    email: { ...notifications.email, tradeAlerts: e.target.checked }
                  })}
                  className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-300 light:text-gray-700">Price Alerts</span>
                <input
                  type="checkbox"
                  checked={notifications.email.priceAlerts}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    email: { ...notifications.email, priceAlerts: e.target.checked }
                  })}
                  className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-300 light:text-gray-700">Market News Alerts</span>
                <input
                  type="checkbox"
                  checked={notifications.email.newsAlerts}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    email: { ...notifications.email, newsAlerts: e.target.checked }
                  })}
                  className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-300 light:text-gray-700">Weekly Performance Report</span>
                <input
                  type="checkbox"
                  checked={notifications.email.weeklyReport}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    email: { ...notifications.email, weeklyReport: e.target.checked }
                  })}
                  className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          )}
        </div>

        {/* Telegram Notifications */}
        <div className="p-6 bg-white/5 rounded-xl light:bg-gray-50 border border-white/10 light:border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                notifications.telegram.enabled 
                  ? 'bg-cyan-500/20 border border-cyan-500/30' 
                  : 'bg-gray-500/20 border border-gray-500/30'
              }`}>
                <svg className={`w-5 h-5 ${notifications.telegram.enabled ? 'text-cyan-400' : 'text-gray-400'}`} 
                     fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white light:text-gray-900">
                  Telegram Notifications
                </h3>
                <p className="text-sm text-gray-400 light:text-gray-600">
                  Get instant alerts on Telegram
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotifications({
                ...notifications,
                telegram: { ...notifications.telegram, enabled: !notifications.telegram.enabled }
              })}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                notifications.telegram.enabled ? 'bg-cyan-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  notifications.telegram.enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {notifications.telegram.enabled && (
            <div className="space-y-4 ml-13">
              <div>
                <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-2">
                  Telegram Chat ID
                </label>
                <input
                  type="text"
                  value={notifications.telegram.chatId}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    telegram: { ...notifications.telegram, chatId: e.target.value }
                  })}
                  placeholder="Enter your Telegram Chat ID"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white light:bg-white light:border-gray-300 light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Message our bot <span className="font-mono text-cyan-400">@FuturePilotBot</span> to get your Chat ID
                </p>
              </div>

              <div className="space-y-3 pl-4 border-l-2 border-cyan-500/30">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-300 light:text-gray-700">Trade Execution Alerts</span>
                  <input
                    type="checkbox"
                    checked={notifications.telegram.tradeAlerts}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      telegram: { ...notifications.telegram, tradeAlerts: e.target.checked }
                    })}
                    className="w-5 h-5 rounded border-gray-600 text-cyan-500 focus:ring-2 focus:ring-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-300 light:text-gray-700">Price Alerts</span>
                  <input
                    type="checkbox"
                    checked={notifications.telegram.priceAlerts}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      telegram: { ...notifications.telegram, priceAlerts: e.target.checked }
                    })}
                    className="w-5 h-5 rounded border-gray-600 text-cyan-500 focus:ring-2 focus:ring-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-300 light:text-gray-700">Market News Alerts</span>
                  <input
                    type="checkbox"
                    checked={notifications.telegram.newsAlerts}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      telegram: { ...notifications.telegram, newsAlerts: e.target.checked }
                    })}
                    className="w-5 h-5 rounded border-gray-600 text-cyan-500 focus:ring-2 focus:ring-cyan-500"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Push Notifications */}
        <div className="p-6 bg-white/5 rounded-xl light:bg-gray-50 border border-white/10 light:border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                notifications.push.enabled 
                  ? 'bg-green-500/20 border border-green-500/30' 
                  : 'bg-gray-500/20 border border-gray-500/30'
              }`}>
                <svg className={`w-5 h-5 ${notifications.push.enabled ? 'text-green-400' : 'text-gray-400'}`} 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white light:text-gray-900">
                  Push Notifications
                </h3>
                <p className="text-sm text-gray-400 light:text-gray-600">
                  Browser notifications (Coming Soon)
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-600 opacity-50 cursor-not-allowed"
            >
              <span className="inline-block h-6 w-6 transform rounded-full bg-white translate-x-1" />
            </button>
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300 light:text-blue-700">
              Push notifications will be available soon. You can enable email and Telegram notifications for now.
            </p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={fetchNotificationSettings}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white light:bg-gray-200 light:text-gray-700 light:hover:bg-gray-300 rounded-xl font-semibold transition-all"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
