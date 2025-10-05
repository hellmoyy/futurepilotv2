'use client';

export default function SpotTradingPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-blue-300 to-blue-600 bg-clip-text text-transparent">
            Spot Trading
          </span>
        </h1>
        <p className="text-gray-400">Buy and sell cryptocurrencies instantly</p>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 rounded-3xl p-12 border border-white/10 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-4">Coming Soon</h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          Spot trading interface is under development. You'll be able to trade spot markets with advanced order types and real-time price updates.
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
          <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2">Instant Trading</h3>
          <p className="text-sm text-gray-400">Buy and sell instantly at market price</p>
        </div>

        <div className="bg-black/50 rounded-xl p-6 border border-white/10">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2">Order Types</h3>
          <p className="text-sm text-gray-400">Market, Limit, Stop-Limit orders</p>
        </div>

        <div className="bg-black/50 rounded-xl p-6 border border-white/10">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2">Real-time Data</h3>
          <p className="text-sm text-gray-400">Live price feeds and order book</p>
        </div>
      </div>
    </div>
  );
}
