'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { SiteHeader } from '@/components/app/SiteHeader';
import { SiteFooter } from '@/components/app/SiteFooter';
import { HeroSpecimen } from '@/components/app/landing/HeroSpecimen';
import { useMotionPreference } from '@/components/app/settings/useMotionPreference';
import { Hammer, Layers, ListTree, MonitorPlay, Palette, PenLine, Play } from 'lucide-react';

/**
 * LandingPage — the public marketing page (route '/').
 * Carries over the old hero voice verbatim, plus the new "TWO WAYS TO FORGE
 * A DECK" explainer (Studio vs Template Studio), the 3-step method strip and
 * the stats row. Entrance animations respect both prefers-reduced-motion and
 * the in-app "Reduce motion" preference (Settings → Preferences).
 */

const TICKER_ITEMS = [
  '24 DESIGN SYSTEMS',
  '57 HTML TEMPLATES',
  '11 SLIDE LAYOUTS',
  'CHARTS FROM YOUR OWN DATA',
  'EDITABLE PPTX',
  'PRINT-READY PDF',
  'STANDALONE HTML',
  'OUTLINE FIRST',
  'NO INVENTED NUMBERS',
];

const METHOD_STEPS = [
  {
    n: '01',
    icon: PenLine,
    title: 'Brief',
    body: 'One sentence is enough. Audience, tone and length are optional dials — the brief stays yours.',
  },
  {
    n: '02',
    icon: ListTree,
    title: 'Outline',
    body: 'The story is drafted first. You read it, edit it, reorder it. Only then does a single slide exist.',
  },
  {
    n: '03',
    icon: Palette,
    title: 'Design',
    body: 'Slides are rendered live from design tokens, with charts computed from your real numbers.',
  },
];

const STATS = [
  { value: '24', label: 'Design systems' },
  { value: '57', label: 'HTML templates' },
  { value: '6', label: 'Export formats' },
];

export function LandingPage() {
  const osReduced = useReducedMotion();
  const [prefersReduced] = useMotionPreference();
  const reduceMotion = Boolean(osReduced) || prefersReduced;

  const enter = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--stg-cream)]">
      <SiteHeader showCreateCta />

      <main className="flex flex-1 flex-col">
        {/* ================================================================
            HERO — the stage. Ink, poster yellow, and the screen.
           ================================================================ */}
        <section className="relative overflow-hidden bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)]">
          <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
            <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
              {/* Copy */}
              <motion.div {...enter(0)} className="space-y-7 lg:col-span-6">
                <p className="stg-label flex items-center gap-3 text-[color:var(--stg-yellow)]">
                  <span className="inline-block h-2 w-2 bg-[color:var(--stg-yellow)]" aria-hidden />
                  DeckForge AI · A presentation foundry
                </p>
                <h1 className="stg-display text-[clamp(3.1rem,7vw,5.9rem)] uppercase leading-[0.93]">
                  <span className="block">The lights go down.</span>
                  <span className="block text-[color:var(--stg-yellow)]">Your story holds the room.</span>
                </h1>
                <p className="max-w-[62ch] text-base leading-relaxed text-[color:var(--stg-gray)] sm:text-lg">
                  Give DeckForge one sentence, or hand it your spreadsheet. It drafts the
                  outline, you approve the story, and every slide is designed against a real
                  design system — or a real HTML template — with charts built from your actual
                  numbers.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    href="/create"
                    className="stg-label inline-flex h-12 items-center gap-2 bg-[color:var(--stg-yellow)] px-6 text-[color:var(--stg-ink)] transition-colors hover:bg-[color:var(--stg-yellow-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-ink)]"
                  >
                    <Hammer className="h-4 w-4" aria-hidden />
                    Start creating
                  </Link>
                  <Link
                    href="/signup"
                    className="stg-label inline-flex h-12 items-center border-2 border-white/25 px-6 text-[color:var(--stg-cream)] transition-colors hover:border-[color:var(--stg-yellow)] hover:text-[color:var(--stg-yellow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-ink)]"
                  >
                    Sign up — it&apos;s free
                  </Link>
                  <Link
                    href="/pitch"
                    className="stg-label inline-flex h-12 items-center gap-2 border-2 border-white/25 px-6 text-[color:var(--stg-cream)] transition-colors hover:border-[color:var(--stg-yellow)] hover:text-[color:var(--stg-yellow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-ink)]"
                  >
                    <Play className="h-4 w-4" aria-hidden />
                    Watch the 4-min pitch
                  </Link>
                  <Link
                    href="/login"
                    className="stg-label inline-flex h-12 items-center px-2 text-[10px] text-white/60 transition-colors hover:text-[color:var(--stg-cream)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-ink)]"
                  >
                    I already have an account
                  </Link>
                </div>
                <p className="stg-label pb-1 pt-1 text-[10px] text-white/40">
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
                <div key={copy} className="flex items-center">
                  {TICKER_ITEMS.map((item) => (
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
            TWO WAYS TO FORGE A DECK — the mode explainer
           ================================================================ */}
        <section id="ways" className="scroll-mt-16 bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
            <motion.div {...enter(0)} className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="stg-label flex items-center gap-2.5 text-[color:var(--stg-ink)]/60">
                  <span className="inline-block h-2 w-2 bg-[color:var(--stg-yellow)]" aria-hidden />
                  Two modes
                </p>
                <h2 className="stg-display mt-3 text-4xl uppercase leading-[0.95] sm:text-5xl">
                  Two ways to forge a deck.
                </h2>
              </div>
              <p className="max-w-xs pb-1 text-sm leading-relaxed text-[color:var(--stg-ink)]/70">
                Same prompt, two forges: a token-rendered structured deck, or a real HTML
                template filled with your words.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {/* Card A — Studio */}
              <motion.article
                {...enter(0.06)}
                className="flex flex-col border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] p-6 shadow-[6px_6px_0_0_var(--stg-ink)] sm:p-8"
                aria-labelledby="ways-studio"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="stg-label bg-[color:var(--stg-ink)] px-2 py-1 text-[9px] text-[color:var(--stg-yellow)]">
                    A · Mode one
                  </span>
                  <Layers className="h-6 w-6 text-[color:var(--stg-ink)]" aria-hidden />
                </div>
                <h3 id="ways-studio" className="stg-display mt-5 text-3xl uppercase leading-none sm:text-4xl">
                  Studio — structured decks
                </h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-[color:var(--stg-ink)]/75 sm:text-base">
                  AI drafts a structured outline first. You approve or rewrite it, then every
                  slide is token-rendered against curated design systems — charts built from
                  your real numbers. Full per-slide editing, present mode, native editable
                  PPTX + PDF export.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href="/create"
                    className="stg-label inline-flex h-11 items-center gap-2 bg-[color:var(--stg-yellow)] px-5 text-[color:var(--stg-ink)] transition-colors hover:bg-[color:var(--stg-yellow-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-cream)]"
                  >
                    Open the studio
                  </Link>
                  <span className="stg-label text-[9px] text-[color:var(--stg-ink)]/50">
                    24 systems · editable PPTX + PDF
                  </span>
                </div>
              </motion.article>

              {/* Card B — Template Studio */}
              <motion.article
                {...enter(0.12)}
                className="flex flex-col border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] p-6 text-[color:var(--stg-cream)] shadow-[6px_6px_0_0_var(--stg-yellow-deep)] sm:p-8"
                aria-labelledby="ways-template"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="stg-label bg-[color:var(--stg-yellow)] px-2 py-1 text-[9px] text-[color:var(--stg-ink)]">
                    B · Mode two
                  </span>
                  <MonitorPlay className="h-6 w-6 text-[color:var(--stg-yellow)]" aria-hidden />
                </div>
                <h3 id="ways-template" className="stg-display mt-5 text-3xl uppercase leading-none sm:text-4xl">
                  Template studio — HTML decks
                </h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-white/70 sm:text-base">
                  Pick a real HTML presentation template (open-design, reveal.js, impress.js,
                  shower, dzslides) or start from scratch. AI fills its layouts with your
                  brief and hands you a standalone .html deck you can open anywhere, present
                  fullscreen, and snapshot to PNG.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href="/create?tab=template"
                    className="stg-label inline-flex h-11 items-center gap-2 bg-[color:var(--stg-yellow)] px-5 text-[color:var(--stg-ink)] transition-colors hover:bg-[color:var(--stg-yellow-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-ink)]"
                  >
                    Browse templates
                  </Link>
                  <span className="stg-label text-[9px] text-white/50">
                    57 templates · 5 frameworks · from scratch
                  </span>
                </div>
              </motion.article>
            </div>
          </div>
        </section>

        {/* ================================================================
            METHOD — 3 poster rows
           ================================================================ */}
        <section id="method" className="scroll-mt-16 bg-[color:var(--stg-cream-2)] text-[color:var(--stg-ink)]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
            <motion.div {...enter(0)} className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="stg-label flex items-center gap-2.5 text-[color:var(--stg-ink)]/60">
                  <span className="inline-block h-2 w-2 bg-[color:var(--stg-yellow)]" aria-hidden />
                  The method
                </p>
                <h2 className="stg-display mt-3 text-4xl uppercase leading-[0.95] sm:text-5xl">
                  Three steps, in order, every time.
                </h2>
              </div>
              <p className="max-w-xs pb-1 text-sm leading-relaxed text-[color:var(--stg-ink)]/70">
                Nothing is generated past a step you haven&apos;t approved.
              </p>
            </motion.div>

            <motion.ol {...enter(0.08)} className="mt-10">
              {METHOD_STEPS.map((step, i) => (
                <li
                  key={step.n}
                  className="stg-num-fill grid grid-cols-[auto_1fr] items-start gap-5 border-t-2 border-[color:var(--stg-ink)] py-7 last:border-b-2 sm:gap-10 sm:py-9"
                >
                  <span className="stg-num select-none pt-1 text-6xl sm:text-8xl" aria-hidden>
                    {step.n}
                  </span>
                  <div className="pt-1.5">
                    <h3 className="stg-display flex items-center gap-3 text-2xl uppercase sm:text-3xl">
                      <step.icon className="h-5 w-5 shrink-0 text-[color:var(--stg-ink)]/60" aria-hidden />
                      {step.title}
                      {i < METHOD_STEPS.length - 1 && (
                        <span className="stg-label hidden text-[9px] text-[color:var(--stg-ink)]/40 sm:inline" aria-hidden>
                          →
                        </span>
                      )}
                    </h3>
                    <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-[color:var(--stg-ink)]/75 sm:text-base">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </motion.ol>
          </div>
        </section>

        {/* ================================================================
            STATS — the numbers behind the foundry
           ================================================================ */}
        <section className="bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)]" aria-label="DeckForge in numbers">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
            <motion.div {...enter(0)} className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {STATS.map((s) => (
                <div key={s.label} className="border-l-2 border-[color:var(--stg-yellow)] pl-4 sm:pl-6">
                  <p className="stg-display text-6xl leading-none text-[color:var(--stg-yellow)] sm:text-7xl">
                    {s.value}
                  </p>
                  <p className="stg-label mt-3 text-[10px] text-white/60">{s.label}</p>
                </div>
              ))}
            </motion.div>
            <motion.p {...enter(0.1)} className="stg-label mt-10 text-center text-[10px] text-white/40">
              24 systems · 57 templates · 6 export formats — one foundry
            </motion.p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
