'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Import tab components
import ProfileTab from '../../components/settings/ProfileTab';
import SecurityTab from '../../components/settings/SecurityTab';
import ExchangeTab from '../../components/settings/ExchangeTab';
import NotificationsTab from '../../components/settings/NotificationsTab';

type TabType = 'profile' | 'security' | 'exchange' | 'notifications';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['profile', 'security', 'exchange', 'notifications'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/settings?tab=${tab}`);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 light:text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'profile' as TabType,
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      description: 'Personal information and avatar'
    },
    {
      id: 'security' as TabType,
      label: 'Security',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      description: '2FA, password, and account security'
    },
    {
      id: 'exchange' as TabType,
      label: 'Exchange',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      description: 'Connect trading exchanges'
    },
    {
      id: 'notifications' as TabType,
      label: 'Notifications',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      description: 'Email, Telegram, and push alerts'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-white light:text-gray-900 mb-2">
          Settings
        </h1>
        <p className="text-gray-400 light:text-gray-600">
          Manage your account preferences and configurations
        </p>
      </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          {/* Sidebar Navigation */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl"></div>
            <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 light:bg-white light:border-blue-200 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 light:text-gray-600 light:hover:text-gray-900 light:hover:bg-blue-50'
                    }`}
                  >
                    <div className={`flex-shrink-0 ${activeTab === tab.id ? 'text-white' : ''}`}>
                      {tab.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{tab.label}</div>
                      <div className={`text-xs mt-1 ${
                        activeTab === tab.id ? 'text-blue-100' : 'text-gray-500 light:text-gray-500'
                      }`}>
                        {tab.description}
                      </div>
                    </div>
                  </button>
                ))}
              </nav>

              {/* Quick Links */}
              <div className="mt-6 pt-6 border-t border-white/10 light:border-gray-200">
                <h3 className="text-sm font-semibold text-gray-400 light:text-gray-600 mb-3 px-4">
                  Quick Links
                </h3>
                <div className="space-y-2">
                  <a
                    href="/check-settings"
                    className="flex items-center gap-3 p-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all light:text-gray-600 light:hover:text-gray-900 light:hover:bg-blue-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Check Settings Status
                  </a>
                  <a
                    href="/cex-settings"
                    className="flex items-center gap-3 p-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all light:text-gray-600 light:hover:text-gray-900 light:hover:bg-blue-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    CEX Settings
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="relative min-h-[600px]">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl"></div>
            <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 light:bg-white light:border-blue-200 p-6 sm:p-8">
              {activeTab === 'profile' && <ProfileTab />}
              {activeTab === 'security' && <SecurityTab />}
              {activeTab === 'exchange' && <ExchangeTab />}
              {activeTab === 'notifications' && <NotificationsTab />}
            </div>
          </div>
        </div>
      </div>
  );
}
