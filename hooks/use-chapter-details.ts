import { useState, useEffect } from 'react';
import { getChapterDetails } from '@/lib/api';
import type { ChapterNode } from '@/types/manga';

interface UseChapterDetailsResult {
  chapter: ChapterNode | null;
  loading: boolean;
  error: string | null;
}

export function useChapterDetails(chapterId: string): UseChapterDetailsResult {
  const [chapter, setChapter] = useState<ChapterNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChapterDetails() {
      try {
        setLoading(true);
        setError(null);

        const chapterDetails = await getChapterDetails(chapterId);
        setChapter(chapterDetails);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch chapter details');
      } finally {
        setLoading(false);
      }
    }

    if (chapterId) {
      fetchChapterDetails();
    }
  }, [chapterId]);

  return { chapter, loading, error };
}