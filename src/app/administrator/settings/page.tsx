'use client';

import { useState, useEffect } from 'react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'commission' | 'trading' | 'security' | 'email'>('general');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // General Settings
  const [platformName, setPlatformName] = useState('FuturePilot');
  const [platformUrl, setPlatformUrl] = useState('https://futurepilot.pro');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);

  // Referral Commission Settings (Tier-based)
  const [commissionRates, setCommissionRates] = useState({
    bronze: { level1: 5, level2: 2, level3: 1 },
    silver: { level1: 10, level2: 5, level3: 2 },
    gold: { level1: 15, level2: 8, level3: 4 },
    platinum: { level1: 20, level2: 10, level3: 5 },
  });
  const [minimumWithdrawal, setMinimumWithdrawal] = useState(10);

  // Trading Commission Settings
  const [tradingCommission, setTradingCommission] = useState(20);

  // Security Settings
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);

  // Email Settings
  const [emailFrom, setEmailFrom] = useState('noreply@futurepilot.pro');
  const [smtpHost, setSmtpHost] = useState('smtp.example.com');
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      const data = await response.json();

      if (data.success && data.settings) {
        const s = data.settings;
        
        // General Settings
        if (s.platformName) setPlatformName(s.platformName);
        if (s.platformUrl) setPlatformUrl(s.platformUrl);
        if (s.maintenanceMode !== undefined) setMaintenanceMode(s.maintenanceMode);
        if (s.allowRegistration !== undefined) setAllowRegistration(s.allowRegistration);

        // Commission Settings
        if (s.referralCommission) setCommissionRates(s.referralCommission);
        if (s.minimumWithdrawal !== undefined) setMinimumWithdrawal(s.minimumWithdrawal);
        if (s.tradingCommission !== undefined) setTradingCommission(s.tradingCommission);

        // Security Settings
        if (s.twoFactorRequired !== undefined) setTwoFactorRequired(s.twoFactorRequired);
        if (s.sessionTimeout) setSessionTimeout(s.sessionTimeout);
        if (s.maxLoginAttempts) setMaxLoginAttempts(s.maxLoginAttempts);

        // Email Settings
        if (s.emailFrom) setEmailFrom(s.emailFrom);
        if (s.smtpHost) setSmtpHost(s.smtpHost);
        if (s.emailNotifications !== undefined) setEmailNotifications(s.emailNotifications);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platformName,
          platformUrl,
          maintenanceMode,
          allowRegistration,
          referralCommission: commissionRates,
          minimumWithdrawal,
          tradingCommission,
          twoFactorRequired,
          sessionTimeout,
          maxLoginAttempts,
          emailFrom,
          smtpHost,
          emailNotifications,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Settings saved successfully!');
      } else {
        alert('❌ Failed to save settings: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'commission', name: 'Referral Commission', icon: '💰' },
    { id: 'trading', name: 'Trading Commission', icon: '📈' },
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-400">Loading settings...</p>
          </div>
        </div>
      ) : (
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
                  <h3 className="text-xl font-bold text-white mb-4">Referral Commission Settings</h3>
                  <p className="text-gray-400 text-sm mb-6">Configure commission rates for each membership tier and referral level</p>
                </div>

                {/* Bronze Tier */}
                <div className="bg-gradient-to-r from-orange-900/20 to-orange-800/20 border border-orange-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">🥉</span>
                      <div>
                        <h4 className="text-lg font-bold text-orange-400">Bronze Tier</h4>
                        <p className="text-gray-400 text-xs">Entry level membership</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Tier Requirement</p>
                      <p className="text-sm font-bold text-orange-400">$0 - $999</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Level 1 Commission (%)
                      </label>
                      <input
                        type="number"
                        value={commissionRates.bronze.level1}
                        onChange={(e) => setCommissionRates({
                          ...commissionRates,
                          bronze: { ...commissionRates.bronze, level1: Number(e.target.value) }
                        })}
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Level 2 Commission (%)
                      </label>
                      <input
                        type="number"
                        value={commissionRates.bronze.level2}
                        onChange={(e) => setCommissionRates({
                          ...commissionRates,
                          bronze: { ...commissionRates.bronze, level2: Number(e.target.value) }
                        })}
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Level 3 Commission (%)
                      </label>
                      <input
                        type="number"
                        value={commissionRates.bronze.level3}
                        onChange={(e) => setCommissionRates({
                          ...commissionRates,
                          bronze: { ...commissionRates.bronze, level3: Number(e.target.value) }
                        })}
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Silver Tier */}
                <div className="bg-gradient-to-r from-gray-700/20 to-gray-600/20 border border-gray-400/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">🥈</span>
                      <div>
                        <h4 className="text-lg font-bold text-gray-300">Silver Tier</h4>
                        <p className="text-gray-400 text-xs">Advanced membership</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Tier Requirement</p>
                      <p className="text-sm font-bold text-gray-300">$1,000 - $1,999</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Level 1 Commission (%)
                      </label>
                      <input
                        type="number"
                        value={commissionRates.silver.level1}
                        onChange={(e) => setCommissionRates({
                          ...commissionRates,
                          silver: { ...commissionRates.silver, level1: Number(e.target.value) }
                        })}
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Level 2 Commission (%)
                      </label>
                      <input
                        type="number"
                        value={commissionRates.silver.level2}
                        onChange={(e) => setCommissionRates({
                          ...commissionRates,
                          silver: { ...commissionRates.silver, level2: Number(e.target.value) }
                        })}
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Level 3 Commission (%)
                      </label>
                      <input
                        type="number"
                        value={commissionRates.silver.level3}
                        onChange={(e) => setCommissionRates({
                          ...commissionRates,
                          silver: { ...commissionRates.silver, level3: Number(e.target.value) }
                        })}
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Gold Tier */}
                <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-700/20 border border-yellow-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">🥇</span>
                      <div>
                        <h4 className="text-lg font-bold text-yellow-400">Gold Tier</h4>
                        <p className="text-gray-400 text-xs">Premium membership</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Tier Requirement</p>
                      <p className="text-sm font-bold text-yellow-400">$2,000 - $9,999</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Level 1 Commission (%)
                      </label>
                      <input
                        type="number"
                        value={commissionRates.gold.level1}
                        onChange={(e) => setCommissionRates({
                          ...commissionRates,
                          gold: { ...commissionRates.gold, level1: Number(e.target.value) }
                        })}
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Level 2 Commission (%)
                      </label>
                      <input
                        type="number"
                        value={commissionRates.gold.level2}
                        onChange={(e) => setCommissionRates({
                          ...commissionRates,
                          gold: { ...commissionRates.gold, level2: Number(e.target.value) }
                        })}
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Level 3 Commission (%)
                      </label>
                      <input
                        type="number"
                        value={commissionRates.gold.level3}
                        onChange={(e) => setCommissionRates({
                          ...commissionRates,
                          gold: { ...commissionRates.gold, level3: Number(e.target.value) }
                        })}
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Platinum Tier */}
                <div className="bg-gradient-to-r from-cyan-900/20 to-blue-800/20 border border-cyan-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">💎</span>
                      <div>
                        <h4 className="text-lg font-bold text-cyan-400">Platinum Tier</h4>
                        <p className="text-gray-400 text-xs">Elite membership</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Tier Requirement</p>
                      <p className="text-sm font-bold text-cyan-400">$10,000+</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Level 1 Commission (%)
                      </label>
                      <input
                        type="number"
                        value={commissionRates.platinum.level1}
                        onChange={(e) => setCommissionRates({
                          ...commissionRates,
                          platinum: { ...commissionRates.platinum, level1: Number(e.target.value) }
                        })}
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Level 2 Commission (%)
                      </label>
                      <input
                        type="number"
                        value={commissionRates.platinum.level2}
                        onChange={(e) => setCommissionRates({
                          ...commissionRates,
                          platinum: { ...commissionRates.platinum, level2: Number(e.target.value) }
                        })}
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Level 3 Commission (%)
                      </label>
                      <input
                        type="number"
                        value={commissionRates.platinum.level3}
                        onChange={(e) => setCommissionRates({
                          ...commissionRates,
                          platinum: { ...commissionRates.platinum, level3: Number(e.target.value) }
                        })}
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Minimum Withdrawal */}
                <div className="bg-gray-700/50 rounded-lg p-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Minimum Withdrawal Amount (USDT)
                  </label>
                  <input
                    type="number"
                    value={minimumWithdrawal}
                    onChange={(e) => setMinimumWithdrawal(Number(e.target.value))}
                    min="0"
                    step="5"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-gray-400 text-xs mt-1">Minimum amount users can withdraw from referral earnings</p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                  <p className="text-blue-400 text-sm">
                    💡 <strong>Info:</strong> Level 1 = Direct referrals, Level 2 = Referrals of your referrals, Level 3 = Third level referrals
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'trading' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Trading Commission Settings</h3>
                  <p className="text-gray-400 text-sm mb-6">Configure commission rates for trading bot profits</p>
                </div>

                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">📈</span>
                    <div>
                      <h4 className="text-lg font-bold text-purple-400">Platform Trading Commission</h4>
                      <p className="text-gray-400 text-xs">Commission earned from user trading bot profits</p>
                    </div>
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
                      step="0.5"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      Percentage of trading bot profits that goes to the platform
                    </p>
                  </div>

                  <div className="mt-6 bg-gray-700/50 rounded-lg p-4">
                    <h5 className="font-semibold text-white mb-2">Example Calculation:</h5>
                    <div className="space-y-1 text-sm text-gray-300">
                      <p>• User makes $1,000 profit from trading bot</p>
                      <p>• Platform commission ({tradingCommission}%): ${(1000 * tradingCommission / 100).toFixed(2)}</p>
                      <p className="text-green-400 font-semibold">• User keeps: ${(1000 - (1000 * tradingCommission / 100)).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ <strong>Note:</strong> Trading commission is automatically deducted from user's gas fee balance after each profitable trade. No commission is charged on losing trades.
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                  <p className="text-blue-400 text-sm">
                    💡 <strong>Business Logic:</strong> Commission is deducted from gas fee balance, not from trading account. User must maintain minimum $10 USDT gas fee to continue trading. Auto-close triggers at 90% of max profit to prevent negative balance.
                  </p>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/50 rounded-lg p-4">
                  <h5 className="font-semibold text-purple-400 mb-2">Gas Fee Balance Protection:</h5>
                  <div className="space-y-1 text-sm text-gray-300">
                    <p>• <strong>Minimum Gas Fee:</strong> $10 USDT (users cannot trade below this)</p>
                    <p>• <strong>Max Profit Formula:</strong> Gas Fee ÷ Commission Rate</p>
                    <p>• <strong>Auto-Close Threshold:</strong> 90% of max profit</p>
                    <p className="text-purple-300 mt-2">
                      <strong>Example with {tradingCommission}% rate:</strong> If user has $50 gas fee, max profit = $50 ÷ 0.{tradingCommission.toString().padStart(2, '0')} = ${(50 / (tradingCommission / 100)).toFixed(2)}. Auto-close triggers at ${(50 / (tradingCommission / 100) * 0.9).toFixed(2)} profit.
                    </p>
                  </div>
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
      )}

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
