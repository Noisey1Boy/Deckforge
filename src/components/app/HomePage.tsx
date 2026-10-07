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
    <div className={cn('flex flex-col bg-[color:var(--stg-cream)]', view === 'editor' ? 'h-screen overflow-hidden' : 'min-h-screen')}>
      {/* header — ink bar, yellow mark, caps nav */}
      <header className="sticky top-0 z-40 h-16 border-b-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)]">
        <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-ink)]"
            aria-label="DeckForge AI home"
          >
            <span className="grid h-8 w-8 place-items-center bg-[color:var(--stg-yellow)] text-[color:var(--stg-ink)]">
              <Presentation className="h-4.5 w-4.5" aria-hidden />
            </span>
            <span className="stg-display text-xl uppercase leading-none">
              DeckForge
              <span className="stg-label ml-2 align-middle text-[9px] text-[color:var(--stg-yellow)]">AI</span>
            </span>
          </button>

          <nav className="stg-label ml-auto hidden items-center gap-7 text-[10px] text-white/60 md:flex" aria-label="Page sections">
            <a href="#method" className="stg-link py-2 transition-colors hover:text-[color:var(--stg-cream)]">Method</a>
            <a href="#brief" className="stg-link py-2 transition-colors hover:text-[color:var(--stg-cream)]">Workbench</a>
            <a href="#systems" className="stg-link py-2 transition-colors hover:text-[color:var(--stg-cream)]">Systems</a>
            <a href="#decks" className="stg-link py-2 transition-colors hover:text-[color:var(--stg-cream)]">Decks</a>
          </nav>

          <a
            href="#brief"
            className="stg-label ml-auto inline-flex h-9 items-center bg-[color:var(--stg-yellow)] px-4 text-[10px] text-[color:var(--stg-ink)] transition-colors hover:bg-[color:var(--stg-yellow-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-ink)] md:ml-7"
          >
            New deck
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
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
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
      <footer className="mt-auto border-t-2 border-[color:var(--stg-yellow)] bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-9 sm:py-12">
          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center bg-[color:var(--stg-yellow)] text-[color:var(--stg-ink)]">
                  <Presentation className="h-4 w-4" aria-hidden />
                </span>
                <span className="stg-display text-lg uppercase leading-none">DeckForge AI</span>
              </div>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
                A presentation foundry that runs on your prompt. Built for people with
                something to say and no time to fight a slide editor.
              </p>
            </div>
            <div className="stg-label space-y-2.5 text-[10px] text-white/55">
              <p>24 systems · 11 layouts · 5 export formats</p>
              <p className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-[color:var(--stg-yellow)]" aria-hidden />
                AI runs server-side · Your data stays yours
              </p>
            </div>
          </div>
          <div className="stg-label mt-9 flex flex-col gap-2 border-t border-white/15 pt-4 text-[9px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
            <span>Prompt → Outline → Design → Present → Export</span>
            <span>1280×720 · Token-rendered · No templates</span>
          </div>
        </div>
      </footer>

      <PresentOverlay />
      <PrintSurface />
    </div>
  );
}
