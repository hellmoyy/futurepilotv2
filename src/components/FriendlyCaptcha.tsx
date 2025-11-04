'use client';

import { useEffect, useRef, useState } from 'react';
import { WidgetInstance } from 'friendly-challenge';

interface FriendlyCaptchaProps {
  sitekey: string;
  onComplete?: (solution: string) => void;
  onError?: (error: Error) => void;
  onExpire?: () => void;
  puzzleEndpoint?: string;
  className?: string;
  language?: string;
  startMode?: 'auto' | 'focus' | 'none';
}

export default function FriendlyCaptcha({
  sitekey,
  onComplete,
  onError,
  onExpire,
  puzzleEndpoint = '.well-known/friendly-captcha/puzzle',
  className = '',
  language = 'en',
  startMode = 'auto',
}: FriendlyCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<WidgetInstance | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || widgetRef.current) return;

    // Create widget instance
    const widget = new WidgetInstance(containerRef.current, {
      sitekey,
      puzzleEndpoint,
      language,
      startMode,
      doneCallback: (solution: string) => {
        setIsReady(true);
        onComplete?.(solution);
      },
      errorCallback: (error: Error) => {
        setIsReady(false);
        onError?.(error);
      },
      expiredCallback: () => {
        setIsReady(false);
        onExpire?.();
      },
    });

    widgetRef.current = widget;

    // Start the widget
    widget.start();

    // Cleanup
    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
        widgetRef.current = null;
      }
    };
  }, [sitekey, puzzleEndpoint, language, startMode, onComplete, onError, onExpire]);

  // Reset method (exposed via ref if needed)
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).reset = () => {
        widgetRef.current?.reset();
        setIsReady(false);
      };
    }
  }, []);

  return (
    <div className={`friendly-captcha-container ${className}`}>
      <div
        ref={containerRef}
        className="frc-captcha"
        data-sitekey={sitekey}
        data-puzzle-endpoint={puzzleEndpoint}
        data-lang={language}
        data-start={startMode}
      />
      {!isReady && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Please complete the security check above
        </p>
      )}
    </div>
  );
}

// Export hook for easy reset
export function useCaptchaReset() {
  const containerRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    if (containerRef.current) {
      const widget = (containerRef.current as any).reset;
      if (typeof widget === 'function') {
        widget();
      }
    }
  };

  return { containerRef, reset };
}
