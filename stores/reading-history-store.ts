import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReadingHistoryItem, ReadingProgress, BookmarkItem } from '@/types/manga';

interface ReadingHistoryStore {
  history: ReadingHistoryItem[];
  progress: Record<string, Record<string, ReadingProgress>>; // mangaId -> chapterId -> progress
  bookmarks: BookmarkItem[];
  
  // History methods
  addToHistory: (item: ReadingHistoryItem) => void;
  getHistory: () => ReadingHistoryItem[];
  clearHistory: () => void;
  removeFromHistory: (mangaId: string) => void;
  
  // Progress methods
  updateReadingProgress: (mangaId: string, chapterId: string, progress: ReadingProgress) => void;
  getReadingProgress: (mangaId: string, chapterId: string) => ReadingProgress | null;
  
  // Bookmarks methods
  toggleBookmark: (bookmark: Omit<BookmarkItem, 'bookmarkedAt'>) => void;
  isBookmarked: (mangaId: string) => boolean;
  getBookmarks: () => BookmarkItem[];
  removeBookmark: (mangaId: string) => void;
}

export const useReadingHistoryStore = create<ReadingHistoryStore>()(
  persist(
    (set, get) => ({
      history: [],
      progress: {},
      bookmarks: [],
      
      addToHistory: (item) => set((state) => {
        const existingIndex = state.history.findIndex(h => h.mangaId === item.mangaId);
        const updatedHistory = [...state.history];
        
        if (existingIndex >= 0) {
          // Update existing entry and move to front
          updatedHistory[existingIndex] = { ...updatedHistory[existingIndex], ...item };
          updatedHistory.unshift(updatedHistory.splice(existingIndex, 1)[0]);
        } else {
          // Add new entry to front
          updatedHistory.unshift(item);
        }
        
        // Keep only the latest 100 items
        return { history: updatedHistory.slice(0, 100) };
      }),
      
      getHistory: () => get().history,
      
      clearHistory: () => set({ history: [] }),
      
      removeFromHistory: (mangaId) => set((state) => ({
        history: state.history.filter(item => item.mangaId !== mangaId)
      })),
      
      updateReadingProgress: (mangaId, chapterId, progress) => set((state) => ({
        progress: {
          ...state.progress,
          [mangaId]: {
            ...state.progress[mangaId],
            [chapterId]: progress
          }
        }
      })),
      
      getReadingProgress: (mangaId, chapterId) => {
        const state = get();
        return state.progress[mangaId]?.[chapterId] || null;
      },
      
      toggleBookmark: (bookmark) => set((state) => {
        const isCurrentlyBookmarked = state.bookmarks.some(b => b.mangaId === bookmark.mangaId);
        
        if (isCurrentlyBookmarked) {
          return {
            bookmarks: state.bookmarks.filter(b => b.mangaId !== bookmark.mangaId)
          };
        } else {
          return {
            bookmarks: [...state.bookmarks, { ...bookmark, bookmarkedAt: Date.now() }]
          };
        }
      }),
      
      isBookmarked: (mangaId) => {
        const state = get();
        return state.bookmarks.some(b => b.mangaId === mangaId);
      },
      
      getBookmarks: () => get().bookmarks,
      
      removeBookmark: (mangaId) => set((state) => ({
        bookmarks: state.bookmarks.filter(b => b.mangaId !== mangaId)
      })),
    }),
    {
      name: 'manga-reading-history-store',
      version: 1,
    }
  )
);