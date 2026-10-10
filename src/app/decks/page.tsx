'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/deck-store';
import { useHtmlStore } from '@/lib/store/html-store';
import { RecentDecks } from '@/components/app/RecentDecks';
import { HtmlDeckList } from '@/components/app/HtmlDeckList';
import { SiteHeader } from '@/components/app/SiteHeader';
import { SiteFooter } from '@/components/app/SiteFooter';
import { toast } from 'sonner';
import type { Deck } from '@/lib/deck/types';
import { FolderOpen, LayoutTemplate, Loader2 } from 'lucide-react';

/**
 * /decks — "YOUR DECKS, READY TO RERUN."
 * Section 1: Studio decks (RecentDecks; opening loads the deck into the
 * deck-store and routes to /create where view='editor' renders EditorView).
 * Section 2: HTML template decks (HtmlDeckList — its "open" action targets
 * the viewer that lives inside TemplateModeView on /create, so we route there
 * whenever a result is set while on this page).
 */

interface RecentDeckRef {
  id: string;
  title: string;
}

export default function DecksPage() {
  const router = useRouter();
  const setDeck = useAppStore((s) => s.setDeck);
  const setView = useAppStore((s) => s.setView);
  const htmlResult = useHtmlStore((s) => s.result);

  const [opening, setOpening] = useState(false);
  // Skip the store's initial value (a result from an earlier generation
  // session must not bounce the user back to /create on page load).
  const skipFirstResult = useRef(true);

  useEffect(() => {
    if (skipFirstResult.current) {
      skipFirstResult.current = false;
      return;
    }
    if (htmlResult) router.push('/create');
  }, [htmlResult, router]);

  const openStudioDeck = async (d: RecentDeckRef) => {
    setOpening(true);
    try {
      const res = await fetch(`/api/decks/${d.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to open');
      setDeck(json.deck as Deck);
      setView('editor');
      router.push('/create');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to open deck');
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--stg-cream)]">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
          {/* page heading */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="stg-label flex items-center gap-2.5 text-[color:var(--stg-ink)]/60">
                <span className="inline-block h-2 w-2 bg-[color:var(--stg-yellow)]" aria-hidden />
                The archive
              </p>
              <h1 className="stg-display mt-3 text-4xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-5xl">
                Your decks, ready to rerun.
              </h1>
            </div>
            <p className="stg-label pb-1 text-[10px] text-[color:var(--stg-ink)]/60">
              Autosaved · Export, duplicate, import .deck.json
            </p>
          </div>

          {/* Section 1 — Studio decks */}
          <section className="mt-10" aria-labelledby="studio-decks-h">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center bg-[color:var(--stg-ink)] text-[color:var(--stg-yellow)]">
                <FolderOpen className="h-4 w-4" aria-hidden />
              </span>
              <h2 id="studio-decks-h" className="stg-display text-2xl uppercase leading-none">
                Studio decks
              </h2>
              {opening && (
                <span className="stg-label inline-flex items-center gap-1.5 text-[9px] text-[color:var(--stg-ink)]/60">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Opening…
                </span>
              )}
            </div>
            <div className="mt-4 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] p-4 shadow-[6px_6px_0_0_var(--stg-ink)] sm:p-6">
              <div className="df-scroll max-h-[68vh] overflow-y-auto pr-1">
                <RecentDecks onOpen={openStudioDeck} hideHeading hideHtmlList />
              </div>
            </div>
          </section>

          {/* Section 2 — HTML template decks (HtmlDeckList owns its heading +
              grid; neutralize its outer top rule so it sits inside the card) */}
          <section className="mt-12" aria-labelledby="html-decks-h">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center bg-[color:var(--stg-yellow)] text-[color:var(--stg-ink)]">
                <LayoutTemplate className="h-4 w-4" aria-hidden />
              </span>
              <h2 id="html-decks-h" className="stg-display text-2xl uppercase leading-none">
                HTML template decks
              </h2>
            </div>
            <div className="mt-4 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] p-4 shadow-[6px_6px_0_0_var(--stg-yellow-deep)] sm:p-6">
              <div className="df-scroll max-h-[80vh] overflow-y-auto pr-1 [&>div]:mt-0 [&>div]:border-t-0 [&>div]:pt-0">
                <HtmlDeckList />
              </div>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
