'use client';

import { useMemo, useState } from 'react';
import { THEMES } from '@/lib/design/themes';
import type { Slide, ThemeManifest } from '@/lib/deck/types';
import { ScaledSlide } from '@/components/deck/ScaledSlide';
import { useAppStore } from '@/lib/store/deck-store';
import { cn } from '@/lib/utils';
import { Search, Sparkles } from 'lucide-react';
import { getTheme } from '@/lib/design/themes';
import { Input } from '@/components/ui/input';

/** One representative sample slide per tone so previews feel real. */
const SAMPLES: Record<string, Slide> = {
  corporate: {
    id: 'sample', layout: 'stats', title: 'Q3 Performance Review',
    stats: [{ value: '+24%', label: 'Revenue growth', context: 'vs. last quarter' },
      { value: '86', label: 'Net promoter score', context: 'top decile' },
      { value: '$4.2M', label: 'Cost savings', context: 'automation program' }],
  },
  minimal: {
    id: 'sample', layout: 'title', title: 'Ship less. Deliver more.', subtitle: 'PRODUCT PRINCIPLES 2025',
  },
  bold: {
    id: 'sample', layout: 'section', title: 'THE FUTURE IS LOUD',
  },
  playful: {
    id: 'sample', layout: 'bullets', title: 'What we will cover',
    bullets: ['Hands-on workshop goals', 'Three fun team challenges', 'Prizes & next steps'],
  },
  dark: {
    id: 'sample', layout: 'quote', quote: 'Simplicity is the ultimate sophistication.', attribution: ' Leonardo da Vinci',
  },
  editorial: {
    id: 'sample', layout: 'bullets', title: 'The story of the printed word',
    bullets: ['Gutenberg, 1440: type meets press', 'Railways spread the daily paper', 'Radio steals the headlines'],
  },
  tech: {
    id: 'sample', layout: 'chart',
    title: 'Platform reliability',
    chart: { kind: 'column', data: [{ label: 'Mon', value: 99.2 }, { label: 'Tue', value: 98.7 }, { label: 'Wed', value: 99.8 }, { label: 'Thu', value: 99.9 }], unit: '%', insight: 'Uptime held above 99% all week.' },
  },
  warm: {
    id: 'sample', layout: 'title', title: 'Growing together, sustainably', subtitle: 'IMPACT REPORT',
  },
  // ---- theme-expansion tones (M-b) ----
  eink: {
    id: 'sample', layout: 'quote', quote: 'Print is a slow medium. That is the point.', attribution: 'The editor',
  },
  ledger: {
    id: 'sample', layout: 'bullets', title: 'What we heard',
    bullets: ['Twelve interviews, three themes', 'Pricing clarity tops the list', 'Onboarding leaks at step two'],
  },
  finance: {
    id: 'sample', layout: 'stats', title: 'Advisory Snapshot',
    stats: [{ value: '$1.2B', label: 'Mandates signed', context: 'fiscal year' },
      { value: '14', label: 'Live processes', context: 'across sectors' },
      { value: '3.2x', label: 'Median multiple', context: 'comparable set' }],
  },
  institutional: {
    id: 'sample', layout: 'section', title: 'THE MANDATE',
  },
  grove: {
    id: 'sample', layout: 'title', title: 'Rooted in good soil', subtitle: 'A FIELD REPORT',
  },
  terminal: {
    id: 'sample', layout: 'chart',
    title: 'Deploy velocity',
    chart: { kind: 'column', data: [{ label: 'Mon', value: 42 }, { label: 'Tue', value: 51 }, { label: 'Wed', value: 48 }, { label: 'Thu', value: 63 }], unit: '', insight: 'Ship rate up 18% week over week.' },
  },
  biennale: {
    id: 'sample', layout: 'title', title: 'Biennale of Moving Light', subtitle: 'EXHIBITION PROGRAMME',
  },
  collage: {
    id: 'sample', layout: 'bullets', title: 'Kickoff retro, sticky-wall edition',
    bullets: ['What clicked, and why', 'What stalled, without blame', 'Votes on the next experiment'],
  },
  // ---- wave-2 tones (T-1) ----
  nocturne: {
    id: 'sample', layout: 'chart',
    title: 'Incident response time',
    chart: { kind: 'column', data: [{ label: 'Q1', value: 41 }, { label: 'Q2', value: 33 }, { label: 'Q3', value: 26 }, { label: 'Q4', value: 19 }], unit: 'm', insight: 'Median response down 54% year over year.' },
  },
  arcade: {
    id: 'sample', layout: 'section', title: 'PLAYER TWO HAS ENTERED',
  },
  vellum: {
    id: 'sample', layout: 'quote', quote: 'A gallery wall is a conversation, paused.', attribution: 'Exhibition notes',
  },
  retro: {
    id: 'sample', layout: 'bullets', title: 'System requirements',
    bullets: ['Runs on any machine, even yours', 'No installer, no reboot', 'One floppy disk of features'],
  },
  brutalist: {
    id: 'sample', layout: 'section', title: 'NO TEMPLATES. ONLY SYSTEMS.',
  },
  riso: {
    id: 'sample', layout: 'title', title: 'Spring print fair', subtitle: 'TWO COLORS, ONE PRESS, 500 COPIES',
  },
  cobalt: {
    id: 'sample', layout: 'stats', title: 'Annual Review',
    stats: [{ value: '112%', label: 'Plan attainment', context: 'full-year target' },
      { value: '37', label: 'New accounts', context: 'net of churn' },
      { value: '0.8%', label: 'Error rate', context: 'down from 2.1%' }],
  },
  pastel: {
    id: 'sample', layout: 'bullets', title: 'A softer kind of update',
    bullets: ['New pastel panels shipped', 'Comments got kinder filters', 'Dark mode, gently tinted'],
  },
};

/** Style group per theme id — drives the filter chips (one group each). */
const THEME_GROUPS: Record<string, string> = {
  'corporate-clean': 'light',
  'minimal-mono': 'light',
  'pitch-book-finance': 'light',
  'cobalt-grid': 'light',
  'bold-impact': 'dark',
  'dark-elegant': 'dark',
  'signal-navy': 'dark',
  'forest-grove': 'dark',
  'tokyo-night': 'dark',
  'pixel-orbit': 'dark',
  'vellum': 'dark',
  'tech-modern': 'tech',
  'cyber-terminal': 'tech',
  'retro-win95': 'tech',
  'editorial-serif': 'editorial',
  'eink-editorial': 'editorial',
  'ivory-ledger': 'editorial',
  'warm-earth': 'warm',
  'biennale-yellow': 'warm',
  'sakura-chroma': 'warm',
  'playful-pop': 'playful',
  'paper-collage': 'playful',
  'neo-brutalist': 'playful',
  'pastel-card': 'playful',
};

const GROUP_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'warm', label: 'Warm' },
  { id: 'playful', label: 'Playful' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'tech', label: 'Tech' },
] as const;

interface GalleryItem {
  id: string;
  name: string;
  tone: string;
  description: string;
  bestFor: string[];
  manifest?: ThemeManifest;
}

const AUTO_ITEM: GalleryItem = {
  id: 'auto',
  name: 'Auto',
  tone: 'ai',
  description: 'Let the AI pick the best match for your topic and tone.',
  bestFor: [],
};

export function TemplateGallery({ compact = false }: { compact?: boolean }) {
  const themeChoice = useAppStore((s) => s.themeChoice);
  const setThemeChoice = useAppStore((s) => s.setThemeChoice);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string>('all');

  const items: GalleryItem[] = useMemo(() => {
    const themeItems: GalleryItem[] = THEMES.map((t) => ({
      id: t.id, name: t.name, tone: t.tone, description: t.description, bestFor: t.bestFor, manifest: t,
    }));
    const q = query.trim().toLowerCase();
    const filtering = q.length > 0 || group !== 'all';
    if (!filtering) return [AUTO_ITEM, ...themeItems];
    const matched = themeItems.filter((it) => {
      if (group !== 'all' && THEME_GROUPS[it.id] !== group) return false;
      if (!q) return true;
      const hay = [it.name, it.tone, it.id, it.description, it.bestFor.join(' ')].join(' ').toLowerCase();
      return hay.includes(q);
    });
    // Auto stays first whenever there is anything to show; empty state when none.
    return matched.length > 0 ? [AUTO_ITEM, ...matched] : [];
  }, [query, group]);

  const filtering = query.trim().length > 0 || group !== 'all';
  const matchedCount = Math.max(items.length - (items.length > 0 ? 1 : 0), 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Search + style filters — ink borders, paper chips, amber stays on Auto */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="relative lg:max-w-xs lg:flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search systems, tones, best for..."
            aria-label="Search design systems"
            className="h-9 rounded-full border-neutral-300 bg-white pl-9 pr-4 text-sm focus-visible:ring-neutral-900"
          />
        </div>
        <div role="group" aria-label="Filter design systems by style" className="flex flex-wrap items-center gap-1.5">
          {GROUP_FILTERS.map((f) => {
            const active = group === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => setGroup(f.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-1',
                  active
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-500 hover:text-neutral-900'
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        {filtering && (
          <p className="text-xs text-muted-foreground lg:ml-auto" role="status" aria-live="polite">
            {matchedCount} of {THEMES.length} systems
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-neutral-300 bg-card px-6 py-10 text-center">
          <p className="text-sm font-semibold text-neutral-900">No design systems match</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try another word, or clear the filters to see all {THEMES.length} systems.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setGroup('all');
            }}
            className={cn(
              'mt-3 rounded-full border border-neutral-900 px-4 py-1.5 text-xs font-semibold text-neutral-900 transition-colors',
              'hover:bg-neutral-900 hover:text-white',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-1'
            )}
          >
            Clear search & filters
          </button>
        </div>
      ) : (
        <div
          className={cn(
            'grid gap-4',
            compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          )}
          role="radiogroup"
          aria-label="Design system"
        >
          {items.map((item) => {
            const selected = themeChoice === item.id;
            const theme = item.id === 'auto' ? getTheme('minimal-mono') : (item.manifest as ThemeManifest);
            const sample = SAMPLES[theme.tone] ?? SAMPLES.minimal;
            const accent = item.id === 'auto' ? '#f59e0b' : theme.tokens.colors.primary;
            return (
              <button
                key={item.id}
                role="radio"
                aria-checked={selected}
                onClick={() => setThemeChoice(item.id)}
                style={selected ? { borderColor: accent } : undefined}
                className={cn(
                  'group text-left rounded-xl border-2 p-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900 hover:-translate-y-0.5',
                  selected
                    ? 'shadow-lg shadow-neutral-900/10'
                    : 'border-transparent hover:border-neutral-300 hover:shadow-md bg-card'
                )}
              >
                <div className="relative rounded-lg overflow-hidden border border-neutral-200 shadow-sm">
                  <ScaledSlide slide={sample} theme={theme} index={0} pageCount={12} showFooter />
                  <span
                    className="absolute top-1.5 right-1.5 rounded-full bg-black/65 text-white text-[9px] uppercase tracking-wider px-2 py-0.5 font-semibold backdrop-blur-sm"
                    aria-hidden
                  >
                    {item.tone}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2 pt-2 px-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.id === 'auto' && <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                      <span className="font-semibold text-sm leading-snug" title={item.name}>{item.name}</span>
                    </div>
                    {!compact && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
