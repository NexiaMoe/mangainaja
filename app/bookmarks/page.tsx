'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Trash2, BookOpen, Heart } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useReadingHistoryStore } from '@/stores/reading-history-store';

export default function BookmarksPage() {
  const { getBookmarks, removeBookmark } = useReadingHistoryStore();
  const bookmarks = getBookmarks();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500" />
              Bookmarks
            </h1>
            <p className="text-muted-foreground mt-2">
              Your favorite manga collection
            </p>
          </div>

          {bookmarks.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
              <h2 className="text-2xl font-semibold mb-2">No bookmarks yet</h2>
              <p className="text-muted-foreground mb-6">
                Bookmark manga from their detail pages to keep track of your favorites
              </p>
              <Link href="/">
                <Button>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse Manga
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {bookmarks.map((item) => (
                <Card key={item.mangaId} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex">
                      <Link 
                        href={`/manga/${item.mangaId}`}
                        className="block flex-shrink-0"
                      >
                        <div className="w-24 h-32 relative">
                          <Image
                            src={item.coverUrl || '/placeholder-manga.jpg'}
                            alt={item.mangaName}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>
                      </Link>
                      
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <Link
                            href={`/manga/${item.mangaId}`}
                            className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2"
                          >
                            {item.mangaName}
                          </Link>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Bookmarked {formatDate(item.bookmarkedAt)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <Link href={`/manga/${item.mangaId}`}>
                            <Button>
                              <BookOpen className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBookmark(item.mangaId)}
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
          )}
        </div>
      </main>
    </div>
  );
}