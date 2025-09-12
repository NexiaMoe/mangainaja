'use client';

import { History } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { ReadingHistory } from '@/components/history/reading-history';

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <History className="w-8 h-8" />
              Reading History
            </h1>
            <p className="text-muted-foreground mt-2">
              Your recently read manga chapters and progress
            </p>
          </div>
          
          <ReadingHistory />
        </div>
      </main>
    </div>
  );
}