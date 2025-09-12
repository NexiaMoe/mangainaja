'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User, Tag, Languages } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { MangaSearchResult } from '@/types/manga';

interface MangaCardProps {
  manga: MangaSearchResult;
}

export function MangaCard({ manga }: MangaCardProps) {
  const { id, data } = manga;

  return (
    <Link href={`/manga/${id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg">
        <div className="aspect-[3/4] relative">
          <Image
            src={data.urlCover300 || '/placeholder-manga.jpg'}
            alt={data.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Status and Language badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {data.uploadStatus && (
              <Badge
                variant="secondary"
                className="text-xs px-2 py-1 whitespace-nowrap"
              >
                {data.uploadStatus}
              </Badge>
            )}
            
            {/* Show translation language if available, otherwise show original language */}
            {(data.tranLang || data.origLang) && (
              <Badge
                variant={data.tranLang ? "default" : "outline"}
                className={`text-xs px-2 py-1 whitespace-nowrap ${
                  data.tranLang 
                    ? "bg-primary/90 text-primary-foreground" 
                    : "border-primary text-primary"
                }`}
              >
                <Languages className="w-3 h-3 mr-1 inline" />
                {(data.tranLang || data.origLang || 'N/A').toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
        
        <CardContent className="p-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
              {data.name}
            </h3>
            
            {data.authors && data.authors.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="line-clamp-1">{data.authors[0]}</span>
              </div>
            )}
            
            {data.datePublic && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>{formatDate(data.datePublic)}</span>
              </div>
            )}
            
            {data.genres && data.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {data.genres.slice(0, 2).map((genre) => (
                  <Badge
                    key={genre}
                    variant="outline"
                    className="text-xs px-1.5 py-0.5 h-5"
                  >
                    {genre}
                  </Badge>
                ))}
                {data.genres.length > 2 && (
                  <Badge
                    variant="outline"
                    className="text-xs px-1.5 py-0.5 h-5"
                  >
                    +{data.genres.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}