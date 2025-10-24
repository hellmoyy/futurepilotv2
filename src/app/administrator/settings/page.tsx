'use client';

import { useState } from 'react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'commission' | 'security' | 'email'>('general');
  const [saving, setSaving] = useState(false);

  // General Settings
  const [platformName, setPlatformName] = useState('FuturePilot');
  const [platformUrl, setPlatformUrl] = useState('https://futurepilot.pro');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);

  // Commission Settings
  const [referralCommission, setReferralCommission] = useState(10);
  const [tradingCommission, setTradingCommission] = useState(5);
  const [minimumWithdrawal, setMinimumWithdrawal] = useState(50);

  // Security Settings
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);

  // Email Settings
  const [emailFrom, setEmailFrom] = useState('noreply@futurepilot.pro');
  const [smtpHost, setSmtpHost] = useState('smtp.example.com');
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'commission', name: 'Commission', icon: '💰' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'email', name: 'Email', icon: '📧' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
        <p className="text-gray-400">Configure platform settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-xl p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="font-medium">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-gray-800 rounded-xl p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">General Settings</h3>
                  <p className="text-gray-400 text-sm mb-6">Configure basic platform information</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Platform URL
                  </label>
                  <input
                    type="url"
                    value={platformUrl}
                    onChange={(e) => setPlatformUrl(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Maintenance Mode</p>
                    <p className="text-gray-400 text-sm">Temporarily disable public access</p>
                  </div>
                  <button
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      maintenanceMode ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Allow User Registration</p>
                    <p className="text-gray-400 text-sm">Enable new user signups</p>
                  </div>
                  <button
                    onClick={() => setAllowRegistration(!allowRegistration)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      allowRegistration ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        allowRegistration ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'commission' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Commission Settings</h3>
                  <p className="text-gray-400 text-sm mb-6">Configure commission rates and limits</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Referral Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    value={referralCommission}
                    onChange={(e) => setReferralCommission(Number(e.target.value))}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-gray-400 text-xs mt-1">Percentage earned from referral deposits</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Trading Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    value={tradingCommission}
                    onChange={(e) => setTradingCommission(Number(e.target.value))}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-gray-400 text-xs mt-1">Percentage earned from trading profits</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Minimum Withdrawal Amount ($)
                  </label>
                  <input
                    type="number"
                    value={minimumWithdrawal}
                    onChange={(e) => setMinimumWithdrawal(Number(e.target.value))}
                    min="0"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-gray-400 text-xs mt-1">Minimum amount users can withdraw</p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                  <p className="text-blue-400 text-sm">
                    💡 <strong>Tip:</strong> Changes to commission rates will only apply to new transactions. Existing commissions remain unchanged.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Security Settings</h3>
                  <p className="text-gray-400 text-sm mb-6">Configure platform security options</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Require Two-Factor Authentication</p>
                    <p className="text-gray-400 text-sm">Force 2FA for all users</p>
                  </div>
                  <button
                    onClick={() => setTwoFactorRequired(!twoFactorRequired)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      twoFactorRequired ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        twoFactorRequired ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(Number(e.target.value))}
                    min="5"
                    max="1440"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-gray-400 text-xs mt-1">Auto logout after inactivity</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Login Attempts
                  </label>
                  <input
                    type="number"
                    value={maxLoginAttempts}
                    onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
                    min="3"
                    max="10"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-gray-400 text-xs mt-1">Lock account after failed attempts</p>
                </div>

                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-400 text-sm">
                    ⚠️ <strong>Warning:</strong> Changing security settings may affect all users. Proceed with caution.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Email Settings</h3>
                  <p className="text-gray-400 text-sm mb-6">Configure email notifications and SMTP</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email From Address
                  </label>
                  <input
                    type="email"
                    value={emailFrom}
                    onChange={(e) => setEmailFrom(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Email Notifications</p>
                    <p className="text-gray-400 text-sm">Send automated emails to users</p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      emailNotifications ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                  <p className="text-white font-medium text-sm">Test Email Configuration</p>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                    Send Test Email
                  </button>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Reset
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50 flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Platform Version</p>
            <p className="text-white font-semibold text-lg">v2.0.0</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Database Status</p>
            <p className="text-green-500 font-semibold text-lg">● Connected</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Last Updated</p>
            <p className="text-white font-semibold text-lg">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
