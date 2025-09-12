import { useState, useEffect } from 'react';
import { getMangaDetails, getChapterList } from '@/lib/api';
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

  useEffect(() => {
    async function fetchMangaDetails() {
      try {
        setLoading(true);
        setError(null);

        // Fetch manga details and complete chapter list in parallel
        const [mangaDetails, chapterList] = await Promise.all([
          getMangaDetails(mangaId),
          getChapterList(mangaId),
        ]);

        setManga(mangaDetails);
        // Sort chapters by chapter number (descending for latest first)
        setChapters(
          chapterList.sort((a, b) => b.data.chaNum - a.data.chaNum)
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch manga details');
      } finally {
        setLoading(false);
      }
    }

    if (mangaId) {
      fetchMangaDetails();
    }
  }, [mangaId]);

  return { manga, chapters, loading, error };
}