'use client';

import { useEffect, useRef } from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';

const BROWSER_OFFLINE_KEY = 'mangainaja-browser-offline';

export function OfflineStateProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();
  const lastNetworkCheckRef = useRef<number>(0);

  useEffect(() => {
    // Function to check for network state changes (especially DevTools)
    const checkNetworkState = async () => {
      try {
        // Try a minimal fetch to detect if we're truly offline
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        
        await fetch('/manifest.json', { 
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        
        // If successful, we're online
        const browserWasOffline = localStorage.getItem(BROWSER_OFFLINE_KEY) === 'true';
        if (browserWasOffline) {
          console.log('OfflineStateProvider: Network check succeeded, clearing offline state');
          localStorage.removeItem(BROWSER_OFFLINE_KEY);
          window.dispatchEvent(new Event('online'));
        }
      } catch (err) {
        // If failed, we're offline
        console.log('OfflineStateProvider: Network check failed, marking as offline');
        localStorage.setItem(BROWSER_OFFLINE_KEY, 'true');
        window.dispatchEvent(new Event('offline'));
      }
    };

    // Initial check
    checkNetworkState();

    // Periodically check network state to catch DevTools changes
    const interval = setInterval(() => {
      // Only check if we haven't checked recently
      const now = Date.now();
      if (now - lastNetworkCheckRef.current > 2000) {
        lastNetworkCheckRef.current = now;
        checkNetworkState();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}