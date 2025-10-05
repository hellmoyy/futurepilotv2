'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    binanceApiKey: '',
    binanceApiSecret: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save API keys to database
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-blue-300 to-blue-600 bg-clip-text text-transparent">
            CEX Settings
          </span>
        </h1>
        <p className="text-gray-400">Configure your exchange API credentials</p>
      </div>

      {/* Binance API Configuration */}
      <div className="bg-black/50 rounded-2xl border border-white/10 p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Binance API</h2>
            <p className="text-sm text-gray-400">Connect your Binance account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {saved && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
              <p className="text-green-500 text-sm">✓ Settings saved successfully</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key
            </label>
            <input
              type="text"
              value={formData.binanceApiKey}
              onChange={(e) => setFormData({ ...formData, binanceApiKey: e.target.value })}
              placeholder="Enter your Binance API Key"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Secret
            </label>
            <input
              type="password"
              value={formData.binanceApiSecret}
              onChange={(e) => setFormData({ ...formData, binanceApiSecret: e.target.value })}
              placeholder="Enter your Binance API Secret"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2">Security Notice</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Your API keys are encrypted and stored securely</li>
              <li>• Never share your API Secret with anyone</li>
              <li>• Enable IP whitelist on Binance for extra security</li>
              <li>• We recommend creating API keys with trading permissions only</li>
            </ul>
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
          >
            Save Configuration
          </button>
        </form>
      </div>

      {/* How to Get API Keys */}
      <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-bold mb-4">How to Get Binance API Keys</h3>
        <ol className="text-gray-400 space-y-2 list-decimal list-inside">
          <li>Log in to your Binance account</li>
          <li>Go to Profile → API Management</li>
          <li>Create a new API key</li>
          <li>Enable trading permissions (optional: futures)</li>
          <li>Copy the API Key and Secret</li>
          <li>Paste them in the form above</li>
        </ol>
        <a
          href="https://www.binance.com/en/my/settings/api-management"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center mt-4 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>Go to Binance API Management</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
