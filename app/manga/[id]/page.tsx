'use client';

import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { MangaDetails } from '@/components/manga/manga-details';
import { ChapterList } from '@/components/manga/chapter-list';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useMangaDetails } from '@/hooks/use-manga-details';

export default function MangaPage() {
  const params = useParams();
  const mangaId = params.id as string;
  
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
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">
              {error || 'Manga not found'}
            </h1>
            <p className="text-muted-foreground">
              The manga you're looking for doesn't exist or couldn't be loaded.
            </p>
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
          <ChapterList
            chapters={chapters}
            mangaSlug={manga.data.slug}
            mangaId={manga.id}
          />
        </div>
      </main>
    </div>
  );
}