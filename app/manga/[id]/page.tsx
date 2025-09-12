'use client';

import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { MangaDetails } from '@/components/manga/manga-details';
import { ChapterList } from '@/components/manga/chapter-list';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useMangaDetails } from '@/hooks/use-manga-details';
import { useOnlineStatus } from '@/hooks/use-online-status';

export default function MangaPage() {
  const params = useParams();
  const mangaId = params.id as string;
  
  const isOnline = useOnlineStatus();
  // The updated useMangaDetails hook now handles both online and offline cases
  const { manga, chapters, loading, error } = useMangaDetails(mangaId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (error || !manga) {
    console.log('Manga page error state:', { error, manga, isOnline, mangaId, loading });
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">
              {error || 'Failed to fetch'}
            </h1>
            <p className="text-muted-foreground">
              The manga you're looking for doesn't exist or couldn't be loaded.
            </p>
            {!isOnline && (
              <p className="text-sm text-muted-foreground mt-2">
                You're offline. This manga may not be cached for offline viewing.
              </p>
            )}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-left text-xs">
                <div>Debug Info:</div>
                <div>Online: {isOnline.toString()}</div>
                <div>Error: {error}</div>
                <div>Manga ID: {mangaId}</div>
                <div>Loading: {loading.toString()}</div>
                <div>Manga exists: {(!!manga).toString()}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-8">
          <MangaDetails manga={manga} />
          {chapters.length > 0 && (
            <>
              {!isOnline && (
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground mb-1">📱 Offline Mode</p>
                  <p className="text-sm text-muted-foreground">Showing {chapters.length} cached chapters</p>
                </div>
              )}
              {isOnline && manga?.data?.name?.includes('Cached') && (
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-yellow-700 dark:text-yellow-300 mb-1">⚠️ Network Issue</p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Showing cached data due to connectivity issues. Showing {chapters.length} cached chapters.
                  </p>
                </div>
              )}
            </>
          )}
          <ChapterList
            chapters={chapters || []}
            mangaSlug={manga?.data?.slug || ''}
            mangaId={manga?.id || mangaId}
            mangaName={manga?.data?.name}
          />
        </div>
      </main>
    </div>
  );
}