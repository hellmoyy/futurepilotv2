'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function SecurityTab() {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      const response = await fetch('/api/auth/2fa/status');
      const data = await response.json();
      setTwoFAEnabled(data.enabled || false);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const handleEnable2FA = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setShowSetup2FA(true);
      } else {
        setError(data.error || 'Failed to setup 2FA');
      }
    } catch (error) {
      setError('An error occurred while setting up 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setBackupCodes(data.backupCodes || []);
        setTwoFAEnabled(true);
        setSuccess('2FA enabled successfully! Save your backup codes.');
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (error) {
      setError('An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
      });

      if (response.ok) {
        setTwoFAEnabled(false);
        setShowSetup2FA(false);
        setQrCode('');
        setSecret('');
        setBackupCodes([]);
        setSuccess('2FA disabled successfully');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      setError('An error occurred while disabling 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setError('An error occurred while changing password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white light:text-gray-900 mb-2">
          Security Settings
        </h2>
        <p className="text-gray-400 light:text-gray-600">
          Protect your account with 2FA and strong password
        </p>
      </div>

      {/* 2FA Section */}
      <div className="p-6 bg-white/5 rounded-xl light:bg-gray-50 border border-white/10 light:border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              twoFAEnabled 
                ? 'bg-green-500/20 border border-green-500/30' 
                : 'bg-red-500/20 border border-red-500/30'
            }`}>
              <svg className={`w-6 h-6 ${twoFAEnabled ? 'text-green-400' : 'text-red-400'}`} 
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white light:text-gray-900">
                Two-Factor Authentication (2FA)
              </h3>
              <p className="text-sm text-gray-400 light:text-gray-600">
                Status: {twoFAEnabled ? (
                  <span className="text-green-400 font-semibold">Enabled ✓</span>
                ) : (
                  <span className="text-red-400 font-semibold">Disabled ✗</span>
                )}
              </p>
            </div>
          </div>
          
          {!showSetup2FA && (
            <button
              onClick={twoFAEnabled ? handleDisable2FA : handleEnable2FA}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                twoFAEnabled
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {loading ? 'Processing...' : twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </button>
          )}
        </div>

        <p className="text-sm text-gray-400 light:text-gray-600 mb-4">
          Add an extra layer of security to your account. You'll need to enter a code from your authenticator app each time you log in.
        </p>

        {/* 2FA Setup */}
        {showSetup2FA && !twoFAEnabled && qrCode && (
          <div className="mt-6 p-6 bg-white/5 rounded-lg border border-blue-500/30 light:bg-blue-50">
            <h4 className="font-semibold text-white light:text-gray-900 mb-4">
              Setup Two-Factor Authentication
            </h4>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 light:text-gray-600 mb-3">
                  1. Scan this QR code with your authenticator app:
                </p>
                <div className="bg-white p-4 rounded-lg inline-block">
                  <Image 
                    src={qrCode} 
                    alt="2FA QR Code" 
                    width={200} 
                    height={200}
                    className="w-48 h-48"
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 light:text-gray-600 mb-2">
                  2. Or enter this secret key manually:
                </p>
                <div className="bg-white/10 p-3 rounded-lg font-mono text-sm text-white light:bg-gray-100 light:text-gray-900 break-all">
                  {secret}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 light:text-gray-600 mb-2">
                  3. Enter the 6-digit code from your app:
                </p>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full max-w-xs bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest font-mono light:bg-white light:border-gray-300 light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleVerify2FA}
                  disabled={loading || verificationCode.length !== 6}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </button>
                <button
                  onClick={() => {
                    setShowSetup2FA(false);
                    setQrCode('');
                    setSecret('');
                    setVerificationCode('');
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white light:bg-gray-200 light:text-gray-700 light:hover:bg-gray-300 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Backup Codes */}
        {backupCodes.length > 0 && (
          <div className="mt-6 p-6 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <h4 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Important: Save Your Backup Codes
            </h4>
            <p className="text-sm text-gray-400 light:text-gray-600 mb-4">
              Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {backupCodes.map((code, index) => (
                <div key={index} className="bg-white/5 p-2 rounded font-mono text-sm text-white light:bg-white light:text-gray-900">
                  {code}
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const codesText = backupCodes.join('\n');
                navigator.clipboard.writeText(codesText);
                alert('Backup codes copied to clipboard!');
              }}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-semibold transition-all"
            >
              Copy Codes
            </button>
          </div>
        )}
      </div>

      {/* Password Change Section */}
      <div className="p-6 bg-white/5 rounded-xl light:bg-gray-50 border border-white/10 light:border-gray-200">
        <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-4">
          Change Password
        </h3>
        
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-2">
              Current Password *
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white light:bg-white light:border-gray-300 light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-2">
              New Password *
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white light:bg-white light:border-gray-300 light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters long
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-2">
              Confirm New Password *
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white light:bg-white light:border-gray-300 light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
          {success}
        </div>
      )}
    </div>
  );
}
