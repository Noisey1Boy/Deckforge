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

export function GeneratingView() {
  const outline = useAppStore((s) => s.outline) as DeckOutline;
  const themeChoice = useAppStore((s) => s.themeChoice);
  const dataAssets = useAppStore((s) => s.dataAssets);
  const setDeck = useAppStore((s) => s.setDeck);
  const setView = useAppStore((s) => s.setView);
  const genSettings = useAppStore((s) => s.genSettings);

  const [slides, setSlides] = useState<Slide[]>([]);
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
              collected[payload.index] = payload.slide as Slide;
              setSlides(collected.filter(Boolean));
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

      <div className="grid gap-4 sm:grid-cols-2">
        {slides.slice(0, done < total ? Math.max(0, slides.length - 1) : undefined).map((s, i) => (
          <div key={s.id ?? i} className="rounded-xl overflow-hidden border border-neutral-200 shadow-sm opacity-90">
            <ScaledSlide slide={s} theme={theme} index={i} pageCount={total} />
          </div>
        ))}
        {slides.length > 0 && done < total && (
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
