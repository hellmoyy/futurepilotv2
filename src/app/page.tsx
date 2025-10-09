'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import { useEffect, useState } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const themeContext = useTheme();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }
  
  const { theme } = themeContext;
  
  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-900 light:bg-gradient-to-br light:from-gray-50 light:via-blue-50 light:to-gray-100 text-white dark:text-white light:text-gray-900 relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/30 dark:bg-blue-500/30 light:bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/30 dark:bg-cyan-500/30 light:bg-cyan-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-600/30 dark:bg-blue-600/30 light:bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Liquid Glass Badge */}
            <div className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white/5 dark:bg-white/5 light:bg-white/80 backdrop-blur-2xl rounded-full border border-white/20 dark:border-white/20 light:border-blue-300 shadow-2xl shadow-blue-500/10">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
              <span className="text-sm text-white/90 dark:text-white/90 light:text-gray-700 font-medium">AI-Powered Trading • Live Now</span>
            </div>

            {/* Main Heading with Liquid Glass Effect */}
            <div className="relative">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight">
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-300 dark:to-cyan-300 light:from-blue-600 light:to-cyan-600 bg-clip-text text-transparent">
                    Trade Smarter
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 opacity-30 blur-2xl"></div>
                </span>
                <br />
                <span className="text-white dark:text-white light:text-gray-900 drop-shadow-2xl">With AI Precision</span>
              </h1>
            </div>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-gray-300 dark:text-gray-300 light:text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Advanced artificial intelligence meets automated trading. 
              Let FuturePilot navigate the markets while you focus on what matters.
            </p>

            {/* Liquid Glass CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">Start Trading Now</span>
                <div className="absolute inset-0 bg-white/20 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              <button className="px-8 py-4 bg-white/5 backdrop-blur-2xl border border-white/20 rounded-2xl font-semibold text-lg hover:bg-white/10 hover:border-white/30 transition-all duration-300 shadow-xl">
                Watch Demo
              </button>
              
              {/* Theme Toggle */}
              <div className="ml-2">
                <ThemeToggle />
              </div>
            </div>

            {/* Liquid Glass Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 max-w-5xl mx-auto">
              <div className="group relative bg-white/5 dark:bg-white/5 light:bg-white/80 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 dark:border-white/10 light:border-blue-200 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative space-y-2">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-300 dark:to-blue-500 light:from-blue-600 light:to-blue-700 bg-clip-text text-transparent">99.9%</div>
                  <div className="text-gray-300 dark:text-gray-300 light:text-gray-700 font-medium">Uptime</div>
                </div>
              </div>
              <div className="group relative bg-white/5 dark:bg-white/5 light:bg-white/80 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 dark:border-white/10 light:border-blue-200 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative space-y-2">
                  <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 dark:from-cyan-300 dark:to-blue-400 light:from-cyan-600 light:to-blue-700 bg-clip-text text-transparent">$2.5B+</div>
                  <div className="text-gray-300 dark:text-gray-300 light:text-gray-700 font-medium">Volume Traded</div>
                </div>
              </div>
              <div className="group relative bg-white/5 dark:bg-white/5 light:bg-white/80 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 dark:border-white/10 light:border-blue-200 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative space-y-2">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">50K+</div>
                  <div className="text-gray-300 dark:text-gray-300 light:text-gray-700 font-medium">Active Users</div>
                </div>
              </div>
              <div className="group relative bg-white/5 dark:bg-white/5 light:bg-white/80 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 dark:border-white/10 light:border-blue-200 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative space-y-2">
                  <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">24/7</div>
                  <div className="text-gray-300 dark:text-gray-300 light:text-gray-700 font-medium">AI Monitoring</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview with Liquid Glass */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            {/* Ambient Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-3xl opacity-50"></div>
            
            {/* Liquid Glass Dashboard Card */}
            <div className="relative bg-white/[0.03] dark:bg-white/[0.03] light:bg-white/90 backdrop-blur-3xl rounded-[2rem] border border-white/10 dark:border-white/10 light:border-blue-200 p-8 overflow-hidden shadow-2xl">
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 dark:from-blue-500/5 dark:to-cyan-500/5 light:from-blue-100/30 light:to-cyan-100/30"></div>
              
              {/* Header */}
              <div className="relative flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white dark:text-white light:text-gray-900 mb-2">Trading Dashboard</h3>
                  <p className="text-gray-300 dark:text-gray-300 light:text-gray-600">Real-time market analysis powered by AI</p>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/10 backdrop-blur-xl rounded-full border border-green-500/20">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
                  <span className="text-green-300 text-sm font-semibold">Live</span>
                </div>
              </div>

              {/* Charts with Liquid Glass */}
              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Portfolio Card */}
                <div className="group relative bg-white/5 dark:bg-white/5 light:bg-white backdrop-blur-2xl rounded-3xl p-6 border border-white/10 dark:border-white/10 light:border-blue-200 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 transition-all duration-300 hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-600 mb-4 font-medium">Portfolio Value</div>
                    <div className="text-3xl font-bold text-white dark:text-white light:text-gray-900 mb-2">$128,450</div>
                    <div className="text-green-400 dark:text-green-400 light:text-green-600 text-sm font-medium">+12.5% this month</div>
                    <div className="mt-6 flex items-end space-x-2 h-24">
                      <div className="flex-1 bg-gradient-to-t from-blue-400/80 to-blue-500/80 backdrop-blur-xl rounded-t-lg shadow-lg shadow-blue-500/20" style={{height: '40%'}}></div>
                      <div className="flex-1 bg-gradient-to-t from-blue-400/80 to-blue-500/80 backdrop-blur-xl rounded-t-lg shadow-lg shadow-blue-500/20" style={{height: '60%'}}></div>
                      <div className="flex-1 bg-gradient-to-t from-blue-400/80 to-blue-500/80 backdrop-blur-xl rounded-t-lg shadow-lg shadow-blue-500/20" style={{height: '75%'}}></div>
                      <div className="flex-1 bg-gradient-to-t from-blue-400/80 to-cyan-400/80 backdrop-blur-xl rounded-t-lg shadow-lg shadow-cyan-500/20" style={{height: '85%'}}></div>
                      <div className="flex-1 bg-gradient-to-t from-blue-400/80 to-cyan-400/80 backdrop-blur-xl rounded-t-lg shadow-lg shadow-cyan-500/20" style={{height: '100%'}}></div>
                    </div>
                  </div>
                </div>

                {/* Active Trades Card */}
                <div className="group relative bg-white/5 dark:bg-white/5 light:bg-white backdrop-blur-2xl rounded-3xl p-6 border border-white/10 dark:border-white/10 light:border-blue-200 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 transition-all duration-300 hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-600 mb-4 font-medium">Active Trades</div>
                    <div className="text-3xl font-bold text-white dark:text-white light:text-gray-900 mb-2">24</div>
                    <div className="text-cyan-400 dark:text-cyan-400 light:text-cyan-600 text-sm font-medium">8 winning positions</div>
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/5 dark:bg-white/5 light:bg-blue-50 backdrop-blur-xl rounded-xl border border-white/5 dark:border-white/5 light:border-blue-200 hover:border-white/10 dark:hover:border-white/10 light:hover:border-blue-300 transition-all">
                        <span className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 font-medium">BTC/USD</span>
                        <span className="text-green-400 dark:text-green-400 light:text-green-600 text-sm font-semibold">+2.4%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 dark:bg-white/5 light:bg-blue-50 backdrop-blur-xl rounded-xl border border-white/5 dark:border-white/5 light:border-blue-200 hover:border-white/10 dark:hover:border-white/10 light:hover:border-blue-300 transition-all">
                        <span className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 font-medium">ETH/USD</span>
                        <span className="text-green-400 dark:text-green-400 light:text-green-600 text-sm font-semibold">+1.8%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 dark:bg-white/5 light:bg-blue-50 backdrop-blur-xl rounded-xl border border-white/5 dark:border-white/5 light:border-blue-200 hover:border-white/10 dark:hover:border-white/10 light:hover:border-blue-300 transition-all">
                        <span className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 font-medium">SOL/USD</span>
                        <span className="text-cyan-400 dark:text-cyan-400 light:text-cyan-600 text-sm font-semibold">+3.2%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Confidence Card */}
                <div className="group relative bg-white/5 dark:bg-white/5 light:bg-white backdrop-blur-2xl rounded-3xl p-6 border border-white/10 dark:border-white/10 light:border-blue-200 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 transition-all duration-300 hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-600 mb-4 font-medium">AI Confidence</div>
                    <div className="text-3xl font-bold text-white dark:text-white light:text-gray-900 mb-2">94%</div>
                    <div className="text-blue-400 dark:text-blue-400 light:text-blue-600 text-sm font-medium">High confidence level</div>
                    <div className="mt-6">
                      <div className="w-full bg-white/5 dark:bg-white/5 light:bg-gray-200 backdrop-blur-xl rounded-full h-3 overflow-hidden border border-white/10 dark:border-white/10 light:border-blue-300">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full shadow-lg shadow-blue-500/30" style={{width: '94%'}}></div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between p-2 bg-white/5 dark:bg-white/5 light:bg-blue-50 backdrop-blur-xl rounded-lg border border-transparent light:border-blue-200">
                          <span className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-600">Market Analysis</span>
                          <span className="text-xs text-blue-400 dark:text-blue-400 light:text-blue-600 font-semibold">Bullish</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white/5 dark:bg-white/5 light:bg-blue-50 backdrop-blur-xl rounded-lg border border-transparent light:border-blue-200">
                          <span className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-600">Risk Level</span>
                          <span className="text-xs text-green-400 dark:text-green-400 light:text-green-600 font-semibold">Low</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Liquid Glass */}
      <section id="features" className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-300 dark:to-cyan-300 light:from-blue-600 light:to-cyan-600 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-gray-300 dark:text-gray-300 light:text-gray-600">Everything you need to dominate the markets</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group relative bg-white/[0.03] dark:bg-white/[0.03] light:bg-white backdrop-blur-3xl rounded-3xl p-8 border border-white/10 dark:border-white/10 light:border-blue-200 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 transition-all duration-300 hover:scale-[1.02] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400/20 to-blue-600/20 dark:from-blue-400/20 dark:to-blue-600/20 light:from-blue-100 light:to-blue-200 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 border border-blue-400/20 dark:border-blue-400/20 light:border-blue-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-blue-500/30 transition-all duration-300">
                  <svg className="w-8 h-8 text-blue-300 dark:text-blue-300 light:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white dark:text-white light:text-gray-900">AI-Powered Analysis</h3>
                <p className="text-gray-300 dark:text-gray-300 light:text-gray-600 leading-relaxed">Advanced machine learning algorithms analyze market patterns 24/7 to identify profitable opportunities.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-white/[0.03] dark:bg-white/[0.03] light:bg-white backdrop-blur-3xl rounded-3xl p-8 border border-white/10 dark:border-white/10 light:border-blue-200 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 transition-all duration-300 hover:scale-[1.02] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 dark:from-cyan-400/20 dark:to-blue-600/20 light:from-cyan-100 light:to-blue-200 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 border border-cyan-400/20 dark:border-cyan-400/20 light:border-cyan-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-cyan-500/30 transition-all duration-300">
                  <svg className="w-8 h-8 text-cyan-300 dark:text-cyan-300 light:text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white dark:text-white light:text-gray-900">Lightning Fast Execution</h3>
                <p className="text-gray-300 dark:text-gray-300 light:text-gray-600 leading-relaxed">Execute trades in milliseconds with our optimized infrastructure and direct exchange connections.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-white/[0.03] dark:bg-white/[0.03] light:bg-white backdrop-blur-3xl rounded-3xl p-8 border border-white/10 dark:border-white/10 light:border-blue-200 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 transition-all duration-300 hover:scale-[1.02] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 dark:from-blue-500/20 dark:to-cyan-500/20 light:from-blue-100 light:to-cyan-200 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 border border-blue-400/20 dark:border-blue-400/20 light:border-blue-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-blue-500/30 transition-all duration-300">
                  <svg className="w-8 h-8 text-blue-300 dark:text-blue-300 light:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white dark:text-white light:text-gray-900">Bank-Level Security</h3>
                <p className="text-gray-300 dark:text-gray-300 light:text-gray-600 leading-relaxed">Your assets are protected with military-grade encryption and multi-layer security protocols.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Liquid Glass */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Ambient Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-blue-500/30 blur-3xl opacity-50"></div>
            
            {/* Liquid Glass Card */}
            <div className="relative bg-white/[0.03] dark:bg-white/[0.03] light:bg-white/90 backdrop-blur-3xl rounded-[2rem] p-12 border border-white/10 dark:border-white/10 light:border-blue-200 text-center overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 dark:from-blue-500/10 dark:to-cyan-500/10 light:from-blue-100/50 light:to-cyan-100/50"></div>
              <div className="relative">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white dark:text-white light:text-gray-900">
                  Ready to Start Trading?
                </h2>
                <p className="text-xl text-gray-300 dark:text-gray-300 light:text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Join thousands of traders who trust FuturePilot to maximize their returns with AI-powered automation.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10">Start Free Trial</span>
                  </button>
                  <button className="px-8 py-4 bg-white/90 backdrop-blur-xl text-gray-900 rounded-2xl font-semibold text-lg hover:bg-white transition-all duration-300 shadow-xl">
                    Schedule Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Liquid Glass */}
      <footer className="relative border-t border-white/10 dark:border-white/10 light:border-blue-200 py-12 px-6 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <img 
                src={theme === 'light' ? '/images/logos/logo-light.png' : '/images/logos/logo-dark.png'}
                alt="FuturePilot" 
                className="h-10 w-auto"
              />
            </div>
            <div className="text-gray-300 dark:text-gray-300 light:text-gray-600 text-sm">
              © 2024 FuturePilot.pro - All rights reserved
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
