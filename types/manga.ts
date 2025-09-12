export interface MangaSearchResult {
  id: string;
  data: {
    name: string;
    slug: string;
    authors: string[];
    artists: string[];
    genres: string[];
    urlCover300: string;
    dateCreate: number;
    datePublic: number;
    uploadStatus: string;
    originalStatus: string;
    origLang?: string;
    tranLang?: string;
  };
}

export interface MangaNode {
  id: string;
  data: {
    name: string;
    slug: string;
    authors: string[];
    artists: string[];
    genres: string[];
    summary?: {
      text: string;
    };
    urlCover300: string;
    urlCover600?: string;
    urlCoverOri?: string;
    dateCreate: number;
    datePublic: number;
    dateModify: number;
    origLang: string;
    tranLang: string;
    readDirection: string;
    uploadStatus: string;
    originalStatus: string;
  };
  last_chapterNodes: ChapterNode[];
}

export interface ChapterNode {
  id: string;
  data: {
    dname: string;
    title?: string;
    urlPath: string;
    chaNum: number;
    volNum: number;
    dateCreate: number;
    datePublic: number;
    count_images: number;
    comicId?: string;
    dbStatus?: string;
    isNormal?: boolean;
    isHidden?: boolean;
    isDeleted?: boolean;
    isFinal?: boolean;
    userId?: string;
    imageFiles?: string[];
  };
}

export interface ReadingHistoryItem {
  mangaId: string;
  mangaName: string;
  mangaSlug: string;
  coverUrl: string;
  lastReadAt: number;
  lastChapterId?: string;
  lastChapterName?: string;
}

export interface ReadingProgress {
  currentPage: number;
  totalPages: number;
  lastReadAt: number;
}

export interface BookmarkItem {
  mangaId: string;
  mangaName: string;
  mangaSlug: string;
  coverUrl: string;
  bookmarkedAt: number;
}