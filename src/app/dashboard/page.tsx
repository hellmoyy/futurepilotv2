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
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Welcome back,{' '}
          <span className="bg-gradient-to-r from-blue-300 to-blue-600 bg-clip-text text-transparent">
            {session?.user?.name}!
          </span>
        </h1>
        <p className="text-gray-400">Here&apos;s an overview of your trading activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Total Balance</h3>
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">$0.00</div>
          <div className="text-sm text-green-500">+0% from last month</div>
        </div>

        <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Active Trades</h3>
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">0</div>
          <div className="text-sm text-gray-400">No active positions</div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Total P&L</h3>
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">$0.00</div>
          <div className="text-sm text-gray-400">0% win rate</div>
        </div>

        <div className="bg-gradient-to-br from-blue-800/30 to-cyan-900/30 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">AI Status</h3>
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1 flex items-center">
            <span className="w-3 h-3 bg-gray-500 rounded-full mr-2"></span>
            Inactive
          </div>
          <div className="text-sm text-gray-400">Configure API keys</div>
        </div>
      </div>

      {/* Database Status */}
      {dbStatus && (
        <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold mb-4">Database Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Connection</p>
              <div className="flex items-center space-x-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    dbStatus.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></span>
                <span className="text-white font-semibold capitalize">{dbStatus.status}</span>
              </div>
            </div>
            {dbStatus.database && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Database</p>
                <p className="text-white font-semibold">{dbStatus.database}</p>
              </div>
            )}
            {dbStatus.collections && dbStatus.collections.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Collections</p>
                <p className="text-white font-semibold">{dbStatus.collections.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-black/50 rounded-2xl border border-white/10 p-6">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/dashboard/settings"
            className="flex items-center space-x-4 p-4 bg-gradient-to-br from-blue-900/20 to-blue-700/20 rounded-xl border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-white">Configure CEX</h4>
              <p className="text-sm text-gray-400">Connect your exchange</p>
            </div>
          </a>

          <a
            href="/dashboard/futures"
            className="flex items-center space-x-4 p-4 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-xl border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-white">Start Trading</h4>
              <p className="text-sm text-gray-400">Open your first position</p>
            </div>
          </a>

          <a
            href="/dashboard/ai-agent"
            className="flex items-center space-x-4 p-4 bg-gradient-to-br from-blue-800/20 to-cyan-900/20 rounded-xl border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-white">AI Agent</h4>
              <p className="text-sm text-gray-400">Let AI trade for you</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
