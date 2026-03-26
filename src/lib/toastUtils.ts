// Advanced Toast utility functions for consistent toast usage across the app
// This provides a centralized way to use enhanced toast notifications

export const showToast = async (
  type: 'success' | 'error' | 'warning' | 'info' | 'loading', 
  title: string, 
  message?: string, 
  duration?: number,
  options?: {
    persistent?: boolean;
    action?: {
      label: string;
      onClick: () => void;
      icon?: React.ReactNode;
    };
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  }
) => {
  try {
    // Import dynamically to avoid SSR issues
    const { showSuccess, showError, showWarning, showInfo, showLoading } = await import('@/components/Toast');
    
    const toastOptions = {
      ...options,
      duration: duration || (type === 'loading' ? 0 : 5000)
    };
    
    switch (type) {
      case 'success':
        return showSuccess(title, message, toastOptions.duration);
      case 'error':
        return showError(title, message, toastOptions.duration);
      case 'warning':
        return showWarning(title, message, toastOptions.duration);
      case 'info':
        return showInfo(title, message, toastOptions.duration);
      case 'loading':
        return showLoading(title, message);
      default:
        return showInfo(title, message, toastOptions.duration);
    }
  } catch (error) {
    console.error('Toast error:', error);
    // Fallback to window.toast if available
    if ((window as any).toast) {
      (window as any).toast({ type, title, message, duration, ...options });
    }
  }
};

// Convenience functions with enhanced options
export const showSuccessToast = (title: string, message?: string, duration?: number) => 
  showToast('success', title, message, duration);

export const showErrorToast = (title: string, message?: string, duration?: number) => 
  showToast('error', title, message, duration);

export const showWarningToast = (title: string, message?: string, duration?: number) => 
  showToast('warning', title, message, duration);

export const showInfoToast = (title: string, message?: string, duration?: number) => 
  showToast('info', title, message, duration);

export const showLoadingToast = (title: string, message?: string) => 
  showToast('loading', title, message, 0);

// Advanced toast functions
export const showActionToast = async (
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  message?: string,
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  },
  persistent: boolean = false
) => {
  return await showToast(type, title, message, undefined, { action, persistent });
};

export const showPersistentToast = async (
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  message?: string,
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  }
) => {
  return await showToast(type, title, message, undefined, { action, persistent: true });
};

// Toast management functions
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

export const updateToastProgress = (id: string, progress: number) => {
  if ((window as any).updateToast) {
    (window as any).updateToast(id, { progress });
  }
};

// Specialized toast functions for common use cases
export const showSuccessWithAction = async (
  title: string,
  message: string,
  actionLabel: string,
  actionCallback: () => void
) => {
  return await showActionToast('success', title, message, {
    label: actionLabel,
    onClick: actionCallback
  });
};

export const showErrorWithRetry = async (
  title: string,
  message: string,
  retryCallback: () => void
) => {
  return await showActionToast('error', title, message, {
    label: 'Retry',
    onClick: retryCallback
  }, true);
};

export const showInfoWithDownload = async (
  title: string,
  message: string,
  downloadCallback: () => void
) => {
  return await showActionToast('info', title, message, {
    label: 'Download',
    onClick: downloadCallback
  });
};

// Progress toast for long-running operations
export const showProgressToast = async (title: string, message: string) => {
  const toastId = await showLoadingToast(title, message);
  
  const updateProgress = (progress: number) => {
    if (toastId) {
      updateToastProgress(toastId, progress);
    }
  };
  
  const complete = async (successTitle: string, successMessage?: string) => {
    if (toastId) {
      dismissToast(toastId);
    }
    await showSuccessToast(successTitle, successMessage);
  };
  
  const fail = async (errorTitle: string, errorMessage?: string) => {
    if (toastId) {
      dismissToast(toastId);
    }
    await showErrorToast(errorTitle, errorMessage);
  };
  
  return {
    id: toastId,
    updateProgress,
    complete,
    fail
  };
};
