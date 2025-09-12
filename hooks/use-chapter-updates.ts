import { useEffect, useCallback } from 'react';
import { getMangaDetails } from '@/lib/api';
import { useReadingHistoryStore } from '@/stores/reading-history-store';
import { useNotificationStore } from '@/stores/notification-store';
import { useOnlineStatus } from '@/hooks/use-online-status';
import type { ChapterNode } from '@/types/manga';

interface UseChapterUpdatesOptions {
  enabled?: boolean;
  checkInterval?: number; // in milliseconds
}

export function useChapterUpdates(options: UseChapterUpdatesOptions = {}) {
  const { enabled = true, checkInterval = 300000 } = options; // Default: 5 minutes
  const { getBookmarks } = useReadingHistoryStore();
  const { addNotification } = useNotificationStore();
  const isOnline = useOnlineStatus();

  const checkForUpdates = useCallback(async () => {
    // Skip update checking when offline
    if (!isOnline) {
      console.log('Offline detected, skipping chapter update checks');
      return;
    }

    try {
      const bookmarks = getBookmarks();
      console.log('Checking for chapter updates for', bookmarks.length, 'bookmarks');
      
      for (const bookmark of bookmarks) {
        try {
          const mangaDetails = await getMangaDetails(bookmark.mangaId);
          
          if (mangaDetails.last_chapterNodes && mangaDetails.last_chapterNodes.length > 0) {
            const latestChapter = mangaDetails.last_chapterNodes[0];
            
            // Check if this chapter is newer than the bookmark time
            if (latestChapter.data.datePublic > bookmark.bookmarkedAt) {
              addNotification({
                mangaId: bookmark.mangaId,
                mangaName: bookmark.mangaName,
                mangaSlug: bookmark.mangaSlug,
                coverUrl: bookmark.coverUrl,
                chapterId: latestChapter.id,
                chapterName: latestChapter.data.dname,
                chapterNumber: latestChapter.data.chaNum,
                volumeNumber: latestChapter.data.volNum,
              });
            }
          }
        } catch (error) {
          console.error(`Failed to check updates for manga ${bookmark.mangaId}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to check for chapter updates:', error);
    }
  }, [getBookmarks, addNotification, isOnline]);

  useEffect(() => {
    if (!enabled || !isOnline) return;

    // Initial check (only when online)
    checkForUpdates();

    // Set up interval for periodic checks
    const interval = setInterval(checkForUpdates, checkInterval);

    return () => clearInterval(interval);
  }, [enabled, checkInterval, checkForUpdates, isOnline]);

  return { checkForUpdates };
}