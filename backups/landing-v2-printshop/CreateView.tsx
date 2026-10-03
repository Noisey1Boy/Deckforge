'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAppStore } from '@/lib/store/deck-store';
import { TemplateGallery } from './TemplateGallery';
import { RecentDecks } from './RecentDecks';
import { HeroSpecimen } from './landing/HeroSpecimen';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { ChartSpec, DeckOutline, OutlineItem } from '@/lib/deck/types';
import type { ChartPlan, MermaidPlan } from '@/lib/data/plans';
import { buildChartSpec, parseFileToTables, tableToMeta, type ParsedTable } from '@/lib/data/parse';
import { parseMarkdownOutline, suggestThemeId } from '@/lib/data/markdown-outline';
import { cn } from '@/lib/utils';
import {
  FileSpreadsheet, FileJson2, ImageIcon, Loader2, Hammer,
  BarChart3, Workflow, AlertTriangle, X, FileUp, ListTree,
  ShieldCheck, Palette, FileOutput,
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

const MARQUEE_ITEMS = [
  '8 DESIGN SYSTEMS',
  '11 SLIDE LAYOUTS',
  'CHARTS FROM YOUR OWN DATA',
  'EDITABLE PPTX',
  'PRINT-READY PDF',
  'STANDALONE HTML',
  'OUTLINE FIRST',
  'NO INVENTED NUMBERS',
  'SPEAKER NOTES',
  'AUTO THEME PICKING',
];

const METHOD_STEPS = [
  {
    n: '01',
    title: 'Brief',
    body: 'One sentence is enough. Audience, tone, language and length are optional dials — the brief stays yours.',
  },
  {
    n: '02',
    title: 'Outline',
    body: 'DeckForge drafts the story first. You read it, edit it, reorder it — only then does a single slide exist.',
  },
  {
    n: '03',
    title: 'Design',
    body: 'Eleven layouts rendered live from design tokens. Charts are computed from your numbers — never invented.',
  },
  {
    n: '04',
    title: 'Present & export',
    body: 'Fullscreen with speaker notes and a timer. Then take the file: editable PPTX, print-ready PDF, or standalone HTML.',
  },
];

const HOUSE_RULES = [
  {
    icon: ShieldCheck,
    title: 'Your numbers are sacred.',
    body: 'Charts are computed from the data you attach. If a figure can’t be traced to your files, it doesn’t get charted — the slide falls back to words.',
  },
  {
    icon: Palette,
    title: 'Design systems, not templates.',
    body: 'Every slide is rendered live from a token set. Swap themes mid-deck and nothing breaks, nothing overflows, nothing needs re-aligning.',
  },
  {
    icon: ListTree,
    title: 'Outline before pixels.',
    body: 'Design can’t rescue the wrong story. You approve the structure — and edit it — before the first slide is designed.',
  },
  {
    icon: FileOutput,
    title: 'The file is yours.',
    body: 'Native editable charts in PPTX, a print-perfect PDF, and a standalone HTML deck that works offline. No watermarks. No lock-in.',
  },
];

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
  const [dataTab, setDataTab] = useState<'files' | 'image' | 'mermaid' | 'markdown'>('files');
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
  const [markdown, setMarkdown] = useState('');
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

  // ------------------------------------------------- markdown → outline
  const buildFromMarkdown = () => {
    if (markdown.trim().length < 10) {
      toast.error('Paste some markdown first — headings become slides.');
      return;
    }
    try {
      const parsed = parseMarkdownOutline(markdown);
      if (parsed.slides.length < 1) throw new Error('No headings found');
      // persist generation controls so the slide pipeline uses the same settings
      setGenSettings({ audience, tone, language, slideCount });
      const outline: DeckOutline = {
        title: parsed.title,
        subtitle: parsed.subtitle || prompt.trim().slice(0, 110),
        slides: parsed.slides,
      };
      // deterministic theme suggestion when Auto is selected
      if (themeChoice === 'auto') {
        outline.recommendedThemeId = suggestThemeId(markdown);
        outline.themeRationale = 'Matched to your markdown content.';
      }
      // attach user charts to slides tagged [chart], in order
      const chartAssignments: Record<string, ChartSpec> = {};
      const pool = [...chartSpecs];
      outline.slides.forEach((s: OutlineItem, i: number) => {
        if (s.layout === 'chart' && pool.length) {
          chartAssignments[String(i)] = pool.shift()!;
        }
      });
      setDataAssets({
        tables, charts: chartSpecs,
        diagram: diagram ?? undefined,
        dataContext: undefined,
        chartAssignments,
      });
      setOutline(outline);
      setView('outline');
      toast.success(`Outline built — ${outline.slides.length} slides from your markdown.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not parse markdown');
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

  // ---- drop a data file anywhere on the page to attach it ---------------
  const [droppingData, setDroppingData] = useState(false);
  const pageDrag = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    setDroppingData(true);
  };
  const pageDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDroppingData(false);
  };
  const pageDrop = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    setDroppingData(false);
    const files = Array.from(e.dataTransfer.files);
    const images = files.filter((f) => f.type.startsWith('image/'));
    const data = files.filter((f) => !f.type.startsWith('image/'));
    if (data.length > 0) {
      setDataTab('files');
      const dt = new DataTransfer();
      data.forEach((f) => dt.items.add(f));
      void handleFiles(dt.files);
    }
    if (images.length > 0) {
      setDataTab('image');
      const dt = new DataTransfer();
      images.forEach((f) => dt.items.add(f));
      void handleChartImage(dt.files);
    }
  };

  return (
    <div className="w-full" onDragOver={pageDrag} onDragLeave={pageDragLeave} onDrop={pageDrop}>
      {droppingData && (
        <div className="fixed inset-2 z-40 grid place-items-center rounded-2xl border-2 border-dashed border-white bg-neutral-950/90 backdrop-blur-sm pointer-events-none" aria-hidden>
          <div className="text-center text-white">
            <FileUp className="h-8 w-8 mx-auto" />
            <p className="mt-2 text-base font-semibold">Drop your data</p>
            <p className="df-mono text-[11px] tracking-wider text-neutral-400 mt-0.5">CSV · XLSX · JSON AS DATA — IMAGES AS CHART SCREENSHOTS</p>
          </div>
        </div>
      )}

      {/* ================================================================
          HERO — ink band. Real type, real slides, no gradients.
         ================================================================ */}
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div
          className="absolute inset-0 df-dots-dark opacity-70"
          style={{
            maskImage: 'radial-gradient(ellipse 75% 80% at 30% 20%, black 25%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 80% at 30% 20%, black 25%, transparent 78%)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 sm:pt-20 pb-12 sm:pb-16">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Copy */}
            <motion.div {...enter(0)} className="lg:col-span-6 space-y-6">
              <p className="df-mono flex items-center gap-2.5 text-[11px] sm:text-xs tracking-[0.28em] text-amber-300/90">
                <span className="inline-block h-px w-8 bg-amber-300/70" aria-hidden />
                A DESIGN STUDIO THAT RUNS ON YOUR PROMPT
              </p>
              <h1 className="df-display text-4xl sm:text-5xl lg:text-[3.6rem] font-bold leading-[1.04] text-balance">
                Presentations that look like{' '}
                <span className="df-serif-it font-medium text-amber-200">someone cared.</span>
              </h1>
              <p className="max-w-xl text-base sm:text-lg leading-relaxed text-neutral-400">
                Give it a sentence — or hand it your spreadsheet. DeckForge drafts the
                outline, you approve the story, and every slide is designed against a real
                design system with charts built from your actual numbers.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="#brief"
                  className="inline-flex h-12 items-center gap-2 rounded-lg bg-amber-300 px-6 text-base font-semibold text-neutral-950 transition-colors hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  <Hammer className="h-4.5 w-4.5" aria-hidden />
                  Forge an outline
                </a>
                <a
                  href="#method"
                  className="inline-flex h-12 items-center rounded-lg border border-white/20 px-6 text-base font-medium text-neutral-200 transition-colors hover:border-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  Read the method
                </a>
              </div>
              <p className="df-mono pt-1 text-[11px] tracking-[0.18em] text-neutral-500">
                NO INVENTED NUMBERS · OUTLINE FIRST · AI RUNS SERVER-SIDE
              </p>
            </motion.div>

            {/* Live specimen — real slides, real themes */}
            <motion.div {...enter(0.1)} className="lg:col-span-6">
              <HeroSpecimen />
            </motion.div>
          </div>
        </div>

        {/* Marquee — press specifications strip */}
        <div className="df-marquee relative border-t border-white/10 py-2.5 overflow-hidden" aria-hidden>
          <div className="df-marquee-track flex w-max items-center">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
                {MARQUEE_ITEMS.map((item) => (
                  <span key={`${copy}-${item}`} className="df-mono flex items-center text-[11px] tracking-[0.22em] text-neutral-500">
                    <span className="px-5">{item}</span>
                    <span className="h-1 w-1 rounded-full bg-amber-400/70" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          01 — THE METHOD (numbered, like a studio process)
         ================================================================ */}
      <section id="method" className="scroll-mt-16 border-b bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
          <motion.div {...enter(0)} className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="df-mono text-[11px] tracking-[0.28em] text-neutral-500">01 — THE METHOD</p>
              <h2 className="df-display mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                You own the story. DeckForge owns the pixels.
              </h2>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              Four steps, in order, every time. Nothing is generated past a step you haven’t approved.
            </p>
          </motion.div>

          <motion.ol {...enter(0.08)} className="mt-8 grid gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-4">
            {METHOD_STEPS.map((step) => (
              <li key={step.n} className="group bg-white p-6 transition-colors hover:bg-neutral-50">
                <div className="flex items-center justify-between">
                  <span className="df-mono text-sm text-neutral-400 transition-colors group-hover:text-amber-600">{step.n}</span>
                  <span className="df-reg h-3 w-3 text-neutral-300 transition-colors group-hover:text-amber-500" aria-hidden />
                </div>
                <h3 className="df-display mt-4 text-lg font-semibold tracking-tight text-neutral-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* ================================================================
          02 — THE WORKBENCH (functional: brief → materials → systems)
         ================================================================ */}
      <section id="brief" className="scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
          <motion.div {...enter(0)} className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="df-mono text-[11px] tracking-[0.28em] text-neutral-500">02 — THE WORKBENCH</p>
              <h2 className="df-display mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                Start the job.
              </h2>
            </div>
            <p className="df-mono max-w-xs text-right text-[11px] leading-relaxed tracking-wider text-neutral-500">
              A · BRIEF&nbsp;&nbsp;B · MATERIALS&nbsp;&nbsp;C · DESIGN SYSTEM
            </p>
          </motion.div>

          {/* ---- A · Brief ------------------------------------------------ */}
          <motion.div {...enter(0.06)} className="mt-8 rounded-xl border-2 border-neutral-900 bg-white p-4 sm:p-6 shadow-[6px_6px_0_0_#171717]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="df-mono text-[11px] tracking-[0.22em] text-neutral-500">A · BRIEF</p>
              {hasData && (
                <Badge className="bg-emerald-600 text-white">{tables.length + chartSpecs.length + (diagram ? 1 : 0)} materials attached</Badge>
              )}
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. “Create me a presentation about our 2026 sustainability strategy for investors”"
              className="mt-3 min-h-28 resize-none border-neutral-300 text-base focus-visible:ring-neutral-900"
              maxLength={1200}
              aria-label="Presentation topic"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {dealExamples(ideaSeed).map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="df-mono max-w-full truncate rounded-full border border-neutral-200 px-3 py-1.5 text-[11px] tracking-wide text-muted-foreground transition-colors hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                >
                  {ex.length > 52 ? ex.slice(0, 52) + '…' : ex}
                </button>
              ))}
              <button
                onClick={() => setIdeaSeed((s) => s + 1)}
                className="df-mono inline-flex items-center gap-1.5 rounded-full border border-dashed border-neutral-300 px-3 py-1.5 text-[11px] tracking-wide text-neutral-500 transition-colors hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                title="Show other starter ideas"
                aria-label="Show other starter ideas"
              >
                <X className="h-3 w-3 rotate-45" aria-hidden /> More briefs
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1.5">
                <span className="df-mono text-[10px] font-medium tracking-[0.18em] text-neutral-500">AUDIENCE</span>
                <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="investors, execs…" maxLength={120} className="border-neutral-300" />
              </label>
              <label className="space-y-1.5">
                <span className="df-mono text-[10px] font-medium tracking-[0.18em] text-neutral-500">TONE</span>
                <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="professional" maxLength={120} className="border-neutral-300" />
              </label>
              <label className="space-y-1.5">
                <span className="df-mono text-[10px] font-medium tracking-[0.18em] text-neutral-500">LANGUAGE</span>
                <Input value={language} onChange={(e) => setLanguage(e.target.value)} maxLength={60} className="border-neutral-300" />
              </label>
              <div className="space-y-1.5">
                <span className="df-mono text-[10px] font-medium tracking-[0.18em] text-neutral-500">SLIDES: {slideCount}</span>
                <Slider value={[slideCount]} onValueChange={([v]) => setSlideCount(v)} min={4} max={30} step={1} aria-label="Number of slides" />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                onClick={generateOutline}
                disabled={!!busy}
                className="h-12 flex-1 bg-neutral-900 text-base text-white hover:bg-neutral-800 df-display tracking-tight"
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Hammer className="h-5 w-5" aria-hidden />}
                {busy ?? 'Forge the outline'}
              </Button>
              <p className="df-mono text-[11px] leading-relaxed tracking-wider text-neutral-500 sm:max-w-60 sm:text-left text-center">
                YOU APPROVE THE OUTLINE BEFORE A SINGLE SLIDE IS DESIGNED.
              </p>
            </div>
            {dataError && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" aria-hidden /> {dataError}
              </p>
            )}
          </motion.div>

          {/* ---- B · Materials + C · Design systems ------------------------ */}
          <div className="mt-10 grid gap-8 lg:grid-cols-5">
            {/* B — Materials */}
            <motion.section {...enter(0.1)} className="space-y-4 lg:col-span-2" aria-labelledby="materials-h">
              <div>
                <p className="df-mono text-[11px] tracking-[0.28em] text-neutral-500">B · MATERIALS — OPTIONAL</p>
                <h3 id="materials-h" className="df-display mt-1.5 text-lg font-semibold tracking-tight text-neutral-900">
                  Bring your own evidence.
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Spreadsheets become charts with the exact numbers. Screenshots get read.
                  Structure you wrote stays exactly as you wrote it.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                {/* Static-button tabs (no Radix id generation — keeps SSR/hydration
                    ids fully deterministic) */}
                <div role="tablist" aria-label="Data input type" className="grid grid-cols-4 mb-3 gap-1 rounded-lg bg-neutral-100 p-1">
                  {([
                    { id: 'files', label: 'Files', icon: <FileSpreadsheet className="h-3.5 w-3.5" /> },
                    { id: 'image', label: 'Chart img', icon: <ImageIcon className="h-3.5 w-3.5" /> },
                    { id: 'mermaid', label: 'Mermaid', icon: <Workflow className="h-3.5 w-3.5" /> },
                    { id: 'markdown', label: 'Markdown', icon: <ListTree className="h-3.5 w-3.5" /> },
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
                        'df-mono inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-[11px] font-medium tracking-wide whitespace-nowrap transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:pointer-events-none disabled:opacity-50',
                        dataTab === t.id
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
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
                      className="df-dots-paper w-full rounded-lg border-2 border-dashed border-neutral-300 p-6 text-center transition-colors hover:border-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                    >
                      <FileUp className="mx-auto h-6 w-6 text-neutral-400" aria-hidden />
                      <p className="mt-2 text-sm font-medium">Drop or click to upload</p>
                      <p className="df-mono mt-1 text-[11px] tracking-wide text-muted-foreground">CSV · XLSX · JSON — MAX 4 MB</p>
                    </button>
                    <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.json,.txt" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
                    {tables.length > 0 && (
                      <ul className="space-y-1.5">
                        {tables.map((t, i) => (
                          <li key={i} className="flex items-center justify-between rounded-md bg-neutral-50 px-2.5 py-2 text-xs">
                            <span className="flex items-center gap-1.5 truncate">
                              {t.name.endsWith('.json') ? <FileJson2 className="h-3.5 w-3.5 text-neutral-400" aria-hidden /> : <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" aria-hidden />}
                              <span className="truncate font-medium">{t.name}</span>
                              <span className="df-mono text-neutral-500">{t.rows.length}×{t.columns.length}</span>
                            </span>
                            <button
                              onClick={() => setTables(tables.filter((_, j) => j !== i))}
                              className="text-neutral-400 hover:text-red-600"
                              aria-label={`Remove ${t.name}`}
                            >
                              <X className="h-3.5 w-3.5" aria-hidden />
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
                      className="df-dots-paper w-full rounded-lg border-2 border-dashed border-neutral-300 p-6 text-center transition-colors hover:border-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                    >
                      <ImageIcon className="mx-auto h-6 w-6 text-neutral-400" aria-hidden />
                      <p className="mt-2 text-sm font-medium">Upload a chart screenshot</p>
                      <p className="df-mono mt-1 text-[11px] tracking-wide text-muted-foreground">AI READS THE VALUES — NO RETYPING</p>
                    </button>
                    <input ref={imgRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => handleChartImage(e.target.files)} />
                    {chartSpecs.length > 0 && (
                      <ul className="space-y-1.5">
                        {chartSpecs.map((c, i) => (
                          <li key={i} className="flex items-center justify-between rounded-md bg-neutral-50 px-2.5 py-2 text-xs">
                            <span className="flex items-center gap-1.5 truncate">
                              <BarChart3 className="h-3.5 w-3.5 text-sky-600" aria-hidden />
                              <span className="truncate font-medium">{c.title || 'Chart'} · {c.data.length} pts</span>
                            </span>
                            <button onClick={() => setChartSpecs(chartSpecs.filter((_, j) => j !== i))} className="text-neutral-400 hover:text-red-600" aria-label="Remove chart">
                              <X className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {dataTab === 'markdown' && (
                  <div role="tabpanel" id="data-panel-markdown" aria-labelledby="data-tab-markdown" className="space-y-3">
                    <Textarea
                      value={markdown}
                      onChange={(e) => setMarkdown(e.target.value)}
                      placeholder={'# Q3 Review\nsubtitle: Revenue, wins and risks\n## Highlights\n- Revenue up 18%\n- Churn at all-time low\n## Revenue by region [chart]\n## Thank you / next steps'}
                      className="df-mono min-h-40 text-xs"
                      aria-label="Markdown outline"
                    />
                    {(() => {
                      const trimmed = markdown.trim();
                      if (!trimmed) {
                        return (
                          <p className="df-mono text-[11px] leading-relaxed tracking-wide text-muted-foreground">
                            <code className="rounded bg-neutral-100 px-1">#</code> title · <code className="rounded bg-neutral-100 px-1">##</code> slide · bullets become the brief · <code className="rounded bg-neutral-100 px-1">[chart]</code> tag picks the layout. Structure stays exactly as you write it — no AI rewriting.
                          </p>
                        );
                      }
                      const parsed = parseMarkdownOutline(trimmed);
                      const bullets = parsed.slides.reduce((n, s) => n + (s.brief ? s.brief.split(' • ').length : 0), 0);
                      return (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="df-mono gap-1 bg-white/70 text-[11px]"><ListTree className="h-3 w-3" aria-hidden /> {parsed.slides.length} slides</Badge>
                          <Badge variant="outline" className="df-mono bg-white/70 text-[11px]">{bullets} bullets</Badge>
                          <Badge variant="outline" className="df-mono max-w-45 truncate gap-1 bg-white/70 text-[11px]"><ListTree className="h-3 w-3 shrink-0" aria-hidden /> {parsed.title}</Badge>
                        </div>
                      );
                    })()}
                    <Button size="sm" className="w-full gap-1.5" onClick={buildFromMarkdown} disabled={!!busy}>
                      <ListTree className="h-4 w-4" aria-hidden />
                      Build outline from markdown
                    </Button>
                  </div>
                )}

                {dataTab === 'mermaid' && (
                  <div role="tabpanel" id="data-panel-mermaid" aria-labelledby="data-tab-mermaid" className="space-y-3">
                    <Textarea
                      value={mermaid}
                      onChange={(e) => setMermaid(e.target.value)}
                      placeholder={'graph LR\n  Upload --> Parse --> Analyze --> Report'}
                      className="df-mono min-h-28 text-xs"
                    />
                    {diagram ? (
                      <div className="flex items-center justify-between rounded-md bg-neutral-50 px-2.5 py-2 text-xs">
                        <span className="flex items-center gap-1.5"><Workflow className="h-3.5 w-3.5 text-violet-600" aria-hidden /><span className="font-medium">{diagram.title}</span> · {diagram.nodes.length} nodes</span>
                        <button onClick={() => setDiagram(null)} className="text-neutral-400 hover:text-red-600" aria-label="Remove diagram"><X className="h-3.5 w-3.5" aria-hidden /></button>
                      </div>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={analyzeMermaid} disabled={!!busy}>
                        Convert diagram
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.section>

            {/* C — Design systems */}
            <motion.section {...enter(0.16)} id="systems" className="scroll-mt-16 space-y-4 lg:col-span-3" aria-labelledby="systems-h">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="df-mono text-[11px] tracking-[0.28em] text-neutral-500">C · DESIGN SYSTEM</p>
                  <h3 id="systems-h" className="df-display mt-1.5 text-lg font-semibold tracking-tight text-neutral-900">
                    Eight systems. Zero templates.
                  </h3>
                </div>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Auto lets the model match your topic — every option is a full token set, not a skin.
                </p>
              </div>
              <TemplateGallery compact />
            </motion.section>
          </div>
        </div>
      </section>

      {/* ================================================================
          03 — HOUSE RULES (opinions we run on)
         ================================================================ */}
      <section className="relative scroll-mt-16 overflow-hidden border-y bg-neutral-950 text-white">
        <div
          className="absolute inset-0 df-dots-dark opacity-40"
          style={{
            maskImage: 'radial-gradient(ellipse 60% 90% at 80% 10%, black 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 90% at 80% 10%, black 20%, transparent 75%)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
          <motion.div {...enter(0)} className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="df-mono text-[11px] tracking-[0.28em] text-amber-300/90">03 — HOUSE RULES</p>
              <h2 className="df-display mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                Opinions we refuse to soften.
              </h2>
            </div>
            <p className="df-mono text-[11px] tracking-[0.18em] text-neutral-500">NON-NEGOTIABLE · ENFORCED IN CODE</p>
          </motion.div>

          <motion.div {...enter(0.08)} className="mt-8 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {HOUSE_RULES.map((rule) => (
              <article key={rule.title} className="group bg-neutral-950 p-6 transition-colors hover:bg-white/[0.045]">
                <div className="flex items-center justify-between">
                  <rule.icon className="h-5 w-5 text-amber-300" aria-hidden />
                  <span className="df-reg h-3 w-3 text-white/20 transition-colors group-hover:text-amber-400/70" aria-hidden />
                </div>
                <h3 className="df-display mt-4 text-lg font-semibold tracking-tight">{rule.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{rule.body}</p>
              </article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          04 — YOUR DECKS
         ================================================================ */}
      <section id="decks" className="scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
          <motion.div {...enter(0)} className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="df-mono text-[11px] tracking-[0.28em] text-neutral-500">04 — YOUR DECKS</p>
              <h2 className="df-display mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                The archive.
              </h2>
            </div>
            <p className="df-mono text-[11px] tracking-wider text-neutral-500">
              AUTOSAVED · EXPORT, DUPLICATE, IMPORT .DECK.JSON
            </p>
          </motion.div>
          <RecentDecks onOpen={(d) => openDeck(d)} hideHeading />
        </div>
      </section>
    </div>
  );
}
