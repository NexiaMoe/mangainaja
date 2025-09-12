import type { MangaSearchResult, MangaNode, ChapterNode } from './manga';

// Re-export types that are used by other modules
export type { MangaSearchResult, MangaNode, ChapterNode };

export interface MangaSearchParams {
  searchTerm?: string;
  genres?: string[];
  origLangs?: string[];
  tranLangs?: string[];
  page?: number;
  size?: number;
  sortBy?: string;
}

export interface PagingInfo {
  total: number;
  pages: number;
  page: number;
  init: number;
  size: number;
  skip: number;
  limit: number;
}

export interface MangaSearchResponse {
  reqPage: number;
  reqSize: number;
  reqSort: string;
  reqWord: string;
  newPage: number;
  paging: PagingInfo;
  items: MangaSearchResult[];
}

export interface MangaDetailsResponse extends MangaNode {}

export interface ChapterListResponse extends Array<ChapterNode> {}

export interface ChapterDetailsResponse extends ChapterNode {}