// Performance optimization utilities for login page

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    func(...args);
  };
};

export const preloadCriticalResources = () => {
  // Preload critical fonts and images
  if (typeof window !== 'undefined') {
    // Preload any critical images or fonts here
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = '/logo.svg';
    document.head.appendChild(link);
  }
};

export const optimizeAnimationPerformance = () => {
  // Reduce motion for users who prefer it
  if (typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    return prefersReducedMotion.matches;
  }
  return false;
};

export const lazyLoadBackground = () => {
  // Lazy load heavy background animations
  if (typeof window !== 'undefined') {
    let timeoutId: NodeJS.Timeout;
    const loadBackground = () => {
      // Load background components after initial render
      timeoutId = setTimeout(() => {
        // Trigger background animation loading
        document.body.classList.add('background-loaded');
      }, 100);
    };
    
    // Load background after page load
    if (document.readyState === 'complete') {
      loadBackground();
    } else {
      window.addEventListener('load', loadBackground);
    }
    
    return () => clearTimeout(timeoutId);
  }
  return () => {};
};
