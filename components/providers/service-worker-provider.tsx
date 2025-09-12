'use client';

import { useEffect } from 'react';

export function ServiceWorkerProvider() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          console.log('🔄 Registering service worker...');
          
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          console.log('✅ Service worker registered successfully:', registration.scope);

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              console.log('🆕 New service worker installing...');
              
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 New service worker installed, reload to activate');
                  // Optionally show a notification to the user about the update
                }
              });
            }
          });

          // Handle controller change (new SW activated)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 Service worker controller changed - reloading page');
            window.location.reload();
          });

        } catch (error) {
          console.error('❌ Service worker registration failed:', error);
        }
      };

      // Register immediately if supported
      registerSW();

      // Also listen for when the page becomes visible again
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && navigator.serviceWorker.controller) {
          // Check for updates when page becomes visible
          navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
        }
      });

      // Add global debug function for iOS troubleshooting
      if (typeof window !== 'undefined') {
        (window as any).debugMangainajaCache = {
          async verifyImages(imageUrls: string[]) {
            if (!navigator.serviceWorker.controller) {
              console.error('No service worker controller available');
              return;
            }

            return new Promise((resolve) => {
              const channel = new MessageChannel();
              channel.port1.onmessage = (event) => {
                console.log('Image cache verification results:', event.data);
                resolve(event.data);
              };

              navigator.serviceWorker.controller!.postMessage(
                {
                  type: 'VERIFY_IMAGE_CACHE',
                  data: { imageUrls }
                },
                [channel.port2]
              );
            });
          },
          
          async getCacheInfo() {
            if (!navigator.serviceWorker.controller) {
              console.error('No service worker controller available');
              return;
            }

            return new Promise((resolve) => {
              const channel = new MessageChannel();
              channel.port1.onmessage = (event) => {
                console.log('Cache info:', event.data);
                resolve(event.data);
              };

              navigator.serviceWorker.controller!.postMessage(
                { type: 'GET_CACHE_INFO' },
                [channel.port2]
              );
            });
          }
        };

        console.log('🔧 Debug utilities available:');
        console.log('- window.debugMangainajaCache.verifyImages([...imageUrls])');
        console.log('- window.debugMangainajaCache.getCacheInfo()');
      }
    } else {
      console.warn('⚠️ Service workers not supported in this browser');
    }
  }, []);

  return null; // This component doesn't render anything
}