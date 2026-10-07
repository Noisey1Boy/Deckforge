'use client';

import { useAppStore } from '@/lib/store/deck-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { toast } from 'sonner';
import { LAYOUT_IDS, type LayoutId } from '@/lib/deck/types';
import { getTheme } from '@/lib/design/themes';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowDown, ArrowUp, Plus, Trash2, Wand2, Sparkles, PencilLine, RefreshCw, Type, Hash, List, Columns2, Image as ImageIcon, Quote, BarChart3, Workflow, Table2, Flag, Sigma } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Icon per layout — matches the editor's add-slide menu. */
const LAYOUT_ICONS: Record<LayoutId, React.ReactNode> = {
  title: <Type className="h-3.5 w-3.5" />,
  section: <Hash className="h-3.5 w-3.5" />,
  bullets: <List className="h-3.5 w-3.5" />,
  'two-column': <Columns2 className="h-3.5 w-3.5" />,
  image: <ImageIcon className="h-3.5 w-3.5" />,
  quote: <Quote className="h-3.5 w-3.5" />,
  stats: <Sigma className="h-3.5 w-3.5" />,
  chart: <BarChart3 className="h-3.5 w-3.5" />,
  diagram: <Workflow className="h-3.5 w-3.5" />,
  comparison: <Table2 className="h-3.5 w-3.5" />,
  closing: <Flag className="h-3.5 w-3.5" />,
};

/** Per-item transient status: absent = idle. */
type ItemStatus = 'loading' | 'error';

export function OutlineView() {
  const outline = useAppStore((s) => s.outline);
  const setOutline = useAppStore((s) => s.setOutline);
  const setView = useAppStore((s) => s.setView);
  const themeChoice = useAppStore((s) => s.themeChoice);
  const [editing, setEditing] = useState(true);
  const [statuses, setStatuses] = useState<Record<number, ItemStatus>>({});
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const statusesRef = useRef<Record<number, ItemStatus>>({});

  useEffect(() => {
    if (!outline) setView('create');
  }, [outline, setView]);

  const setStatus = useCallback((i: number, st: ItemStatus | undefined) => {
    setStatuses((prev) => {
      const next = { ...prev };
      if (st) next[i] = st;
      else delete next[i];
      return next;
    });
    if (st) statusesRef.current[i] = st;
    else delete statusesRef.current[i];
  }, []);

  /** Regenerate ONE outline item via /api/ai/outline-item. Reads fresh store state so keyboard + parallel calls never use stale data. */
  const regenerateItem = useCallback(async (i: number) => {
    const snap = useAppStore.getState();
    const cur = snap.outline;
    if (!cur || snap.view !== 'outline' || i < 0 || i >= cur.slides.length) return;
    if (statusesRef.current[i] === 'loading') return;
    const prevItem = { ...cur.slides[i] };
    setStatus(i, 'loading');
    try {
      const themeId = snap.themeChoice === 'auto' ? cur.recommendedThemeId : snap.themeChoice;
      const res = await fetch('/api/ai/outline-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate',
          outlineItem: prevItem,
          deckBrief: [cur.title, cur.subtitle].filter(Boolean).join(' — '),
          audience: snap.genSettings.audience || undefined,
          tone: snap.genSettings.tone || undefined,
          themeName: themeId ? getTheme(themeId).name : undefined,
          language: snap.genSettings.language || undefined,
          position: i + 1,
          total: cur.slides.length,
        }),
      });
      const data = (await res.json()) as {
        item?: { layout: LayoutId; title: string; brief: string };
        rationale?: string;
        error?: string;
      };
      if (!res.ok || !data.item) throw new Error(data.error || 'Regeneration failed.');
      const regenerated = data.item;
      // The user may have edited other rows meanwhile — write into the latest outline.
      const latest = useAppStore.getState().outline;
      const stillThere = useAppStore.getState().view === 'outline';
      if (!latest || !stillThere || i >= latest.slides.length) {
        setStatus(i, undefined);
        return;
      }
      const slides = latest.slides.map((s, j) =>
        j === i ? { ...s, layout: regenerated.layout, title: regenerated.title, brief: regenerated.brief } : s
      );
      useAppStore.getState().setOutline({ ...latest, slides });
      setStatus(i, undefined);
      toast.success('Slide regenerated', {
        description: data.rationale,
        duration: 8000,
        action: {
          label: 'Undo',
          onClick: () => {
            const now = useAppStore.getState().outline;
            if (!now || i >= now.slides.length) return;
            useAppStore.getState().setOutline({ ...now, slides: now.slides.map((s, j) => (j === i ? prevItem : s)) });
          },
        },
      });
    } catch (err) {
      setStatus(i, 'error');
      toast.error(err instanceof Error ? err.message : 'Could not regenerate this slide.');
    }
  }, [setStatus]);

  if (!outline) return null;

  const recTheme = outline.recommendedThemeId ? getTheme(outline.recommendedThemeId) : null;
  const anyLoading = Object.values(statuses).includes('loading');

  const update = (i: number, patch: Partial<{ layout: LayoutId; title: string; brief: string }>) => {
    const slides = outline.slides.map((s, j) => (j === i ? { ...s, ...patch } : s));
    setOutline({ ...outline, slides });
    // A manual edit supersedes a failed regeneration attempt.
    if (statusesRef.current[i] === 'error') setStatus(i, undefined);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= outline.slides.length) return;
    const slides = [...outline.slides];
    [slides[i], slides[j]] = [slides[j], slides[i]];
    setOutline({ ...outline, slides });
  };

  const addSlide = () => {
    setOutline({
      ...outline,
      slides: [...outline.slides, { layout: 'bullets', title: 'New slide', brief: 'Describe the content for this slide.' }],
    });
  };

  const remove = (i: number) => {
    if (outline.slides.length <= 3) {
      toast.error('Keep at least 3 slides.');
      return;
    }
    setOutline({ ...outline, slides: outline.slides.filter((_, j) => j !== i) });
  };

  const backToCreate = () => {
    setOutline(null);
    setView('create');
  };

  /** R regenerates the focused row — skipped while typing in form fields. */
  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'r' && e.key !== 'R') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)
    ) {
      return;
    }
    if (!editing || focusedIndex == null || statusesRef.current[focusedIndex] === 'loading') return;
    e.preventDefault();
    void regenerateItem(focusedIndex);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={backToCreate} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button variant="outline" onClick={() => setEditing((e) => !e)} className="gap-1.5">
          <PencilLine className="h-4 w-4" /> {editing ? 'Preview mode' : 'Edit mode'}
        </Button>
      </div>

      <header className="space-y-3">
        <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3 text-amber-500" /> Outline proposal</Badge>
        {editing ? (
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              value={outline.title}
              onChange={(e) => setOutline({ ...outline, title: e.target.value })}
              className="text-lg font-semibold h-11"
              aria-label="Deck title"
            />
            <Input
              value={outline.subtitle ?? ''}
              onChange={(e) => setOutline({ ...outline, subtitle: e.target.value })}
              placeholder="Deck subtitle"
              className="h-11"
              aria-label="Deck subtitle"
            />
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold">{outline.title}</h1>
            <p className="text-muted-foreground">{outline.subtitle}</p>
          </div>
        )}

        {themeChoice === 'auto' && recTheme && (
          <div className="rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50 to-transparent px-4 py-3.5 text-sm flex items-start gap-3 shadow-sm">
            <span className="rounded-lg bg-amber-100 p-1.5 shrink-0">
              <Sparkles className="h-4 w-4 text-amber-600" />
            </span>
            <div>
              <p className="font-semibold text-amber-900">AI picked “{recTheme.name}”</p>
              <p className="text-muted-foreground mt-0.5">{outline.themeRationale}</p>
            </div>
          </div>
        )}
      </header>

      <ol className="space-y-2" onKeyDown={handleListKeyDown}>
        {outline.slides.map((s, i) => {
          const st = statuses[i];
          return (
            <li
              key={i}
              onFocusCapture={() => setFocusedIndex(i)}
              aria-busy={st === 'loading' || undefined}
              className={cn(
                'group rounded-xl border border-neutral-200 bg-card p-3 flex flex-col sm:flex-row gap-3 sm:items-center transition-all hover:border-neutral-300 hover:shadow-md hover:shadow-neutral-900/5 focus-within:border-neutral-400',
                st === 'loading' && 'opacity-60'
              )}
            >
              <span className="font-mono text-xs text-neutral-500 w-8 h-8 grid place-items-center rounded-lg border border-neutral-200 bg-neutral-50 shrink-0 group-hover:border-neutral-300">
                {String(i + 1).padStart(2, '0')}
              </span>
              <Select value={s.layout} onValueChange={(v) => update(i, { layout: v as LayoutId })} disabled={!editing || st === 'loading'}>
                <SelectTrigger className="w-full sm:w-44 shrink-0" aria-label="Layout">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-neutral-400 shrink-0">{LAYOUT_ICONS[s.layout]}</span>
                    <span className="truncate capitalize">{s.layout.replace('-', ' ')}</span>
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {LAYOUT_IDS.map((l) => (
                    <SelectItem key={l} value={l}>
                      <span className="flex items-center gap-2">
                        <span className="text-neutral-400">{LAYOUT_ICONS[l]}</span>
                        <span className="capitalize">{l.replace('-', ' ')}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editing ? (
                <Input value={s.title} onChange={(e) => update(i, { title: e.target.value })} className="font-medium" aria-label="Slide title" maxLength={90} disabled={st === 'loading'} />
              ) : (
                <span className="font-medium flex-1">{s.title}</span>
              )}
              {s.title.length > 60 && (
                <span
                  className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-700"
                  title="Long titles get shrunk on the slide: consider tightening it"
                >
                  long title
                </span>
              )}
              {editing ? (
                <Input value={s.brief} onChange={(e) => update(i, { brief: e.target.value })} className="text-muted-foreground text-sm flex-1" aria-label="Slide brief" maxLength={200} disabled={st === 'loading'} />
              ) : (
                <span className="text-sm text-muted-foreground flex-1 truncate">{s.brief}</span>
              )}
              {editing && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="relative inline-flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void regenerateItem(i)}
                      disabled={st === 'loading'}
                      aria-label={st === 'error' ? 'Retry slide regeneration' : 'Regenerate slide with AI'}
                      className={cn('h-8 w-8', st === 'error' && 'text-red-600 hover:text-red-700')}
                    >
                      <RefreshCw className={cn('h-3.5 w-3.5', st === 'loading' && 'animate-spin motion-reduce:animate-none')} />
                    </Button>
                    {st === 'error' && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                    )}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={anyLoading} aria-label="Move up" className="h-8 w-8"><ArrowUp className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={anyLoading} aria-label="Move down" className="h-8 w-8"><ArrowDown className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(i)} disabled={anyLoading} aria-label="Remove slide" className="h-8 w-8 text-neutral-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {editing && (
        <p className="font-mono text-[11px] text-neutral-400">
          R regenerate the selected slide
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={addSlide} disabled={!editing} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add slide
        </Button>
        <Button
          className="flex-1 bg-neutral-900 hover:bg-neutral-800 gap-2 h-12 text-base shadow-lg shadow-neutral-900/15 transition-all hover:-translate-y-0.5"
          onClick={() => setView('generating')}
        >
          <Wand2 className="h-5 w-5" /> Approve &amp; write {outline.slides.length} slides
        </Button>
      </div>
    </div>
  );
}
