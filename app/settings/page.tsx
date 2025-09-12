'use client';

import { Settings } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { SettingsPanel } from '@/components/settings/settings-panel';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Settings className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Settings
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Customize your reading experience and manage your data preferences
            </p>
          </div>
          
          <SettingsPanel />
        </div>
      </main>
    </div>
  );
}