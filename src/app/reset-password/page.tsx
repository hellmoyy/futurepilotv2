'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const { theme } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch (error) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 dark:bg-gray-900 light:bg-gradient-to-br light:from-gray-50 light:via-blue-50 light:to-gray-100 relative overflow-hidden flex items-center justify-center px-6 py-12">
        {/* Animated Background Gradients */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/30 dark:bg-green-500/30 light:bg-green-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500/30 dark:bg-emerald-500/30 light:bg-emerald-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-md w-full relative">
          {/* Success Card */}
          <div className="relative bg-white/[0.03] dark:bg-white/[0.03] light:bg-white backdrop-blur-3xl rounded-[2rem] border border-white/10 dark:border-white/10 light:border-blue-200 p-8 shadow-2xl">
            <div className="text-center">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400/20 to-green-600/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-green-400/20">
                  <svg className="w-10 h-10 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <h1 className="text-3xl font-bold mb-4">
                <span className="bg-gradient-to-r from-green-400 to-emerald-400 dark:from-green-400 dark:to-emerald-400 light:from-green-600 light:to-emerald-600 bg-clip-text text-transparent">
                  Password Reset Successful
                </span>
              </h1>

              <p className="text-gray-300 dark:text-gray-300 light:text-gray-600 text-lg mb-8">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>

              <Link
                href="/login"
                className="group relative w-full inline-block px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 text-white">Sign In Now</span>
              </Link>
            </div>
          </div>

          {/* Back to Home */}
          <div className="relative mt-8 text-center">
            <Link href="/" className="inline-flex items-center space-x-2 text-gray-300 dark:text-gray-300 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-gray-900 transition-colors group">
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-900 light:bg-gradient-to-br light:from-gray-50 light:via-blue-50 light:to-gray-100 relative overflow-hidden flex items-center justify-center px-6 py-12">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 dark:bg-blue-500/30 light:bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/30 dark:bg-cyan-500/30 light:bg-cyan-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-600/30 dark:bg-blue-600/30 light:bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full relative">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white dark:text-white light:text-gray-900 mb-3">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-300 dark:to-cyan-300 light:from-blue-600 light:to-cyan-600 bg-clip-text text-transparent">
              Reset Password
            </span>
          </h1>
          <p className="text-gray-300 dark:text-gray-300 light:text-gray-600 text-lg">
            Enter your new password below
          </p>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-3xl opacity-50 pointer-events-none"></div>

        {/* Reset Password Form */}
        <div className="relative bg-white/[0.03] dark:bg-white/[0.03] light:bg-white backdrop-blur-3xl rounded-[2rem] border border-white/10 dark:border-white/10 light:border-blue-200 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 dark:from-blue-500/5 dark:to-cyan-500/5 light:from-blue-100/50 light:to-cyan-100/50 rounded-[2rem]"></div>
          
          <form onSubmit={handleSubmit} className="relative space-y-6">
            {error && (
              <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/50 rounded-xl p-4">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-200 dark:text-gray-200 light:text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/5 dark:bg-white/5 light:bg-gray-50 backdrop-blur-xl border border-white/10 dark:border-white/10 light:border-gray-300 rounded-xl text-white dark:text-white light:text-gray-900 placeholder-gray-400 dark:placeholder-gray-400 light:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 transition-all"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-500 mt-1.5 ml-1">Minimum 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-200 dark:text-gray-200 light:text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/5 dark:bg-white/5 light:bg-gray-50 backdrop-blur-xl border border-white/10 dark:border-white/10 light:border-gray-300 rounded-xl text-white dark:text-white light:text-gray-900 placeholder-gray-400 dark:placeholder-gray-400 light:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="group relative w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 text-white">
                {isLoading ? 'Resetting password...' : 'Reset Password'}
              </span>
            </button>
          </form>

          <div className="relative mt-6 text-center">
            <p className="text-gray-300 dark:text-gray-300 light:text-gray-600">
              Remember your password?{' '}
              <Link href="/login" className="text-blue-400 dark:text-blue-400 light:text-blue-600 hover:text-blue-300 dark:hover:text-blue-300 light:hover:text-blue-700 font-semibold hover:underline transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="relative mt-8 text-center">
          <Link href="/" className="inline-flex items-center space-x-2 text-gray-300 dark:text-gray-300 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-gray-900 transition-colors group">
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 dark:bg-gray-900 light:bg-gray-50 flex items-center justify-center">
        <div className="text-white dark:text-white light:text-gray-900 text-xl">Loading...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}