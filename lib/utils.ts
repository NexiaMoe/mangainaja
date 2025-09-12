import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import genresData from '../genre.json';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date from string or timestamp to readable format
 * Handles both YYYY-MM-DD strings and Unix timestamps (numbers)
 * e.g., "2023-05-15" or 1684099200000 -> "May 15, 2023"
 */
export function formatDate(dateInput: string | number | null | undefined): string {
  if (!dateInput) return '';
  
  try {
    let date: Date;
    
    if (typeof dateInput === 'number') {
      // Handle Unix timestamp (milliseconds)
      date = new Date(dateInput);
    } else if (typeof dateInput === 'string') {
      // Handle ISO date string
      date = new Date(dateInput);
    } else {
      return '';
    }
    
    if (isNaN(date.getTime())) return String(dateInput);
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.warn('Invalid date format:', dateInput);
    return String(dateInput);
  }
}

// Genre categorization helper
interface GenreEntry {
  file: string;
  text: string;
  sort: number;
  tips?: string;
}

export interface GenreOption {
  value: string;
  label: string;
  tips?: string;
}

export interface CategorizedGenres {
  mangaTypes: GenreOption[];
  demographics: GenreOption[];
  genres: GenreOption[];
  other: GenreOption[];
}

export function getCategorizedGenres(): CategorizedGenres {

  const data = genresData as {
    mangaTypes: Record<string, GenreEntry>;
    demographics: Record<string, GenreEntry>;
    genres: Record<string, GenreEntry>;
    other: Record<string, GenreEntry>;
  };

  const convertToOptions = (category: Record<string, GenreEntry>): GenreOption[] => {
    const options = Object.values(category)
      .map((entry): GenreOption => ({
        value: entry.file,
        label: entry.text,
        tips: entry.tips,
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
    

    
    return options;
  };

  const result = {
    mangaTypes: convertToOptions(data.mangaTypes),
    demographics: convertToOptions(data.demographics),
    genres: convertToOptions(data.genres),
    other: convertToOptions(data.other),
  };



  return result;
}

// Legacy flat genres for backward compatibility (combine all categories)
export function getAllGenres(): GenreOption[] {
  const categorized = getCategorizedGenres();
  return [
    ...categorized.mangaTypes,
    ...categorized.demographics,
    ...categorized.genres,
    ...categorized.other,
  ].sort((a, b) => a.label.localeCompare(b.label));
}
