import { useCallback } from 'react';
import { useOnlineStatus } from './use-online-status';

const OFFLINE_KEY = 'mangainaja-forced-offline';
const BROWSER_OFFLINE_KEY = 'mangainaja-browser-offline';

export function useOfflineToggle() {
  const isOnline = useOnlineStatus();
  
  const toggleOfflineMode = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const currentlyForcedOffline = localStorage.getItem(OFFLINE_KEY) === 'true';
    
    if (currentlyForcedOffline) {
      // Turn back online (remove user-forced offline)
      console.log('Manual toggle: Removing forced offline');
      localStorage.removeItem(OFFLINE_KEY);
      
      // If browser is also online, clear browser offline state
      if (navigator.onLine) {
        localStorage.removeItem(BROWSER_OFFLINE_KEY);
      }
      
      // Force a reload to ensure all components pick up the change
      window.location.reload();
    } else {
      // Turn offline (user-forced)
      console.log('Manual toggle: Setting forced offline');
      localStorage.setItem(OFFLINE_KEY, 'true');
      // Force a reload to ensure all components pick up the change
      window.location.reload();
    }
  }, []);
  
  const setOfflineMode = useCallback((offline: boolean) => {
    if (typeof window === 'undefined') return;
    
    if (offline) {
      console.log('Setting forced offline mode: true');
      localStorage.setItem(OFFLINE_KEY, 'true');
    } else {
      console.log('Setting forced offline mode: false');
      localStorage.removeItem(OFFLINE_KEY);
      
      // If browser is also online, clear browser offline state
      if (navigator.onLine) {
        localStorage.removeItem(BROWSER_OFFLINE_KEY);
      }
    }
    // Force a reload to ensure all components pick up the change
    window.location.reload();
  }, []);
  
  return {
    isOnline,
    isOffline: !isOnline,
    toggleOfflineMode,
    setOfflineMode
  };
}