'use client';

export default function FuturesTradingPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-blue-300 to-blue-600 bg-clip-text text-transparent">
            Futures Trading
          </span>
        </h1>
        <p className="text-gray-400">Trade cryptocurrency futures with leverage</p>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 rounded-3xl p-12 border border-white/10 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-4">Coming Soon</h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          Futures trading interface is under development. You'll be able to trade with leverage, manage positions, and set stop-loss/take-profit orders.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/dashboard/settings"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
          >
            Configure API Keys
          </a>
          <a
            href="/dashboard"
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg font-semibold hover:bg-white/10 transition-all"
          >
            Back to Dashboard
          </a>
        </div>
      </div>

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/50 rounded-xl p-6 border border-white/10">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2">Leverage Trading</h3>
          <p className="text-sm text-gray-400">Trade with up to 125x leverage on supported pairs</p>
        </div>

        <div className="bg-black/50 rounded-xl p-6 border border-white/10">
          <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2">Advanced Charts</h3>
          <p className="text-sm text-gray-400">Professional TradingView charts with indicators</p>
        </div>

        <div className="bg-black/50 rounded-xl p-6 border border-white/10">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2">Risk Management</h3>
          <p className="text-sm text-gray-400">Set stop-loss, take-profit, and trailing stops</p>
        </div>
      </div>
    </div>
  );
}
