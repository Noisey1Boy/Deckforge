'use client';

import { useAppStore } from '@/lib/store/deck-store';
import { CreateView } from '@/components/app/CreateView';
import { OutlineView } from '@/components/app/OutlineView';
import { GeneratingView } from '@/components/app/GeneratingView';
import { EditorView } from '@/components/editor/EditorView';
import { PresentOverlay } from '@/components/app/PresentOverlay';
import { PrintSurface } from '@/components/app/ExportMenu';
import { Presentation } from 'lucide-react';

export function HomePage() {
  const view = useAppStore((s) => s.view);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* header */}
      <header className="sticky top-0 z-40 h-16 border-b bg-background/90 backdrop-blur">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center h-8 w-8 rounded-lg bg-neutral-900 text-white">
              <Presentation className="h-4.5 w-4.5" />
            </span>
            <span className="font-bold text-lg tracking-tight">DeckForge<span className="text-neutral-400"> AI</span></span>
          </div>
          <nav className="ml-auto text-sm text-muted-foreground hidden sm:block" aria-label="About">
            Prompt → outline → designed slides → present &amp; export
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {view === 'create' && <CreateView />}
        {view === 'outline' && <OutlineView />}
        {view === 'generating' && <GeneratingView />}
        {view === 'editor' && <EditorView />}
      </main>

      {/* sticky footer — mt-auto keeps it at the bottom on short pages */}
      <footer className="mt-auto border-t bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>DeckForge AI — 8 curated design systems · charts from your own data · PPTX / PDF / HTML export</p>
          <p className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            AI runs server-side · your data stays yours
          </p>
        </div>
      </footer>

      <PresentOverlay />
      <PrintSurface />
    </div>
  );
}
