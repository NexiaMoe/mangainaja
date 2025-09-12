'use client';

import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/header';
import { SearchBar } from '@/components/search/search-bar';
import { GenreFilter } from '@/components/search/genre-filter';
import { MangaGrid } from '@/components/manga/manga-grid';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useMangaSearch } from '@/hooks/use-manga-search';
import { useSearchStore } from '@/stores/search-store';
import { usePaginationStore } from '@/stores/pagination-store';
import { useHomeScrollPosition } from '@/hooks/use-home-scroll-position';
import { usePathname } from 'next/navigation';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, BookOpen, Heart, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { searchTerm, selectedGenres, sortBy } = useSearchStore();
  const { currentPage, setCurrentPage, resetPage } = usePaginationStore();
  const { restoreScrollPosition } = useHomeScrollPosition();
  const pathname = usePathname();
  const isOnline = useOnlineStatus();
  
  // Track previous search parameters to detect intentional changes
  const prevSearchParams = useRef({ searchTerm, selectedGenres, sortBy });
  const isInitialMount = useRef(true);
  
  const {
    data: searchResults,
    loading,
    error,
    hasMore,
    totalPages
  } = useMangaSearch({
    searchTerm: searchTerm || undefined,
    genres: selectedGenres,
    sortBy,
    page: currentPage,
  });

  useEffect(() => {
    // Skip effect on initial mount to preserve persisted pagination state
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Only reset page if search parameters actually changed (intentional search)
    const currentParams = { searchTerm, selectedGenres, sortBy };
    const prevParams = prevSearchParams.current;
    
    const hasSearchTermChanged = searchTerm !== prevParams.searchTerm;
    const hasGenresChanged = JSON.stringify(selectedGenres) !== JSON.stringify(prevParams.selectedGenres);
    const hasSortByChanged = sortBy !== prevParams.sortBy;
    
    if (hasSearchTermChanged || hasGenresChanged || hasSortByChanged) {
      resetPage();
      // Update previous parameters
      prevSearchParams.current = currentParams;
    }
  }, [searchTerm, selectedGenres, sortBy, resetPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing page
    window.scrollTo(0, 0);
  };

  // Restore scroll position when component mounts
  useEffect(() => {
    restoreScrollPosition();
  }, [restoreScrollPosition]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main
        className="container mx-auto px-4 py-6 space-y-6"
      >
        {/* Offline Notice and Quick Links */}
        {!isOnline && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <WifiOff className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold mb-2">You're Offline</h2>
                    <p className="text-sm text-muted-foreground">
                      Search and browsing are unavailable. You can still access your cached content.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/bookmarks">
                      <Button variant="outline" size="sm">
                        <Heart className="w-4 h-4 mr-2" />
                        Bookmarks
                      </Button>
                    </Link>
                    <Link href="/history">
                      <Button variant="outline" size="sm">
                        <Clock className="w-4 h-4 mr-2" />
                        History
                      </Button>
                    </Link>
                    <Link href="/settings">
                      <Button variant="outline" size="sm">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Cached Content
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Section - Disabled when offline */}
        <div className={`space-y-4 ${!isOnline ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar />
            </div>
          </div>
          <GenreFilter />
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {!isOnline ? (
            <div className="text-center py-12 space-y-4">
              <WifiOff className="w-16 h-16 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold">Offline Mode</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Browse is unavailable while offline. Access your bookmarks and cached chapters from the links above.
              </p>
            </div>
          ) : loading && currentPage === 1 ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : (
            <>
              <MangaGrid
                manga={searchResults}
                currentPage={currentPage}
                totalPages={totalPages || 1}
                onPageChange={handlePageChange}
                loading={loading}
              />
              
              {error && (
                <div className="text-center py-8">
                  <p className="text-destructive">Error loading manga: {error}</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}