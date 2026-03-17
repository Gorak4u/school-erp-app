// @ts-nocheck
'use client';

import { useCallback, useRef } from 'react';

/**
 * High-performance debounce hook
 * Optimized for search input with 10M+ records
 */

export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  
  // Update callback ref if callback changes
  callbackRef.current = callback;
  
  return useCallback((...args: Parameters<T>) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
}

/**
 * High-performance throttle hook
 * For performance-critical operations
 */
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastExecRef = useRef<number>(0);
  const callbackRef = useRef(callback);
  
  callbackRef.current = callback;
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastExecRef.current > delay) {
      // Execute immediately if enough time has passed
      lastExecRef.current = now;
      callbackRef.current(...args);
    } else {
      // Otherwise, schedule for later
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastExecRef.current = Date.now();
        callbackRef.current(...args);
      }, delay - (now - lastExecRef.current));
    }
  }, [delay]);
}

/**
 * Memory-efficient memoization hook
 */
export function useMemoCache<T extends (...args: any[]) => ReturnType<T>>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = useRef(new Map<string, ReturnType<T>>());
  const fnRef = useRef(fn);
  
  fnRef.current = fn;
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.current.has(key)) {
      return cache.current.get(key)!;
    }
    
    const result = fnRef.current(...args);
    
    // Limit cache size to prevent memory leaks
    if (cache.current.size >= 100) {
      const firstKey = cache.current.keys().next().value;
      cache.current.delete(firstKey);
    }
    
    cache.current.set(key, result);
    return result;
  }) as T;
}

export default useDebounce;
