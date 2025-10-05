'use client';

export default function HistoryPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-blue-300 to-blue-600 bg-clip-text text-transparent">
            Trading History
          </span>
        </h1>
        <p className="text-gray-400">View all your past trades and performance</p>
      </div>

      {/* Empty State */}
      <div className="bg-black/50 rounded-2xl border border-white/10 p-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4">No Trading History Yet</h2>
        <p className="text-gray-400 mb-8">
          Your completed trades will appear here. Start trading to see your history.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/dashboard/futures"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
          >
            Start Trading
          </a>
          <a
            href="/dashboard"
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg font-semibold hover:bg-white/10 transition-all"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
