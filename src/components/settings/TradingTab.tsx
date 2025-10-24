'use client';

import { useState, useEffect } from 'react';

export default function TradingTab() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [tradingConfig, setTradingConfig] = useState({
    riskLevel: 'medium',
    maxPositions: 5,
    maxLeverage: 10,
    stopLossPercentage: 5,
    takeProfitPercentage: 10,
    autoTrade: false,
    trailingStop: false,
  });

  useEffect(() => {
    fetchTradingConfig();
  }, []);

  const fetchTradingConfig = async () => {
    try {
      const response = await fetch('/api/user/trading-config');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setTradingConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Error fetching trading config:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/trading-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradingConfig),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Trading settings updated successfully!');
      } else {
        setError(data.error || 'Failed to update trading settings');
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
          Trading Preferences
        </h2>
        <p className="text-gray-400 light:text-gray-600">
          Configure your trading strategy and risk management
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Risk Management */}
        <div className="p-6 bg-white/5 rounded-xl light:bg-gray-50 border border-white/10 light:border-gray-200">
          <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-4">
            Risk Management
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-2">
                Risk Level
              </label>
              <select
                value={tradingConfig.riskLevel}
                onChange={(e) => setTradingConfig({ ...tradingConfig, riskLevel: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white light:bg-white light:border-gray-300 light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low - Conservative trading</option>
                <option value="medium">Medium - Balanced approach</option>
                <option value="high">High - Aggressive trading</option>
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-2">
                  Max Concurrent Positions
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tradingConfig.maxPositions}
                  onChange={(e) => setTradingConfig({ ...tradingConfig, maxPositions: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white light:bg-white light:border-gray-300 light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-2">
                  Max Leverage
                </label>
                <input
                  type="number"
                  min="1"
                  max="125"
                  value={tradingConfig.maxLeverage}
                  onChange={(e) => setTradingConfig({ ...tradingConfig, maxLeverage: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white light:bg-white light:border-gray-300 light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-2">
                  Stop Loss (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="0.5"
                  value={tradingConfig.stopLossPercentage}
                  onChange={(e) => setTradingConfig({ ...tradingConfig, stopLossPercentage: parseFloat(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white light:bg-white light:border-gray-300 light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-2">
                  Take Profit (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="0.5"
                  value={tradingConfig.takeProfitPercentage}
                  onChange={(e) => setTradingConfig({ ...tradingConfig, takeProfitPercentage: parseFloat(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white light:bg-white light:border-gray-300 light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Trading Features */}
        <div className="p-6 bg-white/5 rounded-xl light:bg-gray-50 border border-white/10 light:border-gray-200">
          <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-4">
            Trading Features
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg light:bg-white border border-white/10 light:border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  tradingConfig.autoTrade 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-gray-500/20 border border-gray-500/30'
                }`}>
                  <svg className={`w-5 h-5 ${tradingConfig.autoTrade ? 'text-green-400' : 'text-gray-400'}`} 
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white light:text-gray-900">Auto Trading</p>
                  <p className="text-xs text-gray-400 light:text-gray-600">
                    Enable automated trade execution
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTradingConfig({ ...tradingConfig, autoTrade: !tradingConfig.autoTrade })}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  tradingConfig.autoTrade ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    tradingConfig.autoTrade ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg light:bg-white border border-white/10 light:border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  tradingConfig.trailingStop 
                    ? 'bg-blue-500/20 border border-blue-500/30' 
                    : 'bg-gray-500/20 border border-gray-500/30'
                }`}>
                  <svg className={`w-5 h-5 ${tradingConfig.trailingStop ? 'text-blue-400' : 'text-gray-400'}`} 
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white light:text-gray-900">Trailing Stop Loss</p>
                  <p className="text-xs text-gray-400 light:text-gray-600">
                    Automatically adjust stop loss with profit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTradingConfig({ ...tradingConfig, trailingStop: !tradingConfig.trailingStop })}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  tradingConfig.trailingStop ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    tradingConfig.trailingStop ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex gap-3">
          <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-sm text-yellow-200 light:text-yellow-800">
            <p className="font-semibold mb-1">Trading Risk Warning</p>
            <p>
              Cryptocurrency trading carries significant risk. Only trade with funds you can afford to lose. 
              Higher leverage and more aggressive settings increase both potential gains and losses.
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
            onClick={fetchTradingConfig}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white light:bg-gray-200 light:text-gray-700 light:hover:bg-gray-300 rounded-xl font-semibold transition-all"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
