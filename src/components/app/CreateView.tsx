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
    body: 'One sentence is enough. Audience, tone, language and length are optional dials; the brief stays yours.',
  },
  {
    n: '02',
    title: 'Outline',
    body: 'DeckForge drafts the story first. You read it, edit it, reorder it. Only then does a single slide exist.',
  },
  {
    n: '03',
    title: 'Design',
    body: 'Eleven layouts rendered live from design tokens. Charts are computed from your numbers, never invented.',
  },
  {
    n: '04',
    title: 'Present & export',
    body: 'Fullscreen with speaker notes and a timer. Then take the file: editable PPTX, print-ready PDF, or standalone HTML.',
  },
];

const HOUSE_RULES = [
  {
    title: 'Your numbers are sacred.',
    body: 'Charts are computed from the data you attach. If a figure can’t be traced to your files, it doesn’t get charted. The slide falls back to words.',
  },
  {
    title: 'Design systems, not templates.',
    body: 'Every slide is rendered live from a token set. Swap themes mid-deck and nothing breaks, nothing overflows, nothing needs re-aligning.',
  },
  {
    title: 'Outline before pixels.',
    body: 'Design can’t rescue the wrong story. You approve the structure, and edit it, before the first slide is designed.',
  },
  {
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
          transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as const },
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
      toast.error('Paste some markdown first; headings become slides.');
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
        <div className="fixed inset-2 z-40 grid place-items-center border-2 border-dashed border-[color:var(--stg-yellow)] bg-[color:var(--stg-ink)]/95 pointer-events-none" aria-hidden>
          <div className="text-center">
            <FileUp className="h-8 w-8 mx-auto text-[color:var(--stg-yellow)]" />
            <p className="stg-display mt-2 text-2xl uppercase text-[color:var(--stg-cream)]">Drop your data</p>
            <p className="stg-label mt-1 text-[color:var(--stg-gray)]">CSV · XLSX · JSON AS DATA · IMAGES AS CHART SCREENSHOTS</p>
          </div>
        </div>
      )}

      {/* ================================================================
          HERO — the stage. Ink, poster yellow, and the screen.
         ================================================================ */}
      <section className="relative overflow-hidden bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)]">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 sm:pt-24 pb-14 sm:pb-20">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
            {/* Copy */}
            <motion.div {...enter(0)} className="lg:col-span-6 space-y-7">
              <p className="stg-label flex items-center gap-3 text-[color:var(--stg-yellow)]">
                <span className="inline-block h-2 w-2 bg-[color:var(--stg-yellow)]" aria-hidden />
                DeckForge AI · A presentation foundry
              </p>
              <h1 className="stg-display text-[clamp(3.1rem,7vw,5.9rem)] uppercase leading-[0.93]">
                <span className="block">The lights go down.</span>
                <span className="block text-[color:var(--stg-yellow)]">Your story holds the room.</span>
              </h1>
              <p className="max-w-[62ch] text-base sm:text-lg leading-relaxed text-[color:var(--stg-gray)]">
                Give DeckForge one sentence, or hand it your spreadsheet. It drafts the
                outline, you approve the story, and every slide is designed against a real
                design system with charts built from your actual numbers.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="#brief"
                  className="stg-label inline-flex h-12 items-center gap-2 bg-[color:var(--stg-yellow)] px-6 text-[color:var(--stg-ink)] transition-colors hover:bg-[color:var(--stg-yellow-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-ink)]"
                >
                  <Hammer className="h-4 w-4" aria-hidden />
                  Start the brief
                </a>
                <a
                  href="#method"
                  className="stg-label inline-flex h-12 items-center border-2 border-white/25 px-6 text-[color:var(--stg-cream)] transition-colors hover:border-[color:var(--stg-yellow)] hover:text-[color:var(--stg-yellow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-ink)]"
                >
                  Read the method
                </a>
              </div>
              <p className="stg-label pt-1 text-[10px] text-white/40">
                No invented numbers · Outline first · AI runs server-side
              </p>
            </motion.div>

            {/* The Screen — real slides, real themes */}
            <motion.div {...enter(0.12)} className="lg:col-span-6">
              <HeroSpecimen />
            </motion.div>
          </div>
        </div>

        {/* Poster ticker */}
        <div className="stg-ticker border-t-2 border-[color:var(--stg-ink)] py-2.5" aria-hidden>
          <div className="stg-ticker-track flex w-max items-center">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
                {MARQUEE_ITEMS.map((item) => (
                  <span key={`${copy}-${item}`} className="stg-label flex items-center text-[10px]">
                    <span className="px-5">{item}</span>
                    <span className="h-1.5 w-1.5 bg-[color:var(--stg-ink)]" aria-hidden />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          01 — THE METHOD (poster rows, oversized numerals)
         ================================================================ */}
      <section id="method" className="scroll-mt-16 bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
          <motion.div {...enter(0)} className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="stg-label flex items-center gap-2.5 text-[color:var(--stg-ink)]/60">
                <span className="inline-block h-2 w-2 bg-[color:var(--stg-yellow)]" aria-hidden />
                01 · The method
              </p>
              <h2 className="stg-display mt-3 text-4xl sm:text-5xl uppercase leading-[0.95]">
                You own the story. We own the pixels.
              </h2>
            </div>
            <p className="max-w-xs pb-1 text-sm leading-relaxed text-[color:var(--stg-ink)]/70">
              Four steps, in order, every time. Nothing is generated past a step you haven’t approved.
            </p>
          </motion.div>

          <motion.ol {...enter(0.08)} className="mt-10">
            {METHOD_STEPS.map((step, i) => (
              <li
                key={step.n}
                className={cn(
                  'stg-num-fill grid grid-cols-[auto_1fr] items-start gap-5 border-t-2 border-[color:var(--stg-ink)] py-7 sm:gap-10 sm:py-9',
                  i === 1 && 'lg:pl-20',
                  i === 3 && 'lg:pl-20',
                )}
              >
                <span className="stg-num select-none pt-1 text-6xl sm:text-8xl" aria-hidden>{step.n}</span>
                <div className="pt-1.5">
                  <h3 className="stg-display text-2xl sm:text-3xl uppercase">{step.title}</h3>
                  <p className="mt-2 max-w-[62ch] text-sm sm:text-base leading-relaxed text-[color:var(--stg-ink)]/75">{step.body}</p>
                </div>
              </li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* ================================================================
          02 — THE WORKBENCH (functional: brief → materials → systems)
         ================================================================ */}
      <section id="brief" className="scroll-mt-16 bg-[color:var(--stg-cream-2)] text-[color:var(--stg-ink)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
          <motion.div {...enter(0)} className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="stg-label flex items-center gap-2.5 text-[color:var(--stg-ink)]/60">
                <span className="inline-block h-2 w-2 bg-[color:var(--stg-yellow)]" aria-hidden />
                02 · The workbench
              </p>
              <h2 className="stg-display mt-3 text-4xl sm:text-5xl uppercase leading-[0.95]">Start the job.</h2>
            </div>
            <p className="stg-label max-w-xs pb-1 text-right text-[10px] text-[color:var(--stg-ink)]/60">
              A · Brief&nbsp;&nbsp;B · Materials&nbsp;&nbsp;C · Design system
            </p>
          </motion.div>

          {/* ---- A · Brief: the job ticket --------------------------------- */}
          <motion.div {...enter(0.06)} className="mt-9 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] p-4 text-[color:var(--stg-ink)] shadow-[8px_8px_0_0_var(--stg-ink)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="stg-label text-[11px]">A · Brief</p>
              {hasData && (
                <Badge className="bg-[color:var(--stg-ink)] text-[color:var(--stg-yellow)] hover:bg-[color:var(--stg-ink)]">
                  {tables.length + chartSpecs.length + (diagram ? 1 : 0)} materials attached
                </Badge>
              )}
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. “Create me a presentation about our 2026 sustainability strategy for investors”"
              className="mt-3 min-h-28 resize-none border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] text-base text-[color:var(--stg-ink)] placeholder:text-[color:var(--stg-ink)]/50 focus-visible:ring-[color:var(--stg-ink)]"
              maxLength={1200}
              aria-label="Presentation topic"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {dealExamples(ideaSeed).map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="stg-label max-w-full truncate border border-[color:var(--stg-ink)]/45 px-3 py-1.5 text-[10px] text-[color:var(--stg-ink)]/85 transition-colors hover:bg-[color:var(--stg-ink)] hover:text-[color:var(--stg-yellow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)]"
                >
                  {ex.length > 52 ? ex.slice(0, 52) + '…' : ex}
                </button>
              ))}
              <button
                onClick={() => setIdeaSeed((s) => s + 1)}
                className="stg-label inline-flex items-center gap-1.5 border border-dashed border-[color:var(--stg-ink)]/55 px-3 py-1.5 text-[10px] text-[color:var(--stg-ink)]/70 transition-colors hover:border-[color:var(--stg-ink)] hover:text-[color:var(--stg-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)]"
                title="Show other starter ideas"
                aria-label="Show other starter ideas"
              >
                <X className="h-3 w-3 rotate-45" aria-hidden /> More briefs
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1.5">
                <span className="stg-label text-[9px] text-[color:var(--stg-ink)]/75">Audience</span>
                <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="investors, execs…" maxLength={120} className="border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)]" />
              </label>
              <label className="space-y-1.5">
                <span className="stg-label text-[9px] text-[color:var(--stg-ink)]/75">Tone</span>
                <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="professional" maxLength={120} className="border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)]" />
              </label>
              <label className="space-y-1.5">
                <span className="stg-label text-[9px] text-[color:var(--stg-ink)]/75">Language</span>
                <Input value={language} onChange={(e) => setLanguage(e.target.value)} maxLength={60} className="border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)]" />
              </label>
              <div className="space-y-1.5">
                <span className="stg-label text-[9px] text-[color:var(--stg-ink)]/75">Slides: {slideCount}</span>
                <Slider value={[slideCount]} onValueChange={([v]) => setSlideCount(v)} min={4} max={30} step={1} aria-label="Number of slides" />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                onClick={generateOutline}
                disabled={!!busy}
                className="stg-label h-12 flex-1 bg-[color:var(--stg-ink)] text-[13px] text-[color:var(--stg-yellow)] hover:bg-[color:var(--stg-ink-2)]"
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Hammer className="h-4 w-4" aria-hidden />}
                {busy ?? 'Forge the outline'}
              </Button>
              <p className="stg-label text-center text-[10px] leading-relaxed text-[color:var(--stg-ink)]/75 sm:max-w-64 sm:text-left">
                You approve the outline before a single slide is designed.
              </p>
            </div>
            {dataError && (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-red-800">
                <AlertTriangle className="h-4 w-4" aria-hidden /> {dataError}
              </p>
            )}
          </motion.div>

          {/* ---- B · Materials + C · Design systems ------------------------ */}
          <div className="mt-10 grid gap-10 lg:grid-cols-5">
            {/* B — Materials */}
            <motion.section {...enter(0.1)} className="space-y-4 lg:col-span-2" aria-labelledby="materials-h">
              <div>
                <p className="stg-label text-[color:var(--stg-ink)]/60">B · Materials — optional</p>
                <h3 id="materials-h" className="stg-display mt-2 text-2xl uppercase">
                  Bring your own evidence.
                </h3>
                <p className="mt-1.5 max-w-[55ch] text-sm leading-relaxed text-[color:var(--stg-ink)]/70">
                  Spreadsheets become charts with the exact numbers. Screenshots get read.
                  Structure you wrote stays exactly as you wrote it.
                </p>
              </div>

              <div className="border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] p-4">
                {/* Static-button tabs (no Radix id generation — keeps SSR/hydration
                    ids fully deterministic) */}
                <div role="tablist" aria-label="Data input type" className="mb-3 grid grid-cols-4 gap-1 border border-[color:var(--stg-ink)]/20 p-1">
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
                        'stg-label inline-flex h-9 items-center justify-center gap-1.5 px-1 text-[9px] whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)] disabled:pointer-events-none disabled:opacity-50',
                        dataTab === t.id
                          ? 'bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)]'
                          : 'text-[color:var(--stg-ink)]/60 hover:text-[color:var(--stg-ink)]',
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
                      className="w-full border-2 border-dashed border-[color:var(--stg-ink)]/40 bg-[color:var(--stg-cream)] p-6 text-center transition-colors hover:border-[color:var(--stg-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)]"
                    >
                      <FileUp className="mx-auto h-6 w-6 text-[color:var(--stg-ink)]/50" aria-hidden />
                      <p className="mt-2 text-sm font-semibold">Drop or click to upload</p>
                      <p className="stg-label mt-1 text-[9px] text-[color:var(--stg-ink)]/60">CSV · XLSX · JSON · Max 4 MB</p>
                    </button>
                    <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.json,.txt" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
                    {tables.length > 0 && (
                      <ul className="space-y-1.5">
                        {tables.map((t, i) => (
                          <li key={i} className="flex items-center justify-between border border-[color:var(--stg-ink)]/20 bg-[color:var(--stg-cream)] px-2.5 py-2 text-xs">
                            <span className="flex items-center gap-1.5 truncate">
                              {t.name.endsWith('.json') ? <FileJson2 className="h-3.5 w-3.5 text-[color:var(--stg-ink)]/60" aria-hidden /> : <FileSpreadsheet className="h-3.5 w-3.5 text-[color:var(--stg-ink)]" aria-hidden />}
                              <span className="truncate font-medium">{t.name}</span>
                              <span className="text-[color:var(--stg-ink)]/60">{t.rows.length}×{t.columns.length}</span>
                            </span>
                            <button
                              onClick={() => setTables(tables.filter((_, j) => j !== i))}
                              className="text-[color:var(--stg-ink)]/50 hover:text-red-700"
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
                      className="w-full border-2 border-dashed border-[color:var(--stg-ink)]/40 bg-[color:var(--stg-cream)] p-6 text-center transition-colors hover:border-[color:var(--stg-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)]"
                    >
                      <ImageIcon className="mx-auto h-6 w-6 text-[color:var(--stg-ink)]/50" aria-hidden />
                      <p className="mt-2 text-sm font-semibold">Upload a chart screenshot</p>
                      <p className="stg-label mt-1 text-[9px] text-[color:var(--stg-ink)]/60">AI reads the values · No retyping</p>
                    </button>
                    <input ref={imgRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => handleChartImage(e.target.files)} />
                    {chartSpecs.length > 0 && (
                      <ul className="space-y-1.5">
                        {chartSpecs.map((c, i) => (
                          <li key={i} className="flex items-center justify-between border border-[color:var(--stg-ink)]/20 bg-[color:var(--stg-cream)] px-2.5 py-2 text-xs">
                            <span className="flex items-center gap-1.5 truncate">
                              <BarChart3 className="h-3.5 w-3.5 text-[color:var(--stg-ink)]" aria-hidden />
                              <span className="truncate font-medium">{c.title || 'Chart'} · {c.data.length} pts</span>
                            </span>
                            <button onClick={() => setChartSpecs(chartSpecs.filter((_, j) => j !== i))} className="text-[color:var(--stg-ink)]/50 hover:text-red-700" aria-label="Remove chart">
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
                      className="min-h-40 font-mono text-xs"
                      aria-label="Markdown outline"
                    />
                    {(() => {
                      const trimmed = markdown.trim();
                      if (!trimmed) {
                        return (
                          <p className="text-[11px] leading-relaxed text-[color:var(--stg-ink)]/65">
                            <code className="bg-[color:var(--stg-ink)]/10 px-1 font-mono">#</code> title · <code className="bg-[color:var(--stg-ink)]/10 px-1 font-mono">##</code> slide · bullets become the brief · <code className="bg-[color:var(--stg-ink)]/10 px-1 font-mono">[chart]</code> tag picks the layout. Structure stays exactly as you write it, no AI rewriting.
                          </p>
                        );
                      }
                      const parsed = parseMarkdownOutline(trimmed);
                      const bullets = parsed.slides.reduce((n, s) => n + (s.brief ? s.brief.split(' • ').length : 0), 0);
                      return (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="gap-1 border-[color:var(--stg-ink)]/30 text-[11px]"><ListTree className="h-3 w-3" aria-hidden /> {parsed.slides.length} slides</Badge>
                          <Badge variant="outline" className="border-[color:var(--stg-ink)]/30 text-[11px]">{bullets} bullets</Badge>
                          <Badge variant="outline" className="max-w-45 truncate gap-1 border-[color:var(--stg-ink)]/30 text-[11px]"><ListTree className="h-3 w-3 shrink-0" aria-hidden /> {parsed.title}</Badge>
                        </div>
                      );
                    })()}
                    <Button size="sm" className="stg-label w-full gap-1.5 bg-[color:var(--stg-ink)] text-[11px] text-[color:var(--stg-yellow)] hover:bg-[color:var(--stg-ink-2)]" onClick={buildFromMarkdown} disabled={!!busy}>
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
                      className="min-h-28 font-mono text-xs"
                    />
                    {diagram ? (
                      <div className="flex items-center justify-between border border-[color:var(--stg-ink)]/20 bg-[color:var(--stg-cream)] px-2.5 py-2 text-xs">
                        <span className="flex items-center gap-1.5"><Workflow className="h-3.5 w-3.5 text-[color:var(--stg-ink)]" aria-hidden /><span className="font-medium">{diagram.title}</span> · {diagram.nodes.length} nodes</span>
                        <button onClick={() => setDiagram(null)} className="text-[color:var(--stg-ink)]/50 hover:text-red-700" aria-label="Remove diagram"><X className="h-3.5 w-3.5" aria-hidden /></button>
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
                  <p className="stg-label text-[color:var(--stg-ink)]/60">C · Design system</p>
                  <h3 id="systems-h" className="stg-display mt-2 text-2xl uppercase">
                    Eight systems. Zero templates.
                  </h3>
                </div>
                <p className="max-w-xs pb-1 text-sm leading-relaxed text-[color:var(--stg-ink)]/70">
                  Auto lets the model match your topic: every option is a full token set, not a skin.
                </p>
              </div>
              <TemplateGallery compact />
            </motion.section>
          </div>
        </div>
      </section>

      {/* ================================================================
          03 — HOUSE RULES (opinions we run on, numbered rows)
         ================================================================ */}
      <section className="scroll-mt-16 bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
          <motion.div {...enter(0)} className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="stg-label flex items-center gap-2.5 text-[color:var(--stg-yellow)]">
                <span className="inline-block h-2 w-2 bg-[color:var(--stg-yellow)]" aria-hidden />
                03 · House rules
              </p>
              <h2 className="stg-display mt-3 text-4xl sm:text-5xl uppercase leading-[0.95]">
                Opinions we refuse to soften.
              </h2>
            </div>
            <p className="stg-label pb-1 text-[10px] text-white/40">Non-negotiable · Enforced in code</p>
          </motion.div>

          <motion.div {...enter(0.08)} className="mt-10">
            {HOUSE_RULES.map((rule, i) => (
              <article key={rule.title} className="grid grid-cols-[auto_1fr] gap-5 border-t-2 border-white/15 py-7 first:border-t-0 first:pt-0 sm:gap-10 sm:py-8">
                <span className="stg-display select-none pt-1 text-4xl leading-none text-[color:var(--stg-yellow)] sm:text-6xl" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="stg-display text-2xl uppercase sm:text-3xl">{rule.title}</h3>
                  <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-white/65 sm:text-base">{rule.body}</p>
                </div>
              </article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          04 — THE ARCHIVE
         ================================================================ */}
      <section id="decks" className="scroll-mt-16 bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
          <motion.div {...enter(0)} className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="stg-label flex items-center gap-2.5 text-[color:var(--stg-ink)]/60">
                <span className="inline-block h-2 w-2 bg-[color:var(--stg-yellow)]" aria-hidden />
                04 · The archive
              </p>
              <h2 className="stg-display mt-3 text-4xl sm:text-5xl uppercase leading-[0.95]">
                Your decks, ready to rerun.
              </h2>
            </div>
            <p className="stg-label pb-1 text-[10px] text-[color:var(--stg-ink)]/60">
              Autosaved · Export, duplicate, import .deck.json
            </p>
          </motion.div>
          <RecentDecks onOpen={(d) => openDeck(d)} hideHeading />
        </div>
      </section>
    </div>
  );
}
