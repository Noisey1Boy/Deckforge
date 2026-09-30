'use client';

import { THEMES } from '@/lib/design/themes';
import type { Slide } from '@/lib/deck/types';
import { ScaledSlide } from '@/components/deck/ScaledSlide';
import { useAppStore } from '@/lib/store/deck-store';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { getTheme } from '@/lib/design/themes';

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
};

export function TemplateGallery({ compact = false }: { compact?: boolean }) {
  const themeChoice = useAppStore((s) => s.themeChoice);
  const setThemeChoice = useAppStore((s) => s.setThemeChoice);

  const items = [{ id: 'auto', name: 'Auto', tone: 'ai', description: 'Let the AI pick the best match for your topic and tone.', bestFor: [] as string[] }, ...THEMES.map((t) => ({ id: t.id, name: t.name, tone: t.tone, description: t.description, bestFor: t.bestFor, manifest: t }))];

  return (
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
        const theme = item.id === 'auto' ? getTheme('minimal-mono') : (item as { manifest: typeof THEMES[number] }).manifest;
        const sample = SAMPLES[theme.tone] ?? SAMPLES.minimal;
        return (
          <button
            key={item.id}
            role="radio"
            aria-checked={selected}
            onClick={() => setThemeChoice(item.id)}
            className={cn(
              'group text-left rounded-xl border-2 p-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900',
              selected
                ? 'border-neutral-900 shadow-lg shadow-neutral-900/10'
                : 'border-transparent hover:border-neutral-300 bg-card'
            )}
          >
            <div className="rounded-lg overflow-hidden border border-neutral-200 shadow-sm">
              <ScaledSlide slide={sample} theme={theme} index={0} pageCount={12} showFooter />
            </div>
            <div className="flex items-start justify-between gap-2 pt-2 px-1">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {item.id === 'auto' && <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                  <span className="font-semibold text-sm truncate">{item.name}</span>
                </div>
                {!compact && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
                )}
              </div>
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide shrink-0 mt-0.5">
                {item.tone}
              </Badge>
            </div>
          </button>
        );
      })}
    </div>
  );
}
