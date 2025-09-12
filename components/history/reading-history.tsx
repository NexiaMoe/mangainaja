'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Trash2, BookOpen, Book, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { useReadingHistoryStore } from '@/stores/reading-history-store';

export function ReadingHistory() {
  const { 
    getHistory, 
    removeFromHistory, 
    clearHistory,
    getReadingProgress
  } = useReadingHistoryStore();

  const history = getHistory();

  const HistoryList = ({ items }: { items: any[] }) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">
            No reading history yet
          </p>
          <p className="text-muted-foreground">
            Start reading some manga to see your history here
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All History
            </Button>
          </div>
        )}

        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.mangaId} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  <Link 
                    href={`/manga/${item.mangaId}`}
                    className="block flex-shrink-0"
                  >
                    <div className="w-20 h-28 relative">
                      <Image
                        src={item.coverUrl || '/placeholder-manga.jpg'}
                        alt={item.mangaName}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  </Link>
                  
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <Link
                        href={`/manga/${item.mangaId}`}
                        className="font-semibold hover:text-primary transition-colors line-clamp-2"
                      >
                        {item.mangaName}
                      </Link>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Read {formatDate(item.lastReadAt)}</span>
                        </div>
                      </div>

                      {item.lastChapterName && item.lastChapterId && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="w-fit flex items-center gap-1">
                              <Book className="w-3 h-3" />
                              {item.lastChapterName}
                            </Badge>
                          </div>
                          {(() => {
                            const progress = getReadingProgress(item.mangaId, item.lastChapterId);
                            if (progress && progress.currentPage > 0) {
                              const percentage = Math.round((progress.currentPage / progress.totalPages) * 100);
                              return (
                                <div className="text-xs text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <span>Page {progress.currentPage}/{progress.totalPages}</span>
                                    <div className="flex-1 max-w-24">
                                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                        <div 
                                          className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                                          style={{ width: `${percentage}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    <span className="font-medium">{percentage}%</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex gap-2">
                        {item.lastChapterId && (
                          <Link href={`/read/${item.mangaId}/${item.lastChapterId}`}>
                            <Button size="sm" className="flex items-center gap-1">
                              <Play className="w-3 h-3" />
                              Continue
                            </Button>
                          </Link>
                        )}
                        <Link href={`/manga/${item.mangaId}`}>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </Link>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromHistory(item.mangaId)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return <HistoryList items={history} />;
}