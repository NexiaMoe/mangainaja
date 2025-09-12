'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';

export function useHomeScrollPosition() {
  const scrollPositionRef = useRef<number>(0);
  const isRestoredRef = useRef<boolean>(false);
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  // Save scroll position before navigation
  const saveScrollPosition = useCallback(() => {
    if (pathname === '/') {
      scrollPositionRef.current = window.scrollY;
      sessionStorage.setItem('home-page-scroll-position', scrollPositionRef.current.toString());
    }
  }, [pathname]);

  // Restore scroll position after navigation
  const restoreScrollPosition = useCallback(() => {
    if (isRestoredRef.current || pathname !== '/') return;
    
    const savedPosition = sessionStorage.getItem('home-page-scroll-position');
    if (savedPosition) {
      const position = parseInt(savedPosition, 10);
      if (position > 0) {
        scrollPositionRef.current = position;
        
        // Use multiple requestAnimationFrame to ensure the DOM is fully rendered
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo(0, position);
              isRestoredRef.current = true;
            });
          });
        });
      }
    }
  }, [pathname]);

  // Set up event listeners and handle mount
  useEffect(() => {
    setIsMounted(true);
    
    // Save scroll position when user navigates away
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    // Intercept link clicks to save scroll position
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !link.href.includes('#')) {
        saveScrollPosition();
      }
    };

    // Handle browser back/forward
    const handlePopState = () => {
      if (pathname === '/') {
        restoreScrollPosition();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleLinkClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleLinkClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [saveScrollPosition, restoreScrollPosition, pathname]);

  // Restore scroll position when component mounts or pathname changes
  useEffect(() => {
    if (isMounted && pathname === '/') {
      isRestoredRef.current = false;
      restoreScrollPosition();
    }
  }, [isMounted, pathname, restoreScrollPosition]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
  };
}