/**
 * Core data models for DeckForge AI.
 * A Deck is composed of Slides; each Slide declares one layout from a fixed
 * set, and every visual aspect is driven by ThemeTokens (no hardcoded styles
 * inside slide components).
 */

// ---------------------------------------------------------------------------
// Slide layouts (fixed set — one React component per layout)
// ---------------------------------------------------------------------------
export const LAYOUT_IDS = [
  'title',
  'section',
  'bullets',
  'two-column',
  'image',
  'quote',
  'stats',
  'chart',
  'diagram',
  'comparison',
  'closing',
] as const;

export type LayoutId = (typeof LAYOUT_IDS)[number];

// ---------------------------------------------------------------------------
// Slide payload
// ---------------------------------------------------------------------------
export interface StatItem {
  label: string;
  value: string;
  context?: string;
}

export type ChartKind = 'bar' | 'column' | 'line' | 'area' | 'pie' | 'donut';

export interface ChartSpec {
  kind: ChartKind;
  /** Simple series: one value per category. */
  data: Array<{ label: string; value: number }>;
  /** Optional multi-series (line/area/column only). */
  series?: Array<{ name: string; points: number[] }>;
  /** Unit suffix, e.g. "%", "M USD". */
  unit?: string;
  /** One-line takeaway rendered as annotation. */
  insight?: string;
  source?: string;
}

export interface DiagramSpec {
  direction?: 'lr' | 'tb';
  nodes: Array<{ id: string; label: string; shape?: 'box' | 'pill' | 'diamond' }>;
  edges: Array<{ from: string; to: string; label?: string }>;
}

export interface ComparisonSpec {
  headers: [string, string];
  rows: Array<{ label: string; left: string; right: string }>;
}

export interface ImageSpec {
  url: string;
  alt: string;
  credit?: string;
}

/**
 * Per-slide transition override. "inherit" (default) follows the theme's
 * motion style; "none" cuts instantly; the rest force a specific transition.
 */
export const TRANSITIONS = ['inherit', 'none', 'fade', 'rise', 'zoom', 'slide'] as const;
export type TransitionKind = (typeof TRANSITIONS)[number];

export interface Slide {
  id: string;
  layout: LayoutId;
  title?: string;
  subtitle?: string;
  /** Short supporting paragraph. */
  body?: string;
  bullets?: string[];
  /** How this slide enters in present mode (defaults to the theme's motion). */
  transition?: TransitionKind;
  // two-column
  leftTitle?: string;
  leftContent?: string[];
  rightTitle?: string;
  rightContent?: string[];
  // quote
  quote?: string;
  attribution?: string;
  // stats
  stats?: StatItem[];
  chart?: ChartSpec;
  diagram?: DiagramSpec;
  comparison?: ComparisonSpec;
  image?: ImageSpec;
  notes?: string;
  /** Hidden slides stay editable but are skipped in present mode and exports. */
  hidden?: boolean;
}

// ---------------------------------------------------------------------------
// Deck
// ---------------------------------------------------------------------------
export interface DeckMeta {
  audience?: string;
  tone?: string;
  language?: string;
  sourcePrompt?: string;
  generatedAt?: string;
  /** Optional accent color (hex) layered over the theme's primary. */
  accent?: string;
  /** Optional footer text on slides — defaults to the deck title. */
  footerText?: string;
  /** Show "01 / 10" page numbers in the slide footer (default true). */
  showPageNumbers?: boolean;
}

export interface Deck {
  id: string;
  title: string;
  subtitle?: string;
  themeId: string;
  slides: Slide[];
  meta?: DeckMeta;
  createdAt?: string;
  updatedAt?: string;
}

/** Footer text shown on slides: the custom brand line, else the deck title. */
export function deckFooterText(deck: Pick<Deck, 'title' | 'meta'>): string {
  const t = deck.meta?.footerText?.trim();
  return t || deck.title;
}

// ---------------------------------------------------------------------------
// Outline (pipeline intermediate)
// ---------------------------------------------------------------------------
export interface OutlineItem {
  layout: LayoutId;
  title: string;
  brief: string;
}

export interface DeckOutline {
  title: string;
  subtitle: string;
  /** Theme chosen by AI when user picked "Auto". */
  recommendedThemeId?: string;
  themeRationale?: string;
  slides: OutlineItem[];
}

// ---------------------------------------------------------------------------
// Design tokens — every theme must define the complete set.
// All px values are relative to the fixed 1280x720 slide canvas.
// ---------------------------------------------------------------------------
export interface ThemeColors {
  bg: string;
  bgAlt: string;
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryContrast: string;
  accent: string;
  border: string;
}

export interface ThemeTokens {
  colors: ThemeColors;
  /** CSS font-family stacks (Google Fonts loaded once, globally). */
  fonts: { display: string; body: string; mono: string };
  typeScale: {
    display: number;
    h1: number;
    h2: number;
    h3: number;
    body: number;
    caption: number;
  };
  spacing: { slide: number; gutter: number; block: number };
  radius: { sm: number; md: number; lg: number };
  shadow: { soft: string; card: string };
  chart: { palette: string[]; grid: string; axis: string };
  motion: { style: 'fade' | 'rise' | 'zoom' | 'slide'; duration: number };
  /** Decorative motif applied by chrome so every layout feels designed. */
  decor: 'rule-top' | 'bar-left' | 'corner' | 'band' | 'dots' | 'frame';
}

export interface ThemeManifest {
  id: string;
  name: string;
  tone: string;
  description: string;
  /** Mood tags used by the AI "Auto" theme selector. */
  bestFor: string[];
  tokens: ThemeTokens;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

/** Slides that participate in present mode and exports (hidden ones excluded). */
export function visibleSlides(slides: Slide[]): Slide[] {
  return slides.filter((s) => !s.hidden);
}
