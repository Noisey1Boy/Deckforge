# Council Decision — DeckForge AI × decksmith merge plan

> Chair synthesis of 4 council personas (Design Director, Product Strategist, Staff Engineer, The Presenter).
> Inputs: full decksmith inventory, current-app extension-point map, installed-skills principles (docs/council/brief.md + p1–p4 verdicts in docs/council/).

## Verdict summary

**Positioning (philosophy reconciliation):** DeckForge stays structured — that is not the anti-reference; *sameness* is. "Designed, not generated" is achieved with: (1) narrative strategies so decks have arcs, (2) copywriting formulas per slide type, (3) content-level bans + quality floors in prompts, (4) 8→16 distinct token themes, (5) editable structured output + data integrity (AI never invents numbers). decksmith's HTML-codegen mode is **not** adopted.

## ADOPT (priority order)

| # | Decision | Owner file(s) | Value | Effort |
|---|----------|---------------|-------|--------|
| 1 | **10 deck strategies** (yc-seed, kawasaki-10, series-a, sales-pitch, duarte-sparkline, qbr, report-weekly, educational, manifesto, demo-day) as a Strategy enum + auto-detect from brief keywords; drives outline structure, slide-count guidance, emotion arc | `src/lib/ai/strategies.ts` (new), outline route, CreateView | ★★★★★ | Low |
| 2 | **Copywriting formulas** PAS/AIDA/FAB/BAB/COI mapped per layout, injected into outline + slide prompts | strategies.ts, slides route | ★★★★★ | Low |
| 3 | **Content bans + quality floors + pacing** in prompts (no identical card grids, no eyebrow overuse, no 01/02 markers everywhere, line length, no overflow → split slide, never 3 feature-grids in a row, slide 1 title / last CTA) | outline + slides routes | ★★★★ | Low |
| 4 | **Tone (6 enums) + Verbosity (3 enums: concise/standard/text-heavy ≈ 20/40/60 words)** in GenSettings → outline + slide prompts; **fix audience/tone forwarding bug** (GeneratingView drops them today) | deck-store.ts, CreateView, GeneratingView, routes | ★★★★ | Low |
| 5 | **Per-slide regenerate + status in OutlineView** (pending/loading/done/error affordances; regenerate single item via new `/api/ai/outline-item`) | OutlineView.tsx, new route | ★★★★ | Medium |
| 6 | **6 new themes** distilled from decksmith top templates + design-skill ppt templates (distinct from existing 8): e-ink magazine, finance pitch-book, neon-yellow art biennale, forest organic grove, terminal/CRT cyber, pastel paper-collage — real palettes/fonts pulled from source CSS, token-governed | themes.ts, layout.tsx, html.ts, TemplateGallery SAMPLES, HeroSpecimen | ★★★★ | Medium |
| 7 | **TemplateGallery search + filter chips** (category/style/bestFor metadata already on items) | TemplateGallery.tsx | ★★★ | Low |
| 8 | **PPTX pixel-perfect snapshot export** (html-to-image → full-bleed PNG slides) as a second PPTX mode + per-slide PNG export | new pptx-snapshot.ts, ExportMenu, CommandPalette, `bun add html-to-image` | ★★★ (Presenter ranks #1) | Medium |
| 9 | **Speaker-notes quality upgrade**: concise talking points + delivery cues (not verbatim scripts), consistent with outline notes | ai/slide notes action, slides route | ★★★ | Low |

## DO NOT ADOPT (ponytail discipline, unanimous)

- Free-form HTML codegen engine + 5-framework contracts (architecture mismatch, bloat)
- The 57-template library / vendored reveal.js + impress.js + shower runtimes (9.4 MB)
- localStorage persistence, decksmith's multi-page wizard (current single-route flow is stronger)
- `_shared/runtime.js` in HTML export (current React-rendered export already ships nav)
- Verbatim presenter scripts (150–300 char scripts read badly live)
- Landing page redesign (billposter style is strong; minor polish only)

## Parallel task division (disjoint file ownership)

| Task ID | Scope | Owns (write) | Reads |
|---------|-------|--------------|-------|
| M-a | Pipeline & settings: strategies/formulas/bans/floors/pacing + tone/verbosity enums + audience forwarding fix + per-slide status in GeneratingView + notes-quality prompt | `src/lib/ai/strategies.ts`*, `src/lib/store/deck-store.ts`, `src/app/api/generate/outline/route.ts`, `src/app/api/generate/slides/route.ts`, `src/app/api/ai/slide/route.ts`, `src/components/app/CreateView.tsx`, `src/components/app/GeneratingView.tsx` | brief, themes.ts |
| M-b | Theme expansion (6 new) + gallery search/filters | `src/lib/design/themes.ts`, `src/app/layout.tsx`, `src/lib/export/html.ts`, `src/components/app/TemplateGallery.tsx`, `src/components/app/landing/HeroSpecimen.tsx`, `src/components/deck/deck.css` (decor only), `src/components/deck/SlideView.tsx` (Decor switch only if new motif) | decksmith template CSS, skills/design/design-templates/ppt |
| M-c | Outline UX: per-slide status + retry + regenerate single item | `src/components/app/OutlineView.tsx`, `src/app/api/ai/outline-item/route.ts`* | deck-store.ts (no writes) |
| M-d | Snapshot exports: PPTX pixel-perfect + slide PNG | `src/lib/export/pptx-snapshot.ts`*, `src/components/app/ExportMenu.tsx`, `src/components/editor/CommandPalette.tsx`, package.json | pptx.ts, ScaledSlide |
| M-e | Integration QA: lint, agent-browser E2E, fixes, README + worklog | everything (after M-a…M-d land) | all |

\* = new file. Conflicts avoided: each task writes only its own files; shared reads are safe.

## Acceptance criteria
- `bun run lint` clean; dev server healthy; no console errors.
- E2E: brief with strategy Auto + tone + verbosity → outline reflects strategy arc → generate → editor → present → exports incl. new snapshot PPTX.
- 16 themes render correctly in gallery (search + filters), editor switcher, Auto picker, and all exports.
- Outline per-slide regenerate works; generating view shows per-slide status.
- All existing features still work (undo/redo, board, present, deck library, .deck.json round-trip).
