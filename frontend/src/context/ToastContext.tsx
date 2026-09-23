import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ToastContainer } from '../components/ToastContainer.js';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number; // in milliseconds (0 = manual dismiss only)
  createdAt: number;
}

export interface ToastOptions {
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, options?: ToastOptions | string) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  toast: {
    success: (message: string, options?: ToastOptions | string) => string;
    error: (message: string, options?: ToastOptions | string) => string;
    warning: (message: string, options?: ToastOptions | string) => string;
    info: (message: string, options?: ToastOptions | string) => string;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, options?: ToastOptions | string): string => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      const title = typeof options === 'string' ? options : options?.title;
      const duration =
        typeof options === 'object' && options?.duration !== undefined
          ? options.duration
          : type === 'error'
          ? 5000
          : 4000;

      const newToast: Toast = {
        id,
        type,
        title,
        message,
        duration,
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toast = useMemo(
    () => ({
      success: (message: string, options?: ToastOptions | string) =>
        showToast('success', message, options),
      error: (message: string, options?: ToastOptions | string) =>
        showToast('error', message, options),
      warning: (message: string, options?: ToastOptions | string) =>
        showToast('warning', message, options),
      info: (message: string, options?: ToastOptions | string) =>
        showToast('info', message, options),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, clearToasts, toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
