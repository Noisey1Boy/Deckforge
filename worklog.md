# DeckForge AI — Shared Worklog

---
Task ID: 1
Agent: research-agent
Task: Phase 0 research — open-design + awesome-design-md analysis, 4 skills install, docs/design-analysis.md

Work Log:
- Read shared worklog: did not exist yet (created with this entry).
- Network: GitHub API intermittently rate-limited (403/403-rate-limit), but `git clone --depth 1` worked for all 5 repos → cloned to /tmp: nexu-io/open-design @53231d4, VoltAgent/awesome-design-md @f696123, Jeffallan/claude-skills, DietrichGebert/ponytail, pbakaus/impeccable.
- Analyzed open-design: (a) `design-templates/html-ppt` slide system — `assets/base.css` shared token `:root` + layout primitives, 36 themes as single `:root`-override CSS files, 31 single-page layout archetypes, 27 `data-anim` animations, keyboard/presenter runtime; (b) `html-ppt-zhangzara-*` templates with `template.json` theme manifests (mood/tone/occasion/palette/typography/best_for/avoid_for); (c) `design-systems/_schema/tokens.schema.ts` — A1-identity/A1-structure/A2-required-with-fallback/B-slot/C-extension token governance.
- Analyzed awesome-design-md (74 DESIGN.md files): extracted colors/typography YAML for candidates; curated 8 systems, one per planned theme: stripe→corporate-clean, vercel→minimal-mono, theverge→bold-impact, nintendo-2001→playful-pop, linear.app→dark-elegant, wired→editorial-serif, raycast→tech-modern, starbucks→warm-earth (+ alternates nike, notion, spotify).
- Checked skills/ before installing: found `ui-ux-pro-max` already installed (verified upstream = nextlevelbuilder/ui-ux-pro-max-skill via references/upstream-README.md) → skipped re-install; ponytail/impeccable/claude-skills not present.
- Installed: `skills/ponytail/` (core skill, self-contained 120 lines). `skills/impeccable/` (skill/ copied; SKILL.src.md → SKILL.md with installer-equivalent substitutions: {{command_hint}} → 24 command names, {{scripts_path}} → skills/impeccable/scripts, {{command_prefix}} → `/`, stripped `<!-- rule:... -->` markers; fixed double-prefix artifacts; launcher binary not vendored — skill has documented read-PRODUCT/DESIGN fallback). `skills/claude-skills/` (curated pack: architecture-designer + code-reviewer sub-skills verbatim + router SKILL.md; 63 other upstream skills noted but not copied).
- Read every installed SKILL.md and summarized key principles in docs/design-analysis.md §4.
- Wrote docs/design-analysis.md (~230 lines): open-design adopt/adapt mapping to a 16:9 template system, awesome-design-md curation table with selection criteria, full token schema (colors/fonts/type scale for 1280×720/spacing/radii/shadows/6-color chart palette/motion) + enforcement rules, skills summary.

Stage Summary:
- Decision: adopt open-design html-ppt architecture — theme = one `:root` token file + manifest (zhangzara template.json schema), 31 layout archetypes port to React slide components, all styling via CSS vars.
- Decision: token governance per open-design A1/A2/B-slot layers; build-time test enforces every theme declares the full required token set (missing var targets silently break CSS).
- Decision: 8 curated DESIGN.md systems map 1:1 to the 8 planned themes; alternates documented (nike/notion/spotify).
- Artifacts: docs/design-analysis.md; skills/claude-skills/, skills/ponytail/, skills/impeccable/ (ui-ux-pro-max pre-existing, verified).
- Next actions: port base.css → src/lib/tokens + theme compiler; theme manifests (tokens.json → :root); slide component library per 31 archetypes; token-coverage lint.

---
Task ID: 2-9
Agent: main-agent (Z.ai Code)
Task: Build DeckForge AI — full app (tokens, themes, renderer, AI pipeline, data, editor, present, exports)

Work Log:
- Design tokens: src/lib/design/themes.ts — 8 full token sets (colors, fonts, type scale, spacing, radii, shadows, chart palettes, motion, decor motifs) curated from docs/design-analysis.md
- Renderer: SlideView (11 layouts) + deck.css (CSS-var-driven), ScaledSlide (16:9 transform scaling), SlideChart (Recharts, theme palette, SSR-safe fixed mode), SlideDiagram (BFS-layered SVG)
- AI pipeline: /api/generate/outline (auto theme pick), /api/generate/slides (SSE stream, 2-way concurrency, ordered emission), /api/ai/slide (rewrite/shorten/expand/regenerate/add_chart), /api/generate/image
- Data: client-side CSV/XLSX/JSON parsing (src/lib/data/parse.ts), /api/data/analyze (AI picks chart config ONLY; client computes numbers → no invented data), /api/data/chart-image (VLM extraction), Mermaid → DiagramSpec
- Data integrity fix: chart slides without verified user data now fall back to qualitative bullets (AI can never fabricate numbers)
- Persistence: Prisma Deck model, /api/decks CRUD + autosave (1.2s debounce)
- Editor: drag-reorder thumbnails, add/duplicate/delete, inline inspector editing for all layouts, layout swap, AI actions, theme switcher
- Present mode: fullscreen, keyboard nav (←/→/Space/Home/End/N/Esc), progress bar, speaker notes, theme-driven Framer Motion transitions honoring prefers-reduced-motion
- Exports: PPTX via PptxGenJS v4 (native editable charts — fixed BarDir API), PDF via print CSS (@page 1280px×720px + hidden PrintSurface), standalone HTML via client-side renderToStaticMarkup (charts fixed-size, /api/export/deck-css serves stylesheet)
- Infra fixes: getTheme missing import crash, react-dom/server unimportable in route handlers (moved HTML export client-side), SSE guard for client disconnects, reduced generating-view DOM weight

Stage Summary:
- E2E verified with agent-browser: landing → outline (Auto theme w/ rationale) → streamed generation (~20s for 10 slides) → editor → present mode (notes/keyboard) → live re-theme (Corporate→Dark Elegant) → exports (PPTX w/ native chart + theme colors; standalone HTML w/ recharts SVG; PDF via print)
- Data flow verified: sales.csv → real stats in outline ($12.07M exact sum) → chart slides carry EXACT CSV values
- All lint clean; dev server stable on :3000

---
Task ID: final
Agent: main-agent (Z.ai Code)
Task: Deliverables, verification summary and handover

Work Log:
- Verified end-to-end with agent-browser: prompt → outline (editable, Auto-theme with rationale) → SSE slide generation (10 slides ≈ 20s, 2-way concurrency) → editor → present mode (keyboard nav, notes, progress) → live re-theme → PPTX/HTML exports
- Data fidelity verified: sales.csv (6 regions) → outline cites real aggregates ($12.07M = exact sum) → chart slide carries exact CSV values; AI-invented charts now blocked (fallback to bullets)
- PPTX verified by unzipping: 4 slides + native chart1.xml + theme colors applied
- Standalone HTML verified: 10 stages, recharts SVG + diagram SVG inline, nav/print script embedded
- Fixed during verification: missing getTheme import (crashed app), react-dom/server unavailable in route handlers (HTML export moved client-side), recharts empty render in static export (cloneElement width/height injection), pptxgenjs v4 BarDir API change, SSE stream guard on client disconnect
- Cron webDevReview task created (job 426995, every 15 min, Asia/Dhaka)
- README.md written (setup, architecture, how to add a template, limitations)

Stage Summary:
- Deliverables: working app on / (single route), README.md, docs/design-analysis.md, worklog.md
- Stack: Next.js 16 + TS, Tailwind 4 + shadcn/ui, Zustand, Prisma/SQLite, Framer Motion, Recharts, PptxGenJS, z-ai-web-dev-sdk (server-side only)
- 8 design systems, 11 layouts, outline-first AI pipeline, data-grounded charts, editor, present mode, 3 export formats
- Known limitations listed in README (multi-user auth, PPTX diagram linearization, print-dialog PDF, vision accuracy for chart images)
