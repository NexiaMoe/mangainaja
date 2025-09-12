'use client';

import { useParams } from 'next/navigation';
import { MangaReader } from '@/components/reader/manga-reader';
import { useChapterDetails } from '@/hooks/use-chapter-details';
import { useMangaDetails } from '@/hooks/use-manga-details';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ReaderPage() {
  const params = useParams();
  const mangaId = params.mangaId as string;
  const chapterId = params.chapterId as string;
  
  const { chapter, loading: chapterLoading, error: chapterError } = useChapterDetails(chapterId);
  const { manga, chapters, loading: chaptersLoading } = useMangaDetails(mangaId);

  const loading = chapterLoading || chaptersLoading;
  const error = chapterError;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !chapter || !manga) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chapter not found</h1>
          <p className="text-gray-400">
            {error || 'The chapter you\'re looking for doesn\'t exist.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <MangaReader 
      chapter={chapter}
      chapters={chapters}
      manga={manga}
      mangaId={mangaId}
      chapterId={chapterId}
    />
  );
}