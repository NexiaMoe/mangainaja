'use client';

import { useState, useEffect } from 'react';
import { Download, DownloadCloud } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { useOfflineChapter, useOfflineCache } from '@/hooks/use-offline';
import { ChapterDownloadManager } from '@/lib/download-manager';

interface OfflineBadgeProps {
  mangaId: string;
  chapterId: string;
  mangaName?: string;
  className?: string;
}

export function OfflineBadge({ mangaId, chapterId, mangaName, className }: OfflineBadgeProps) {
  const { isAvailableOffline, refresh, loading } = useOfflineChapter(mangaId, chapterId);
  const { actions } = useOfflineCache();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [justCached, setJustCached] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCache = async () => {
    setIsDownloading(true);
    try {
      const success = await actions.cacheChapter(mangaId, chapterId, mangaName);
      if (success) {
        // Refresh the offline status immediately after successful caching
        await refresh();
        // Show success feedback briefly
        setJustCached(true);
        setTimeout(() => setJustCached(false), 2000);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRemove = async () => {
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
        
        // Refresh the offline status immediately after successful removal
        await refresh();
      }
    } finally {
      setIsRemoving(false);
    }
  };

  const handleBadgeClick = () => {
    if (!isRemoving) {
      const confirmed = confirm(
        'Remove this chapter from offline storage?\n\nYou\'ll need to be online to read it again or re-cache it later.'
      );
      if (confirmed) {
        handleRemove();
      }
    }
  };

  // Show loading state during SSR or initial check
  if (!mounted || loading) {
    return (
      <Badge 
        variant="outline" 
        className={`flex items-center gap-1 ${className}`}
      >
        <DownloadCloud className="w-3 h-3 animate-pulse" />
        ...
      </Badge>
    );
  }

  if (isAvailableOffline) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className={`flex items-center gap-1 ${
                justCached 
                  ? 'bg-green-200 text-green-800 border-green-300 dark:bg-green-800/50 dark:text-green-100' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
              } ${isRemoving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'} ${className} ${
                justCached ? 'animate-pulse' : ''
              } transition-all duration-200`}
              onClick={isRemoving ? undefined : handleBadgeClick}
            >
              <Download className={`w-3 h-3 ${
                isRemoving ? 'animate-spin' : justCached ? 'animate-bounce' : ''
              }`} />
              {isRemoving ? 'Removing...' : justCached ? 'Cached!' : 'Offline'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{
              isRemoving 
                ? 'Removing from cache...' 
                : justCached 
                ? 'Successfully cached!' 
                : 'Available offline • Click to remove'
            }</p>
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
            variant="ghost"
            size="sm"
            className={`h-6 px-2 text-xs ${className}`}
            onClick={handleCache}
            disabled={isDownloading}
          >
            <DownloadCloud className={`w-3 h-3 mr-1 ${isDownloading ? 'animate-bounce' : ''}`} />
            {isDownloading ? 'Caching...' : 'Cache'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Cache for offline reading</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}