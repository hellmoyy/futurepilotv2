'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams?.get('ref') || null;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      // Register user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Show verification popup instead of auto-login
      setUserEmail(formData.email);
      setShowVerificationPopup(true);
      setIsLoading(false);
    } catch (error) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-6 py-12">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-600/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      <div className="max-w-md w-full relative">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">
            <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">Create Account</span>
          </h1>
          <p className="text-gray-300 text-lg">Start trading smarter with AI</p>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-3xl opacity-50 pointer-events-none"></div>

        {/* Register Form */}
        <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] border border-white/10 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 rounded-[2rem]"></div>
          <form onSubmit={handleSubmit} className="relative space-y-5">
            {error && (
              <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/50 rounded-xl p-4">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {referralCode && (
              <div className="bg-green-500/10 backdrop-blur-xl border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-300 text-sm font-medium">
                    Referral code applied: <span className="font-bold">{referralCode}</span>
                  </p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-200 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:border-white/20 transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-200 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:border-white/20 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-200 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:border-white/20 transition-all"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-400 mt-1.5 ml-1">Minimum 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-200 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:border-white/20 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">{isLoading ? 'Creating account...' : 'Create Account'}</span>
            </button>
          </form>

          <div className="relative mt-6 text-center">
            <p className="text-gray-300">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-cyan-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="relative mt-8 text-center">
          <Link href="/" className="inline-flex items-center space-x-2 text-gray-300 hover:text-white transition-colors group">
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Verification Email Popup */}
      {showVerificationPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 backdrop-blur-sm bg-black/60 animate-in fade-in duration-200">
          <div className="relative max-w-md w-full">
            {/* Ambient Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-blue-500/30 blur-3xl opacity-50"></div>
            
            {/* Popup Card */}
            <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] border border-white/10 p-8 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 rounded-[2rem]"></div>
              
              <div className="relative">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400/20 to-blue-600/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-blue-400/20">
                    <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-center mb-4">
                  <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    Check Your Email
                  </span>
                </h2>

                {/* Message */}
                <p className="text-center text-gray-300 mb-6 leading-relaxed">
                  We&apos;ve sent a verification link to<br />
                  <span className="font-semibold text-blue-400">{userEmail}</span>
                </p>

                <p className="text-center text-gray-400 text-sm mb-8">
                  Please check your inbox and click the verification link to activate your account. 
                  The link will expire in 24 hours.
                </p>

                {/* Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowVerificationPopup(false);
                      router.push('/login');
                    }}
                    className="group relative w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10">Go to Login</span>
                  </button>

                  <button
                    onClick={() => setShowVerificationPopup(false)}
                    className="w-full px-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl font-semibold hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    Close
                  </button>
                </div>

                {/* Resend Link */}
                <div className="mt-6 text-center">
                  <p className="text-gray-400 text-sm">
                    Didn&apos;t receive the email?{' '}
                    <button className="text-blue-400 hover:text-cyan-300 font-semibold transition-colors">
                      Resend
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
