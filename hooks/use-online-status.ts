import { useState, useEffect, useRef } from 'react';

const OFFLINE_KEY = 'mangainaja-forced-offline';
const BROWSER_OFFLINE_KEY = 'mangainaja-browser-offline';

// Global state to ensure consistency across all hook instances
let globalOnlineState: boolean | null = null;
let globalStateListeners: Set<(state: boolean) => void> = new Set();

// Function to update global state and notify all listeners
function updateGlobalOnlineState(newState: boolean) {
  // Skip during SSR/build
  if (typeof window === 'undefined') return;
  
  if (globalOnlineState !== newState) {
    globalOnlineState = newState;
    console.log('Global online state updated:', newState);
    globalStateListeners.forEach(listener => listener(newState));
  }
}

// Initialize global state
function initializeGlobalState(): boolean {
  // During SSR/build, always return true (online)
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || typeof localStorage === 'undefined') {
    return true;
  }
  
  // Check all offline indicators
  const navigatorOnline = navigator.onLine;
  const userForcedOffline = localStorage.getItem(OFFLINE_KEY) === 'true';
  const browserOffline = localStorage.getItem(BROWSER_OFFLINE_KEY) === 'true';
  
  console.log('Initializing with navigator.onLine:', navigatorOnline, 'userForced:', userForcedOffline, 'browserOffline:', browserOffline);
  
  // Determine initial state based on both user preference and browser state
  let initialState: boolean;
  
  // Priority order:
  // 1. If browser was marked offline (stored state), stay offline
  // 2. If browser is currently offline (navigator.onLine = false), we're offline
  // 3. If user forced offline, we're offline
  // 4. Otherwise, we're online
  
  if (browserOffline) {
    // Browser was previously marked offline - respect this state
    // This handles cases where DevTools offline doesn't update navigator.onLine
    initialState = false;
    console.log('Initialized: Browser was marked offline (stored state)');
    
    // If navigator also says offline, ensure it's marked
    if (!navigatorOnline) {
      localStorage.setItem(BROWSER_OFFLINE_KEY, 'true');
    }
  } else if (!navigatorOnline) {
    // Browser is currently offline
    initialState = false;
    localStorage.setItem(BROWSER_OFFLINE_KEY, 'true');
    console.log('Initialized: Browser is offline (navigator.onLine = false)');
  } else if (userForcedOffline) {
    // User manually forced offline even though browser is online
    initialState = false;
    console.log('Initialized: User forced offline (browser is online)');
  } else {
    // Everything is online
    initialState = true;
    console.log('Initialized: Online');
  }
  
  // Always update global state to match current conditions
  // This ensures consistency across page navigations
  if (globalOnlineState !== initialState) {
    console.log('Global state mismatch, updating from', globalOnlineState, 'to', initialState);
    globalOnlineState = initialState;
  } else if (globalOnlineState === null) {
    globalOnlineState = initialState;
  }
  console.log('Initialized global online state:', globalOnlineState);
  
  return globalOnlineState;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    // During SSR, always return true to prevent hydration mismatch
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || typeof localStorage === 'undefined') {
      return true;
    }
    
    // Only initialize on client side
    const initialState = initializeGlobalState();
    
    // Double-check: if navigator says offline but we initialized as online, fix it
    if (!navigator.onLine && initialState === true) {
      console.warn('CRITICAL: State mismatch detected! navigator.onLine is false but initialized as true. Forcing offline.');
      localStorage.setItem(BROWSER_OFFLINE_KEY, 'true');
      updateGlobalOnlineState(false);
      return false;
    }
    return initialState;
  });
  
  const lastOfflineTimeRef = useRef<number>(0);
  const stabilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // On first hydration, sync with actual offline state
    const correctState = initializeGlobalState();
    if (correctState !== isOnline) {
      console.log('Hydration: Correcting state from', isOnline, 'to', correctState);
      setIsOnline(correctState);
    }

    // Subscribe to global state changes
    const handleGlobalStateChange = (newState: boolean) => {
      setIsOnline(newState);
    };
    globalStateListeners.add(handleGlobalStateChange);

    const handleOnline = () => {
      console.log('Network event: Online detected');
      
      // Clear any pending timeout
      if (stabilityTimeoutRef.current) {
        clearTimeout(stabilityTimeoutRef.current);
        stabilityTimeoutRef.current = null;
      }
      
      // Only clear browser offline state if we're truly online
      // DevTools network throttling may not trigger proper events
      if (navigator.onLine) {
        localStorage.removeItem(BROWSER_OFFLINE_KEY);
        globalOnlineState = null; // Reset to allow proper re-initialization
      }
      
      // Check if user manually forced offline mode
      const userForcedOffline = localStorage.getItem(OFFLINE_KEY) === 'true';
      
      if (userForcedOffline) {
        console.log('User has manually forced offline mode, staying offline');
        updateGlobalOnlineState(false);
      } else if (navigator.onLine) {
        console.log('Browser is back online, going online');
        updateGlobalOnlineState(true);
      } else {
        console.log('Online event but navigator.onLine is false, staying offline');
        updateGlobalOnlineState(false);
      }
    };

    const handleOffline = () => {
      console.log('Network event: Offline detected');
      lastOfflineTimeRef.current = Date.now();
      
      // Mark browser as offline (separate from user-forced offline)
      localStorage.setItem(BROWSER_OFFLINE_KEY, 'true');
      
      // Also ensure the global state is updated
      globalOnlineState = false;
      
      // Clear any pending timeout
      if (stabilityTimeoutRef.current) {
        clearTimeout(stabilityTimeoutRef.current);
        stabilityTimeoutRef.current = null;
      }
      
      updateGlobalOnlineState(false);
    };

    // Listen for storage changes (when user manually toggles offline mode)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === OFFLINE_KEY) {
        const forcedOffline = e.newValue === 'true';
        console.log('Forced offline mode changed:', forcedOffline);
        if (forcedOffline) {
          updateGlobalOnlineState(false);
        } else if (navigator.onLine) {
          updateGlobalOnlineState(true);
        }
      }
    };

    // Ensure global state is synchronized
    const userForcedOffline = localStorage.getItem(OFFLINE_KEY) === 'true';
    const browserOffline = localStorage.getItem(BROWSER_OFFLINE_KEY) === 'true';
    
    // Only add global event listeners once
    if (globalStateListeners.size === 1) { // First hook instance
      console.log('Setting up global event listeners');
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('storage', handleStorageChange);
    }
    
    // State correction logic - check actual browser state
    const actuallyOnline = navigator.onLine;
    
    if (userForcedOffline) {
      // User manually forced offline - always stay offline
      if (globalOnlineState !== false) {
        console.log('Correcting state: user forced offline');
        updateGlobalOnlineState(false);
      }
    } else if (!actuallyOnline) {
      // Browser is currently offline - must be offline
      console.log('Browser is offline (navigator.onLine = false), ensuring offline state');
      localStorage.setItem(BROWSER_OFFLINE_KEY, 'true');
      if (globalOnlineState !== false) {
        console.log('Correcting state to offline');
        updateGlobalOnlineState(false);
      }
    } else if (actuallyOnline && !userForcedOffline) {
      // Browser is online and no user-forced offline
      localStorage.removeItem(BROWSER_OFFLINE_KEY);
      if (globalOnlineState !== true) {
        console.log('Correcting state: browser online, no forced offline');
        updateGlobalOnlineState(true);
      }
    }

    return () => {
      // Unsubscribe from global state changes
      globalStateListeners.delete(handleGlobalStateChange);
      
      // Only remove global event listeners when no more hooks are active
      if (globalStateListeners.size === 0) {
        console.log('Removing global event listeners');
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('storage', handleStorageChange);
      }
      
      if (stabilityTimeoutRef.current) {
        clearTimeout(stabilityTimeoutRef.current);
        stabilityTimeoutRef.current = null;
      }
    };
  }, []);

  // Add debug helper functions
  if (typeof window !== 'undefined') {
    (window as any).__clearOfflineMode = () => {
      localStorage.removeItem(OFFLINE_KEY);
      lastOfflineTimeRef.current = 0; // Reset the offline timer
      updateGlobalOnlineState(true);
      console.log('Manually cleared offline mode and reset timer');
    };
    
    (window as any).__forceOfflineMode = () => {
      localStorage.setItem(OFFLINE_KEY, 'true');
      lastOfflineTimeRef.current = Date.now();
      updateGlobalOnlineState(false);
      console.log('Manually forced offline mode');
    };
    
    (window as any).__getOnlineStatus = () => {
      const forcedOffline = localStorage.getItem(OFFLINE_KEY) === 'true';
      console.log('Current state:', {
        globalOnlineState,
        isOnline,
        navigatorOnline: navigator.onLine,
        forcedOffline,
        timeSinceOffline: Date.now() - lastOfflineTimeRef.current,
        lastOfflineTime: lastOfflineTimeRef.current
      });
      return { globalOnlineState, isOnline, navigatorOnline: navigator.onLine, forcedOffline };
    };
  }

  return isOnline;
}