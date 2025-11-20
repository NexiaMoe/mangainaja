'use client';

import { memo, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useReaderStore } from '@/stores/reader-store';
import type { ReadingDirection, PageTransition, NavigationMethod } from '@/stores/reader-store';

interface ReaderSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ReaderSettingsComponent({ open, onOpenChange }: ReaderSettingsProps) {
  const {
    readingDirection,
    pageTransition,
    navigationMethod,
    autoHideControls,
    preloadPages,
    imageQuality,
    setReadingDirection,
    setPageTransition,
    setNavigationMethod,
    setAutoHideControls,
    setPreloadPages,
    setImageQuality,
    resetReaderSettings,
  } = useReaderStore();

  const handleReadingDirectionChange = useCallback((value: ReadingDirection) => {
    setReadingDirection(value);
  }, [setReadingDirection]);

  const handlePageTransitionChange = useCallback((value: PageTransition) => {
    setPageTransition(value);
  }, [setPageTransition]);

  const handleNavigationMethodChange = useCallback((value: NavigationMethod) => {
    setNavigationMethod(value);
  }, [setNavigationMethod]);

  const handleAutoHideChange = useCallback((checked: boolean) => {
    setAutoHideControls(checked);
  }, [setAutoHideControls]);

  const handleImageQualityChange = useCallback((value: 'low' | 'medium' | 'high') => {
    setImageQuality(value);
  }, [setImageQuality]);

  const handlePreloadPagesChange = useCallback(([value]: number[]) => {
    setPreloadPages(value);
  }, [setPreloadPages]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 bg-black text-white border-gray-800">
        <SheetHeader className="border-b border-gray-800 pb-4">
          <SheetTitle className="text-white">Reader Settings</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Reading Direction */}
          <div className="space-y-2">
            <Label htmlFor="reading-direction">Reading Direction</Label>
            <Select
              value={readingDirection}
              onValueChange={handleReadingDirectionChange}
            >
              <SelectTrigger className="bg-gray-900 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="ltr">Left to Right</SelectItem>
                <SelectItem value="rtl">Right to Left</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Page Transition */}
          <div className="space-y-2">
            <Label htmlFor="page-transition">Page Transition</Label>
            <Select
              value={pageTransition}
              onValueChange={handlePageTransitionChange}
            >
              <SelectTrigger className="bg-gray-900 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="slide">Slide</SelectItem>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Navigation Method */}
          <div className="space-y-2">
            <Label htmlFor="navigation-method">Navigation Method</Label>
            <Select
              value={navigationMethod}
              onValueChange={handleNavigationMethodChange}
            >
              <SelectTrigger className="bg-gray-900 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="click">Click Only</SelectItem>
                <SelectItem value="keyboard">Keyboard Only</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auto Hide Controls */}
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-hide-controls">Auto Hide Controls</Label>
            <Switch
              id="auto-hide-controls"
              checked={autoHideControls}
              onCheckedChange={handleAutoHideChange}
            />
          </div>

          {/* Image Quality */}
          <div className="space-y-2">
            <Label htmlFor="image-quality">Image Quality</Label>
            <Select
              value={imageQuality}
              onValueChange={handleImageQualityChange}
            >
              <SelectTrigger className="bg-gray-900 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="low">Low (Faster)</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High (Better Quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preload Pages */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label htmlFor="preload-pages">Preload Pages</Label>
              <span className="text-sm text-gray-400">{preloadPages}</span>
            </div>
            <Slider
              id="preload-pages"
              min={1}
              max={10}
              step={1}
              value={[preloadPages]}
              onValueChange={handlePreloadPagesChange}
              className="w-full"
            />
          </div>

          {/* Keyboard Shortcuts Info */}
          <div className="space-y-2 pt-4 border-t border-gray-800">
            <Label>Keyboard Shortcuts</Label>
            <div className="text-sm text-gray-400 space-y-1">
              <div>← / A: Previous page</div>
              <div>→ / D: Next page</div>
              <div>Space: Toggle controls</div>
              <div>S: Settings</div>
              <div>Esc: Exit reader</div>
            </div>
          </div>

          {/* Reset Settings */}
          <Button
            variant="outline"
            onClick={resetReaderSettings}
            className="w-full border-gray-700 hover:bg-gray-800"
          >
            Reset to Default
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const ReaderSettings = memo(ReaderSettingsComponent);
