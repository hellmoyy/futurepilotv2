'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SettingsStatus {
  profile: {
    completed: boolean;
    avatar: boolean;
    name: boolean;
    phone: boolean;
  };
  security: {
    completed: boolean;
    twoFA: boolean;
    passwordChanged: boolean;
    emailVerified: boolean;
  };
  exchange: {
    completed: boolean;
    connected: number;
    verified: number;
  };
  notification: {
    completed: boolean;
    email: boolean;
    telegram: boolean;
    push: boolean;
  };
}

export default function CheckSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settingsStatus, setSettingsStatus] = useState<SettingsStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSettingsStatus();
    }
  }, [status]);

  const fetchSettingsStatus = async () => {
    try {
      const response = await fetch('/api/settings/status');
      const data = await response.json();
      setSettingsStatus(data);
    } catch (error) {
      console.error('Error fetching settings status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercentage = () => {
    if (!settingsStatus) return 0;
    
    const sections = [
      settingsStatus.profile.completed,
      settingsStatus.security.completed,
      settingsStatus.exchange.completed,
      settingsStatus.notification.completed
    ];
    
    const completedSections = sections.filter(Boolean).length;
    return Math.round((completedSections / sections.length) * 100);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 light:text-gray-600">Loading settings status...</p>
        </div>
      </div>
    );
  }

  if (!settingsStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-400 mb-2">Failed to load settings status</p>
          <button 
            onClick={fetchSettingsStatus}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white light:text-gray-900 mb-4">
          Settings Overview
        </h1>
        <p className="text-gray-400 light:text-gray-600 text-lg">
          Check your account configuration status
        </p>
      </div>

        {/* Overall Progress */}
        <div className="relative mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl"></div>
          <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/10 light:bg-white light:border-blue-200 p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-32 h-32 mx-auto mb-4 relative">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-gray-700 light:text-gray-300"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={`${completionPercentage * 3.39} 339`}
                    className="text-green-400 transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white light:text-gray-900">
                    {completionPercentage}%
                  </span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white light:text-gray-900 mb-2">
                Account Setup Progress
              </h2>
              <p className="text-gray-400 light:text-gray-600">
                {completionPercentage === 100 
                  ? "Your account is fully configured!" 
                  : `${4 - [settingsStatus.profile.completed, settingsStatus.security.completed, settingsStatus.exchange.completed, settingsStatus.notification.completed].filter(Boolean).length} sections remaining`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {/* Profile Section */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 blur-xl"></div>
            <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 light:bg-white light:border-blue-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    settingsStatus.profile.completed 
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : 'bg-orange-500/20 border border-orange-500/30'
                  }`}>
                    <svg className={`w-6 h-6 ${settingsStatus.profile.completed ? 'text-green-400' : 'text-orange-400'}`} 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white light:text-gray-900">Profile</h3>
                    <p className="text-xs text-gray-400 light:text-gray-600">Personal Information</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  settingsStatus.profile.completed
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}>
                  {settingsStatus.profile.completed ? 'Complete' : 'Incomplete'}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 light:text-gray-600">Avatar</span>
                  <span className={settingsStatus.profile.avatar ? 'text-green-400' : 'text-red-400'}>
                    {settingsStatus.profile.avatar ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 light:text-gray-600">Full Name</span>
                  <span className={settingsStatus.profile.name ? 'text-green-400' : 'text-red-400'}>
                    {settingsStatus.profile.name ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 light:text-gray-600">Phone</span>
                  <span className={settingsStatus.profile.phone ? 'text-green-400' : 'text-red-400'}>
                    {settingsStatus.profile.phone ? '✓' : '✗'}
                  </span>
                </div>
              </div>

              <Link href="/settings?tab=profile">
                <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl py-2 text-sm font-semibold transition-all hover:scale-105">
                  Configure Profile
                </button>
              </Link>
            </div>
          </div>

          {/* Security Section */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500/10 to-emerald-500/10 blur-xl"></div>
            <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 light:bg-white light:border-green-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    settingsStatus.security.completed 
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : 'bg-red-500/20 border border-red-500/30'
                  }`}>
                    <svg className={`w-6 h-6 ${settingsStatus.security.completed ? 'text-green-400' : 'text-red-400'}`} 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white light:text-gray-900">Security</h3>
                    <p className="text-xs text-gray-400 light:text-gray-600">Account Protection</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  settingsStatus.security.completed
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {settingsStatus.security.completed ? 'Secure' : 'At Risk'}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 light:text-gray-600">2FA Enabled</span>
                  <span className={settingsStatus.security.twoFA ? 'text-green-400' : 'text-red-400'}>
                    {settingsStatus.security.twoFA ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 light:text-gray-600">Strong Password</span>
                  <span className={settingsStatus.security.passwordChanged ? 'text-green-400' : 'text-red-400'}>
                    {settingsStatus.security.passwordChanged ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 light:text-gray-600">Email Verified</span>
                  <span className={settingsStatus.security.emailVerified ? 'text-green-400' : 'text-red-400'}>
                    {settingsStatus.security.emailVerified ? '✓' : '✗'}
                  </span>
                </div>
              </div>

              <Link href="/settings?tab=security">
                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl py-2 text-sm font-semibold transition-all hover:scale-105">
                  Secure Account
                </button>
              </Link>
            </div>
          </div>

          {/* Exchange Section */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 blur-xl"></div>
            <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 light:bg-white light:border-yellow-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    settingsStatus.exchange.completed 
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : 'bg-yellow-500/20 border border-yellow-500/30'
                  }`}>
                    <svg className={`w-6 h-6 ${settingsStatus.exchange.completed ? 'text-green-400' : 'text-yellow-400'}`} 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white light:text-gray-900">Exchange</h3>
                    <p className="text-xs text-gray-400 light:text-gray-600">Trading Connections</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  settingsStatus.exchange.completed
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}>
                  {settingsStatus.exchange.connected} Connected
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 light:text-gray-600">Connected</span>
                  <span className="text-white light:text-gray-900 font-semibold">
                    {settingsStatus.exchange.connected}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 light:text-gray-600">Verified</span>
                  <span className="text-white light:text-gray-900 font-semibold">
                    {settingsStatus.exchange.verified}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 light:text-gray-600">Status</span>
                  <span className={settingsStatus.exchange.completed ? 'text-green-400' : 'text-yellow-400'}>
                    {settingsStatus.exchange.completed ? 'Ready' : 'Setup Needed'}
                  </span>
                </div>
              </div>

              <Link href="/settings?tab=exchange">
                <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-xl py-2 text-sm font-semibold transition-all hover:scale-105">
                  Connect Exchange
                </button>
              </Link>
            </div>
          </div>

          {/* Notification Section */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-xl"></div>
            <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 light:bg-white light:border-cyan-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    settingsStatus.notification.completed 
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : 'bg-cyan-500/20 border border-cyan-500/30'
                  }`}>
                    <svg className={`w-6 h-6 ${settingsStatus.notification.completed ? 'text-green-400' : 'text-cyan-400'}`} 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M15 17h5l-5 5-5-5h5a7.5 7.5 0 01-7.5-7.5v-1M8 7V3a3 3 0 116 0v4M5 17.5h.01M19 17.5h.01" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white light:text-gray-900">Notifications</h3>
                    <p className="text-xs text-gray-400 light:text-gray-600">Stay Updated</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  settingsStatus.notification.completed
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}>
                  {settingsStatus.notification.completed ? 'Active' : 'Setup'}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 light:text-gray-600">Email</span>
                  <span className={settingsStatus.notification.email ? 'text-green-400' : 'text-red-400'}>
                    {settingsStatus.notification.email ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 light:text-gray-600">Telegram</span>
                  <span className={settingsStatus.notification.telegram ? 'text-green-400' : 'text-red-400'}>
                    {settingsStatus.notification.telegram ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 light:text-gray-600">Push</span>
                  <span className={settingsStatus.notification.push ? 'text-green-400' : 'text-red-400'}>
                    {settingsStatus.notification.push ? '✓' : '✗'}
                  </span>
                </div>
              </div>

              <Link href="/settings?tab=notifications">
                <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl py-2 text-sm font-semibold transition-all hover:scale-105">
                  Setup Notifications
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl"></div>
            <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 light:bg-white light:border-blue-200 p-6">
              <h3 className="text-xl font-semibold text-white light:text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/settings">
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-105">
                    Open Settings
                  </button>
                </Link>
                <button 
                  onClick={fetchSettingsStatus}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white light:bg-gray-100 light:text-gray-900 light:hover:bg-gray-200 rounded-xl font-semibold transition-all hover:scale-105 border border-white/20 light:border-gray-300"
                >
                  Refresh Status
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}