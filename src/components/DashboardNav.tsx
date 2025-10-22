'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

interface DashboardNavProps {
  onMenuClick?: () => void;
}

export default function DashboardNav({ onMenuClick }: DashboardNavProps) {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="fixed top-0 right-0 left-0 lg:left-64 z-40 bg-black/50 dark:bg-black/50 light:bg-white/80 backdrop-blur-xl border-b border-white/10 dark:border-white/10 light:border-gray-200">
      <div className="px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-300 dark:text-gray-300 light:text-gray-700 hover:text-white dark:hover:text-white light:hover:text-gray-900 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Left side - Welcome message */}
          <div className="hidden sm:block">
            <h2 className="text-lg lg:text-xl font-semibold text-white dark:text-white light:text-gray-900">
              Welcome back, <span className="text-blue-400 dark:text-blue-400 light:text-blue-600">{session?.user?.name}</span>
            </h2>
            <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Right side - Theme toggle and user menu */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 px-4 py-2 bg-white/5 dark:bg-white/5 light:bg-gray-100 rounded-xl border border-white/10 dark:border-white/10 light:border-gray-300 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-gray-200 transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {session?.user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium text-white dark:text-white light:text-gray-900">{session?.user?.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">{session?.user?.email}</p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 dark:text-gray-400 light:text-gray-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
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
                  <div className="absolute right-0 mt-2 w-56 bg-gray-900 dark:bg-gray-900 light:bg-white border border-white/10 dark:border-white/10 light:border-gray-200 rounded-xl shadow-xl overflow-hidden z-20">
                    <div className="px-4 py-3 border-b border-white/10 dark:border-white/10 light:border-gray-200">
                      <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">Signed in as</p>
                      <p className="text-sm font-semibold text-white dark:text-white light:text-gray-900 truncate">{session?.user?.email}</p>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          window.location.href = '/settings';
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </button>
                    </div>
                    <div className="border-t border-white/10 dark:border-white/10 light:border-gray-200">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-400 dark:text-red-400 light:text-red-600 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-red-50 transition-colors"
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
          </div>
        </div>
      </div>
    </nav>
  );
}
