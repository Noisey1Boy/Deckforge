'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useAppStore } from '@/lib/store/deck-store';
import { useHtmlStore } from '@/lib/store/html-store';
import { CreateView } from '@/components/app/CreateView';
import { OutlineView } from '@/components/app/OutlineView';
import { GeneratingView } from '@/components/app/GeneratingView';
import { EditorView } from '@/components/editor/EditorView';
import { PresentOverlay } from '@/components/app/PresentOverlay';
import { PrintSurface } from '@/components/app/ExportMenu';
import { TemplateModeView } from '@/components/app/template/TemplateModeView';
import { HtmlDeckList } from '@/components/app/HtmlDeckList';
import { Toaster } from '@/components/ui/sonner';
import { Presentation } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Landing mode switch: STUDIO (default) | TEMPLATE STUDIO — HTML decks. */
function ModeSwitch() {
  const tab = useHtmlStore((s) => s.tab);
  const setTab = useHtmlStore((s) => s.setTab);

  const tabs = [
    { id: 'studio' as const, label: 'Studio — structured' },
    { id: 'template' as const, label: 'Template studio — HTML decks' },
  ];

  return (
    <div className="border-b-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <span className="stg-label text-[9px] text-[color:var(--stg-ink)]/55">Mode</span>
        <div role="tablist" aria-label="Creation mode" className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                id={`mode-tab-${t.id}`}
                aria-selected={active}
                aria-label={t.label}
                onClick={() => setTab(t.id)}
                className={cn(
                  'stg-label border-2 px-4 py-2 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-cream-2)]',
                  active
                    ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-yellow)] shadow-[4px_4px_0_0_var(--stg-ink)]'
                    : 'border-[color:var(--stg-ink)]/35 bg-transparent text-[color:var(--stg-ink)]/65 hover:border-[color:var(--stg-ink)] hover:text-[color:var(--stg-ink)]',
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const setTab = useHtmlStore((s) => s.setTab);
  const tab = useHtmlStore((s) => s.tab);
  const reduceMotion = useReducedMotion();

  const templateStudio = view === 'create' && tab === 'template';

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
            onClick={() => setTab('studio')}
            className="stg-label ml-auto inline-flex h-9 items-center bg-[color:var(--stg-yellow)] px-4 text-[10px] text-[color:var(--stg-ink)] transition-colors hover:bg-[color:var(--stg-yellow-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-ink)] md:ml-7"
          >
            New deck
          </a>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        {/* Landing mode switch — only above the create workbench (Studio stays
            the default; the Studio flow owns outline/generating/editor views) */}
        {view === 'create' && <ModeSwitch />}

        {reduceMotion ? (
          <>
            {view === 'create' && (templateStudio ? (
              <>
                <TemplateModeView />
                <HtmlDeckList />
              </>
            ) : (
              <CreateView />
            ))}
            {view === 'outline' && <OutlineView />}
            {view === 'generating' && <GeneratingView />}
            {view === 'editor' && <EditorView />}
          </>
        ) : (
          <motion.div
            key={view === 'create' ? `create-${tab}` : view}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={view === 'editor' ? 'flex-1 min-h-0 flex flex-col' : undefined}
          >
            {view === 'create' && (templateStudio ? (
              <>
                <TemplateModeView />
                <HtmlDeckList />
              </>
            ) : (
              <CreateView />
            ))}
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
              <p>24 systems · 57 templates · 11 layouts · 7 export options</p>
              <p className="text-white/40">PPTX · PDF · HTML · PNG · speaker notes · .deck.json</p>
              <p className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-[color:var(--stg-yellow)]" aria-hidden />
                AI runs server-side · Decks stored server-side · Your content stays yours
              </p>
            </div>
          </div>
          <div className="stg-label mt-9 flex flex-col gap-2 border-t border-white/15 pt-4 text-[9px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
            <span>Prompt → Outline → Design → Present → Export</span>
            <span>Token-rendered · HTML template studio · JS-library decks</span>
          </div>
        </div>
      </footer>

      <PresentOverlay />
      <PrintSurface />
      {/* sonner toaster — all app feedback flows through `toast` from 'sonner' */}
      <Toaster position="bottom-right" />
    </div>
  );
}
