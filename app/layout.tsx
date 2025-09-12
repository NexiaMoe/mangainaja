import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ServiceWorkerProvider } from '@/components/providers/service-worker-provider';
import { OfflineStateProvider } from '@/components/providers/offline-state-provider';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { Toaster } from '@/components/ui/toaster';
import { ScrollRestoration } from '@/components/layout/scroll-restoration';
import { ChapterUpdateChecker } from '@/components/notifications/chapter-update-checker';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MangainAja - Your Ultimate Manga Reader',
  description: 'Read manga online with the best reading experience. Track your progress, discover new series, and enjoy seamless reading across all devices.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MangainAja',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MangainAja" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="MangainAja" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <OfflineStateProvider>
            <ServiceWorkerProvider />
            <div id="root">
              {children}
            </div>
            <InstallPrompt />
            <ChapterUpdateChecker />
            <Toaster />
          </OfflineStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}