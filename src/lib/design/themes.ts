import type { ThemeManifest } from '@/lib/deck/types';

/**
 * DeckForge theme catalog — 16 design systems.
 *
 * Original 8 curated from docs/design-analysis.md (open-design +
 * awesome-design-md research): stripe→corporate-clean, vercel→minimal-mono,
 * theverge→bold-impact, nintendo-2001→playful-pop, linear.app→dark-elegant,
 * wired→editorial-serif, raycast→tech-modern, starbucks→warm-earth.
 *
 * Expansion 8 distilled from real source palettes/typography (council
 * decision #6): skills/design/design-templates/ppt/guizang-ppt (ink-classic
 * e-ink) → eink-editorial; upload decksmith `monochrome` → ivory-ledger;
 * skills ib-pitch-book → pitch-book-finance; decksmith `signal` →
 * signal-navy; decksmith `grove` → forest-grove; decksmith
 * `hermes-cyber-terminal` → cyber-terminal; zhangzara biennale-yellow →
 * biennale-yellow; decksmith `scatterbrain` → paper-collage.
 *
 * Every theme declares the FULL token set; slide components read tokens
 * via CSS variables only. All px values are on the fixed 1280x720 canvas.
 * `accent` is decorative (rules, check bullets, tape); accent-as-TEXT always
 * routes through the contrast-derived `primaryText` (deck.css / applyAccent).
 */

const SANS_FALLBACK = `, 'Inter', 'Helvetica Neue', Arial, sans-serif`;
const SERIF_FALLBACK = `, Georgia, 'Times New Roman', serif`;
const MONO = `'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace`;
const JET_FALLBACK = `, 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace`;

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

  // ------------------------------------------------------------------- e-ink
  {
    id: 'eink-editorial',
    name: 'E-Ink Editorial',
    tone: 'eink',
    description:
      'E-reader magazine system — warm paper, pure ink, serif body text and masthead rules. No color at all, only typography.',
    bestFor: ['longform', 'essay', 'journal', 'culture', 'brand-story', 'keynote'],
    tokens: {
      colors: {
        bg: '#f1efea',
        bgAlt: '#e8e5de',
        surface: '#faf9f6',
        text: '#0a0a0b',
        textMuted: '#6b6862',
        primary: '#0a0a0b',
        primaryContrast: '#f1efea',
        accent: '#55534d',
        border: '#d6d2c8',
      },
      fonts: {
        display: `'Playfair Display'${SERIF_FALLBACK}`,
        body: `'Source Serif 4'${SERIF_FALLBACK}`,
        mono: MONO,
      },
      typeScale: { display: 78, h1: 56, h2: 34, h3: 24, body: 19, caption: 14 },
      spacing: { slide: 76, gutter: 52, block: 24 },
      radius: { sm: 2, md: 4, lg: 6 },
      shadow: { soft: 'none', card: '0 10px 26px rgba(10,10,11,.08)' },
      chart: {
        palette: ['#0a0a0b', '#55534d', '#8c8a82', '#b8b5ac', '#3d3b36', '#d8d5cc'],
        grid: '#d6d2c8',
        axis: '#6b6862',
      },
      motion: { style: 'fade', duration: 0.5 },
      decor: 'masthead',
    },
  },

  // ------------------------------------------------------------------ ledger
  {
    id: 'ivory-ledger',
    name: 'Ivory Ledger',
    tone: 'ledger',
    description:
      'Typographic restraint, period — black ink on ivory ledger paper, geometric sans, ruled hairlines and mono marginalia.',
    bestFor: ['research', 'synthesis', 'consulting', 'report', 'academic', 'audit'],
    tokens: {
      colors: {
        bg: '#fafadf',
        bgAlt: '#f2f2d2',
        surface: '#f5f0e4',
        text: '#1a1a16',
        textMuted: '#5e5e54',
        primary: '#1a1a16',
        primaryContrast: '#fafadf',
        accent: '#5e5e54',
        border: '#1a1a16',
      },
      fonts: {
        display: `'Jost'${SANS_FALLBACK}`,
        body: `'Jost'${SANS_FALLBACK}`,
        mono: `'JetBrains Mono'${JET_FALLBACK}`,
      },
      typeScale: { display: 74, h1: 52, h2: 32, h3: 22, body: 18, caption: 13 },
      spacing: { slide: 80, gutter: 56, block: 22 },
      radius: { sm: 0, md: 0, lg: 0 },
      shadow: { soft: 'none', card: '0 2px 0 rgba(26,26,22,.14)' },
      chart: {
        palette: ['#1a1a16', '#5e5e54', '#8a8a80', '#b5b5a8', '#3a3a33', '#d5d5c8'],
        grid: '#d9d9c4',
        axis: '#5e5e54',
      },
      motion: { style: 'rise', duration: 0.45 },
      decor: 'frame',
    },
  },

  // ----------------------------------------------------------------- finance
  {
    id: 'pitch-book-finance',
    name: 'Pitch Book',
    tone: 'finance',
    description:
      'Investment-banking discussion materials — warm paper, oxblood rules, deep-green positives, serif numerals, square corners. Dense by design.',
    bestFor: ['finance', 'banking', 'board', 'valuation', 'report', 'investor'],
    tokens: {
      colors: {
        bg: '#faf9f6',
        bgAlt: '#f2efe8',
        surface: '#fdfcf9',
        text: '#262420',
        textMuted: '#5c584f',
        primary: '#9e3f3b',
        primaryContrast: '#fdfcf9',
        accent: '#2f6b52',
        border: '#d9d6cf',
      },
      fonts: {
        display: `'Source Serif 4'${SERIF_FALLBACK}`,
        body: `'Public Sans'${SANS_FALLBACK}`,
        mono: MONO,
      },
      typeScale: { display: 64, h1: 46, h2: 30, h3: 21, body: 17, caption: 12 },
      spacing: { slide: 64, gutter: 40, block: 20 },
      radius: { sm: 0, md: 2, lg: 4 },
      shadow: { soft: 'none', card: '0 2px 12px rgba(38,36,32,.08)' },
      chart: {
        palette: ['#9e3f3b', '#2f6b52', '#26241f', '#8a857b', '#b98a4a', '#d0ccc2'],
        grid: '#d9d6cf',
        axis: '#5c584f',
      },
      motion: { style: 'fade', duration: 0.4 },
      decor: 'rule-top',
    },
  },

  // ------------------------------------------------------------ institutional
  {
    id: 'signal-navy',
    name: 'Signal Navy',
    tone: 'institutional',
    description:
      'Institutional gravitas — deep navy canvas, warm bone text, one antique-gold signal color and editorial serif headlines.',
    bestFor: ['policy', 'government', 'institution', 'annual', 'report', 'trust'],
    tokens: {
      colors: {
        bg: '#1c2644',
        bgAlt: '#232f55',
        surface: '#1f2a4c',
        text: '#e2dcd0',
        textMuted: '#8a96a8',
        primary: '#c8a870',
        primaryContrast: '#1c2644',
        accent: '#8a96a8',
        border: '#2e3d5c',
      },
      fonts: {
        display: `'Source Serif 4'${SERIF_FALLBACK}`,
        body: `'DM Sans'${SANS_FALLBACK}`,
        mono: MONO,
      },
      typeScale: { display: 78, h1: 56, h2: 34, h3: 24, body: 19, caption: 14 },
      spacing: { slide: 80, gutter: 56, block: 24 },
      radius: { sm: 2, md: 4, lg: 8 },
      shadow: { soft: 'none', card: '0 18px 44px rgba(0,0,0,.35)' },
      chart: {
        palette: ['#c8a870', '#e2dcd0', '#8a96a8', '#a9bcd8', '#c9977f', '#9ab0a0'],
        grid: '#2e3d5c',
        axis: '#8a96a8',
      },
      motion: { style: 'fade', duration: 0.5 },
      decor: 'band',
    },
  },

  // -------------------------------------------------------------------- grove
  {
    id: 'forest-grove',
    name: 'Forest Grove',
    tone: 'grove',
    description:
      'Botanical dark — deep forest canvas, warm cream serif with italic accents, one terracotta note. Breathes like a greenhouse.',
    bestFor: ['sustainability', 'nature', 'wellness', 'outdoors', 'literary', 'wine'],
    tokens: {
      colors: {
        bg: '#192b1b',
        bgAlt: '#1e3221',
        surface: '#233826',
        text: '#d4cfbf',
        textMuted: '#8d927e',
        primary: '#d4cfbf',
        primaryContrast: '#192b1b',
        // Source terracotta — decorative only (3.4:1 non-text); accent-as-text
        // routes through primaryText (cream, 9.6:1 on this bg).
        accent: '#c8524a',
        border: '#2e4330',
      },
      fonts: {
        display: `'Playfair Display'${SERIF_FALLBACK}`,
        body: `'Jost'${SANS_FALLBACK}`,
        mono: `'JetBrains Mono'${JET_FALLBACK}`,
      },
      typeScale: { display: 76, h1: 54, h2: 33, h3: 23, body: 18, caption: 13 },
      spacing: { slide: 84, gutter: 56, block: 26 },
      radius: { sm: 2, md: 4, lg: 6 },
      shadow: { soft: 'none', card: '0 14px 36px rgba(0,0,0,.35)' },
      chart: {
        palette: ['#d4cfbf', '#cf5b52', '#8f9d7a', '#b8875a', '#7f9d90', '#9aa87f'],
        grid: '#2e4330',
        axis: '#8d927e',
      },
      motion: { style: 'rise', duration: 0.55 },
      decor: 'corner',
    },
  },

  // ----------------------------------------------------------------- terminal
  {
    id: 'cyber-terminal',
    name: 'Cyber Terminal',
    tone: 'terminal',
    description:
      'CRT console — near-black blue-cast canvas, mint phosphor type in JetBrains Mono, scanline overlay and amber warnings.',
    bestFor: ['developer', 'devtools', 'security', 'hackathon', 'cli', 'ai'],
    tokens: {
      colors: {
        bg: '#0a0c10',
        bgAlt: '#15151b',
        surface: '#12141a',
        text: '#e4e2d8',
        textMuted: '#8a8892',
        primary: '#7ed3a4',
        primaryContrast: '#0a0c10',
        accent: '#64dfdf',
        border: '#1f302b',
      },
      fonts: {
        display: `'JetBrains Mono'${JET_FALLBACK}`,
        body: `'Inter'${SANS_FALLBACK}`,
        mono: `'JetBrains Mono'${JET_FALLBACK}`,
      },
      typeScale: { display: 64, h1: 46, h2: 30, h3: 21, body: 17, caption: 13 },
      spacing: { slide: 64, gutter: 44, block: 20 },
      radius: { sm: 4, md: 8, lg: 10 },
      shadow: { soft: 'none', card: '0 0 44px rgba(126,211,164,.07), 0 14px 36px rgba(0,0,0,.45)' },
      chart: {
        palette: ['#7ed3a4', '#64dfdf', '#e9c58a', '#d4a0b9', '#ff6b6b', '#e4e2d8'],
        grid: '#1f302b',
        axis: '#8a8892',
      },
      motion: { style: 'slide', duration: 0.35 },
      decor: 'scanlines',
    },
  },

  // ---------------------------------------------------------------- biennale
  {
    id: 'biennale-yellow',
    name: 'Biennale Yellow',
    tone: 'biennale',
    description:
      'Art-poster atmosphere — warm parchment, deep indigo serif, a soft ember edge and the memory of solar yellow. Dutch-editorial.',
    bestFor: ['arts', 'exhibition', 'conference', 'culture', 'literary', 'museum'],
    tokens: {
      colors: {
        bg: '#e9e5db',
        bgAlt: '#ded9cc',
        surface: '#f2efe7',
        text: '#1b2566',
        textMuted: '#63666e',
        primary: '#1b2566',
        primaryContrast: '#f2efe7',
        // Source ember, stepped one stop darker for 3.2:1 non-text contrast on
        // parchment; decorative only — text uses primaryText (indigo, 11:1).
        accent: '#d4593a',
        border: '#d5d0c3',
      },
      fonts: {
        display: `'Instrument Serif'${SERIF_FALLBACK}`,
        body: `'Archivo'${SANS_FALLBACK}`,
        mono: `'JetBrains Mono'${JET_FALLBACK}`,
      },
      typeScale: { display: 80, h1: 56, h2: 34, h3: 23, body: 18, caption: 13 },
      spacing: { slide: 76, gutter: 52, block: 24 },
      radius: { sm: 2, md: 4, lg: 8 },
      shadow: { soft: 'none', card: '0 12px 30px rgba(27,37,102,.10)' },
      chart: {
        palette: ['#1b2566', '#d4593a', '#8b84b0', '#a87c22', '#5f8a7e', '#a3a3a0'],
        grid: '#d5d0c3',
        axis: '#63666e',
      },
      motion: { style: 'rise', duration: 0.5 },
      decor: 'corner',
    },
  },

  // ----------------------------------------------------------------- collage
  {
    id: 'paper-collage',
    name: 'Paper Collage',
    tone: 'collage',
    description:
      'Sticky-note workshop wall — paper ground, pastel washi tape, thumbtack red and chunky slab display type. Playful, hands-on.',
    bestFor: ['workshop', 'brainstorm', 'retro', 'education', 'community', 'fun'],
    tokens: {
      colors: {
        bg: '#f7f5f0',
        bgAlt: '#efece4',
        surface: '#faf8f3',
        text: '#2d2a26',
        textMuted: '#5c5750',
        primary: '#c92a2a',
        primaryContrast: '#ffffff',
        accent: '#ffd43b',
        border: '#e0dcd2',
      },
      fonts: {
        display: `'Shrikhand'${SERIF_FALLBACK}`,
        body: `'Zilla Slab'${SERIF_FALLBACK}`,
        mono: MONO,
      },
      typeScale: { display: 64, h1: 46, h2: 30, h3: 22, body: 18, caption: 13 },
      spacing: { slide: 60, gutter: 40, block: 22 },
      radius: { sm: 8, md: 16, lg: 24 },
      shadow: { soft: '0 2px 6px rgba(45,42,38,.10)', card: '6px 8px 0 rgba(45,42,38,.12)' },
      chart: {
        palette: ['#c92a2a', '#1971c2', '#2f9e44', '#e8590c', '#6741d9', '#2d2a26'],
        grid: '#e0dcd2',
        axis: '#5c5750',
      },
      motion: { style: 'zoom', duration: 0.4 },
      decor: 'tape',
    },
  },
];

export const DEFAULT_THEME_ID = 'corporate-clean';

export function getTheme(id: string | undefined | null): ThemeManifest {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!;
}

const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Normalize #rgb → #rrggbb so luminance math always sees 6 digits. */
function expandHex(hex: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) {
    const [r, g, b] = hex.slice(1).split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return hex.toLowerCase();
}

/** Relative luminance (WCAG 2.1) of a #rrggbb color. */
function relLuminance(hex: string): number {
  const n = parseInt(expandHex(hex).slice(1), 16);
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}

/**
 * Pick the most readable foreground (white vs. near-black) for text sitting
 * on `hex`, per WCAG contrast ratio — keeps light user accents (butter,
 * mint, sky) from pairing with white text and failing accessibility.
 */
function readableOn(hex: string): string {
  const l = relLuminance(hex);
  const contrastWhite = 1.05 / (l + 0.05);
  const contrastBlack = (l + 0.05) / 0.05;
  return contrastWhite >= contrastBlack ? '#ffffff' : '#101010';
}

/** WCAG contrast ratio between two hex colors (1–21). */
export function contrastRatio(a: string, b: string): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Linear-light mix of a hex color toward black; t=0 → original, t=1 → black. */
function mixTowardBlack(hex: string, t: number): string {
  const n = parseInt(expandHex(hex).slice(1), 16);
  const ch = (v: number) => Math.round(v * (1 - t));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Return a version of `hex` that reads as TEXT on `bg` (≥4.5:1, WCAG AA).
 * Colors that already pass are returned untouched; light ones are stepped
 * toward black until they pass. Used for accent-as-text (kickers, labels).
 */
function textSafeOn(hex: string, bg: string): string {
  if (contrastRatio(hex, bg) >= 4.5) return expandHex(hex);
  for (let i = 1; i <= 10; i++) {
    const candidate = mixTowardBlack(hex, i / 10);
    if (contrastRatio(candidate, bg) >= 4.5) return candidate;
  }
  return '#101010';
}

/**
 * Layer a user-chosen accent over a theme: the primary color (titles' rule,
 * bullets, stats values, chart series 1, decor) re-tints instantly while the
 * rest of the theme (fonts, layout, backgrounds, motion) stays intact.
 * `primaryContrast` is re-derived from the accent so on-primary text always
 * passes contrast, whatever lightness the user picks, and `primaryText` is a
 * darkened variant for accent-as-TEXT on light backgrounds (kickers, labels).
 * Returns the manifest untouched when no valid accent is given.
 */
export function applyAccent(theme: ThemeManifest, accent?: string | null): ThemeManifest {
  if (!accent || !HEX_RE.test(accent)) return theme;
  return {
    ...theme,
    tokens: {
      ...theme.tokens,
      colors: {
        ...theme.tokens.colors,
        primary: accent,
        accent,
        primaryContrast: readableOn(accent),
        primaryText: textSafeOn(accent, theme.tokens.colors.bg),
      },
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
