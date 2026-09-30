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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { fileToDeckImage } from '@/lib/media/image';
import type { LayoutId, Slide } from '@/lib/deck/types';
import { LAYOUT_IDS } from '@/lib/deck/types';
import { cn } from '@/lib/utils';
import {
  Play, Plus, Trash2, Copy, Presentation, ChevronLeft, ChevronRight, Check, Cloud,
  Undo2, Redo2, Keyboard, Type, Hash, List, Columns2, Image as ImageIcon, Quote,
  BarChart3, Workflow, Table2, Flag, Sigma, Eye, EyeOff,
} from 'lucide-react';

const LAYOUT_ICONS: Record<LayoutId, string> = {
  title: 'T', section: '§', bullets: '•', 'two-column': '⫿', image: '🖼',
  quote: '❝', stats: '#', chart: '▮', diagram: '⇄', comparison: '⇋', closing: '◆',
};

const LAYOUT_MENU_ITEMS: Array<{ id: LayoutId; label: string; icon: React.ReactNode }> = [
  { id: 'title', label: 'Title', icon: <Type className="h-4 w-4" /> },
  { id: 'section', label: 'Section break', icon: <Hash className="h-4 w-4" /> },
  { id: 'bullets', label: 'Bullets', icon: <List className="h-4 w-4" /> },
  { id: 'two-column', label: 'Two column', icon: <Columns2 className="h-4 w-4" /> },
  { id: 'stats', label: 'Stats', icon: <Sigma className="h-4 w-4" /> },
  { id: 'chart', label: 'Chart', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'diagram', label: 'Diagram', icon: <Workflow className="h-4 w-4" /> },
  { id: 'comparison', label: 'Comparison', icon: <Table2 className="h-4 w-4" /> },
  { id: 'quote', label: 'Quote', icon: <Quote className="h-4 w-4" /> },
  { id: 'image', label: 'Image', icon: <ImageIcon className="h-4 w-4" /> },
  { id: 'closing', label: 'Closing', icon: <Flag className="h-4 w-4" /> },
];

function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

function SlideCard({
  slide, index, active, pageCount,
  onSelect, onDuplicate, onDelete, onToggleHidden, onDragStart, onDragOver, onDrop,
  dragging, dropTarget,
}: {
  slide: Slide;
  index: number;
  active: boolean;
  pageCount: number;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleHidden: () => void;
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
        dropTarget && 'ring-2 ring-neutral-900/60',
        slide.hidden && !dragging && 'opacity-55 border-dashed'
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      aria-label={`Slide ${index + 1}: ${slide.title || slide.layout}${slide.hidden ? ' (hidden)' : ''}`}
      aria-current={active}
    >
      <div className="pointer-events-none">
        <ScaledSlide slide={slide} theme={getTheme(theme)} index={index} pageCount={pageCount} />
      </div>
      <div className="absolute top-1 left-1 flex items-center gap-1">
        <span className="bg-black/60 text-white text-[10px] rounded px-1.5 py-0.5 font-mono">{index + 1}</span>
        {slide.hidden && (
          <span className="bg-neutral-900/80 text-white text-[9px] uppercase tracking-wider rounded px-1.5 py-0.5 font-semibold inline-flex items-center gap-0.5">
            <EyeOff className="h-2.5 w-2.5" /> Hidden
          </span>
        )}
      </div>
      <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleHidden(); }}
          className="bg-black/60 hover:bg-black/80 text-white rounded p-1"
          aria-label={slide.hidden ? 'Show slide in presentation' : 'Hide slide from presentation'}
          title={slide.hidden ? 'Show slide (H)' : 'Hide slide (H)'}
        >
          {slide.hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        </button>
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
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [droppingImage, setDroppingImage] = useState(false);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const canUndo = useAppStore((s) => s.past.length > 0);
  const canRedo = useAppStore((s) => s.future.length > 0);

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

  // Editor keyboard shortcuts: J/K or ↑/↓ navigate, ⌘D duplicate, Del remove,
  // ⌘Z / ⇧⌘Z history, ? toggles the cheat-sheet. Ignored while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const st = useAppStore.getState();
      if (!st.deck) return;
      const mod = e.metaKey || e.ctrlKey;
      const idx = st.currentSlideIndex;
      const total = st.deck.slides.length;
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const cur = st.deck.slides[idx];
        if (cur) st.duplicateSlide(cur.id);
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        const cur = st.deck.slides[idx];
        if (cur) st.updateSlide(cur.id, { hidden: !cur.hidden });
        return;
      }
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault(); st.undo(); return;
      }
      if ((mod && e.key.toLowerCase() === 'z' && e.shiftKey) || (mod && e.key.toLowerCase() === 'y')) {
        e.preventDefault(); st.redo(); return;
      }
      if (mod) return; // let other mod-combos through to the browser
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault(); setShowShortcuts((v) => !v); return;
      }
      switch (e.key) {
        case 'j': case 'J': case 'ArrowDown':
          e.preventDefault();
          if (idx < total - 1) st.setCurrentSlide(idx + 1);
          break;
        case 'k': case 'K': case 'ArrowUp':
          e.preventDefault();
          if (idx > 0) st.setCurrentSlide(idx - 1);
          break;
        case 'Delete': case 'Backspace': {
          if (total <= 1) break;
          e.preventDefault();
          const cur = st.deck.slides[idx];
          if (cur) {
            st.removeSlide(cur.id);
            toast('Slide deleted', { description: 'Press ⌘Z to undo.' });
          }
          break;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!deck) setView('create');
  }, [deck, setView]);

  if (!deck) return null;

  const slides = deck.slides;
  const current = slides[currentSlideIndex] ?? slides[0];
  const theme = getTheme(deck.themeId);

  const addSlide = (layout: LayoutId) => {
    const blank: Slide = { id: newSlideId(), layout, title: 'New slide', bullets: layout === 'bullets' ? ['First point'] : undefined };
    insertSlide(currentSlideIndex + 1, blank);
  };

  // ---- drop an image file anywhere on the canvas to fill the current slide
  const handleCanvasDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDroppingImage(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (!file || !current) return;
    try {
      const url = await fileToDeckImage(file);
      updateSlide(current.id, { layout: 'image', image: { url, alt: file.name.replace(/\.[^.]+$/, '') || 'Dropped image' } });
      toast.success('Image dropped onto the slide.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not use that image.');
    }
  };

  const total = slides.length;

  const SHORTCUTS: Array<{ keys: string; label: string }> = [
    { keys: 'J / K · ↑ ↓', label: 'Previous / next slide' },
    { keys: '⌘ D', label: 'Duplicate current slide' },
    { keys: 'H', label: 'Hide / show slide in presentation' },
    { keys: 'Del', label: 'Delete current slide' },
    { keys: '⌘ Z', label: 'Undo' },
    { keys: '⇧⌘ Z', label: 'Redo' },
    { keys: '?', label: 'Toggle this cheat-sheet' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-background/95 backdrop-blur flex-wrap">
        <input
          value={deck.title}
          onChange={(e) => patchDeck({ title: e.target.value })}
          className="font-semibold text-lg bg-transparent outline-none focus:bg-neutral-100 rounded px-2 py-1 min-w-0 flex-1 sm:max-w-60 truncate"
          aria-label="Deck title"
          maxLength={120}
        />
        <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1 w-20">
          {saving === 'saving' ? (<><Cloud className="h-3.5 w-3.5 animate-pulse" /> Saving…</>) : saving === 'saved' ? (<><Check className="h-3.5 w-3.5 text-emerald-600" /> Saved</>) : null}
        </span>
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          <div className="flex items-center rounded-md border border-neutral-200 overflow-hidden" role="group" aria-label="History">
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo (⌘Z)"
              aria-label="Undo"
              className="h-9 w-9 grid place-items-center hover:bg-neutral-100 disabled:opacity-35 disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:z-10"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <span className="w-px h-5 bg-neutral-200" aria-hidden />
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo (⇧⌘Z)"
              aria-label="Redo"
              className="h-9 w-9 grid place-items-center hover:bg-neutral-100 disabled:opacity-35 disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:z-10"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>
          <span className="w-px h-6 bg-neutral-200 mx-1" aria-hidden />
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
          <span className="w-px h-6 bg-neutral-200 mx-1" aria-hidden />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-neutral-500 hover:text-neutral-900"
            onClick={() => setShowShortcuts(true)}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          <span className="w-px h-6 bg-neutral-200 mx-1" aria-hidden />
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
                  onToggleHidden={() => updateSlide(s.id, { hidden: !s.hidden })}
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => { e.preventDefault(); setOverIndex(i); }}
                  onDrop={() => { if (dragIndex != null && dragIndex !== i) reorderSlides(dragIndex, i); setDragIndex(null); setOverIndex(null); }}
                />
              ))}
            </div>
          </ScrollArea>
          <div className="p-3 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="w-full gap-1.5">
                  <Plus className="h-4 w-4" /> Add slide
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-52 max-h-80 overflow-y-auto">
                {LAYOUT_MENU_ITEMS.map((l) => (
                  <DropdownMenuItem key={l.id} onClick={() => addSlide(l.id)} className="gap-2.5">
                    <span className="text-neutral-400">{l.icon}</span>
                    {l.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* canvas */}
        <main
          className="relative flex-1 min-w-0 flex flex-col bg-neutral-100"
          style={{
            backgroundImage: 'radial-gradient(#d8d8d8 1px, transparent 1.4px)',
            backgroundSize: '22px 22px',
          }}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes('Files')) return;
            e.preventDefault();
            setDroppingImage(true);
          }}
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setDroppingImage(false);
          }}
          onDrop={handleCanvasDrop}
        >
          {droppingImage && (
            <div className="absolute inset-2 z-20 grid place-items-center rounded-xl border-2 border-dashed border-neutral-900 bg-neutral-50/85 backdrop-blur-sm pointer-events-none" aria-hidden>
              <div className="text-center">
                <ImageIcon className="h-7 w-7 mx-auto text-neutral-700" />
                <p className="mt-2 text-sm font-semibold text-neutral-900">Drop to fill this slide</p>
                <p className="text-xs text-muted-foreground mt-0.5">PNG · JPG · WebP · GIF</p>
              </div>
            </div>
          )}
          <div className="flex-1 min-h-0 p-4 sm:p-8 flex items-center justify-center overflow-hidden">
            {current && (
              <div className="w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl shadow-neutral-900/25 ring-1 ring-black/10">
                <ScaledSlide slide={current} theme={theme} deckTitle={deck.title} index={currentSlideIndex} pageCount={total} interactive />
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-3 pb-3 px-4">
            {current?.hidden && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 text-xs font-medium" title="This slide is skipped in present mode and exports">
                <EyeOff className="h-3 w-3" /> Hidden from presentation — press H to show
              </span>
            )}
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

      {/* keyboard shortcuts cheat-sheet */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Keyboard className="h-5 w-5" /> Keyboard shortcuts</DialogTitle>
            <DialogDescription>
              Work faster in the editor. Shortcuts are ignored while typing in a field.
            </DialogDescription>
          </DialogHeader>
          <ul className="divide-y divide-neutral-100">
            {SHORTCUTS.map((s) => (
              <li key={s.keys} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-neutral-600">{s.label}</span>
                <kbd className="rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-mono text-neutral-700 shadow-sm">{s.keys}</kbd>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
