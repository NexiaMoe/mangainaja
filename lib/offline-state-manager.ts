import { offlineDB } from './offline-db';
import { OfflineStorageManager } from './offline-storage-manager';

export interface OfflineContent {
  mangaId: string;
  mangaName: string;
  cachedChapters: Array<{
    chapterId: string;
    chapterName: string;
    cachedAt: Date;
    isFullyCached: boolean;
  }>;
  totalSize: number;
}

export class OfflineStateManager {
  private static instance: OfflineStateManager;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Array<(isOnline: boolean) => void> = [];
  private storageManager = OfflineStorageManager.getInstance();

  static getInstance(): OfflineStateManager {
    if (!OfflineStateManager.instance) {
      OfflineStateManager.instance = new OfflineStateManager();
    }
    return OfflineStateManager.instance;
  }

  constructor() {
    // Event listeners are now handled by use-online-status.ts to avoid conflicts
    // No longer setting up duplicate event listeners here
  }

  /**
   * Get current online status - now delegated to proper offline state management
   */
  getOnlineStatus(): boolean {
    // Check localStorage for forced offline mode (same logic as use-online-status.ts)
    if (typeof window !== 'undefined') {
      const forcedOffline = localStorage.getItem('mangainaja-forced-offline') === 'true';
      if (forcedOffline) {
        return false;
      }
      return navigator.onLine;
    }
    return true;
  }

  /**
   * Subscribe to online status changes
   */
  onStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Get all available offline content
   */
  async getOfflineContent(): Promise<OfflineContent[]> {
    try {
      const cachedChapters = await offlineDB.cachedChapters.toArray();
      
      // Group by manga
      const mangaGroups = new Map<string, typeof cachedChapters>();
      
      cachedChapters.forEach(chapter => {
        const existing = mangaGroups.get(chapter.mangaId) || [];
        existing.push(chapter);
        mangaGroups.set(chapter.mangaId, existing);
      });

      // Convert to OfflineContent format
      const offlineContent: OfflineContent[] = [];
      
      mangaGroups.forEach((chapters, mangaId) => {
        const totalSize = chapters.reduce((sum, ch) => sum + ch.totalSize, 0);
        const mangaName = chapters[0]?.mangaName || 'Unknown';
        
        offlineContent.push({
          mangaId,
          mangaName,
          cachedChapters: chapters.map(ch => ({
            chapterId: ch.chapterId,
            chapterName: ch.chapterName,
            cachedAt: ch.cachedAt,
            isFullyCached: ch.isFullyCached,
          })),
          totalSize,
        });
      });

      // Sort by total size (largest first)
      return offlineContent.sort((a, b) => b.totalSize - a.totalSize);
    } catch (error) {
      console.error('Failed to get offline content:', error);
      return [];
    }
  }

  /**
   * Check if specific content is available offline
   */
  async isContentAvailableOffline(mangaId: string, chapterId?: string): Promise<boolean> {
    try {
      if (chapterId) {
        // Check specific chapter
        return await this.storageManager.isChapterCached(mangaId, chapterId);
      } else {
        // Check if any chapters are cached for this manga
        const cachedChapters = await this.storageManager.getCachedChaptersForManga(mangaId);
        return cachedChapters.length > 0;
      }
    } catch (error) {
      console.error('Failed to check offline content availability:', error);
      return false;
    }
  }

  /**
   * Get offline content summary
   */
  async getOfflineSummary(): Promise<{
    totalManga: number;
    totalChapters: number;
    totalSizeMB: number;
    lastCacheUpdate: Date | null;
  }> {
    try {
      const offlineContent = await this.getOfflineContent();
      const cacheStats = await this.storageManager.getCacheStats();
      
      return {
        totalManga: offlineContent.length,
        totalChapters: cacheStats.totalChapters,
        totalSizeMB: cacheStats.totalSizeMB,
        lastCacheUpdate: cacheStats.newestCache,
      };
    } catch (error) {
      console.error('Failed to get offline summary:', error);
      return {
        totalManga: 0,
        totalChapters: 0,
        totalSizeMB: 0,
        lastCacheUpdate: null,
      };
    }
  }

  /**
   * Preload content for offline use (smart caching)
   */
  async preloadRecommendedContent(mangaId: string, currentChapterId: string): Promise<void> {
    try {
      // This is a placeholder for smart preloading logic
      // Could implement:
      // 1. Cache next few chapters automatically
      // 2. Cache based on reading patterns
      // 3. Cache popular content
      
      console.log(`Preloading recommended content for manga ${mangaId}, chapter ${currentChapterId}`);
      
      // For now, we'll implement a simple "next chapter" preload
      // This would need proper chapter ordering logic
    } catch (error) {
      console.error('Failed to preload content:', error);
    }
  }

  /**
   * Handle network connectivity changes - DISABLED to prevent conflicts
   * Event listeners are now managed by use-online-status.ts
   */
  private setupEventListeners(): void {
    // Disabled to prevent conflicts with use-online-status.ts
    // All online/offline state management is now handled there
  }

  private handleOnline(): void {
    // Disabled - event handling now managed by use-online-status.ts
  }

  private handleOffline(): void {
    // Disabled - event handling now managed by use-online-status.ts  
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { data } = event;
    
    switch (data?.type) {
      case 'CACHE_UPDATED':
        console.log('🗂️ Cache updated by service worker');
        break;
      case 'CACHE_ERROR':
        console.error('❌ Cache error:', data.error);
        break;
      default:
        break;
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.isOnline);
      } catch (error) {
        console.error('Error in offline status listener:', error);
      }
    });
  }
}