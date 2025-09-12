'use client';

import { useChapterUpdates } from '@/hooks/use-chapter-updates';

export function ChapterUpdateChecker() {
  // Enable chapter update checking with default interval (5 minutes)
  useChapterUpdates({
    enabled: true,
    checkInterval: 300000, // 5 minutes
  });

  // This component doesn't render anything visible
  // It just enables the background checking for chapter updates
  return null;
}