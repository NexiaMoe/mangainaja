'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, Moon, Sun, Monitor, Settings, Database, Smartphone, Info, Check, Code, RefreshCw } from 'lucide-react';
import { OfflineStorageSettings } from './offline-storage-settings';
import { useTheme } from 'next-themes';
import { useReadingHistoryStore } from '@/stores/reading-history-store';
import { useReaderStore } from '@/stores/reader-store';
import { useSearchStore } from '@/stores/search-store';
import { APP_VERSION, BUILD_TIME, getServiceWorkerVersion } from '@/lib/version';

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const { clearHistory, getHistory, getBookmarks } = useReadingHistoryStore();
  const { resetReaderSettings } = useReaderStore();
  const { clearAll: clearSearchFilters } = useSearchStore();
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [swVersion, setSwVersion] = useState<string | null>(null);
  const [swBuildTime, setSwBuildTime] = useState<string | null>(null);

  const historyCount = getHistory().length;
  const bookmarksCount = getBookmarks().length;

  useEffect(() => {
    setMounted(true);
    
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isInWebAppiOS);

    // Get service worker version
    getServiceWorkerVersion().then((versionInfo) => {
      if (versionInfo) {
        setSwVersion(versionInfo.version);
        setSwBuildTime(versionInfo.buildTime);
      }
    });

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      clearHistory();
      clearSearchFilters();
      resetReaderSettings();
    }
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the deferred prompt
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Monitor className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-lg">Appearance</span>
              <p className="text-sm text-muted-foreground font-normal">Customize your visual experience</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div>
            <Label className="text-base font-medium flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4" />
              Theme Selection
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                variant={mounted && theme === 'light' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setTheme('light')}
                className="flex items-center gap-3 h-12 justify-start"
              >
                <Sun className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Light</div>
                  <div className="text-xs text-muted-foreground">Bright theme</div>
                </div>
                {mounted && theme === 'light' && <Check className="w-4 h-4 ml-auto" />}
              </Button>
              <Button
                variant={mounted && theme === 'dark' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setTheme('dark')}
                className="flex items-center gap-3 h-12 justify-start"
              >
                <Moon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Dark</div>
                  <div className="text-xs text-muted-foreground">Dark theme</div>
                </div>
                {mounted && theme === 'dark' && <Check className="w-4 h-4 ml-auto" />}
              </Button>
              <Button
                variant={mounted && theme === 'system' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setTheme('system')}
                className="flex items-center gap-3 h-12 justify-start"
              >
                <Monitor className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">System</div>
                  <div className="text-xs text-muted-foreground">Auto theme</div>
                </div>
                {mounted && theme === 'system' && <Check className="w-4 h-4 ml-auto" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-2 border-orange-500/20">
        <CardHeader className="bg-gradient-to-r from-orange-500/10 to-orange-500/5">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Database className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <span className="text-lg">Data Management</span>
              <p className="text-sm text-muted-foreground font-normal">Manage your saved data and preferences</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded">
                  <Monitor className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <Label className="text-base font-medium">Reading History</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {historyCount} items in history
                    </p>
                    <Badge variant="secondary" className="text-xs">{historyCount}</Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                disabled={historyCount === 0}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear History
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded">
                  <Settings className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <Label className="text-base font-medium">Search Filters</Label>
                  <p className="text-sm text-muted-foreground">
                    Reset saved search preferences
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSearchFilters}
                className="hover:bg-green-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded">
                  <Monitor className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <Label className="text-base font-medium">Reader Settings</Label>
                  <p className="text-sm text-muted-foreground">
                    Reset all reader preferences
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetReaderSettings}
                className="hover:bg-purple-500/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                Reset Settings
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-lg border-2 border-red-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <Label className="text-base font-medium text-destructive">Clear All Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Remove all saved data and reset settings
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllData}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offline Storage Settings */}
      <OfflineStorageSettings />

      {/* PWA Settings */}
      <Card className="border-2 border-green-500/20">
        <CardHeader className="bg-gradient-to-r from-green-500/10 to-green-500/5">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Smartphone className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <span className="text-lg">Progressive Web App</span>
              <p className="text-sm text-muted-foreground font-normal">Install as a native mobile app</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-lg border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/10 rounded">
                  <Download className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <Label className="text-base font-medium">Install MangainAja</Label>
                  {isInstalled && (
                    <Badge className="ml-2 bg-green-500/10 text-green-700 border-green-500/20">
                      <Check className="w-3 h-3 mr-1" />
                      Installed
                    </Badge>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Install MangainAja as a native app for better performance and limited offline capabilities
              </p>
              
              {isInstalled ? (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded border border-green-500/20">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700">App is already installed!</span>
                </div>
              ) : isInstallable ? (
                <Button onClick={handleInstallPWA} className="w-full bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  Install MangainAja
                </Button>
              ) : (
                <div className="p-3 bg-muted/50 rounded border">
                  <p className="text-sm text-muted-foreground">
                    Install option will appear when using a compatible browser (Chrome, Edge, etc.)
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Performance Benefits
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Faster loading times</li>
                  <li>• Smooth navigation</li>
                  <li>• Cached images</li>
                </ul>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  App Features
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Home screen icon</li>
                  <li>• Full screen mode</li>
                  <li>• Offline page view</li>
                </ul>
              </div>
            </div>
            
            <div className="p-3 bg-amber-500/10 rounded border border-amber-500/20">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Full offline reading requires internet connection for manga discovery and new content. Previously viewed images are cached automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-2 border-blue-500/20">
        <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/5">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Info className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <span className="text-lg">About MangainAja</span>
              <p className="text-sm text-muted-foreground font-normal">App information and details</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-lg border">
              <div className="flex items-start gap-3">
                <Code className="w-5 h-5 text-blue-500 mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2">App Version</p>
                  <Badge variant="secondary" className="mb-1">v{APP_VERSION}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Built: {new Date(BUILD_TIME).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-lg border">
              <div className="flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-green-500 mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2">Service Worker</p>
                  {swVersion ? (
                    <>
                      <Badge variant="secondary" className="mb-1">v{swVersion}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated: {swBuildTime ? new Date(swBuildTime).toLocaleString() : 'Unknown'}
                      </p>
                    </>
                  ) : (
                    <Badge variant="outline">Not registered</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-500/5 to-purple-500/10 rounded-lg border">
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">{historyCount}</Badge>
                <p className="text-sm font-medium">History Items</p>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-pink-500/5 to-pink-500/10 rounded-lg border">
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">{bookmarksCount}</Badge>
                <p className="text-sm font-medium">Bookmarks</p>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 rounded-lg border">
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">Next.js 15</Badge>
                <p className="text-sm font-medium">Framework</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-muted/20 rounded-lg">
            <p className="text-sm text-muted-foreground leading-relaxed">
              MangainAja provides a modern, fast, and beautiful manga reading experience
              with features like offline reading, progress tracking, and customizable settings.
              Built with Next.js, TypeScript, and Tailwind CSS for optimal performance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}