'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { ModeSwitch } from '@/components/app/ModeSwitch';
import { SiteHeader } from '@/components/app/SiteHeader';
import { SiteFooter } from '@/components/app/SiteFooter';
import { cn } from '@/lib/utils';

/**
 * CreateFlow — the creation route (guests allowed).
 * Mode switch (Studio | Template Studio) + the deck-store view machine
 * (create → outline → generating → editor). PresentOverlay + PrintSurface are
 * mounted here because EditorView/Present rely on them being nearby (they were
 * global in the old single-page HomePage).
 *
 * `/create?tab=template` preselects the Template Studio tab once on mount
 * (used by the landing "Browse templates" CTA).
 */
function CreateFlow() {
  const view = useAppStore((s) => s.view);
  const tab = useHtmlStore((s) => s.tab);
  const setTab = useHtmlStore((s) => s.setTab);
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();

  // Apply ?tab=template exactly once per mount.
  const appliedTab = useRef(false);
  useEffect(() => {
    if (appliedTab.current) return;
    appliedTab.current = true;
    if (searchParams.get('tab') === 'template') setTab('template');
  }, [searchParams, setTab]);

  const templateStudio = view === 'create' && tab === 'template';

  return (
    <div
      className={cn(
        'flex flex-col bg-[color:var(--stg-cream)]',
        view === 'editor' ? 'h-screen overflow-hidden' : 'min-h-screen',
      )}
    >
      <SiteHeader />

      <main className="flex min-h-0 flex-1 flex-col">
        {/* Mode switch — only above the create workbench (the Studio flow owns
            outline/generating/editor views) */}
        {view === 'create' && <ModeSwitch />}

        {reduceMotion ? (
          <>
            {view === 'create' &&
              (templateStudio ? (
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
            {view === 'create' &&
              (templateStudio ? (
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

      {/* The editor view manages its own height (h-screen canvas); the footer
          would be unreachable there, so it only renders for the flow views. */}
      {view !== 'editor' && <SiteFooter />}

      <PresentOverlay />
      <PrintSurface />
    </div>
  );
}

export default function CreatePage() {
  // useSearchParams needs a Suspense boundary during prerendering.
  return (
    <Suspense fallback={null}>
      <CreateFlow />
    </Suspense>
  );
}
