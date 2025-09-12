import { useState, useEffect } from 'react';
import { OfflineStateManager, type OfflineContent } from '@/lib/offline-state-manager';
import { OfflineStorageManager, type CacheStats } from '@/lib/offline-storage-manager';
import { type CachedManga } from '@/lib/offline-db';

// Removed useOfflineStatus - use useOnlineStatus from @/hooks/use-online-status instead
// This hook was causing conflicts with the manual offline mode toggle

export function useOfflineContent() {
  const [offlineContent, setOfflineContent] = useState<OfflineContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offlineManager = OfflineStateManager.getInstance();

  const refreshOfflineContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const content = await offlineManager.getOfflineContent();
      setOfflineContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load offline content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshOfflineContent();
  }, []);

  return {
    offlineContent,
    loading,
    error,
    refresh: refreshOfflineContent,
  };
}

export function useOfflineCache() {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageManager = OfflineStorageManager.getInstance();

  const refreshCacheStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await storageManager.getCacheStats();
      setCacheStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cache stats');
    } finally {
      setLoading(false);
    }
  };

  const cacheChapter = async (mangaId: string, chapterId: string, mangaName?: string) => {
    try {
      const success = await storageManager.cacheChapter(mangaId, chapterId, mangaName);
      if (success) {
        await refreshCacheStats();
      }
      return success;
    } catch (err) {
      console.error('Failed to cache chapter:', err);
      return false;
    }
  };

  const removeCachedChapter = async (mangaId: string, chapterId: string) => {
    try {
      const success = await storageManager.removeCachedChapter(mangaId, chapterId);
      if (success) {
        await refreshCacheStats();
      }
      return success;
    } catch (err) {
      console.error('Failed to remove cached chapter:', err);
      return false;
    }
  };

  const clearAllCache = async () => {
    try {
      const success = await storageManager.clearAllCache();
      if (success) {
        await refreshCacheStats();
      }
      return success;
    } catch (err) {
      console.error('Failed to clear cache:', err);
      return false;
    }
  };

  const cleanupOldCache = async (maxSizeMB?: number) => {
    try {
      const deletedCount = await storageManager.cleanupOldCache(maxSizeMB);
      await refreshCacheStats();
      return deletedCount;
    } catch (err) {
      console.error('Failed to cleanup cache:', err);
      return 0;
    }
  };

  const isChapterCached = async (mangaId: string, chapterId: string) => {
    try {
      return await storageManager.isChapterCached(mangaId, chapterId);
    } catch (err) {
      console.error('Failed to check cache status:', err);
      return false;
    }
  };

  useEffect(() => {
    refreshCacheStats();
  }, []);

  return {
    cacheStats,
    loading,
    error,
    actions: {
      cacheChapter,
      removeCachedChapter,
      clearAllCache,
      cleanupOldCache,
      isChapterCached,
      refresh: refreshCacheStats,
    },
  };
}

export function useOfflineChapter(mangaId: string, chapterId: string) {
  const [isAvailableOffline, setIsAvailableOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  const storageManager = OfflineStorageManager.getInstance();

  const checkAvailability = async () => {
    try {
      setLoading(true);
      const available = await storageManager.isChapterCached(mangaId, chapterId);
      setIsAvailableOffline(available);
    } catch (error) {
      console.error('Failed to check offline availability:', error);
      setIsAvailableOffline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mangaId && chapterId) {
      checkAvailability();
    }
  }, [mangaId, chapterId]);

  return { 
    isAvailableOffline, 
    loading, 
    refresh: checkAvailability 
  };
}

export function useCachedManga(mangaId: string) {
  const [cachedManga, setCachedManga] = useState<CachedManga | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageManager = OfflineStorageManager.getInstance();

  const getCachedManga = async () => {
    try {
      setLoading(true);
      setError(null);
      const manga = await storageManager.getCachedManga(mangaId);
      setCachedManga(manga);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get cached manga');
      setCachedManga(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mangaId) {
      getCachedManga();
    }
  }, [mangaId]);

  return { 
    cachedManga, 
    loading, 
    error, 
    refresh: getCachedManga 
  };
}