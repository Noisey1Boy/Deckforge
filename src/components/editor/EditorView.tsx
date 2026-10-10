'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, useAppStoreDebug, newSlideId } from '@/lib/store/deck-store';
import { THEMES, deckTheme, getTheme } from '@/lib/design/themes';
import { deckFooterText } from '@/lib/deck/types';
import { ScaledSlide } from '@/components/deck/ScaledSlide';
import { SlideInspector } from './SlideInspector';
import { ExportMenu, useExportActions } from '@/components/app/ExportMenu';
import { CommandPalette, LAYOUT_MENU_ITEMS, type ExportKind } from './CommandPalette';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { fileToDeckImage } from '@/lib/media/image';
import type { LayoutId, Slide, TransitionKind } from '@/lib/deck/types';
import { LAYOUT_IDS } from '@/lib/deck/types';
import { cn } from '@/lib/utils';
import {
  Play, Plus, Trash2, Copy, Presentation, ChevronLeft, ChevronRight, Check, Cloud,
  Undo2, Redo2, Keyboard, Type, Hash, List, Columns2, Image as ImageIcon, Quote,
  BarChart3, Workflow, Table2, Flag, Sigma, Eye, EyeOff, Shuffle, Palette, X,
  SquareStack, Clock3, Command as CommandIcon, NotebookPen, Loader2, Sparkles,
  ArrowUp, ArrowDown, LayoutGrid, Info,
} from 'lucide-react';

const LAYOUT_ICONS: Record<LayoutId, string> = {
  title: 'T', section: '§', bullets: '•', 'two-column': '⫿', image: '🖼',
  quote: '❝', stats: '#', chart: '▮', diagram: '⇄', comparison: '⇋', closing: '◆',
};

function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

function SlideCard({
  slide, index, active, pageCount,
  onSelect, onDuplicate, onDelete, onToggleHidden, onDragStart, onDragOver, onDrop,
  dragging, dropTarget, selected, onOpen, showCaption,
}: {
  slide: Slide;
  index: number;
  active: boolean;
  pageCount: number;
  onSelect: (e: React.MouseEvent) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleHidden: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  dragging: boolean;
  dropTarget: boolean;
  selected: boolean;
  /** Board view: double-click returns to the canvas. */
  onOpen?: () => void;
  /** Board view: caption row under the thumbnail. */
  showCaption?: boolean;
}) {
  const deck = useAppStore((s) => s.deck);
  const themeManifest = deck ? deckTheme(deck) : getTheme(deck?.themeId ?? 'corporate-clean');
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        'group relative rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing bg-card',
        active ? 'shadow-md' : 'border-transparent hover:border-neutral-300',
        dragging && 'opacity-40',
        dropTarget && 'ring-2 ring-neutral-900/60',
        selected && !active && 'ring-2 ring-emerald-500/70 ring-offset-1',
        slide.hidden && !dragging && 'opacity-55 border-dashed'
      )}
      style={active ? { borderColor: themeManifest.tokens.colors.primary } : undefined}
      onClick={onSelect}
      onDoubleClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(e as unknown as React.MouseEvent)}
      aria-label={`Slide ${index + 1}: ${slide.title || slide.layout}${slide.hidden ? ' (hidden)' : ''}${selected ? ' (selected)' : ''}`}
      aria-current={active}
    >
      <div className="pointer-events-none">
        <ScaledSlide slide={slide} theme={themeManifest} index={index} pageCount={pageCount} showPageNumbers={false} />
      </div>
      {showCaption && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-card border-t border-neutral-100">
          <span className="text-[10px] font-mono text-neutral-400 shrink-0">{String(index + 1).padStart(2, '0')}</span>
          <span className="text-[11px] text-neutral-600 truncate">{slide.title || 'Untitled'}</span>
          {slide.illustrative && (
            <span className="ml-auto shrink-0 inline-flex items-center gap-0.5 text-[9px] font-medium text-amber-600" title="Illustrative figures">
              <Info className="h-3 w-3" /> AI
            </span>
          )}
        </div>
      )}
      <div className="absolute top-1 left-1 flex items-center gap-1">
        <span className="bg-black/60 text-white text-[10px] rounded px-1.5 py-0.5 font-mono">{index + 1}</span>
        <span className="bg-black/45 text-white/90 text-[10px] rounded px-1 py-0.5" title={`Layout: ${slide.layout.replace('-', ' ')}`}>
          {LAYOUT_ICONS[slide.layout]}
        </span>
        {slide.hidden && (
          <span className="bg-neutral-900/80 text-white text-[9px] uppercase tracking-wider rounded px-1.5 py-0.5 font-semibold inline-flex items-center gap-0.5">
            <EyeOff className="h-2.5 w-2.5" /> Hidden
          </span>
        )}
      </div>
      {selected && (
        <span className="absolute bottom-1 right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow" aria-hidden>
          <Check className="h-3 w-3" />
        </span>
      )}
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
  useAppStoreDebug();
  const router = useRouter();
  const deck = useAppStore((s) => s.deck);
  const patchDeck = useAppStore((s) => s.patchDeck);
  const currentSlideIndex = useAppStore((s) => s.currentSlideIndex);
  const setCurrentSlide = useAppStore((s) => s.setCurrentSlide);
  const updateSlide = useAppStore((s) => s.updateSlide);
  const reorderSlides = useAppStore((s) => s.reorderSlides);
  const insertSlide = useAppStore((s) => s.insertSlide);
  const removeSlide = useAppStore((s) => s.removeSlide);
  const duplicateSlide = useAppStore((s) => s.duplicateSlide);
  const removeSlides = useAppStore((s) => s.removeSlides);
  const duplicateSlides = useAppStore((s) => s.duplicateSlides);
  const setHiddenSlides = useAppStore((s) => s.setHiddenSlides);
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
  const [showStyle, setShowStyle] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // slide board (G): sortable grid of all slides replacing the canvas
  const [boardOpen, setBoardOpen] = useState(false);
  const boardOpenRef = useRef(false);
  useEffect(() => {
    boardOpenRef.current = boardOpen;
  }, [boardOpen]);
  const [notesProgress, setNotesProgress] = useState<{ done: number; total: number } | null>(null);
  // AI slide composer: "give me a slide about …" → inserted after the current one
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTopic, setComposeTopic] = useState('');
  const [composing, setComposing] = useState(false);
  // multi-selection (editor only): cmd/ctrl-click toggles, shift-click ranges
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const anchorRef = useRef<number | null>(null);
  const selectedIdsRef = useRef<string[]>([]);
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const canUndo = useAppStore((s) => s.past.length > 0);
  const canRedo = useAppStore((s) => s.future.length > 0);
  const patchSlides = useAppStore((s) => s.patchSlides);
  const { pptx, pdf, html, notes: exportNotes, deckJson } = useExportActions();

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
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (mod) return; // let other mod-combos through to the browser
      if (e.key === '?') {
        e.preventDefault(); setShowShortcuts((v) => !v); return;
      }
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setBoardOpen((v) => !v);
        return;
      }
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        // move the current slide up/down in the deck order
        e.preventDefault();
        const to = e.key === 'ArrowUp' ? idx - 1 : idx + 1;
        if (to >= 0 && to < total) st.reorderSlides(idx, to);
        return;
      }
      if (e.key === 'Escape') {
        if (boardOpenRef.current) {
          setBoardOpen(false);
        }
        if (selectedIdsRef.current.length > 0) {
          setSelectedIds([]);
          anchorRef.current = null;
        }
        return;
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
          const sel = selectedIdsRef.current;
          if (sel.length > 0) {
            st.removeSlides(sel);
            toast(`${sel.length} slide${sel.length > 1 ? 's' : ''} deleted`, { description: 'Press ⌘Z to undo.' });
            setSelectedIds([]);
            anchorRef.current = null;
            break;
          }
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

  // ---- AI: write speaker notes for every visible slide that lacks them ----
  // (defined before the early return so hook order stays stable)
  const writeAllNotes = useCallback(async () => {
    const d = useAppStore.getState().deck;
    if (!d) return;
    const targets = d.slides.filter((s) => !s.hidden && !(s.notes ?? '').trim());
    if (!targets.length) {
      toast.info('All visible slides already have speaker notes.');
      return;
    }
    setNotesProgress({ done: 0, total: targets.length });
    const patches: Record<string, { notes: string }> = {};
    const language = d.meta?.language ?? 'English';
    let failures = 0;
    // two-way parallel pool: ~2× faster than sequential, order-independent
    const total = targets.length;
    let completed = 0;
    const queue = [...targets];
    const worker = async () => {
      while (queue.length) {
        const s = queue.shift();
        if (!s) break;
        try {
          const res = await fetch('/api/ai/slide', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'speaker_notes', slide: s, language }),
          });
          const json = await res.json();
          if (res.ok && typeof json.patch?.notes === 'string' && json.patch.notes.trim()) {
            patches[s.id] = { notes: json.patch.notes };
          } else failures++;
        } catch {
          failures++;
        }
        completed++;
        setNotesProgress({ done: completed, total });
      }
    };
    await Promise.all([worker(), worker()]);
    const n = Object.keys(patches).length;
    if (n) patchSlides(patches); // one undo snapshot for the whole batch
    setNotesProgress(null);
    if (n && !failures) toast.success(`Speaker notes written for ${n} slide${n > 1 ? 's' : ''}.`);
    else if (n) toast(`Speaker notes written for ${n} slide${n > 1 ? 's' : ''}`, { description: `${failures} could not be generated.` });
    else toast.error('Could not generate notes — please retry.');
  }, [patchSlides]);

  // ---- AI: compose a brand-new slide from a one-line topic ---------------
  const composeSlide = useCallback(async () => {
    const d = useAppStore.getState().deck;
    const topic = composeTopic.trim();
    if (!d || !topic || composing) return;
    setComposing(true);
    try {
      const meta = d.meta ?? {};
      const context = [d.title, meta.audience ? `audience: ${meta.audience}` : '', meta.tone ? `tone: ${meta.tone}` : '']
        .filter(Boolean)
        .join(' — ');
      const res = await fetch('/api/ai/slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'compose_slide', topic, context, language: meta.language ?? 'English' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not compose the slide.');
      const made = json.slide as Partial<Slide>;
      if (!made || typeof made !== 'object') throw new Error('Unexpected AI response.');
      const idx = useAppStore.getState().currentSlideIndex;
      insertSlide(idx + 1, {
        id: newSlideId(),
        layout: (made.layout ?? 'bullets') as LayoutId,
        title: made.title ?? topic.slice(0, 70),
        body: made.body,
        bullets: made.bullets,
        leftTitle: made.leftTitle,
        leftContent: made.leftContent,
        rightTitle: made.rightTitle,
        rightContent: made.rightContent,
        quote: made.quote,
        attribution: made.attribution,
        stats: made.stats,
        notes: made.notes,
        illustrative: made.layout === 'stats',
      } as Slide);
      setComposeOpen(false);
      setComposeTopic('');
      toast.success(`Slide added: “${(made.title ?? topic).slice(0, 60)}”`, { description: `Layout: ${String(made.layout ?? 'bullets').replace('-', ' ')}` });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not compose the slide.');
    } finally {
      setComposing(false);
    }
  }, [composeTopic, composing, insertSlide]);

  if (!deck) return null;

  const slides = deck.slides;
  const current = slides[currentSlideIndex] ?? slides[0];
  const theme = deckTheme(deck);
  const footerText = deckFooterText(deck);
  const showPageNumbers = deck.meta?.showPageNumbers !== false;

  // ---- multi-select helpers --------------------------------------------
  const clearSelection = () => { setSelectedIds([]); anchorRef.current = null; };

  const handleThumbSelect = (i: number, e: React.MouseEvent) => {
    const id = slides[i]?.id;
    if (!id) return;
    if (e.shiftKey && anchorRef.current != null) {
      const [a, b] = [anchorRef.current, i].sort((x, y) => x - y);
      setSelectedIds(slides.slice(a, b + 1).map((s) => s.id));
      setCurrentSlide(i);
      return;
    }
    if (e.metaKey || e.ctrlKey) {
      setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
      anchorRef.current = i;
      setCurrentSlide(i);
      return;
    }
    setSelectedIds([]);
    anchorRef.current = i;
    setCurrentSlide(i);
  };

  const batchDelete = () => {
    const n = selectedIds.length;
    if (n === 0) return;
    removeSlides(selectedIds);
    toast(`${n} slide${n > 1 ? 's' : ''} deleted`, { description: 'Press ⌘Z to undo.' });
    clearSelection();
  };
  const batchDuplicate = () => {
    const n = selectedIds.length;
    if (n === 0) return;
    duplicateSlides(selectedIds);
    toast.success(`${n} slide${n > 1 ? 's' : ''} duplicated`);
    clearSelection();
  };
  const batchHide = (hidden: boolean) => {
    const n = selectedIds.length;
    if (n === 0) return;
    setHiddenSlides(selectedIds, hidden);
    toast(hidden ? `${n} slide${n > 1 ? 's' : ''} hidden from presentation` : `${n} slide${n > 1 ? 's' : ''} shown`);
    clearSelection();
  };

  // ---- deck style (accent / footer / page numbers) ---------------------
  const patchMeta = (p: Partial<NonNullable<typeof deck.meta>>) =>
    patchDeck({ meta: { ...deck.meta, ...p } });
  const ACCENTS = ['#e11d48', '#ea580c', '#d97706', '#16a34a', '#0d9488', '#7c3aed', '#db2777', '#2563eb'];
  const activeAccent = deck.meta?.accent ?? theme.tokens.colors.primary;

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
  const visibleCount = slides.filter((s) => !s.hidden).length;
  const hiddenCount = total - visibleCount;
  const words = slides.reduce(
    (acc, s) =>
      acc +
      (s.title ?? '').split(/\s+/).filter(Boolean).length +
      (s.bullets ?? []).join(' ').split(/\s+/).filter(Boolean).length +
      (s.body ?? '').split(/\s+/).filter(Boolean).length,
    0
  );
  const estMinutes = Math.max(1, Math.round(words / 110 + visibleCount * 0.25));

  const SHORTCUTS: Array<{ keys: string; label: string }> = [
    { keys: 'J / K · ↑ ↓', label: 'Previous / next slide' },
    { keys: 'G', label: 'Toggle slide board' },
    { keys: '⌥ ↑ / ⌥ ↓', label: 'Move slide earlier / later' },
    { keys: '⌘ K', label: 'Command palette' },
    { keys: '⌘ D', label: 'Duplicate current slide' },
    { keys: 'H', label: 'Hide / show slide in presentation' },
    { keys: 'Del', label: 'Delete current slide (or selection)' },
    { keys: '⌘ click', label: 'Add slide to selection' },
    { keys: '⇧ click', label: 'Select slide range' },
    { keys: '⌘ Z', label: 'Undo' },
    { keys: '⇧⌘ Z', label: 'Redo' },
    { keys: '?', label: 'Toggle this cheat-sheet' },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-background/95 backdrop-blur flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-neutral-500 hover:text-neutral-900"
          onClick={() => router.push('/decks')}
          aria-label="Back to all decks"
          title="Back to all decks"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
        </Button>
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
        <span
          className="hidden xl:flex items-center gap-1.5 text-[11px] text-neutral-400 border border-neutral-200 rounded-full px-2.5 py-1 bg-neutral-50/70"
          title="Visible slides · estimated talk duration (words ÷ 110 wpm + pacing)"
        >
          <SquareStack className="h-3 w-3" /> {visibleCount} visible
          <span className="text-neutral-300">·</span>
          <Clock3 className="h-3 w-3" /> ~{estMinutes} min
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
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-neutral-500 hover:text-neutral-900"
            onClick={() => {
              const others = THEMES.filter((t) => t.id !== deck.themeId);
              const pick = others[Math.floor(Math.random() * others.length)];
              setDeckTheme(pick.id);
              toast(`Theme: ${pick.name}`, { description: pick.tone });
            }}
            aria-label="Shuffle design system"
            title="Shuffle design system — instant re-theme"
          >
            <Shuffle className="h-4 w-4" />
          </Button>
          <Popover open={showStyle} onOpenChange={setShowStyle}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-neutral-500 hover:text-neutral-900"
                aria-label="Deck style and branding"
                title="Accent color, footer text & page numbers"
              >
                <span
                  className="relative inline-flex h-4 w-4 rounded-full border border-black/10"
                  style={{ background: `conic-gradient(${activeAccent} 0 55%, #e5e5e5 55% 100%)` }}
                  aria-hidden
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Accent color</p>
                <div className="flex items-center gap-1.5 flex-wrap" role="radiogroup" aria-label="Accent color">
                  <button
                    onClick={() => patchMeta({ accent: undefined })}
                    className={cn(
                      'h-7 px-2 rounded-md border text-[11px] font-medium transition-colors',
                      !deck.meta?.accent ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 hover:border-neutral-400 text-neutral-600'
                    )}
                    title="Use the theme's own accent"
                  >
                    Theme
                  </button>
                  {ACCENTS.map((c) => (
                    <button
                      key={c}
                      role="radio"
                      aria-checked={deck.meta?.accent === c}
                      onClick={() => patchMeta({ accent: c })}
                      className={cn(
                        'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-1',
                        deck.meta?.accent === c ? 'border-neutral-900 scale-110' : 'border-transparent'
                      )}
                      style={{ background: c }}
                      aria-label={`Accent ${c}`}
                      title={c}
                    />
                  ))}
                  <label
                    className="h-7 w-7 rounded-full border-2 border-dashed border-neutral-300 grid place-items-center cursor-pointer hover:border-neutral-500 transition-colors"
                    title="Custom color"
                  >
                    <Plus className="h-3.5 w-3.5 text-neutral-500" />
                    <input
                      type="color"
                      value={activeAccent}
                      onChange={(e) => patchMeta({ accent: e.target.value })}
                      className="sr-only"
                      aria-label="Custom accent color"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Re-tints bullets, stats, rules and the first chart series — instantly, on every slide.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Footer text</p>
                <Input
                  value={deck.meta?.footerText ?? ''}
                  onChange={(e) => patchMeta({ footerText: e.target.value.slice(0, 80) })}
                  placeholder={deck.title}
                  maxLength={80}
                  aria-label="Footer text on slides"
                />
                <p className="text-[11px] text-muted-foreground">Shown bottom-left of every slide. Defaults to the deck title.</p>
              </div>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-sm text-neutral-700">Show page numbers</span>
                <Switch checked={showPageNumbers} onCheckedChange={(v) => patchMeta({ showPageNumbers: v })} aria-label="Toggle page numbers in slide footers" />
              </label>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Slide transition</p>
                <Select
                  value={deck.meta?.defaultTransition ?? 'inherit'}
                  onValueChange={(v) => patchMeta({ defaultTransition: v === 'inherit' ? undefined : (v as TransitionKind) })}
                >
                  <SelectTrigger className="h-9" aria-label="Default slide transition"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">Theme default</SelectItem>
                    <SelectItem value="none">None (hard cut)</SelectItem>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="rise">Rise</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Deck-wide default in present mode. Per-slide overrides in the inspector still win.</p>
              </div>
            </PopoverContent>
          </Popover>
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
            size="sm"
            className={cn('h-9 px-2.5 gap-1.5', boardOpen ? 'text-neutral-900 bg-neutral-100' : 'text-neutral-500 hover:text-neutral-900')}
            onClick={() => setBoardOpen((v) => !v)}
            aria-pressed={boardOpen}
            aria-label="Toggle slide board"
            title="Slide board (G) — reorder and overview all slides"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="text-xs hidden lg:inline">Board</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2.5 gap-1.5 text-neutral-500 hover:text-violet-700"
            onClick={writeAllNotes}
            disabled={!!notesProgress}
            aria-label="Write speaker notes for empty slides with AI"
            title="Write speaker notes for empty slides (AI)"
          >
            {notesProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : <NotebookPen className="h-4 w-4" />}
            {notesProgress ? (
              <span className="text-xs tabular-nums">{notesProgress.done}/{notesProgress.total}</span>
            ) : (
              <span className="text-xs hidden lg:inline">Notes</span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-neutral-500 hover:text-neutral-900"
            onClick={() => setPaletteOpen(true)}
            aria-label="Open command palette"
            title="Command palette (⌘K)"
          >
            <CommandIcon className="h-4 w-4" />
          </Button>
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
          {/* batch selection action bar */}
          {selectedIds.length > 0 && (
            <div
              className="px-3 pt-3"
              role="toolbar"
              aria-label={`Batch actions for ${selectedIds.length} selected slides`}
              onKeyDown={(e) => {
                if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); batchDelete(); }
                if (e.key === 'Escape') { e.stopPropagation(); clearSelection(); }
              }}
            >
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 flex items-center gap-1.5 flex-wrap shadow-sm">
                <span className="text-xs font-semibold text-emerald-900 tabular-nums w-full sm:w-auto">
                  {selectedIds.length} selected
                </span>
                <div className="flex items-center gap-1 ml-auto">
                  <button onClick={batchDuplicate} className="p-1.5 rounded hover:bg-emerald-100 text-emerald-900 transition-colors" title="Duplicate selected" aria-label="Duplicate selected slides"><Copy className="h-3.5 w-3.5" /></button>
                  <button onClick={() => batchHide(true)} className="p-1.5 rounded hover:bg-emerald-100 text-emerald-900 transition-colors" title="Hide selected from presentation" aria-label="Hide selected slides"><EyeOff className="h-3.5 w-3.5" /></button>
                  <button onClick={() => batchHide(false)} className="p-1.5 rounded hover:bg-emerald-100 text-emerald-900 transition-colors" title="Show selected in presentation" aria-label="Show selected slides"><Eye className="h-3.5 w-3.5" /></button>
                  <button onClick={batchDelete} className="p-1.5 rounded hover:bg-red-100 text-red-700 transition-colors" title="Delete selected" aria-label="Delete selected slides"><Trash2 className="h-3.5 w-3.5" /></button>
                  <button onClick={clearSelection} className="p-1.5 rounded hover:bg-emerald-100 text-emerald-900 transition-colors" title="Clear selection (Esc)" aria-label="Clear selection"><X className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          )}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3 space-y-3">
              {slides.map((s, i) => (
                <SlideCard
                  key={s.id}
                  slide={s}
                  index={i}
                  active={i === currentSlideIndex}
                  pageCount={total}
                  selected={selectedIds.includes(s.id)}
                  dragging={dragIndex === i}
                  dropTarget={overIndex === i && dragIndex !== i}
                  onSelect={(e) => handleThumbSelect(i, e)}
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
                <DropdownMenuItem
                  onClick={() => { setComposeTopic(''); setComposeOpen(true); }}
                  className="gap-2.5 text-violet-700 data-[highlighted]:text-violet-900"
                >
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  Generate with AI from a topic…
                </DropdownMenuItem>
                <div className="my-1 h-px bg-neutral-100" aria-hidden />
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
          {boardOpen ? (
            <div className="flex-1 min-h-0 flex flex-col" data-board>
              <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 pb-2">
                <LayoutGrid className="h-4 w-4 text-neutral-500" aria-hidden />
                <h2 className="text-sm font-semibold text-neutral-800">Slide board</h2>
                <span className="text-[11px] text-neutral-400 tabular-nums">
                  {total} slide{total === 1 ? '' : 's'}{hiddenCount > 0 ? ` · ${hiddenCount} hidden` : ''}
                </span>
                <span className="ml-auto text-[11px] text-neutral-400 hidden md:block">
                  Drag to reorder · click to select · double-click to open
                </span>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBoardOpen(false)}>
                  Close
                </Button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-4">
                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}
                  role="list"
                  aria-label="All slides"
                >
                  {slides.map((s, i) => (
                    <SlideCard
                      key={s.id}
                      slide={s}
                      index={i}
                      active={i === currentSlideIndex}
                      pageCount={total}
                      selected={selectedIds.includes(s.id)}
                      dragging={dragIndex === i}
                      dropTarget={overIndex === i && dragIndex !== i}
                      showCaption
                      onOpen={() => setBoardOpen(false)}
                      onSelect={(e) => handleThumbSelect(i, e)}
                      onDuplicate={() => duplicateSlide(s.id)}
                      onDelete={() => removeSlide(s.id)}
                      onToggleHidden={() => updateSlide(s.id, { hidden: !s.hidden })}
                      onDragStart={() => setDragIndex(i)}
                      onDragOver={(e) => { e.preventDefault(); setOverIndex(i); }}
                      onDrop={() => { if (dragIndex != null && dragIndex !== i) reorderSlides(dragIndex, i); setDragIndex(null); setOverIndex(null); }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
          <div className="flex-1 min-h-0 p-4 sm:p-8 flex items-center justify-center overflow-hidden">
            {current && (
              <div className="w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl shadow-neutral-900/25 ring-1 ring-black/10">
                <ScaledSlide
                  slide={current}
                  theme={theme}
                  deckTitle={footerText}
                  index={currentSlideIndex}
                  pageCount={total}
                  showPageNumbers={showPageNumbers}
                  interactive
                />
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
            </>
          )}
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

      {/* ⌘K command palette */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        slides={slides}
        currentSlideIndex={currentSlideIndex}
        onJump={(i) => setCurrentSlide(i)}
        onInsert={(layout) => insertSlide(currentSlideIndex + 1, {
          id: newSlideId(),
          layout,
          title: layout === 'title' ? 'New title' : `New ${layout.replace('-', ' ')}`,
        } as Slide)}
        onDuplicate={() => current && duplicateSlide(current.id)}
        onToggleHidden={() => current && updateSlide(current.id, { hidden: !current.hidden })}
        onDelete={() => {
          if (total <= 1) {
            toast.error('A deck needs at least one slide.');
            return;
          }
          if (current) {
            removeSlide(current.id);
            toast('Slide deleted', { description: 'Press ⌘Z to undo.' });
          }
        }}
        onUndo={undo}
        onRedo={redo}
        onPresent={() => setPresenting(true)}
        onMoveSlide={(dir) => {
          const idx = useAppStore.getState().currentSlideIndex;
          const to = idx + dir;
          if (to >= 0 && to < total) reorderSlides(idx, to);
        }}
        onComposeSlide={() => { setComposeTopic(''); setComposeOpen(true); }}
        onToggleBoard={() => setBoardOpen((v) => !v)}
        onShuffleTheme={() => {
          const others = THEMES.filter((t) => t.id !== deck.themeId);
          const pick = others[Math.floor(Math.random() * others.length)];
          setDeckTheme(pick.id);
          toast(`Theme: ${pick.name}`, { description: pick.tone });
        }}
        onStyle={() => setShowStyle(true)}
        onWriteNotes={writeAllNotes}
        onExport={(kind: ExportKind) => {
          if (kind === 'pptx') void pptx();
          else if (kind === 'pdf') pdf();
          else if (kind === 'html') void html();
          else if (kind === 'deckjson') deckJson();
          else exportNotes();
        }}
      />

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

      {/* AI slide composer: topic → full slide, inserted after the current one */}
      <Dialog open={composeOpen} onOpenChange={(o) => { if (!composing) setComposeOpen(o); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" /> Compose a slide with AI
            </DialogTitle>
            <DialogDescription>
              Describe a topic — the AI writes the slide (title, copy, layout and speaker notes) and inserts it after slide {currentSlideIndex + 1}.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); void composeSlide(); }}
            className="space-y-3"
          >
            <Input
              value={composeTopic}
              onChange={(e) => setComposeTopic(e.target.value)}
              placeholder='e.g. "How our pricing compares to competitors"'
              maxLength={140}
              aria-label="Slide topic"
              autoFocus
              disabled={composing}
            />
            <p className="text-[11px] text-muted-foreground">
              The deck's audience, tone and language are applied automatically. Stats slides use round illustrative figures and are flagged with an “Illustrative figures” footnote. Chart, diagram and image layouts are skipped — add those with real data afterwards.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setComposeOpen(false)} disabled={composing}>Cancel</Button>
              <Button type="submit" disabled={!composeTopic.trim() || composing} className="gap-1.5 bg-neutral-900 hover:bg-neutral-800">
                {composing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {composing ? 'Writing…' : 'Generate slide'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
