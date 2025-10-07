'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      router.push('/dashboard');
    }
  }, [sessionStatus, router]);

  // Show loading while checking session
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An unexpected error occurred');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-6">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-600/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full relative">
        {/* Ambient Glow */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-3xl opacity-50 pointer-events-none"></div>

        {/* Card */}
        <div className="relative bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] border border-white/10 p-12 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 rounded-[2rem]"></div>

          <div className="relative text-center">
            {/* Icon */}
            <div className="flex justify-center mb-8">
              {status === 'verifying' && (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400/20 to-blue-600/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-blue-400/20 animate-pulse">
                  <svg className="w-10 h-10 text-blue-300 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}

              {status === 'success' && (
                <div className="w-20 h-20 bg-gradient-to-br from-green-400/20 to-green-600/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-green-400/20">
                  <svg className="w-10 h-10 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {status === 'error' && (
                <div className="w-20 h-20 bg-gradient-to-br from-red-400/20 to-red-600/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-red-400/20">
                  <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold mb-4">
              {status === 'verifying' && (
                <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Verifying Email...
                </span>
              )}
              {status === 'success' && (
                <span className="bg-gradient-to-r from-green-300 via-green-400 to-green-500 bg-clip-text text-transparent">
                  Email Verified!
                </span>
              )}
              {status === 'error' && (
                <span className="bg-gradient-to-r from-red-300 via-red-400 to-red-500 bg-clip-text text-transparent">
                  Verification Failed
                </span>
              )}
            </h1>

            {/* Message */}
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              {message || 'Please wait while we verify your email address...'}
            </p>

            {/* Buttons */}
            {status !== 'verifying' && (
              <div className="space-y-3">
                {status === 'success' && (
                  <Link
                    href="/login"
                    className="group relative w-full inline-block px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10">Sign In Now</span>
                  </Link>
                )}

                <Link
                  href="/"
                  className="block w-full px-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl font-semibold hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  Back to Home
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
