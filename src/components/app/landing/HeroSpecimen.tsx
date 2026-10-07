'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getTheme } from '@/lib/design/themes';
import { ScaledSlide } from '@/components/deck/ScaledSlide';
import type { Slide } from '@/lib/deck/types';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

/**
 * The Screen — landing hero specimen.
 * Not a screenshot, not a mock: every frame is a real slide rendered by the
 * same SlideView + theme-token pipeline the app ships, cycling through all
 * twenty-four design systems like a projector testing reels before the show.
 */

interface Specimen {
  themeId: string;
  label: string;
  fig: string;
  slide: Slide;
}

const SPECIMENS: Specimen[] = [
  {
    themeId: 'corporate-clean',
    label: 'Corporate Clean',
    fig: 'stats',
    slide: {
      id: 'spec-1',
      layout: 'stats',
      title: 'Q3 performance review',
      stats: [
        { value: '+24%', label: 'Revenue growth', context: 'vs. last quarter' },
        { value: '86', label: 'Net promoter score', context: 'top decile' },
        { value: '$4.2M', label: 'Cost savings', context: 'automation program' },
      ],
    },
  },
  {
    themeId: 'bold-impact',
    label: 'Bold Impact',
    fig: 'section',
    slide: { id: 'spec-2', layout: 'section', title: 'DESIGN IS NOT DECORATION' },
  },
  {
    themeId: 'tech-modern',
    label: 'Tech Modern',
    fig: 'chart',
    slide: {
      id: 'spec-3',
      layout: 'chart',
      title: 'Platform reliability',
      chart: {
        kind: 'column',
        data: [
          { label: 'Mon', value: 99.2 },
          { label: 'Tue', value: 98.7 },
          { label: 'Wed', value: 99.8 },
          { label: 'Thu', value: 99.9 },
        ],
        unit: '%',
        insight: 'Uptime held above 99% all week.',
      },
    },
  },
  {
    themeId: 'dark-elegant',
    label: 'Dark Elegant',
    fig: 'quote',
    slide: {
      id: 'spec-4',
      layout: 'quote',
      quote: 'Simplicity is the ultimate sophistication.',
      attribution: 'Leonardo da Vinci',
    },
  },
  {
    themeId: 'minimal-mono',
    label: 'Minimal Mono',
    fig: 'title',
    slide: { id: 'spec-5', layout: 'title', title: 'Ship less. Deliver more.', subtitle: 'PRODUCT PRINCIPLES — 2025' },
  },
  {
    themeId: 'editorial-serif',
    label: 'Editorial Serif',
    fig: 'bullets',
    slide: {
      id: 'spec-6',
      layout: 'bullets',
      title: 'The story of the printed word',
      bullets: ['Gutenberg, 1440: type meets press', 'Railways spread the daily paper', 'Radio steals the headlines'],
    },
  },
  {
    themeId: 'warm-earth',
    label: 'Warm Earth',
    fig: 'comparison',
    slide: {
      id: 'spec-7',
      layout: 'comparison',
      title: 'How we grow next year',
      comparison: {
        headers: ['This year', 'Next year'],
        rows: [
          { label: 'Materials', left: 'Recycled fabrics', right: 'Closed-loop fibers' },
          { label: 'Packaging', left: 'Plastic-free', right: 'Compostable' },
          { label: 'Supply chain', left: 'Audited', right: 'Regenerative' },
        ],
      },
    },
  },
  {
    themeId: 'playful-pop',
    label: 'Playful Pop',
    fig: 'bullets',
    slide: {
      id: 'spec-8',
      layout: 'bullets',
      title: 'What we will cover',
      bullets: ['Hands-on workshop goals', 'Three fun team challenges', 'Prizes & next steps'],
    },
  },
  // ---- theme-expansion reels (M-b) ----
  {
    themeId: 'eink-editorial',
    label: 'E-Ink Editorial',
    fig: 'quote',
    slide: {
      id: 'spec-9',
      layout: 'quote',
      quote: 'Type is a beautiful group of letters, not a group of beautiful letters.',
      attribution: 'Matthew Carter',
    },
  },
  {
    themeId: 'ivory-ledger',
    label: 'Ivory Ledger',
    fig: 'bullets',
    slide: {
      id: 'spec-10',
      layout: 'bullets',
      title: 'Research synthesis, week two',
      bullets: ['Twelve interviews, three themes', 'Pricing clarity tops the list', 'Onboarding leaks at step two'],
    },
  },
  {
    themeId: 'pitch-book-finance',
    label: 'Pitch Book',
    fig: 'stats',
    slide: {
      id: 'spec-11',
      layout: 'stats',
      title: 'Advisory snapshot',
      stats: [
        { value: '$1.2B', label: 'Mandates signed', context: 'fiscal year' },
        { value: '14', label: 'Live processes', context: 'across sectors' },
        { value: '3.2x', label: 'Median multiple', context: 'comparable set' },
      ],
    },
  },
  {
    themeId: 'signal-navy',
    label: 'Signal Navy',
    fig: 'section',
    slide: { id: 'spec-12', layout: 'section', title: 'THE MANDATE' },
  },
  {
    themeId: 'forest-grove',
    label: 'Forest Grove',
    fig: 'title',
    slide: { id: 'spec-13', layout: 'title', title: 'Rooted in good soil', subtitle: 'A FIELD REPORT' },
  },
  {
    themeId: 'cyber-terminal',
    label: 'Cyber Terminal',
    fig: 'chart',
    slide: {
      id: 'spec-14',
      layout: 'chart',
      title: 'Deploy velocity',
      chart: {
        kind: 'column',
        data: [
          { label: 'Mon', value: 42 },
          { label: 'Tue', value: 51 },
          { label: 'Wed', value: 48 },
          { label: 'Thu', value: 63 },
        ],
        unit: '',
        insight: 'Ship rate up 18% week over week.',
      },
    },
  },
  {
    themeId: 'biennale-yellow',
    label: 'Biennale Yellow',
    fig: 'title',
    slide: {
      id: 'spec-15',
      layout: 'title',
      title: 'Biennale of Moving Light',
      subtitle: 'EXHIBITION PROGRAMME — HALL 3',
    },
  },
  {
    themeId: 'paper-collage',
    label: 'Paper Collage',
    fig: 'bullets',
    slide: {
      id: 'spec-16',
      layout: 'bullets',
      title: 'Kickoff retro, sticky-wall edition',
      bullets: ['What clicked, and why', 'What stalled, without blame', 'Votes on the next experiment'],
    },
  },
  // ---- wave-2 reels (T-1) ----
  {
    themeId: 'tokyo-night',
    label: 'Tokyo Night',
    fig: 'chart',
    slide: {
      id: 'spec-17',
      layout: 'chart',
      title: 'Incident response time',
      chart: {
        kind: 'column',
        data: [
          { label: 'Q1', value: 41 },
          { label: 'Q2', value: 33 },
          { label: 'Q3', value: 26 },
          { label: 'Q4', value: 19 },
        ],
        unit: 'm',
        insight: 'Median response down 54% year over year.',
      },
    },
  },
  {
    themeId: 'pixel-orbit',
    label: 'Pixel Orbit',
    fig: 'section',
    slide: { id: 'spec-18', layout: 'section', title: 'PLAYER TWO HAS ENTERED' },
  },
  {
    themeId: 'vellum',
    label: 'Vellum',
    fig: 'quote',
    slide: {
      id: 'spec-19',
      layout: 'quote',
      quote: 'A gallery wall is a conversation, paused.',
      attribution: 'Exhibition notes',
    },
  },
  {
    themeId: 'retro-win95',
    label: 'Retro Win95',
    fig: 'bullets',
    slide: {
      id: 'spec-20',
      layout: 'bullets',
      title: 'System requirements',
      bullets: ['Runs on any machine, even yours', 'No installer, no reboot', 'One floppy disk of features'],
    },
  },
  {
    themeId: 'neo-brutalist',
    label: 'Neo Brutalist',
    fig: 'section',
    slide: { id: 'spec-21', layout: 'section', title: 'NO TEMPLATES. ONLY SYSTEMS.' },
  },
  {
    themeId: 'sakura-chroma',
    label: 'Sakura Chroma',
    fig: 'title',
    slide: {
      id: 'spec-22',
      layout: 'title',
      title: 'Spring print fair',
      subtitle: 'TWO COLORS, ONE PRESS, 500 COPIES',
    },
  },
  {
    themeId: 'cobalt-grid',
    label: 'Cobalt Grid',
    fig: 'stats',
    slide: {
      id: 'spec-23',
      layout: 'stats',
      title: 'Annual review',
      stats: [
        { value: '112%', label: 'Plan attainment', context: 'full-year target' },
        { value: '37', label: 'New accounts', context: 'net of churn' },
        { value: '0.8%', label: 'Error rate', context: 'down from 2.1%' },
      ],
    },
  },
  {
    themeId: 'pastel-card',
    label: 'Pastel Card',
    fig: 'bullets',
    slide: {
      id: 'spec-24',
      layout: 'bullets',
      title: 'A softer kind of update',
      bullets: ['New pastel panels shipped', 'Comments got kinder filters', 'Dark mode, gently tinted'],
    },
  },
];

const CYCLE_MS = 3400;

export function HeroSpecimen() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const hoverRef = useRef(false);

  const next = useCallback(() => setIndex((i) => (i + 1) % SPECIMENS.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + SPECIMENS.length) % SPECIMENS.length), []);

  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => {
      if (!hoverRef.current && !document.hidden) next();
    }, CYCLE_MS);
    return () => window.clearInterval(t);
  }, [playing, next]);

  const current = SPECIMENS[index];
  const theme = getTheme(current.themeId);

  return (
    <figure
      className="w-full"
      aria-label="Live samples of DeckForge design systems, rendered by the product itself"
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => (hoverRef.current = false)}
    >
      {/* Projection frame: flat ink, poster-yellow leader strip, no glass */}
      <div className="border-2 border-[color:var(--stg-gray)]/40 bg-[color:var(--stg-ink-2)] shadow-[0_0_0_1px_rgba(0,0,0,0.6),10px_10px_0_0_rgba(0,0,0,0.45)]">
        {/* Leader strip: reel marker + live cue */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-[color:var(--stg-ink)] px-3 py-2">
          <span className="stg-label bg-[color:var(--stg-yellow)] px-1.5 py-0.5 text-[9px] text-[color:var(--stg-ink)]">
            Live
          </span>
          <span className="stg-label text-[9px] text-white/50">
            The screen · real render · 1280×720
          </span>
          <span className="ml-auto flex items-center gap-1.5" aria-hidden>
            <span className={cn('h-1.5 w-1.5 rounded-full', playing ? 'bg-[color:var(--stg-yellow)]' : 'bg-white/25')} />
            <span className="stg-label text-[9px] text-white/40">{playing ? 'Rolling' : 'Paused'}</span>
          </span>
        </div>

        <div className="relative overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
          {SPECIMENS.map((spec, i) => {
            const active = i === index;
            return (
              <div
                key={spec.slide.id}
                className={cn(
                  'absolute inset-0 transition-opacity duration-700 ease-out',
                  active ? 'opacity-100 z-10' : 'opacity-0 z-0',
                )}
                aria-hidden={!active || undefined}
              >
                <ScaledSlide slide={spec.slide} theme={getTheme(spec.themeId)} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Caption row: reel counter + theme + transport */}
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="stg-display text-lg leading-none text-[color:var(--stg-yellow)]">
          REEL {String(index + 1).padStart(2, '0')}
          <span className="text-white/40">/{String(SPECIMENS.length).padStart(2, '0')}</span>
        </span>
        <span className="stg-label text-[10px] text-white">{theme.name}</span>
        <span className="stg-label hidden text-[10px] text-white/40 sm:inline">{current.fig} layout</span>

        <span className="ml-auto flex items-center gap-1.5" role="group" aria-label="Specimen controls">
          {/* theme dots */}
          <span className="mr-1 flex items-center gap-1">
            {SPECIMENS.map((s, i) => (
              <button
                key={s.themeId}
                onClick={() => setIndex(i)}
                aria-label={`Show ${s.label} sample`}
                aria-current={i === index}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-yellow)]',
                  i === index ? 'w-5 bg-[color:var(--stg-yellow)]' : 'w-1.5 bg-white/25 hover:bg-white/60',
                )}
              />
            ))}
          </span>
          <button
            onClick={prev}
            aria-label="Previous sample"
            className="grid h-7 w-7 place-items-center border border-white/20 text-white/70 transition-colors hover:border-[color:var(--stg-yellow)] hover:text-[color:var(--stg-yellow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-yellow)]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause cycling' : 'Play cycling'}
            className="grid h-7 w-7 place-items-center border border-white/20 text-white/70 transition-colors hover:border-[color:var(--stg-yellow)] hover:text-[color:var(--stg-yellow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-yellow)]"
          >
            {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
          <button
            onClick={next}
            aria-label="Next sample"
            className="grid h-7 w-7 place-items-center border border-white/20 text-white/70 transition-colors hover:border-[color:var(--stg-yellow)] hover:text-[color:var(--stg-yellow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-yellow)]"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </span>
      </figcaption>
    </figure>
  );
}
