import { useState, useEffect } from 'react';
import { searchManga } from '@/lib/api';
import { useSearchStore } from '@/stores/search-store';
import type { MangaSearchResult, MangaSearchParams } from '@/types/api';

interface UseMangaSearchResult {
  data: MangaSearchResult[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalPages: number;
}

export function useMangaSearch(params: MangaSearchParams): UseMangaSearchResult {
  const isHydrated = useSearchStore((state) => state.isHydrated);
  const [data, setData] = useState<MangaSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch when search params or page changes, but only after hydration
  useEffect(() => {
    // Skip fetch until store is hydrated to prevent double API calls
    if (!isHydrated) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await searchManga({
          searchTerm: params.searchTerm,
          genres: params.genres,
          sortBy: params.sortBy,
          page: params.page || 1,
        });

        setData(response.items);
        setHasMore((params.page || 1) < response.paging.pages);
        setTotalPages(response.paging.pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search manga');
        setData([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isHydrated, params.searchTerm, JSON.stringify(params.genres), params.sortBy, params.page]);

  return {
    data,
    loading,
    error,
    hasMore,
    totalPages,
  };
}