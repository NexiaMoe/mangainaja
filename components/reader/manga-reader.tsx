'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ReaderControls } from './reader-controls';
import { ReaderPages } from './reader-pages';
import { ReaderSettings } from './reader-settings';
import { useReaderStore } from '@/stores/reader-store';
import { useReadingHistoryStore } from '@/stores/reading-history-store';
import { useKeyboardControls } from '@/hooks/use-keyboard-controls';
import type { ChapterNode, MangaNode } from '@/types/manga';

interface MangaReaderProps {
  chapter: ChapterNode;
  chapters: ChapterNode[];
  manga: MangaNode;
  mangaId: string;
  chapterId: string;
}

export function MangaReader({ chapter, chapters, manga, mangaId, chapterId }: MangaReaderProps) {
  const router = useRouter();
  const {
    currentPage,
    setCurrentPage,
    readingDirection,
    pageTransition,
    showControls,
    setShowControls
  } = useReaderStore();
  
  const { updateReadingProgress, getReadingProgress, addToHistory } = useReadingHistoryStore();
  const [showSettings, setShowSettings] = useState(false);

  const totalPages = chapter.data.imageFiles?.length || 0;
  const images = chapter.data.imageFiles || [];

  // Find next and previous chapters
  const currentChapterNum = chapter.data.chaNum;
  const nextChapter = chapters.find(ch => ch.data.chaNum === currentChapterNum + 1);
  const prevChapter = chapters.find(ch => ch.data.chaNum === currentChapterNum - 1);

  // Initialize current page from reading history
  useEffect(() => {
    if (totalPages > 0) {
      const savedProgress = getReadingProgress(mangaId, chapterId);
      const initialPage = savedProgress && savedProgress.currentPage <= totalPages
        ? savedProgress.currentPage
        : 1;
      
      setCurrentPage(initialPage);
      
      // TODO: Add toast notification for resume (requires proper toast hook setup)
      // if (initialPage > 1 && savedProgress) {
      //   toast({
      //     title: "Resumed Reading",
      //     description: `Page ${initialPage} of ${totalPages}`,
      //     duration: 3000,
      //   });
      // }
    }
  }, [chapterId, mangaId, totalPages, getReadingProgress, setCurrentPage]);

  // Save reading progress and history
  useEffect(() => {
    if (currentPage > 0 && totalPages > 0) {
      updateReadingProgress(mangaId, chapterId, {
        currentPage,
        totalPages,
        lastReadAt: Date.now(),
      });

      // Add to reading history when user actually reads
      addToHistory({
        mangaId: manga.id,
        mangaName: manga.data.name,
        mangaSlug: manga.data.slug,
        coverUrl: manga.data.urlCover300,
        lastReadAt: Date.now(),
        lastChapterId: chapter.id,
        lastChapterName: chapter.data.dname,
      });
    }
  }, [currentPage, totalPages, mangaId, chapterId, updateReadingProgress, addToHistory, manga, chapter]);

  const navigateToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages, setCurrentPage]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages, setCurrentPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage, setCurrentPage]);

  const navigateToNextChapter = useCallback(() => {
    if (nextChapter) {
      router.replace(`/read/${mangaId}/${nextChapter.id}`);
    }
  }, [nextChapter, mangaId, router]);

  const navigateToPrevChapter = useCallback(() => {
    if (prevChapter) {
      router.replace(`/read/${mangaId}/${prevChapter.id}`);
    }
  }, [prevChapter, mangaId, router]);

  const exitReader = useCallback(() => {
    router.push(`/manga/${mangaId}`);
  }, [router, mangaId]);

  // Keyboard controls
  useKeyboardControls({
    onNextPage: nextPage,
    onPrevPage: prevPage,
    onToggleControls: () => setShowControls(!showControls),
    onToggleSettings: () => setShowSettings(!showSettings),
    onExit: exitReader,
  });

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (showControls) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [showControls, setShowControls]);

  const handlePageClick = useCallback((side: 'left' | 'right') => {
    if (readingDirection === 'rtl') {
      if (side === 'left') nextPage();
      else prevPage();
    } else {
      if (side === 'left') prevPage();
      else nextPage();
    }
  }, [readingDirection, nextPage, prevPage]);

  const handleCenterClick = useCallback(() => {
    setShowControls(!showControls);
  }, [showControls, setShowControls]);

  const handleToggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
  }, []);

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {/* Main Reader */}
      <ReaderPages
        images={images}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageClick={handlePageClick}
        onCenterClick={handleCenterClick}
        onPageChange={navigateToPage}
        readingDirection={readingDirection}
        pageTransition={pageTransition}
        nextChapter={nextChapter}
        onNextChapter={navigateToNextChapter}
        prevChapter={prevChapter}
        onPrevChapter={navigateToPrevChapter}
      />

      {/* Controls Overlay */}
      <ReaderControls
        visible={showControls}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={navigateToPage}
        onPrevPage={prevPage}
        onNextPage={nextPage}
        onToggleSettings={handleToggleSettings}
        onExit={exitReader}
        chapter={chapter}
      />

      {/* Settings Panel */}
      <ReaderSettings
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
}