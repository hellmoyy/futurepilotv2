'use client';

import { useState } from 'react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email address is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);
    } catch (error) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccess(false);
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 backdrop-blur-sm bg-black/60 animate-in fade-in duration-200">
      <div className="relative max-w-md w-full">
        {/* Ambient Glow */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-blue-500/30 blur-3xl opacity-50"></div>
        
        {/* Modal Card */}
        <div className="relative bg-white/[0.03] dark:bg-white/[0.03] light:bg-white backdrop-blur-3xl rounded-[2rem] border border-white/10 dark:border-white/10 light:border-blue-200 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 dark:from-blue-500/5 dark:to-cyan-500/5 light:from-blue-100/50 light:to-cyan-100/50 rounded-[2rem]"></div>
          
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-0 right-0 w-8 h-8 bg-white/5 dark:bg-white/5 light:bg-gray-100 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-gray-200 rounded-lg flex items-center justify-center transition-all"
            >
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-400 light:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {success ? (
              /* Success State */
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400/20 to-green-600/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-green-400/20">
                    <svg className="w-10 h-10 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-center mb-4">
                  <span className="bg-gradient-to-r from-green-300 via-green-400 to-emerald-300 bg-clip-text text-transparent">
                    Check Your Email
                  </span>
                </h2>

                <p className="text-center text-gray-300 dark:text-gray-300 light:text-gray-600 mb-6 leading-relaxed">
                  We&apos;ve sent a password reset link to<br />
                  <span className="font-semibold text-green-400 dark:text-green-400 light:text-green-600">{email}</span>
                </p>

                <p className="text-center text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm mb-8">
                  Please check your inbox and click the reset link. The link will expire in 10 minutes.
                </p>

                <button
                  onClick={handleClose}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl font-semibold hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30 text-white"
                >
                  Close
                </button>

                <div className="mt-6 text-center">
                  <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm">
                    Didn&apos;t receive the email?{' '}
                    <button
                      onClick={() => {
                        setSuccess(false);
                        setEmail('');
                      }}
                      className="text-blue-400 dark:text-blue-400 light:text-blue-600 hover:text-blue-300 dark:hover:text-blue-300 light:hover:text-blue-700 font-semibold hover:underline transition-colors"
                    >
                      Try again
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              /* Form State */
              <>
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400/20 to-blue-600/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-blue-400/20">
                    <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-center mb-4">
                  <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    Forgot Password?
                  </span>
                </h2>

                <p className="text-center text-gray-300 dark:text-gray-300 light:text-gray-600 mb-8 leading-relaxed">
                  No worries! Enter your email address and we&apos;ll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/50 rounded-xl p-4">
                      <p className="text-red-400 text-sm font-medium">{error}</p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="forgot-email" className="block text-sm font-semibold text-gray-200 dark:text-gray-200 light:text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="forgot-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 bg-white/5 dark:bg-white/5 light:bg-gray-50 backdrop-blur-xl border border-white/10 dark:border-white/10 light:border-gray-300 rounded-xl text-white dark:text-white light:text-gray-900 placeholder-gray-400 dark:placeholder-gray-400 light:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 transition-all"
                    />
                  </div>

                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group relative w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative z-10 text-white">
                        {isLoading ? 'Sending reset link...' : 'Send Reset Link'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-full px-6 py-4 bg-white/5 dark:bg-white/5 light:bg-gray-100 backdrop-blur-xl border border-white/10 dark:border-white/10 light:border-gray-300 rounded-2xl font-semibold hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-gray-200 hover:border-white/20 dark:hover:border-white/20 light:hover:border-gray-400 transition-all text-white dark:text-white light:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}