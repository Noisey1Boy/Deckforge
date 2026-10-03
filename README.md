# DeckForge AI

Prompt-to-presentation studio: describe a topic or drop your own data, and get a
designed, editable 16:9 deck — then present it and export it (PPTX / PDF / HTML).

![stack](https://img.shields.io/badge/Next.js%2016-App%20Router-black) ![ts](https://img.shields.io/badge/TypeScript-5-blue) ![tailwind](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8)

## Features

- **Landing page ("print shop" design)** — a monochrome editorial system (ink/paper bands, one amber accent, zero gradients) with the product as its own hero: a **live specimen lightbox** cycling real slides rendered by the actual theme-token pipeline across all 8 design systems (FIG. 01/08 caption strip with play/pause/prev/next), a **numbered method strip** (Brief → Outline → Design → Present & export), the functional **workbench** (brief card with hard-offset shadow, materials dropzones, design-system gallery), a **House Rules** band (opinions enforced in code: no invented numbers, tokens not templates, outline before pixels, the file is yours), and a structured colophon footer. Anchor nav (`METHOD / WORKBENCH / SYSTEMS / DECKS`), CSS marquee of specs, all animations honoring `prefers-reduced-motion`.
- **Prompt input** — one box for the topic, plus audience, tone, slide count (4–30) and language. A rotating **“More ideas”** pool of 12 starter prompts is one click away.
- **Data input** — upload CSV / XLSX / JSON, a screenshot of a chart (AI vision extracts the values), or paste a Mermaid diagram — **or just drop the file anywhere on the landing page**. The AI chooses *how* to chart your data; **the numbers themselves are computed from your file** and can never be invented.
- **Markdown paste → outline** — a dedicated data tab parses pasted markdown deterministically (no AI rewriting): `#` becomes the deck title (auto-cover slide), `##` becomes slides, bullets become the brief, `[chart]` / `[stats]` / `[quote]`… tags pick the layout, `@layout:` works as an alternative directive. A live preview shows slide/bullet counts before you build; when Auto theme is selected a keyword heuristic suggests the design system. Your structure stays exactly as written.
- **Outline-first pipeline** — the AI proposes a structured outline (you can edit it), then writes each slide with streaming progress. Every slide gets one of 11 fixed layouts so text always fits; per-layout budgets auto-shrink instead of overflowing.
- **8 curated design systems** — Corporate Clean, Minimal Mono, Bold Impact, Playful Pop, Dark Elegant, Editorial Serif, Tech Modern, Warm Earth — or **Auto**: the AI picks the best match for topic + tone and explains why. Switching theme re-styles the entire deck instantly.
- **Deck style & branding** — layer a custom **accent color** over any theme (bullets, stats, rules, chart series and even the library cards re-tint instantly on every slide); **contrast is derived automatically** (WCAG): accent-*filled* chips/pills always get readable text, and accent-as-*text* (kickers, stat values, section labels) is **darkened until it passes 4.5:1 on light backgrounds** while staying untouched on dark themes — the same derived color flows into PPTX exports; set a custom **footer text** (defaults to the deck title) and toggle **page numbers**. Persisted with the deck and carried through PPTX / PDF / HTML exports.
- **Editor** — reorder (**drag** in the thumbnail rail, **⌥↑/⌥↓** on the keyboard, or the ⌘K palette), add (layout picker with all 11 layouts **plus an AI composer — type a topic and a full slide (copy, layout, speaker notes) is written and inserted after the current one; composed stats slides are flagged with an “Illustrative figures” footnote, toggleable in the inspector**), duplicate, delete slides; edit every field inline; **multi-select slides** (⌘/Ctrl-click toggles, ⇧-click selects a range) with a batch action bar — duplicate / hide / show / delete the whole selection in one undo step; **upload your own image** for image slides (auto-downscaled to WebP, alt-text editor) **or just drop an image file anywhere on the canvas**; switch chart type (column / bar / line / area / pie / donut) per chart; **edit chart data directly in a cell grid** (labels, values, unit, source, multi-series — the chart re-renders live); per-slide AI actions (rewrite, shorten, expand, regenerate, add chart, AI illustration) plus **AI speaker notes** — generate for the current slide from the inspector, or **write notes for every visible slide that lacks them in one batch** (single undo step, live progress on the toolbar button); **⌘K command palette** — jump to any slide, insert any layout (or compose with AI), slide ops incl. move earlier/later, deck actions (present / slide board / shuffle theme / style / batch notes) and all five exports from one searchable dialog; **undo/redo** (⌘Z / ⇧⌘Z, 40-step history); **hide/show slides** (H — hidden slides are skipped in present mode and all exports, with a badge + hint chip in the editor); **per-slide transition override** (inherit / none / fade / rise / zoom / slide) **plus a deck-wide default transition** in the style popover (per-slide overrides still win); **slide board (G)** — a full-canvas sorter grid of every slide with captions: drag to reorder, click to select (batch ops work), double-click to jump back to the canvas; **shuffle design system** button for one-click instant re-theming; **keyboard shortcuts** (J/K or ↑↓ navigate, ⌘D duplicate, Del delete — works on the whole selection, Esc clears selection, `?` cheat-sheet); a live **"N visible · ~X min" talk-time chip**. Autosaves; the header logo and a toolbar back button return to the deck library.
- **Present mode** — fullscreen, keyboard navigation (← → Space Home End N **V G** Esc), click zones (left ≈28% back / right forward), transient on-entry key hints, **click-to-seek gradient progress bar**, speaker notes, **slide overview grid (G)**, **blank-screen shutter (B — hide the slide to pull the audience's attention back, click or B to restore)**, **presenter view (V) — live notes, next-slide preview, elapsed time and auto-play status in a dedicated sidebar with a drag-to-resize handle (arrow keys work too; width persists)**, **presenter timer**, **auto-play (P) with per-slide speed (5/10/15/20 s) and optional deck loop — both persisted between sessions** for kiosk-style replay, theme-driven Framer Motion transitions that respect `prefers-reduced-motion`.
- **Export** — PPTX (editable, native charts, theme fonts/colors), PDF (print CSS at exactly 1280×720 per page), standalone HTML (self-contained, no server needed), **speaker notes as Markdown** (per-slide notes + on-slide bullets), and a **deck file (.json)** — the same shape the import flow accepts, so export → import round-trips theme, slides and meta (accent, footer, transitions, notes).
- **Deck library** — search your decks by **title, slide content or design system**, duplicate, delete (with confirmation) and **JSON import** (`.deck.json`) — matching the editor's deck-file export for backup and portability. Cards show the deck's **design-system name with an accent dot**, a **mini outline of the first two slide titles** behind the theme's accent edge, slide count and **relative timestamps** ("5m ago", "2h ago"…).

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
