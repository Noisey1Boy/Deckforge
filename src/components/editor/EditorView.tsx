'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppStore, newSlideId } from '@/lib/store/deck-store';
import { THEMES, getTheme } from '@/lib/design/themes';
import { ScaledSlide } from '@/components/deck/ScaledSlide';
import { SlideInspector } from './SlideInspector';
import { ExportMenu } from '@/components/app/ExportMenu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { LayoutId, Slide } from '@/lib/deck/types';
import { LAYOUT_IDS } from '@/lib/deck/types';
import { cn } from '@/lib/utils';
import {
  Play, Plus, Trash2, Copy, Presentation, ChevronLeft, ChevronRight, Check, Cloud,
} from 'lucide-react';

const LAYOUT_ICONS: Record<LayoutId, string> = {
  title: 'T', section: '§', bullets: '•', 'two-column': '⫿', image: '🖼',
  quote: '❝', stats: '#', chart: '▮', diagram: '⇄', comparison: '⇋', closing: '◆',
};

function SlideCard({
  slide, index, active, pageCount,
  onSelect, onDuplicate, onDelete, onDragStart, onDragOver, onDrop,
  dragging, dropTarget,
}: {
  slide: Slide;
  index: number;
  active: boolean;
  pageCount: number;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  dragging: boolean;
  dropTarget: boolean;
}) {
  const theme = useAppStore((s) => s.deck?.themeId);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        'group relative rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing bg-card',
        active ? 'border-neutral-900 shadow-md' : 'border-transparent hover:border-neutral-300',
        dragging && 'opacity-40',
        dropTarget && 'ring-2 ring-neutral-900/60'
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      aria-label={`Slide ${index + 1}: ${slide.title || slide.layout}`}
      aria-current={active}
    >
      <div className="pointer-events-none">
        <ScaledSlide slide={slide} theme={getTheme(theme)} index={index} pageCount={pageCount} />
      </div>
      <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] rounded px-1.5 py-0.5 font-mono">{index + 1}</div>
      <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="bg-black/60 hover:bg-black/80 text-white rounded p-1"
          aria-label="Duplicate slide"
        >
          <Copy className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="bg-black/60 hover:bg-red-600 text-white rounded p-1"
          aria-label="Delete slide"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function EditorView() {
  const deck = useAppStore((s) => s.deck);
  const patchDeck = useAppStore((s) => s.patchDeck);
  const currentSlideIndex = useAppStore((s) => s.currentSlideIndex);
  const setCurrentSlide = useAppStore((s) => s.setCurrentSlide);
  const updateSlide = useAppStore((s) => s.updateSlide);
  const reorderSlides = useAppStore((s) => s.reorderSlides);
  const insertSlide = useAppStore((s) => s.insertSlide);
  const removeSlide = useAppStore((s) => s.removeSlide);
  const duplicateSlide = useAppStore((s) => s.duplicateSlide);
  const setDeckTheme = useAppStore((s) => s.setDeckTheme);
  const setPresenting = useAppStore((s) => s.setPresenting);
  const setView = useAppStore((s) => s.setView);
  const dirty = useAppStore((s) => s.dirty);
  const markSaved = useAppStore((s) => s.markSaved);

  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // ------------------------------------------------------------ autosave
  const save = useCallback(async () => {
    const d = useAppStore.getState().deck;
    if (!d) return;
    setSaving('saving');
    try {
      await fetch(`/api/decks/${d.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d),
      });
      setSaving('saved');
      markSaved();
    } catch {
      setSaving('idle');
      toast.error('Autosave failed — check your connection.');
    }
  }, [markSaved]);
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(save, 1200);
    return () => clearTimeout(t);
  }, [dirty, deck, save]);

  if (!deck) {
    setView('create');
    return null;
  }

  const slides = deck.slides;
  const current = slides[currentSlideIndex] ?? slides[0];
  const theme = getTheme(deck.themeId);

  const addSlide = (layout: LayoutId) => {
    const blank: Slide = { id: newSlideId(), layout, title: 'New slide', bullets: layout === 'bullets' ? ['First point'] : undefined };
    insertSlide(currentSlideIndex + 1, blank);
  };

  const total = slides.length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-background/95 backdrop-blur flex-wrap">
        <input
          value={deck.title}
          onChange={(e) => patchDeck({ title: e.target.value })}
          className="font-semibold text-lg bg-transparent outline-none focus:bg-neutral-100 rounded px-2 py-1 min-w-0 flex-1 sm:max-w-xs"
          aria-label="Deck title"
          maxLength={120}
        />
        <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1 w-20">
          {saving === 'saving' ? (<><Cloud className="h-3.5 w-3.5 animate-pulse" /> Saving…</>) : saving === 'saved' ? (<><Check className="h-3.5 w-3.5 text-emerald-600" /> Saved</>) : null}
        </span>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <Select value={deck.themeId} onValueChange={setDeckTheme}>
            <SelectTrigger className="w-44 h-9" aria-label="Switch design system"><SelectValue /></SelectTrigger>
            <SelectContent>
              {THEMES.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={current?.layout ?? 'bullets'} onValueChange={(v) => current && updateSlide(current.id, { layout: v as LayoutId })}>
            <SelectTrigger className="w-36 h-9 capitalize" aria-label="Current layout"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LAYOUT_IDS.map((l) => (
                <SelectItem key={l} value={l} className="capitalize">{l.replace('-', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportMenu />
          <Button onClick={() => setPresenting(true)} className="gap-1.5 bg-neutral-900 hover:bg-neutral-800 h-9">
            <Play className="h-4 w-4" /> Present
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* slide list */}
        <aside className="w-56 md:w-64 shrink-0 border-r bg-neutral-50 hidden md:flex md:flex-col">
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {slides.map((s, i) => (
                <SlideCard
                  key={s.id}
                  slide={s}
                  index={i}
                  active={i === currentSlideIndex}
                  pageCount={total}
                  dragging={dragIndex === i}
                  dropTarget={overIndex === i && dragIndex !== i}
                  onSelect={() => setCurrentSlide(i)}
                  onDuplicate={() => duplicateSlide(s.id)}
                  onDelete={() => removeSlide(s.id)}
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => { e.preventDefault(); setOverIndex(i); }}
                  onDrop={() => { if (dragIndex != null && dragIndex !== i) reorderSlides(dragIndex, i); setDragIndex(null); setOverIndex(null); }}
                />
              ))}
            </div>
          </ScrollArea>
          <div className="p-3 border-t">
            <Button variant="secondary" className="w-full gap-1.5" onClick={() => addSlide('bullets')}>
              <Plus className="h-4 w-4" /> Add slide
            </Button>
          </div>
        </aside>

        {/* mobile slide strip */}
        <div className="md:hidden absolute" style={{ display: 'none' }} />

        {/* canvas */}
        <main className="flex-1 min-w-0 flex flex-col bg-neutral-100">
          <div className="flex-1 min-h-0 p-4 sm:p-8 flex items-center justify-center overflow-hidden">
            {current && (
              <div className="w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl shadow-neutral-900/20 ring-1 ring-neutral-200">
                <ScaledSlide slide={current} theme={theme} deckTitle={deck.title} index={currentSlideIndex} pageCount={total} interactive />
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-3 pb-3 px-4">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentSlide(currentSlideIndex - 1)} disabled={currentSlideIndex === 0} aria-label="Previous slide">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground font-mono">{currentSlideIndex + 1} / {total}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentSlide(currentSlideIndex + 1)} disabled={currentSlideIndex >= total - 1} aria-label="Next slide">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {/* mobile add/list strip */}
          <div className="md:hidden flex gap-2 overflow-x-auto px-3 pb-3" aria-label="Slides">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(i)}
                className={cn('shrink-0 w-24 rounded-md overflow-hidden border-2', i === currentSlideIndex ? 'border-neutral-900' : 'border-transparent')}
                aria-label={`Go to slide ${i + 1}`}
              >
                <span className="text-xs font-mono">{LAYOUT_ICONS[s.layout]} {i + 1}</span>
              </button>
            ))}
            <Button variant="secondary" size="sm" className="shrink-0 h-auto" onClick={() => addSlide('bullets')}><Plus className="h-3.5 w-3.5" /></Button>
          </div>
        </main>

        {/* inspector */}
        <aside className="w-80 shrink-0 border-l hidden lg:block">
          <ScrollArea className="h-full">
            <div className="p-4">
              {current && <SlideInspector slide={current} />}
            </div>
          </ScrollArea>
        </aside>
      </div>

      {/* mobile inspector: below canvas */}
      <div className="lg:hidden border-t max-h-64 overflow-y-auto">
        {current && (
          <details className="p-3">
            <summary className="text-sm font-medium cursor-pointer">Edit slide {currentSlideIndex + 1}</summary>
            <div className="pt-3">
              <SlideInspector slide={current} />
            </div>
          </details>
        )}
      </div>

      {/* floating present hint */}
      <button
        onClick={() => setPresenting(true)}
        className="fixed bottom-4 right-4 lg:hidden bg-neutral-900 text-white rounded-full p-3 shadow-lg"
        aria-label="Start presenting"
      >
        <Presentation className="h-5 w-5" />
      </button>
    </div>
  );
}
