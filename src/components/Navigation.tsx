'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export default function Navigation() {
  const { data: session, status } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-blue-600 bg-clip-text text-transparent">
              FuturePilot
            </span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="/ai-demo" className="text-gray-300 hover:text-white transition-colors">
              AI Demo
            </a>
            
            {status === 'loading' ? (
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : session ? (
              <>
                <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
                
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {session.user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white font-medium">{session.user?.name}</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserMenu(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                        <div className="px-4 py-3 border-b border-white/10">
                          <p className="text-sm text-gray-400">Signed in as</p>
                          <p className="text-sm font-semibold text-white truncate">{session.user?.email}</p>
                        </div>
                        <div className="py-2">
                          <Link
                            href="/dashboard"
                            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Dashboard
                          </Link>
                          <Link
                            href="/dashboard/settings"
                            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                          </Link>
                        </div>
                        <div className="border-t border-white/10">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
