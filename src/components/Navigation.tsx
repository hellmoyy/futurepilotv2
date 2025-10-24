'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

export default function Navigation() {
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/50 dark:bg-black/50 light:bg-white/80 backdrop-blur-xl border-b border-white/10 dark:border-white/10 light:border-blue-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img 
              src={theme === 'light' ? '/images/logos/logo-light.png' : '/images/logos/logo-dark.png'}
              alt="FuturePilot" 
              className="h-10 w-auto"
            />
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {status === 'loading' ? (
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : session ? (
              <>
                {/* Theme Toggle */}
                <ThemeToggle />
                
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/5 dark:bg-white/5 light:bg-gray-100 rounded-lg border border-white/10 dark:border-white/10 light:border-gray-300 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-gray-200 transition-all"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {session.user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white dark:text-white light:text-gray-900 font-medium">{session.user?.name}</span>
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
                      <div className="absolute right-0 mt-2 w-56 bg-gray-900 dark:bg-gray-900 light:bg-white border border-white/10 dark:border-white/10 light:border-blue-200 rounded-xl shadow-xl overflow-hidden z-20">
                        <div className="px-4 py-3 border-b border-white/10 dark:border-white/10 light:border-blue-200">
                          <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">Signed in as</p>
                          <p className="text-sm font-semibold text-white dark:text-white light:text-gray-900 truncate">{session.user?.email}</p>
                        </div>
                        <div className="py-2">
                          <Link
                            href="/dashboard"
                            className="flex items-center px-4 py-2 text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-blue-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Dashboard
                          </Link>
                          <Link
                            href="/settings"
                            className="flex items-center px-4 py-2 text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-blue-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                          </Link>
                          <Link
                            href="/security"
                            className="flex items-center px-4 py-2 text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-blue-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Security (2FA)
                          </Link>
                        </div>
                        <div className="border-t border-white/10 dark:border-white/10 light:border-blue-200">
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
              </>
            ) : (
              <>
                {/* Theme Toggle */}
                <ThemeToggle />
                
                <Link
                  href="/login"
                  className="text-gray-300 dark:text-gray-300 light:text-gray-700 hover:text-white dark:hover:text-white light:hover:text-gray-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-500 dark:to-blue-700 light:from-blue-600 light:to-blue-800 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-gray-300 dark:text-gray-300 light:text-gray-700 hover:text-white dark:hover:text-white light:hover:text-gray-900 transition-colors"
            aria-label="Toggle menu"
          >
            {showMobileMenu ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 pb-4 space-y-3 border-t border-white/10 dark:border-white/10 light:border-blue-200 pt-4">
            {status === 'loading' ? (
              <div className="flex justify-center py-4">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : session ? (
              <div className="space-y-3 border-t border-white/10 dark:border-white/10 light:border-blue-200 pt-3 mt-3">
                {/* Theme Toggle */}
                <div className="flex justify-center py-2">
                  <ThemeToggle />
                </div>
                
                <Link 
                  href="/dashboard" 
                  className="flex items-center text-gray-300 dark:text-gray-300 light:text-gray-700 hover:text-white dark:hover:text-white light:hover:text-gray-900 transition-colors py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </Link>
                
                <Link 
                  href="/settings" 
                  className="flex items-center text-gray-300 dark:text-gray-300 light:text-gray-700 hover:text-white dark:hover:text-white light:hover:text-gray-900 transition-colors py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
                
                <div className="border-t border-white/10 dark:border-white/10 light:border-blue-200 pt-3">
                  <div className="px-2 py-2 bg-white/5 dark:bg-white/5 light:bg-gray-100 rounded-lg border border-white/10 dark:border-white/10 light:border-gray-300 mb-3">
                    <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">Signed in as</p>
                    <p className="text-sm font-semibold text-white dark:text-white light:text-gray-900 truncate">{session.user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      handleSignOut();
                    }}
                    className="flex items-center w-full text-red-400 dark:text-red-400 light:text-red-600 hover:text-red-300 dark:hover:text-red-300 light:hover:text-red-700 transition-colors py-2"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 border-t border-white/10 dark:border-white/10 light:border-blue-200 pt-3 mt-3">
                {/* Theme Toggle */}
                <div className="flex justify-center py-2">
                  <ThemeToggle />
                </div>
                
                <Link
                  href="/login"
                  className="block text-center py-2 text-gray-300 dark:text-gray-300 light:text-gray-700 hover:text-white dark:hover:text-white light:hover:text-gray-900 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block text-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-500 dark:to-blue-700 light:from-blue-600 light:to-blue-800 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
