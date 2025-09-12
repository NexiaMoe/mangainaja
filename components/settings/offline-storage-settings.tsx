'use client';

import { useState, useEffect } from 'react';
import { HardDrive, Trash2, Download, RefreshCw, Database, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useOfflineCache, useOfflineContent } from '@/hooks/use-offline';
import { useOfflineToggle } from '@/hooks/use-offline-toggle';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function OfflineStorageSettings() {
  const { cacheStats, loading, actions } = useOfflineCache();
  const { isOnline, isOffline, setOfflineMode } = useOfflineToggle();
  const { offlineContent, loading: contentLoading } = useOfflineContent();
  const [isClearing, setIsClearing] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await actions.clearAllCache();
    } finally {
      setIsClearing(false);
    }
  };

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const deletedCount = await actions.cleanupOldCache(2000); // Keep under 2GB
      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} old chapters`);
      }
    } finally {
      setIsCleaningUp(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const maxStorage = 5 * 1024 * 1024 * 1024; // 5GB limit
  const usagePercentage = cacheStats ? (cacheStats.totalSizeBytes / maxStorage) * 100 : 0;

  if (!mounted || loading || contentLoading) {
    return (
      <Card className="border-2 border-blue-500/20">
        <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/5">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Database className="w-5 h-5 text-blue-500 animate-pulse" />
            </div>
            <div>
              <span className="text-lg">Offline Storage</span>
              <p className="text-sm text-muted-foreground font-normal">Loading...</p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-500/20">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/5">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Database className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <span className="text-lg">Offline Storage</span>
            <p className="text-sm text-muted-foreground font-normal">
              Manage cached content and storage usage
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Connection Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded ${isOnline ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-orange-500" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {isOnline ? 'Online' : 'Offline Mode'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isOnline ? 'Connected to the internet' : 'Using cached content only'}
                </p>
              </div>
            </div>
            <Badge variant={isOnline ? 'secondary' : 'destructive'}>
              {isOnline ? 'Connected' : 'Offline'}
            </Badge>
          </div>
          
          {/* Offline Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
            <div className="flex items-center gap-3">
              <Label htmlFor="offline-mode" className="cursor-pointer flex-1">
                <div className="font-medium">Force Offline Mode</div>
                <p className="text-sm text-muted-foreground">
                  Manually control offline mode for testing or saving data
                </p>
              </Label>
            </div>
            <Switch
              id="offline-mode"
              checked={isOffline}
              onCheckedChange={(checked) => setOfflineMode(checked)}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>
        </div>

        {/* Storage Usage */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Storage Usage
            </h3>
            <Badge variant="outline">
              {cacheStats ? `${cacheStats.totalSizeMB} MB used` : '0 MB used'}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Used Storage</span>
              <span>{formatBytes(cacheStats?.totalSizeBytes || 0)} / 5 GB</span>
            </div>
            <Progress value={Math.min(usagePercentage, 100)} className="h-2" />
            {usagePercentage > 80 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                ⚠️ Storage is getting full. Consider cleaning up old content.
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Cached Content Summary */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Download className="w-4 h-4" />
            Cached Content
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {offlineContent.length}
                </div>
                <p className="text-sm text-muted-foreground">Manga Series</p>
              </div>
            </div>
            <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {cacheStats?.totalChapters || 0}
                </div>
                <p className="text-sm text-muted-foreground">Chapters</p>
              </div>
            </div>
            <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {cacheStats?.totalSizeMB || 0}
                </div>
                <p className="text-sm text-muted-foreground">MB Cached</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Storage Management Actions */}
        <div className="space-y-4">
          <h3 className="font-semibold">Storage Management</h3>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => actions.refresh()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Stats
            </Button>

            <Button
              variant="outline"
              onClick={handleCleanup}
              disabled={isCleaningUp}
              className="flex items-center gap-2 hover:bg-orange-500/10"
            >
              <Trash2 className="w-4 h-4" />
              {isCleaningUp ? 'Cleaning...' : 'Cleanup Old Content'}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Cache
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Offline Content?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all cached chapters and manga data. You'll need to re-download content for offline reading.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="bg-destructive hover:bg-destructive/90"
                    disabled={isClearing}
                  >
                    {isClearing ? 'Clearing...' : 'Clear All Cache'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Cache Information */}
        {cacheStats && (cacheStats.oldestCache || cacheStats.newestCache) && (
          <>
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Cache Information:</p>
              {cacheStats.oldestCache && (
                <p>• Oldest cached content: {new Date(cacheStats.oldestCache).toLocaleDateString()}</p>
              )}
              {cacheStats.newestCache && (
                <p>• Latest cached content: {new Date(cacheStats.newestCache).toLocaleDateString()}</p>
              )}
              <p>• Automatic cleanup: Content older than 30 days</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}