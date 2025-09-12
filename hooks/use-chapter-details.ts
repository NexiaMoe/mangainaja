import { useState, useEffect } from 'react';
import { getChapterDetails } from '@/lib/api';
import { OfflineStorageManager } from '@/lib/offline-storage-manager';
import { useOnlineStatus } from '@/hooks/use-online-status';
import type { ChapterNode } from '@/types/manga';

interface UseChapterDetailsResult {
  chapter: ChapterNode | null;
  loading: boolean;
  error: string | null;
}

export function useChapterDetails(chapterId: string, mangaId?: string): UseChapterDetailsResult {
  const [chapter, setChapter] = useState<ChapterNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    async function fetchChapterDetails() {
      try {
        setLoading(true);
        setError(null);

        if (isOnline) {
          // Online: fetch from API
          const chapterDetails = await getChapterDetails(chapterId);
          setChapter(chapterDetails);
        } else {
          // Offline: try to get from cache
          console.log('useChapterDetails: Offline mode - attempting to load cached chapter details for:', mangaId, chapterId);
          
          if (mangaId) {
            const storageManager = OfflineStorageManager.getInstance();
            console.log('useChapterDetails: Getting cached chapter...');
            const cachedChapter = await storageManager.getCachedChapter(mangaId, chapterId);
            console.log('useChapterDetails: Cached chapter result:', cachedChapter);
            
            if (cachedChapter) {
              // Convert cached chapter to ChapterNode format
              const datePublic = typeof cachedChapter.metadata.datePublic === 'string' 
                ? parseInt(cachedChapter.metadata.datePublic) 
                : cachedChapter.metadata.datePublic;
              const chapterNode: ChapterNode = {
                id: chapterId,
                data: {
                  dname: cachedChapter.metadata.dname,
                  title: cachedChapter.metadata.title || '',
                  volNum: cachedChapter.metadata.volNum,
                  chaNum: cachedChapter.metadata.chaNum,
                  count_images: cachedChapter.metadata.count_images,
                  imageFiles: cachedChapter.metadata.imageFiles,
                  dateCreate: datePublic || Date.now(),
                  datePublic: datePublic,
                  urlPath: cachedChapter.metadata.urlPath,
                }
              };
              
              console.log('useChapterDetails: Successfully loaded cached chapter, clearing errors');
              setChapter(chapterNode);
              setError(null); // Clear any previous errors
            } else {
              console.log('useChapterDetails: No cached chapter found for:', mangaId, chapterId);
              setError('Chapter not available offline');
            }
          } else {
            setError('Cannot load chapter offline without manga ID');
          }
        }
      } catch (err) {
        console.error('Failed to fetch chapter details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch chapter details');
      } finally {
        setLoading(false);
      }
    }

    if (chapterId) {
      fetchChapterDetails();
    }
  }, [chapterId, mangaId, isOnline]);

  return { chapter, loading, error };
}