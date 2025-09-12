export interface ChapterUpdateNotification {
  id: string;
  mangaId: string;
  mangaName: string;
  mangaSlug: string;
  coverUrl: string;
  chapterId: string;
  chapterName: string;
  chapterNumber: number;
  volumeNumber: number;
  notifiedAt: number;
  isRead: boolean;
}

export interface NotificationStore {
  notifications: ChapterUpdateNotification[];
  
  // Notification methods
  addNotification: (notification: Omit<ChapterUpdateNotification, 'id' | 'notifiedAt' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  getUnreadCount: () => number;
  getNotifications: () => ChapterUpdateNotification[];
}