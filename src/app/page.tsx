export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                FuturePilot
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="/ai-demo" className="text-gray-300 hover:text-white transition-colors">AI Demo</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

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
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
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
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105">
                Start Trading Now
              </button>
              <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all">
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 max-w-4xl mx-auto">
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  $2.4B+
                </div>
                <div className="text-sm text-gray-400">Trading Volume</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  150K+
                </div>
                <div className="text-sm text-gray-400">Active Traders</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  99.9%
                </div>
                <div className="text-sm text-gray-400">Uptime</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  24/7
                </div>
                <div className="text-sm text-gray-400">AI Trading</div>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-8 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Chart Card */}
                <div className="md:col-span-2 bg-black/50 rounded-xl p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400">BTC/USDT</span>
                    <span className="text-green-500 text-2xl font-bold">+12.4%</span>
                  </div>
                  <div className="h-48 bg-gradient-to-t from-blue-500/10 to-purple-500/10 rounded-lg flex items-end justify-around p-4">
                    <div className="w-8 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{height: '60%'}}></div>
                    <div className="w-8 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{height: '45%'}}></div>
                    <div className="w-8 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t" style={{height: '75%'}}></div>
                    <div className="w-8 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t" style={{height: '55%'}}></div>
                    <div className="w-8 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t" style={{height: '85%'}}></div>
                    <div className="w-8 bg-gradient-to-t from-pink-500 to-pink-400 rounded-t" style={{height: '70%'}}></div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="space-y-4">
                  <div className="bg-black/50 rounded-xl p-6 border border-white/5">
                    <div className="text-sm text-gray-400 mb-2">Portfolio Value</div>
                    <div className="text-3xl font-bold text-white">$124,580</div>
                    <div className="text-green-500 text-sm mt-1">↑ $12,450 (10.2%)</div>
                  </div>
                  <div className="bg-black/50 rounded-xl p-6 border border-white/5">
                    <div className="text-sm text-gray-400 mb-2">Active Trades</div>
                    <div className="text-3xl font-bold text-white">8</div>
                    <div className="text-blue-500 text-sm mt-1">AI Optimized</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-gray-400">Everything you need to dominate the markets</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">AI-Powered Analysis</h3>
              <p className="text-gray-400">Advanced machine learning algorithms analyze market patterns 24/7 to identify profitable opportunities.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Lightning Fast Execution</h3>
              <p className="text-gray-400">Execute trades in milliseconds with our optimized infrastructure and direct exchange connections.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-pink-900/20 to-blue-900/20 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Bank-Level Security</h3>
              <p className="text-gray-400">Your funds and data are protected with military-grade encryption and multi-layer security protocols.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 md:p-20 overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 text-center space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Ready to Transform Your Trading?
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Join thousands of traders who are already using AI to maximize their profits.
              </p>
              <button className="px-10 py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl">
                Start Free Trial
              </button>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Disclaimer</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
              <span className="font-bold">FuturePilot</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 FuturePilot.pro - All rights reserved
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}