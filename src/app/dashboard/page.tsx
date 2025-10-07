'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface DBStatus {
  status: string;
  database?: string;
  collections?: string[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [dbStatus, setDbStatus] = useState<DBStatus | null>(null);

  useEffect(() => {
    fetch('/api/db/test')
      .then((res) => res.json())
      .then((data) => setDbStatus(data))
      .catch((err) => console.error('Failed to fetch DB status:', err));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/10 dark:to-cyan-500/10 light:from-blue-100 light:to-cyan-100 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-white/20 light:border-blue-200">
        <h1 className="text-5xl font-bold mb-3">
          Welcome back,{' '}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-400 dark:to-cyan-400 light:from-blue-600 light:to-cyan-600 bg-clip-text text-transparent">
            {session?.user?.name}!
          </span>
        </h1>
        <p className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-lg">Here&apos;s an overview of your trading activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 dark:from-blue-900/50 dark:to-cyan-900/50 light:from-white light:to-blue-50 backdrop-blur-md rounded-2xl p-6 border border-blue-400/30 dark:border-blue-400/30 light:border-blue-200 shadow-xl shadow-blue-500/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-sm font-semibold uppercase tracking-wide">Total Balance</h3>
            <div className="w-12 h-12 bg-blue-500/30 dark:bg-blue-500/30 light:bg-blue-100 rounded-xl flex items-center justify-center backdrop-blur-sm border border-blue-400/30 dark:border-blue-400/30 light:border-blue-300">
              <svg className="w-6 h-6 text-blue-300 dark:text-blue-300 light:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold text-white dark:text-white light:text-gray-900 mb-2 tracking-tight">$0.00</div>
          <div className="text-sm text-green-400 dark:text-green-400 light:text-green-600 font-medium">+0% from last month</div>
        </div>

        <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 dark:from-cyan-900/50 dark:to-blue-900/50 light:from-white light:to-cyan-50 backdrop-blur-md rounded-2xl p-6 border border-cyan-400/30 dark:border-cyan-400/30 light:border-cyan-200 shadow-xl shadow-cyan-500/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-sm font-semibold uppercase tracking-wide">Active Trades</h3>
            <div className="w-12 h-12 bg-cyan-500/30 dark:bg-cyan-500/30 light:bg-cyan-100 rounded-xl flex items-center justify-center backdrop-blur-sm border border-cyan-400/30 dark:border-cyan-400/30 light:border-cyan-300">
              <svg className="w-6 h-6 text-cyan-300 dark:text-cyan-300 light:text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold text-white dark:text-white light:text-gray-900 mb-2 tracking-tight">0</div>
          <div className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-600 font-medium">No active positions</div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 dark:from-blue-900/50 dark:to-blue-800/50 light:from-white light:to-green-50 backdrop-blur-md rounded-2xl p-6 border border-green-400/30 dark:border-green-400/30 light:border-green-200 shadow-xl shadow-green-500/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-sm font-semibold uppercase tracking-wide">Total P&L</h3>
            <div className="w-12 h-12 bg-green-500/30 dark:bg-green-500/30 light:bg-green-100 rounded-xl flex items-center justify-center backdrop-blur-sm border border-green-400/30 dark:border-green-400/30 light:border-green-300">
              <svg className="w-6 h-6 text-green-300 dark:text-green-300 light:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold text-white dark:text-white light:text-gray-900 mb-2 tracking-tight">$0.00</div>
          <div className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-600 font-medium">0% win rate</div>
        </div>

        <div className="bg-gradient-to-br from-blue-800/50 to-purple-900/50 dark:from-blue-800/50 dark:to-purple-900/50 light:from-white light:to-purple-50 backdrop-blur-md rounded-2xl p-6 border border-purple-400/30 dark:border-purple-400/30 light:border-purple-200 shadow-xl shadow-purple-500/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-sm font-semibold uppercase tracking-wide">AI Status</h3>
            <div className="w-12 h-12 bg-purple-500/30 dark:bg-purple-500/30 light:bg-purple-100 rounded-xl flex items-center justify-center backdrop-blur-sm border border-purple-400/30 dark:border-purple-400/30 light:border-purple-300">
              <svg className="w-6 h-6 text-purple-300 dark:text-purple-300 light:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-white dark:text-white light:text-gray-900 mb-2 flex items-center tracking-tight">
            <span className="w-3 h-3 bg-gray-400 dark:bg-gray-400 light:bg-gray-500 rounded-full mr-3 animate-pulse"></span>
            Inactive
          </div>
          <div className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-600 font-medium">Configure API keys</div>
        </div>
      </div>

      {/* Database Status */}
            {/* Database Status */}
      {dbStatus && (
        <div className="bg-gradient-to-br from-black/60 to-blue-900/30 dark:from-black/60 dark:to-blue-900/30 light:from-white light:to-blue-50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 p-8 shadow-xl">
          <h3 className="text-2xl font-bold mb-6 text-white dark:text-white light:text-gray-900">Database Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black/30 dark:bg-black/30 light:bg-blue-50 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-white/10 light:border-blue-200">
              <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2 font-semibold uppercase tracking-wide">Status</p>
              <div className="flex items-center space-x-3">
                <span
                  className={`w-4 h-4 rounded-full animate-pulse ${
                    dbStatus.status === 'connected' ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-red-400 shadow-lg shadow-red-400/50'
                  }`}
                ></span>
                <span className="text-white dark:text-white light:text-gray-900 text-lg font-bold capitalize">{dbStatus.status}</span>
              </div>
            </div>
            {dbStatus.database && (
              <div className="bg-black/30 dark:bg-black/30 light:bg-blue-50 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-white/10 light:border-blue-200">
                <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2 font-semibold uppercase tracking-wide">Database</p>
                <p className="text-white dark:text-white light:text-gray-900 text-lg font-bold">{dbStatus.database}</p>
              </div>
            )}
            {dbStatus.collections && dbStatus.collections.length > 0 && (
              <div className="bg-black/30 dark:bg-black/30 light:bg-blue-50 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-white/10 light:border-blue-200">
                <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2 font-semibold uppercase tracking-wide">Collections</p>
                <p className="text-white dark:text-white light:text-gray-900 text-lg font-bold">{dbStatus.collections.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-black/60 to-blue-900/30 dark:from-black/60 dark:to-blue-900/30 light:from-white light:to-blue-50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 light:border-blue-200 p-8 shadow-xl">
        <h3 className="text-2xl font-bold mb-6 text-white dark:text-white light:text-gray-900">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/dashboard/settings"
            className="flex items-center space-x-4 p-6 bg-gradient-to-br from-blue-900/40 to-blue-700/40 dark:from-blue-900/40 dark:to-blue-700/40 light:from-blue-50 light:to-blue-100 backdrop-blur-sm rounded-xl border border-blue-400/30 dark:border-blue-400/30 light:border-blue-300 hover:border-blue-400/60 dark:hover:border-blue-400/60 light:hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/20 transition-all group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-white dark:text-white light:text-gray-900 text-lg mb-1">Configure CEX</h4>
              <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-600">Connect your exchange</p>
            </div>
          </a>

          <a
            href="/dashboard/automation"
            className="flex items-center space-x-4 p-6 bg-gradient-to-br from-cyan-900/40 to-blue-900/40 dark:from-cyan-900/40 dark:to-blue-900/40 light:from-cyan-50 light:to-cyan-100 backdrop-blur-sm rounded-xl border border-cyan-400/30 dark:border-cyan-400/30 light:border-cyan-300 hover:border-cyan-400/60 dark:hover:border-cyan-400/60 light:hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/20 transition-all group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-white dark:text-white light:text-gray-900 text-lg mb-1">Auto Trading</h4>
              <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-600">Automate your strategies</p>
            </div>
          </a>

          <a
            href="/dashboard/ai-agent"
            className="flex items-center space-x-4 p-6 bg-gradient-to-br from-purple-900/40 to-blue-900/40 dark:from-purple-900/40 dark:to-blue-900/40 light:from-purple-50 light:to-purple-100 backdrop-blur-sm rounded-xl border border-purple-400/30 dark:border-purple-400/30 light:border-purple-300 hover:border-purple-400/60 dark:hover:border-purple-400/60 light:hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/20 transition-all group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-white dark:text-white light:text-gray-900 text-lg mb-1">AI Agent</h4>
              <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-600">Let AI trade for you</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
