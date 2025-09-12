'use client';

import { ChevronLeft, ChevronRight, Settings, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
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

export function ReaderControls({
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
  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 pointer-events-auto">
        <div className="flex items-center justify-between text-white">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold truncate">{chapter.data.dname}</h1>
            <p className="text-sm text-white/70">
              Page {currentPage} of {totalPages}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSettings}
            className="text-white hover:bg-white/20"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-auto">
        <div className="flex items-center gap-4 text-white">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            className="text-white hover:bg-white/20 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 space-y-2">
            <Slider
              value={[currentPage]}
              min={1}
              max={totalPages}
              step={1}
              onValueChange={([value]) => onPageChange(value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-white/70">
              <span>1</span>
              <span>{totalPages}</span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className="text-white hover:bg-white/20 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}