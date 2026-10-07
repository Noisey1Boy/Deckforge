'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore, newSlideId } from '@/lib/store/deck-store';
import { getTheme } from '@/lib/design/themes';
import type { Deck, DeckOutline, Slide } from '@/lib/deck/types';
import { ScaledSlide } from '@/components/deck/ScaledSlide';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, PenLine, CheckCircle2 } from 'lucide-react';

type SlideStatus = 'pending' | 'loading' | 'done' | 'error';

const ERROR_NOTES_PREFIX = '(This slide could not be auto-generated';

/** Deterministic placeholder id for streamed slides without one. */
function slideKey(index: number): string {
  return `slot-${index}`;
}

export function GeneratingView() {
  const outline = useAppStore((s) => s.outline) as DeckOutline;
  const themeChoice = useAppStore((s) => s.themeChoice);
  const dataAssets = useAppStore((s) => s.dataAssets);
  const setDeck = useAppStore((s) => s.setDeck);
  const setView = useAppStore((s) => s.setView);
  const genSettings = useAppStore((s) => s.genSettings);

  const [slides, setSlides] = useState<Slide[]>([]);
  const [received, setReceived] = useState(0);
  const [errorSlots, setErrorSlots] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(0);
  const [currentTitle, setCurrentTitle] = useState('');
  const [fatal, setFatal] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !outline) return;
    started.current = true;

    const run = async () => {
      const themeId =
        themeChoice === 'auto' ? outline.recommendedThemeId ?? 'corporate-clean' : themeChoice;
      const collected: Slide[] = [];
      let deckId = '';

      try {
        const res = await fetch('/api/generate/slides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outline,
            themeId,
            chartAssignments: dataAssets.chartAssignments,
            language: genSettings.language || 'English',
            audience: genSettings.audience || undefined,
            tone: genSettings.tone || undefined,
            verbosity: genSettings.verbosity || 'standard',
            strategy: genSettings.strategy || 'auto',
          }),
        });
        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || 'Slide generation failed');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { value, done: streamDone } = await reader.read();
          if (streamDone) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';
          for (const part of parts) {
            const evLine = part.split('\n').find((l) => l.startsWith('event: '));
            const dataLine = part.split('\n').find((l) => l.startsWith('data: '));
            if (!evLine || !dataLine) continue;
            const event = evLine.slice(7).trim();
            const payload = JSON.parse(dataLine.slice(6));
            if (event === 'slide') {
              const index = payload.index as number;
              const slide = payload.slide as Slide;
              collected[index] = slide;
              setSlides(collected.filter(Boolean));
              setReceived(collected.filter(Boolean).length);
              if (typeof slide.notes === 'string' && slide.notes.startsWith(ERROR_NOTES_PREFIX)) {
                setErrorSlots((prev) => new Set(prev).add(index));
              }
            } else if (event === 'progress') {
              setDone(payload.done);
              setCurrentTitle(payload.currentTitle);
            } else if (event === 'error') {
              throw new Error(payload.error || 'Generation failed');
            }
          }
        }

        const finalSlides = collected.filter(Boolean);
        if (!finalSlides.length) throw new Error('No slides were generated. Please try again.');

        // If we have a diagram but no diagram slide, insert one before closing.
        if (dataAssets.diagram && !finalSlides.some((s) => s.layout === 'diagram')) {
          const closingIdx = finalSlides.findIndex((s) => s.layout === 'closing');
          const insertAt = closingIdx === -1 ? finalSlides.length : closingIdx;
          finalSlides.splice(insertAt, 0, {
            id: newSlideId(),
            layout: 'diagram',
            title: dataAssets.diagram.title,
            diagram: {
              direction: dataAssets.diagram.direction,
              nodes: dataAssets.diagram.nodes,
              edges: dataAssets.diagram.edges,
            },
            notes: 'Generated from the pasted Mermaid diagram.',
          });
        }

        const deck: Deck = {
          id: `deck_${Date.now().toString(36)}`,
          title: outline.title,
          subtitle: outline.subtitle,
          themeId,
          slides: finalSlides,
          meta: {
            sourcePrompt: outline.title,
            generatedAt: new Date().toISOString(),
            language: genSettings.language || 'English',
            audience: genSettings.audience || undefined,
            tone: genSettings.tone || undefined,
          },
        };

        const saveRes = await fetch('/api/decks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deck),
        });
        const saveJson = await saveRes.json();
        if (saveRes.ok && saveJson.id) {
          deckId = saveJson.id;
          deck.id = deckId;
        }
        setDeck(deck);
        toast.success('Deck ready!');
        setView('editor');
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Generation failed';
        setFatal(msg);
        toast.error(msg);
      }
    };
    run();
  }, []);

  if (fatal) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="text-2xl font-bold">Generation hit a snag</h1>
        <p className="text-muted-foreground">{fatal}</p>
        <Button onClick={() => setView('outline')}>Back to outline</Button>
      </div>
    );
  }

  const total = outline?.slides.length ?? 0;
  const latest = slides.length ? slides[slides.length - 1] : null;
  const theme = getTheme(themeChoice === 'auto' ? outline?.recommendedThemeId : themeChoice);

  // Per-slide status: slides stream in strictly ascending outline order, so a
  // slot is done once received; the two slots at the pipeline head (2-way
  // concurrency) are writing; anything the server replaced with a fallback
  // placeholder is flagged failed; the rest are queued.
  const statusFor = (i: number): SlideStatus => {
    if (errorSlots.has(i)) return 'error';
    if (i < received) return 'done';
    if (!fatal && i < Math.min(received + 2, total)) return 'loading';
    return fatal ? 'error' : 'pending';
  };
  const STATUS_SR: Record<SlideStatus, string> = {
    pending: 'queued',
    loading: 'writing',
    done: 'done',
    error: 'failed',
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <header className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          {done >= total && total > 0 ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          ) : (
            <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
          )}
          Writing your deck…
        </h1>
        <Progress value={total ? (done / total) * 100 : 0} className="h-2.5" />
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <PenLine className="h-3.5 w-3.5" />
          {currentTitle ? `“${currentTitle}”` : 'Warming up the design engine…'} · {done}/{total}
        </p>
      </header>

      {total > 0 && (
        <section aria-label="Slide status" aria-live="polite">
          <ol
            className="max-h-64 overflow-y-auto divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white/60 pr-2
              [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300"
          >
            {outline.slides.map((item, i) => {
              const st = statusFor(i);
              return (
                <li key={slideKey(i)} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span
                    aria-hidden
                    className={
                      'inline-block h-2 w-2 shrink-0 rounded-full ' +
                      (st === 'done'
                        ? 'bg-emerald-500'
                        : st === 'loading'
                          ? 'bg-amber-500 motion-safe:animate-pulse'
                          : st === 'error'
                            ? 'bg-red-500'
                            : 'border border-neutral-300 bg-transparent')
                    }
                  />
                  <span className="sr-only">{STATUS_SR[st]}</span>
                  <span className="w-6 shrink-0 text-right font-mono text-xs text-neutral-400" aria-hidden>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={st === 'pending' ? 'truncate text-neutral-400' : 'truncate text-neutral-800'}>
                    {item.title || 'Untitled slide'}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {slides.slice(0, done < total ? Math.max(0, slides.length - 1) : undefined).map((s, i) => (
          <div key={s.id ?? i} className="rounded-xl overflow-hidden border border-neutral-200 shadow-sm opacity-90">
            <ScaledSlide slide={s} theme={theme} index={i} pageCount={total} />
          </div>
        ))}
        {latest && done < total && (
          <div className="rounded-xl overflow-hidden border-2 border-neutral-900 shadow-lg ring-4 ring-neutral-900/10">
            <ScaledSlide slide={latest} theme={theme} index={slides.length - 1} pageCount={total} />
          </div>
        )}
        {done < total && (
          <div className="rounded-xl border-2 border-dashed border-neutral-300 min-h-44 grid place-items-center text-muted-foreground text-sm">
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Writing next slide…</span>
          </div>
        )}
      </div>
    </div>
  );
}
