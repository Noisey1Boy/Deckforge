'use client';

/**
 * TemplateModeView — orchestrates the TEMPLATE STUDIO flow from html-store:
 *   idle → brief step (+ selected template / scratch bar)
 *   picking → TemplatePicker gallery
 *   generating → SSE-driven per-slide progress
 *   done → HtmlDeckViewer
 *   error → message + retry
 */

import { useHtmlStore } from '@/lib/store/html-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TONE_OPTIONS, VERBOSITY_OPTIONS } from '@/lib/ai/strategies';
import type { ToneId, Verbosity } from '@/lib/ai/strategies';
import { cn } from '@/lib/utils';
import { HtmlDeckViewer } from './HtmlDeckViewer';
import { TemplatePicker } from './TemplatePicker';
import {
  AlertTriangle,
  Hammer,
  LayoutTemplate,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';

/* Shared brief-ticket look (mirrors CreateView's ticket styling). */
const TICKET_SELECT =
  'w-full justify-between border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)] data-[placeholder]:text-[color:var(--stg-ink)]/50';
const TICKET_CONTENT =
  'border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)] rounded-none';

function FrameworkBadge({ framework }: { framework: string }) {
  return (
    <span className="shrink-0 border border-[color:var(--stg-ink)]/30 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[color:var(--stg-ink)]/70">
      {framework}
    </span>
  );
}

function PaletteDots({ palette }: { palette: string[] }) {
  return (
    <div className="flex items-center" aria-hidden>
      {palette.slice(0, 5).map((c, i) => (
        <span
          key={`${c}-${i}`}
          className="h-3.5 w-3.5 rounded-full border border-[color:var(--stg-ink)]/25"
          style={{ background: c, marginLeft: i === 0 ? 0 : -5 }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Brief step                                                          */
/* ------------------------------------------------------------------ */

function BriefStep() {
  const modeKind = useHtmlStore((s) => s.modeKind);
  const selectedTemplate = useHtmlStore((s) => s.selectedTemplate);
  const scratchEngine = useHtmlStore((s) => s.scratchEngine);
  const templatesCount = useHtmlStore((s) => s.templates.length);
  const brief = useHtmlStore((s) => s.brief);
  const slideCount = useHtmlStore((s) => s.slideCount);
  const audience = useHtmlStore((s) => s.audience);
  const tone = useHtmlStore((s) => s.tone);
  const verbosity = useHtmlStore((s) => s.verbosity);
  const setBrief = useHtmlStore((s) => s.setBrief);
  const setSlideCount = useHtmlStore((s) => s.setSlideCount);
  const setAudience = useHtmlStore((s) => s.setAudience);
  const setTone = useHtmlStore((s) => s.setTone);
  const setVerbosity = useHtmlStore((s) => s.setVerbosity);
  const setScratchEngine = useHtmlStore((s) => s.setScratchEngine);
  const openPicker = useHtmlStore((s) => s.openPicker);
  const clearTemplateChoice = useHtmlStore((s) => s.clearTemplateChoice);
  const startScratch = useHtmlStore((s) => s.startScratch);
  const generate = useHtmlStore((s) => s.generate);

  const picking = !selectedTemplate && modeKind === 'template';

  const cta =
    modeKind === 'scratch'
      ? `Generate ${scratchEngine === 'reveal' ? 'reveal.js' : 'plain HTML'} deck`
      : selectedTemplate
        ? `Fill “${selectedTemplate.name}” with AI`
        : 'Generate deck';

  return (
    <div className="space-y-7">
      <header className="max-w-3xl">
        <p className="stg-label flex items-center gap-2.5 text-[color:var(--stg-ink)]/60">
          <span className="inline-block h-2 w-2 bg-[color:var(--stg-yellow)]" aria-hidden />
          Template studio · HTML decks
        </p>
        <h2 className="stg-display mt-3 text-4xl uppercase leading-[0.95] sm:text-5xl">
          Fill a template. Or start from scratch.
        </h2>
        <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-[color:var(--stg-ink)]/70">
          Pick one of the {templatesCount || '57'} HTML templates and the AI writes your content
          into it — or skip the shelf and get a standalone deck on a JS presentation engine.
        </p>
      </header>

      {/* Selection summary / entry cards */}
      {modeKind === 'template' && selectedTemplate ? (
        <div className="flex flex-wrap items-center gap-3 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] p-3.5 shadow-[6px_6px_0_0_var(--stg-ink)]">
          <PaletteDots palette={selectedTemplate.palette} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-bold text-[color:var(--stg-ink)]">
                {selectedTemplate.name}
              </span>
              <FrameworkBadge framework={selectedTemplate.framework} />
              <span className="stg-label hidden text-[8px] text-[color:var(--stg-ink)]/50 sm:block">
                {selectedTemplate.category}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-[color:var(--stg-ink)]/60">
              {selectedTemplate.tagline}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={openPicker}
            className="stg-label h-8 rounded-none border-2 border-[color:var(--stg-ink)] text-[9px]"
          >
            <LayoutTemplate className="h-3.5 w-3.5" aria-hidden /> Change
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearTemplateChoice}
            aria-label="Remove selected template"
            className="h-8 rounded-none border-2 border-[color:var(--stg-ink)]/40 px-2 text-[color:var(--stg-ink)]/70 hover:border-red-700 hover:bg-red-700 hover:text-white"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      ) : modeKind === 'scratch' ? (
        <div className="flex flex-wrap items-center gap-3 border-2 border-dashed border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] p-3.5">
          <Sparkles className="h-4 w-4 text-[color:var(--stg-ink)]/60" aria-hidden />
          <span className="stg-display text-lg uppercase leading-none">From scratch</span>
          <div className="flex overflow-hidden border-2 border-[color:var(--stg-ink)]" role="group" aria-label="Scratch engine">
            {(['reveal', 'plain'] as const).map((e) => (
              <button
                key={e}
                onClick={() => setScratchEngine(e)}
                aria-pressed={scratchEngine === e}
                className={cn(
                  'px-3 py-1.5 font-mono text-[11px] font-semibold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)]',
                  scratchEngine === e
                    ? 'bg-[color:var(--stg-ink)] text-[color:var(--stg-yellow)]'
                    : 'bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)]/60 hover:text-[color:var(--stg-ink)]',
                )}
              >
                {e === 'reveal' ? 'reveal.js' : 'plain html'}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={openPicker}
            className="stg-label ml-auto h-8 rounded-none border-2 border-[color:var(--stg-ink)] text-[9px]"
          >
            <LayoutTemplate className="h-3.5 w-3.5" aria-hidden /> Browse templates instead
          </Button>
        </div>
      ) : (
        picking && (
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={openPicker}
              className="group border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] p-5 text-left shadow-[8px_8px_0_0_var(--stg-ink)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)] motion-safe:hover:-translate-y-0.5"
            >
              <LayoutTemplate className="h-6 w-6 text-[color:var(--stg-ink)]" aria-hidden />
              <p className="stg-display mt-3 text-2xl uppercase leading-none">Pick a template</p>
              <p className="mt-2 text-sm text-[color:var(--stg-ink)]/75">
                {templatesCount
                  ? `${templatesCount} real HTML decks — open-design, reveal.js, impress.js, shower, dzslides.`
                  : 'The full shelf of real HTML decks — open-design, reveal.js, impress.js, shower, dzslides.'}
              </p>
            </button>
            <button
              onClick={() => startScratch()}
              className="group border-2 border-dashed border-[color:var(--stg-ink)]/50 bg-[color:var(--stg-cream)] p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)] hover:border-[color:var(--stg-ink)]"
            >
              <Sparkles className="h-6 w-6 text-[color:var(--stg-ink)]/60" aria-hidden />
              <p className="stg-display mt-3 text-2xl uppercase leading-none">From scratch</p>
              <p className="mt-2 text-sm text-[color:var(--stg-ink)]/70">
                No template — a standalone deck on reveal.js or plain HTML.
              </p>
            </button>
          </div>
        )
      )}

      {/* Brief ticket */}
      <div className="border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] p-4 shadow-[8px_8px_0_0_var(--stg-ink)] sm:p-6">
        <p className="stg-label text-[11px]">Brief</p>
        <Textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="e.g. “Kickoff deck for our warehouse automation pilot — goals, timeline, risks”"
          className="mt-3 min-h-28 resize-none border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] text-base text-[color:var(--stg-ink)] placeholder:text-[color:var(--stg-ink)]/50 focus-visible:ring-[color:var(--stg-ink)]"
          maxLength={1200}
          aria-label="Presentation brief"
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1.5">
            <span className="stg-label text-[9px] text-[color:var(--stg-ink)]/75">Audience</span>
            <Input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="investors, execs…"
              maxLength={120}
              className="border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)]"
            />
          </label>
          <div className="space-y-1.5">
            <span className="stg-label text-[9px] text-[color:var(--stg-ink)]/75">Tone</span>
            <Select value={tone} onValueChange={(v) => setTone(v as ToneId)}>
              <SelectTrigger className={TICKET_SELECT} aria-label="Tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={TICKET_CONTENT}>
                {TONE_OPTIONS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <span className="stg-label text-[9px] text-[color:var(--stg-ink)]/75">Density</span>
            <Select value={verbosity} onValueChange={(v) => setVerbosity(v as Verbosity)}>
              <SelectTrigger className={TICKET_SELECT} aria-label="Text density">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={TICKET_CONTENT}>
                {VERBOSITY_OPTIONS.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <span className="stg-label text-[9px] text-[color:var(--stg-ink)]/75">Slides: {slideCount}</span>
            <Slider
              value={[slideCount]}
              onValueChange={([v]) => setSlideCount(v)}
              min={4}
              max={30}
              step={1}
              aria-label="Number of slides"
            />
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            size="lg"
            onClick={() => generate()}
            disabled={!brief.trim()}
            className="stg-label h-12 flex-1 bg-[color:var(--stg-ink)] text-[13px] text-[color:var(--stg-yellow)] hover:bg-[color:var(--stg-ink-2)]"
          >
            <Hammer className="h-4 w-4" aria-hidden />
            {cta}
          </Button>
          <p className="stg-label text-center text-[10px] leading-relaxed text-[color:var(--stg-ink)]/75 sm:max-w-64 sm:text-left">
            {modeKind === 'scratch'
              ? 'The deck is built as a standalone HTML document — no template, no lock-in.'
              : 'AI writes your content into the template’s real HTML — every slide, speaker notes included.'}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Generating panel                                                    */
/* ------------------------------------------------------------------ */

function GeneratingPanel() {
  const statusMessage = useHtmlStore((s) => s.statusMessage);
  const slideProgress = useHtmlStore((s) => s.slideProgress);
  const outline = useHtmlStore((s) => s.outline);
  const reset = useHtmlStore((s) => s.reset);

  const total = slideProgress?.total || outline?.slides.length || 0;
  const current = slideProgress?.index ?? -1;
  const pct = total > 0 && current >= 0 ? Math.min(100, ((current + 1) / total) * 100) : 4;

  const statusFor = (i: number): 'done' | 'active' | 'pending' => {
    if (current < 0) return 'pending';
    if (i < current) return 'done';
    if (i === current) return 'active';
    return 'pending';
  };

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <header className="space-y-3">
        <h2 className="stg-display flex items-center gap-3 text-4xl uppercase">
          <Loader2 className="h-6 w-6 animate-spin text-[color:var(--stg-ink)]/60" aria-hidden />
          Building your deck…
        </h2>
        <Progress value={pct} className="h-2.5" aria-label="Generation progress" />
        <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/70" aria-live="polite">
          {statusMessage || 'Warming up…'}
          {slideProgress ? ` · slide ${current + 1}/${total}` : ''}
        </p>
      </header>

      {total > 0 && (
        <section aria-label="Slide status">
          <ol
            className="max-h-72 divide-y divide-[color:var(--stg-ink)]/10 overflow-y-auto border-2 border-[color:var(--stg-ink)]/25 bg-[color:var(--stg-cream)] pr-2
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[color:var(--stg-ink)]/25"
          >
            {(outline?.slides ?? []).map((item, i) => {
              const st = statusFor(i);
              return (
                <li key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span
                    aria-hidden
                    className={cn(
                      'inline-block h-2 w-2 shrink-0 rounded-full',
                      st === 'done'
                        ? 'bg-emerald-500'
                        : st === 'active'
                          ? 'bg-[color:var(--stg-yellow-deep)] motion-safe:animate-pulse'
                          : 'border border-[color:var(--stg-ink)]/30 bg-transparent',
                    )}
                  />
                  <span className="sr-only">{st === 'done' ? 'done' : st === 'active' ? 'writing' : 'queued'}</span>
                  <span className="w-6 shrink-0 text-right font-mono text-xs text-[color:var(--stg-ink)]/40" aria-hidden>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'truncate',
                      st === 'pending' ? 'text-[color:var(--stg-ink)]/45' : 'text-[color:var(--stg-ink)]',
                    )}
                  >
                    {item.title || 'Untitled slide'}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={reset}
        className="stg-label h-9 rounded-none border-2 border-[color:var(--stg-ink)] text-[10px]"
      >
        <X className="h-3.5 w-3.5" aria-hidden /> Cancel
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Error panel                                                         */
/* ------------------------------------------------------------------ */

function ErrorPanel() {
  const error = useHtmlStore((s) => s.error);
  const generate = useHtmlStore((s) => s.generate);
  const reset = useHtmlStore((s) => s.reset);

  return (
    <div className="mx-auto max-w-xl space-y-5 py-10 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-red-700" aria-hidden />
      <h2 className="stg-display text-3xl uppercase">Generation hit a snag</h2>
      <p className="text-sm leading-relaxed text-[color:var(--stg-ink)]/75">{error}</p>
      <div className="flex items-center justify-center gap-2">
        <Button
          onClick={() => generate()}
          className="stg-label h-11 bg-[color:var(--stg-ink)] px-6 text-[11px] text-[color:var(--stg-yellow)] hover:bg-[color:var(--stg-ink-2)]"
        >
          <Hammer className="h-4 w-4" aria-hidden /> Try again
        </Button>
        <Button
          variant="outline"
          onClick={reset}
          className="stg-label h-11 rounded-none border-2 border-[color:var(--stg-ink)] px-6 text-[11px]"
        >
          Start over
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Orchestrator                                                        */
/* ------------------------------------------------------------------ */

export function TemplateModeView() {
  const mode = useHtmlStore((s) => s.mode);
  const result = useHtmlStore((s) => s.result);
  const openPicker = useHtmlStore((s) => s.openPicker);

  return (
    <div className="bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        {mode === 'picking' && <TemplatePicker />}
        {mode === 'generating' && <GeneratingPanel />}
        {mode === 'done' && result && (
          <HtmlDeckViewer deckId={result.deckId} title={result.title} onBack={openPicker} />
        )}
        {mode === 'error' && <ErrorPanel />}
        {mode === 'idle' && <BriefStep />}
      </div>
    </div>
  );
}
