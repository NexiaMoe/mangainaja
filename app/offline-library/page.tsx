'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Download, Trash2, HardDrive, RefreshCw, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Header } from '@/components/layout/header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useOfflineContent } from '@/hooks/use-offline';
import { useDownloadManager } from '@/hooks/use-download-manager';
import { formatDate, formatBytes } from '@/lib/utils';

interface OfflineMangaEntry {
  mangaId: string;
  mangaName: string;
  totalChapters: number;
  downloadedChapters: number;
  totalSize: number;
  lastUpdated: Date;
  coverUrl?: string;
}

export default function OfflineLibraryPage() {
  const [offlineManga, setOfflineManga] = useState<OfflineMangaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStorage, setTotalStorage] = useState(0);
  
  const { offlineContent, loading: contentLoading, refresh: refreshContent } = useOfflineContent();
  const { downloads, stats, actions } = useDownloadManager();

  useEffect(() => {
    loadOfflineLibrary();
  }, [offlineContent]);

  const loadOfflineLibrary = async () => {
    try {
      // Group cached chapters by manga
      const mangaMap = new Map<string, OfflineMangaEntry>();
      let totalSize = 0;

      for (const manga of offlineContent) {
        totalSize += manga.totalSize;
        
        // Find the latest chapter date
        const latestChapter = manga.cachedChapters.length > 0 
          ? manga.cachedChapters.reduce((latest, chapter) => {
              return chapter.cachedAt > latest.cachedAt ? chapter : latest;
            }, manga.cachedChapters[0])
          : null;
        
        mangaMap.set(manga.mangaId, {
          mangaId: manga.mangaId,
          mangaName: manga.mangaName,
          totalChapters: manga.cachedChapters.length, // We'll update this if we have the info
          downloadedChapters: manga.cachedChapters.length,
          totalSize: manga.totalSize,
          lastUpdated: latestChapter?.cachedAt || new Date(),
        });
      }

      setOfflineManga(Array.from(mangaMap.values()));
      setTotalStorage(totalSize);
    } catch (error) {
      console.error('Failed to load offline library:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await refreshContent();
    await actions.refresh();
    await loadOfflineLibrary();
  };

  const getActiveDownloadsForManga = (mangaId: string) => {
    return downloads.filter(d => 
      d.mangaId === mangaId && 
      ['downloading', 'queued'].includes(d.status)
    );
  };

  if (loading || contentLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BookOpen className="w-8 h-8" />
                Offline Library
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your downloaded manga for offline reading
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Storage Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                Storage Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-primary">{offlineManga.length}</p>
                  <p className="text-sm text-muted-foreground">Manga Series</p>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-600">
                    {offlineManga.reduce((sum, manga) => sum + manga.downloadedChapters, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Downloaded Chapters</p>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-blue-600">{formatBytes(totalStorage)}</p>
                  <p className="text-sm text-muted-foreground">Storage Used</p>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-amber-600">{stats.downloading}</p>
                  <p className="text-sm text-muted-foreground">Active Downloads</p>
                </div>
              </div>
              
              {/* Download Success Rate */}
              {stats.total > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Download Success Rate</span>
                    <span>{Math.round(stats.successRate)}%</span>
                  </div>
                  <Progress value={stats.successRate} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manga Library */}
          {offlineManga.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Offline Content</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't downloaded any manga for offline reading yet.
                </p>
                <Link href="/">
                  <Button>
                    <Download className="w-4 h-4 mr-2" />
                    Browse Manga
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {offlineManga.map((manga) => {
                const activeDownloads = getActiveDownloadsForManga(manga.mangaId);
                const isDownloading = activeDownloads.length > 0;
                
                return (
                  <Card key={manga.mangaId} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Cover placeholder */}
                        <div className="w-20 h-28 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-8 h-8 text-muted-foreground" />
                        </div>
                        
                        {/* Details */}
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="text-lg font-semibold mb-1">{manga.mangaName}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {manga.downloadedChapters} chapters downloaded
                              </span>
                              <span className="flex items-center gap-1">
                                <HardDrive className="w-3 h-3" />
                                {formatBytes(manga.totalSize)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(manga.lastUpdated.getTime())}
                              </span>
                            </div>
                          </div>
                          
                          {/* Download Status */}
                          {isDownloading && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Downloading ({activeDownloads.length} chapters)</span>
                                <span>
                                  {Math.round(
                                    activeDownloads.reduce((sum, d) => sum + d.progress, 0) / activeDownloads.length
                                  )}%
                                </span>
                              </div>
                              <Progress 
                                value={activeDownloads.reduce((sum, d) => sum + d.progress, 0) / activeDownloads.length} 
                                className="h-2" 
                              />
                            </div>
                          )}
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Link href={`/manga/${manga.mangaId}`}>
                              <Button size="sm">
                                <BookOpen className="w-4 h-4 mr-2" />
                                Read
                              </Button>
                            </Link>
                            
                            <Link href={`/manga/${manga.mangaId}`}>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Manage
                              </Button>
                            </Link>
                            
                            {manga.downloadedChapters > 0 && (
                              <Badge variant="secondary" className="ml-auto">
                                ✓ {manga.downloadedChapters} cached
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}