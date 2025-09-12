'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationStore } from '@/stores/notification-store';
import { formatDate } from '@/lib/utils';
import type { ChapterUpdateNotification } from '@/types/notification';

export function NotificationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    getUnreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    clearAllNotifications 
  } = useNotificationStore();

  const unreadCount = getUnreadCount();

  const handleMarkAsRead = (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markAllAsRead();
  };

  const handleRemoveNotification = (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeNotification(notificationId);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearAllNotifications();
  };

  const NotificationItem = ({ notification }: { notification: ChapterUpdateNotification }) => (
    <Link 
      href={`/manga/${notification.mangaId}`}
      className="block"
      onClick={() => setIsOpen(false)}
    >
      <Card className={`mb-2 transition-colors hover:bg-accent ${!notification.isRead ? 'border-primary/50 bg-primary/5' : ''}`}>
        <CardContent className="p-3">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-16 bg-muted rounded relative overflow-hidden">
                <img 
                  src={notification.coverUrl || '/placeholder-manga.jpg'} 
                  alt={notification.mangaName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm line-clamp-1">
                    {notification.mangaName}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    New Chapter {notification.chapterNumber}{notification.volumeNumber > 0 ? ` (Vol. ${notification.volumeNumber})` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {notification.chapterName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(notification.notifiedAt)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-1 ml-2">
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={(e) => handleRemoveNotification(notification.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-50" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-background border rounded-lg shadow-lg z-50">
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <div className="flex items-center space-x-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-7 text-xs"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-7 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <ScrollArea className="max-h-80">
              <div className="p-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No notifications yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Bookmark manga to get notified about new chapters
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}