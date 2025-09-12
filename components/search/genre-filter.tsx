'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSearchStore } from '@/stores/search-store';
import { CATEGORIZED_GENRES } from '@/lib/constants';
import { GenreOption, cn } from '@/lib/utils';

interface CategorySectionProps {
  title: string;
  genres: GenreOption[];
  selectedGenres: string[];
  toggleGenre: (genre: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function CategorySection({ title, genres, selectedGenres, toggleGenre, isOpen, onToggle }: CategorySectionProps) {
  const categorySelected = genres.filter(g => selectedGenres.includes(g.value)).length;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="space-y-0 border border-border rounded-lg overflow-hidden shadow-sm">
      {/* Header - CollapsibleTrigger */}
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-4 bg-card hover:bg-card/80 transition-colors cursor-pointer">
          <div className="flex items-center gap-2 flex-1">
            <span className="font-medium text-foreground">{title}</span>
            <span className={`text-sm ${categorySelected > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
              ({categorySelected})
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      {/* Content */}
      <CollapsibleContent className="space-y-0">
        {/* Selected Genres Chips */}
        {categorySelected > 0 && (
          <div className="px-4 pt-2 pb-3 bg-muted/50 border-t border-border/50">
            <div className="flex flex-wrap gap-1.5">
              {genres
                .filter(g => selectedGenres.includes(g.value))
                .map((genre) => (
                  <Badge
                    key={genre.value}
                    variant="default"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-all text-xs px-2 py-0.5"
                    onClick={() => toggleGenre(genre.value)}
                  >
                    {genre.label}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {/* Clear Button for Category */}
        {categorySelected > 0 && (
          <div className="px-4 pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                genres.filter(g => selectedGenres.includes(g.value)).forEach(g => toggleGenre(g.value));
              }}
              className="h-8 w-full justify-start text-muted-foreground hover:text-foreground hover:bg-destructive/10 transition-colors text-xs"
            >
              Clear {categorySelected} {title.toLowerCase()} ({categorySelected})
            </Button>
          </div>
        )}

        {/* Genre Grid */}
        <div className="p-6 border-t border-border/50">
          <div className={`grid gap-3 ${
            genres.length <= 4 ? 'grid-cols-2' :
            genres.length <= 8 ? 'grid-cols-3' :
            genres.length <= 12 ? 'grid-cols-4' :
            'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
          }`}>
            {genres.map((genre) => (
              <Button
                key={genre.value}
                variant={selectedGenres.includes(genre.value) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleGenre(genre.value)}
                className={cn(
                  "h-12 justify-start text-sm font-medium transition-all duration-200 py-2",
                  selectedGenres.includes(genre.value)
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                    : "hover:bg-accent hover:text-accent-foreground border-border"
                )}
              >
                <span className="truncate">{genre.label}</span>
              </Button>
            ))}
          </div>
          
          {/* Show count for large categories */}
          {genres.length > 20 && (
            <div className="mt-4 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                {genres.length} {title.toLowerCase()} available
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function GenreFilter() {
  const {
    selectedGenres, toggleGenre, clearGenres,
    selectedOrigLangs, toggleOrigLang, clearLanguages,
    selectedTranLangs, toggleTranLang,
    sortBy, setSortBy,
    isFilterOpen, setFilterOpen,
    categoryStates, toggleCategory
  } = useSearchStore();

  const sortOptions = [
    { value: 'field_upload', label: 'Latest Upload' },
    { value: 'field_score', label: 'Rating' },
    { value: 'field_follow', label: 'Most Follows' },
    { value: 'field_chapter', label: 'Most Chapters' },
    { value: 'field_name', label: 'Name A-Z' },
  ];

  // Language options (ISO codes)
  const languageOptions = [
    { value: 'ja', label: 'Japanese (ja)' },
    { value: 'ko', label: 'Korean (ko)' },
    { value: 'zh', label: 'Chinese (zh)' },
    { value: 'en', label: 'English (en)' },
    { value: 'es', label: 'Spanish (es)' },
    { value: 'fr', label: 'French (fr)' },
    { value: 'de', label: 'German (de)' },
    { value: 'id', label: 'Indonesian (id)' },
    { value: 'th', label: 'Thai (th)' },
    { value: 'vi', label: 'Vietnamese (vi)' },
  ];

  // Overall selected count for header
  const totalSelected = selectedGenres.length + selectedOrigLangs.length + selectedTranLangs.length;

  return (
    <div className="border border-border rounded-lg shadow-sm overflow-hidden">
      <Collapsible open={isFilterOpen} onOpenChange={setFilterOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between w-full p-4 bg-card border-b border-border cursor-pointer hover:bg-card/80 transition-colors">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-foreground">Genre Filter</h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                totalSelected > 0
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {totalSelected}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {totalSelected > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearGenres();
                    clearLanguages();
                  }}
                  className="h-8 px-3 border-destructive text-destructive hover:bg-destructive/5 text-xs"
                >
                  Clear All ({totalSelected})
                </Button>
              )}
              
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  isFilterOpen && "rotate-180"
                )}
              />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-6 p-4">
          {/* Sort Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Sort Results
            </h3>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={sortBy === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy(option.value)}
                  className={cn(
                    "text-xs font-medium h-9 px-3 transition-all duration-200",
                    sortBy === option.value
                      ? "shadow-md"
                      : "hover:shadow-sm hover:border-primary/50"
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Genre Categories */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              Genres ({selectedGenres.length})
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Manga Types & Demographics */}
              <div className="space-y-4">
                <CategorySection
                  title="Manga Types"
                  genres={CATEGORIZED_GENRES.mangaTypes}
                  selectedGenres={selectedGenres}
                  toggleGenre={toggleGenre}
                  isOpen={categoryStates.mangaTypes}
                  onToggle={() => toggleCategory('mangaTypes')}
                />
                
                <CategorySection
                  title="Demographics"
                  genres={CATEGORIZED_GENRES.demographics}
                  selectedGenres={selectedGenres}
                  toggleGenre={toggleGenre}
                  isOpen={categoryStates.demographics}
                  onToggle={() => toggleCategory('demographics')}
                />
              </div>

              {/* Right Column: Main Genres & Other */}
              <div className="space-y-4">
                <CategorySection
                  title="Main Genres"
                  genres={CATEGORIZED_GENRES.genres}
                  selectedGenres={selectedGenres}
                  toggleGenre={toggleGenre}
                  isOpen={categoryStates.mainGenres}
                  onToggle={() => toggleCategory('mainGenres')}
                />
                
                <CategorySection
                  title="Other"
                  genres={CATEGORIZED_GENRES.other}
                  selectedGenres={selectedGenres}
                  toggleGenre={toggleGenre}
                  isOpen={categoryStates.other}
                  onToggle={() => toggleCategory('other')}
                />
              </div>
            </div>
          </div>

          {/* Language Filters */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              Languages ({selectedOrigLangs.length + selectedTranLangs.length})
            </h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CategorySection
                  title="Original Language"
                  genres={languageOptions}
                  selectedGenres={selectedOrigLangs}
                  toggleGenre={toggleOrigLang}
                  isOpen={categoryStates.originalLanguage}
                  onToggle={() => toggleCategory('originalLanguage')}
                />
                
                <CategorySection
                  title="Translation Language"
                  genres={languageOptions}
                  selectedGenres={selectedTranLangs}
                  toggleGenre={toggleTranLang}
                  isOpen={categoryStates.translationLanguage}
                  onToggle={() => toggleCategory('translationLanguage')}
                />
              </div>
              
              {(selectedOrigLangs.length > 0 || selectedTranLangs.length > 0) && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearLanguages}
                    className="border-destructive text-destructive hover:bg-destructive/5 w-full"
                  >
                    Clear Languages ({selectedOrigLangs.length + selectedTranLangs.length})
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}