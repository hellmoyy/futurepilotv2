'use client';

import { useState, useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileCaptchaProps {
  sitekey: string;
  onSuccess?: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

export default function TurnstileCaptcha({
  sitekey,
  onSuccess,
  onError,
  onExpire,
  className = '',
  theme = 'auto',
  size = 'normal',
}: TurnstileCaptchaProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');

  // Auto-detect theme from document
  useEffect(() => {
    if (theme === 'auto') {
      const detectTheme = () => {
        const isDark = document.documentElement.classList.contains('dark') ||
                       document.body.classList.contains('dark');
        setCurrentTheme(isDark ? 'dark' : 'light');
      };

      // Initial detection
      detectTheme();

      // Watch for theme changes
      const observer = new MutationObserver(detectTheme);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
      });

      return () => observer.disconnect();
    } else {
      setCurrentTheme(theme);
    }
  }, [theme]);

  const handleSuccess = (token: string) => {
    setIsVerified(true);
    onSuccess?.(token);
  };

  const handleError = (error: string) => {
    setIsVerified(false);
    onError?.(error);
  };

  const handleExpire = () => {
    setIsVerified(false);
    onExpire?.();
  };

  return (
    <div className={`turnstile-captcha-wrapper ${className}`} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="turnstile-captcha-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Turnstile
          siteKey={sitekey}
          onSuccess={handleSuccess}
          onError={handleError}
          onExpire={handleExpire}
          options={{
            theme: currentTheme,
            size,
          }}
        />
      </div>
      {!isVerified && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2" style={{ textAlign: 'center', width: '100%' }}>
          Please complete the security verification
        </p>
      )}
    </div>
  );
}
