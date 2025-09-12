'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PaginationState {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  resetPage: () => void;
}

export const usePaginationStore = create<PaginationState>()(
  persist(
    (set) => ({
      currentPage: 1,
      setCurrentPage: (page) => set({ currentPage: page }),
      resetPage: () => set({ currentPage: 1 }),
    }),
    {
      name: 'pagination-storage',
    }
  )
);