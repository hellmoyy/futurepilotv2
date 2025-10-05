import Navigation from '@/components/Navigation';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-300">AI-Powered Trading • Live Now</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-300 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                Trade Smarter
              </span>
              <br />
              <span className="text-white">With AI Precision</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
              Advanced artificial intelligence meets automated trading. 
              Let FuturePilot navigate the markets while you focus on what matters.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105">
                Start Trading Now
              </button>
              <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all">
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 max-w-4xl mx-auto">
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">99.9%</div>
                <div className="text-gray-400">Uptime</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">$2.5B+</div>
                <div className="text-gray-400">Volume Traded</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">50K+</div>
                <div className="text-gray-400">Active Users</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">24/7</div>
                <div className="text-gray-400">AI Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl"></div>
            
            {/* Dashboard Card */}
            <div className="relative bg-black/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Trading Dashboard</h3>
                  <p className="text-gray-400">Real-time market analysis powered by AI</p>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-green-500 text-sm font-semibold">Live</span>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-2xl p-6 border border-white/5">
                  <div className="text-sm text-gray-400 mb-4">Portfolio Value</div>
                  <div className="text-3xl font-bold mb-2">$128,450</div>
                  <div className="text-green-500 text-sm">+12.5% this month</div>
                  <div className="mt-6 flex items-end space-x-2 h-24">
                    <div className="flex-1 bg-gradient-to-t from-blue-500 to-blue-600 rounded-t opacity-50" style={{height: '40%'}}></div>
                    <div className="flex-1 bg-gradient-to-t from-blue-500 to-blue-600 rounded-t opacity-60" style={{height: '60%'}}></div>
                    <div className="flex-1 bg-gradient-to-t from-blue-500 to-blue-600 rounded-t opacity-70" style={{height: '75%'}}></div>
                    <div className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t opacity-80" style={{height: '85%'}}></div>
                    <div className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t" style={{height: '100%'}}></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-2xl p-6 border border-white/5">
                  <div className="text-sm text-gray-400 mb-4">Active Trades</div>
                  <div className="text-3xl font-bold mb-2">24</div>
                  <div className="text-cyan-500 text-sm">8 winning positions</div>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">BTC/USD</span>
                      <span className="text-green-500 text-sm">+2.4%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">ETH/USD</span>
                      <span className="text-green-500 text-sm">+1.8%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">SOL/USD</span>
                      <span className="text-cyan-500 text-sm">+3.2%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-2xl p-6 border border-white/5">
                  <div className="text-sm text-gray-400 mb-4">AI Confidence</div>
                  <div className="text-3xl font-bold mb-2">94%</div>
                  <div className="text-blue-500 text-sm">High confidence level</div>
                  <div className="mt-6">
                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{width: '94%'}}></div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Market Analysis</span>
                        <span className="text-blue-500">Bullish</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Risk Level</span>
                        <span className="text-green-500">Low</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-gradient-to-b from-black via-blue-950/10 to-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-300 to-blue-600 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-gray-400">Everything you need to dominate the markets</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-700/20 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">AI-Powered Analysis</h3>
              <p className="text-gray-400">Advanced machine learning algorithms analyze market patterns 24/7 to identify profitable opportunities.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-blue-800/20 to-cyan-900/20 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Lightning Fast Execution</h3>
              <p className="text-gray-400">Execute trades in milliseconds with our optimized infrastructure and direct exchange connections.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Bank-Level Security</h3>
              <p className="text-gray-400">Your assets are protected with military-grade encryption and multi-layer security protocols.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-400/20 blur-3xl"></div>
            
            {/* Card */}
            <div className="relative bg-gradient-to-br from-blue-900/40 to-blue-700/40 rounded-3xl p-12 border border-white/10 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Start Trading?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of traders who trust FuturePilot to maximize their returns with AI-powered automation.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105">
                  Start Free Trial
                </button>
                <button className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all">
                  Schedule Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-blue-600 bg-clip-text text-transparent">
                FuturePilot
              </span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 FuturePilot.pro - All rights reserved
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
