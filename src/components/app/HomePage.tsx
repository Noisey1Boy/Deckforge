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
      {/* header — ink mark, mono anchors */}
      <header className="sticky top-0 z-40 h-16 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
            aria-label="DeckForge AI home"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-950 text-white shadow-md shadow-neutral-950/25">
              <Presentation className="h-4.5 w-4.5" aria-hidden />
            </span>
            <span className="df-display text-lg font-bold tracking-tight">
              DeckForge
              <span className="df-mono ml-1.5 align-middle text-[10px] font-medium tracking-[0.2em] text-amber-600">AI</span>
            </span>
          </button>

          <nav className="df-mono ml-auto hidden items-center gap-6 text-[11px] tracking-[0.18em] text-neutral-500 md:flex" aria-label="Page sections">
            <a href="#method" className="df-link transition-colors hover:text-neutral-950">METHOD</a>
            <a href="#brief" className="df-link transition-colors hover:text-neutral-950">WORKBENCH</a>
            <a href="#systems" className="df-link transition-colors hover:text-neutral-950">SYSTEMS</a>
            <a href="#decks" className="df-link transition-colors hover:text-neutral-950">DECKS</a>
          </nav>

          <a
            href="#brief"
            className="df-mono ml-auto inline-flex h-9 items-center rounded-md bg-neutral-950 px-3.5 text-[11px] font-medium tracking-[0.18em] text-white transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 md:ml-6"
          >
            NEW DECK
          </a>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
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

      {/* footer — ink colophon, sticks to the bottom on short pages */}
      <footer className="mt-auto bg-neutral-950 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-white text-neutral-950">
                  <Presentation className="h-4 w-4" aria-hidden />
                </span>
                <span className="df-display text-base font-bold tracking-tight">DeckForge AI</span>
              </div>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-400">
                A presentation design studio that runs on your prompt. Built for people
                with something to say and no time to fight a slide editor.
              </p>
            </div>
            <div className="df-mono space-y-2 text-[11px] tracking-[0.18em] text-neutral-400">
              <p>8 SYSTEMS · 11 LAYOUTS · 3 EXPORT FORMATS</p>
              <p className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                AI RUNS SERVER-SIDE — YOUR DATA STAYS YOURS
              </p>
            </div>
          </div>
          <div className="df-mono mt-8 flex flex-col gap-2 border-t border-white/10 pt-4 text-[10px] tracking-[0.18em] text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
            <span>PROMPT → OUTLINE → DESIGN → PRESENT → EXPORT</span>
            <span>1280×720 · TOKEN-RENDERED · NO TEMPLATES</span>
          </div>
        </div>
      </footer>

      <PresentOverlay />
      <PrintSurface />
    </div>
  );
}
