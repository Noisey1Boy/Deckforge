'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useAppStore } from '@/lib/store/deck-store';
import { CreateView } from '@/components/app/CreateView';
import { OutlineView } from '@/components/app/OutlineView';
import { GeneratingView } from '@/components/app/GeneratingView';
import { EditorView } from '@/components/editor/EditorView';
import { PresentOverlay } from '@/components/app/PresentOverlay';
import { PrintSurface } from '@/components/app/ExportMenu';
import { Presentation } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HomePage() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn('flex flex-col bg-neutral-50', view === 'editor' ? 'h-screen overflow-hidden' : 'min-h-screen')}>
      {/* header */}
      <header className="sticky top-0 z-40 h-16 border-b bg-background/90 backdrop-blur">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center gap-3">
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
            aria-label="DeckForge AI home"
          >
            <span className="grid place-items-center h-8 w-8 rounded-lg bg-neutral-900 text-white shadow-md shadow-neutral-900/20">
              <Presentation className="h-4.5 w-4.5" />
            </span>
            <span className="font-bold text-lg tracking-tight">DeckForge<span className="text-neutral-400"> AI</span></span>
          </button>
          <nav className="ml-auto text-sm text-muted-foreground hidden sm:block" aria-label="About">
            Prompt → outline → designed slides → present &amp; export
          </nav>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col">
        {reduceMotion ? (
          <>
            {view === 'create' && <CreateView />}
            {view === 'outline' && <OutlineView />}
            {view === 'generating' && <GeneratingView />}
            {view === 'editor' && <EditorView />}
          </>
        ) : (
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
            className={view === 'editor' ? 'flex-1 min-h-0 flex flex-col' : undefined}
          >
            {view === 'create' && <CreateView />}
            {view === 'outline' && <OutlineView />}
            {view === 'generating' && <GeneratingView />}
            {view === 'editor' && <EditorView />}
          </motion.div>
        )}
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
