'use client';

import { useAppStore } from '@/lib/store/deck-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { toast } from 'sonner';
import { LAYOUT_IDS, type LayoutId } from '@/lib/deck/types';
import { getTheme } from '@/lib/design/themes';
import { ArrowLeft, ArrowDown, ArrowUp, Plus, Trash2, Wand2, Sparkles, PencilLine, Type, Hash, List, Columns2, Image as ImageIcon, Quote, BarChart3, Workflow, Table2, Flag, Sigma } from 'lucide-react';
import { useEffect, useState } from 'react';

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

export function OutlineView() {
  const outline = useAppStore((s) => s.outline);
  const setOutline = useAppStore((s) => s.setOutline);
  const setView = useAppStore((s) => s.setView);
  const themeChoice = useAppStore((s) => s.themeChoice);
  const [editing, setEditing] = useState(true);

  useEffect(() => {
    if (!outline) setView('create');
  }, [outline, setView]);

  if (!outline) return null;

  const recTheme = outline.recommendedThemeId ? getTheme(outline.recommendedThemeId) : null;

  const update = (i: number, patch: Partial<{ layout: LayoutId; title: string; brief: string }>) => {
    const slides = outline.slides.map((s, j) => (j === i ? { ...s, ...patch } : s));
    setOutline({ ...outline, slides });
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

      <ol className="space-y-2">
        {outline.slides.map((s, i) => (
          <li
            key={i}
            className="group rounded-xl border border-neutral-200 bg-card p-3 flex flex-col sm:flex-row gap-3 sm:items-center transition-all hover:border-neutral-300 hover:shadow-md hover:shadow-neutral-900/5 focus-within:border-neutral-400"
          >
            <span className="font-mono text-xs text-neutral-500 w-8 h-8 grid place-items-center rounded-lg border border-neutral-200 bg-neutral-50 shrink-0 group-hover:border-neutral-300">
              {String(i + 1).padStart(2, '0')}
            </span>
            <Select value={s.layout} onValueChange={(v) => update(i, { layout: v as LayoutId })} disabled={!editing}>
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
              <Input value={s.title} onChange={(e) => update(i, { title: e.target.value })} className="font-medium" aria-label="Slide title" maxLength={90} />
            ) : (
              <span className="font-medium flex-1">{s.title}</span>
            )}
            {editing ? (
              <Input value={s.brief} onChange={(e) => update(i, { brief: e.target.value })} className="text-muted-foreground text-sm flex-1" aria-label="Slide brief" maxLength={200} />
            ) : (
              <span className="text-sm text-muted-foreground flex-1 truncate">{s.brief}</span>
            )}
            {editing && (
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => move(i, -1)} aria-label="Move up" className="h-8 w-8"><ArrowUp className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => move(i, 1)} aria-label="Move down" className="h-8 w-8"><ArrowDown className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Remove slide" className="h-8 w-8 text-neutral-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            )}
          </li>
        ))}
      </ol>

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
