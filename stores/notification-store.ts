'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NotificationStore, ChapterUpdateNotification } from '@/types/notification';

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      
      addNotification: (notification) => set((state) => {
        // Check if notification already exists for this chapter
        const existingNotification = state.notifications.find(
          n => n.mangaId === notification.mangaId && n.chapterId === notification.chapterId
        );
        
        if (existingNotification) {
          return state; // Don't add duplicate notifications
        }
        
        const newNotification: ChapterUpdateNotification = {
          ...notification,
          id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          notifiedAt: Date.now(),
          isRead: false,
        };
        
        // Add new notification and keep only the latest 50
        const updatedNotifications = [newNotification, ...state.notifications].slice(0, 50);
        
        return { notifications: updatedNotifications };
      }),
      
      markAsRead: (notificationId) => set((state) => ({
        notifications: state.notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      })),
      
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true
        }))
      })),
      
      removeNotification: (notificationId) => set((state) => ({
        notifications: state.notifications.filter(notification => notification.id !== notificationId)
      })),
      
      clearAllNotifications: () => set({ notifications: [] }),
      
      getUnreadCount: () => {
        const state = get();
        return state.notifications.filter(notification => !notification.isRead).length;
      },
      
      getNotifications: () => get().notifications,
    }),
    {
      name: 'manga-notification-store',
      version: 1,
    }
  )
);