# DESIGN.md

Landing-page design system ("the stage" / billposter direction), per the impeccable
brand register. The app's editor and deck themes are governed by their own token sets
and are NOT changed by this document.

## Color (OKLCH)
Strategy: Committed. One saturated color carries 30-60% of key surfaces.
Named reference: Playbill yellow-on-black; billposting, not neon-on-black (flat poster
ink, zero glow).

- `--stg-ink: oklch(0.17 0.008 95)` warm-tinted near-black (never #000)
- `--stg-ink-2: oklch(0.23 0.01 95)` raised ink for panels
- `--stg-yellow: oklch(0.84 0.19 96)` poster yellow (primary voice)
- `--stg-yellow-deep: oklch(0.75 0.17 90)` pressed/hover yellow
- `--stg-cream: oklch(0.95 0.015 95)` paper band
- `--stg-cream-2: oklch(0.91 0.02 95)` cream panel
- `--stg-gray: oklch(0.62 0.01 95)` muted text on ink
- Text on ink: cream. Text on yellow: ink. Yellow is never used for body text on cream
  (contrast); on cream it appears only as fills, rules and marks.

## Typography
- Display: "Big Shoulders Display" (600-800). Condensed poster voice; used at clamp()
  sizes with tight leading and ALL-CAPS for billboard lines only.
- Body/UI: "Archivo" (400-700). Committed single workhorse; hierarchy via weight and
  size contrast, not via extra families.
- Labels: Archivo 600-700, U+2116-free caps, tracked +0.14em to +0.22em, 11-12px.
  NO monospace on the landing (mono-as-costume ban).
- Body line length capped at ~65ch. Fluid clamp() for headings.

## Layout
- Asymmetric, poster-like, left-leaning; oversized numerals as background type.
- Solid 2px ink borders and flat fills; chunky spacing rhythm (generous between
  sections, tight inside groups). No hairline rule-separated columns.
- The only "card" affordances are real ones: the brief form (a job ticket), the
  materials panel, theme gallery, deck library.

## Motion
- One orchestrated load per section, staggered reveals, ease-out expo [0.16,1,0.3,1].
- Yellow poster-ticker marquee (pausable, prefers-reduced-motion disables everything).
- No bounce, no elastic, no layout-property animation.

## Components (landing-only)
- `.stg-*` utility classes in globals.css; prefix keeps app styles isolated.
- Header: ink bar, yellow mark, caps nav, yellow CTA.
- The Screen (hero specimen): real ScaledSlide renders, projection framing, leader
  line captions (REEL 01/08), theme dots, transport buttons.

## Bans honored
No gradient text, no glass, no side-stripes, no hero-metric template, no identical
card grids, no em dashes in copy, no mono-as-costume.
