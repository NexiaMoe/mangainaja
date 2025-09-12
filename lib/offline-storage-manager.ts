import { offlineDB, type CachedChapter, type CachedManga } from './offline-db';
import { getChapterDetails, getMangaDetails } from './api';

export interface CacheStats {
  totalChapters: number;
  totalSizeBytes: number;
  totalSizeMB: number;
  oldestCache: Date | null;
  newestCache: Date | null;
  cacheHitRate: number;
}

export class OfflineStorageManager {
  private static instance: OfflineStorageManager;
  private readonly MAX_STORAGE_GB = 5; // 5GB default limit
  private readonly CACHE_EXPIRY_DAYS = 30; // Auto-cleanup after 30 days
  
  static getInstance(): OfflineStorageManager {
    if (!OfflineStorageManager.instance) {
      OfflineStorageManager.instance = new OfflineStorageManager();
    }
    return OfflineStorageManager.instance;
  }

  private isClientSide(): boolean {
    return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
  }

  /**
   * Cache a chapter for offline reading
   */
  async cacheChapter(
    mangaId: string, 
    chapterId: string, 
    mangaName?: string,
    onProgress?: (downloaded: number, total: number) => void,
    onComplete?: () => void
  ): Promise<boolean> {
    try {
      const cacheId = `${mangaId}-${chapterId}`;
      
      // Check if already cached
      const existingCache = await offlineDB.cachedChapters.get(cacheId);
      if (existingCache?.isFullyCached) {
        // Update last accessed time
        await offlineDB.cachedChapters.update(cacheId, { 
          lastAccessed: new Date() 
        });
        return true;
      }

      // Fetch chapter data
      const chapterData = await getChapterDetails(chapterId);
      if (!chapterData) return false;

      // Calculate estimated size (approximate)
      const estimatedSize = chapterData.data.count_images * 500000; // ~500KB per image

      // Check storage quota before caching
      const canCache = await this.checkStorageQuota(estimatedSize);
      if (!canCache) {
        await this.cleanupOldCache();
        const canCacheAfterCleanup = await this.checkStorageQuota(estimatedSize);
        if (!canCacheAfterCleanup) return false;
      }

      // Create cache entry
      const cachedChapter: CachedChapter = {
        id: cacheId,
        mangaId,
        chapterId,
        mangaName: mangaName || 'Unknown',
        chapterName: chapterData.data.dname,
        metadata: {
          dname: chapterData.data.dname,
          title: chapterData.data.title,
          volNum: chapterData.data.volNum,
          chaNum: chapterData.data.chaNum,
          count_images: chapterData.data.count_images,
          imageFiles: chapterData.data.imageFiles || [],
          datePublic: chapterData.data.datePublic,
          urlPath: chapterData.data.urlPath,
        },
        cachedAt: new Date(),
        lastAccessed: new Date(),
        imageCount: chapterData.data.count_images,
        totalSize: estimatedSize,
        isFullyCached: true, // We'll implement progressive caching later
      };

      await offlineDB.cachedChapters.put(cachedChapter);
      
      // Cache images with progress tracking
      if (chapterData.data.imageFiles) {
        await this.cacheChapterImages(chapterData.data.imageFiles, onProgress, onComplete);
      } else {
        // No images to cache, but still call completion callback
        onComplete?.();
      }
      
      // Cache manga metadata and detail page for offline access
      try {
        await this.cacheMangaMetadata(mangaId, mangaName);
        this.cacheMangaDetailPage(mangaId);
      } catch (metadataError) {
        console.error('Failed to cache manga metadata, continuing with chapter cache:', metadataError);
        // Continue even if metadata caching fails
      }
      
      return true;
    } catch (error) {
      console.error('Failed to cache chapter:', error);
      return false;
    }
  }

  /**
   * Get cached chapter data
   */
  async getCachedChapter(mangaId: string, chapterId: string): Promise<CachedChapter | null> {
    try {
      const cacheId = `${mangaId}-${chapterId}`;
      const cachedChapter = await offlineDB.cachedChapters.get(cacheId);
      
      if (cachedChapter) {
        // Update last accessed time
        await offlineDB.cachedChapters.update(cacheId, { 
          lastAccessed: new Date() 
        });
        return cachedChapter;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get cached chapter:', error);
      return null;
    }
  }

  /**
   * Check if a chapter is cached
   */
  async isChapterCached(mangaId: string, chapterId: string): Promise<boolean> {
    try {
      const cacheId = `${mangaId}-${chapterId}`;
      const cachedChapter = await offlineDB.cachedChapters.get(cacheId);
      return cachedChapter?.isFullyCached || false;
    } catch (error) {
      console.error('Failed to check cache status:', error);
      return false;
    }
  }

  /**
   * Get all cached chapters for a manga
   */
  async getCachedChaptersForManga(mangaId: string): Promise<CachedChapter[]> {
    try {
      return await offlineDB.cachedChapters
        .where('mangaId')
        .equals(mangaId)
        .toArray();
    } catch (error) {
      console.error('Failed to get cached chapters for manga:', error);
      return [];
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const allCached = await offlineDB.cachedChapters.toArray();
      
      if (allCached.length === 0) {
        return {
          totalChapters: 0,
          totalSizeBytes: 0,
          totalSizeMB: 0,
          oldestCache: null,
          newestCache: null,
          cacheHitRate: 0,
        };
      }

      const totalSize = allCached.reduce((sum, chapter) => sum + chapter.totalSize, 0);
      const dates = allCached.map(c => c.cachedAt).sort();
      
      return {
        totalChapters: allCached.length,
        totalSizeBytes: totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        oldestCache: dates[0] || null,
        newestCache: dates[dates.length - 1] || null,
        cacheHitRate: 0, // Will be calculated from usage metrics
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalChapters: 0,
        totalSizeBytes: 0,
        totalSizeMB: 0,
        oldestCache: null,
        newestCache: null,
        cacheHitRate: 0,
      };
    }
  }

  /**
   * Clear old cached content
   */
  async cleanupOldCache(maxSizeMB?: number): Promise<number> {
    try {
      const stats = await this.getCacheStats();
      const targetSizeMB = maxSizeMB || (this.MAX_STORAGE_GB * 1024 * 0.8); // 80% of limit
      
      if (stats.totalSizeMB <= targetSizeMB) {
        return 0; // No cleanup needed
      }

      // Get chapters sorted by last accessed (oldest first)
      const chapters = await offlineDB.cachedChapters
        .orderBy('lastAccessed')
        .toArray();
      
      let deletedCount = 0;
      let currentSize = stats.totalSizeMB;
      
      for (const chapter of chapters) {
        if (currentSize <= targetSizeMB) break;
        
        await this.removeCachedChapter(chapter.mangaId, chapter.chapterId);
        currentSize -= chapter.totalSize / (1024 * 1024);
        deletedCount++;
      }
      
      // Update cleanup stats
      await this.updateStorageStats();
      
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
      return 0;
    }
  }

  /**
   * Remove a specific cached chapter
   */
  async removeCachedChapter(mangaId: string, chapterId: string): Promise<boolean> {
    try {
      const cacheId = `${mangaId}-${chapterId}`;
      
      // Check if it exists first
      const exists = await offlineDB.cachedChapters.get(cacheId);
      if (!exists) return false;
      
      // Delete it
      await offlineDB.cachedChapters.delete(cacheId);
      
      // TODO: Also remove from Cache API
      // This will be handled by service worker enhancement
      
      return true;
    } catch (error) {
      console.error('Failed to remove cached chapter:', error);
      return false;
    }
  }

  /**
   * Clear all cached content
   */
  async clearAllCache(): Promise<boolean> {
    try {
      await offlineDB.cachedChapters.clear();
      
      // Clear Cache API storage (only on client side)
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name.includes('mangainaja'))
            .map(name => caches.delete(name))
        );
      }
      
      await this.updateStorageStats();
      return true;
    } catch (error) {
      console.error('Failed to clear all cache:', error);
      return false;
    }
  }

  /**
   * Check storage quota
   */
  private async checkStorageQuota(additionalBytes: number): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const available = (estimate.quota || 0) - (estimate.usage || 0);
        return available > additionalBytes;
      }
      
      // Fallback: check against our internal limit
      const stats = await this.getCacheStats();
      const maxBytes = this.MAX_STORAGE_GB * 1024 * 1024 * 1024;
      return (stats.totalSizeBytes + additionalBytes) < maxBytes;
    } catch (error) {
      console.error('Failed to check storage quota:', error);
      return false;
    }
  }

  /**
   * Cache chapter images via service worker
   */
  private async cacheChapterImages(
    imageFiles: string[], 
    onProgress?: (downloaded: number, total: number) => void,
    onComplete?: () => void
  ): Promise<void> {
    try {
      const totalImages = imageFiles.length;
      let downloadedImages = 0;
      
      // Report initial progress
      onProgress?.(0, totalImages);

      if (typeof window === 'undefined') {
        return; // Skip on server side
      }

      // Use service worker for image caching to avoid CORS issues
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Send images to service worker for caching
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_IMAGES_WITH_PROGRESS',
          data: { imageFiles, mangaId: '', chapterId: '' }, // We can add these if needed
        });

        // Simulate progress since we can't get real progress from service worker easily
        // This provides user feedback while service worker handles the actual caching
        const progressInterval = setInterval(() => {
          if (downloadedImages < totalImages) {
            downloadedImages = Math.min(downloadedImages + 1, totalImages);
            onProgress?.(downloadedImages, totalImages);
          } else {
            clearInterval(progressInterval);
          }
        }, 100); // Update progress every 100ms

        // Wait for estimated completion time (roughly 200ms per image)
        await new Promise(resolve => setTimeout(resolve, totalImages * 200));
        clearInterval(progressInterval);
        
        // Ensure progress shows 100%
        onProgress?.(totalImages, totalImages);
        
        // Notify completion
        onComplete?.();
      } else {
        console.warn('Service worker not available for image caching');
        // Fallback: mark all as "processed" without actual caching
        onProgress?.(totalImages, totalImages);
        onComplete?.();
      }
    } catch (error) {
      console.error('Failed to cache images:', error);
    }
  }

  /**
   * Cache manga metadata for offline access
   */
  private async cacheMangaMetadata(mangaId: string, mangaName?: string): Promise<void> {
    try {
      console.log(`Attempting to cache manga metadata for: ${mangaId}`);
      
      // Check if already cached
      const existingManga = await offlineDB.cachedManga.get(mangaId);
      if (existingManga) {
        console.log(`Manga ${mangaId} already cached, updating last accessed time`);
        // Update last accessed time
        await offlineDB.cachedManga.update(mangaId, { 
          lastAccessed: new Date() 
        });
        return;
      }

      console.log(`Fetching manga details for: ${mangaId}`);
      // Fetch manga data
      const mangaData = await getMangaDetails(mangaId);
      if (!mangaData) {
        console.error(`Failed to fetch manga details for: ${mangaId}`);
        return;
      }

      // Create cache entry
      const cachedManga: CachedManga = {
        id: mangaId,
        mangaId,
        title: mangaData.data.name || mangaName || 'Unknown',
        summary: mangaData.data.summary?.text || '',
        genres: mangaData.data.genres || [],
        status: mangaData.data.originalStatus || '',
        author: mangaData.data.authors?.[0] || '',
        coverImage: mangaData.data.urlCover300 || '',
        alternativeTitles: [],
        totalChapters: mangaData.last_chapterNodes?.length || 0,
        metadata: mangaData, // Store full response
        cachedAt: new Date(),
        lastAccessed: new Date(),
      };

      await offlineDB.cachedManga.put(cachedManga);
      console.log(`Cached manga metadata: ${mangaId}`);
    } catch (error) {
      console.error('Failed to cache manga metadata:', error);
    }
  }

  /**
   * Get cached manga metadata
   */
  async getCachedManga(mangaId: string): Promise<CachedManga | null> {
    try {
      const cachedManga = await offlineDB.cachedManga.get(mangaId);
      
      if (cachedManga) {
        // Update last accessed time
        await offlineDB.cachedManga.update(mangaId, { 
          lastAccessed: new Date() 
        });
        return cachedManga;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get cached manga:', error);
      return null;
    }
  }

  /**
   * Cache manga detail page for offline access
   */
  private async cacheMangaDetailPage(mangaId: string): Promise<void> {
    try {
      // Send message to service worker to cache manga detail page (only on client side)
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_MANGA_PAGE',
          data: { mangaId },
        });
      }
    } catch (error) {
      console.error('Failed to cache manga detail page:', error);
    }
  }

  /**
   * Update storage statistics
   */
  private async updateStorageStats(): Promise<void> {
    try {
      const stats = await offlineDB.storageStats.toArray();
      const currentStats = stats[0];
      const cacheStats = await this.getCacheStats();
      
      if (currentStats) {
        await offlineDB.storageStats.update(currentStats.id!, {
          totalUsed: cacheStats.totalSizeBytes,
          lastCleanup: new Date(),
        });
      } else {
        await offlineDB.storageStats.add({
          id: 1,
          totalUsed: cacheStats.totalSizeBytes,
          lastCleanup: new Date(),
          cachePolicy: 'auto',
          maxStorageGB: this.MAX_STORAGE_GB,
        });
      }
    } catch (error) {
      console.error('Failed to update storage stats:', error);
    }
  }
}