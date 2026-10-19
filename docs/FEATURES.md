# DeckForge AI

Prompt-to-presentation studio: describe a topic or drop your own data, and get a
designed, editable 16:9 deck — then present it and export it (PPTX / PDF / HTML).

![stack](https://img.shields.io/badge/Next.js%2016-App%20Router-black) ![ts](https://img.shields.io/badge/TypeScript-5-blue) ![tailwind](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8)

## Features

- **Landing page ("billposter" design)** — ink/paper bands with a single poster-yellow accent and zero gradients, with the product as its own hero: a **live specimen screen** cycling real slides rendered by the actual theme-token pipeline across all 24 design systems (REEL n/24 counter with play/pause/prev/next), a **numbered method strip** (Brief → Outline → Design → Present & export), the functional **workbench** (brief job-ticket card, materials dropzones, design-system gallery), a **House Rules** band, and a structured colophon footer. Anchor nav (`METHOD / WORKBENCH / SYSTEMS / DECKS`), all animations honoring `prefers-reduced-motion`.
- **Prompt input** — one box for the topic, plus audience, **tone (6 presets)**, **density (concise / standard / text-heavy ≈ 20/40/60 words per slide)**, **narrative strategy (Auto + 10 presets)**, slide count (4–30) and language. A rotating **“More ideas”** pool of 12 starter prompts is one click away.
- **Narrative strategies** — 10 battle-tested deck structures from the decksmith lineage: **YC Seed** (Cover→Problem→Solution→Traction→Market→Product→Team→Model→Ask→Thanks), **Kawasaki 10** (10/20/30 default), **Series A** (+unit economics, moat, GTM, financials), **Sales Pitch** (PAS + case studies + pricing), **Duarte Sparkline** (What Is ↔ What Could Be), **QBR**, **Weekly Report**, **Educational**, **Manifesto**, **Demo Day**. **Auto** detects the strategy from your brief via keyword scoring and follows its section arc, slide-count range and emotion curve. Per-layout **copywriting formulas** (PAS / AIDA / FAB / BAB / COI), content bans (no repetitive bullets, no eyebrow overuse, no “01/02” stamps everywhere) and pacing rules (never 3 same layouts in a row) are injected into every prompt.
- **Data input** — upload CSV / XLSX / JSON, a screenshot of a chart (AI vision extracts the values), or paste a Mermaid diagram — **or just drop the file anywhere on the landing page**. The AI chooses *how* to chart your data; **the numbers themselves are computed from your file** and can never be invented.
- **Markdown paste → outline** — a dedicated data tab parses pasted markdown deterministically (no AI rewriting): `#` becomes the deck title (auto-cover slide), `##` becomes slides, bullets become the brief, `[chart]` / `[stats]` / `[quote]`… tags pick the layout, `@layout:` works as an alternative directive. A live preview shows slide/bullet counts before you build; when Auto theme is selected a keyword heuristic suggests the design system. Your structure stays exactly as written.
- **Outline-first pipeline** — the AI proposes a structured outline (you can edit it), then writes each slide with streaming progress and a **live per-slide status list** (pending / writing / done / error dots). Every slide gets one of 11 fixed layouts so text always fits; per-layout budgets auto-shrink instead of overflowing. **Regenerate any outline item individually** (RefreshCw button or `R` on the focused row) — layout is pinned, only the angle re-rolls, with an undo action on the confirmation toast; long titles (>60 chars) get an amber nudge chip.
- **24 curated design systems** — the original eight (**Corporate Clean, Minimal Mono, Bold Impact, Playful Pop, Dark Elegant, Editorial Serif, Tech Modern, Warm Earth**), eight distilled in wave 1 from real decksmith/design-skill templates: **E-Ink Editorial** (paper/ink magazine), **Ivory Ledger** (monochrome typographic restraint), **Pitch Book** (oxblood + deep-green finance serif), **Signal Navy** (institutional navy + antique gold), **Forest Grove** (botanical dark, Playfair), **Cyber Terminal** (CRT scanlines, mint JetBrains Mono), **Biennale Yellow** (parchment + indigo art poster), **Paper Collage** (sticky-note pastels, Shrikhand) — and eight more in wave 2 from the decksmith template library: **Tokyo Night** (indigo IDE glow), **Pixel Orbit** (neon arcade, Tektur), **Vellum** (periwinkle field, lemon Cormorant), **Retro Win95** (silver desktop, navy title bars, Press Start 2P), **Neo Brutalist** (3px ink borders, hard shadows, Archivo Black), **Sakura Chroma** (riso-print cream + overprint reds), **Cobalt Grid** (electric cobalt ink on ivory), **Pastel Card** (soft-share pastel panels) — or **Auto**: the AI picks the best match for topic + tone and explains why. Switching theme re-styles the entire deck instantly. The gallery has **live search** and **style filter chips** (All / Light / Dark / Warm / Playful / Editorial / Tech) with a live count and empty state.

**Template provenance:** the theme catalog is distilled — 8 curated design systems + 16 themes pulled from the user's decksmith template library (`upload/decksmith-extracted/`, read-only reference) and curated design-skill templates. Source `:root` palettes and font stacks are read from the actual CSS, never guessed; contrast is verified per theme and enforced by an automated WCAG test (`tests/unit/themes-contrast.test.ts`).
- **Deck style & branding** — layer a custom **accent color** over any theme (bullets, stats, rules, chart series and even the library cards re-tint instantly on every slide); **contrast is derived automatically** (WCAG): accent-*filled* chips/pills always get readable text, and accent-as-*text* (kickers, stat values, section labels) is **darkened until it passes 4.5:1 on light backgrounds** while staying untouched on dark themes — the same derived color flows into PPTX exports; set a custom **footer text** (defaults to the deck title) and toggle **page numbers**. Persisted with the deck and carried through PPTX / PDF / HTML exports.
- **Editor** — reorder (**drag** in the thumbnail rail, **⌥↑/⌥↓** on the keyboard, or the ⌘K palette), add (layout picker with all 11 layouts **plus an AI composer — type a topic and a full slide (copy, layout, speaker notes) is written and inserted after the current one; composed stats slides are flagged with an “Illustrative figures” footnote, toggleable in the inspector**), duplicate, delete slides; edit every field inline; **multi-select slides** (⌘/Ctrl-click toggles, ⇧-click selects a range) with a batch action bar — duplicate / hide / show / delete the whole selection in one undo step; **upload your own image** for image slides (auto-downscaled to WebP, alt-text editor) **or just drop an image file anywhere on the canvas**; switch chart type (column / bar / line / area / pie / donut) per chart; **edit chart data directly in a cell grid** (labels, values, unit, source, multi-series — the chart re-renders live); per-slide AI actions (rewrite, shorten, expand, regenerate, add chart, AI illustration) plus **AI speaker notes** — generate for the current slide from the inspector, or **write notes for every visible slide that lacks them in one batch** (single undo step, live progress on the toolbar button); **⌘K command palette** — jump to any slide, insert any layout (or compose with AI), slide ops incl. move earlier/later, deck actions (present / slide board / shuffle theme / style / batch notes) and all five exports from one searchable dialog; **undo/redo** (⌘Z / ⇧⌘Z, 40-step history); **hide/show slides** (H — hidden slides are skipped in present mode and all exports, with a badge + hint chip in the editor); **per-slide transition override** (inherit / none / fade / rise / zoom / slide) **plus a deck-wide default transition** in the style popover (per-slide overrides still win); **slide board (G)** — a full-canvas sorter grid of every slide with captions: drag to reorder, click to select (batch ops work), double-click to jump back to the canvas; **shuffle design system** button for one-click instant re-theming; **keyboard shortcuts** (J/K or ↑↓ navigate, ⌘D duplicate, Del delete — works on the whole selection, Esc clears selection, `?` cheat-sheet); a live **"N visible · ~X min" talk-time chip**. Autosaves; the header logo and a toolbar back button return to the deck library.
- **Present mode** — fullscreen, keyboard navigation (← → Space Home End N **V G** Esc), click zones (left ≈28% back / right forward), transient on-entry key hints, **click-to-seek gradient progress bar**, speaker notes, **slide overview grid (G)**, **blank-screen shutter (B — hide the slide to pull the audience's attention back, click or B to restore)**, **presenter view (V) — live notes, next-slide preview, elapsed time and auto-play status in a dedicated sidebar with a drag-to-resize handle (arrow keys work too; width persists)**, **presenter timer**, **auto-play (P) with per-slide speed (5/10/15/20 s) and optional deck loop — both persisted between sessions** for kiosk-style replay, theme-driven Framer Motion transitions that respect `prefers-reduced-motion`.
- **Export** — PPTX (editable, native charts, theme fonts/colors), **PPTX pixel-perfect** (full-bleed 2× PNG renders of each slide via html-to-image — identical to screen, with progress indicator, for projector-fidelity or when custom accents/fonts need exact reproduction), **PNG of the current slide** (2× resolution download), PDF (print CSS at exactly 1280×720 per page), standalone HTML (self-contained, no server needed), **speaker notes as Markdown** (per-slide notes + on-slide bullets), and a **deck file (.json)** — the same shape the import flow accepts, so export → import round-trips theme, slides and meta (accent, footer, transitions, notes).
- **Speaker notes, presenter-grade** — notes are generated as **concise talking points plus one delivery cue** (e.g. “pause here”, “ask the room”) instead of verbatim scripts, so they guide natural delivery.
- **HTML Template Studio (mode 2)** — the user's decksmith engine, re-adopted in full: a landing **mode switch** (`STUDIO — STRUCTURED` | `TEMPLATE STUDIO — HTML DECKS`) opens a gallery of **all 57 real HTML templates** served from `public/templates/` — 45 open-design decks (self-contained HTML/CSS + shared runtime) plus **JS-library templates**: 7 reveal.js themes, 2 impress.js, 2 shower, 1 dzslides (runtimes vendored at `public/revealjs/` + `public/frameworks/`). Cards show palette dots, category, framework badge and a **lazy iframe preview** (IntersectionObserver — only visible templates mount their preview). Pick a template → write the brief → the AI drafts an outline, then fills **each slide with the template's own class vocabulary** (batched SSE with per-slide progress), preserving the template's design system exactly. Or hit **FROM SCRATCH** and the AI builds a standalone deck on **reveal.js** (14 vendored themes, full plugin set) or **plain HTML/CSS/JS** — with decksmith's complete prompt engineering: 10 narrative strategies, copywriting formulas, content bans, quality floors. Generated decks are saved to the database (`HtmlDeck`), rendered in a sandboxed iframe viewer (opaque origin + CSP, so deck HTML can never touch app cookies/storage) with **PRESENT** (fullscreen, the deck's own keyboard nav), **.HTML download** (self-contained file), **PNG · this slide**, **PPTX · snapshot** (html-to-image → full-bleed 16:9 PPTX; open-design + reveal engines) and **open in new tab**. The **Template Decks library** lists them alongside studio decks (engine badge, palette dots, delete). Speaker notes embed as hidden `.notes` elements (assembler injects the hide-rule for self-contained templates), and font stylesheets are CORS-attributed at assembly time so snapshot exports can inline webfonts.
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
    design/themes.ts       # 24 themes as complete design-token sets
    ai/strategies.ts       # 10 narrative strategies, copy formulas, bans & pacing
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
                           # ai/outline-item (per-item regenerate), data/analyze,
                           # data/chart-image, generate/image, decks CRUD
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
