import type { LayoutId, Slide } from './types';

/**
 * Per-layout content budgets. The AI is instructed to respect these; the
 * renderer additionally auto-shrinks when content exceeds them, so text
 * never overflows the 1280x720 canvas.
 */
export interface LayoutBudget {
  title: number;
  subtitle: number;
  body: number;
  bullets: { maxCount: number; maxChars: number };
  maxCharsTotal: number;
  /** Friendly description for prompts + UI. */
  describe: string;
}

export const LAYOUT_BUDGETS: Record<LayoutId, LayoutBudget> = {
  title: {
    title: 60,
    subtitle: 110,
    body: 0,
    bullets: { maxCount: 0, maxChars: 0 },
    maxCharsTotal: 180,
    describe: 'Cover slide: one display headline + short subtitle',
  },
  section: {
    title: 52,
    subtitle: 90,
    body: 0,
    bullets: { maxCount: 0, maxChars: 0 },
    maxCharsTotal: 150,
    describe: 'Section divider: big section name + optional kicker',
  },
  bullets: {
    title: 70,
    subtitle: 0,
    body: 160,
    bullets: { maxCount: 6, maxChars: 90 },
    maxCharsTotal: 700,
    describe: 'Headline + up to 6 bullets (<=90 chars each) + optional lead-in',
  },
  'two-column': {
    title: 70,
    subtitle: 0,
    body: 0,
    bullets: { maxCount: 8, maxChars: 80 },
    maxCharsTotal: 700,
    describe: 'Headline + two labeled columns of up to 4 short items each',
  },
  image: {
    title: 70,
    subtitle: 60,
    body: 140,
    bullets: { maxCount: 0, maxChars: 0 },
    maxCharsTotal: 280,
    describe: 'Full-bleed visual with headline + short caption',
  },
  quote: {
    title: 0,
    subtitle: 0,
    body: 0,
    bullets: { maxCount: 0, maxChars: 0 },
    maxCharsTotal: 320,
    describe: 'Pull-quote (<=220 chars) + attribution',
  },
  stats: {
    title: 70,
    subtitle: 0,
    body: 120,
    bullets: { maxCount: 0, maxChars: 0 },
    maxCharsTotal: 450,
    describe: 'Headline + 2-4 big KPI numbers with labels',
  },
  chart: {
    title: 70,
    subtitle: 0,
    body: 0,
    bullets: { maxCount: 0, maxChars: 0 },
    maxCharsTotal: 300,
    describe: 'Headline + one chart (<=8 categories) + one-line insight',
  },
  diagram: {
    title: 70,
    subtitle: 0,
    body: 0,
    bullets: { maxCount: 0, maxChars: 0 },
    maxCharsTotal: 450,
    describe: 'Headline + flow diagram (3-6 nodes, labeled arrows)',
  },
  comparison: {
    title: 70,
    subtitle: 0,
    body: 0,
    bullets: { maxCount: 0, maxChars: 0 },
    maxCharsTotal: 700,
    describe: 'Headline + two-column comparison table (3-5 rows)',
  },
  closing: {
    title: 55,
    subtitle: 120,
    body: 0,
    bullets: { maxCount: 3, maxChars: 70 },
    maxCharsTotal: 260,
    describe: 'Closing: memorable call-to-action + contact/next steps',
  },
};

/** Approximate rendered content volume, used to auto-shrink text. */
export function contentVolume(slide: Slide): number {
  let v = 0;
  if (slide.title) v += slide.title.length * 0.9; // headlines are big
  if (slide.subtitle) v += slide.subtitle.length * 0.55;
  if (slide.body) v += slide.body.length;
  for (const b of slide.bullets ?? []) v += b.length;
  for (const c of slide.leftContent ?? []) v += c.length;
  for (const c of slide.rightContent ?? []) v += c.length;
  if (slide.quote) v += slide.quote.length * 0.8;
  if (slide.chart) v += (slide.chart.data?.length ?? 0) * 14;
  if (slide.diagram) v += slide.diagram.nodes.length * 16;
  if (slide.comparison) v += slide.comparison.rows.length * 34;
  return v;
}

/**
 * Font shrink factor for a slide (1 = 100%). Steps keep typography on an
 * even rhythm instead of per-pixel scaling.
 */
export function fitFactor(slide: Slide): number {
  const budget = LAYOUT_BUDGETS[slide.layout];
  const vol = contentVolume(slide);
  const limit = Math.max(budget.maxCharsTotal, 200);
  const ratio = vol / limit;
  if (ratio <= 0.85) return 1;
  if (ratio <= 1.15) return 0.9;
  if (ratio <= 1.5) return 0.8;
  if (ratio <= 2) return 0.7;
  return 0.62;
}

/** Clamp helper the editor uses when users type manually. */
export function clampToBudget(text: string, max: number): string {
  if (!max || text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}
