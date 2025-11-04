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
    push: {
      enabled: true,
      tradeAlerts: true,
      priceAlerts: true,
    },
  });

  useEffect(() => {
    fetchNotificationSettings();
    
    // Request notification permission on mount if not already granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
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
                  Browser Push Notifications
                </h3>
                <p className="text-sm text-gray-400 light:text-gray-600">
                  Instant browser notifications
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                const newEnabled = !notifications.push.enabled;
                
                // Request permission if enabling and permission not granted
                if (newEnabled && 'Notification' in window) {
                  if (Notification.permission === 'default') {
                    const permission = await Notification.requestPermission();
                    if (permission !== 'granted') {
                      alert('Please allow notifications in your browser settings to enable this feature.');
                      return;
                    }
                  } else if (Notification.permission === 'denied') {
                    alert('Notifications are blocked. Please enable them in your browser settings.');
                    return;
                  }
                }
                
                setNotifications({
                  ...notifications,
                  push: { ...notifications.push, enabled: newEnabled }
                });
              }}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                notifications.push.enabled ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  notifications.push.enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {notifications.push.enabled ? (
            <>
              <div className="space-y-3 ml-13 pl-4 border-l-2 border-green-500/30 mb-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-300 light:text-gray-700">Trade Execution Alerts</span>
                  <input
                    type="checkbox"
                    checked={notifications.push.tradeAlerts}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      push: { ...notifications.push, tradeAlerts: e.target.checked }
                    })}
                    className="w-5 h-5 rounded border-gray-600 text-green-500 focus:ring-2 focus:ring-green-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-300 light:text-gray-700">Price Alerts</span>
                  <input
                    type="checkbox"
                    checked={notifications.push.priceAlerts}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      push: { ...notifications.push, priceAlerts: e.target.checked }
                    })}
                    className="w-5 h-5 rounded border-gray-600 text-green-500 focus:ring-2 focus:ring-green-500"
                  />
                </label>
              </div>
              
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-300 light:text-green-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Browser notifications are enabled. You&apos;ll receive instant alerts for important events.
                </p>
              </div>
            </>
          ) : (
            <div className="p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg">
              <p className="text-sm text-gray-400 light:text-gray-600">
                Enable browser notifications to receive instant alerts for trades, deposits, and important updates.
              </p>
            </div>
          )}
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
