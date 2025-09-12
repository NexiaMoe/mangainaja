'use client';

import { useState, useEffect } from 'react';
import { Download, DownloadCloud, Pause, Play, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { Progress } from './progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { useChapterDownload, useDownloadManager } from '@/hooks/use-download-manager';
import { useOfflineChapter, useOfflineCache } from '@/hooks/use-offline';
import { ChapterDownloadManager } from '@/lib/download-manager';

interface DownloadButtonProps {
  mangaId: string;
  chapterId: string;
  mangaName?: string;
  className?: string;
  variant?: 'button' | 'badge';
  priority?: number;
}

export function DownloadButton({ 
  mangaId, 
  chapterId, 
  mangaName, 
  className = '',
  variant = 'button',
  priority = 0
}: DownloadButtonProps) {
  const { isAvailableOffline, refresh } = useOfflineChapter(mangaId, chapterId);
  const { actions } = useOfflineCache();
  const { 
    isDownloading, 
    downloadProgress, 
    error, 
    startDownload 
  } = useChapterDownload(mangaId, chapterId);
  
  const [mounted, setMounted] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Handle SSR
  useState(() => setMounted(true));

  // Listen for cache completion events to refresh state
  useEffect(() => {
    const handleCacheCompleted = (event: CustomEvent) => {
      const { mangaId: eventMangaId, chapterId: eventChapterId } = event.detail;
      if (eventMangaId === mangaId && eventChapterId === chapterId) {
        console.log('Cache completed event received for chapter, refreshing state');
        // Refresh the offline status
        refresh();
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
  }, [mangaId, chapterId, refresh]);

  const handleDownload = async () => {
    try {
      console.log('DownloadButton: handleDownload called for', mangaId, chapterId);
      await startDownload(mangaName, priority);
    } catch (error) {
      console.error('DownloadButton: Download failed:', error);
    }
  };

  const handleRemove = async () => {
    if (isRemoving) return;
    
    const confirmed = confirm(
      'Remove this chapter from offline storage?\n\nYou\'ll need to be online to read it again or re-download it later.'
    );
    
    if (confirmed) {
      setIsRemoving(true);
      try {
        const success = await actions.removeCachedChapter(mangaId, chapterId);
        if (success) {
          // Also clean up any download records (completed, failed, etc.)
          try {
            const downloadManager = ChapterDownloadManager.getInstance();
            await downloadManager.clearChapterDownloadRecord(mangaId, chapterId);
          } catch (downloadError) {
            console.error('Failed to clean up download record:', downloadError);
          }
          
          await refresh();
        }
      } catch (error) {
        console.error('Failed to remove chapter:', error);
      } finally {
        setIsRemoving(false);
      }
    }
  };

  if (!mounted) {
    return null; // Prevent SSR mismatch
  }

  // Debug logging (only when there's an error or status change)
  if (error) {
    console.log('DownloadButton error state:', {
      mangaId,
      chapterId,
      isAvailableOffline,
      error
    });
  }

  // If already cached (either manually or via download), show success
  if (isAvailableOffline && !isDownloading && !error) {
    if (variant === 'badge') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="secondary" 
                className={`flex items-center gap-1 ${
                  isRemoving 
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                    : 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/50'
                } ${className}`}
                onClick={isRemoving ? undefined : handleRemove}
              >
                <CheckCircle className={`w-3 h-3 ${isRemoving ? 'animate-spin' : ''}`} />
                {isRemoving ? 'Removing...' : 'Offline'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isRemoving ? 'Removing from cache...' : 'Available offline • Click to remove'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled
              className={`h-8 px-3 text-xs text-green-700 border-green-300 bg-green-50 dark:text-green-300 dark:border-green-700 dark:bg-green-900/20 ${className}`}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Downloaded
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Chapter is available offline</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show error state
  if (error) {
    if (variant === 'badge') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="destructive" 
                className={`flex items-center gap-1 cursor-pointer hover:bg-destructive/90 ${className}`}
                onClick={handleDownload}
              >
                <AlertCircle className="w-3 h-3" />
                Retry
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download failed. Click to retry.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className={`h-8 px-3 text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20 ${className}`}
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Download failed. Click to retry.</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show downloading state with progress
  if (isDownloading) {
    if (variant === 'badge') {
      return (
        <div className={`flex flex-col gap-1 ${className}`}>
          <Badge variant="outline" className="flex items-center gap-1">
            <DownloadCloud className="w-3 h-3 animate-bounce" />
            {downloadProgress > 0 ? `${Math.round(downloadProgress)}%` : 'Queued'}
          </Badge>
          {downloadProgress > 0 && (
            <Progress value={downloadProgress} className="h-1" />
          )}
        </div>
      );
    }
    
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          disabled
          className="h-8 px-3 text-xs"
        >
          <DownloadCloud className="w-3 h-3 mr-1 animate-bounce" />
          {downloadProgress > 0 ? `${Math.round(downloadProgress)}%` : 'Queued'}
        </Button>
        {downloadProgress > 0 && (
          <Progress value={downloadProgress} className="h-1" />
        )}
      </div>
    );
  }

  // Default: Show download button
  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`flex items-center gap-1 cursor-pointer hover:bg-muted ${className}`}
              onClick={handleDownload}
            >
              <Download className="w-3 h-3" />
              Download
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Download for offline reading</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className={`h-8 px-3 text-xs ${className}`}
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Download for offline reading</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Bulk download button for multiple chapters
interface BulkDownloadButtonProps {
  chapters: { mangaId: string; chapterId: string }[];
  mangaName?: string;
  className?: string;
}

export function BulkDownloadButton({ 
  chapters, 
  mangaName, 
  className = '' 
}: BulkDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadedCount, setDownloadedCount] = useState(0);
  const { actions } = useDownloadManager();

  const handleBulkDownload = async () => {
    setIsDownloading(true);
    setDownloadedCount(0);
    
    try {
      // Queue all downloads with higher priority for bulk operations
      const promises = chapters.map(async (chapter, index) => {
        try {
          await actions.queueDownload(
            chapter.mangaId, 
            chapter.chapterId, 
            mangaName, 
            10 + index // Higher priority
          );
          setDownloadedCount(prev => prev + 1);
        } catch (error) {
          console.error('Failed to queue download for chapter:', chapter.chapterId, error);
        }
      });
      
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Bulk download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={handleBulkDownload}
            disabled={isDownloading}
            className={`${className}`}
          >
            {isDownloading ? (
              <>
                <DownloadCloud className="w-4 h-4 mr-2 animate-bounce" />
                Downloading ({downloadedCount}/{chapters.length})
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download All ({chapters.length})
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Download all chapters for offline reading</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}