'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ReferralStats {
  referralCode: string;
  membershipLevel: string;
  commissionRate: number;
  totalEarnings: number;
  totalReferrals: {
    level1: number;
    level2: number;
    level3: number;
  };
  referrals: {
    level: number;
    name: string;
    email: string;
    earnings: number;
    joinedAt: string;
  }[];
}

const membershipLevels = {
  bronze: { name: 'Bronze', rate: 10, color: 'from-amber-600 to-amber-800', icon: '🥉' },
  silver: { name: 'Silver', rate: 20, color: 'from-gray-400 to-gray-600', icon: '🥈' },
  gold: { name: 'Gold', rate: 30, color: 'from-yellow-400 to-yellow-600', icon: '🥇' },
  platinum: { name: 'Platinum', rate: 50, color: 'from-cyan-400 to-blue-600', icon: '💎' },
};

export default function ReferralPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState('network');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchReferralStats();
    }
  }, [status]);

  const fetchReferralStats = async () => {
    try {
      const response = await fetch('/api/referral/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (stats) {
      const referralLink = `${window.location.origin}/register?ref=${stats.referralCode}`;
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareViaWhatsApp = () => {
    if (stats) {
      const referralLink = `${window.location.origin}/register?ref=${stats.referralCode}`;
      const message = `🚀 Join FuturePilot - Advanced AI Trading Platform!\n\n🤖 AI-powered trading automation\n💰 Smart portfolio management\n📈 Real-time market analysis\n\nUse my referral link to get started:\n${referralLink}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const shareViaTelegram = () => {
    if (stats) {
      const referralLink = `${window.location.origin}/register?ref=${stats.referralCode}`;
      const message = `🚀 Join FuturePilot - Advanced AI Trading Platform!\n\n🤖 AI-powered trading automation\n💰 Smart portfolio management\n📈 Real-time market analysis\n\nUse my referral link: ${referralLink}`;
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`;
      window.open(telegramUrl, '_blank');
    }
  };

  const shareViaTwitter = () => {
    if (stats) {
      const referralLink = `${window.location.origin}/register?ref=${stats.referralCode}`;
      const message = `🚀 Join me on FuturePilot - Advanced AI Trading Platform! 🤖💰📈`;
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralLink)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 light:text-gray-600">Loading referral data...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 light:text-gray-600">Failed to load referral data</p>
      </div>
    );
  }

  const currentLevel = membershipLevels[stats.membershipLevel as keyof typeof membershipLevels];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent light:from-blue-600 light:via-blue-700 light:to-cyan-600">
            Referral Program
          </h1>
          <p className="text-gray-400 mt-1 light:text-gray-600">Earn commissions by inviting others</p>
        </div>
      </div>

      {/* Stats Grid - Moved to Top */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <div className="group relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all hover:scale-105 light:bg-gradient-to-br light:from-white light:to-blue-50 light:border-blue-200 light:hover:border-blue-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity light:from-green-100/50"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm light:text-gray-600">Total Earnings</span>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-2xl font-bold text-white light:text-gray-900">${stats.totalEarnings.toFixed(2)}</p>
          </div>
        </div>

        {/* Level 1 Referrals */}
        <div className="group relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all hover:scale-105 light:bg-gradient-to-br light:from-white light:to-blue-50 light:border-blue-200 light:hover:border-blue-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity light:from-blue-100/50"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm light:text-gray-600">Level 1</span>
              <span className="text-2xl">👤</span>
            </div>
            <p className="text-2xl font-bold text-white light:text-gray-900">{stats.totalReferrals.level1}</p>
            <p className="text-xs text-gray-500 mt-1 light:text-gray-600">Direct referrals</p>
          </div>
        </div>

        {/* Level 2 Referrals */}
        <div className="group relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all hover:scale-105 light:bg-gradient-to-br light:from-white light:to-blue-50 light:border-blue-200 light:hover:border-blue-300">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity light:from-cyan-100/50"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm light:text-gray-600">Level 2</span>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-2xl font-bold text-white light:text-gray-900">{stats.totalReferrals.level2}</p>
            <p className="text-xs text-gray-500 mt-1 light:text-gray-600">2nd generation</p>
          </div>
        </div>

        {/* Level 3 Referrals */}
        <div className="group relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all hover:scale-105 light:bg-gradient-to-br light:from-white light:to-blue-50 light:border-blue-200 light:hover:border-blue-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity light:from-purple-100/50"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm light:text-gray-600">Level 3</span>
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
            </div>
            <p className="text-2xl font-bold text-white light:text-gray-900">{stats.totalReferrals.level3}</p>
            <p className="text-xs text-gray-500 mt-1 light:text-gray-600">3rd generation</p>
          </div>
        </div>
      </div>

      {/* Membership Level Card */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-xl opacity-50 group-hover:opacity-75 transition-opacity light:from-blue-200/40 light:via-cyan-200/40 light:to-blue-200/40"></div>
        <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/10 p-8 hover:border-white/20 transition-all light:bg-gradient-to-br light:from-white light:to-blue-50 light:border-blue-200 light:hover:border-blue-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 rounded-3xl light:from-blue-100/50 light:to-cyan-100/50"></div>
          
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-4xl">{currentLevel.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold text-white light:text-gray-900">{currentLevel.name} Member</h2>
                  <p className="text-gray-400 light:text-gray-600">Your current membership level</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-block px-6 py-3 bg-gradient-to-r ${currentLevel.color} rounded-2xl`}>
                <p className="text-sm text-white/80">Commission Rate</p>
                <p className="text-3xl font-bold text-white">{currentLevel.rate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link & Sharing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Referral Link Card */}
        <div className="lg:col-span-2 relative group h-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-xl opacity-50 light:from-blue-200/40 light:to-cyan-200/40"></div>
          <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/10 p-6 hover:border-white/20 transition-all h-full light:bg-gradient-to-br light:from-white light:to-blue-50 light:border-blue-200 light:hover:border-blue-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-3xl light:from-blue-100/50 light:to-cyan-100/50"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white light:text-gray-900 flex items-center space-x-2">
                  <span>🔗</span>
                  <span>Your Referral Link</span>
                </h3>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="group/qr px-3 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/20 transition-all light:bg-blue-100 light:border-blue-300 light:hover:bg-blue-200"
                >
                  <svg className="w-5 h-5 text-gray-300 group-hover/qr:text-white transition-colors light:text-gray-600 light:group-hover/qr:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 light:bg-blue-50 light:border-blue-200">
                    <p className="text-sm text-gray-300 font-mono truncate light:text-gray-700">
                      {typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${stats.referralCode}` : `https://futurepilot.pro/register?ref=${stats.referralCode}`}
                    </p>
                  </div>
                  <button
                    onClick={copyReferralLink}
                    className="group/btn relative px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl font-semibold overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10 flex items-center space-x-2">
                      {copied ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="hidden sm:inline">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="hidden sm:inline">Copy</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>

                {/* QR Code Section */}
                {showQR && (
                  <div className="animate-fadeIn bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center light:bg-blue-50 light:border-blue-200">
                    <div className="w-32 h-32 bg-white rounded-lg mx-auto mb-3 flex items-center justify-center">
                      <div className="text-xs text-gray-500">QR Code</div>
                    </div>
                    <p className="text-xs text-gray-400 light:text-gray-600">Scan to share referral link</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={shareViaWhatsApp}
                    className="group flex items-center space-x-2 px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-all light:bg-green-100 light:border-green-300 light:hover:bg-green-200"
                  >
                    <svg className="w-5 h-5 text-green-400 light:text-green-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
                    </svg>
                    <span className="text-sm font-medium text-green-400 light:text-green-600">WhatsApp</span>
                  </button>

                  <button
                    onClick={shareViaTelegram}
                    className="group flex items-center space-x-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-all light:bg-blue-100 light:border-blue-300 light:hover:bg-blue-200"
                  >
                    <svg className="w-5 h-5 text-blue-400 light:text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    <span className="text-sm font-medium text-blue-400 light:text-blue-600">Telegram</span>
                  </button>

                  <button
                    onClick={shareViaTwitter}
                    className="group flex items-center space-x-2 px-4 py-2 bg-sky-600/20 border border-sky-500/30 rounded-lg hover:bg-sky-600/30 transition-all light:bg-sky-100 light:border-sky-300 light:hover:bg-sky-200"
                  >
                    <svg className="w-5 h-5 text-sky-400 light:text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span className="text-sm font-medium text-sky-400 light:text-sky-600">Twitter</span>
                  </button>
                </div>

                <div className="p-4 bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 rounded-xl light:bg-blue-100 light:border-blue-300">
                  <p className="text-sm text-blue-300 light:text-blue-700 flex items-center space-x-2">
                    <span>🎯</span>
                    <span><span className="font-semibold">Referral Code:</span> {stats.referralCode}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tips & Guide Card */}
        <div className="relative h-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl opacity-50 light:from-purple-200/40 light:to-pink-200/40"></div>
          <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/10 p-6 h-full light:bg-gradient-to-br light:from-white light:to-purple-50 light:border-purple-200">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl light:from-purple-100/50 light:to-pink-100/50"></div>
            
            <div className="relative h-full flex flex-col">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-3 light:from-purple-200 light:to-pink-200">
                  <span className="text-2xl">💡</span>
                </div>
                <h3 className="text-lg font-semibold text-white light:text-gray-900">Referral Tips</h3>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-start space-x-3">
                  <span className="text-lg mt-0.5">📱</span>
                  <div>
                    <p className="text-sm font-medium text-white light:text-gray-900">Share on Social Media</p>
                    <p className="text-xs text-gray-400 light:text-gray-600">Use WhatsApp, Telegram, or Twitter to reach more people</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <span className="text-lg mt-0.5">🎯</span>
                  <div>
                    <p className="text-sm font-medium text-white light:text-gray-900">Target Traders</p>
                    <p className="text-xs text-gray-400 light:text-gray-600">Focus on crypto & forex trading communities</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <span className="text-lg mt-0.5">💰</span>
                  <div>
                    <p className="text-sm font-medium text-white light:text-gray-900">Earn More</p>
                    <p className="text-xs text-gray-400 light:text-gray-600">Multi-level commissions up to 3 generations</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <span className="text-lg mt-0.5">🚀</span>
                  <div>
                    <p className="text-sm font-medium text-white light:text-gray-900">Level Up</p>
                    <p className="text-xs text-gray-400 light:text-gray-600">More referrals = higher commission rates</p>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <div className="p-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-500/30 rounded-xl light:from-purple-100 light:to-pink-100 light:border-purple-300">
                  <p className="text-xs text-purple-300 text-center light:text-purple-700">
                    💎 <span className="font-semibold">Pro Tip:</span> Share your success stories to build trust!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Section */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 blur-xl light:from-blue-200/30 light:to-cyan-200/30"></div>
        <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/10 light:bg-gradient-to-br light:from-white light:to-blue-50 light:border-blue-200">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-3xl light:from-blue-100/50 light:to-cyan-100/50"></div>
          
          <div className="relative">
            {/* Tab Navigation */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 light:border-blue-200">
              <h3 className="text-xl font-semibold text-white light:text-gray-900">Referral Dashboard</h3>
              <div className="flex bg-white/5 backdrop-blur-xl rounded-xl p-1 light:bg-blue-100">
                {[
                  { id: 'network', label: 'Network', icon: '👥' },
                  { id: 'history', label: 'History', icon: '📊' },
                  { id: 'transaction', label: 'Transaction', icon: '💳' },
                  { id: 'withdraw', label: 'Withdraw', icon: '💰' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/10 light:text-gray-600 light:hover:text-gray-800 light:hover:bg-blue-200'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Network Tab */}
              {activeTab === 'network' && (
                <div className="animate-fadeIn">
                  {stats.referrals.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-4 light:bg-blue-100">
                        <svg className="w-10 h-10 text-gray-500 light:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-400 mb-2 light:text-gray-600">No referrals yet</p>
                      <p className="text-gray-500 text-sm light:text-gray-600">Share your referral link to start earning commissions!</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10 light:border-blue-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Level</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">User</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Email</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Earnings</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.referrals.map((referral, index) => (
                            <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors light:border-blue-100 light:hover:bg-blue-50">
                              <td className="py-4 px-4">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                  referral.level === 1 ? 'bg-blue-500/20 text-blue-300 light:bg-blue-100 light:text-blue-700' :
                                  referral.level === 2 ? 'bg-cyan-500/20 text-cyan-300 light:bg-cyan-100 light:text-cyan-700' :
                                  'bg-purple-500/20 text-purple-300 light:bg-purple-100 light:text-purple-700'
                                }`}>
                                  Level {referral.level}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-white font-medium light:text-gray-900">{referral.name}</td>
                              <td className="py-4 px-4 text-gray-400 light:text-gray-700">{referral.email}</td>
                              <td className="py-4 px-4 text-green-400 font-semibold light:text-green-600">${referral.earnings.toFixed(2)}</td>
                              <td className="py-4 px-4 text-gray-400 light:text-gray-700">{new Date(referral.joinedAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="animate-fadeIn">
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-4 light:from-green-200 light:to-blue-200">
                      <span className="text-3xl">📊</span>
                    </div>
                    <p className="text-gray-400 mb-2 light:text-gray-600">Referral History</p>
                    <p className="text-gray-500 text-sm light:text-gray-600">Track your referral performance over time</p>
                    
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 light:bg-blue-50">
                        <p className="text-sm text-gray-400 light:text-gray-600">This Week</p>
                        <p className="text-2xl font-bold text-white light:text-gray-900">0</p>
                        <p className="text-xs text-gray-500 light:text-gray-600">New referrals</p>
                      </div>
                      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 light:bg-blue-50">
                        <p className="text-sm text-gray-400 light:text-gray-600">This Month</p>
                        <p className="text-2xl font-bold text-white light:text-gray-900">0</p>
                        <p className="text-xs text-gray-500 light:text-gray-600">New referrals</p>
                      </div>
                      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 light:bg-blue-50">
                        <p className="text-sm text-gray-400 light:text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-white light:text-gray-900">{stats.totalReferrals.level1 + stats.totalReferrals.level2 + stats.totalReferrals.level3}</p>
                        <p className="text-xs text-gray-500 light:text-gray-600">All time</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Tab */}
              {activeTab === 'transaction' && (
                <div className="animate-fadeIn">
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-4 light:from-purple-200 light:to-pink-200">
                      <span className="text-3xl">💳</span>
                    </div>
                    <p className="text-gray-400 mb-2 light:text-gray-600">Transaction History</p>
                    <p className="text-gray-500 text-sm light:text-gray-600">View all commission transactions and payments</p>
                    
                    <div className="mt-8">
                      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 light:bg-blue-50">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium text-gray-400 light:text-gray-600">Recent Transactions</span>
                          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded light:bg-blue-100 light:text-blue-700">All Time</span>
                        </div>
                        <div className="text-center py-8">
                          <p className="text-gray-500 text-sm light:text-gray-600">No transactions yet</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Withdraw Tab */}
              {activeTab === 'withdraw' && (
                <div className="animate-fadeIn">
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-4 light:from-yellow-200 light:to-orange-200">
                      <span className="text-3xl">💰</span>
                    </div>
                    <p className="text-gray-400 mb-2 light:text-gray-600">Withdraw Earnings</p>
                    <p className="text-gray-500 text-sm light:text-gray-600">Request withdrawal of your commission earnings</p>
                    
                    <div className="mt-8 max-w-md mx-auto">
                      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 light:bg-blue-50">
                        <div className="mb-6">
                          <p className="text-sm text-gray-400 mb-2 light:text-gray-600">Available Balance</p>
                          <p className="text-3xl font-bold text-green-400 light:text-green-600">${stats.totalEarnings.toFixed(2)}</p>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2 light:text-gray-600">Minimum withdrawal: $50.00</p>
                          <div className="w-full bg-white/10 rounded-full h-2 light:bg-blue-200">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((stats.totalEarnings / 50) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <button
                          disabled={stats.totalEarnings < 50}
                          className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                            stats.totalEarnings >= 50
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg hover:shadow-green-500/30'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed light:bg-gray-300 light:text-gray-500'
                          }`}
                        >
                          {stats.totalEarnings >= 50 ? 'Request Withdrawal' : 'Insufficient Balance'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
