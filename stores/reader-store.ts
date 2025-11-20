import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReadingDirection = 'ltr' | 'rtl';
export type PageTransition = 'slide' | 'fade' | 'none';
export type NavigationMethod = 'click' | 'keyboard' | 'both';
export type FitMode = 'screen' | 'width';

interface ReaderStore {
  // Reading state
  currentPage: number;
  showControls: boolean;
  
  // Settings
  readingDirection: ReadingDirection;
  pageTransition: PageTransition;
  navigationMethod: NavigationMethod;
  autoHideControls: boolean;
  preloadPages: number;
  imageQuality: 'low' | 'medium' | 'high';
  fitMode: FitMode;
  
  // Actions
  setCurrentPage: (page: number) => void;
  setShowControls: (show: boolean) => void;
  setReadingDirection: (direction: ReadingDirection) => void;
  setPageTransition: (transition: PageTransition) => void;
  setNavigationMethod: (method: NavigationMethod) => void;
  setAutoHideControls: (autoHide: boolean) => void;
  setPreloadPages: (count: number) => void;
  setImageQuality: (quality: 'low' | 'medium' | 'high') => void;
  setFitMode: (mode: FitMode) => void;
  resetReaderSettings: () => void;
}

const defaultSettings = {
  readingDirection: 'ltr' as ReadingDirection,
  pageTransition: 'slide' as PageTransition,
  navigationMethod: 'both' as NavigationMethod,
  autoHideControls: true,
  preloadPages: 3,
  imageQuality: 'high' as const,
  fitMode: 'screen' as FitMode,
};

export const useReaderStore = create<ReaderStore>()(
  persist(
    (set) => ({
      // Reading state (not persisted)
      currentPage: 1,
      showControls: false,
      
      // Settings (persisted)
      ...defaultSettings,
      
      // Actions
      setCurrentPage: (page) => set({ currentPage: page }),
      setShowControls: (show) => set({ showControls: show }),
      setReadingDirection: (direction) => set({ readingDirection: direction }),
      setPageTransition: (transition) => set({ pageTransition: transition }),
      setNavigationMethod: (method) => set({ navigationMethod: method }),
      setAutoHideControls: (autoHide) => set({ autoHideControls: autoHide }),
      setPreloadPages: (count) => set({ preloadPages: count }),
      setImageQuality: (quality) => set({ imageQuality: quality }),
      setFitMode: (mode) => set({ fitMode: mode }),
      resetReaderSettings: () => set(defaultSettings),
    }),
    {
      name: 'manga-reader-store',
      // Only persist settings, not reading state
      partialize: (state) => ({
        readingDirection: state.readingDirection,
        pageTransition: state.pageTransition,
        navigationMethod: state.navigationMethod,
        autoHideControls: state.autoHideControls,
        preloadPages: state.preloadPages,
        imageQuality: state.imageQuality,
        fitMode: state.fitMode,
      }),
    }
  )
);