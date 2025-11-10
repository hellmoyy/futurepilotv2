'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';
import TurnstileCaptcha from '@/components/TurnstileCaptcha';
import HoneypotFields from '@/components/HoneypotFields';

// Feature flag: Enable/Disable CAPTCHA
const CAPTCHA_ENABLED = process.env.NEXT_PUBLIC_CAPTCHA_ENABLED === 'true';
// Get Turnstile site key from environment
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const referralCode = searchParams?.get('ref') || null;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [captchaSolution, setCaptchaSolution] = useState('');
  const [honeypotTriggered, setHoneypotTriggered] = useState(false);
  const [formStartTime] = useState(Date.now());
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    isValid: false,
  });

  const { theme } = useTheme();

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 dark:bg-gray-900 light:bg-gray-50 flex items-center justify-center">
        <div className="text-white dark:text-white light:text-gray-900 text-xl">Loading...</div>
      </div>
    );
  }

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

    if (!passwordStrength.isValid) {
      setError('Password must contain uppercase, lowercase, number, and be at least 8 characters');
      setIsLoading(false);
      return;
    }

    // Check honeypot (bot detection)
    // Note: Only trigger if honeypot is strongly triggered (multiple fields filled)
    // This prevents false positives from browser autofill
    if (honeypotTriggered) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Honeypot triggered - possible bot detected');
      }
      setError('Security check failed. Please try again.');
      setIsLoading(false);
      return;
    }

    // Check if submitted too fast (bot-like behavior)
    // Reduced from 3 to 2 seconds to be less strict
    const timeElapsed = (Date.now() - formStartTime) / 1000;
    if (timeElapsed < 2) {
      setError('Please take your time to fill the form.');
      setIsLoading(false);
      return;
    }

    // Check CAPTCHA (only if enabled)
    if (CAPTCHA_ENABLED && !captchaSolution) {
      setError('Please complete the security check');
      setIsLoading(false);
      return;
    }

    try {
      // Verify CAPTCHA first (only if enabled)
      if (CAPTCHA_ENABLED) {
        const captchaResponse = await fetch('/api/auth/verify-captcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: captchaSolution }),
        });

        if (!captchaResponse.ok) {
          setError('Security check failed. Please try again.');
          setCaptchaSolution('');
          setIsLoading(false);
          return;
        }
      }

      // Register user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          referralCode: referralCode || undefined,
          captchaSolution,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Redirect to verification page
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      setIsLoading(false);
    } catch (error) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Check password strength when password field changes
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const minLength = password.length >= 8;

    // Calculate score (0-4)
    let score = 0;
    if (hasUpperCase) score++;
    if (hasLowerCase) score++;
    if (hasNumber) score++;
    if (minLength) score++;

    const isValid = hasUpperCase && hasLowerCase && hasNumber && minLength;

    setPasswordStrength({
      score,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      isValid,
    });
  };

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
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-300 dark:to-cyan-300 light:from-blue-600 light:to-cyan-600 bg-clip-text text-transparent">Create Account</span>
          </h1>
          <p className="text-gray-300 dark:text-gray-300 light:text-gray-600 text-lg">Start trading smarter with AI</p>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-3xl opacity-50 pointer-events-none"></div>

        {/* Register Form */}
        <div className="relative bg-white/[0.03] dark:bg-white/[0.03] light:bg-white backdrop-blur-3xl rounded-[2rem] border border-white/10 dark:border-white/10 light:border-blue-200 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 dark:from-blue-500/5 dark:to-cyan-500/5 light:from-blue-100/50 light:to-cyan-100/50 rounded-[2rem]"></div>
          <form onSubmit={handleSubmit} className="relative space-y-5">
            {/* Honeypot fields for bot detection */}
            <HoneypotFields 
              onTrigger={() => setHoneypotTriggered(true)}
              onChange={(triggered) => setHoneypotTriggered(triggered)}
            />

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
              <label htmlFor="name" className="block text-sm font-semibold text-gray-200 dark:text-gray-200 light:text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 dark:bg-white/5 light:bg-gray-50 backdrop-blur-xl border border-white/10 dark:border-white/10 light:border-gray-300 rounded-xl text-white dark:text-white light:text-gray-900 placeholder-gray-400 dark:placeholder-gray-400 light:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-200 dark:text-gray-200 light:text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 dark:bg-white/5 light:bg-gray-50 backdrop-blur-xl border border-white/10 dark:border-white/10 light:border-gray-300 rounded-xl text-white dark:text-white light:text-gray-900 placeholder-gray-400 dark:placeholder-gray-400 light:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-200 dark:text-gray-200 light:text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-12 bg-white/5 dark:bg-white/5 light:bg-gray-50 backdrop-blur-xl border border-white/10 dark:border-white/10 light:border-gray-300 rounded-xl text-white dark:text-white light:text-gray-900 placeholder-gray-400 dark:placeholder-gray-400 light:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-300 dark:text-gray-400 dark:hover:text-gray-300 light:text-gray-500 light:hover:text-gray-700 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3 space-y-2">
                  {/* Progress Bar */}
                  <div className="relative h-2 bg-white/10 dark:bg-white/10 light:bg-gray-200 rounded-full overflow-hidden backdrop-blur-xl">
                    <div
                      className={`absolute top-0 left-0 h-full transition-all duration-300 rounded-full ${
                        passwordStrength.score === 4
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 w-full'
                          : passwordStrength.score === 3
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 w-3/4'
                          : passwordStrength.score === 2
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 w-1/2'
                          : 'bg-gradient-to-r from-red-500 to-orange-500 w-1/4'
                      }`}
                    />
                  </div>

                  {/* Strength Label */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        passwordStrength.score === 4
                          ? 'text-green-400'
                          : passwordStrength.score === 3
                          ? 'text-blue-400'
                          : passwordStrength.score === 2
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {passwordStrength.score === 4
                        ? '✓ Strong Password'
                        : passwordStrength.score === 3
                        ? 'Good Password'
                        : passwordStrength.score === 2
                        ? 'Fair Password'
                        : 'Weak Password'}
                    </span>
                  </div>

                  {/* Requirements Checklist */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          passwordStrength.hasUpperCase
                            ? 'bg-green-500/20 border border-green-500'
                            : 'bg-white/5 border border-white/20'
                        }`}
                      >
                        {passwordStrength.hasUpperCase && (
                          <svg className="w-2.5 h-2.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs ${passwordStrength.hasUpperCase ? 'text-green-400' : 'text-gray-400 dark:text-gray-400 light:text-gray-500'}`}>
                        At least one uppercase letter (A-Z)
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          passwordStrength.hasLowerCase
                            ? 'bg-green-500/20 border border-green-500'
                            : 'bg-white/5 border border-white/20'
                        }`}
                      >
                        {passwordStrength.hasLowerCase && (
                          <svg className="w-2.5 h-2.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs ${passwordStrength.hasLowerCase ? 'text-green-400' : 'text-gray-400 dark:text-gray-400 light:text-gray-500'}`}>
                        At least one lowercase letter (a-z)
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          passwordStrength.hasNumber
                            ? 'bg-green-500/20 border border-green-500'
                            : 'bg-white/5 border border-white/20'
                        }`}
                      >
                        {passwordStrength.hasNumber && (
                          <svg className="w-2.5 h-2.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs ${passwordStrength.hasNumber ? 'text-green-400' : 'text-gray-400 dark:text-gray-400 light:text-gray-500'}`}>
                        At least one number (0-9)
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          formData.password.length >= 8
                            ? 'bg-green-500/20 border border-green-500'
                            : 'bg-white/5 border border-white/20'
                        }`}
                      >
                        {formData.password.length >= 8 && (
                          <svg className="w-2.5 h-2.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs ${formData.password.length >= 8 ? 'text-green-400' : 'text-gray-400 dark:text-gray-400 light:text-gray-500'}`}>
                        Minimum 8 characters
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-200 dark:text-gray-200 light:text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 pr-12 bg-white/5 dark:bg-white/5 light:bg-gray-50 backdrop-blur-xl border border-white/10 dark:border-white/10 light:border-gray-300 rounded-xl text-white dark:text-white light:text-gray-900 placeholder-gray-400 dark:placeholder-gray-400 light:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-300 dark:text-gray-400 dark:hover:text-gray-300 light:text-gray-500 light:hover:text-gray-700 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* CAPTCHA */}
            {CAPTCHA_ENABLED && (
              <div>
                {TURNSTILE_SITE_KEY ? (
                  <TurnstileCaptcha
                    sitekey={TURNSTILE_SITE_KEY}
                    onSuccess={(token) => setCaptchaSolution(token)}
                    onError={() => {
                      setError('Security check error. Please refresh the page.');
                      setCaptchaSolution('');
                    }}
                    onExpire={() => {
                      setError('Security check expired. Please try again.');
                      setCaptchaSolution('');
                    }}
                    theme="auto"
                  />
                ) : (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-sm text-red-400">
                      ⚠️ Security verification unavailable. Please contact support.
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">{isLoading ? 'Creating account...' : 'Create Account'}</span>
            </button>
          </form>

          <div className="relative mt-6 text-center space-y-2">
            <p className="text-gray-300 dark:text-gray-300 light:text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 dark:text-blue-400 light:text-blue-600 hover:text-cyan-300 dark:hover:text-cyan-300 light:hover:text-blue-700 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
            <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm">
              Forgot your password?{' '}
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-blue-400 dark:text-blue-400 light:text-blue-600 hover:text-blue-300 dark:hover:text-blue-300 light:hover:text-blue-700 font-semibold hover:underline transition-colors"
              >
                Reset it here
              </button>
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

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)} 
      />
    </div>
  );
}
