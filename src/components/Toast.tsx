'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  theme: 'dark' | 'light';
}

export default function Toast({ theme }: ToastProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Expose addToast function globally
  useEffect(() => {
    (window as any).toast = addToast;
    return () => {
      delete (window as any).toast;
    };
  }, []);

  const getIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = (type: ToastMessage['type']) => {
    const isDark = theme === 'dark';
    
    switch (type) {
      case 'success':
        return {
          bg: isDark ? 'bg-green-900/90' : 'bg-green-50',
          border: isDark ? 'border-green-700' : 'border-green-200',
          icon: 'text-green-500',
          title: isDark ? 'text-green-100' : 'text-green-900',
          message: isDark ? 'text-green-200' : 'text-green-700',
          action: isDark ? 'bg-green-700 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'
        };
      case 'error':
        return {
          bg: isDark ? 'bg-red-900/90' : 'bg-red-50',
          border: isDark ? 'border-red-700' : 'border-red-200',
          icon: 'text-red-500',
          title: isDark ? 'text-red-100' : 'text-red-900',
          message: isDark ? 'text-red-200' : 'text-red-700',
          action: isDark ? 'bg-red-700 hover:bg-red-600' : 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          bg: isDark ? 'bg-yellow-900/90' : 'bg-yellow-50',
          border: isDark ? 'border-yellow-700' : 'border-yellow-200',
          icon: 'text-yellow-500',
          title: isDark ? 'text-yellow-100' : 'text-yellow-900',
          message: isDark ? 'text-yellow-200' : 'text-yellow-700',
          action: isDark ? 'bg-yellow-700 hover:bg-yellow-600' : 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'info':
        return {
          bg: isDark ? 'bg-blue-900/90' : 'bg-blue-50',
          border: isDark ? 'border-blue-700' : 'border-blue-200',
          icon: 'text-blue-500',
          title: isDark ? 'text-blue-100' : 'text-blue-900',
          message: isDark ? 'text-blue-200' : 'text-blue-700',
          action: isDark ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const styles = getStyles(toast.type);
          
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              className={`
                pointer-events-auto max-w-md w-full rounded-lg border shadow-lg backdrop-blur-sm
                ${styles.bg} ${styles.border}
              `}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className={styles.icon}>
                    {getIcon(toast.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${styles.title}`}>
                      {toast.title}
                    </p>
                    {toast.message && (
                      <p className={`mt-1 text-sm ${styles.message}`}>
                        {toast.message}
                      </p>
                    )}
                    
                    {toast.action && (
                      <button
                        onClick={() => {
                          toast.action!.onClick();
                          removeToast(toast.id);
                        }}
                        className={`mt-3 px-3 py-1 text-sm rounded-md text-white transition-colors ${styles.action}`}
                      >
                        {toast.action.label}
                      </button>
                    )}
                  </div>
                  
                  <button
                    onClick={() => removeToast(toast.id)}
                    className={`flex-shrink-0 p-1 rounded-md transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                    }`}
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Helper functions for easy toast usage
export const showToast = (type: ToastMessage['type'], title: string, message?: string, duration?: number) => {
  if ((window as any).toast) {
    (window as any).toast({ type, title, message, duration });
  }
};

export const showSuccess = (title: string, message?: string) => showToast('success', title, message);
export const showError = (title: string, message?: string) => showToast('error', title, message);
export const showWarning = (title: string, message?: string) => showToast('warning', title, message);
export const showInfo = (title: string, message?: string) => showToast('info', title, message);
