'use client';

export default function AIAgentPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-blue-300 to-blue-600 bg-clip-text text-transparent">
            AI Trading Agent
          </span>
        </h1>
        <p className="text-gray-400">Let artificial intelligence trade for you 24/7</p>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 rounded-3xl p-12 border border-white/10 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-4">Coming Soon</h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          AI Trading Agent is under development. Advanced machine learning algorithms will analyze markets and execute trades automatically based on your risk profile.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/ai-demo"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
          >
            Try AI Demo
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2">Smart Analysis</h3>
          <p className="text-sm text-gray-400">AI analyzes market patterns and trends 24/7</p>
        </div>

        <div className="bg-black/50 rounded-xl p-6 border border-white/10">
          <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2">Auto Execution</h3>
          <p className="text-sm text-gray-400">Automatic trade execution based on signals</p>
        </div>

        <div className="bg-black/50 rounded-xl p-6 border border-white/10">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2">Risk Control</h3>
          <p className="text-sm text-gray-400">Customizable risk parameters and limits</p>
        </div>
      </div>
    </div>
  );
}
