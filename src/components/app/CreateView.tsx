'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAppStore } from '@/lib/store/deck-store';
import { TemplateGallery } from './TemplateGallery';
import { RecentDecks, type RecentDeck } from './RecentDecks';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { ChartSpec, DeckOutline } from '@/lib/deck/types';
import type { ChartPlan, MermaidPlan } from '@/lib/data/plans';
import { buildChartSpec, parseFileToTables, tableToMeta, type ParsedTable } from '@/lib/data/parse';
import { cn } from '@/lib/utils';
import {
  FileSpreadsheet, FileJson2, ImageIcon, Loader2, Sparkles, Wand2,
  BarChart3, Workflow, AlertTriangle, X, FileUp, PenLine, LayoutTemplate,
  MonitorPlay, Share2, Dices,
} from 'lucide-react';

const EXAMPLES = [
  'Q3 business review for a fintech startup: metrics, wins, risks and next quarter roadmap',
  'Teach beginners the basics of photography in 10 minutes',
  'Pitch an AI-powered recycling assistant to a city council',
  'Onboarding deck for new engineers: our stack, rituals and how we ship',
  '2026 sustainability strategy for a mid-size apparel brand, for investors',
  'Market landscape of electric scooters in Southeast Asia',
  'Introduce our new design system to the whole company',
  'Quarterly OKR planning offsite: retro, focus areas, owners',
  'Health benefits of sleep, backed by recent research, for a general audience',
  'Launch plan for a mobile budgeting app: positioning, channels, milestones',
  'A history of jazz in five eras, for a school audience',
  'State of our customer support: SLAs, ticket trends, hiring plan',
];

/** Pick `count` example prompts starting from a rotating seed. */
function dealExamples(seed: number, count = 4): string[] {
  const start = (seed * count) % EXAMPLES.length;
  return Array.from({ length: Math.min(count, EXAMPLES.length) }, (_, i) => EXAMPLES[(start + i) % EXAMPLES.length]);
}

interface RecentDeckRef {
  id: string;
  title: string;
}

export function CreateView() {
  const setOutline = useAppStore((s) => s.setOutline);
  const setView = useAppStore((s) => s.setView);
  const setDataAssets = useAppStore((s) => s.setDataAssets);
  const setGenSettings = useAppStore((s) => s.setGenSettings);
  const themeChoice = useAppStore((s) => s.themeChoice);
  const setDeck = useAppStore((s) => s.setDeck);
  const reduceMotion = useReducedMotion();

  const enter = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.22, 0.61, 0.36, 1] as const },
        };

  const [prompt, setPrompt] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('professional');
  const [slideCount, setSlideCount] = useState(10);
  const [language, setLanguage] = useState('English');
  const [busy, setBusy] = useState<string | null>(null);
  const [dataTab, setDataTab] = useState<'files' | 'image' | 'mermaid'>('files');
  // Start with a deterministic seed so SSR and the first client render match
  // (avoids a hydration mismatch); deal a random set right after mount.
  const [ideaSeed, setIdeaSeed] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setIdeaSeed(Math.floor(Math.random() * 3)), 0);
    return () => window.clearTimeout(t);
  }, []);

  // data inputs
  const [tables, setTables] = useState<ParsedTable[]>([]);
  const [chartSpecs, setChartSpecs] = useState<ChartSpec[]>([]);
  const [diagram, setDiagram] = useState<MermaidPlan | null>(null);
  const [mermaid, setMermaid] = useState('');
  const [dataError, setDataError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------- data
  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setDataError(null);
    setBusy('Reading data…');
    const newTables: ParsedTable[] = [...tables];
    for (const file of Array.from(files).slice(0, 3)) {
      const { tables: ts, error } = await parseFileToTables(file);
      if (error) {
        setDataError(error);
        toast.error(error);
      }
      newTables.push(...ts);
    }
    setTables(newTables.slice(0, 3));
    setChartSpecs([]); // re-plan after new data
    setBusy(null);
  };

  const handleChartImage = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      toast.error('Use a PNG, JPG or WebP screenshot of your chart.');
      return;
    }
    if (file.size > 6_000_000) {
      toast.error('Image must be under 6 MB.');
      return;
    }
    setBusy('Reading chart from image…');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await fetch('/api/data/chart-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, language }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Extraction failed');
      setChartSpecs((prev) => [...prev, json.chart as ChartSpec]);
      toast.success('Chart extracted from image.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Image analysis failed');
    } finally {
      setBusy(null);
      if (imgRef.current) imgRef.current.value = '';
    }
  };

  const analyzeMermaid = async () => {
    if (mermaid.trim().length < 10) {
      toast.error('Paste a Mermaid diagram first (e.g. "graph LR; A-->B;").');
      return;
    }
    setBusy('Converting diagram…');
    try {
      const res = await fetch('/api/data/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mermaid, language }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Conversion failed');
      if (json.diagram) {
        setDiagram(json.diagram as MermaidPlan);
        toast.success('Diagram ready to include.');
      } else throw new Error('Could not parse the diagram');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Conversion failed');
    } finally {
      setBusy(null);
    }
  };

  // ------------------------------------------------------------- generate
  const generateOutline = async () => {
    if (prompt.trim().length < 3) {
      toast.error('Describe what the presentation should be about.');
      return;
    }
    setBusy('Designing the outline…');
    try {
      // Persist generation controls so the slide pipeline uses the same settings.
      setGenSettings({ audience, tone, language, slideCount });
      let charts: ChartSpec[] = [...chartSpecs];
      let diagramPlan: MermaidPlan | undefined = diagram ?? undefined;
      let dataContext: string | undefined;

      const wantsAnalysis = tables.length > 0;
      if (wantsAnalysis) {
        setBusy('Analyzing your data…');
        const res = await fetch('/api/data/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tables: tables.map(tableToMeta), language }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Analysis failed');
        const plans = (json.charts ?? []) as ChartPlan[];
        const specs = plans
          .map((p) => {
            const t = tables[p.tableIndex];
            return t ? buildChartSpec(t, p) : null;
          })
          .filter((c): c is ChartSpec => !!c);
        charts = [...charts, ...specs];
        dataContext = json.dataContext;
      }
      if (diagramPlan) {
        dataContext = `${dataContext ?? ''}\nA Mermaid flow diagram "${diagramPlan.title}" with ${diagramPlan.nodes.length} steps is available for a "diagram" slide.`;
      }

      setBusy('Writing the outline…');
      const res = await fetch('/api/generate/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt, audience, tone, slideCount, language, themeChoice, dataContext,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Outline failed');
      const outline = json.outline as DeckOutline;

      // attach data: first N chart slides in the outline get real chart specs
      const chartAssignments: Record<string, ChartSpec> = {};
      const pool = [...charts];
      let remainingDiagram = diagramPlan;
      outline.slides.forEach((s, i) => {
        if (s.layout === 'chart' && pool.length) {
          chartAssignments[String(i)] = pool.shift()!;
        }
      });
      // if diagram exists but no diagram slide planned, convert the last chart-less content slide? Keep: AI was told about it.

      setDataAssets({
        tables,
        charts,
        diagram: remainingDiagram ? { ...remainingDiagram } : undefined,
        dataContext,
        chartAssignments,
      });
      setOutline(outline);
      setView('outline');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setBusy(null);
    }
  };

  const openDeck = async (d: { id: string; title: string }) => {
    try {
      setBusy('Opening deck…');
      const res = await fetch(`/api/decks/${d.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to open');
      setDeck(json.deck);
      setView('editor');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to open deck');
    } finally {
      setBusy(null);
    }
  };

  const hasData = tables.length > 0 || chartSpecs.length > 0 || diagram;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
      {/* Hero */}
      <motion.header {...enter(0)} className="text-center space-y-5 max-w-3xl mx-auto relative">
        <div
          className="absolute inset-x-0 -top-6 h-64 -z-10 opacity-60"
          style={{
            backgroundImage: 'radial-gradient(#d4d4d4 1.2px, transparent 1.6px)',
            backgroundSize: '22px 22px',
            maskImage: 'radial-gradient(ellipse 60% 60% at 50% 35%, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 35%, black 30%, transparent 75%)',
          }}
          aria-hidden
        />
        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs bg-white/70">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" /> AI presentation studio
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900">
          Prompt to <span className="text-neutral-500">polished deck</span> in minutes
        </h1>
        <p className="text-muted-foreground text-lg">
          Describe your topic or drop your data. DeckForge writes, structures and designs the
          whole presentation — then lets you edit, present and export it.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-1" aria-label="How it works">
          {[
            { icon: <PenLine className="h-3.5 w-3.5" />, label: 'Prompt' },
            { icon: <LayoutTemplate className="h-3.5 w-3.5" />, label: 'Design' },
            { icon: <MonitorPlay className="h-3.5 w-3.5" />, label: 'Present' },
            { icon: <Share2 className="h-3.5 w-3.5" />, label: 'Export' },
          ].map((step, i, arr) => (
            <span key={step.label} className="flex items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm">
                {step.icon} {step.label}
              </span>
              {i < arr.length - 1 && <span className="h-px w-4 sm:w-6 bg-neutral-300" aria-hidden />}
            </span>
          ))}
        </div>
      </motion.header>

      {/* Prompt card */}
      <motion.div {...enter(0.08)}>
      <Card className="border-neutral-200 shadow-xl shadow-neutral-900/5">
        <CardContent className="p-4 sm:p-6 space-y-5">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='e.g. "Create me a presentation about our 2026 sustainability strategy for investors"'
            className="min-h-24 text-base resize-none border-neutral-300 focus-visible:ring-neutral-900"
            maxLength={1200}
            aria-label="Presentation topic"
          />
          <div className="flex flex-wrap items-center gap-2">
            {dealExamples(ideaSeed).map((ex) => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="text-xs rounded-full border border-neutral-200 px-3 py-1.5 text-muted-foreground hover:border-neutral-900 hover:text-neutral-900 transition-colors truncate max-w-full"
              >
                {ex.length > 52 ? ex.slice(0, 52) + '…' : ex}
              </button>
            ))}
            <button
              onClick={() => setIdeaSeed((s) => s + 1)}
              className="inline-flex items-center gap-1.5 text-xs rounded-full border border-dashed border-neutral-300 px-3 py-1.5 text-neutral-500 hover:border-neutral-900 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
              title="Show other starter ideas"
              aria-label="Show other starter ideas"
            >
              <Dices className="h-3.5 w-3.5" /> More ideas
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Audience</span>
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="investors, execs…" maxLength={120} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tone</span>
              <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="professional" maxLength={120} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Language</span>
              <Input value={language} onChange={(e) => setLanguage(e.target.value)} maxLength={60} />
            </label>
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Slides: {slideCount}</span>
              <Slider value={[slideCount]} onValueChange={([v]) => setSlideCount(v)} min={4} max={30} step={1} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <Button
              size="lg"
              onClick={generateOutline}
              disabled={!!busy}
              className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white h-12 text-base"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
              {busy ?? 'Generate outline'}
            </Button>
          </div>
          {dataError && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> {dataError}
            </p>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* Data + Templates */}
      <div className="grid gap-8 lg:grid-cols-5">
        <motion.section {...enter(0.16)} className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">2. Your data <span className="text-muted-foreground text-sm font-normal">(optional)</span></h2>
            {hasData && <Badge className="bg-emerald-600">{tables.length + chartSpecs.length + (diagram ? 1 : 0)} assets</Badge>}
          </div>
          <Card>
            <CardContent className="p-4">
              {/* Static-button tabs (no Radix id generation — keeps SSR/hydration
                  ids fully deterministic) */}
              <div role="tablist" aria-label="Data input type" className="grid grid-cols-3 mb-3">
                {([
                  { id: 'files', label: 'Files', icon: <FileSpreadsheet className="h-3.5 w-3.5" /> },
                  { id: 'image', label: 'Chart img', icon: <ImageIcon className="h-3.5 w-3.5" /> },
                  { id: 'mermaid', label: 'Mermaid', icon: <Workflow className="h-3.5 w-3.5" /> },
                ] as const).map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    id={`data-tab-${t.id}`}
                    aria-selected={dataTab === t.id}
                    aria-controls={`data-panel-${t.id}`}
                    tabIndex={dataTab === t.id ? 0 : -1}
                    onClick={() => setDataTab(t.id)}
                    className={cn(
                      'inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:pointer-events-none disabled:opacity-50',
                      dataTab === t.id
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {dataTab === 'files' && (
              <div role="tabpanel" id="data-panel-files" aria-labelledby="data-tab-files" className="space-y-3">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full rounded-lg border-2 border-dashed border-neutral-300 hover:border-neutral-900 transition-colors p-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                  >
                    <FileUp className="h-6 w-6 mx-auto text-neutral-400" />
                    <p className="text-sm font-medium mt-2">Drop or click to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">CSV · XLSX · JSON, max 4 MB</p>
                  </button>
                  <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.json,.txt" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
                  {tables.length > 0 && (
                    <ul className="space-y-1.5">
                      {tables.map((t, i) => (
                        <li key={i} className="flex items-center justify-between text-xs bg-neutral-50 rounded-md px-2.5 py-2">
                          <span className="flex items-center gap-1.5 truncate">
                            {t.name.endsWith('.json') ? <FileJson2 className="h-3.5 w-3.5 text-neutral-400" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />}
                            <span className="truncate font-medium">{t.name}</span>
                            <span className="text-muted-foreground">{t.rows.length} rows × {t.columns.length} cols</span>
                          </span>
                          <button
                            onClick={() => setTables(tables.filter((_, j) => j !== i))}
                            className="text-neutral-400 hover:text-red-600"
                            aria-label={`Remove ${t.name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
              )}

              {dataTab === 'image' && (
              <div role="tabpanel" id="data-panel-image" aria-labelledby="data-tab-image" className="space-y-3">
                  <button
                    onClick={() => imgRef.current?.click()}
                    className="w-full rounded-lg border-2 border-dashed border-neutral-300 hover:border-neutral-900 transition-colors p-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                  >
                    <ImageIcon className="h-6 w-6 mx-auto text-neutral-400" />
                    <p className="text-sm font-medium mt-2">Upload a chart screenshot</p>
                    <p className="text-xs text-muted-foreground mt-1">AI reads the values — no retyping</p>
                  </button>
                  <input ref={imgRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => handleChartImage(e.target.files)} />
                  {chartSpecs.length > 0 && (
                    <ul className="space-y-1.5">
                      {chartSpecs.map((c, i) => (
                        <li key={i} className="flex items-center justify-between text-xs bg-neutral-50 rounded-md px-2.5 py-2">
                          <span className="flex items-center gap-1.5 truncate">
                            <BarChart3 className="h-3.5 w-3.5 text-sky-600" />
                            <span className="truncate font-medium">{c.title || 'Chart'} · {c.data.length} pts</span>
                          </span>
                          <button onClick={() => setChartSpecs(chartSpecs.filter((_, j) => j !== i))} className="text-neutral-400 hover:text-red-600" aria-label="Remove chart">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
              )}

              {dataTab === 'mermaid' && (
              <div role="tabpanel" id="data-panel-mermaid" aria-labelledby="data-tab-mermaid" className="space-y-3">
                  <Textarea
                    value={mermaid}
                    onChange={(e) => setMermaid(e.target.value)}
                    placeholder={'graph LR\n  Upload --> Parse --> Analyze --> Report'}
                    className="font-mono text-xs min-h-28"
                  />
                  {diagram ? (
                    <div className="flex items-center justify-between text-xs bg-neutral-50 rounded-md px-2.5 py-2">
                      <span className="flex items-center gap-1.5"><Workflow className="h-3.5 w-3.5 text-violet-600" /><span className="font-medium">{diagram.title}</span> · {diagram.nodes.length} nodes</span>
                      <button onClick={() => setDiagram(null)} className="text-neutral-400 hover:text-red-600" aria-label="Remove diagram"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={analyzeMermaid} disabled={!!busy}>
                      Convert diagram
                    </Button>
                  )}
              </div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        <motion.section {...enter(0.22)} className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-semibold">3. Pick a design system <span className="text-muted-foreground text-sm font-normal">— or let AI choose</span></h2>
          <TemplateGallery compact />
        </motion.section>
      </div>

      {/* Deck library */}
      <RecentDecks onOpen={(d) => openDeck(d)} />
    </div>
  );
}
