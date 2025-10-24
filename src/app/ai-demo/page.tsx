/* eslint-disable @next/next/no-img-element */
'use client';

import AIChat from '@/components/AIChat';
import MarketAnalyzer from '@/components/MarketAnalyzer';
import { useTheme } from '@/contexts/ThemeContext';

export default function AIDemo() {
  const { theme } = useTheme();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={theme === 'light' ? '/images/logos/logo-light.png' : '/images/logos/logo-dark.png'}
                alt="FuturePilot" 
                className="h-10 w-auto"
              />
            </a>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">AI Demo</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-300 to-blue-600 bg-clip-text text-transparent">
                AI-Powered Trading
              </span>
            </h1>
            <p className="text-xl text-gray-400">
              Experience the future of trading with artificial intelligence
            </p>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Chat */}
            <div className="h-[600px]">
              <AIChat />
            </div>

            {/* Market Analyzer */}
            <div className="h-[600px] overflow-y-auto">
              <MarketAnalyzer />
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">Conversational AI</h3>
              <p className="text-gray-400 text-sm">
                Chat with our AI assistant to get trading insights, market analysis, and strategy recommendations.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">Technical Analysis</h3>
              <p className="text-gray-400 text-sm">
                Get instant AI-powered technical analysis for any trading pair with support and resistance levels.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">Real-Time Insights</h3>
              <p className="text-gray-400 text-sm">
                Powered by GPT-4, our AI provides up-to-date market insights and trading recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
