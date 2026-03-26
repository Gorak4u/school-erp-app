// Accessibility utilities for login page

export const setupKeyboardNavigation = () => {
  if (typeof document === 'undefined') return;

  // Handle Escape key to close modals or reset forms
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Focus back to email field
      const emailInput = document.getElementById('email') as HTMLInputElement;
      if (emailInput) {
        emailInput.focus();
      }
    }
  };

  // Handle Enter key in form fields
  const handleEnter = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      const form = e.target.closest('form');
      if (form && !e.defaultPrevented) {
        // Let the form handle the submit
        return;
      }
    }
  };

  document.addEventListener('keydown', handleEscape);
  document.addEventListener('keydown', handleEnter);

  return () => {
    document.removeEventListener('keydown', handleEscape);
    document.removeEventListener('keydown', handleEnter);
  };
};

export const announceToScreenReader = (message: string) => {
  if (typeof document === 'undefined') return;

  // Create or get live region for screen reader announcements
  let liveRegion = document.getElementById('sr-live-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'sr-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  liveRegion.textContent = message;
  
  // Clear the message after announcement
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = '';
    }
  }, 1000);
};

export const focusManagement = {
  // Trap focus within modal/dialog
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  // Return focus to previous element
  restoreFocus: (previousElement: HTMLElement | null) => {
    if (previousElement) {
      previousElement.focus();
    }
  }
};

export const getAriaDescribedBy = (errors: Record<string, string>, fieldName: string) => {
  return errors[fieldName] ? `${fieldName}-error` : undefined;
};

export const getAriaInvalid = (errors: Record<string, string>, fieldName: string) => {
  return !!errors[fieldName];
};
