'use client';

import { OfflineStorageManager } from './offline-storage-manager';
import { db, type DownloadJob } from './offline-db';

export interface DownloadProgress {
  id: string;
  mangaId: string;
  chapterId: string;
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'failed';
  progress: number;
  downloadedSize: number;
  totalSize: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export class ChapterDownloadManager {
  private static instance: ChapterDownloadManager;
  private downloadQueue: DownloadJob[] = [];
  private activeDownloads = new Map<string, DownloadProgress>();
  private isProcessingQueue = false;
  private maxConcurrentDownloads = 2;

  private constructor() {
    // Only initialize on client-side
    if (typeof window !== 'undefined') {
      this.initializeFromDB();
    }
  }

  static getInstance(): ChapterDownloadManager {
    if (!ChapterDownloadManager.instance) {
      ChapterDownloadManager.instance = new ChapterDownloadManager();
    }
    return ChapterDownloadManager.instance;
  }

  private isClientSide(): boolean {
    return typeof window !== 'undefined';
  }

  private async initializeFromDB() {
    // Skip if not in browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      // Load pending downloads from database
      const pendingJobs = await db.downloadJobs
        .where('status')
        .anyOf(['queued', 'downloading'])
        .toArray();
      
      this.downloadQueue = pendingJobs;
      
      // Reset downloading status to queued on app restart
      for (const job of pendingJobs) {
        if (job.status === 'downloading') {
          job.status = 'queued';
          await db.downloadJobs.put(job);
        }
      }
      
      // Start processing queue if there are pending downloads
      if (this.downloadQueue.length > 0) {
        this.processQueue();
      }
    } catch (error) {
      console.error('Failed to initialize download manager:', error);
    }
  }

  async queueDownload(
    mangaId: string, 
    chapterId: string, 
    mangaName?: string,
    priority: number = 0
  ): Promise<string> {
    if (!this.isClientSide()) {
      throw new Error('Download manager is only available in browser environment');
    }
    const jobId = `${mangaId}-${chapterId}-${Date.now()}`;
    
    // Check if already downloading or completed
    const existingJob = await db.downloadJobs
      .where('mangaId')
      .equals(mangaId)
      .and(job => job.chapterId === chapterId)
      .first();
    
    if (existingJob && ['completed', 'downloading', 'queued'].includes(existingJob.status)) {
      throw new Error('Chapter is already downloaded or in queue');
    }

    const job: DownloadJob = {
      id: jobId,
      mangaId,
      chapterId,
      mangaName,
      priority,
      status: 'queued',
      progress: 0,
      estimatedSize: 0,
      queuedAt: new Date(),
      retryCount: 0
    };

    // Save to database
    await db.downloadJobs.put(job);
    
    // Add to memory queue
    this.downloadQueue.push(job);
    this.downloadQueue.sort((a, b) => b.priority - a.priority);

    // Start processing if not already running
    if (!this.isProcessingQueue) {
      this.processQueue();
    }

    return jobId;
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    try {
      while (this.downloadQueue.length > 0 && this.activeDownloads.size < this.maxConcurrentDownloads) {
        const job = this.downloadQueue.shift();
        if (!job) break;

        // Skip if job is paused
        if (job.status === 'paused') {
          continue;
        }

        // Start download
        this.downloadChapter(job);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async downloadChapter(job: DownloadJob): Promise<void> {
    const progress: DownloadProgress = {
      id: job.id,
      mangaId: job.mangaId,
      chapterId: job.chapterId,
      status: 'downloading',
      progress: 0,
      downloadedSize: 0,
      totalSize: 0,
      startedAt: new Date()
    };

    this.activeDownloads.set(job.id, progress);

    // Update job status in database
    job.status = 'downloading';
    job.startedAt = new Date();
    await db.downloadJobs.put(job);

    try {
      // Use the existing storage manager to cache the chapter
      const storageManager = OfflineStorageManager.getInstance();
      
      // Create a progress callback
      const onProgress = (downloaded: number, total: number) => {
        progress.downloadedSize = downloaded;
        progress.totalSize = total;
        progress.progress = total > 0 ? (downloaded / total) * 100 : 0;
        this.activeDownloads.set(job.id, { ...progress });
      };

      // Create a completion callback to trigger UI refresh
      const onComplete = () => {
        console.log('Download images completed, triggering UI refresh');
        // Dispatch a custom event to notify UI components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chapterCacheCompleted', {
            detail: { mangaId: job.mangaId, chapterId: job.chapterId }
          }));
        }
      };

      const success = await storageManager.cacheChapter(
        job.mangaId, 
        job.chapterId, 
        job.mangaName,
        onProgress,
        onComplete
      );

      if (success) {
        // Mark as completed
        progress.status = 'completed';
        progress.progress = 100;
        progress.completedAt = new Date();

        job.status = 'completed';
        job.completedAt = new Date();
        job.progress = 100;
        
        await db.downloadJobs.put(job);
        
        // Cache the reader page for offline access
        try {
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'CACHE_READER_PAGE',
              data: {
                mangaId: job.mangaId,
                chapterId: job.chapterId
              }
            });
            console.log(`Requested caching of reader page: ${job.mangaId}/${job.chapterId}`);
          }
        } catch (swError) {
          console.warn('Failed to request reader page caching:', swError);
        }
        
        console.log(`Download completed: ${job.mangaId}/${job.chapterId}`);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download failed:', error);
      
      // Mark as failed
      progress.status = 'failed';
      progress.error = error instanceof Error ? error.message : 'Download failed';

      job.status = 'failed';
      job.errorMessage = progress.error;
      job.retryCount = (job.retryCount || 0) + 1;
      
      await db.downloadJobs.put(job);
      
      // Retry if under limit
      if (job.retryCount < 3) {
        setTimeout(() => {
          job.status = 'queued';
          this.downloadQueue.push(job);
          this.processQueue();
        }, 5000 * job.retryCount); // Exponential backoff
      }
    } finally {
      // Remove from active downloads
      this.activeDownloads.delete(job.id);
      
      // Continue processing queue
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  async pauseDownload(jobId: string): Promise<boolean> {
    try {
      const job = await db.downloadJobs.get(jobId);
      if (!job || job.status !== 'downloading') {
        return false;
      }

      job.status = 'paused';
      await db.downloadJobs.put(job);

      // Remove from active downloads if present
      this.activeDownloads.delete(jobId);
      
      return true;
    } catch (error) {
      console.error('Failed to pause download:', error);
      return false;
    }
  }

  async resumeDownload(jobId: string): Promise<boolean> {
    try {
      const job = await db.downloadJobs.get(jobId);
      if (!job || job.status !== 'paused') {
        return false;
      }

      job.status = 'queued';
      await db.downloadJobs.put(job);

      // Add back to queue
      this.downloadQueue.push(job);
      this.downloadQueue.sort((a, b) => b.priority - a.priority);
      
      // Process queue
      this.processQueue();
      
      return true;
    } catch (error) {
      console.error('Failed to resume download:', error);
      return false;
    }
  }

  async cancelDownload(jobId: string): Promise<boolean> {
    try {
      const job = await db.downloadJobs.get(jobId);
      if (!job) {
        return false;
      }

      // Remove from active downloads
      this.activeDownloads.delete(jobId);
      
      // Remove from queue
      this.downloadQueue = this.downloadQueue.filter(q => q.id !== jobId);
      
      // Delete from database
      await db.downloadJobs.delete(jobId);
      
      return true;
    } catch (error) {
      console.error('Failed to cancel download:', error);
      return false;
    }
  }

  async getDownloadProgress(): Promise<DownloadProgress[]> {
    try {
      const jobs = await db.downloadJobs.toArray();
      
      return jobs.map(job => {
        // Check if it's currently downloading
        const activeProgress = this.activeDownloads.get(job.id);
        if (activeProgress) {
          return activeProgress;
        }
        
        // Return job data as progress
        return {
          id: job.id,
          mangaId: job.mangaId,
          chapterId: job.chapterId,
          status: job.status,
          progress: job.progress || 0,
          downloadedSize: 0,
          totalSize: job.estimatedSize || 0,
          error: job.errorMessage,
          startedAt: job.startedAt,
          completedAt: job.completedAt
        };
      });
    } catch (error) {
      console.error('Failed to get download progress:', error);
      return [];
    }
  }

  async getQueuedDownloads(): Promise<DownloadJob[]> {
    try {
      return await db.downloadJobs
        .where('status')
        .equals('queued')
        .toArray();
    } catch (error) {
      console.error('Failed to get queued downloads:', error);
      return [];
    }
  }

  async getCompletedDownloads(): Promise<DownloadJob[]> {
    try {
      return await db.downloadJobs
        .where('status')
        .equals('completed')
        .toArray();
    } catch (error) {
      console.error('Failed to get completed downloads:', error);
      return [];
    }
  }

  async clearCompletedDownloads(): Promise<void> {
    try {
      await db.downloadJobs
        .where('status')
        .equals('completed')
        .delete();
    } catch (error) {
      console.error('Failed to clear completed downloads:', error);
    }
  }

  // New method to clean up download records for a specific chapter
  async clearChapterDownloadRecord(mangaId: string, chapterId: string): Promise<boolean> {
    try {
      const downloads = await this.getDownloadProgress();
      const chapterDownload = downloads.find(
        d => d.mangaId === mangaId && d.chapterId === chapterId
      );
      
      if (chapterDownload) {
        console.log('Clearing download record for chapter:', chapterDownload.id, 'status:', chapterDownload.status);
        const success = await this.cancelDownload(chapterDownload.id);
        return success;
      }
      
      return true; // No record to clean up
    } catch (error) {
      console.error('Failed to clear chapter download record:', error);
      return false;
    }
  }

  // Get download statistics
  async getDownloadStats() {
    try {
      const all = await db.downloadJobs.toArray();
      const completed = all.filter(j => j.status === 'completed').length;
      const failed = all.filter(j => j.status === 'failed').length;
      const queued = all.filter(j => j.status === 'queued').length;
      const downloading = this.activeDownloads.size;
      
      return {
        total: all.length,
        completed,
        failed,
        queued,
        downloading,
        successRate: all.length > 0 ? (completed / all.length) * 100 : 0
      };
    } catch (error) {
      console.error('Failed to get download stats:', error);
      return {
        total: 0,
        completed: 0,
        failed: 0,
        queued: 0,
        downloading: 0,
        successRate: 0
      };
    }
  }
}