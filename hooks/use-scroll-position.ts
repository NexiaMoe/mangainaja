'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ScrollPositionOptions {
  key?: string;
  enabled?: boolean;
}

export function useScrollPosition(options: ScrollPositionOptions = {}) {
  const { key = 'default', enabled = true } = options;
  const scrollPositionRef = useRef<number>(0);
  const elementRef = useRef<HTMLElement>(null);
  const router = useRouter();

  // Save scroll position before navigation
  const saveScrollPosition = useCallback(() => {
    if (!enabled) return;
    
    const scrollElement = elementRef.current || window;
    const scrollY = scrollElement === window
      ? window.scrollY
      : (scrollElement as HTMLElement).scrollTop;
    
    scrollPositionRef.current = scrollY;
    sessionStorage.setItem(`scroll-position-${key}`, scrollY.toString());
  }, [key, enabled]);

  // Restore scroll position after navigation
  const restoreScrollPosition = useCallback(() => {
    if (!enabled) return;
    
    const savedPosition = sessionStorage.getItem(`scroll-position-${key}`);
    if (savedPosition) {
      const position = parseInt(savedPosition, 10);
      scrollPositionRef.current = position;
      
      // Use requestAnimationFrame to ensure the DOM is fully rendered
      requestAnimationFrame(() => {
        const scrollElement = elementRef.current || window;
        if (scrollElement === window) {
          window.scrollTo(0, position);
        } else {
          (scrollElement as HTMLElement).scrollTop = position;
        }
      });
    }
  }, [key, enabled]);

  // Set up event listeners for navigation
  useEffect(() => {
    if (!enabled) return;

    // Save scroll position when user navigates away
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    // Save scroll position when route changes
    const handleRouteChangeStart = () => {
      saveScrollPosition();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Next.js doesn't expose router events directly in the app directory,
    // so we'll use the popstate event as a fallback
    window.addEventListener('popstate', handleRouteChangeStart);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handleRouteChangeStart);
    };
  }, [saveScrollPosition, enabled]);

  return {
    elementRef,
    saveScrollPosition,
    restoreScrollPosition,
  };
}