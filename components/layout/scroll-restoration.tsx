'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

interface ScrollRestorationProps {
  children: React.ReactNode;
}

export function ScrollRestoration({ children }: ScrollRestorationProps) {
  const pathname = usePathname();
  const scrollPositionsRef = useRef<Map<string, number>>(new Map());
  const [isRestored, setIsRestored] = useState(false);

  // Save scroll position before navigation
  const saveScrollPosition = () => {
    const scrollY = window.scrollY;
    scrollPositionsRef.current.set(pathname, scrollY);
    sessionStorage.setItem(`scroll-position-${pathname}`, scrollY.toString());
  };

  // Restore scroll position after navigation
  const restoreScrollPosition = () => {
    const savedPosition = sessionStorage.getItem(`scroll-position-${pathname}`);
    if (savedPosition) {
      const position = parseInt(savedPosition, 10);
      
      // Use multiple requestAnimationFrame to ensure the DOM is fully rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo(0, position);
            setIsRestored(true);
          });
        });
      });
    } else {
      setIsRestored(true);
    }
  };

  useEffect(() => {
    // Save scroll position when user navigates away
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    // Save scroll position when route changes
    const handleRouteChange = () => {
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

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handleRouteChange);
    document.addEventListener('click', handleLinkClick, true);

    // Restore scroll position when component mounts
    restoreScrollPosition();

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handleRouteChange);
      document.removeEventListener('click', handleLinkClick, true);
      
      // Save scroll position when component unmounts
      saveScrollPosition();
    };
  }, [pathname]);

  // Restore scroll position when pathname changes
  useEffect(() => {
    setIsRestored(false);
    restoreScrollPosition();
  }, [pathname]);

  return <>{children}</>;
}