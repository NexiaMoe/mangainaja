'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChapterDownloadManager, type DownloadProgress } from '@/lib/download-manager';

export function useDownloadManager() {
  const [downloads, setDownloads] = useState<DownloadProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    queued: 0,
    downloading: 0,
    successRate: 0
  });

  const refreshDownloads = useCallback(async () => {
    // Skip if not in browser environment
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const downloadManager = ChapterDownloadManager.getInstance();
      const [downloadProgress, downloadStats] = await Promise.all([
        downloadManager.getDownloadProgress(),
        downloadManager.getDownloadStats()
      ]);
      
      setDownloads(downloadProgress);
      setStats(downloadStats);
    } catch (error) {
      console.error('Failed to refresh downloads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDownloads();
    
    // Refresh every 2 seconds to show real-time progress
    const interval = setInterval(refreshDownloads, 2000);
    
    return () => clearInterval(interval);
  }, [refreshDownloads]);

  const queueDownload = useCallback(async (
    mangaId: string, 
    chapterId: string, 
    mangaName?: string,
    priority?: number
  ) => {
    if (typeof window === 'undefined') {
      throw new Error('Downloads are not available during server-side rendering');
    }

    try {
      const downloadManager = ChapterDownloadManager.getInstance();
      const jobId = await downloadManager.queueDownload(mangaId, chapterId, mangaName, priority);
      await refreshDownloads();
      return jobId;
    } catch (error) {
      console.error('Failed to queue download:', error);
      throw error;
    }
  }, [refreshDownloads]);

  const pauseDownload = useCallback(async (jobId: string) => {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const downloadManager = ChapterDownloadManager.getInstance();
      const success = await downloadManager.pauseDownload(jobId);
      if (success) {
        await refreshDownloads();
      }
      return success;
    } catch (error) {
      console.error('Failed to pause download:', error);
      return false;
    }
  }, [refreshDownloads]);

  const resumeDownload = useCallback(async (jobId: string) => {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const downloadManager = ChapterDownloadManager.getInstance();
      const success = await downloadManager.resumeDownload(jobId);
      if (success) {
        await refreshDownloads();
      }
      return success;
    } catch (error) {
      console.error('Failed to resume download:', error);
      return false;
    }
  }, [refreshDownloads]);

  const cancelDownload = useCallback(async (jobId: string) => {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const downloadManager = ChapterDownloadManager.getInstance();
      const success = await downloadManager.cancelDownload(jobId);
      if (success) {
        await refreshDownloads();
      }
      return success;
    } catch (error) {
      console.error('Failed to cancel download:', error);
      return false;
    }
  }, [refreshDownloads]);

  const clearCompleted = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const downloadManager = ChapterDownloadManager.getInstance();
      await downloadManager.clearCompletedDownloads();
      await refreshDownloads();
    } catch (error) {
      console.error('Failed to clear completed downloads:', error);
    }
  }, [refreshDownloads]);

  const getQueuedDownloads = useCallback(() => {
    return downloads.filter(d => d.status === 'queued');
  }, [downloads]);

  const getActiveDownloads = useCallback(() => {
    return downloads.filter(d => d.status === 'downloading');
  }, [downloads]);

  const getCompletedDownloads = useCallback(() => {
    return downloads.filter(d => d.status === 'completed');
  }, [downloads]);

  const getFailedDownloads = useCallback(() => {
    return downloads.filter(d => d.status === 'failed');
  }, [downloads]);

  return {
    downloads,
    loading,
    stats,
    actions: {
      queueDownload,
      pauseDownload,
      resumeDownload,
      cancelDownload,
      clearCompleted,
      refresh: refreshDownloads
    },
    getters: {
      queued: getQueuedDownloads,
      active: getActiveDownloads,
      completed: getCompletedDownloads,
      failed: getFailedDownloads
    }
  };
}

export function useChapterDownload(mangaId: string, chapterId: string) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const downloadManager = ChapterDownloadManager.getInstance();

  const startDownload = useCallback(async (mangaName?: string, priority?: number) => {
    setIsDownloading(true);
    setError(null);
    
    try {
      console.log('Starting download for:', mangaId, chapterId);
      await downloadManager.queueDownload(mangaId, chapterId, mangaName, priority);
      console.log('Download queued successfully');
    } catch (err) {
      console.error('Download queue failed:', err);
      setError(err instanceof Error ? err.message : 'Download failed');
      setIsDownloading(false);
    }
  }, [mangaId, chapterId, downloadManager]);

  // Listen for cache completion events
  useEffect(() => {
    const handleCacheCompleted = (event: CustomEvent) => {
      const { mangaId: eventMangaId, chapterId: eventChapterId } = event.detail;
      if (eventMangaId === mangaId && eventChapterId === chapterId) {
        console.log('Cache completed event received in useChapterDownload');
        // Reset download state since the chapter is now cached
        setIsDownloading(false);
        setDownloadProgress(100);
        setError(null);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('chapterCacheCompleted', handleCacheCompleted as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('chapterCacheCompleted', handleCacheCompleted as EventListener);
      }
    };
  }, [mangaId, chapterId]);

  // Check current download status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const downloads = await downloadManager.getDownloadProgress();
        const currentDownload = downloads.find(
          d => d.mangaId === mangaId && d.chapterId === chapterId
        );
        
        if (currentDownload) {
          setDownloadProgress(currentDownload.progress);
          setIsDownloading(['downloading', 'queued'].includes(currentDownload.status));
          
          if (currentDownload.status === 'failed') {
            setError(currentDownload.error || 'Download failed');
            setIsDownloading(false);
          } else if (currentDownload.status === 'completed') {
            setIsDownloading(false);
            setError(null); // Clear error on completion
          }
        } else {
          // No download record found - reset states
          setDownloadProgress(0);
          setIsDownloading(false);
          setError(null);
        }
      } catch (error) {
        console.error('Failed to check download status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    
    return () => clearInterval(interval);
  }, [mangaId, chapterId, downloadManager]);

  return {
    isDownloading,
    downloadProgress,
    error,
    startDownload
  };
}