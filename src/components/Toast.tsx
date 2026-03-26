'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X, 
  AlertTriangle, 
  Sparkles,
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  progress?: number;
  persistent?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

interface ToastProps {
  theme: 'dark' | 'light';
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export default function Toast({ 
  theme, 
  maxToasts = 5,
  position = 'top-right'
}: ToastProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id, position: toast.position || position };
    
    setToasts(prev => {
      const updated = [...prev, newToast];
      // Limit number of toasts
      if (updated.length > maxToasts) {
        return updated.slice(-maxToasts);
      }
      return updated;
    });
    
    // Auto remove after duration (unless persistent)
    if (!toast.persistent && toast.type !== 'loading') {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
    
    return id;
  }, [maxToasts, position]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<ToastMessage>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Expose toast functions globally
  useEffect(() => {
    (window as any).toast = addToast;
    (window as any).removeToast = removeToast;
    (window as any).updateToast = updateToast;
    (window as any).clearAllToasts = clearAll;
    
    return () => {
      delete (window as any).toast;
      delete (window as any).removeToast;
      delete (window as any).updateToast;
      delete (window as any).clearAllToasts;
    };
  }, [addToast, removeToast, updateToast, clearAll]);

  const getIcon = useCallback((type: ToastMessage['type']) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'info':
        return <Info className={`${iconClass} text-blue-500`} />;
      case 'loading':
        return <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={`${iconClass} text-blue-500`}
        >
          <RefreshCw />
        </motion.div>;
      default:
        return <Sparkles className={`${iconClass} text-purple-500`} />;
    }
  }, []);

  const getTheme = useCallback((type: ToastMessage['type']) => {
    const isDark = theme === 'dark';
    
    const themes = {
      success: {
        bg: isDark ? 'bg-gradient-to-r from-green-900/95 to-emerald-900/95' : 'bg-gradient-to-r from-green-50 to-emerald-50',
        border: isDark ? 'border-green-700/50' : 'border-green-200/50',
        icon: 'text-green-500',
        title: isDark ? 'text-green-100' : 'text-green-900',
        message: isDark ? 'text-green-200/80' : 'text-green-700/80',
        action: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
        shadow: 'shadow-green-500/20',
        glow: isDark ? 'shadow-green-500/10' : 'shadow-green-500/5'
      },
      error: {
        bg: isDark ? 'bg-gradient-to-r from-red-900/95 to-rose-900/95' : 'bg-gradient-to-r from-red-50 to-rose-50',
        border: isDark ? 'border-red-700/50' : 'border-red-200/50',
        icon: 'text-red-500',
        title: isDark ? 'text-red-100' : 'text-red-900',
        message: isDark ? 'text-red-200/80' : 'text-red-700/80',
        action: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700',
        shadow: 'shadow-red-500/20',
        glow: isDark ? 'shadow-red-500/10' : 'shadow-red-500/5'
      },
      warning: {
        bg: isDark ? 'bg-gradient-to-r from-yellow-900/95 to-amber-900/95' : 'bg-gradient-to-r from-yellow-50 to-amber-50',
        border: isDark ? 'border-yellow-700/50' : 'border-yellow-200/50',
        icon: 'text-yellow-500',
        title: isDark ? 'text-yellow-100' : 'text-yellow-900',
        message: isDark ? 'text-yellow-200/80' : 'text-yellow-700/80',
        action: 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700',
        shadow: 'shadow-yellow-500/20',
        glow: isDark ? 'shadow-yellow-500/10' : 'shadow-yellow-500/5'
      },
      info: {
        bg: isDark ? 'bg-gradient-to-r from-blue-900/95 to-indigo-900/95' : 'bg-gradient-to-r from-blue-50 to-indigo-50',
        border: isDark ? 'border-blue-700/50' : 'border-blue-200/50',
        icon: 'text-blue-500',
        title: isDark ? 'text-blue-100' : 'text-blue-900',
        message: isDark ? 'text-blue-200/80' : 'text-blue-700/80',
        action: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
        shadow: 'shadow-blue-500/20',
        glow: isDark ? 'shadow-blue-500/10' : 'shadow-blue-500/5'
      },
      loading: {
        bg: isDark ? 'bg-gradient-to-r from-blue-900/95 to-purple-900/95' : 'bg-gradient-to-r from-blue-50 to-purple-50',
        border: isDark ? 'border-blue-700/50' : 'border-blue-200/50',
        icon: 'text-blue-500',
        title: isDark ? 'text-blue-100' : 'text-blue-900',
        message: isDark ? 'text-blue-200/80' : 'text-blue-700/80',
        action: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
        shadow: 'shadow-blue-500/20',
        glow: isDark ? 'shadow-blue-500/10' : 'shadow-blue-500/5'
      }
    };
    
    return themes[type] || themes.info;
  }, [theme]);

  const getPositionClasses = useCallback(() => {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
    };
    return positions[position] || positions['top-right'];
  }, [position]);

  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }), []);

  const toastVariants = useMemo(() => ({
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      y: position.includes('top') ? -50 : 50,
      x: position.includes('right') ? 100 : position.includes('left') ? -100 : 0
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: position.includes('top') ? -50 : 50,
      x: position.includes('right') ? 100 : position.includes('left') ? -100 : 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut" as const
      }
    }
  }), [position]);

  return (
    <div className={`fixed ${getPositionClasses()} z-[99999] space-y-3 pointer-events-none`}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const styles = getTheme(toast.type);
          
          return (
            <motion.div
              key={toast.id}
              variants={toastVariants}
              layout
              className={`
                pointer-events-auto max-w-md w-full rounded-2xl border backdrop-blur-xl
                ${styles.bg} ${styles.border} ${styles.shadow} ${styles.glow}
                shadow-2xl overflow-hidden
              `}
            >
              {/* Progress Bar for non-persistent toasts */}
              {!toast.persistent && toast.type !== 'loading' && (
                <motion.div
                  className="absolute top-0 left-0 h-1 bg-gradient-to-r from-white/20 to-white/40"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: toast.duration || 5000, ease: "linear" }}
                />
              )}
              
              {/* Loading Progress Bar */}
              {toast.type === 'loading' && toast.progress !== undefined && (
                <motion.div
                  className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400"
                  initial={{ width: "0%" }}
                  animate={{ width: `${toast.progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              )}
              
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Animated Icon Container */}
                  <motion.div
                    animate={{
                      scale: toast.type === 'success' ? [1, 1.2, 1] : 1,
                      rotate: toast.type === 'loading' ? 360 : 0,
                    }}
                    transition={{
                      duration: toast.type === 'success' ? 0.6 : 1,
                      repeat: toast.type === 'loading' ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                    className={`flex-shrink-0 p-1 rounded-full ${theme === 'dark' ? 'bg-black/20' : 'bg-white/20'}`}
                  >
                    {getIcon(toast.type)}
                  </motion.div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <motion.h4
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`font-semibold text-sm ${styles.title}`}
                    >
                      {toast.title}
                    </motion.h4>
                    
                    {toast.message && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`mt-1 text-sm ${styles.message} leading-relaxed`}
                      >
                        {toast.message}
                      </motion.p>
                    )}
                    
                    {/* Action Button */}
                    {toast.action && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          toast.action!.onClick();
                          removeToast(toast.id);
                        }}
                        className={`mt-3 px-4 py-2 text-sm font-medium rounded-xl text-white transition-all ${styles.action} shadow-lg flex items-center gap-2`}
                      >
                        {toast.action.icon}
                        {toast.action.label}
                      </motion.button>
                    )}
                  </div>
                  
                  {/* Close Button */}
                  <motion.button
                    initial={{ opacity: 0, rotate: -180 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeToast(toast.id)}
                    className={`flex-shrink-0 p-2 rounded-xl transition-all ${
                      theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10'
                    }`}
                  >
                    <X className="w-4 h-4 opacity-60 hover:opacity-100" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      {/* Clear All Button */}
      {toasts.length > 1 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearAll}
          className={`pointer-events-auto px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-xl ${
            theme === 'dark'
              ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 border border-gray-700/50' 
              : 'bg-white/80 text-gray-700 hover:bg-gray-100/80 border border-gray-200/50'
          } shadow-lg`}
        >
          <div className="flex items-center gap-2">
            <Trash2 className="w-3 h-3" />
            Clear All ({toasts.length})
          </div>
        </motion.button>
      )}
    </div>
  );
}

// Enhanced helper functions for easy toast usage
export const showToast = (type: ToastMessage['type'], title: string, message?: string, duration?: number): string => {
  if ((window as any).toast) {
    return (window as any).toast({ type, title, message, duration });
  }
  return '';
};

export const showSuccess = (title: string, message?: string, duration?: number): string => 
  showToast('success', title, message, duration);
export const showError = (title: string, message?: string, duration?: number): string => 
  showToast('error', title, message, duration);
export const showWarning = (title: string, message?: string, duration?: number): string => 
  showToast('warning', title, message, duration);
export const showInfo = (title: string, message?: string, duration?: number): string => 
  showToast('info', title, message, duration);
export const showLoading = (title: string, message?: string): string => 
  showToast('loading', title, message, 0);

// Advanced toast functions
export const showActionToast = (
  type: ToastMessage['type'], 
  title: string, 
  message?: string, 
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  },
  persistent: boolean = false
) => {
  if ((window as any).toast) {
    (window as any).toast({ type, title, message, action, persistent });
  }
};

export const updateToastProgress = (id: string, progress: number) => {
  if ((window as any).updateToast) {
    (window as any).updateToast(id, { progress });
  }
};

export const dismissToast = (id: string) => {
  if ((window as any).removeToast) {
    (window as any).removeToast(id);
  }
};

export const dismissAllToasts = () => {
  if ((window as any).clearAllToasts) {
    (window as any).clearAllToasts();
  }
};
