/**
 * Toast Context
 * Global state management for toast notifications
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { NotificationPriority } from '@/types/notification';

export interface Toast {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  duration?: number;
  link?: string;
  actionLabel?: string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration (default 5 seconds)
    const duration = toast.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// Helper hooks for common toast types
export function useToastNotifications() {
  const { addToast } = useToast();

  const showInfo = useCallback((title: string, message: string, options?: Partial<Toast>) => {
    addToast({ title, message, priority: 'info', ...options });
  }, [addToast]);

  const showSuccess = useCallback((title: string, message: string, options?: Partial<Toast>) => {
    addToast({ title, message, priority: 'success', ...options });
  }, [addToast]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<Toast>) => {
    addToast({ title, message, priority: 'warning', ...options });
  }, [addToast]);

  const showError = useCallback((title: string, message: string, options?: Partial<Toast>) => {
    addToast({ title, message, priority: 'error', ...options });
  }, [addToast]);

  return {
    showInfo,
    showSuccess,
    showWarning,
    showError,
  };
}
