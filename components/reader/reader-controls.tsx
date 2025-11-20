'use client';

import { memo, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Settings, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useReaderStore } from '@/stores/reader-store';
import type { ChapterNode } from '@/types/manga';

interface ReaderControlsProps {
  visible: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onToggleSettings: () => void;
  onExit: () => void;
  chapter: ChapterNode;
}

function ReaderControlsComponent({
  visible,
  currentPage,
  totalPages,
  onPageChange,
  onPrevPage,
  onNextPage,
  onToggleSettings,
  onExit,
  chapter,
}: ReaderControlsProps) {
  const { fitMode, setFitMode } = useReaderStore();
  
  const pageDisplay = useMemo(
    () => `Page ${currentPage} of ${totalPages}`,
    [currentPage, totalPages]
  );

  const handleSliderChange = useCallback(([value]: number[]) => {
    onPageChange(value);
  }, [onPageChange]);

  const handleToggleFitMode = useCallback(() => {
    setFitMode(fitMode === 'screen' ? 'width' : 'screen');
  }, [fitMode, setFitMode]);

  return (
    <div
      className={cn(
        'reader-overlay absolute inset-0 pointer-events-none',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/70 to-transparent p-4 pointer-events-auto animate-slide-up">
        <div className="flex items-center justify-between text-white">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            className="text-white hover:bg-white/30 hover:shadow-lg active:shadow-md active:scale-95 transition-all duration-150"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1 text-center">
            <h1 className="text-base font-semibold truncate tracking-tight">{chapter.data.dname}</h1>
            <p className="text-xs text-white/60 tracking-wide mt-0.5">
              {pageDisplay}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFitMode}
              className="text-white hover:bg-white/30 hover:shadow-lg active:shadow-md active:scale-95 transition-all duration-150"
              aria-label={fitMode === 'screen' ? 'Switch to Fit to Width' : 'Switch to Fit to Screen'}
              title={fitMode === 'screen' ? 'Fit to Width' : 'Fit to Screen'}
            >
              {fitMode === 'screen' ? (
                <Maximize2 className="w-5 h-5" />
              ) : (
                <Minimize2 className="w-5 h-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSettings}
              className="text-white hover:bg-white/30 hover:shadow-lg active:shadow-md active:scale-95 transition-all duration-150"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 pointer-events-auto animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center gap-2 text-white">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            className="text-white hover:bg-white/30 hover:shadow-lg active:shadow-md active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1 space-y-2">
            <Slider
              value={[currentPage]}
              min={1}
              max={totalPages}
              step={1}
              onValueChange={handleSliderChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-white/50 tracking-wide">
              <span>1</span>
              <span>{totalPages}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className="text-white hover:bg-white/30 hover:shadow-lg active:shadow-md active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export const ReaderControls = memo(ReaderControlsComponent);