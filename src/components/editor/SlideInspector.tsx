'use client';

import { useRef, useState } from 'react';
import { useAppStore } from '@/lib/store/deck-store';
import type { ChartKind, LayoutId, Slide } from '@/lib/deck/types';
import { LAYOUT_IDS } from '@/lib/deck/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { fileToDeckImage } from '@/lib/media/image';
import { TRANSITIONS, type TransitionKind } from '@/lib/deck/types';
import {
  Loader2, Sparkles, Scissors, Expand, RefreshCcw, Wand2, ImageIcon,
  ImagePlus, Trash2, BarChart3, BarChartHorizontal, LineChart, AreaChart,
  PieChart, Donut, Plus, Clapperboard, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

const CHART_KINDS: Array<{ kind: ChartKind; label: string; icon: React.ReactNode }> = [
  { kind: 'column', label: 'Column', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { kind: 'bar', label: 'Bar', icon: <BarChartHorizontal className="h-3.5 w-3.5" /> },
  { kind: 'line', label: 'Line', icon: <LineChart className="h-3.5 w-3.5" /> },
  { kind: 'area', label: 'Area', icon: <AreaChart className="h-3.5 w-3.5" /> },
  { kind: 'pie', label: 'Pie', icon: <PieChart className="h-3.5 w-3.5" /> },
  { kind: 'donut', label: 'Donut', icon: <Donut className="h-3.5 w-3.5" /> },
];

export function SlideInspector({ slide }: { slide: Slide }) {
  const updateSlide = useAppStore((s) => s.updateSlide);
  const deck = useAppStore((s) => s.deck);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [imgBusy, setImgBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const picRef = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<Slide>) => updateSlide(slide.id, patch);

  const handlePicUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploadBusy(true);
    try {
      const url = await fileToDeckImage(file);
      set({ layout: 'image', image: { url, alt: slide.title ?? 'Uploaded image' } });
      toast.success('Image added to slide.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadBusy(false);
      if (picRef.current) picRef.current.value = '';
    }
  };

  const runAI = async (action: AIAction | 'add_chart' | 'speaker_notes') => {
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
      const labels: Record<string, string> = {
        add_chart: 'chart added', speaker_notes: 'notes written',
        rewrite: 'copy rewritten', shorten: 'copy shortened',
        expand: 'copy expanded', regenerate: 'slide regenerated',
      };
      toast.success(labels[action] ?? `Slide ${action}d.`);
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
      <section className="space-y-2 rounded-lg border border-violet-100 bg-gradient-to-b from-violet-50/70 to-transparent p-3 -m-1">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-violet-500" aria-hidden /> AI actions
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {AI_ACTIONS.map((a) => (
            <Button key={a.id} variant="outline" size="sm" className="gap-1.5 h-8 border-violet-200/70 bg-white/80 hover:border-violet-300 hover:bg-violet-50/60 transition-colors" disabled={!!aiBusy} onClick={() => runAI(a.id)}>
              {aiBusy === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : a.icon}
              {a.label}
            </Button>
          ))}
          <Button variant="outline" size="sm" className="gap-1.5 h-8 border-violet-200/70 bg-white/80 hover:border-violet-300 hover:bg-violet-50/60 transition-colors" disabled={!!aiBusy} onClick={() => runAI('add_chart')}>
            {aiBusy === 'add_chart' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            Add chart
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-8 border-violet-200/70 bg-white/80 hover:border-violet-300 hover:bg-violet-50/60 transition-colors" disabled={imgBusy} onClick={illustrate}>
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
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Stats (value · label · context)</Label>
              <button
                onClick={() => set({ illustrative: !slide.illustrative })}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors',
                  slide.illustrative
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-neutral-200 text-neutral-400 hover:border-amber-300 hover:text-amber-700'
                )}
                aria-pressed={!!slide.illustrative}
                title="Adds an “Illustrative figures” footnote to the slide"
              >
                <Info className="h-3 w-3" />
                Illustrative
              </button>
            </div>
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
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Chart type</Label>
              <div
                className="grid grid-cols-6 gap-1 rounded-lg bg-neutral-100 p-1"
                role="radiogroup"
                aria-label="Chart type"
              >
                {CHART_KINDS.map((k) => (
                  <button
                    key={k.kind}
                    role="radio"
                    aria-checked={slide.chart!.kind === k.kind}
                    title={k.label}
                    aria-label={`${k.label} chart`}
                    onClick={() => set({ chart: { ...slide.chart!, kind: k.kind } })}
                    className={cn(
                      'h-8 grid place-items-center rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900',
                      slide.chart!.kind === k.kind
                        ? 'bg-white shadow-sm text-neutral-900'
                        : 'text-neutral-400 hover:text-neutral-700'
                    )}
                  >
                    {k.icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Data — edit cells directly</Label>
              <div className="rounded-lg border border-neutral-200 overflow-hidden" role="table" aria-label="Chart data">
                <div className="grid grid-cols-[1fr_5.5rem_2rem] gap-1.5 bg-neutral-50 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground" role="row">
                  <span>Label</span>
                  <span>Value</span>
                  <span className="sr-only">Remove</span>
                </div>
                <div className="divide-y divide-neutral-100 max-h-52 overflow-y-auto">
                  {slide.chart.data.map((d, i) => (
                    <div key={i} className="grid grid-cols-[1fr_5.5rem_2rem] gap-1.5 items-center px-2 py-1" role="row">
                      <Input
                        value={d.label}
                        onChange={(e) => {
                          const data = [...slide.chart!.data];
                          data[i] = { ...d, label: e.target.value };
                          set({ chart: { ...slide.chart!, data } });
                        }}
                        className="h-8 text-sm border-transparent bg-transparent px-1.5 hover:border-neutral-200 focus-visible:bg-white"
                        maxLength={32}
                        aria-label={`Row ${i + 1} label`}
                      />
                      <Input
                        value={String(d.value)}
                        inputMode="decimal"
                        onChange={(e) => {
                          const data = [...slide.chart!.data];
                          const v = parseFloat(e.target.value.replace(',', '.'));
                          data[i] = { ...d, value: Number.isFinite(v) ? v : 0 };
                          set({ chart: { ...slide.chart!, data } });
                        }}
                        className="h-8 text-sm font-mono border-transparent bg-transparent px-1.5 text-right hover:border-neutral-200 focus-visible:bg-white"
                        aria-label={`Row ${i + 1} value`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-neutral-300 hover:text-red-600"
                        onClick={() => set({ chart: { ...slide.chart!, data: slide.chart!.data.filter((_, j) => j !== i) } })}
                        disabled={slide.chart!.data.length <= 1}
                        aria-label={`Remove row ${i + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 gap-1"
                disabled={slide.chart.data.length >= 12}
                onClick={() => set({ chart: { ...slide.chart!, data: [...slide.chart.data, { label: `Item ${slide.chart!.data.length + 1}`, value: 0 }] } })}
              >
                <Plus className="h-3.5 w-3.5" /> Add row
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Unit</Label>
                <Input
                  value={slide.chart.unit ?? ''}
                  onChange={(e) => set({ chart: { ...slide.chart!, unit: e.target.value || undefined } })}
                  placeholder="%, M…"
                  maxLength={10}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Source</Label>
                <Input
                  value={slide.chart.source ?? ''}
                  onChange={(e) => set({ chart: { ...slide.chart!, source: e.target.value || undefined } })}
                  placeholder="FY2025 report"
                  maxLength={60}
                />
              </div>
            </div>
            {(slide.chart.series?.length ?? 0) > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Series (advanced)</Label>
                <Textarea
                  value={(slide.chart.series ?? []).map((sr) => `${sr.name}: ${sr.points.join(', ')}`).join('\n')}
                  onChange={(e) => {
                    const series = e.target.value.split('\n').filter(Boolean).slice(0, 4).map((line) => {
                      const [name = 'Series', rest = ''] = line.split(':');
                      const points = rest.split(',').map((p) => parseFloat(p.trim()) || 0);
                      return { name: name.trim(), points };
                    });
                    set({ chart: { ...slide.chart!, series: series.length ? series : undefined } });
                  }}
                  className="min-h-20 text-xs font-mono"
                  placeholder="2024: 1.2, 3.4, 5.6"
                />
                <p className="text-[11px] text-muted-foreground">One series per line — “name: p1, p2, …”. Values map to the data labels above.</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Chart insight</Label>
              <Textarea value={slide.chart.insight ?? ''} onChange={(e) => set({ chart: { ...slide.chart!, insight: e.target.value } })} className="min-h-16 text-sm" maxLength={140} />
            </div>
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

        {slide.layout === 'image' && (
          <div className="space-y-2.5">
            {slide.image?.url ? (
              <div className="relative group rounded-lg overflow-hidden border">
                <img src={slide.image.url} alt={slide.image.alt} className="w-full object-cover max-h-36" />
                <button
                  onClick={() => set({ image: undefined })}
                  className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white rounded p-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => picRef.current?.click()}
                disabled={uploadBusy}
                className="w-full rounded-lg border-2 border-dashed border-neutral-300 hover:border-neutral-900 transition-colors p-5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-60"
              >
                {uploadBusy
                  ? <Loader2 className="h-5 w-5 mx-auto text-neutral-400 animate-spin" />
                  : <ImagePlus className="h-5 w-5 mx-auto text-neutral-400" />}
                <p className="text-sm font-medium mt-1.5">{uploadBusy ? 'Processing…' : 'Upload an image'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">PNG · JPG · WebP · GIF, max 8 MB</p>
              </button>
            )}
            <input
              ref={picRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={(e) => handlePicUpload(e.target.files)}
            />
            {!slide.image?.url && (
              <Button variant="secondary" size="sm" className="w-full" onClick={() => picRef.current?.click()} disabled={uploadBusy}>
                <ImagePlus className="h-3.5 w-3.5" /> Choose file
              </Button>
            )}
            {slide.image?.url && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Replace image</Label>
                  <Input
                    value={slide.image.url.startsWith('data:') ? '' : slide.image.url}
                    onChange={(e) => set({ image: { ...slide.image!, url: e.target.value } })}
                    placeholder="Paste an image URL…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Alt text</Label>
                  <Input
                    value={slide.image.alt}
                    onChange={(e) => set({ image: { ...slide.image!, alt: e.target.value } })}
                    maxLength={160}
                    placeholder="Describe the image for accessibility"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Speaker notes */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="insp-notes" className="text-xs uppercase tracking-wide text-muted-foreground">Speaker notes</Label>
          <Button
            variant="ghost" size="sm"
            className="h-6 px-2 text-[11px] gap-1 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
            disabled={aiBusy === 'speaker_notes'}
            onClick={() => runAI('speaker_notes')}
          >
            {aiBusy === 'speaker_notes' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {aiBusy === 'speaker_notes' ? 'Writing…' : 'Generate with AI'}
          </Button>
        </div>
        <Textarea id="insp-notes" value={slide.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} className="min-h-24 text-sm" placeholder="What you'll say when this slide is up…" />
        {slide.notes && <p className="text-[11px] text-muted-foreground">{slide.notes.trim().split(/\s+/).length} words · ~{Math.max(1, Math.round(slide.notes.trim().split(/\s+/).length / 110))} min spoken</p>}
      </section>

      {/* Motion — per-slide transition override */}
      <section className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Clapperboard className="h-3 w-3" /> Transition
        </Label>
        <Select
          value={slide.transition ?? 'inherit'}
          onValueChange={(v) => set({ transition: (v === 'inherit' ? undefined : v) as TransitionKind | undefined })}
        >
          <SelectTrigger aria-label="Slide transition"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TRANSITIONS.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">
                {t === 'inherit' ? 'Inherit from theme' : t === 'none' ? 'None (cut)' : t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">Overrides the design system's motion for this slide only.</p>
      </section>
    </div>
  );
}
