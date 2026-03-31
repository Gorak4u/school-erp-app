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
  // Preload critical fonts and images only when needed
  // Note: Only preload resources that are used immediately on page load
  // to avoid browser warnings about unused preloads
  if (typeof window !== 'undefined') {
    // Add any critical preloads here that are used within first few seconds
    // Example: Preload critical fonts
    // const fontLink = document.createElement('link');
    // fontLink.rel = 'preload';
    // fontLink.as = 'font';
    // fontLink.href = '/fonts/critical-font.woff2';
    // fontLink.type = 'font/woff2';
    // fontLink.crossOrigin = 'anonymous';
    // document.head.appendChild(fontLink);
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
