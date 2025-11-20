'use client';

import { memo, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReadingDirection, PageTransition } from '@/stores/reader-store';
import type { ChapterNode } from '@/types/manga';

interface ReaderPagesProps {
  images: string[];
  currentPage: number;
  totalPages: number;
  onPageClick: (side: 'left' | 'right') => void;
  onCenterClick?: () => void;
  onPageChange?: (page: number) => void;
  readingDirection: ReadingDirection;
  pageTransition: PageTransition;
  nextChapter?: ChapterNode;
  onNextChapter?: () => void;
  prevChapter?: ChapterNode;
  onPrevChapter?: () => void;
}

function ReaderPagesComponent({
  images,
  currentPage,
  totalPages,
  onPageClick,
  onCenterClick,
  readingDirection,
  pageTransition,
  nextChapter,
  onNextChapter,
  prevChapter,
  onPrevChapter,
}: ReaderPagesProps) {
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [imageDecoded, setImageDecoded] = useState<Record<number, boolean>>({});
  const preloadedImages = useRef<Record<string, HTMLImageElement>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const preloadAbortControllers = useRef<Record<string, AbortController>>({});
  const maxCacheSize = useRef(20);

  const currentImage = images[currentPage - 1];
  const [visibleImage, setVisibleImage] = useState<string>(currentImage);

  // Handle smooth page transitions
  useEffect(() => {
    if (currentImage && currentImage !== visibleImage) {
      // If the image is preloaded, show it immediately
      if (preloadedImages.current[currentImage]) {
        setVisibleImage(currentImage);
      } else {
        // If not preloaded, show it after a short delay to allow loading
        const timer = setTimeout(() => {
          setVisibleImage(currentImage);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [currentImage, visibleImage]);

  // Optimize preloading with bounded cache
  useEffect(() => {
    const maxPreload = 5;
    const preloadRange = 2; // 2 pages before/after current
    const preloadIndices = new Set<number>();

    // Always preload current page
    if (currentPage >= 1 && currentPage <= totalPages) {
      preloadIndices.add(currentPage - 1);
    }

    // Preload nearby pages (limit total to maxPreload)
    const nearbyPages = [];

    // Previous pages (up to preloadRange)
    for (let i = 1; i <= preloadRange && nearbyPages.length < maxPreload; i++) {
      const pageIndex = currentPage - i - 1;
      if (pageIndex >= 0 && pageIndex < images.length) {
        nearbyPages.push(pageIndex);
      }
    }

    // Next pages (up to preloadRange)
    for (let i = 1; i <= preloadRange && nearbyPages.length < maxPreload; i++) {
      const pageIndex = currentPage + i - 1;
      if (pageIndex >= 0 && pageIndex < images.length) {
        nearbyPages.push(pageIndex);
      }
    }

    // Add nearby pages if we haven't reached maxPreload
    nearbyPages.slice(0, maxPreload - preloadIndices.size).forEach(index => {
      preloadIndices.add(index);
    });

    // Cancel preloads for pages no longer needed
    Object.keys(preloadAbortControllers.current).forEach(url => {
      const pageIndex = images.indexOf(url);
      if (pageIndex === -1 || !preloadIndices.has(pageIndex)) {
        preloadAbortControllers.current[url].abort();
        delete preloadAbortControllers.current[url];
      }
    });

    // Preload images
    preloadIndices.forEach(index => {
      const pageNum = index + 1;
      if (images[index] && !preloadedImages.current[images[index]] && !imageErrors[pageNum]) {
        // Create abort controller for this preload
        if (!preloadAbortControllers.current[images[index]]) {
          preloadAbortControllers.current[images[index]] = new AbortController();
        }

        const img = new window.Image();
        img.onload = () => {
          preloadedImages.current[images[index]] = img;
          setImageLoading(prev => ({ ...prev, [pageNum]: false }));
          setImageDecoded(prev => ({ ...prev, [pageNum]: true }));

          // Maintain bounded cache size
          const cacheSize = Object.keys(preloadedImages.current).length;
          if (cacheSize > maxCacheSize.current) {
            // Remove oldest entries (simple FIFO)
            const keys = Object.keys(preloadedImages.current);
            delete preloadedImages.current[keys[0]];
          }
        };
        img.onerror = () => {
          setImageErrors(prev => ({ ...prev, [pageNum]: true }));
          setImageLoading(prev => ({ ...prev, [pageNum]: false }));
        };

        img.onabort = () => {
          setImageLoading(prev => ({ ...prev, [pageNum]: false }));
        };

        img.src = images[index];
        setImageLoading(prev => ({ ...prev, [pageNum]: true }));
      }
    });

    // Cleanup - capture the controllers to avoid ref change warning
    const controllersToAbort = { ...preloadAbortControllers.current };
    return () => {
      Object.values(controllersToAbort).forEach(controller => {
        controller.abort();
      });
    };
  }, [currentPage, images, totalPages, imageErrors]);

  const handleClick = useCallback((event: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const width = rect.width;

    // Three zones: left 33%, center 34%, right 33%
    const leftZoneEnd = width * (1 / 3);
    const rightZoneStart = width * (2 / 3);

    if (x < leftZoneEnd) {
      // Left zone - previous page (no UI toggle)
      onPageClick('left');
    } else if (x >= rightZoneStart) {
      // Right zone - next page (no UI toggle)
      onPageClick('right');
    } else {
      // Center zone - toggle UI only
      if (onCenterClick) {
        onCenterClick();
      }
    }
  }, [onPageClick, onCenterClick]);

  const handleImageLoad = useCallback((page: number) => {
    setImageLoading(prev => ({ ...prev, [page]: false }));
  }, []);

  const handleImageError = useCallback((page: number) => {
    setImageErrors(prev => ({ ...prev, [page]: true }));
    setImageLoading(prev => ({ ...prev, [page]: false }));
  }, []);

  // Memoize the shimmer placeholder
  const ShimmerPlaceholder = useMemo(() => (
    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer" />
  ), []);

  if (!currentImage) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white">
          <p className="text-lg mb-2">Page not found</p>
          <p className="text-sm text-white/70">
            Page {currentPage} of {totalPages}
          </p>
        </div>
      </div>
    );
  }

  // Show next chapter button when on last page and next chapter exists
  const showNextChapterButton = currentPage === totalPages && nextChapter && onNextChapter;

  // Show previous chapter button when on first page and previous chapter exists
  const showPrevChapterButton = currentPage === 1 && prevChapter && onPrevChapter;

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Previous Chapter Button - Below top controls */}
      {showPrevChapterButton && (
        <div className="absolute top-16 left-0 right-0 p-4 z-40">
          <div className="flex justify-center">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (onPrevChapter) {
                  onPrevChapter();
                }
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (onPrevChapter) {
                  onPrevChapter();
                }
              }}
              size="sm"
              className="bg-secondary/90 hover:bg-secondary text-secondary-foreground px-4 py-2 rounded-md shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation select-none text-sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev: {prevChapter.data.dname.length > 20 ? prevChapter.data.dname.substring(0, 20) + '...' : prevChapter.data.dname}
            </Button>
          </div>
        </div>
      )}

      {/* Main Reader Content */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center cursor-pointer"
        onClick={handleClick}
      >
        {/* Loading indicator */}
        {imageLoading[currentPage] && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <LoadingSpinner size="large" />
          </div>
        )}

        {/* Error state */}
        {imageErrors[currentPage] && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <p className="text-lg mb-2">Failed to load image</p>
              <p className="text-sm text-white/70">
                Page {currentPage} of {totalPages}
              </p>
            </div>
          </div>
        )}

        {/* Main image container */}
        <div
          className={cn(
            'relative max-w-full max-h-full',
            pageTransition === 'fade' && 'transition-opacity duration-200 ease-in-out',
            pageTransition === 'slide' && 'transition-transform duration-300 ease-in-out'
          )}
        >
          {/* Shimmer placeholder while image is loading */}
          {imageLoading[currentPage] && !imageErrors[currentPage] && (
            <div className="absolute inset-0 max-w-[100vw] max-h-[100vh]">
              {ShimmerPlaceholder}
            </div>
          )}

          <img
            key={`image-${visibleImage}`}
            src={visibleImage}
            alt={`Page ${currentPage}`}
            className={cn(
              "w-full h-full object-contain",
              // Desktop: fit to viewport while maintaining aspect ratio
              "max-w-[100vw] max-h-[100vh] mx-auto",
              // Mobile: full width with proper scaling
              "sm:max-w-none sm:h-[100vh] sm:object-cover sm:object-center",
              "opacity-100 transition-opacity duration-200",
              imageDecoded[currentPage] && 'animate-blur-up'
            )}
            loading={currentPage <= 2 ? "eager" : "lazy"}
            onLoad={() => handleImageLoad(currentPage)}
            onError={() => handleImageError(currentPage)}
            style={{
              transform: readingDirection === 'rtl' ? 'scaleX(-1)' : 'none',
              willChange: 'opacity',
            }}
            fetchPriority={currentPage <= 2 ? 'high' : 'low'}
          />
        </div>

        {/* No debug overlays in production */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <div className="absolute left-0 w-[1px] h-full  pointer-events-none z-50" />
            <div className="absolute left-[33%] w-[1px] h-full  pointer-events-none z-50" />
            <div className="absolute left-[66%] w-[1px] h-full  pointer-events-none z-50" />
            <div className="absolute left-[1px] w-[1px] h-full  pointer-events-none z-50" />
          </>
        )}
      </div>

      {/* Next Chapter Button - Above bottom controls */}
      {showNextChapterButton && (
        <div className="absolute bottom-16 left-0 right-0 p-4 z-40">
          <div className="flex justify-center">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (onNextChapter) {
                  onNextChapter();
                }
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (onNextChapter) {
                  onNextChapter();
                }
              }}
              size="sm"
              className="bg-primary/90 hover:bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation select-none text-sm"
            >
              Next: {nextChapter.data.dname.length > 20 ? nextChapter.data.dname.substring(0, 20) + '...' : nextChapter.data.dname}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export const ReaderPages = memo(ReaderPagesComponent);
