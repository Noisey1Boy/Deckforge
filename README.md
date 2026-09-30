# DeckForge AI

Prompt-to-presentation studio: describe a topic or drop your own data, and get a
designed, editable 16:9 deck — then present it and export it (PPTX / PDF / HTML).

![stack](https://img.shields.io/badge/Next.js%2016-App%20Router-black) ![ts](https://img.shields.io/badge/TypeScript-5-blue) ![tailwind](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8)

## Features

- **Prompt input** — one box for the topic, plus audience, tone, slide count (4–30) and language. A rotating **“More ideas”** pool of 12 starter prompts is one click away.
- **Data input** — upload CSV / XLSX / JSON, a screenshot of a chart (AI vision extracts the values), or paste a Mermaid diagram — **or just drop the file anywhere on the landing page**. The AI chooses *how* to chart your data; **the numbers themselves are computed from your file** and can never be invented.
- **Outline-first pipeline** — the AI proposes a structured outline (you can edit it), then writes each slide with streaming progress. Every slide gets one of 11 fixed layouts so text always fits; per-layout budgets auto-shrink instead of overflowing.
- **8 curated design systems** — Corporate Clean, Minimal Mono, Bold Impact, Playful Pop, Dark Elegant, Editorial Serif, Tech Modern, Warm Earth — or **Auto**: the AI picks the best match for topic + tone and explains why. Switching theme re-styles the entire deck instantly.
- **Deck style & branding** — layer a custom **accent color** over any theme (bullets, stats, rules, chart series and even the library cards re-tint instantly on every slide), set a custom **footer text** (defaults to the deck title) and toggle **page numbers**. Persisted with the deck and carried through PPTX / PDF / HTML exports.
- **Editor** — reorder (drag), add (layout picker with all 11 layouts), duplicate, delete slides; edit every field inline; **multi-select slides** (⌘/Ctrl-click toggles, ⇧-click selects a range) with a batch action bar — duplicate / hide / show / delete the whole selection in one undo step; **upload your own image** for image slides (auto-downscaled to WebP, alt-text editor) **or just drop an image file anywhere on the canvas**; switch chart type (column / bar / line / area / pie / donut) per chart; **edit chart data directly in a cell grid** (labels, values, unit, source, multi-series — the chart re-renders live); per-slide AI actions (rewrite, shorten, expand, regenerate, add chart, AI illustration); **undo/redo** (⌘Z / ⇧⌘Z, 40-step history); **hide/show slides** (H — hidden slides are skipped in present mode and all exports, with a badge + hint chip in the editor); **per-slide transition override** (inherit / none / fade / rise / zoom / slide); **shuffle design system** button for one-click instant re-theming; **keyboard shortcuts** (J/K or ↑↓ navigate, ⌘D duplicate, Del delete — works on the whole selection, Esc clears selection, `?` cheat-sheet); a live **"N visible · ~X min" talk-time chip**. Autosaves; the header logo and a toolbar back button return to the deck library.
- **Present mode** — fullscreen, keyboard navigation (← → Space Home End N **V G** Esc), click zones (left ≈28% back / right forward), transient on-entry key hints, **click-to-seek gradient progress bar**, speaker notes, **slide overview grid (G)**, **presenter view (V) — live notes, next-slide preview, elapsed time and auto-play status in a dedicated sidebar**, **presenter timer**, **auto-play (P) with per-slide speed (5/10/15/20 s) and optional deck loop — both persisted between sessions** for kiosk-style replay, theme-driven Framer Motion transitions that respect `prefers-reduced-motion`.
- **Export** — PPTX (editable, native charts, theme fonts/colors), PDF (print CSS at exactly 1280×720 per page), standalone HTML (self-contained, no server needed), **speaker notes as Markdown** (per-slide notes + on-slide bullets).
- **Deck library** — search your decks by title, duplicate, delete (with confirmation) and **JSON export/import** (`.deck.json`) for backup and portability.

## Setup

```bash
bun install
bun run db:push        # create SQLite database (Prisma)
bun run dev            # dev server on :3000
```

No extra env vars are required — the AI layer uses the sandbox-provided
`z-ai-web-dev-sdk` (server-side only; keys never reach the browser).

> Fonts load from Google Fonts at runtime; offline they degrade gracefully to
> system stacks.

## Architecture

```
src/
  lib/
    design/themes.ts       # 8 themes as complete design-token sets
    design/css-vars.ts     # tokens → CSS custom properties
    deck/types.ts          # Deck / Slide / Theme / Layout models
    deck/limits.ts         # per-layout text budgets + auto-shrink factors
    data/parse.ts          # CSV/XLSX/JSON parsing + deterministic aggregation
    ai/helpers.ts          # z-ai SDK, robust JSON extraction, sanitize, rate limit
    store/deck-store.ts    # Zustand app state
    export/pptx.ts         # PptxGenJS exporter (native charts)
    export/html.ts         # standalone HTML exporter
  components/
    deck/                  # SlideView (11 layouts), SlideChart, SlideDiagram
    app/                   # CreateView, OutlineView, GeneratingView, PresentOverlay…
    editor/                # EditorView, SlideInspector
  app/api/                 # generate/outline, generate/slides (SSE), ai/slide,
                           # data/analyze, data/chart-image, generate/image, decks CRUD
```

**Design-token rule:** slide components read **only** CSS variables
(`--s-bg`, `--s-primary`, `--s-font-display`, …) compiled from a theme's tokens.
No hardcoded colors or fonts — a new theme instantly themes every layout,
chart and diagram.

### Data integrity guarantee

The AI never computes your numbers. Uploads are parsed and aggregated
client-side (`sum / avg / min / max / count`); the AI only selects
*kind, columns, aggregation, sort, limit* and writes titles + insight prose.
Chart slides without verified user data are downgraded to qualitative bullets.

## Adding a new template / design system

1. Open `src/lib/design/themes.ts` and copy any theme object.
2. Define the **complete** `ThemeTokens` set (colors, fonts, typeScale, spacing,
   radius, shadows, chart palette of 6, motion, decor) — all values are px on a
   1280×720 canvas. Pick fonts already loaded in `src/app/layout.tsx`, or add
   the family to the Google Fonts link.
3. Add `id`, `name`, `tone`, `description` and `bestFor` tags (used by the AI
   Auto-selector).
4. Done — the gallery, editor switcher and Auto prompt pick it up automatically.

To add a font family: extend `FONTS_HREF` in `src/app/layout.tsx` (and in
`src/lib/export/html.ts` for standalone HTML exports).

## Known limitations & next steps

- Sequential-ish generation (2 slides in flight) — a queue with per-slide
  caching would help for 30-slide decks.
- PPTX diagram export linearizes layered flows into left-to-right boxes.
- PDF export relies on the browser print dialog (headless Chrome
  `--print-to-pdf` works well).
- No multi-user auth/decks are global; NextAuth is scaffolded but unused.
- Chart images rely on vision accuracy — always double-check extracted values.
- Speaker notes are plain text; no image upload per slide yet (AI illustration
  and URL entry exist).
