const SW_VERSION = '2.3.11';
const BUILD_TIMESTAMP = new Date().toISOString();
const CACHE_NAME = 'mangainaja-v2';
const STATIC_CACHE = 'mangainaja-static-v2';
const DYNAMIC_CACHE = 'mangainaja-dynamic-v2';

// Essential files for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // Add pages that should work offline
  '/bookmarks',
  '/history', 
  '/settings',
  '/downloads',
  '/offline-library',
  // Note: Next.js static assets are handled by handleStaticAssetRequest
  // and are cached dynamically when requested
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(async (cache) => {
        console.log('Caching static assets');
        
        // Cache each asset individually to avoid failures
        for (const asset of STATIC_ASSETS) {
          try {
            await cache.add(asset);
            console.log('Cached:', asset);
          } catch (err) {
            console.error('Failed to cache:', asset, err);
            // Continue with other assets even if one fails
          }
        }
        
        // CRITICAL: Ensure we have the app shell and cache it aggressively
        try {
          const response = await fetch('/');
          if (response.ok) {
            const responseClone = response.clone();
            
            // Cache in static cache with multiple keys
            await cache.put('/', responseClone.clone());
            await cache.put('/index.html', responseClone.clone());
            
            // Also put in dynamic cache for better offline serving
            const dynamicCache = await caches.open(DYNAMIC_CACHE);
            await dynamicCache.put('/', responseClone.clone());
            await dynamicCache.put('/index.html', responseClone.clone());
            
            // Cache as fallback HTML for offline reader pages
            await dynamicCache.put('/offline-app-shell', responseClone);
            
            console.log('App shell cached in multiple locations for offline reader support');
          } else {
            console.error('Failed to fetch app shell, status:', response.status);
          }
        } catch (err) {
          console.error('Failed to cache app shell:', err);
          // Create a minimal fallback app shell
          try {
            const fallbackHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mangainaja - Loading...</title>
    <script>window.location.href = '/';</script>
</head>
<body>
    <div id="root">Loading...</div>
</body>
</html>`;
            const fallbackResponse = new Response(fallbackHTML, {
              status: 200,
              headers: { 'Content-Type': 'text/html' }
            });
            
            await cache.put('/offline-app-shell', fallbackResponse.clone());
            const dynamicCache = await caches.open(DYNAMIC_CACHE);
            await dynamicCache.put('/offline-app-shell', fallbackResponse);
            
            console.log('Created fallback app shell for offline support');
          } catch (fallbackErr) {
            console.error('Failed to create fallback app shell:', fallbackErr);
          }
        }
        
        return Promise.resolve();
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        self.skipWaiting();
      })
  );
});

// Activate event - clean old caches and take control
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== STATIC_CACHE && 
                   cacheName !== DYNAMIC_CACHE;
          })
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle offline requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except for manga images)
  if (url.origin !== location.origin && !isMangaImage(url.href)) {
    return;
  }

  // Handle different types of requests
  if (request.mode === 'navigate') {
    // Navigation requests (page loads)
    console.log('SW: Navigation request to:', url.pathname);
    event.respondWith(handleNavigationRequest(request));
  } else if (isMangaImage(url.href)) {
    // Manga images
    event.respondWith(handleImageRequest(request));
  } else if (isStaticAsset(url.pathname)) {
    // Static assets (JS, CSS, etc)
    event.respondWith(handleStaticAssetRequest(request));
  } else {
    // API requests - let them fail gracefully when offline
    return;
  }
});

// Handle navigation requests (page loads)
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      
      // Also cache as app shell if it's the home page
      const url = new URL(request.url);
      if (url.pathname === '/') {
        console.log('SW: Caching home page as app shell');
        await cache.put('/', response.clone());
      }
    }
    
    return response;
  } catch (error) {
    console.log('Navigation request failed, trying cache:', request.url);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's a specific page that should work offline, try to serve it
    const url = new URL(request.url);
    const offlinePages = ['/bookmarks', '/history', '/settings', '/downloads', '/offline-library'];
    
    // Check if it's a manga detail page pattern
    const isMangaDetail = url.pathname.startsWith('/manga/') && url.pathname.split('/').length === 3;
    // Check if it's a reading page pattern: /read/[mangaId]/[chapterId]
    const isReadingPage = url.pathname.startsWith('/read/') && url.pathname.split('/').length === 4;
    
    if (offlinePages.includes(url.pathname) || isMangaDetail || isReadingPage) {
      console.log('SW: Attempting to serve offline page:', url.pathname, 'isReadingPage:', isReadingPage);
      
      // Enhanced app shell search with multiple fallbacks
      const cacheKeys = ['/', '/index.html', '/offline-app-shell'];
      const allCaches = [DYNAMIC_CACHE, STATIC_CACHE];
      
      // First, try the most reliable sources
      for (const cacheName of allCaches) {
        for (const key of cacheKeys) {
          try {
            const cache = await caches.open(cacheName);
            const appShell = await cache.match(key);
            if (appShell) {
              console.log('SW: Found app shell in', cacheName, 'with key', key, 'for route:', url.pathname);
              return appShell;
            }
          } catch (error) {
            console.log('SW: Error accessing cache', cacheName, 'with key', key, ':', error);
          }
        }
      }
      
      // Try global cache match as fallback
      for (const key of cacheKeys) {
        try {
          const appShell = await caches.match(key);
          if (appShell) {
            console.log('SW: Found app shell in global cache with key', key, 'for route:', url.pathname);
            return appShell;
          }
        } catch (error) {
          console.log('SW: Error in global cache match with key', key, ':', error);
        }
      }
      
      console.log('SW: No app shell found in any cache for route:', url.pathname);
    }
    
    // For reader pages, always try to serve the app shell even if not found in specific caches
    if (isReadingPage) {
      console.log('SW: Reader page requested offline, attempting fallback');
      
      // Simple fallback - try to get any cached HTML response
      const allCacheNames = await caches.keys();
      for (const cacheName of allCacheNames) {
        try {
          const cache = await caches.open(cacheName);
          
          // Try common app shell patterns
          const shellPatterns = ['/', '/index.html', new URL('/', self.location.origin).href];
          for (const pattern of shellPatterns) {
            const response = await cache.match(pattern);
            if (response) {
              console.log('SW: Using cached HTML from', cacheName, 'pattern:', pattern, 'for reader route');
              return response; // Return the response directly
            }
          }
        } catch (error) {
          console.log('SW: Error checking cache', cacheName, ':', error);
        }
      }
      
      console.log('SW: No suitable app shell found for reader route');
    }
    
    // Fallback to offline page
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Last resort: return a basic HTML page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Offline</title>
        </head>
        <body>
          <div style="text-align: center; padding: 50px; font-family: system-ui;">
            <h1>Offline</h1>
            <p>This page is not available offline.</p>
            <p><a href="/">Go to Home</a></p>
          </div>
        </body>
      </html>
    `, { 
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Handle static asset requests (JS, CSS, fonts, etc)
async function handleStaticAssetRequest(request) {
  try {
    // Try cache first for static assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try network
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Static asset request failed:', request.url);
    // Let it fail - the app should handle missing assets gracefully
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Handle manga image requests
async function handleImageRequest(request) {
  try {
    // Try cache first - check all caches
    let cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('SW: Serving cached image:', request.url);
      return cachedResponse;
    }
    
    // Also try searching in all caches with different cache names
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log('SW: Serving cached image from', cacheName, ':', request.url);
        return cachedResponse;
      }
    }
    
    // Try network with no-cors mode for manga images
    console.log('SW: Attempting to fetch image from network:', request.url);
    const response = await fetch(request, {
      mode: 'no-cors',
      credentials: 'omit'
    });
    
    // Cache manga images for offline use
    // Note: no-cors responses are opaque, but we can still cache them
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
    console.log('SW: Cached image:', request.url);
    
    return response;
  } catch (error) {
    console.log('SW: Image request failed:', request.url, error);
    // Return a placeholder image or let it fail gracefully
    return new Response('Image not available offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Helper functions
function isMangaImage(url) {
  return url.includes('mbimg.org') || url.includes('mbrtz.org') || 
         url.includes('mbmyj.org') || url.includes('mbopg.org') || 
         url.includes('mbtba.org') || url.includes('mbqtj.org');
}

function isStaticAsset(pathname) {
  return pathname.startsWith('/_next/') || 
         pathname.endsWith('.js') || 
         pathname.endsWith('.css') || 
         pathname.endsWith('.png') || 
         pathname.endsWith('.jpg') || 
         pathname.endsWith('.svg') ||
         pathname.endsWith('.woff') ||
         pathname.endsWith('.woff2');
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CACHE_IMAGES':
      cacheImages(data.imageFiles);
      break;
    case 'CACHE_IMAGES_WITH_PROGRESS':
      cacheImages(data.imageFiles);
      break;
    case 'CACHE_MANGA_PAGE':
      cacheMangaPage(data.mangaId);
      break;
    case 'CACHE_READER_PAGE':
      cacheReaderPage(data.mangaId, data.chapterId);
      break;
    case 'GET_CACHE_INFO':
      getCacheInfo().then(info => {
        event.ports[0].postMessage(info);
      });
      break;
    case 'GET_VERSION':
      // Return service worker version info
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          version: SW_VERSION,
          buildTime: BUILD_TIMESTAMP,
          caches: {
            main: CACHE_NAME,
            static: STATIC_CACHE,
            dynamic: DYNAMIC_CACHE
          }
        });
      }
      break;
    case 'CHECK_UPDATE':
      // Force update check
      self.skipWaiting();
      break;
    case 'DEBUG_CACHE':
      // Debug cache contents
      debugCacheContents().then(info => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage(info);
        }
      });
      break;
    case 'VERIFY_IMAGE_CACHE':
      // Verify specific images are cached (useful for iOS debugging)
      verifyImageCache(data.imageUrls).then(results => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage(results);
        }
      });
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

// Cache multiple images with iOS-optimized batching
async function cacheImages(imageUrls) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    // Detect iOS/mobile for optimized batching
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Adaptive batch sizing based on platform
    const BATCH_SIZE = isIOS ? 2 : (isMobile ? 3 : 5); // More conservative on iOS
    const BATCH_DELAY = isIOS ? 200 : (isMobile ? 150 : 100); // Longer delays on iOS
    const ITEM_DELAY = isIOS ? 100 : 50; // Delay between items in batch
    
    console.log(`SW: Starting image caching for ${imageUrls.length} images in batches of ${BATCH_SIZE}`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < imageUrls.length; i += BATCH_SIZE) {
      const batch = imageUrls.slice(i, i + BATCH_SIZE);
      console.log(`SW: Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(imageUrls.length / BATCH_SIZE)} (${batch.length} images)`);
      
      const batchPromises = batch.map(async (url, index) => {
        try {
          // iOS optimization: Add small delay between requests in same batch
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, ITEM_DELAY));
          }
          
          // Use no-cors mode to bypass CORS restrictions
          const response = await fetch(url, {
            mode: 'no-cors',
            credentials: 'omit'
          });
          
          // Note: no-cors responses are opaque, so we can't check response.ok
          // But we can still cache them
          await cache.put(url, response);
          console.log('SW: Cached image:', url);
          return { success: true, url };
        } catch (error) {
          console.error('SW: Failed to cache image:', url, error);
          
          // Try alternative approach - cache without no-cors as fallback
          try {
            const fallbackResponse = await fetch(url);
            if (fallbackResponse.ok) {
              await cache.put(url, fallbackResponse);
              console.log('SW: Cached image (fallback):', url);
              return { success: true, url };
            }
          } catch (fallbackError) {
            console.error('SW: Fallback failed for:', url, fallbackError);
          }
          return { success: false, url, error };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Count successes and failures
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++;
        } else {
          failCount++;
        }
      });
      
      // iOS optimization: Small delay between batches
      if (i + BATCH_SIZE < imageUrls.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }
    
    console.log(`SW: Image caching completed. Success: ${successCount}, Failed: ${failCount}, Total: ${imageUrls.length}`);
  } catch (error) {
    console.error('SW: Failed to cache images:', error);
  }
}

// Get cache information
async function getCacheInfo() {
  try {
    const cacheNames = await caches.keys();
    const cacheInfo = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      cacheInfo[cacheName] = keys.length;
    }
    
    return cacheInfo;
  } catch (error) {
    console.error('Failed to get cache info:', error);
    return {};
  }
}

// Cache manga detail page
async function cacheMangaPage(mangaId) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const mangaUrl = `/manga/${mangaId}`;
    
    // Try to fetch and cache the manga page
    const response = await fetch(mangaUrl);
    if (response.ok) {
      await cache.put(mangaUrl, response);
      console.log(`Cached manga page: ${mangaUrl}`);
    }
  } catch (error) {
    console.error('Failed to cache manga page:', mangaId, error);
  }
}

// Cache reader page for offline access
async function cacheReaderPage(mangaId, chapterId) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const readerUrl = `/read/${mangaId}/${chapterId}`;
    
    // Try to fetch and cache the reader page HTML
    try {
      const response = await fetch(readerUrl);
      if (response.ok) {
        await cache.put(readerUrl, response);
        console.log(`SW: Cached reader page: ${readerUrl}`);
        return true;
      }
    } catch (fetchError) {
      console.log(`SW: Failed to fetch reader page ${readerUrl}, using app shell fallback`);
    }
    
    // If direct fetch fails, try to use the app shell as fallback for this specific reader route
    const appShellKeys = ['/', '/index.html', '/offline-app-shell'];
    for (const shellKey of appShellKeys) {
      try {
        const appShell = await cache.match(shellKey);
        if (appShell) {
          await cache.put(readerUrl, appShell.clone());
          console.log(`SW: Cached reader page ${readerUrl} using app shell ${shellKey}`);
          return true;
        }
      } catch (error) {
        console.log(`SW: Failed to use ${shellKey} as fallback for ${readerUrl}:`, error);
      }
    }
    
    return false;
  } catch (error) {
    console.error('Failed to cache reader page:', mangaId, chapterId, error);
    return false;
  }
}

// Verify image cache status (useful for iOS debugging)
async function verifyImageCache(imageUrls) {
  try {
    const results = {
      total: imageUrls.length,
      cached: 0,
      missing: 0,
      details: []
    };
    
    for (const url of imageUrls) {
      try {
        const cached = await caches.match(url);
        if (cached) {
          results.cached++;
          results.details.push({ url, status: 'cached' });
        } else {
          results.missing++;
          results.details.push({ url, status: 'missing' });
        }
      } catch (error) {
        results.missing++;
        results.details.push({ url, status: 'error', error: error.message });
      }
    }
    
    console.log('SW: Image cache verification:', results);
    return results;
  } catch (error) {
    console.error('SW: Error verifying image cache:', error);
    return { error: error.message };
  }
}

// Debug cache contents
async function debugCacheContents() {
  try {
    const cacheNames = await caches.keys();
    const debug = { caches: {} };
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      debug.caches[cacheName] = requests.map(req => ({
        url: req.url,
        method: req.method
      }));
    }
    
    console.log('Cache debug info:', debug);
    return debug;
  } catch (error) {
    console.error('Error debugging cache:', error);
    return { error: error.message };
  }
}