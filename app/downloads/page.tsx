'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Pause, Play, X, CheckCircle, AlertCircle, Clock, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Header } from '@/components/layout/header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDownloadManager } from '@/hooks/use-download-manager';
import { formatBytes } from '@/lib/utils';
import type { DownloadProgress } from '@/lib/download-manager';

const getStatusIcon = (status: DownloadProgress['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    case 'downloading':
      return <Download className="w-4 h-4 text-blue-600 animate-bounce" />;
    case 'paused':
      return <Pause className="w-4 h-4 text-yellow-600" />;
    case 'queued':
      return <Clock className="w-4 h-4 text-gray-600" />;
    default:
      return null;
  }
};

const getStatusColor = (status: DownloadProgress['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300';
    case 'downloading':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'queued':
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300';
  }
};

interface DownloadItemProps {
  download: DownloadProgress;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
}

function DownloadItem({ download, onPause, onResume, onCancel }: DownloadItemProps) {
  const canPause = download.status === 'downloading';
  const canResume = download.status === 'paused';
  const canCancel = ['queued', 'downloading', 'paused', 'failed'].includes(download.status);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {getStatusIcon(download.status)}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Chapter {download.chapterId}</h4>
                <p className="text-sm text-muted-foreground">Manga ID: {download.mangaId}</p>
              </div>
              
              <Badge variant="outline" className={getStatusColor(download.status)}>
                {download.status}
              </Badge>
            </div>
            
            {/* Progress bar for active downloads */}
            {['downloading', 'queued'].includes(download.status) && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {download.status === 'downloading' 
                      ? `${formatBytes(download.downloadedSize)} / ${formatBytes(download.totalSize)}`
                      : 'Queued for download'
                    }
                  </span>
                  <span>{Math.round(download.progress)}%</span>
                </div>
                <Progress value={download.progress} className="h-2" />
              </div>
            )}
            
            {/* Error message */}
            {download.status === 'failed' && download.error && (
              <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {download.error}
              </p>
            )}
            
            {/* Completion info */}
            {download.status === 'completed' && download.completedAt && (
              <p className="text-xs text-green-600">
                Completed: {download.completedAt.toLocaleString()}
              </p>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {canPause && (
                  <DropdownMenuItem onClick={() => onPause(download.id)}>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </DropdownMenuItem>
                )}
                {canResume && (
                  <DropdownMenuItem onClick={() => onResume(download.id)}>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </DropdownMenuItem>
                )}
                {canCancel && (
                  <DropdownMenuItem 
                    onClick={() => onCancel(download.id)}
                    className="text-red-600"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </DropdownMenuItem>
                )}
                {download.status === 'completed' && (
                  <DropdownMenuItem asChild>
                    <Link href={`/manga/${download.mangaId}`}>
                      View Manga
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DownloadsPage() {
  const { downloads, loading, stats, actions } = useDownloadManager();
  const [activeTab, setActiveTab] = useState('all');

  const handlePause = async (id: string) => {
    await actions.pauseDownload(id);
  };

  const handleResume = async (id: string) => {
    await actions.resumeDownload(id);
  };

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this download?')) {
      await actions.cancelDownload(id);
    }
  };

  const handleClearCompleted = async () => {
    if (confirm('Are you sure you want to clear all completed downloads?')) {
      await actions.clearCompleted();
    }
  };

  const filteredDownloads = downloads.filter(download => {
    switch (activeTab) {
      case 'active':
        return ['downloading', 'queued'].includes(download.status);
      case 'completed':
        return download.status === 'completed';
      case 'failed':
        return download.status === 'failed';
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Download className="w-8 h-8" />
                Download Manager
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your chapter downloads and track progress
              </p>
            </div>
          </div>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Download Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-primary">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Downloads</p>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-blue-600">{stats.downloading}</p>
                  <p className="text-sm text-muted-foreground">Downloading</p>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-600">{stats.queued}</p>
                  <p className="text-sm text-muted-foreground">Queued</p>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
              
              {stats.total > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span>{Math.round(stats.successRate)}%</span>
                  </div>
                  <Progress value={stats.successRate} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Downloads List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Downloads</CardTitle>
              {stats.completed > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearCompleted}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Clear Completed
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All ({downloads.length})</TabsTrigger>
                  <TabsTrigger value="active">
                    Active ({stats.downloading + stats.queued})
                  </TabsTrigger>
                  <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
                  <TabsTrigger value="failed">Failed ({stats.failed})</TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab} className="mt-6">
                  {filteredDownloads.length === 0 ? (
                    <div className="text-center py-12">
                      <Download className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {activeTab === 'all' ? 'No Downloads Yet' : `No ${activeTab} Downloads`}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {activeTab === 'all' 
                          ? 'Start downloading chapters for offline reading'
                          : `You don't have any ${activeTab} downloads`
                        }
                      </p>
                      {activeTab === 'all' && (
                        <Link href="/">
                          <Button>
                            Browse Manga
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredDownloads.map((download) => (
                        <DownloadItem
                          key={download.id}
                          download={download}
                          onPause={handlePause}
                          onResume={handleResume}
                          onCancel={handleCancel}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}