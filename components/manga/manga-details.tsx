'use client';

import Image from 'next/image';
import { Calendar, User, Palette, Globe, Eye, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useReadingHistoryStore } from '@/stores/reading-history-store';
import type { MangaNode } from '@/types/manga';

interface MangaDetailsProps {
  manga: MangaNode | null;
}

export function MangaDetails({ manga }: MangaDetailsProps) {
  const { toggleBookmark, isBookmarked } = useReadingHistoryStore();
  
  if (!manga || !manga.data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Unable to load manga details
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const { id, data } = manga;

  const handleBookmarkToggle = () => {
    toggleBookmark({
      mangaId: id,
      mangaName: data.name,
      mangaSlug: data.slug,
      coverUrl: data.urlCover300,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-[300px_1fr] gap-6">
            {/* Cover Image */}
            <div className="space-y-4">
              <div className="aspect-[3/4] relative rounded-lg overflow-hidden">
                <Image
                  src={data.urlCover600 || data.urlCover300 || '/placeholder-manga.jpg'}
                  alt={data.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 300px"
                  priority
                />
              </div>
              
              <Button
                onClick={handleBookmarkToggle}
                variant={isBookmarked(id) ? 'default' : 'outline'}
                className={`w-full ${isBookmarked(id) ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
              >
                <Heart className={`w-4 h-4 mr-2 ${isBookmarked(id) ? 'fill-current' : ''}`} />
                {isBookmarked(id) ? 'Remove from Bookmarks' : 'Add to Bookmarks'}
              </Button>
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">{data.name}</h1>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {data.authors && data.authors.length > 0 && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>Author: {data.authors.join(', ')}</span>
                    </div>
                  )}
                  
                  {data.artists && data.artists.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Palette className="w-4 h-4" />
                      <span>Artist: {data.artists.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {data.datePublic && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Published: {formatDate(data.datePublic)}</span>
                    </div>
                  )}
                  
                  {data.origLang && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <span>Language: {data.origLang}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                {data.uploadStatus && (
                  <Badge variant="secondary">
                    Upload: {data.uploadStatus}
                  </Badge>
                )}
                {data.originalStatus && (
                  <Badge variant="outline">
                    Status: {data.originalStatus}
                  </Badge>
                )}
                {data.readDirection && (
                  <Badge variant="outline">
                    Direction: {data.readDirection}
                  </Badge>
                )}
              </div>

              {/* Genres */}
              {data.genres && data.genres.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Genres:</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.genres.map((genre) => (
                      <Badge key={genre} variant="outline">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {data.summary?.text && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Summary:</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {data.summary.text}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}