'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, FileText, Play, ArrowUpDown, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DownloadButton, BulkDownloadButton } from '@/components/ui/download-button';
import { formatDate } from '@/lib/utils';
import { useReadingHistoryStore } from '@/stores/reading-history-store';
import type { ChapterNode } from '@/types/manga';

interface ChapterListProps {
  chapters: ChapterNode[];
  mangaSlug: string;
  mangaId: string;
  mangaName?: string;
}

type SortKey = 'number' | 'date';
type SortOrder = 'asc' | 'desc';

export function ChapterList({ chapters, mangaSlug, mangaId, mangaName }: ChapterListProps) {
  const { getReadingProgress } = useReadingHistoryStore();
  const [sortKey, setSortKey] = useState<SortKey>('number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  if (chapters.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No chapters available</p>
        </CardContent>
      </Card>
    );
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      // Default to desc for both (newest/highest first)
      setSortOrder('desc');
    }
  };

  const sortedChapters = [...chapters].sort((a, b) => {
    if (sortKey === 'number') {
      // Sort by chapter number
      const aNum = a.data.chaNum || 0;
      const bNum = b.data.chaNum || 0;
      return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
    } else {
      // Sort by date - prioritize datePublic, fallback to dateCreate
      const aDate = a.data.datePublic || a.data.dateCreate || 0;
      const bDate = b.data.datePublic || b.data.dateCreate || 0;
      
      // Handle edge cases
      if (aDate === bDate) return 0;
      if (aDate === 0) return sortOrder === 'asc' ? 1 : -1;
      if (bDate === 0) return sortOrder === 'asc' ? -1 : 1;
      
      // Convert to numbers and sort
      const numA = Number(aDate);
      const numB = Number(bDate);
      
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    }
  });

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
            <CardTitle className="flex items-center gap-2 flex-shrink-0">
              <FileText className="w-5 h-5" />
              Chapters ({chapters.length})
            </CardTitle>
            
            <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
              <Button
                variant={sortKey === 'number' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('number')}
                className="gap-1 text-xs flex-1 sm:flex-none min-w-0 px-2 sm:px-3"
              >
                <ArrowUpDown className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{sortKey === 'number' ? (sortOrder === 'asc' ? 'Ch. ↑' : 'Ch. ↓') : 'Ch.'}</span>
              </Button>
              
              <Button
                variant={sortKey === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('date')}
                className="gap-1 text-xs flex-1 sm:flex-none min-w-0 px-2 sm:px-3"
              >
                <ArrowUpDown className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{sortKey === 'date' ? (sortOrder === 'asc' ? 'Date ↑' : 'Date ↓') : 'Date'}</span>
              </Button>
            </div>
          </div>
          
          {/* Bulk download button */}
          <div className="flex justify-end">
            <BulkDownloadButton 
              chapters={chapters.map(ch => ({ mangaId, chapterId: ch.id }))}
              mangaName={mangaName}
              className="text-xs"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y">
          {sortedChapters.map((chapter) => {
            const progress = getReadingProgress(mangaId, chapter.id);
            const isRead = progress && progress.currentPage >= progress.totalPages;
            
            return (
              <div
                key={chapter.id}
                className={`p-4 transition-colors border-l-4 ${
                  isRead 
                    ? 'border-l-green-500 bg-green-50/50 dark:bg-green-900/20 hover:bg-green-100/50 dark:hover:bg-green-900/30' 
                    : 'border-l-transparent hover:bg-accent/50'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {isRead && (
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      )}
                      {progress && progress.currentPage > 0 && !isRead && (
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      )}
                      <h3 className={`font-medium transition-colors ${
                        isRead 
                          ? 'text-green-800 dark:text-green-200 hover:text-green-900 dark:hover:text-green-100' 
                          : 'hover:text-primary'
                      }`}>
                        {chapter.data.dname}
                      </h3>
                      {isRead && (
                        <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700 text-white">
                          ✓ Completed
                        </Badge>
                      )}
                      {progress && progress.currentPage > 0 && !isRead && (
                        <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 dark:text-amber-400">
                          {Math.round((progress.currentPage / progress.totalPages) * 100)}%
                        </Badge>
                      )}
                      <DownloadButton
                        mangaId={mangaId}
                        chapterId={chapter.id}
                        mangaName={mangaName}
                        variant="badge"
                        className="ml-2"
                      />
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {chapter.data.datePublic && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(chapter.data.datePublic)}</span>
                        </div>
                      )}
                      
                      {chapter.data.count_images && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>{chapter.data.count_images} pages</span>
                        </div>
                      )}
                    </div>
                    
                    {progress && progress.currentPage > 0 && (
                      <div className={`text-xs ${isRead ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}`}>
                        {isRead ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="font-medium">Completed - {progress.totalPages} pages read</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-32">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div 
                                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" 
                                  style={{ width: `${Math.round((progress.currentPage / progress.totalPages) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            <span>Progress: {progress.currentPage}/{progress.totalPages} pages</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Link href={`/read/${mangaId}/${chapter.id}`}>
                    <Button 
                      size="sm" 
                      className={`gap-2 ${
                        isRead 
                          ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                          : ''
                      }`}
                      variant={isRead ? 'default' : 'default'}
                    >
                      {isRead ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Re-read
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          {progress && progress.currentPage > 0 ? 'Continue' : 'Read'}
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}