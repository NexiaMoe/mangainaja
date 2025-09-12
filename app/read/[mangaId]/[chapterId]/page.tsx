'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { MangaReader } from '@/components/reader/manga-reader';
import { useChapterDetails } from '@/hooks/use-chapter-details';
import { useMangaDetails } from '@/hooks/use-manga-details';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ReaderPage() {
  // Add global error handlers
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('ReaderPage: Unhandled error:', event.error);
    };
    
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('ReaderPage: Unhandled promise rejection:', event.reason);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  try {
    const params = useParams();
    const mangaId = params.mangaId as string;
    const chapterId = params.chapterId as string;
    
    console.log('ReaderPage: Loading with mangaId:', mangaId, 'chapterId:', chapterId);
    
    const { chapter, loading: chapterLoading, error: chapterError } = useChapterDetails(chapterId, mangaId);
    const { manga, chapters, loading: chaptersLoading, error: mangaError } = useMangaDetails(mangaId);

    const loading = chapterLoading || chaptersLoading;
    const error = chapterError || mangaError;
    
    console.log('ReaderPage: State:', {
      loading,
      chapterLoading,
      chaptersLoading,
      chapterError,
      mangaError,
      error,
      hasChapter: !!chapter,
      hasManga: !!manga,
      chaptersCount: chapters?.length || 0
    });

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
  
  } catch (error) {
    console.error('ReaderPage: Critical error:', error);
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Reader Error</h1>
          <p className="text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'An error occurred loading the reader'}
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
}