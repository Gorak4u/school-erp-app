// Toast utility functions for consistent toast usage across the app
// This provides a centralized way to use toast notifications

export const showToast = async (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string, duration?: number) => {
  try {
    // Import dynamically to avoid SSR issues
    const { showSuccess, showError, showWarning, showInfo } = await import('@/components/Toast');
    
    switch (type) {
      case 'success':
        showSuccess(title, message);
        break;
      case 'error':
        showError(title, message);
        break;
      case 'warning':
        showWarning(title, message);
        break;
      case 'info':
        showInfo(title, message);
        break;
    }
  } catch (error) {
    console.error('Toast error:', error);
    // Fallback to window.toast if available
    if ((window as any).toast) {
      (window as any).toast({ type, title, message, duration });
    }
  }
};

// Convenience functions
export const showSuccessToast = (title: string, message?: string) => showToast('success', title, message);
export const showErrorToast = (title: string, message?: string) => showToast('error', title, message);
export const showWarningToast = (title: string, message?: string) => showToast('warning', title, message);
export const showInfoToast = (title: string, message?: string) => showToast('info', title, message);
