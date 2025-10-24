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
  const [activeTab, setActiveTab] = useState<'network' | 'history' | 'transaction' | 'withdraw'>('network');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalStats, setWithdrawalStats] = useState<any>(null);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawWallet, setWithdrawWallet] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState<'ERC20' | 'BEP20'>('ERC20');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionStats, setTransactionStats] = useState<any>(null);
  const [transactionLoading, setTransactionLoading] = useState(false);

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

  useEffect(() => {
    if (activeTab === 'withdraw' && status === 'authenticated') {
      fetchWithdrawals();
    }
    if (activeTab === 'transaction' && status === 'authenticated') {
      fetchTransactions();
    }
  }, [activeTab, status]);

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

  const fetchWithdrawals = async () => {
    try {
      setWithdrawalLoading(true);
      const response = await fetch('/api/withdrawals');
      const data = await response.json();
      
      if (response.ok) {
        setWithdrawals(data.withdrawals || []);
        setWithdrawalStats(data.statistics || null);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setTransactionLoading(true);
      const response = await fetch('/api/referral/commissions');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setTransactions(data.transactions || []);
        setTransactionStats(data.statistics || null);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleWithdrawRequest = async () => {
    setWithdrawError('');
    setWithdrawSuccess('');

    // Validation
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 10) {
      setWithdrawError('Minimum withdrawal amount is $10');
      return;
    }

    if (!stats || amount > stats.totalEarnings) {
      setWithdrawError('Insufficient balance');
      return;
    }

    if (!withdrawWallet || !/^0x[a-fA-F0-9]{40}$/.test(withdrawWallet)) {
      setWithdrawError('Please enter a valid wallet address');
      return;
    }

    setWithdrawLoading(true);

    try {
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          walletAddress: withdrawWallet,
          network: withdrawNetwork,
          type: 'referral',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setWithdrawSuccess('Withdrawal request submitted successfully! We will process it within 24-48 hours.');
        setWithdrawAmount('');
        setWithdrawWallet('');
        // Refresh stats to show updated balance
        fetchReferralStats();
        fetchWithdrawals();
        
        // Close modal after 3 seconds
        setTimeout(() => {
          setShowWithdrawModal(false);
          setWithdrawSuccess('');
        }, 3000);
      } else {
        setWithdrawError(data.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      setWithdrawError('An error occurred. Please try again.');
    } finally {
      setWithdrawLoading(false);
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
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent light:from-blue-600 light:via-blue-700 light:to-cyan-600">
            Referral Program
          </h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1 light:text-gray-600">Earn commissions by inviting others</p>
        </div>
      </div>

      {/* Stats Grid - Moved to Top */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Earnings */}
        <div className="group relative bg-white/[0.03] backdrop-blur-3xl rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-5 lg:p-6 hover:border-white/20 transition-all hover:scale-105 light:bg-gradient-to-br light:from-white light:to-blue-50 light:border-blue-200 light:hover:border-blue-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity light:from-green-100/50"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs sm:text-sm light:text-gray-600">Total Earnings</span>
              <span className="text-xl sm:text-2xl">💰</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white light:text-gray-900">${stats.totalEarnings.toFixed(2)}</p>
          </div>
        </div>

        {/* Level 1 Referrals */}
        <div className="group relative bg-white/[0.03] backdrop-blur-3xl rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-5 lg:p-6 hover:border-white/20 transition-all hover:scale-105 light:bg-gradient-to-br light:from-white light:to-blue-50 light:border-blue-200 light:hover:border-blue-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity light:from-blue-100/50"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs sm:text-sm light:text-gray-600">Level 1</span>
              <span className="text-xl sm:text-2xl">👤</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white light:text-gray-900">{stats.totalReferrals.level1}</p>
            <p className="text-xs text-gray-500 mt-1 light:text-gray-600">Direct referrals</p>
          </div>
        </div>

        {/* Level 2 Referrals */}
        <div className="group relative bg-white/[0.03] backdrop-blur-3xl rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-5 lg:p-6 hover:border-white/20 transition-all hover:scale-105 light:bg-gradient-to-br light:from-white light:to-blue-50 light:border-blue-200 light:hover:border-blue-300">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity light:from-cyan-100/50"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs sm:text-sm light:text-gray-600">Level 2</span>
              <span className="text-xl sm:text-2xl">👥</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white light:text-gray-900">{stats.totalReferrals.level2}</p>
            <p className="text-xs text-gray-500 mt-1 light:text-gray-600">2nd generation</p>
          </div>
        </div>

        {/* Level 3 Referrals */}
        <div className="group relative bg-white/[0.03] backdrop-blur-3xl rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-5 lg:p-6 hover:border-white/20 transition-all hover:scale-105 light:bg-gradient-to-br light:from-white light:to-blue-50 light:border-blue-200 light:hover:border-blue-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity light:from-purple-100/50"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs sm:text-sm light:text-gray-600">Level 3</span>
              <span className="text-xl sm:text-2xl">👨‍👩‍👧‍👦</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white light:text-gray-900">{stats.totalReferrals.level3}</p>
            <p className="text-xs text-gray-500 mt-1 light:text-gray-600">3rd generation</p>
          </div>
        </div>
      </div>

      {/* Membership Level Card */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-xl opacity-50 group-hover:opacity-75 transition-opacity light:from-blue-200/40 light:via-cyan-200/40 light:to-blue-200/40"></div>
        <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl sm:rounded-3xl border border-white/10 p-5 sm:p-6 lg:p-8 hover:border-white/20 transition-all light:bg-gradient-to-br light:from-white light:to-blue-50 light:border-blue-200 light:hover:border-blue-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 rounded-2xl sm:rounded-3xl light:from-blue-100/50 light:to-cyan-100/50"></div>
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-3xl sm:text-4xl">{currentLevel.icon}</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white light:text-gray-900">{currentLevel.name} Member</h2>
                  <p className="text-xs sm:text-sm text-gray-400 light:text-gray-600">Your current membership level</p>
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className={`inline-block px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r ${currentLevel.color} rounded-xl sm:rounded-2xl`}>
                <p className="text-xs sm:text-sm text-white/80">Commission Rate</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{currentLevel.rate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link & Sharing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Referral Link Card */}
        <div className="lg:col-span-2 relative group h-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-xl opacity-50 light:from-blue-200/40 light:to-cyan-200/40"></div>
          <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl sm:rounded-3xl border border-white/10 p-4 sm:p-5 lg:p-6 hover:border-white/20 transition-all h-full light:bg-gradient-to-br light:from-white light:to-blue-50 light:border-blue-200 light:hover:border-blue-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl sm:rounded-3xl light:from-blue-100/50 light:to-cyan-100/50"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-white light:text-gray-900 flex items-center space-x-2">
                  <span>🔗</span>
                  <span>Your Referral Link</span>
                </h3>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="group/qr px-2 sm:px-3 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/20 transition-all light:bg-blue-100 light:border-blue-300 light:hover:bg-blue-200"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover/qr:text-white transition-colors light:text-gray-600 light:group-hover/qr:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 light:bg-blue-50 light:border-blue-200 overflow-hidden">
                    <p className="text-xs sm:text-sm text-gray-300 font-mono truncate light:text-gray-700">
                      {typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${stats.referralCode}` : `https://futurepilot.pro/register?ref=${stats.referralCode}`}
                    </p>
                  </div>
                  <button
                    onClick={copyReferralLink}
                    className="group/btn relative px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-sm sm:text-base font-semibold overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 w-full sm:w-auto"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10 flex items-center justify-center space-x-2">
                      {copied ? (
                        <>
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>

                {/* QR Code Section */}
                {showQR && (
                  <div className="animate-fadeIn bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center light:bg-blue-50 light:border-blue-200">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-lg mx-auto mb-3 flex items-center justify-center">
                      <div className="text-xs text-gray-500">QR Code</div>
                    </div>
                    <p className="text-xs text-gray-400 light:text-gray-600">Scan to share referral link</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={shareViaWhatsApp}
                    className="group flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-all flex-1 sm:flex-initial min-w-[100px] justify-center light:bg-green-100 light:border-green-300 light:hover:bg-green-200"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 light:text-green-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-green-400 light:text-green-600">WhatsApp</span>
                  </button>

                  <button
                    onClick={shareViaTelegram}
                    className="group flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-all flex-1 sm:flex-initial min-w-[100px] justify-center light:bg-blue-100 light:border-blue-300 light:hover:bg-blue-200"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 light:text-blue-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-blue-400 light:text-blue-600">Telegram</span>
                  </button>

                  <button
                    onClick={shareViaTwitter}
                    className="group flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 bg-sky-600/20 border border-sky-500/30 rounded-lg hover:bg-sky-600/30 transition-all flex-1 sm:flex-initial min-w-[100px] justify-center light:bg-sky-100 light:border-sky-300 light:hover:bg-sky-200"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 light:text-sky-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-sky-400 light:text-sky-600">Twitter</span>
                  </button>
                </div>

                <div className="p-3 sm:p-4 bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 rounded-xl light:bg-blue-100 light:border-blue-300">
                  <p className="text-xs sm:text-sm text-blue-300 light:text-blue-700 flex items-center space-x-2">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 lg:p-6 border-b border-white/10 light:border-blue-200">
              <h3 className="text-lg sm:text-xl font-semibold text-white light:text-gray-900">Referral Dashboard</h3>
              <div className="flex bg-white/5 backdrop-blur-xl rounded-xl p-1 overflow-x-auto light:bg-blue-100">
                {[
                  { id: 'network', label: 'Network', icon: '👥' },
                  { id: 'history', label: 'History', icon: '📊' },
                  { id: 'transaction', label: 'Transaction', icon: '💳' },
                  { id: 'withdraw', label: 'Withdraw', icon: '💰' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'network' | 'history' | 'transaction' | 'withdraw')}
                    className={`relative px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 sm:space-x-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/10 light:text-gray-600 light:hover:text-gray-800 light:hover:bg-blue-200'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-5 lg:p-6">
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
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/10 light:border-blue-200">
                              <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400 light:text-gray-700">Level</th>
                              <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400 light:text-gray-700">User</th>
                              <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400 light:text-gray-700 hidden md:table-cell">Email</th>
                              <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400 light:text-gray-700">Earnings</th>
                              <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400 light:text-gray-700 hidden sm:table-cell">Joined</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.referrals.map((referral, index) => (
                              <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors light:border-blue-100 light:hover:bg-blue-50">
                                <td className="py-3 sm:py-4 px-3 sm:px-4">
                                  <span className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
                                    referral.level === 1 ? 'bg-blue-500/20 text-blue-300 light:bg-blue-100 light:text-blue-700' :
                                    referral.level === 2 ? 'bg-cyan-500/20 text-cyan-300 light:bg-cyan-100 light:text-cyan-700' :
                                    'bg-purple-500/20 text-purple-300 light:bg-purple-100 light:text-purple-700'
                                  }`}>
                                    <span className="hidden sm:inline">Level {referral.level}</span>
                                    <span className="sm:hidden">L{referral.level}</span>
                                  </span>
                                </td>
                                <td className="py-3 sm:py-4 px-3 sm:px-4">
                                  <div className="text-white font-medium light:text-gray-900 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{referral.name}</div>
                                  <div className="text-xs text-gray-400 light:text-gray-600 md:hidden truncate max-w-[120px]">{referral.email}</div>
                                </td>
                                <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-gray-400 light:text-gray-700 hidden md:table-cell">{referral.email}</td>
                                <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-green-400 font-semibold light:text-green-600">${referral.earnings.toFixed(2)}</td>
                                <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-gray-400 light:text-gray-700 hidden sm:table-cell">{new Date(referral.joinedAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="animate-fadeIn">
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-4 light:from-green-200 light:to-blue-200">
                      <span className="text-2xl sm:text-3xl">📊</span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-400 mb-2 light:text-gray-600">Referral History</p>
                    <p className="text-xs sm:text-sm text-gray-500 light:text-gray-600">Track your referral performance over time</p>
                    
                    <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 light:bg-blue-50">
                        <p className="text-xs sm:text-sm text-gray-400 light:text-gray-600">This Week</p>
                        <p className="text-xl sm:text-2xl font-bold text-white light:text-gray-900">0</p>
                        <p className="text-xs text-gray-500 light:text-gray-600">New referrals</p>
                      </div>
                      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 light:bg-blue-50">
                        <p className="text-xs sm:text-sm text-gray-400 light:text-gray-600">This Month</p>
                        <p className="text-xl sm:text-2xl font-bold text-white light:text-gray-900">0</p>
                        <p className="text-xs text-gray-500 light:text-gray-600">New referrals</p>
                      </div>
                      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 light:bg-blue-50">
                        <p className="text-xs sm:text-sm text-gray-400 light:text-gray-600">Total</p>
                        <p className="text-xl sm:text-2xl font-bold text-white light:text-gray-900">{stats.totalReferrals.level1 + stats.totalReferrals.level2 + stats.totalReferrals.level3}</p>
                        <p className="text-xs text-gray-500 light:text-gray-600">All time</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Tab */}
              {activeTab === 'transaction' && (
                <div className="animate-fadeIn space-y-6">
                  {/* Transaction Statistics */}
                  {transactionStats && (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 sm:p-4 light:bg-blue-50">
                        <p className="text-xs text-gray-400 mb-1 light:text-gray-600">Total Earned</p>
                        <p className="text-lg sm:text-xl font-bold text-white light:text-gray-900">${transactionStats.totalEarned.toFixed(2)}</p>
                      </div>
                      <div className="bg-green-500/10 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-green-500/30">
                        <p className="text-xs text-gray-400 mb-1 light:text-gray-600">Paid</p>
                        <p className="text-lg sm:text-xl font-bold text-green-400">${transactionStats.paidAmount.toFixed(2)}</p>
                      </div>
                      <div className="bg-yellow-500/10 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-yellow-500/30">
                        <p className="text-xs text-gray-400 mb-1 light:text-gray-600">Pending</p>
                        <p className="text-lg sm:text-xl font-bold text-yellow-400">${transactionStats.pendingAmount.toFixed(2)}</p>
                      </div>
                      <div className="bg-blue-500/10 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-blue-500/30">
                        <p className="text-xs text-gray-400 mb-1 light:text-gray-600">Level 1</p>
                        <p className="text-lg sm:text-xl font-bold text-blue-400">${transactionStats.byLevel.level1.toFixed(2)}</p>
                      </div>
                      <div className="bg-purple-500/10 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-purple-500/30">
                        <p className="text-xs text-gray-400 mb-1 light:text-gray-600">Transactions</p>
                        <p className="text-lg sm:text-xl font-bold text-purple-400">{transactionStats.totalTransactions}</p>
                      </div>
                    </div>
                  )}

                  {/* Transaction History */}
                  {transactionLoading ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-400 light:text-gray-600">Loading transactions...</p>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-4 light:bg-purple-100">
                        <svg className="w-10 h-10 text-gray-500 light:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                      <p className="text-gray-400 mb-2 light:text-gray-600">No commission transactions yet</p>
                      <p className="text-gray-500 text-sm light:text-gray-600">Commissions will appear here when your referrals make trades</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10 light:border-blue-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Date</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Amount</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Level</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700 hidden md:table-cell">From</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700 hidden lg:table-cell">Source</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((transaction: any) => (
                            <tr key={transaction._id} className="border-b border-white/5 hover:bg-white/5 transition-colors light:border-blue-100 light:hover:bg-blue-50">
                              <td className="py-4 px-4">
                                <p className="text-sm text-white light:text-gray-900">
                                  {new Date(transaction.createdAt).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-gray-500 light:text-gray-600">
                                  {new Date(transaction.createdAt).toLocaleTimeString()}
                                </p>
                              </td>
                              <td className="py-4 px-4">
                                <p className="text-sm font-bold text-green-400 light:text-green-600">
                                  +${transaction.amount.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500 light:text-gray-600">
                                  {transaction.commissionRate}% rate
                                </p>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${
                                  transaction.referralLevel === 1 
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : transaction.referralLevel === 2
                                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                }`}>
                                  Level {transaction.referralLevel}
                                </span>
                              </td>
                              <td className="py-4 px-4 hidden md:table-cell">
                                <p className="text-sm text-white light:text-gray-900">
                                  {transaction.referralUserId?.name || 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-500 light:text-gray-600">
                                  {transaction.referralUserId?.email || '-'}
                                </p>
                              </td>
                              <td className="py-4 px-4 hidden lg:table-cell">
                                <span className="text-xs text-gray-400 light:text-gray-600">
                                  {transaction.source.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                  transaction.status === 'pending' 
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : transaction.status === 'paid'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                }`}>
                                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Withdraw Tab */}
              {activeTab === 'withdraw' && (
                <div className="animate-fadeIn space-y-6">
                  {/* Withdrawal Action Button */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-white light:text-gray-900">Withdrawal History</h3>
                      <p className="text-sm text-gray-400 light:text-gray-600">Manage your earnings withdrawals</p>
                    </div>
                    <button
                      onClick={() => setShowWithdrawModal(true)}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl font-bold text-white transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-green-500/25"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="hidden sm:inline">Request Withdrawal</span>
                      <span className="sm:hidden">Withdraw</span>
                    </button>
                  </div>

                  {/* Withdrawal Statistics */}
                  {withdrawalStats && (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 sm:p-4 light:bg-blue-50">
                        <p className="text-xs text-gray-400 mb-1 light:text-gray-600">Total</p>
                        <p className="text-lg sm:text-xl font-bold text-white light:text-gray-900">{withdrawalStats.total}</p>
                      </div>
                      <div className="bg-yellow-500/10 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-yellow-500/30">
                        <p className="text-xs text-gray-400 mb-1 light:text-gray-600">Pending</p>
                        <p className="text-lg sm:text-xl font-bold text-yellow-400">{withdrawalStats.pending}</p>
                      </div>
                      <div className="bg-blue-500/10 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-blue-500/30">
                        <p className="text-xs text-gray-400 mb-1 light:text-gray-600">Processing</p>
                        <p className="text-lg sm:text-xl font-bold text-blue-400">{withdrawalStats.processing}</p>
                      </div>
                      <div className="bg-green-500/10 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-green-500/30">
                        <p className="text-xs text-gray-400 mb-1 light:text-gray-600">Completed</p>
                        <p className="text-lg sm:text-xl font-bold text-green-400">{withdrawalStats.completed}</p>
                      </div>
                      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 sm:p-4 light:bg-green-50">
                        <p className="text-xs text-gray-400 mb-1 light:text-gray-600">Total Withdrawn</p>
                        <p className="text-lg sm:text-xl font-bold text-white light:text-gray-900">${withdrawalStats.totalWithdrawn.toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  {/* Withdrawal History */}
                  {withdrawalLoading ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-400 light:text-gray-600">Loading withdrawal history...</p>
                    </div>
                  ) : withdrawals.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-4 light:bg-blue-100">
                        <svg className="w-10 h-10 text-gray-500 light:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-400 mb-2 light:text-gray-600">No withdrawal history</p>
                      <p className="text-gray-500 text-sm light:text-gray-600">Your withdrawal requests will appear here</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10 light:border-blue-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Date</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Amount</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Network</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700 hidden md:table-cell">Wallet</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 light:text-gray-700 hidden lg:table-cell">TX Hash</th>
                          </tr>
                        </thead>
                        <tbody>
                          {withdrawals.map((withdrawal: any) => (
                            <tr key={withdrawal._id} className="border-b border-white/5 hover:bg-white/5 transition-colors light:border-blue-100 light:hover:bg-blue-50">
                              <td className="py-4 px-4">
                                <p className="text-sm text-white light:text-gray-900">
                                  {new Date(withdrawal.createdAt).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-gray-500 light:text-gray-600">
                                  {new Date(withdrawal.createdAt).toLocaleTimeString()}
                                </p>
                              </td>
                              <td className="py-4 px-4">
                                <p className="text-sm font-bold text-green-400 light:text-green-600">
                                  ${withdrawal.amount.toFixed(2)}
                                </p>
                              </td>
                              <td className="py-4 px-4">
                                <span className="inline-block px-2 py-1 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  {withdrawal.network}
                                </span>
                              </td>
                              <td className="py-4 px-4 hidden md:table-cell">
                                <p className="text-xs font-mono text-gray-400 light:text-gray-600">
                                  {withdrawal.walletAddress.substring(0, 6)}...{withdrawal.walletAddress.substring(withdrawal.walletAddress.length - 4)}
                                </p>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                  withdrawal.status === 'pending' 
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : withdrawal.status === 'processing'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : withdrawal.status === 'completed'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}>
                                  {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                                </span>
                              </td>
                              <td className="py-4 px-4 hidden lg:table-cell">
                                {withdrawal.transactionHash ? (
                                  <a
                                    href={`${withdrawal.network === 'ERC20' ? 'https://etherscan.io' : 'https://bscscan.com'}/tx/${withdrawal.transactionHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-mono text-blue-400 hover:text-blue-300 hover:underline"
                                  >
                                    {withdrawal.transactionHash.substring(0, 6)}...{withdrawal.transactionHash.substring(withdrawal.transactionHash.length - 4)}
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-500">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && stats && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-gray-900 to-green-900/30 dark:from-gray-900 dark:to-green-900/30 light:from-white light:to-green-50 rounded-2xl border-2 border-green-500/30 dark:border-green-500/30 light:border-green-300 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Withdraw Earnings</h3>
                    <p className="text-sm text-green-100">USDT (ERC20/BEP20)</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawError('');
                    setWithdrawSuccess('');
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Balance Info */}
              <div className="bg-green-500/10 dark:bg-green-500/10 light:bg-green-100 border border-green-500/30 dark:border-green-500/30 light:border-green-300 rounded-xl p-4">
                <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 mb-1">Available Balance</p>
                <p className="text-3xl font-bold text-green-400 dark:text-green-400 light:text-green-600">
                  ${stats.totalEarnings.toFixed(2)}
                </p>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-bold text-gray-200 dark:text-gray-200 light:text-gray-800 mb-2">
                  Withdrawal Amount (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400 light:text-gray-600 font-bold">$</span>
                  <input
                    type="number"
                    min="10"
                    max={stats.totalEarnings}
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="10.00"
                    className="w-full bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-300 rounded-lg pl-8 pr-4 py-3 text-white dark:text-white light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">
                    Minimum: $10.00
                  </p>
                  <button
                    onClick={() => setWithdrawAmount(stats.totalEarnings.toFixed(2))}
                    className="text-xs text-green-400 dark:text-green-400 light:text-green-600 hover:underline font-semibold"
                  >
                    Withdraw All
                  </button>
                </div>
              </div>

              {/* Network Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-200 dark:text-gray-200 light:text-gray-800 mb-2">
                  Network *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setWithdrawNetwork('ERC20')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      withdrawNetwork === 'ERC20'
                        ? 'border-green-500 bg-green-500/20 dark:border-green-500 dark:bg-green-500/20 light:border-green-600 light:bg-green-100'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 dark:border-gray-700 dark:bg-gray-800/50 light:border-gray-300 light:bg-gray-50 light:hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <p className="font-bold text-white dark:text-white light:text-gray-900">ERC20</p>
                      <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mt-1">Ethereum</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setWithdrawNetwork('BEP20')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      withdrawNetwork === 'BEP20'
                        ? 'border-green-500 bg-green-500/20 dark:border-green-500 dark:bg-green-500/20 light:border-green-600 light:bg-green-100'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 dark:border-gray-700 dark:bg-gray-800/50 light:border-gray-300 light:bg-gray-50 light:hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <p className="font-bold text-white dark:text-white light:text-gray-900">BEP20</p>
                      <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mt-1">BSC</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Wallet Address Input */}
              <div>
                <label className="block text-sm font-bold text-gray-200 dark:text-gray-200 light:text-gray-800 mb-2">
                  {withdrawNetwork} Wallet Address *
                </label>
                <input
                  type="text"
                  value={withdrawWallet}
                  onChange={(e) => setWithdrawWallet(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-300 rounded-lg px-4 py-3 text-white dark:text-white light:text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mt-2">
                  ⚠️ Make sure this wallet address supports USDT on {withdrawNetwork} network
                </p>
              </div>

              {/* Warning Box */}
              <div className="bg-yellow-500/10 dark:bg-yellow-500/10 light:bg-yellow-100 border border-yellow-500/30 dark:border-yellow-500/30 light:border-yellow-300 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-xs text-yellow-200 dark:text-yellow-200 light:text-yellow-800 space-y-1">
                    <p className="font-bold">Important Notice:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Processing time: 24-48 hours</li>
                      <li>Double-check wallet address - incorrect address = lost funds</li>
                      <li>Ensure wallet supports USDT on selected network</li>
                      <li>Network fees will be deducted from withdrawal amount</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {withdrawError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{withdrawError}</p>
                </div>
              )}

              {/* Success Message */}
              {withdrawSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <p className="text-green-400 text-sm">{withdrawSuccess}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawError('');
                    setWithdrawSuccess('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 dark:bg-gray-700 light:bg-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600 light:hover:bg-gray-300 rounded-xl font-bold text-white dark:text-white light:text-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdrawRequest}
                  disabled={withdrawLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl font-bold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {withdrawLoading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Submit Withdrawal Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
