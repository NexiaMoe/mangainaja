import { useState, useEffect } from 'react';
import { getMangaDetails, getChapterList } from '@/lib/api';
import { OfflineStorageManager } from '@/lib/offline-storage-manager';
import { useOnlineStatus } from '@/hooks/use-online-status';
import type { MangaNode, ChapterNode } from '@/types/manga';

interface UseMangaDetailsResult {
  manga: MangaNode | null;
  chapters: ChapterNode[];
  loading: boolean;
  error: string | null;
}

export function useMangaDetails(mangaId: string): UseMangaDetailsResult {
  const [manga, setManga] = useState<MangaNode | null>(null);
  const [chapters, setChapters] = useState<ChapterNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  // Helper function to load data from cache
  const loadFromCache = async (cachedChapters: any[]) => {
    if (!cachedChapters.length) return false;

    // First try to get cached manga metadata
    const storageManager = OfflineStorageManager.getInstance();
    const cachedMangaData = await storageManager.getCachedManga(mangaId);
    
    let basicManga: MangaNode;
    
    if (cachedMangaData && cachedMangaData.metadata) {
      // Use cached manga metadata if available
      basicManga = cachedMangaData.metadata;
      console.log('Using cached manga metadata for:', mangaId);
    } else {
      // Fallback: Create a basic manga object from cached chapter data
      const firstChapter = cachedChapters[0];
      const datePublic = typeof firstChapter.metadata.datePublic === 'string' 
        ? parseInt(firstChapter.metadata.datePublic) 
        : firstChapter.metadata.datePublic;
      
      console.log('Creating basic manga data from chapter cache for:', mangaId);
      basicManga = {
        id: mangaId,
        data: {
          name: firstChapter.mangaName || firstChapter.metadata.dname || 'Cached Manga',
          slug: mangaId,
          authors: ['Unknown'],
          artists: ['Unknown'],
          genres: [],
          summary: {
            text: 'Offline cached manga'
          },
          urlCover300: '',
          dateCreate: datePublic || Date.now(),
          datePublic: datePublic || Date.now(),
          dateModify: datePublic || Date.now(),
          origLang: 'en',
          tranLang: 'en',
          readDirection: 'ltr',
          uploadStatus: 'completed',
          originalStatus: 'completed'
        },
        last_chapterNodes: []
      };
    }
    
    // Convert cached chapters to ChapterNode format
    const chapterNodes: ChapterNode[] = cachedChapters.map(cached => {
      const datePublic = typeof cached.metadata.datePublic === 'string' 
        ? parseInt(cached.metadata.datePublic) 
        : cached.metadata.datePublic;
      return {
        id: cached.chapterId,
        data: {
          dname: cached.metadata.dname,
          title: cached.metadata.title || '',
          volNum: cached.metadata.volNum,
          chaNum: cached.metadata.chaNum,
          count_images: cached.metadata.count_images,
          imageFiles: cached.metadata.imageFiles,
          dateCreate: datePublic || Date.now(),
          datePublic: datePublic,
          urlPath: cached.metadata.urlPath,
        }
      };
    });
    
    // Sort chapters by chapter number (descending for latest first)
    const sortedChapters = chapterNodes.sort((a, b) => b.data.chaNum - a.data.chaNum);
    
    setManga(basicManga);
    setChapters(sortedChapters);
    setError(null);
    console.log(`Loaded from cache: ${cachedChapters.length} cached chapters for manga ${mangaId}`);
    return true;
  };

  useEffect(() => {
    let cancelled = false;
    
    async function fetchMangaDetails() {      
      try {
        // If we already have data and there's no error, don't re-fetch
        if (manga && chapters.length > 0 && !error) {
          console.log('useMangaDetails: Already have valid data, skipping fetch');
          return;
        }

        setLoading(true);
        setError(null);

        // Always check for cached data first
        console.log('Checking for cached data for manga:', mangaId);
        const storageManager = OfflineStorageManager.getInstance();
        const cachedChapters = await storageManager.getCachedChaptersForManga(mangaId);
        console.log('Found cached chapters:', cachedChapters.length);

        // If offline, only use cached data
        if (!isOnline) {
          console.log('useMangaDetails: Offline mode - using only cached data for mangaId:', mangaId);
          console.log('useMangaDetails: Found', cachedChapters.length, 'cached chapters');
          if (cachedChapters.length > 0) {
            console.log('useMangaDetails: Loading from cache...');
            const success = await loadFromCache(cachedChapters);
            if (success) {
              console.log('useMangaDetails: Successfully loaded from cache, clearing errors');
              setError(null); // Clear any previous errors
              setLoading(false); // Ensure loading is set to false
              return; // Exit early, don't make API calls
            }
          } else {
            console.log('useMangaDetails: No cached chapters found');
            setError('No cached data available for this manga');
            setLoading(false);
            return;
          }
        }

        // If online, try API first but fall back to cache on error
        if (isOnline) {
          // Check if we already have data from a previous cache load to avoid unnecessary API calls
          if (manga && chapters.length > 0) {
            console.log('useMangaDetails: Already have data from cache, skipping API call while online');
            setError(null); // Ensure no error is set
            return;
          }

          // Online: fetch from API with shorter timeout and aggressive fallback
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            console.log('Request timeout, aborting...');
            controller.abort();
          }, 3000); // Reduced to 3 seconds for faster fallback

          try {
            console.log('Attempting to fetch manga details online...');
            // Fetch manga details and complete chapter list in parallel
            const [mangaDetails, chapterList] = await Promise.all([
              getMangaDetails(mangaId),
              getChapterList(mangaId),
            ]);

            clearTimeout(timeoutId);
            console.log('Successfully fetched manga details online');
            
            if (!cancelled) {
              setManga(mangaDetails);
              // Sort chapters by chapter number (descending for latest first)
              setChapters(
                chapterList.sort((a, b) => b.data.chaNum - a.data.chaNum)
              );
            }
          } catch (err) {
            clearTimeout(timeoutId);
            console.log('Online fetch failed:', err);
            throw err; // This will trigger the fallback mechanism
          }
        }
      } catch (err) {
        if (!cancelled) {
          const isNetworkError = err instanceof Error && (
            err.message.includes('NetworkError') ||
            err.message.includes('Failed to fetch') ||
            err.message.includes('ERR_INTERNET_DISCONNECTED') ||
            err.message.includes('ERR_NETWORK') ||
            err.message.includes('Network error - please check your internet connection') ||
            err.message.includes('Request timeout - please check your connection') ||
            err.name === 'AbortError' ||
            err.name === 'TimeoutError'
          );
          
          console.log('Error fetching manga details:', err);
          console.log('Is network error:', isNetworkError);
          console.log('Attempting to fall back to cached data...');
          
          // Always try to fall back to cached data on error
          let fallbackSuccess = false;
          try {
            console.log('Fallback: attempting to load from cache...');
            const storageManager = OfflineStorageManager.getInstance();
            const fallbackCachedChapters = await storageManager.getCachedChaptersForManga(mangaId);
            fallbackSuccess = await loadFromCache(fallbackCachedChapters);
            if (fallbackSuccess) {
              console.log('useMangaDetails: Fallback to cache successful, clearing errors');
              setError(null); // Clear any errors since fallback worked
              setLoading(false); // Ensure loading is set to false
              return; // Exit early, don't set error
            }
          } catch (fallbackErr) {
            console.error('Fallback to cached data also failed:', fallbackErr);
          }
          
          // Only set error if both online fetch and offline fallback failed
          if (!fallbackSuccess) {
            console.log('useMangaDetails: Setting error because both online and fallback failed');
            setError(err instanceof Error ? err.message : 'Failed to fetch manga details');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (mangaId) {
      fetchMangaDetails();
    } else {
      // No mangaId provided (offline mode), skip loading
      setLoading(false);
      setError(null);
      setManga(null);
      setChapters([]);
    }

    // Cleanup function
    return () => {
      cancelled = true;
    };
  }, [mangaId, isOnline]);

  return { manga, chapters, loading, error };
}