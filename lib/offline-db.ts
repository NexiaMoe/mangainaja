import Dexie, { Table } from 'dexie';

// Database Schema Types
export interface CachedChapter {
  id: string; // mangaId-chapterId
  mangaId: string;
  chapterId: string;
  mangaName: string;
  chapterName: string;
  metadata: {
    dname: string;
    title?: string;
    volNum: number;
    chaNum: number;
    count_images: number;
    imageFiles: string[];
    datePublic: string | number;
    urlPath: string;
  };
  cachedAt: Date;
  lastAccessed: Date;
  imageCount: number;
  totalSize: number;
  isFullyCached: boolean;
}

export interface StorageStats {
  id: number;
  totalUsed: number;
  lastCleanup: Date;
  cachePolicy: 'auto' | 'manual';
  maxStorageGB: number;
}

export interface CachedManga {
  id: string; // mangaId
  mangaId: string;
  title: string;
  summary: string;
  genres: string[];
  status: string;
  author: string;
  coverImage: string;
  alternativeTitles: string[];
  totalChapters: number;
  metadata: any; // Store full API response
  cachedAt: Date;
  lastAccessed: Date;
}

export interface OfflineSearchIndex {
  mangaId: string;
  mangaName: string;
  genres: string[];
  summary: string;
  searchTokens: string[];
  lastIndexed: Date;
}

export interface DownloadJob {
  id: string;
  mangaId: string;
  chapterId: string;
  mangaName?: string;
  priority: number;
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'failed';
  progress: number;
  estimatedSize: number;
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  retryCount: number;
}

export interface OfflineLibraryEntry {
  mangaId: string;
  mangaName: string;
  coverUrl: string;
  downloadedChapters: string[];
  totalChapters: number;
  totalSize: number;
  lastUpdated: Date;
  downloadedAt: Date;
}

// Dexie Database Class
export class OfflineDB extends Dexie {
  cachedChapters!: Table<CachedChapter>;
  cachedManga!: Table<CachedManga>;
  storageStats!: Table<StorageStats>;
  offlineSearchIndex!: Table<OfflineSearchIndex>;
  downloadJobs!: Table<DownloadJob>;
  offlineLibrary!: Table<OfflineLibraryEntry>;

  constructor() {
    super('MangainAjaOfflineDB');
    
    // Version 3: Add download jobs and offline library
    this.version(3).stores({
      cachedChapters: 'id, mangaId, chapterId, cachedAt, lastAccessed, totalSize',
      cachedManga: 'id, mangaId, cachedAt, lastAccessed',
      storageStats: '++id, lastCleanup',
      offlineSearchIndex: 'mangaId, mangaName, *searchTokens',
      downloadJobs: 'id, mangaId, chapterId, status, queuedAt',
      offlineLibrary: 'mangaId, lastUpdated, downloadedAt'
    });
    
    // Version 2: Add cachedManga table
    this.version(2).stores({
      cachedChapters: 'id, mangaId, chapterId, cachedAt, lastAccessed, totalSize',
      cachedManga: 'id, mangaId, cachedAt, lastAccessed',
      storageStats: '++id, lastCleanup',
      offlineSearchIndex: 'mangaId, mangaName, *searchTokens'
    });
    
    // Migration from version 1 to 2
    this.version(1).stores({
      cachedChapters: 'id, mangaId, chapterId, cachedAt, lastAccessed, totalSize',
      storageStats: '++id, lastCleanup',
      offlineSearchIndex: 'mangaId, mangaName, *searchTokens'
    });
  }
}

export const db = new OfflineDB();

// Keep the old export for backward compatibility
export const offlineDB = db;