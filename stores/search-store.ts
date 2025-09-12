import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SearchStore {
  searchTerm: string;
  selectedGenres: string[];
  selectedOrigLangs: string[];
  selectedTranLangs: string[];
  sortBy: string;
  
  // UI State for collapsibles
  isFilterOpen: boolean;
  categoryStates: Record<string, boolean>;
  
  // Hydration state
  isHydrated: boolean;
  
  setSearchTerm: (term: string) => void;
  toggleGenre: (genre: string) => void;
  toggleOrigLang: (lang: string) => void;
  toggleTranLang: (lang: string) => void;
  clearGenres: () => void;
  clearLanguages: () => void;
  setSortBy: (sortBy: string) => void;
  
  // Collapsible actions
  setFilterOpen: (open: boolean) => void;
  toggleCategory: (categoryKey: string) => void;
  
  clearAll: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useSearchStore = create<SearchStore>()(
  persist(
    (set) => ({
      searchTerm: '',
      selectedGenres: [],
      selectedOrigLangs: [],
      selectedTranLangs: [],
      sortBy: 'field_upload',
      
      // UI State for collapsibles - default all open
      isFilterOpen: true,
      categoryStates: {
        mangaTypes: true,
        demographics: true,
        mainGenres: true,
        other: true,
        originalLanguage: true,
        translationLanguage: true,
      },
      
      // Hydration state - starts false
      isHydrated: false,
      
      setSearchTerm: (term) => set({ searchTerm: term }),
      
      toggleGenre: (genre) => set((state) => ({
        selectedGenres: state.selectedGenres.includes(genre)
          ? state.selectedGenres.filter(g => g !== genre)
          : [...state.selectedGenres, genre]
      })),
      
      toggleOrigLang: (lang) => set((state) => ({
        selectedOrigLangs: state.selectedOrigLangs.includes(lang)
          ? state.selectedOrigLangs.filter(l => l !== lang)
          : [...state.selectedOrigLangs, lang]
      })),
      
      toggleTranLang: (lang) => set((state) => ({
        selectedTranLangs: state.selectedTranLangs.includes(lang)
          ? state.selectedTranLangs.filter(l => l !== lang)
          : [...state.selectedTranLangs, lang]
      })),
      
      clearGenres: () => set({ selectedGenres: [] }),
      
      clearLanguages: () => set({
        selectedOrigLangs: [],
        selectedTranLangs: []
      }),
      
      setSortBy: (sortBy) => set({ sortBy }),
      
      // Collapsible actions
      setFilterOpen: (open) => set({ isFilterOpen: open }),
      
      toggleCategory: (categoryKey) => set((state) => ({
        categoryStates: {
          ...state.categoryStates,
          [categoryKey]: !state.categoryStates[categoryKey]
        }
      })),
      
      clearAll: () => set({
        searchTerm: '',
        selectedGenres: [],
        selectedOrigLangs: [],
        selectedTranLangs: [],
        sortBy: 'field_upload',
        // Reset UI states to default (all open)
        isFilterOpen: true,
        categoryStates: {
          mangaTypes: true,
          demographics: true,
          mainGenres: true,
          other: true,
          originalLanguage: true,
          translationLanguage: true,
        }
      }),
      
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: 'manga-search-store',
      onRehydrateStorage: () => (state) => {
        // Set hydrated to true after rehydration completes
        state?.setHydrated(true);
      },
    }
  )
);