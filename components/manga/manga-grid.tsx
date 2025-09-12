'use client';

import { useMemo, useState, useEffect } from 'react';
import { MangaCard } from './manga-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import type { MangaSearchResult } from '@/types/manga';

interface MangaGridProps {
  manga: MangaSearchResult[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function MangaGrid({ manga, currentPage, totalPages, onPageChange, loading }: MangaGridProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Generate page numbers for pagination
  const pageNumbers = useMemo(() => {
    const pages = [];
    // Responsive max visible pages: 3 on mobile, 5 on desktop
    const maxVisiblePages = isMobile ? 3 : 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end page numbers
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're at the beginning or end
      if (currentPage <= 2) {
        endPage = Math.min(totalPages - 1, maxVisiblePages - 1);
      } else if (currentPage >= totalPages - 1) {
        startPage = Math.max(2, totalPages - (maxVisiblePages - 2));
      }
      
      // Add ellipsis if there's a gap
      if (startPage > 2) {
        pages.push('ellipsis');
      }
      
      // Add page numbers
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if there's a gap
      if (endPage < totalPages - 1) {
        pages.push('ellipsis');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [currentPage, totalPages, isMobile]);

  if (manga.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground mb-4">No manga found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search terms or filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative">
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 transition-opacity duration-200 ${loading ? 'opacity-50' : ''}`}>
          {manga.map((item) => (
            <MangaCard
              key={item.id}
              manga={item}
            />
          ))}
        </div>
        
        {/* Loading overlay for pagination changes */}
        {loading && (
          <div className="absolute inset-0 bg-background/30 flex items-center justify-center backdrop-blur-sm">
            <LoadingSpinner size="large" />
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                  className={currentPage === 1 || loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                >
                  {loading && currentPage > 1 ? <LoadingSpinner size="small" /> : undefined}
                </PaginationPrevious>
              </PaginationItem>
              
              {pageNumbers.map((page, index) => (
                <PaginationItem key={index}>
                  {page === 'ellipsis' ? (
                    <span className="flex h-10 w-10 items-center justify-center">...</span>
                  ) : (
                    <PaginationLink
                      onClick={() => !loading && onPageChange(page as number)}
                      isActive={currentPage === page}
                      className={loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    >
                      {loading && currentPage === page ? <LoadingSpinner size="small" /> : page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                  className={currentPage === totalPages || loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                >
                  {loading && currentPage < totalPages ? <LoadingSpinner size="small" /> : undefined}
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}