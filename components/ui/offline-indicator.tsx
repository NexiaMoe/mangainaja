'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Download } from 'lucide-react';
import { Badge } from './badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useOfflineContent } from '@/hooks/use-offline';

export function OfflineIndicator() {
  const [mounted, setMounted] = useState(false);
  const isOnline = useOnlineStatus();
  const { offlineContent } = useOfflineContent();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything during SSR
  if (!mounted) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1 text-xs">
        <div className="w-3 h-3 animate-pulse bg-current rounded-full opacity-50" />
        ...
      </Badge>
    );
  }
  
  const totalOfflineChapters = offlineContent.reduce(
    (sum, manga) => sum + manga.cachedChapters.length, 
    0
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <Badge 
              variant={isOnline ? 'secondary' : 'destructive'}
              className="flex items-center gap-1 text-xs"
            >
              {isOnline ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            
            {totalOfflineChapters > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Download className="w-3 h-3" />
                {totalOfflineChapters}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">
              {isOnline ? '🌐 Connected' : '📱 Offline Mode'}
            </p>
            {totalOfflineChapters > 0 && (
              <p className="text-xs text-muted-foreground">
                {totalOfflineChapters} chapters available offline
              </p>
            )}
            {!isOnline && totalOfflineChapters === 0 && (
              <p className="text-xs text-muted-foreground">
                No offline content available
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}