import type { ThemeManifest } from '@/lib/deck/types';

/**
 * DeckForge theme catalog — 8 design systems curated from
 * docs/design-analysis.md (open-design + awesome-design-md research).
 *
 * Every theme declares the FULL token set; slide components read tokens
 * via CSS variables only. All px values are on the fixed 1280x720 canvas.
 *
 * Sources: stripe→corporate-clean, vercel→minimal-mono, theverge→bold-impact,
 * nintendo-2001→playful-pop, linear.app→dark-elegant, wired→editorial-serif,
 * raycast→tech-modern, starbucks→warm-earth.
 */

const SANS_FALLBACK = `, 'Inter', 'Helvetica Neue', Arial, sans-serif`;
const SERIF_FALLBACK = `, Georgia, 'Times New Roman', serif`;
const MONO = `'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace`;

export const THEMES: ThemeManifest[] = [
  // ---------------------------------------------------------------- corporate
  {
    id: 'corporate-clean',
    name: 'Corporate Clean',
    tone: 'corporate',
    description:
      'Crisp boardroom system — navy ink on white, confident serif-tight display, indigo accent. Stripe-inspired.',
    bestFor: ['business', 'finance', 'strategy', 'b2b', 'report', 'investor'],
    tokens: {
      colors: {
        bg: '#ffffff',
        bgAlt: '#f6f8fb',
        surface: '#ffffff',
        text: '#0a2540',
        textMuted: '#425466',
        primary: '#3b4d8f',
        primaryContrast: '#ffffff',
        accent: '#0a2540',
        border: '#e3e8ef',
      },
      fonts: {
        display: `'Inter Tight'${SANS_FALLBACK}`,
        body: `'Inter'${SANS_FALLBACK}`,
        mono: MONO,
      },
      typeScale: { display: 76, h1: 54, h2: 34, h3: 24, body: 19, caption: 14 },
      spacing: { slide: 72, gutter: 48, block: 24 },
      radius: { sm: 6, md: 10, lg: 16 },
      shadow: {
        soft: '0 1px 2px rgba(10,37,64,.06)',
        card: '0 12px 32px rgba(10,37,64,.10)',
      },
      chart: {
        palette: ['#3b4d8f', '#7a86b8', '#0a2540', '#93a3c8', '#5a6e9e', '#c6cede'],
        grid: '#e3e8ef',
        axis: '#425466',
      },
      motion: { style: 'rise', duration: 0.45 },
      decor: 'rule-top',
    },
  },

  // ------------------------------------------------------------------ minimal
  {
    id: 'minimal-mono',
    name: 'Minimal Mono',
    tone: 'minimal',
    description:
      'Quiet, hairline-driven system — near-black on white, generous whitespace, one restrained accent. Vercel-inspired.',
    bestFor: ['startup', 'product', 'developer', 'launch', 'technical', 'saas'],
    tokens: {
      colors: {
        bg: '#fafafa',
        bgAlt: '#f0f0f0',
        surface: '#ffffff',
        text: '#171717',
        textMuted: '#6b6b6b',
        primary: '#171717',
        primaryContrast: '#fafafa',
        accent: '#8f8f8f',
        border: '#ebebeb',
      },
      fonts: {
        display: `'Space Grotesk'${SANS_FALLBACK}`,
        body: `'Inter'${SANS_FALLBACK}`,
        mono: MONO,
      },
      typeScale: { display: 72, h1: 52, h2: 32, h3: 22, body: 18, caption: 13 },
      spacing: { slide: 80, gutter: 56, block: 22 },
      radius: { sm: 4, md: 8, lg: 12 },
      shadow: { soft: 'none', card: '0 1px 3px rgba(0,0,0,.05)' },
      chart: {
        palette: ['#171717', '#737373', '#a3a3a3', '#525252', '#d4d4d4', '#404040'],
        grid: '#ebebeb',
        axis: '#6b6b6b',
      },
      motion: { style: 'fade', duration: 0.4 },
      decor: 'frame',
    },
  },

  // --------------------------------------------------------------------- bold
  {
    id: 'bold-impact',
    name: 'Bold Impact',
    tone: 'bold',
    description:
      'High-contrast attention machine — massive black headlines, electric mint on near-black. The Verge-inspired.',
    bestFor: ['marketing', 'brand', 'campaign', 'pitch', 'keynote', 'launch'],
    tokens: {
      colors: {
        bg: '#131313',
        bgAlt: '#1d1d1d',
        surface: '#1d1d1d',
        text: '#f5f5f5',
        textMuted: '#a3a3a3',
        primary: '#3cffd0',
        primaryContrast: '#0c0c0c',
        accent: '#c8ff00',
        border: '#333333',
      },
      fonts: {
        display: `'Archivo Black'${SANS_FALLBACK}`,
        body: `'Archivo'${SANS_FALLBACK}`,
        mono: MONO,
      },
      typeScale: { display: 84, h1: 56, h2: 32, h3: 22, body: 18, caption: 13 },
      spacing: { slide: 64, gutter: 40, block: 20 },
      radius: { sm: 0, md: 0, lg: 0 },
      shadow: { soft: 'none', card: '8px 8px 0 rgba(60,255,208,.25)' },
      chart: {
        palette: ['#3cffd0', '#c8ff00', '#f5f5f5', '#7dfd97', '#ff8ae2', '#a3a3a3'],
        grid: '#333333',
        axis: '#a3a3a3',
      },
      motion: { style: 'slide', duration: 0.35 },
      decor: 'band',
    },
  },

  // ------------------------------------------------------------------ playful
  {
    id: 'playful-pop',
    name: 'Playful Pop',
    tone: 'playful',
    description:
      'Cheerful rounded system — cherry red, sunshine yellow, soft cream cards and chunky friendly type.',
    bestFor: ['education', 'community', 'kids', 'workshop', 'fun', 'nonprofit'],
    tokens: {
      colors: {
        bg: '#fff8f0',
        bgAlt: '#ffeeda',
        surface: '#ffffff',
        text: '#2d2016',
        textMuted: '#7a6a58',
        primary: '#e6003d',
        primaryContrast: '#ffffff',
        accent: '#ffb500',
        border: '#f2dfc8',
      },
      fonts: {
        display: `'Baloo 2'${SANS_FALLBACK}`,
        body: `'Nunito'${SANS_FALLBACK}`,
        mono: MONO,
      },
      typeScale: { display: 68, h1: 48, h2: 30, h3: 22, body: 18, caption: 13 },
      spacing: { slide: 64, gutter: 44, block: 24 },
      radius: { sm: 10, md: 18, lg: 28 },
      shadow: { soft: '0 2px 8px rgba(45,32,22,.08)', card: '0 10px 24px rgba(45,32,22,.10)' },
      chart: {
        palette: ['#e6003d', '#ffb500', '#0ea97a', '#7b5cd6', '#ff8a5c', '#3aafe0'],
        grid: '#f2dfc8',
        axis: '#7a6a58',
      },
      motion: { style: 'zoom', duration: 0.4 },
      decor: 'dots',
    },
  },

  // --------------------------------------------------------------------- dark
  {
    id: 'dark-elegant',
    name: 'Dark Elegant',
    tone: 'dark',
    description:
      'Cinematic evening system — near-black canvas, champagne serif display, hairline panels. Linear-inspired.',
    bestFor: ['executive', 'luxury', 'architecture', 'fashion', 'story', 'vision'],
    tokens: {
      colors: {
        bg: '#0b0b0f',
        bgAlt: '#121218',
        surface: '#16161d',
        text: '#f2f2f5',
        textMuted: '#9b9ba8',
        primary: '#c9a86a',
        primaryContrast: '#141414',
        accent: '#7d7de8',
        border: '#26262f',
      },
      fonts: {
        display: `'Cormorant Garamond'${SERIF_FALLBACK}`,
        body: `'Inter'${SANS_FALLBACK}`,
        mono: MONO,
      },
      typeScale: { display: 74, h1: 54, h2: 32, h3: 22, body: 18, caption: 13 },
      spacing: { slide: 80, gutter: 56, block: 24 },
      radius: { sm: 6, md: 12, lg: 18 },
      shadow: { soft: 'none', card: '0 16px 48px rgba(0,0,0,.45)' },
      chart: {
        palette: ['#c9a86a', '#7d7de8', '#f2f2f5', '#8fa88f', '#d97b7b', '#6aa8c9'],
        grid: '#26262f',
        axis: '#9b9ba8',
      },
      motion: { style: 'fade', duration: 0.55 },
      decor: 'corner',
    },
  },

  // ---------------------------------------------------------------- editorial
  {
    id: 'editorial-serif',
    name: 'Editorial Serif',
    tone: 'editorial',
    description:
      'Magazine-grade typography — cream paper, Playfair display with razor accents, WIRED-inspired red slash.',
    bestFor: ['storytelling', 'research', 'journalism', 'history', 'culture', 'case-study'],
    tokens: {
      colors: {
        bg: '#faf7f2',
        bgAlt: '#f1ece2',
        surface: '#ffffff',
        text: '#1a1a1a',
        textMuted: '#57534e',
        primary: '#c0261f',
        primaryContrast: '#ffffff',
        accent: '#1a1a1a',
        border: '#e5ddd0',
      },
      fonts: {
        display: `'Playfair Display'${SERIF_FALLBACK}`,
        body: `'Source Sans 3'${SANS_FALLBACK}`,
        mono: MONO,
      },
      typeScale: { display: 72, h1: 52, h2: 32, h3: 22, body: 18, caption: 13 },
      spacing: { slide: 76, gutter: 52, block: 24 },
      radius: { sm: 2, md: 4, lg: 6 },
      shadow: { soft: 'none', card: '0 6px 18px rgba(26,26,26,.08)' },
      chart: {
        palette: ['#c0261f', '#1a1a1a', '#8c6d46', '#5b7553', '#a3542e', '#7c7c7c'],
        grid: '#e5ddd0',
        axis: '#57534e',
      },
      motion: { style: 'rise', duration: 0.5 },
      decor: 'rule-top',
    },
  },

  // --------------------------------------------------------------------- tech
  {
    id: 'tech-modern',
    name: 'Tech Modern',
    tone: 'tech',
    description:
      'Product-grade dark system — deep space canvas, sky signal color, glass panels. Raycast-inspired.',
    bestFor: ['engineering', 'ai', 'data', 'cloud', 'security', 'platform'],
    tokens: {
      colors: {
        bg: '#07080a',
        bgAlt: '#0d0f13',
        surface: '#12151b',
        text: '#e8ecf1',
        textMuted: '#8b95a5',
        primary: '#57c1ff',
        primaryContrast: '#06222f',
        accent: '#7ee2b8',
        border: '#1e232c',
      },
      fonts: {
        display: `'Sora'${SANS_FALLBACK}`,
        body: `'Inter'${SANS_FALLBACK}`,
        mono: MONO,
      },
      typeScale: { display: 70, h1: 50, h2: 30, h3: 21, body: 18, caption: 13 },
      spacing: { slide: 72, gutter: 48, block: 22 },
      radius: { sm: 8, md: 14, lg: 20 },
      shadow: { soft: 'none', card: '0 16px 40px rgba(0,0,0,.5)' },
      chart: {
        palette: ['#57c1ff', '#7ee2b8', '#e8ecf1', '#c9b8ff', '#ffb86b', '#ff7eb6'],
        grid: '#1e232c',
        axis: '#8b95a5',
      },
      motion: { style: 'rise', duration: 0.4 },
      decor: 'bar-left',
    },
  },

  // --------------------------------------------------------------------- warm
  {
    id: 'warm-earth',
    name: 'Warm Earth',
    tone: 'warm',
    description:
      'Grounded organic system — terracotta and olive on warm cream, humanist serif, calm and trustworthy.',
    bestFor: ['sustainability', 'health', 'hospitality', 'education', 'values', 'impact'],
    tokens: {
      colors: {
        bg: '#f8f3ec',
        bgAlt: '#efe6d8',
        surface: '#fffdf8',
        text: '#33302b',
        textMuted: '#6d675c',
        primary: '#b4552d',
        primaryContrast: '#fffdf8',
        accent: '#5b6e4f',
        border: '#e3d9c8',
      },
      fonts: {
        display: `'Fraunces'${SERIF_FALLBACK}`,
        body: `'Work Sans'${SANS_FALLBACK}`,
        mono: MONO,
      },
      typeScale: { display: 70, h1: 50, h2: 31, h3: 22, body: 18, caption: 13 },
      spacing: { slide: 76, gutter: 50, block: 24 },
      radius: { sm: 8, md: 14, lg: 22 },
      shadow: { soft: '0 1px 3px rgba(51,48,43,.07)', card: '0 12px 28px rgba(51,48,43,.10)' },
      chart: {
        palette: ['#b4552d', '#5b6e4f', '#c99a3f', '#6e8b74', '#8c4a3a', '#a49a83'],
        grid: '#e3d9c8',
        axis: '#6d675c',
      },
      motion: { style: 'fade', duration: 0.5 },
      decor: 'corner',
    },
  },
];

export const DEFAULT_THEME_ID = 'corporate-clean';

export function getTheme(id: string | undefined | null): ThemeManifest {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!;
}

const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Layer a user-chosen accent over a theme: the primary color (titles' rule,
 * bullets, stats values, chart series 1, decor) re-tints instantly while the
 * rest of the theme (fonts, layout, backgrounds, motion) stays intact.
 * Returns the manifest untouched when no valid accent is given.
 */
export function applyAccent(theme: ThemeManifest, accent?: string | null): ThemeManifest {
  if (!accent || !HEX_RE.test(accent)) return theme;
  return {
    ...theme,
    tokens: {
      ...theme.tokens,
      colors: { ...theme.tokens.colors, primary: accent, accent },
      chart: { ...theme.tokens.chart, palette: [accent, ...theme.tokens.chart.palette.slice(1)] },
    },
  };
}

/** Resolve the effective render theme for a deck (theme + optional accent). */
export function deckTheme(deck: Pick<ThemeDeck, 'themeId' | 'meta'>): ThemeManifest {
  return applyAccent(getTheme(deck.themeId), deck.meta?.accent);
}

interface ThemeDeck {
  themeId: string;
  meta?: { accent?: string };
}

/** Compact catalog used in AI prompts (Auto theme selection). */
export function themeCatalogForPrompt(): string {
  return THEMES.map(
    (t) => `- ${t.id}: "${t.name}" (tone: ${t.tone}) — ${t.description} Best for: ${t.bestFor.join(', ')}`
  ).join('\n');
}
