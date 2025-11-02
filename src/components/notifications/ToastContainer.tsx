/**
 * Toast Component
 * Displays toast notifications with animations and theme support
 */

'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import type { Toast } from '@/contexts/ToastContext';
import Link from 'next/link';

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 300); // Match animation duration
  };

  // Priority-based styling
  const priorityStyles = {
    info: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/10 light:bg-blue-50',
      border: 'border-blue-500/50 dark:border-blue-500/50 light:border-blue-300',
      text: 'text-blue-400 dark:text-blue-400 light:text-blue-700',
      icon: '💡',
    },
    success: {
      bg: 'bg-green-500/10 dark:bg-green-500/10 light:bg-green-50',
      border: 'border-green-500/50 dark:border-green-500/50 light:border-green-300',
      text: 'text-green-400 dark:text-green-400 light:text-green-700',
      icon: '✅',
    },
    warning: {
      bg: 'bg-yellow-500/10 dark:bg-yellow-500/10 light:bg-yellow-50',
      border: 'border-yellow-500/50 dark:border-yellow-500/50 light:border-yellow-300',
      text: 'text-yellow-400 dark:text-yellow-400 light:text-yellow-700',
      icon: '⚠️',
    },
    error: {
      bg: 'bg-red-500/10 dark:bg-red-500/10 light:bg-red-50',
      border: 'border-red-500/50 dark:border-red-500/50 light:border-red-300',
      text: 'text-red-400 dark:text-red-400 light:text-red-700',
      icon: '🚨',
    },
  };

  const style = priorityStyles[toast.priority];

  return (
    <div
      className={`
        ${style.bg} ${style.border} border rounded-lg shadow-lg p-4 mb-3 min-w-[320px] max-w-md
        transition-all duration-300 ease-in-out backdrop-blur-sm
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-2xl flex-shrink-0 mt-0.5">
          {style.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-semibold ${style.text} text-sm`}>
              {toast.title}
            </h4>
            {/* Close button */}
            <button
              onClick={handleClose}
              className={`${style.text} hover:opacity-70 transition-opacity flex-shrink-0`}
              aria-label="Close notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-xs leading-relaxed">
            {toast.message}
          </p>

          {/* Action link */}
          {toast.link && toast.actionLabel && (
            <Link
              href={toast.link}
              onClick={handleClose}
              className={`inline-flex items-center gap-1 mt-2 ${style.text} hover:underline text-xs font-medium`}
            >
              {toast.actionLabel}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <div className="flex flex-col items-end pointer-events-auto">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
}
