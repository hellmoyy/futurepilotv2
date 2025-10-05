'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading referral data...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Failed to load referral data</p>
      </div>
    );
  }

  const currentLevel = membershipLevels[stats.membershipLevel as keyof typeof membershipLevels];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Referral Program
          </h1>
          <p className="text-gray-400 mt-1">Earn commissions by inviting others</p>
        </div>
      </div>

      {/* Membership Level Card */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
        <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/10 p-8 hover:border-white/20 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 rounded-3xl"></div>
          
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-4xl">{currentLevel.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">{currentLevel.name} Member</h2>
                  <p className="text-gray-400">Your current membership level</p>
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

      {/* Referral Link Card */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-xl opacity-50"></div>
        <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/10 p-6 hover:border-white/20 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-3xl"></div>
          
          <div className="relative">
            <h3 className="text-lg font-semibold text-white mb-4">Your Referral Link</h3>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3">
                <p className="text-sm text-gray-300 font-mono truncate">
                  {window.location.origin}/register?ref={stats.referralCode}
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
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </span>
              </button>
            </div>
            <div className="mt-4 p-4 bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 rounded-xl">
              <p className="text-sm text-blue-300">
                <span className="font-semibold">Referral Code:</span> {stats.referralCode}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <div className="group relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Earnings</span>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-2xl font-bold text-white">${stats.totalEarnings.toFixed(2)}</p>
          </div>
        </div>

        {/* Level 1 Referrals */}
        <div className="group relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Level 1</span>
              <span className="text-2xl">👤</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalReferrals.level1}</p>
            <p className="text-xs text-gray-500 mt-1">Direct referrals</p>
          </div>
        </div>

        {/* Level 2 Referrals */}
        <div className="group relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Level 2</span>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalReferrals.level2}</p>
            <p className="text-xs text-gray-500 mt-1">2nd generation</p>
          </div>
        </div>

        {/* Level 3 Referrals */}
        <div className="group relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Level 3</span>
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalReferrals.level3}</p>
            <p className="text-xs text-gray-500 mt-1">3rd generation</p>
          </div>
        </div>
      </div>

      {/* Referral List */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 blur-xl"></div>
        <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/10 p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-3xl"></div>
          
          <div className="relative">
            <h3 className="text-xl font-semibold text-white mb-6">Your Referral Network</h3>
            
            {stats.referrals.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-400 mb-2">No referrals yet</p>
                <p className="text-gray-500 text-sm">Share your referral link to start earning commissions!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Level</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">User</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Earnings</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.referrals.map((referral, index) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            referral.level === 1 ? 'bg-blue-500/20 text-blue-300' :
                            referral.level === 2 ? 'bg-cyan-500/20 text-cyan-300' :
                            'bg-purple-500/20 text-purple-300'
                          }`}>
                            Level {referral.level}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-white font-medium">{referral.name}</td>
                        <td className="py-4 px-4 text-gray-400">{referral.email}</td>
                        <td className="py-4 px-4 text-green-400 font-semibold">${referral.earnings.toFixed(2)}</td>
                        <td className="py-4 px-4 text-gray-400">{new Date(referral.joinedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Commission Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(membershipLevels).map(([key, level]) => (
          <div key={key} className={`relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl border ${
            stats.membershipLevel === key ? 'border-white/30' : 'border-white/10'
          } p-6`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${level.color} opacity-5 rounded-2xl`}></div>
            <div className="relative text-center">
              <span className="text-3xl mb-2 block">{level.icon}</span>
              <h4 className="font-semibold text-white mb-1">{level.name}</h4>
              <p className={`text-2xl font-bold bg-gradient-to-r ${level.color} bg-clip-text text-transparent`}>
                {level.rate}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Commission</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
