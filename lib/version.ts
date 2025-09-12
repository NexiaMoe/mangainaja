// Version information
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
export const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

// Service Worker version - update this when making SW changes
export const SW_VERSION = '2.1.0';

// Get service worker version from the actual service worker
export async function getServiceWorkerVersion(): Promise<{
  version: string;
  buildTime: string;
  caches: {
    main: string;
    static: string;
    dynamic: string;
  };
} | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  const controller = navigator.serviceWorker.controller;
  if (!controller) {
    return null;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };
    
    controller.postMessage(
      { type: 'GET_VERSION' },
      [messageChannel.port2]
    );
    
    // Timeout after 2 seconds
    setTimeout(() => resolve(null), 2000);
  });
}