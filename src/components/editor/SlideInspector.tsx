'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store/deck-store';
import type { LayoutId, Slide } from '@/lib/deck/types';
import { LAYOUT_IDS } from '@/lib/deck/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Sparkles, Scissors, Expand, RefreshCcw, Wand2, ImageIcon } from 'lucide-react';

type AIAction = 'rewrite' | 'shorten' | 'expand' | 'regenerate';

const AI_ACTIONS: Array<{ id: AIAction; label: string; icon: React.ReactNode }> = [
  { id: 'rewrite', label: 'Rewrite', icon: <Sparkles className="h-3.5 w-3.5" /> },
  { id: 'shorten', label: 'Shorten', icon: <Scissors className="h-3.5 w-3.5" /> },
  { id: 'expand', label: 'Expand', icon: <Expand className="h-3.5 w-3.5" /> },
  { id: 'regenerate', label: 'Regenerate', icon: <RefreshCcw className="h-3.5 w-3.5" /> },
];

function linesToText(lines?: string[]): string {
  return (lines ?? []).join('\n');
}
function textToLines(text: string, max: number): string[] {
  return text.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, max);
}

export function SlideInspector({ slide }: { slide: Slide }) {
  const updateSlide = useAppStore((s) => s.updateSlide);
  const deck = useAppStore((s) => s.deck);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [imgBusy, setImgBusy] = useState(false);

  const set = (patch: Partial<Slide>) => updateSlide(slide.id, patch);

  const runAI = async (action: AIAction | 'add_chart') => {
    setAiBusy(action);
    try {
      const res = await fetch('/api/ai/slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, slide, language: deck?.meta?.language ?? 'English' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'AI action failed');
      set(json.patch as Partial<Slide>);
      toast.success(`Slide ${action === 'add_chart' ? 'chart added' : action + 'd'}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI action failed');
    } finally {
      setAiBusy(null);
    }
  };

  const illustrate = async () => {
    setImgBusy(true);
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `${deck?.title ?? ''} — ${slide.title ?? 'presentation visual'}` }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Image failed');
      set({ layout: 'image', image: { url: json.url, alt: slide.title ?? 'AI illustration' } });
      toast.success('Illustration generated.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Image generation failed');
    } finally {
      setImgBusy(false);
    }
  };

  const isTextLike = !['chart', 'diagram', 'comparison', 'quote', 'image'].includes(slide.layout);

  return (
    <div className="space-y-5">
      {/* AI actions */}
      <section className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">AI actions</Label>
        <div className="flex flex-wrap gap-1.5">
          {AI_ACTIONS.map((a) => (
            <Button key={a.id} variant="outline" size="sm" className="gap-1.5 h-8" disabled={!!aiBusy} onClick={() => runAI(a.id)}>
              {aiBusy === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : a.icon}
              {a.label}
            </Button>
          ))}
          <Button variant="outline" size="sm" className="gap-1.5 h-8" disabled={!!aiBusy} onClick={() => runAI('add_chart')}>
            {aiBusy === 'add_chart' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            Add chart
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-8" disabled={imgBusy} onClick={illustrate}>
            {imgBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
            Illustrate
          </Button>
        </div>
      </section>

      {/* Layout swap */}
      <section className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Layout</Label>
        <Select value={slide.layout} onValueChange={(v) => set({ layout: v as LayoutId })}>
          <SelectTrigger aria-label="Swap layout"><SelectValue /></SelectTrigger>
          <SelectContent>
            {LAYOUT_IDS.map((l) => (
              <SelectItem key={l} value={l} className="capitalize">{l.replace('-', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* Fields */}
      <section className="space-y-3">
        {slide.layout !== 'quote' && (
          <div className="space-y-1.5">
            <Label htmlFor="insp-title" className="text-xs uppercase tracking-wide text-muted-foreground">Title</Label>
            <Textarea id="insp-title" value={slide.title ?? ''} onChange={(e) => set({ title: e.target.value })} className="min-h-14 text-sm" maxLength={110} />
          </div>
        )}

        {slide.layout === 'title' && (
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Kicker / subtitle</Label>
            <Input value={slide.subtitle ?? ''} onChange={(e) => set({ subtitle: e.target.value })} maxLength={120} />
          </div>
        )}

        {isTextLike && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Body / lead-in</Label>
              <Textarea value={slide.body ?? ''} onChange={(e) => set({ body: e.target.value })} className="min-h-16 text-sm" maxLength={220} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Bullets (one per line)</Label>
              <Textarea
                value={linesToText(slide.bullets)}
                onChange={(e) => set({ bullets: textToLines(e.target.value, 7) })}
                className="min-h-28 text-sm font-mono text-[13px]"
              />
            </div>
          </>
        )}

        {slide.layout === 'two-column' && (
          <div className="grid grid-cols-1 gap-3">
            <Input value={slide.leftTitle ?? ''} onChange={(e) => set({ leftTitle: e.target.value })} placeholder="Left column title" />
            <Textarea value={linesToText(slide.leftContent)} onChange={(e) => set({ leftContent: textToLines(e.target.value, 5) })} className="min-h-20 text-sm" placeholder="Left items (one per line)" />
            <Input value={slide.rightTitle ?? ''} onChange={(e) => set({ rightTitle: e.target.value })} placeholder="Right column title" />
            <Textarea value={linesToText(slide.rightContent)} onChange={(e) => set({ rightContent: textToLines(e.target.value, 5) })} className="min-h-20 text-sm" placeholder="Right items (one per line)" />
          </div>
        )}

        {slide.layout === 'quote' && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Quote</Label>
              <Textarea value={slide.quote ?? ''} onChange={(e) => set({ quote: e.target.value })} className="min-h-24 text-sm" maxLength={260} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Attribution</Label>
              <Input value={slide.attribution ?? ''} onChange={(e) => set({ attribution: e.target.value })} maxLength={80} />
            </div>
          </>
        )}

        {slide.layout === 'stats' && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Stats (value · label · context)</Label>
            {(slide.stats ?? []).map((st, i) => (
              <div key={i} className="flex gap-1.5">
                <Input value={st.value} onChange={(e) => { const stats = [...(slide.stats ?? [])]; stats[i] = { ...st, value: e.target.value }; set({ stats }); }} className="w-20 text-sm" maxLength={12} aria-label="Value" />
                <Input value={st.label} onChange={(e) => { const stats = [...(slide.stats ?? [])]; stats[i] = { ...st, label: e.target.value }; set({ stats }); }} className="text-sm" maxLength={48} aria-label="Label" />
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-neutral-400 hover:text-red-600" onClick={() => set({ stats: (slide.stats ?? []).filter((_, j) => j !== i) })} aria-label="Remove stat">✕</Button>
              </div>
            ))}
            {(slide.stats?.length ?? 0) < 4 && (
              <Button variant="secondary" size="sm" onClick={() => set({ stats: [...(slide.stats ?? []), { value: '42%', label: 'New stat' }] })}>Add stat</Button>
            )}
          </div>
        )}

        {slide.layout === 'comparison' && (
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Rows — “label | left | right” per line</Label>
            <Textarea
              value={(slide.comparison?.rows ?? []).map((r) => `${r.label} | ${r.left} | ${r.right}`).join('\n')}
              onChange={(e) => {
                const rows = e.target.value.split('\n').filter(Boolean).slice(0, 5).map((line) => {
                  const [label = '', left = '', right = ''] = line.split('|').map((s) => s.trim());
                  return { label, left, right };
                });
                set({ comparison: { headers: slide.comparison?.headers ?? ['Option A', 'Option B'], rows } });
              }}
              className="min-h-28 text-xs font-mono"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input value={slide.comparison?.headers?.[0] ?? ''} onChange={(e) => set({ comparison: { headers: [e.target.value, slide.comparison?.headers?.[1] ?? ''], rows: slide.comparison?.rows ?? [] } })} placeholder="Header left" maxLength={30} />
              <Input value={slide.comparison?.headers?.[1] ?? ''} onChange={(e) => set({ comparison: { headers: [slide.comparison?.headers?.[0] ?? '', e.target.value], rows: slide.comparison?.rows ?? [] } })} placeholder="Header right" maxLength={30} />
            </div>
          </div>
        )}

        {slide.layout === 'chart' && slide.chart && (
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Chart insight</Label>
            <Textarea value={slide.chart.insight ?? ''} onChange={(e) => set({ chart: { ...slide.chart!, insight: e.target.value } })} className="min-h-16 text-sm" maxLength={140} />
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Data (label = value per line)</Label>
            <Textarea
              value={slide.chart.data.map((d) => `${d.label} = ${d.value}`).join('\n')}
              onChange={(e) => {
                const data = e.target.value.split('\n').filter(Boolean).slice(0, 12).map((line) => {
                  const [label = '', value = '0'] = line.split('=').map((s) => s.trim());
                  return { label, value: parseFloat(value) || 0 };
                });
                set({ chart: { ...slide.chart!, data } });
              }}
              className="min-h-24 text-xs font-mono"
            />
          </div>
        )}

        {slide.layout === 'diagram' && slide.diagram && (
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nodes (id = label per line)</Label>
            <Textarea
              value={slide.diagram.nodes.map((n) => `${n.id} = ${n.label}`).join('\n')}
              onChange={(e) => {
                const nodes = e.target.value.split('\n').filter(Boolean).slice(0, 7).map((line, i) => {
                  const [id = `n${i}`, label = ''] = line.split('=').map((s) => s.trim());
                  return { id, label: label || id };
                });
                const ids = new Set(nodes.map((n) => n.id));
                set({ diagram: { ...slide.diagram!, nodes, edges: slide.diagram!.edges.filter((e) => ids.has(e.from) && ids.has(e.to)) } });
              }}
              className="min-h-20 text-xs font-mono"
            />
          </div>
        )}

        {slide.layout === 'image' && slide.image && (
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Image URL</Label>
            <Input value={slide.image.url} onChange={(e) => set({ image: { ...slide.image!, url: e.target.value } })} />
            <img src={slide.image.url} alt={slide.image.alt} className="rounded-md border w-full object-cover max-h-32" />
          </div>
        )}
      </section>

      {/* Speaker notes */}
      <section className="space-y-1.5">
        <Label htmlFor="insp-notes" className="text-xs uppercase tracking-wide text-muted-foreground">Speaker notes</Label>
        <Textarea id="insp-notes" value={slide.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} className="min-h-24 text-sm" placeholder="What you'll say when this slide is up…" />
      </section>
    </div>
  );
}
