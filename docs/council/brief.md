# Council Brief — Improving DeckForge AI using the decksmith codebase + installed skills

## Situation
DeckForge AI (active app, /home/z/my-project): Next.js 16 structured presentation generator.
- JSON slides → 11 React layouts → 8 token-driven themes → 1280×720 canvas.
- Pipeline: prompt/data → AI outline (editable) → SSE slide generation (2-way concurrency) → editor → present mode → exports (PPTX native editable charts, PDF print, standalone HTML, notes MD, .deck.json).
- Editor: undo/redo, multi-select, board view, inspector, AI actions (rewrite/shorten/expand/regenerate/compose), ⌘K palette, autosave (Prisma/SQLite, 24 decks in library).
- Present: keyboard nav, notes, overview grid, presenter view w/ resizable notes, autoplay, 4 transitions, B-key shutter.
- Landing already redesigned twice (current: "billposter" ink+yellow impeccable style).
- Weak points: copy quality is generic in places; 8 themes limited visual variety; no narrative strategy; no tone/verbosity enums; TemplateGallery has no search/filters; outline UI lacks per-slide status/retry affordances.

decksmith (user's previous app, /home/z/my-project/upload/decksmith-extracted): free-form HTML codegen generator.
- 57 templates across 5 frameworks (45 open-design, 7 reveal.js, 2 impress.js, 2 shower, 1 dzslides), vendored runtimes (9.4MB), template.json manifests (name/tagline/category/style/palette/fonts/bestFor/tags), gallery with search+category chips+lazy iframe previews+palette dots.
- 3-stage pipeline: outline → per-slide HTML (batch 3) → assemble. localStorage only (max 20 decks).
- Prompt engineering assets (in src/lib/presentation/system-prompt.ts + slide-prompt.ts):
  - 10 STRATEGIES: yc-seed (10-12: Cover→Problem→Solution→Traction→Market→Product→Team→Model→Ask→Thanks), kawasaki-10 (10/20/30 default), series-a (12-15: +unit economics, moat, GTM, financials), sales-pitch (PAS + 3 case studies + pricing + CTA), duarte-sparkline (What Is ↔ What Could Be alternation), qbr (KPIs, wins/misses, blockers, next-quarter), report-weekly (6-8: cover, KPI grid, ship list, blockers), educational (8-12: hook, objectives, concepts, examples, exercises, summary), manifesto (5-8: thesis, 3 pillars, CTA), demo-day (5-7: Cover→Problem→Solution→Traction→Team→Ask).
  - 5 COPYWRITING FORMULAS mapped per slide type: PAS→problem, AIDA→title/CTA, FAB→solution/feature, BAB→transformation, COI→risk/urgency.
  - BANS (content-level): no identical card grids, no eyebrow on every section, no 01/02 markers on every slide, no text overflow (split the slide), no bounce easing, transform/opacity-only animation.
  - QUALITY FLOORS: contrast ≥4.5:1, line length 65-75ch, clamp() headlines ≤6rem, display letter-spacing ≥-0.04em, 4pt spacing scale, touch ≥44px, reduced-motion, text-wrap balance/pretty.
  - MOTION RULES: ease-out-expo cubic-bezier(0.16,1,0.3,1), reveals never gate visibility, stagger 0/100/200/300/400ms.
  - Tone (6: default/casual/professional/funny/educational/sales-pitch) + Verbosity (3: concise/standard/text-heavy = 20/40/60 words per slide) params; audience + focus(free text).
  - Layout pacing rules: slide 1 = title, slide 2 = problem/section-divider, last = cta/title, never 3 feature-grids in a row.
- Per-slide regenerate + per-slide status (pending/loading/done/error) + outline inline edit.
- PPTX export via html-to-image PNG snapshot (pixel-perfect, not editable).
- Weaknesses vs DeckForge: no structured editing (HTML strings), no native PPTX charts, localStorage only, no data-integrity guard (AI can invent numbers), template manifests have placeholder palettes for 15/57 templates.

Installed skills (excerpt of what matters):
- ui-ux-pro-max: data/styles.csv = 69 styles each with AI prompt keywords + CSS keywords; data/landing.csv = 32 conversion patterns; data/charts.csv, typography.csv.
- design skill: skills/design/design-templates/ppt/ = 8 curated deck themes (guizang-ppt e-ink magazine, ib-pitch-book finance, zhangzara 8-bit-orbit, biennale-yellow, grove, pin-and-paper, retro-windows, retro-zine) each with SKILL.md + pattern.html + token spec; design-systems/brand-inspiration/ DESIGN.md files.
- impeccable principles (bans/floors/committed color), ponytail (minimal scope), claude-skills (ADR + review), storyboard-manager (story structures: three-act, hero's journey, scene/sequel pacing).
- LLM CLI verified: `z-ai chat -s "system" -p "$(cat file)" -o out.json`.

## Known extension points (exact, low risk)
- New theme = append ThemeManifest to THEMES (src/lib/design/themes.ts) + fonts to layout.tsx FONTS_HREF + html.ts FONT_HREF + TemplateGallery SAMPLES entry + HeroSpecimen SPECIMENS entry. Everything else automatic (gallery, editor switcher, all exports, Auto-theme picker).
- Gen settings: GenSettings in src/lib/store/deck-store.ts → CreateView form → /api/generate/outline (OutlineReq) + /api/generate/slides (GenReq, buildSlidePrompt) + GeneratingView (currently drops audience/tone — bug).
- New export: src/lib/export/<mode>.ts + ExportMenu useExportActions + CommandPalette ExportKind.
- Gallery filters: TemplateGallery.tsx only (items carry tone/description/bestFor).
- html-to-image: NOT installed (bun add needed). @dnd-kit present unused. sharp present unused.

## Decision questions for the council
1. Which decksmith assets should be adopted into DeckForge, in what priority order? (Consider: strategies, copywriting formulas, bans/floors, tone+verbosity enums, audience forwarding fix, per-slide regenerate/status UX, template gallery search+filters, theme expansion using decksmith/design-skill palettes, PPTX pixel-perfect snapshot export mode, HTML export upgrade using _shared/runtime.js, anything else you see.)
2. How to reconcile the philosophy conflict (decksmith PRODUCT.md calls template-locked generators an anti-reference) — what makes DeckForge "designed, not generated"?
3. What should NOT be adopted (scope discipline — ponytail)?
4. Propose a concrete task breakdown for parallel agents (3-5 tasks, each self-contained with file paths), ordered by value/effort.
Constraints: single Next.js route (/), keep structured architecture + data-integrity guard, keep all existing features working, bun + Next 16 + Tailwind 4 + shadcn/ui, no new heavy vendored runtimes unless justified, all styling via tokens, WCAG AA, prefers-reduced-motion. Time budget: one working session.
