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

---
Task ID: r2 (cron review round 2)
Agent: webDevReview agent
Task: Status assessment + QA, then feature round: undo/redo, deck library, present upgrades, styling polish

Work Log:
- Status assessment: lint clean, page 200, no console errors; dev.log errors were all historical (pre-fix sessions). Phase stable → chose feature + styling work.
- F1 Undo/redo: deck-store now keeps past/future snapshot stacks (40 entries) with a `commit()` wrapper; updateSlide/reorder/insert/remove/duplicate/setDeckTheme all snapshot; undo()/redo() swap stacks; editor toolbar gets a bordered undo/redo pair with tooltips + ⌘Z / ⇧⌘Z / Ctrl+Y keyboard shortcuts (skips INPUT/TEXTAREA targets). Verified in browser: delete slide → 4→3 slides, undo → 4, redo → 3, undo → 4.
- F2 Deck library (new RecentDecks component): theme color gradient band + color dot per card, slide-count chip, hover actions (export .deck.json, duplicate, delete with shadcn AlertDialog confirm), Import JSON button (validates shape, caps 60 slides), skeleton loading + dashed empty state. Verified: duplicate created "(copy)" deck, delete dialog renders and removes, import path verified against the exact API contract.
- F3 Present mode: presenter timer (mm:ss, resets on entry, 500ms tick) and slide overview grid — G key or grid button, all slides as scaled thumbnails with current-slide highlight, click-to-jump, Esc/G closes, click-outside closes. Verified via screenshots.
- S1 Styling polish: framer-motion view transitions between create/outline/generating/editor (skipped under prefers-reduced-motion); landing hero got a masked dot-grid texture + "Prompt → Design → Present → Export" how-it-works chip strip; editor toolbar regrouped with dividers and history group; deck title truncates.
- Fixed during round: react-hooks/set-state-in-effect lint error in timer effect (moved reset out of effect body, 500ms tick); stale `recent` reference from mid-refactor (transient Fast Refresh error, resolved).
- README updated (undo/redo, G overview, timer, deck library/JSON import-export).

Stage Summary:
- New: undo/redo history, deck library management (duplicate/delete/JSON in+out), presenter timer, slide overview grid, animated view transitions, landing/toolbar polish.
- All verified in browser; lint clean; page healthy.
- Risks/next: JSON import UI couldn't be exercised via hidden-file-input automation (API contract verified directly); consider upload progress toasts, image-slide file upload (data URL), per-slide transition override, multi-select reorder; deck list pagination if library grows.

---
Task ID: r3 (cron review round 3)
Agent: webDevReview agent
Task: Status assessment + browser QA, then feature + styling round (image upload, chart switcher, editor shortcuts, present polish)

Work Log:
- Status assessment: dev.log clean (only Prisma query noise + historical 200s), page 200, lint clean, no runtime console errors on fresh load. Phase stable → chose feature + styling work per round mandate.
- F1 Image upload for image slides (SlideInspector): file input → FileReader → canvas downscale (long edge 1600px, WebP q0.85; keeps original if already small) → data URL into slide.image; guards type (PNG/JPG/WebP/GIF/AVIF) + 8 MB size; UI = dashed dropzone + "Choose file" when empty, preview with hover remove (Trash) when set, plus "Replace image" URL field and alt-text editor. Verified in browser: uploaded /tmp/test-upload.png → full-bleed image layout rendered, preview + fields shown. Data URLs flow through PPTX export (addImage path) and HTML export unchanged.
- F2 Chart type switcher (SlideInspector): segmented 6-icon radiogroup (column/bar/line/area/pie/donut, lucide) writes slide.chart.kind; theme palette + PPTX native-chart mapping already support all kinds. Verified: flipped deck's real "Revenue by Region" chart to donut and back to column in browser.
- F3 Editor keyboard shortcuts (EditorView): J/K or ↑/↓ navigate slides, ⌘D duplicate current, Del/Backspace delete current (blocked at 1 slide; toast with undo hint), ⌘Z/⇧⌘Z/Ctrl+Y history, `?` toggles cheat-sheet; all no-ops while typing (INPUT/TEXTAREA/SELECT/contentEditable). Toolbar got a Keyboard icon button. Shortcuts cheat-sheet = shadcn Dialog with kbd-styled rows. Verified: J J → 1→3, Ctrl+D → 11 slides, Ctrl+Z → 10, ? → dialog renders.
- F5 Add-slide layout picker: "Add slide" is now a DropdownMenu listing all 11 layouts with icons (Type/Hash/List/Columns2/Sigma/BarChart3/Workflow/Table2/Quote/Image/Flag); inserts after current slide. Verified: added Chart slide, then Image slide.
- F4 Present mode (PresentOverlay): split click zones (left 28% back with cursor-w-resize, right 72% forward), transient keyboard hint chip "← → navigate · N notes · G grid · Esc exit" implemented as pure CSS animation (deck.css df-hint-fade 4.2s forwards; 0.6s under prefers-reduced-motion) — avoids setState-in-effect lint and JS timers. Verified: hint shows on entry and fades, right zone advances 4→5, left zone returns 5→4.
- S1 Editor canvas: dot-grid texture (radial-gradient 22px) + deeper shadow/ring on the slide frame; removed dead hidden mobile-strip div.
- S2 Template gallery: selected card border now uses the theme's own primary color (amber for Auto), cards get hover lift (-translate-y-0.5) + hover shadow. Verified visually (Bold Impact teal ring).
- S3 Landing entrance: framer-motion staggered fade/rise on hero (0s), prompt card (0.08s), data section (0.16s), gallery (0.22s), all disabled under prefers-reduced-motion.
- Fixed during round: missing closing </div> in inspector chart section (JSX parse error caught by lint); react-hooks/set-state-in-effect on the present-hint timer (replaced with CSS animation approach); recharts width(0) first-paint console noise (BrowserSizer: rAF-gated ResponsiveContainer mount) — 0 warnings after reload.
- README features section updated (editor shortcuts, image upload, chart switcher, present click zones/hints).

Stage Summary:
- New: image upload (data URL + downscale + alt editor), chart kind switcher, editor keyboard shortcuts + cheat-sheet dialog, layout-picker add menu, present click zones + CSS key hints, gallery accent rings + hover lift, landing staggered entrance, chart first-paint noise fixed.
- All verified in browser; lint clean; page healthy; no console errors after reload.
- Risks/next: data-URL images increase deck JSON size (downscale mitigates; consider blob storage if decks get heavy); image upload is click-only (no drag-drop onto the slide canvas yet); AI "Add chart" on a blank chart slide remains the path to fill empty chart slides; JSON import UI still untested via automation (hidden file input); deck-list pagination if library grows.

---
Task ID: r5 (cron review round 5)
Agent: webDevReview agent
Task: Status assessment + browser QA, then finish interrupted round-4 features, fix bugs, add new features + styling polish

Work Log:
- Status assessment: worklog had rounds r2/r3; dev.log + code revealed an UNLOGGED interrupted round-4 with features already committed but unverified: hidden slides (editor toggle/badge/H shortcut, honored by present + PPTX/HTML/notes exports), present autoplay (fixed 6s), speaker-notes Markdown export (src/lib/export/notes.ts + ExportMenu item), notes editor in inspector. Code was committed; only artifact missing was the worklog entry.
- FIXED (lint): react-hooks/set-state-in-effect in PresentOverlay — autoplay/elapsed reset moved out of the effect body into an exitPresent() callback (also resets timer state on re-entry; Escape + X button both route through it). Lint now clean.
- Browser QA (agent-browser, 1600x900): landing OK; opened "Global Sales Performance Review" deck; present mode (hint chip, click zones, timer, controls), autoplay advance, Escape exit, Export menu → "Speaker notes (Markdown)" runs clean; hidden-slide flow: H → badge + dashed thumbnail + present shows "1 / 9" visible count → unhide restored. dev.log clean (all 200s); module-not-found noise in old logs was transient (file exists, compiles).
- BUG FIXED (z-order): present-mode click zones (z-[1]) intercepted mouse clicks on the controls bar / notes / overview (all had no z-index) — controls were mouse-unusable; assigned explicit layers: zones z-[1], hint z-[2], controls z-[3], notes z-[4], overview z-[5]. Verified: clicks now hit the buttons.
- BUG FIXED (portal z): Radix DropdownMenuContent (z-50, portaled to body) rendered BEHIND the present overlay (z-[100]) — autoplay settings menu invisible in present mode; content now z-[110]. Verified open + select.
- BUG FIXED (Escape): Escape pressed to close the Radix menu also bubbled to the window handler and exited the whole presentation; the present Escape branch now no-ops while a Radix menu/popper is open. Verified: menu closes, deck stays up.
- F1 Present mode: autoplay speed dropdown next to Play (5/10/15/20 s, default 10) + **Loop deck** toggle (wraps to first visible slide instead of stopping — verified by seeking to end and waiting one tick); progress bar is now a click-to-seek role=slider with keyboard arrows, hover height growth, theme gradient fill (verified 50% → slide 6, 100% → last); subtle stage spotlight vignette; pulsing emerald ring on the Play button while autoplay runs.
- F2 Editor: drag & drop an image file anywhere on the canvas → current slide converts to image layout (drop overlay "Drop to fill this slide" appears on file-drag only; internal thumbnail drags ignored). Verified with synthetic DataTransfer drop: overlay shown, layout→image, alt auto-set from filename. Deck restored afterwards via undo.
- F3 Editor: amber "Hidden from presentation — press H to show" chip next to the page counter when the current slide is hidden (beyond the thumbnail badge).
- F4 Landing: starter-prompt pool expanded 4→12, deals 4 random chips per seed + dashed "More ideas" dice button to re-deal (verified rotation).
- F5 Deck library: search-by-title filter with count in the header and a "No decks match" empty state (verified "sales" match + "zzz" empty state).
- S1 Template gallery: tone badge moved onto the preview thumbnail as a dark overlay pill — full theme names ("Corporate Clean") no longer truncate to "Corporat…".
- FIX (recharts noise): recurring "width(0)/height(0)" dev warning — BrowserSizer now mounts ResponsiveContainer only after the wrapper has non-zero size (ResizeObserver, rAF fast-path). Verified 0 warnings after opening chart slides.
- Restored QA deck state via undo (2 hide-toggles + 1 image drop) and confirmed final layout back to stats with all slides visible.
- README features section updated (canvas image drop, hidden slides, click-to-seek progress, autoplay speed/loop, notes Markdown export, deck search, More ideas).

Stage Summary:
- Round-4 leftovers (hidden slides, autoplay, notes export) verified end-to-end and now documented; 3 real bugs fixed (controls z-order, dropdown behind overlay, Escape double-handling) plus the lint error and recharts warning.
- New: autoplay speed + loop, click-to-seek progress bar, canvas image drop, hidden-slide editor chip, 12-prompt "More ideas" pool, deck search, gallery badge redesign.
- All verified in browser; bun run lint clean; dev.log clean; page healthy with no console errors.
- Risks/next: data-URL images still grow deck JSON (mitigated by downscale); JSON import UI still untested via automation (hidden file input); per-slide transition override and multi-select reorder remain open ideas; consider autoplay speed persisted to localStorage; PPTX diagram linearization unchanged.

---
Task ID: r6 (cron review round 6)
Agent: webDevReview agent
Task: Status assessment + agent-browser QA, bug fixes, then feature + styling round

Work Log:
- Status assessment: lint clean, page 200, dev.log noise historical. QA via agent-browser found 2 REAL bugs (below). Phase then shifted to features per round mandate.
- BUG FIXED (hydration #1 — text): landing starter-prompt chips caused "Hydration failed — server text didn't match client". Root cause: ideaSeed initialized with Math.random() during SSR. Fix: deterministic seed 0 for SSR + first client render; random deal deferred to a 0ms timeout after mount (avoids react-hooks/set-state-in-effect). Verified badge gone.
- BUG FIXED (hydration #2 — attributes, intermittent): ~3/8 reloads fired "attributes didn't match" — Radix Tabs useId (aria-controls/id) differed between SSR and hydration (dev-mode Turbopack flake; SSR itself was deterministic over 12 curls; root cause external to app logic). Fix: replaced shadcn Tabs in CreateView data section with static-button tabs (role=tablist/tab/tabpanel, static ids data-tab-*/data-panel-*, full a11y attrs, identical styling). Result: 8/8 reloads clean. No more useId consumers on the landing.
- BUG FIXED (UX/navigation): there was NO way back to the create view from the editor (logo not clickable, no back control). Fix: header logo is now a real button (aria-label "DeckForge AI home") + new toolbar back button (ChevronLeft, aria-label "Back to all decks"). Both verified.
- F1 Chart data editor (SlideInspector): replaced the raw "label = value" textarea with a bordered cell-grid table — per-row label Input + right-aligned mono value Input + remove button (disabled at 1 row), scrollable max-h-52, header row, "Add row" (cap 12), plus Unit and Source fields, multi-series editor (only shown when series exist) and insight textarea. Verified live: editing row 1 value re-renders the chart instantly; undo restores.
- F2 Per-slide transition override: Slide type gains transition?: TransitionKind (inherit/none/fade/rise/zoom/slide, TRANSITIONS const in types.ts); inspector gets a "Transition" select (Clapperboard icon) defaulting to Inherit; PresentOverlay motionFor() honors the override, "none" renders a hard cut (initial=false, 0.08s exit). Verified select writes value + present mode renders without errors.
- F3 Presenter view (V key or Projector button in controls): dedicated sidebar layout — NOW SHOWING x/y, ELAPSED timer, full speaker notes (scrollable), UP NEXT next-visible-slide preview (click-to-jump, skips hidden), auto-play status chip; stage + click zones preserved; standard-layout notes toggle suppressed while presenter is open; exit resets presenter state. Verified in browser with notes + next preview + navigation.
- F4 Autoplay persistence: speed + loop stored in localStorage (deckforge.autoplay.speed / .loop) via lazy useState initializers with SSR guards (lint-safe); DropdownMenu writes through. Verified: 15s + loop survive full reload with menu showing checks.
- F5 Shuffle design system: toolbar Shuffle button (between theme select and layout select) applies a random other theme + toast with name/tone. Verified Corporate Clean → Warm Earth → Editorial Serif instant re-themes.
- S1 Editor thumbnails: active slide border now uses the deck theme's primary color (was fixed neutral-900) — visible in Warm Earth screenshot (rust ring).
- F6/S2 JSON import verified end-to-end (flagged untested since r2): crafted .deck.json → hidden input upload → deck in library → opens in editor with Minimal Mono theme rendered. Exactly 1 deck per import event (an earlier double was the automation tool re-firing, not an app bug; test decks deleted afterwards).
- Transient dev.log "dataTab is not defined" was mid-refactor Fast Refresh noise; confirmed NO new errors on fresh loads after final state. Final lint clean; landing/editor/present/console all healthy.

Stage Summary:
- Bugs fixed: 2 hydration mismatches (random seed SSR; Radix useId dev flake → static tabs), 1 navigation gap (no back-to-library).
- New: chart data cell-grid editor (+unit/source/series), per-slide transition override, presenter view (V), autoplay speed+loop persistence, shuffle theme button, theme-colored active thumbnail, clickable logo + toolbar back button.
- All verified in browser; bun run lint clean; README features updated.
- Risks/next: presenter view sidebar is fixed-width on desktop (could get a resize handle); data-URL images still grow deck JSON (downscale mitigates); consider per-deck export/import including transition field (already serializes automatically); a production build (next build) should be verified once outside sandbox constraints to confirm the dev-only useId flake disappears with it; multi-select slide operations remain open ideas.

---
Task ID: r7 (cron review round 7)
Agent: webDevReview agent
Task: Status assessment + browser QA, then feature + styling round (accent/branding customization, multi-select batch ops, landing data drop, outline polish)

Work Log:
- Status assessment: lint clean, page 200, dev.log clean (200s only). Browser QA: landing, deck library (4 decks), editor (toolbar/inspector/AI actions), chart slide with real CSV data + cell editor, present mode (controls/timer/progress), export menu (PPTX/PDF/HTML/Notes), console clean, no hydration issues. Phase STABLE -> feature + styling round chosen.
- PLAN this round: F1 deck accent-color override + custom footer text + page-number toggle (theme personalization, threaded through editor/present/PPTX/HTML exports via Deck.meta), F2 multi-select slide batch ops (cmd/shift-click, range select, batch duplicate/hide/delete with single undo snapshots), F3 drop data files anywhere on landing to attach, S1 OutlineView visual upgrade, S2 deck stats chip in toolbar. IN PROGRESS below.

Work Log (completed):
- F1 Accent color override + branding (Deck style popover in editor toolbar, Palette-icon with live two-tone swatch):
  - DeckMeta gains accent (hex), footerText, showPageNumbers; persisted via existing metaJson — no schema change; /api/decks list now returns meta so library cards reflect it.
  - themes.ts: applyAccent() layers hex over theme primary+accent+chart palette[0]; deckTheme(deck) resolves effective render theme; deckFooterText() helper in types.ts.
  - Threaded through: EditorView (canvas + thumbnails), PresentOverlay (stage/notes-preview/overview-grid), PrintSurface (PDF), PPTX export (primary + footer text + conditional page number), standalone HTML export, RecentDecks cards (band gradient + dot).
  - SlideView/ScaledSlide gain showPageNumbers prop (default true); present-mode previews/overview pass false so counters don't duplicate.
  - UI: 8 preset swatches + "Theme" reset + native custom color input; footer text input (80 chars, placeholder = deck title); page-numbers Switch. Verified: emerald accent re-tinted kicker/rules/stats values/chart first series/thumbnail rings INSTANTLY; footer text swapped on canvas; page number removed; deck autosaved ("Saved"); full reset works.
- F2 Multi-select batch ops:
  - Store: removeSlides/duplicateSlides/setHiddenSlides — each ONE undo snapshot; duplicate inserts copies bottom-up adjacent to originals; removeSlides never empties deck; currentSlideIndex adjusted.
  - Interaction: cmd/ctrl-click toggle, shift-click range (anchor = last plain click), plain click clears; Escape clears selection; Delete/Backspace deletes selection (ref-synced via effect for the global key handler).
  - Emerald batch action bar above thumbnails: count + duplicate/hide/show/delete/clear icons, role=toolbar, Delete works while focused; selected thumbnails get emerald ring + check badge + aria-label "(selected)".
  - Verified: cmd-click 2 → "2 selected", batch hide → both HIDDEN badges + dashed thumbs + stats chip recompute 10→8 visible (~3→~2 min); range select 1-4 → "4 selected"; batch duplicate → 10→14 slides with copies adjacent; single undo restored 10.
- F3 Landing-wide data drop: dragover/dragleave/drop on CreateView root; files route to existing handleFiles (tab auto-switches to Files), images to handleChartImage (Chart img tab); full-page dashed "Drop your data" overlay (fixed inset-2, backdrop blur) while dragging. Verified with synthetic DataTransfer drop: test.csv (3 rows × 2 cols) attached, "1 assets" badge, Files tab active.
- S1 OutlineView polish: layout icons (lucide, matches editor add-menu) inside layout select trigger AND items; numbered chips in bordered squares; card hover lift + shadow; gradient AI-picked banner with icon chip; Approve button elevated (shadow + hover translate).
- S2 Editor toolbar: live talk-time chip "N visible · ~X min" (words/110wpm + 0.25 min/slide, updates with hidden slides), xl+ screens.
- README features updated (deck style & branding, multi-select, landing drop, talk-time chip).

Stage Summary:
- All 4 features verified end-to-end in browser; accent/footer/pageNumbers persist (PUT 200s) and flow to every render + export path; lint clean; console clean; dev.log clean.
- Risks/next: accent uses raw hex over primaryContrast (very light custom accents on light themes could reduce contrast — presets chosen mid/dark; consider auto contrast fixup); JSON import of older decks without meta works (all fields optional); per-slide accent override remains an open idea; multi-select drag-reorder (move a block) not yet supported; PPTX native-chart series colors use accent only for series 1 (matches on-screen behavior).

---
Task ID: r8 (cron review round 8)
Agent: webDevReview agent
Task: Status assessment + browser QA, then feature + styling round (markdown→outline, AI speaker notes, ⌘K palette, library timestamps, hero polish)

Work Log:
- Status assessment: lint clean, page 200, dev.log healthy (200s only), landing/editor/present all render. Phase STABLE → feature + styling round chosen.
- F1 Markdown paste → outline (new "Markdown" tab in CreateView data section):
  - New parser lib src/lib/data/markdown-outline.ts — deterministic client-side parse: first `#` = deck title (+ optional `subtitle:` line), each `##` = one slide, bullets/numbered lines become the brief, `[chart]`/`[stats]`/`[quote]`… square-bracket tags or `@layout:` lines pick the layout, `###` = section break. `suggestThemeId()` keyword heuristic scores the text against the 8 design systems when Auto theme is selected.
  - LIVE parse preview chips (N slides · M bullets · deck title) as you type; "Build outline from markdown" flows into the same OutlineView (editable) → generate pipeline — zero LLM cost for outline.
  - BUG FIXED during QA: the deck title never became a slide and the first content slide was wrongly forced to `title` layout — parser now prepends a proper cover slide from the H1 (unless the markdown already marks one) and keeps user headings as content.
  - Verified end-to-end: pasted 6-section markdown → chips correct → outline (Title cover + Stats via `[stats]` tag + Closing auto-detected) → generated 6 slides → bullets faithful to the markdown ("20% of new hires…", "8 hours per new hire") → PPTX export valid (unzipped: 6 slides, correct titles).
- F2 AI speaker notes:
  - New `speaker_notes` action in /api/ai/slide (60-110 words, spoken tone, no invented stats, returns only `notes`).
  - Per-slide "Generate with AI" button in the inspector Speaker notes section (+ word/minute count under the textarea); verified: natural 700-char note written for slide 5.
  - Batch "Notes" toolbar button: sequentially generates for every VISIBLE slide missing notes, live `done/total` progress on the button, applies via NEW store action `patchSlides()` — ONE undo snapshot for the whole batch. Verified: 5 slides filled in one pass; store-level undo/redo roundtrip verified via a new dev-only `useAppStoreDebug()` window hook (past/future counts + content checked).
- F3 ⌘K command palette (CommandPalette.tsx, cmdk via shadcn CommandDialog):
  - Groups: Jump to slide (hidden slides marked, current marked), Insert slide (all 11 layouts), This slide (duplicate/hide/delete), Deck (present, shuffle theme, style popover, batch AI notes), History & export (undo/redo + all 4 export kinds via new shared `useExportActions()` hook extracted from ExportMenu so palette and menu share the exact same code path).
  - Opens via ⌘K/Ctrl+K (handler skips typing targets) or the new toolbar Command button. Verified: search filter "add quote" → Enter inserted quote slide (store total 6→7), jump to "Common Pitfalls" (5/6), palette closes before side effects (60ms) so the print dialog works.
- F4 Deck library relative timestamps: `timeAgo()` ("just now / 5m ago / 3h ago / 2d ago") with Clock icon + absolute-time tooltip on every deck card. Verified visually.
- S1 Landing hero: three drifting gradient orbs (teal/amber/violet, CSS keyframes, `prefers-reduced-motion` disables) + gradient text on "polished deck".
- S2 Inspector AI action buttons get violet hover tint; AI ACTIONS label with sparkle icon.
- BUG FIXED (hydration regression I introduced): `timeAgo()` computed from Date.now() during SSR → "attributes didn't match" hydration error on the landing. Fixed with `suppressHydrationWarning` on the relative-time span (intentionally client-time). Verified 0 console errors after fresh load.
- ExportMenu refactored to `useExportActions()` hook (same behavior); verified menu opens and PPTX downloads (106 KB, valid zip, 6 slides).
- README features section updated (markdown paste, AI notes batch, ⌘K palette, relative timestamps).

Stage Summary:
- New: markdown→outline deterministic import (with layout tags + auto-cover), AI speaker notes (per-slide + batch with single undo snapshot via patchSlides), ⌘K command palette, deck library relative times, hero orbs + gradient text.
- Bugs fixed: markdown cover-slide/first-heading confusion, SSR hydration mismatch from timeAgo.
- Verified in browser end-to-end (outline flow, generation, notes, palette, exports); lint clean; 0 console errors; PPTX integrity checked.
- Risks/next: batch notes is sequential (5 slides ≈ 20s — could parallelize 2-way like the slide pipeline); markdown parser ignores nested lists and tables by design (documented in the tab hint); palette exports route through the shared hook (PDF still opens print dialog); command palette intentionally omits present-mode-only actions; consider a "Paste outline" entry point from the OutlineView empty state too.

---
Task ID: r9 (cron review round 9)
Agent: webDevReview agent
Task: Status assessment + browser QA, then bug fixes + feature/styling round (editor frame fix, blank-screen shutter, resizable presenter view, WCAG accent contrast, library content search, thumbnail layout badges)

Work Log:
- Status assessment: lint clean, dev.log healthy (200s only), fresh browser session loads with 0 console errors (a stale "hydration mismatch" in the errors buffer was from an old dev session; a fresh session confirms clean). Phase STABLE but browser QA found a real layout bug -> bug-fix-first round, then features.
- BUG FIXED (major, editor frame overflow): with a 10-slide deck the thumbnail ScrollArea defeated flex-1 (flex min-height:auto = content height 1449px), overflowing the editor frame, stretching the document to 1629-1844px, scrolling the canvas/inspector out of view and floating the footer mid-page. Two-part fix: (1) ScrollArea gains min-h-0 in EditorView aside; (2) the intrinsic min-content chain still propagated through nested flex containers, so HomePage root now switches to `h-screen overflow-hidden` when view==='editor' (definite height clamps the whole chain; other views keep natural page scroll) and EditorView root became flex-1 min-h-0 (was h-[calc(100vh-4rem)] which also ignored the footer height causing a 49px overflow). Verified: docH exactly 900 at 1600x900, both ScrollAreas scroll internally, footer always visible, present mode + landing unaffected.
- NOTE: dev server crashed once mid-round (connection refused; likely sandbox OOM/timeout) -> restarted with `bun run dev` in background; healthy since.
- F1 Blank-screen shutter (present mode): B key toggles a solid black overlay ("Screen hidden - press B or click to show", click also restores), new MonitorOff controls button with aria-pressed, hint chip updated ("B blank"), state resets on exit. Verified: B -> black shutter, B -> slide back.
- F2 Resizable presenter sidebar: drag handle (role=separator, pointer-capture drag, arrow keys +/-32, focus-visible highlight) between stage and notes panel; width clamped 280-620, persisted to localStorage `deckforge.presenter.width` (setPresenterW writes through); aside width via `--pw` CSS var (lg:w-[var(--pw,26rem)]) so mobile layout untouched. BUG FIXED during QA: `Number(null)` is 0 not NaN so a missing storage key clamped to the 280 minimum instead of the 416 default - loader now checks for a raw value first. Verified: default 416 on fresh mount, drag to 600 live, survives full reload, stage re-scales as the panel grows.
- F3 WCAG accent contrast fixup: applyAccent() now derives `primaryContrast` from the accent via relative-luminance + contrast-ratio (readableOn(): white vs #101010, WCAG 2.1), so very light custom accents (butter #ffd166) no longer pair with white text on accent-filled chips/pills/closing badges - and PPTX title-slide subtitle (uses primaryContrast) follows automatically since pptx.ts already routes through applyAccent. Verified: #ffd166 -> contrast #101010 (chart insight pill computed bg rgb(255,209,102) / color rgb(16,16,16)); "Theme" reset restores theme defaults (#3b4d8f + white).
- F4 Library search upgrade: GET /api/decks now returns `titles` (per-slide titles, 60 chars each) alongside meta; RecentDecks filters over deck title + design-system name + slide titles; placeholder updated to "Search titles, slides, themes...". Verified: "revenue" matches 2 decks by slide content, "dark" matches the Dark Elegant deck by theme name. Cards also now show the design-system name with an accent dot (was a bare color dot with tooltip) and the timestamp moved to its own line.
- S1 Thumbnail layout badges: editor thumbnails show the layout glyph (EditorView LAYOUT_ICONS string map) next to the slide number with a layout-name tooltip.
- README features updated (blank shutter, resizable presenter, auto-contrast accents, library content search, theme names on cards).

Stage Summary:
- 1 major layout bug fixed (editor frame overflow) + 1 sub-bug (footer-height overflow) + 1 loader bug caught during QA; 4 features added (blank shutter, resizable presenter, WCAG accent contrast, content/theme search) + 2 styling details (theme names on cards, layout badges on thumbnails).
- All verified end-to-end in browser with agent-browser (screenshots + DOM measurements); bun run lint clean; 0 console errors on fresh loads; dev.log clean 200s.
- Risks/next: presenter width default-on-first-load is 416 (fine) but very narrow laptop windows clamp to 280 min - could switch to a % width below xl; blank screen intentionally does not pause autoplay (standard behavior varies - could add); accent contrast fixup handles on-primary text but not accent-on-bg text (kickers use accent as text on light bg - a very light accent could still reduce kicker contrast; consider darkening light accents for text usage); library search is client-side over 24 decks max (take:24) - server-side search if library grows; `Number(null)` pattern exists in loadSpeed too (benign: 0 is not in AUTOPLAY_SPEEDS so falls back to 10).

---
Task ID: r10 (cron review round 10)
Agent: webDevReview agent
Task: Status assessment + browser QA, then bug fix + feature/styling round (app icon, light-accent text contrast, AI slide composer, keyboard/palette slide move, library mini-outline, inspector polish)

Work Log:
- Status assessment: lint clean, dev.log healthy (200s only), fresh browser session loads with 0 console errors (re-confirmed empty-✗ console artifacts were stale-session noise). Functional QA of landing → editor → present all healthy. Phase STABLE → chose feature + styling round (plus one real bug found in QA).
- BUG FIXED (favicon 404): no app icon existed — layout metadata pointed at an external CDN logo and /favicon.ico 404'd on every load (source of the empty console-error entries). Added `src/app/icon.svg` (DeckForge mark: dark rounded square, slide stack, violet play cue) and removed the CDN icon reference; Next serves /icon.svg (200, image/svg+xml) and links it automatically. Fresh session: zero errors.
- F1 Light-accent TEXT contrast (round-9 risk item): new `primaryText` derived token in applyAccent() — when a custom accent fails 4.5:1 against the theme bg (light accents like butter #ffd166 on light themes), it is stepped toward black (`textSafeOn`, `contrastRatio`, `mixTowardBlack` helpers) until it passes; dark themes keep the raw accent. Exposed as `--s-primary-text` (css-vars.ts), consumed by every accent-as-text rule in deck.css (s-kicker, accent-text, page-no, col-list arrows, quote mark, stat-value, compare row labels, closing icons, section-index — fills/backgrounds intentionally unchanged), and mirrored in PPTX export (kickers, section labels, column headers, quote mark, stat values, INSIGHT label, comparison row labels) via `colors.primaryText ?? primary`. `.img-content .s-kicker` intentionally keeps raw accent (sits on a dark photo overlay). Verified: butter accent on Corporate Clean kicker computes rgb(128,105,51) = 5.05:1 AA; same butter on Dark Elegant stays rgb(255,209,102).
- F2 AI slide composer: new `compose_slide` action in /api/ai/slide — takes a one-line topic (+ deck title/audience/tone/language context), AI returns a full slide (layout chosen from a safe subset: bullets/two-column/quote/stats/section; no chart/diagram/image since those need real data/media), everything sanitized server-side (layout whitelist, per-field limits, two-column/quote/stats fallbacks to bullets when content is incomplete). Client: "✨ Generate with AI from a topic…" entry at the top of the Add-slide dropdown + "Generate slide with AI from a topic…" in the ⌘K palette → dialog with topic input → inserts after the current slide via insertSlide (one undo snapshot), current follows, toast with the new title + layout. E2E verified: topic "Customer support automation wins and remaining gaps" produced a two-column slide (Wins vs Remaining Gaps) with 60-word speaker notes, 10→11 slides, autosave PUT 200. (Test slide deleted afterwards.)
- F3 Move slide earlier/later without drag: Alt+↑/↓ keyboard shortcut in the editor (reorderSlides, undo-snapshotted) + "Move slide earlier/later" items in the palette's This slide group (⌥↑/⌥ shortcuts, disabled at the ends) + cheat-sheet row. Verified: Alt+ArrowDown moved the cover 0→1 with cur following and undo=1; palette move executed and undone.
- S1 Library cards now show a mini outline: first two slide titles (from the list API's `titles`, no extra fetch) behind a theme-primary left edge, numbered 01/02 mono digits, "+ N more…" overflow. Verified visually on all 5 decks.
- S2 Inspector AI-actions section wrapped in a violet-tinted card (gradient bg + border) so AI affordances read as one zone; buttons get white bg for contrast.
- PPTX export re-verified after the color changes: Q3 Fintech Review.pptx downloads, valid zip, 10 slide XMLs.
- README features updated (accent text-contrast derivation, AI composer, move shortcuts, mini-outline cards).

Stage Summary:
- 1 bug fixed (favicon 404), 1 WCAG quality fix (accent-as-text, HTML + PPTX), 2 features (AI slide composer E2E, keyboard/palette slide move), 2 styling details (library mini-outline, inspector AI zone). All verified in browser (fresh-session 0 console errors, store-level assertions, real AI generation, PPTX zip integrity); lint clean; dev.log 200s.
- Risks/next: compose_slide stats are illustrative by prompt convention (same as add_chart) — a visible "illustrative" hint could be added; batch AI notes is still sequential (2-way parallelization would halve ~20s); very narrow laptop widths still clamp presenter panel to 280px min; PDF export still relies on the browser print dialog; future candidates: slide-grid overview in the editor (present mode already has G), deck-level default transition override, server-side library search if decks grow past the take:24 limit.

---
Task ID: r11 (cron review round 11)
Agent: webDevReview agent
Task: Status assessment + browser QA, then feature/styling round (editor slide board, deck JSON export, deck default transition, parallel AI notes, illustrative-data badge)

Work Log:
- Status assessment: lint clean, dev.log healthy (200s only). Browser QA: landing (hero orbs, 8 design-system cards, deck library with mini-outlines), editor (toolbar/talk-time chip/inspector), present mode + G grid overview, all with 0 console errors. Phase STABLE -> feature + styling round.
- PLAN this round: F1 editor slide Board view (G shortcut) with drag reorder + batch ops, F2 deck file (.deck.json) export round-tripping with import, F3 deck-level default transition honored by present mode, F4 batch AI notes 2-way parallel pool, F5 illustrative-data badge on AI-composed stats slides, S1 styling details (export menu groups, cheat-sheet rows). IN PROGRESS below.

Work Log (completed):
- F1 Slide board (flagship): editor canvas is replaceable by a sortable grid ("Board" toolbar button with aria-pressed, G shortcut, palette item, Esc closes). Responsive auto-fill grid (min 250px cols) of the existing SlideCard with NEW caption rows (numbered mono index + truncated title + amber "AI" chip when slide.illustrative), double-click (or Close button / Esc / G) returns to the canvas, drag-to-reorder and cmd/shift-click batch selection reuse the exact rail handlers, inspector stays live beside the board. Verified: G toggles, drag moved slide 4→2 (undo restored), double-click selects+opens, cmd-click 2 cards → "2 selected" batch bar + emerald rings + check badges, header shows "N slides · M hidden".
- F2 Deck file export: new src/lib/export/deckjson.ts (client Blob download, ${slug}.deck.json, payload = {title, subtitle, themeId, slides, meta, exportedFrom, exportedAt}) — exactly the shape RecentDecks import accepts. ExportMenu gains a "Handouts & data" group (DropdownMenuLabel) with the new "Deck file (.json)" item; palette ExportKind extended to 'deckjson'. E2E verified: downloaded 8.9 KB file, python-parsed (10 slides, meta.defaultTransition='rise' included), re-imported via the hidden input → deck count 5→6, imported deck carried the transition meta (checked via /api/decks), then deleted the test copy.
- F3 Deck-level default transition: DeckMeta.defaultTransition (reuses TransitionKind); style popover gains a "Slide transition" select (Theme default / None / Fade / Rise / Zoom / Slide); PresentOverlay resolves per-slide override → deck default → theme motion. Verified select writes meta (store shows 'rise'), present mode renders/navigates without errors.
- F4 Batch AI notes parallelized: writeAllNotes now runs a 2-worker queue pool (order-independent patches dict, completed counter drives the button progress). Same single undo snapshot via patchSlides.
- F5 Illustrative-data badge: Slide.illustrative flag; AI composer sets it on stats layouts (prompt already mandates round illustrative figures); StatsLayout renders a mono footnote "Illustrative figures — replace with your own data" (new .stat-note style in deck.css, token-driven); inspector stats header gains an amber toggle chip (aria-pressed) so users can add/remove the flag manually; board captions show an amber AI chip for flagged slides. Verified: toggle on → footnote renders on canvas; toggle off → gone (flag false, no DOM node).
- S1 Styling details: Export menu split into labeled groups ("Present & share" / "Handouts & data"); cheat-sheet gained the G row; compose dialog hint now documents the illustrative-figures convention; board header with LayoutGrid icon + count + hidden count + usage hints.
- QA notes: Playwright dblclick does not produce a native dblclick on the draggable card (clicked + selected but no open) — verified onDoubleClick works via synthetic MouseEvent dispatch (board closed); not an app bug. A stale library card remained visible after DELETE until reload (client list not refetched on that path) — pre-existing minor, note for next round.
- bun run lint clean; 0 console errors on fresh loads; dev.log all 200s; QA deck state restored (undo after drag test, illustrative off, imported copy deleted).

Stage Summary:
- 5 features (slide board, deck-file export with round-trip, deck default transition, 2-way parallel AI notes, illustrative badge) + styling details, all verified in browser end-to-end.
- Risks/next: RecentDecks list doesn't refetch after delete until reload (could invalidate on focus); board grid is DOM-order only (no spatial drag preview — acceptable for 60-slide cap); deck JSON export is client-side only (server-side share-links would be a bigger feature); palette's board item toggles even when board opened via toolbar (consistent by design); consider per-slide transition select showing the deck default as "(deck default)" suffix.

---
Task ID: r4-landing-redesign
Agent: main-agent (Z.ai Code)
Task: Redesign the landing page (user: "the landing page is a generic AI website") using obra/superpowers as brand reference and the project's installed web-design skills (ui-ux-pro-max, visual-design-foundations, impeccable)

Work Log:
- Analyzed obra/superpowers (cloned repo, README + assets): pure-black monochrome logo, opinionated personality-driven copy, numbered methodology ("The Basic Workflow"), Philosophy section, honest/technical voice → extracted these as the redesign's design pillars.
- Read skills/ui-ux-pro-max/SKILL.md + skills/visual-design-foundations/SKILL.md: type scale, 8-pt spacing, semantic tokens, "always cover empty/loading/error, keyboard nav, focus states, contrast" rules applied below.
- Direction: "print shop / foundry" system — ink (neutral-950) + paper (neutral-50) alternating bands, ONE amber accent, NO gradients/orbs/sparkle badges; product's own loaded typefaces (Inter Tight display, Fraunces italic for the one editorial flourish, IBM Plex Mono for annotations) tie landing typography to the app's theme tokens.
- NEW src/components/app/landing/HeroSpecimen.tsx: live specimen lightbox — 8 REAL slides (stats/section/chart/quote/title/bullets/comparison) rendered by the actual ScaledSlide+SlideView+theme-token pipeline, auto-cycling 3.4s across all 8 design systems; window-chrome frame, FIG. n/08 mono caption, theme dots + prev/pause/next controls; pause on hover + document.hidden; aria-current/labels.
- Rewrote CreateView.tsx (all logic/handlers preserved verbatim): ink hero (dot grid via mask, eyebrow mono rule, "Presentations that look like *someone cared.*", amber CTA + ghost CTA), CSS marquee spec strip (pause on hover, reduced-motion safe), 01 THE METHOD numbered 4-step strip (hairline gap-px grid + registration-mark hover accents), 02 THE WORKBENCH (A·Brief card: 2px ink border + 6px hard offset shadow, mono example chips, mono setting labels, "Forge the outline" CTA + approval caption; B·Materials: pill tab bar, dot-grid dropzones; C·Design systems: "Eight systems. Zero templates."), 03 HOUSE RULES ink band (4 opinion cards: numbers sacred / systems not templates / outline before pixels / file is yours), 04 THE ARCHIVE deck library.
- HomePage.tsx: header restyled (ink mark, amber AI tag, mono anchor nav METHOD/WORKBENCH/SYSTEMS/DECKS with underline-sweep hover, NEW DECK mono button); footer rebuilt as ink colophon (brand + tagline, spec line "8 SYSTEMS · 11 LAYOUTS · 3 EXPORT FORMATS", server-side-AI status, bottom spec row).
- RecentDecks: added hideHeading prop (section heading moved to CreateView's "The archive." block, search/import toolbar retained).
- globals.css: removed df-orb/df-gradient-text (old generic hero), added .df-mono/.df-display/.df-serif-it, .df-dots-dark/.df-dots-paper, .df-reg registration marks, df-marquee keyframes, .df-link underline sweep, amber ::selection, smooth scroll (both guarded by prefers-reduced-motion).
- Verified with agent-browser: anchor scroll (WORKBENCH → y=1037), specimen dot jump (Dark Elegant quote renders), example chip → textarea fill, data-tab switching, markdown live-parse badges (3 slides/4 bullets), desktop + 390px mobile full-page screenshots, footer pushed naturally, console clean; E2E "Forge the outline" → POST /api/generate/outline 200 (6.9s) → editable outline view loads. Lint clean.

Stage Summary:
- Landing no longer generic-AI: monochrome editorial system with one accent, opinionated copy, numbered method + house rules (superpowers-style), and the hero's proof is the product itself (live token-rendered slides cycling all 8 systems).
- All previous functionality intact (brief, 4 data input modes, template picker, deck library, full pipeline); no API/store changes.
- Files: src/components/app/landing/HeroSpecimen.tsx (new), CreateView.tsx (rewritten JSX), HomePage.tsx, RecentDecks.tsx (hideHeading prop), globals.css (landing utilities swap).

---
Task ID: r5-landing-impeccable
Agent: main-agent (Z.ai Code)
Task: Backup the current landing page as-is, then redesign it again using the impeccable skill (pbakaus/impeccable) per user request

Work Log:
- BACKUP: previous "print shop" landing saved verbatim to /home/z/my-project/backups/landing-v2-printshop/ (CreateView.tsx, HomePage.tsx, RecentDecks.tsx, layout.tsx, globals.css, landing-components/HeroSpecimen.tsx). Restorable by copying back + removing Big Shoulders from layout FONTS_HREF.
- IMPECCABLE SETUP: extracted /home/user_skills/impeccable.zip -> /tmp/impeccable; read SKILL.md + reference/brand.md (brand register). Context gate: wrote PRODUCT.md (purpose/users/brand/tone/anti-references/principles/register) + DESIGN.md from real project knowledge, ran scripts/load-context.mjs (both resolved). Preflight: context=pass product=pass command_reference=pass shape=pass image_gate=skipped (dev-tool exception; hero proof = live product renders).
- KEY DIAGNOSIS: the r4 "print shop" landing is exactly impeccable's reflex-reject "editorial-typographic" lane (Fraunces italic + IBM Plex Mono labels + hairline rules + monochrome restraint) with two reflex-reject fonts -> the redesign departs that lane entirely.
- NEW DIRECTION "the stage / billposter": scene sentence ("a presenter kills the lights at 6pm; the slide is the brightest object in the room") forces dark; Committed color strategy, named reference Playbill yellow-on-black (flat poster ink, NOT neon-on-black); palette = warm ink oklch(0.17 0.008 95) + poster yellow oklch(0.84 0.19 96) + cream, as --stg-* tokens. Fonts: Big Shoulders Display (billposter display, NOT on reflex-reject list) + Archivo (committed workhorse); mono removed entirely (mono-as-costume ban); no serif italic anywhere.
- IMPLEMENTED: layout.tsx (+Big Shoulders Display 600-800 in FONTS_HREF); globals.css landing block swapped df-* -> stg-* (stg-display/stg-label/stg-num outline numerals with hover fill/stg-ticker/stg-link, yellow ::selection, reduced-motion guards); HeroSpecimen rebuilt as "The Screen" (ink projection frame, LIVE + ROLLING leader strip, REEL 01/08 Big Shoulders counter, theme dots + transport, same real ScaledSlide pipeline + all original logic); CreateView JSX fully redesigned (logic/handlers verbatim): hero billboard headline "The lights go down. / Your story holds the room.", yellow ticker strip, 01 method as staggered poster rows with oversized outline numerals (not card grid), 02 workbench with yellow job-ticket brief panel (2px ink border + 8px hard shadow), materials + systems intact, 03 house rules as numbered ink rows (icons dropped), 04 archive; HomePage header/footer restyled (ink bar, yellow mark, caps nav, yellow CTA, ink colophon with yellow top border); em dashes purged from all new copy (impeccable ban).
- BUG FIXED during QA: Turbopack served a stale globals.css chunk (hash 91e4631d) missing the whole stg-* block after edits (page rendered unstyled) -> fixed by fully restarting the dev server (touch/HMR did not bust the chunk cache).
- QA (agent-browser): desktop 1600x900 hero/sections screenshots match brief (ink+yellow+Big Shoulders, ticker, outline numerals, yellow ticket, house-rule rows); anchor scroll WORKBENCH y=1862; example chip fills textarea; 4 data tabs swap panels; E2E "FORGE THE OUTLINE" on jazz prompt -> POST /api/generate/outline 200 (6.7s) -> editable outline ("The Evolution of Jazz") loads; mobile 390px full-page clean, no overflow, footer pushed naturally; 0 console errors; dev.log all 200s; bun run lint clean (backups/** added to eslint ignores).

Stage Summary:
- Landing is now impeccable-brand-register: ink + poster yellow (Committed strategy), Big Shoulders/Archivo, poster-row layouts, zero banned patterns (no gradient text, no glass, no mono, no serif-italic, no identical card grids, no em dashes).
- All functionality preserved (brief form, 4 data input modes, theme gallery, deck library, generation pipeline); no API/store changes.
- Files: src/app/layout.tsx, src/app/globals.css, src/components/app/landing/HeroSpecimen.tsx, src/components/app/CreateView.tsx, src/components/app/HomePage.tsx, eslint.config.mjs, PRODUCT.md/DESIGN.md (impeccable context), backups/landing-v2-printshop/.
- Risks/next: Big Shoulders Display loads from Google CDN (graceful fallback to Archivo); PRODUCT.md/DESIGN.md now exist for future impeccable invocations (teach/document gate satisfied); "Your story holds the room." headline could A/B against shorter variants; archive cards keep their own product styling by design.

---
Task ID: M-0 (council phase)
Agent: main-agent (Z.ai Code)
Task: Analyze uploaded decksmith.zip + installed skills, run LLM council, produce merge decision

Work Log:
- Extracted user upload to upload/decksmith-extracted (57 templates / 5 frameworks, 3-stage pipeline, strategies/formulas/tone/verbosity prompt assets, snapshot PPTX export).
- Spawned 3 parallel Explore agents: (1) full decksmith inventory, (2) current DeckForge feature map + extension points, (3) installed-skills principles + LLM CLI verification.
- Ran LLM council (z-ai chat CLI, 4 personas: Design Director / Product Strategist / Staff Engineer / The Presenter) over docs/council/brief.md -> verdicts p1-p4.json (429 rate limits retried sequentially).
- Wrote chair synthesis to docs/council-decision.md.

Stage Summary:
- ADOPT: 10 strategies + 5 copywriting formulas + bans/floors/pacing; tone(6)+verbosity(3) enums + audience-forwarding fix; per-slide outline regenerate/status; 6 new themes; gallery search/filters; PPTX snapshot export + slide PNG; notes quality upgrade.
- REJECT: HTML codegen engine, 57-template library, vendored runtimes, localStorage, verbatim scripts, landing redesign.
- Parallel division M-a/M-b/M-c/M-d (disjoint file ownership) + M-e integration QA. See docs/council-decision.md.

---
Task ID: M-d
Agent: export-agent
Task: Council decision #8 — pixel-perfect snapshot exports (PPTX of full-bleed PNG slides + current-slide PNG download)

Work Log:
- Read worklog.md + docs/council-decision.md; studied existing conventions: pptx.ts (PptxGenJS v4, file naming, visibleSlides, deckTheme accent flow), html/notes/deckjson blob-download patterns, ExportMenu useExportActions hook + grouped menu, CommandPalette ExportKind union, ScaledSlide/SlideView fixed 1280x720 CSS-var rendering, deck-store accessors, and the proven decksmith pattern at upload/decksmith-extracted/src/lib/presentation/export.tsx (offscreen fixed stage -> html-to-image toPng -> pptxgenjs addImage).
- Ran `bun add html-to-image` (1.11.13) — the only package.json change.
- NEW src/lib/export/pptx-snapshot.ts ('use client'):
  - exportPptxSnapshot({ deck, theme?, onProgress?, pixelRatio? }) — sequential loop over visibleSlides (hidden skipped, capped at 60 like the editor); per slide: offscreen fixed 1280x720 stage (position:fixed; left:-99999px; pointer-events:none; theme bg) -> createRoot render of the REAL SlideView at natural size (no ScaledSlide transform; themeToCssVars flow via SlideView props, deck.css global) -> rAF + document.fonts.ready + rAF + settle wait (150ms; 1800ms on chart slides so Recharts mount animations finish) -> toPng(node, { width:1280, height:720, pixelRatio:2, cacheBust:true, backgroundColor: theme bg }) -> pptxgenjs slide with addImage data URL full-bleed on built-in LAYOUT_16x9 (10 x 5.625 in); speaker notes carried over via addNotes; per-slide failure falls back to a bg-colored text slide (one bad slide never loses the export); progress callback (0/total -> n/total); root.unmount() + node removal in finally + small inter-slide await; stage removed in outer finally; filename `${slug}-snapshot.pptx` (slug helper duplicated from pptx.ts inline pattern, exported as deckSlug since pptx.ts's is not exported and is untouchable).
  - exportSlidePng({ slide, theme, index, pageCount?, deckTitle?, showPageNumbers?, fileBase?, pixelRatio? }) — same offscreen render for a single slide, PNG converted to Blob and downloaded as `${base}-slide-NN.png` (deckjson.ts download pattern: append a, click, remove, revokeObjectURL).
- ExportMenu.tsx: hook gains currentSlideIndex subscription, snapshotProgress state, and actions pptxSnapshot + slidePng (visible-slide resolution for the current index, deckTheme/deckFooterText/showPageNumbers wiring, success/failure toasts; snapshot-failure toast explicitly points at the editable PPTX mode); module-level snapshotInFlight guard because the menu and palette hold separate hook instances (never two concurrent raster jobs); Export menu gains a "Pixel-perfect" group with "PPTX — pixel-perfect (images)" (label switches to "Rendering n/total…" while running) and "PNG — current slide" ("Rendering…"), both disabled while any export is busy.
- CommandPalette.tsx: ExportKind extended to 'pptxSnapshot' | 'slidePng'; the two new items call useExportActions() directly inside the palette (deliberately NOT routed through the onExport prop, whose parent else-branch would wrongly fire the notes export) so menu and palette share the exact same code path; items carry short descriptions ("Full-bleed PNG slides — identical to screen", "Download current slide as PNG") + searchable value keywords.
- READ ONLY respected: pptx.ts, deck-store.ts, themes.ts, OutlineView/CreateView/GeneratingView, API routes, ScaledSlide/SlideView untouched.
- QA: `bun run lint` — zero findings in my three files (remaining repo errors are pre-existing in upload/decksmith-extracted vendored reference code, outside my ownership); `bunx tsc --noEmit` filtered to my files — clean (other src/ errors belong to files owned by parallel agents mid-edit); dev.log healthy (compiles OK, 200s only) after changes.

Stage Summary:
- New export entry points: exportPptxSnapshot({ deck, theme?, onProgress?, pixelRatio? }): Promise<void> and exportSlidePng({ slide, theme, index, pageCount?, deckTitle?, showPageNumbers?, fileBase?, pixelRatio? }): Promise<void> plus exported deckSlug(title) in src/lib/export/pptx-snapshot.ts.
- ExportMenu useExportActions() return extended: { ..., snapshotProgress, pptxSnapshot, slidePng }; Export menu has a third "Pixel-perfect" group; ⌘K palette exposes both snapshot exports with descriptions.
- Memory-safe: sequential processing, one live React root at a time (unmounted in finally), nodes removed, 60-slide cap, cross-instance in-flight guard.
- Known risks/next for M-e: chart slides wait 1.8s each (fidelity over speed — acceptable for ≤60-slide decks); html-to-image re-embeds webfonts per slide (cacheBust) so large decks are network-bound; double-run of a snapshot job via menu+palette is blocked, but snapshot + editable PPTX can still run concurrently (pre-existing pattern); per-slide PNG always renders at the visible position's page number.
---
Task ID: M-c
Agent: outline-agent
Task: Per-slide regenerate + status affordances in OutlineView (council decision #5) + new /api/ai/outline-item route

Work Log:
- Read worklog + council-decision.md; studied OutlineView.tsx (owned), deck-store.ts (read-only: setOutline is the only outline mutation; undo history tracks Deck snapshots only, NOT outline edits), generate/outline + ai/slide routes (mirrored contract style: getZAI/extractJson/sanitizeText/rateLimit/clientKey, validLayout coercion, char caps).
- NEW src/app/api/ai/outline-item/route.ts (maxDuration 60): POST {action:'regenerate', outlineItem:{layout,title,brief}, deckBrief, audience?, tone?, themeName?, language?, position?, total?}. Focused single-item prompt reuses the outline route's layout vocabulary (LAYOUT_BUDGETS describe) + caps (title<=90, brief<=200); position/total preserve role intent (cover stays cover, closing stays closing); layout is pinned server-side (content re-roll only; layout changes go through the per-row select); returns {item:{layout,title,brief}, rationale(<=140)}. Rate limit 30/min/IP; 400s for unknown action/missing item/missing deckBrief; 502 on empty AI payload; 500 catch.
- OutlineView.tsx: per-row RefreshCw icon button (edit mode, h-8 like siblings) calling the new route with fresh state via useAppStore.getState() (no stale closures; parallel regens safe; writes re-read the latest outline and bail if the user left the outline view). Hooks ordered before the early return (no conditional hooks).
- Status affordances keyed by row index (absent=idle, loading, error): loading = row dimmed opacity-60 + aria-busy + spinning RefreshCw (animate-spin with motion-reduce:animate-none) + row inputs/select disabled; error = button turns red + tiny red dot badge + aria-label becomes "Retry slide regeneration"; manual edit of the row clears its error. Move/delete on ALL rows disabled while any regen is in flight (prevents index-shift writing into the wrong row); add-slide stays enabled.
- Toast: sonner "Slide regenerated" with the AI rationale as description + Undo action (restores the previous item at that index via setOutline; store has no outline history so direct replace + client-side undo action). Errors toast via toast.error.
- Long-title nudge: amber mono chip "long title" (uppercase, border-amber-300, text-amber-700) when a row title exceeds 60 chars, shown in both edit and preview modes with an explanatory title tooltip; verified it appears/clears live.
- Keyboard: R regenerates the focused row (focus tracked via li onFocusCapture; handler on the <ol>), skipped for INPUT/TEXTAREA/SELECT/contentEditable targets and any meta/ctrl/alt modifier (no Cmd+R hijack), edit-mode only, skipped while that row is loading; documented in a new minimal mono hint row under the list ("R regenerate the selected slide", shown in edit mode only). Approve/continue flow and all inline editing untouched; existing bordered-row + mono-number styling language preserved; no emojis.
- Verified with agent-browser: outline rows render the new button; click -> button disabled + row dimmed while POST /api/ai/outline-item 200 (1.5s) -> row title/brief replaced (observed "The Pop-up Problem" -> "The Pop-up Predicament", layout kept) -> status cleared; R after focusing a row button fired a second POST 200; 74-char title showed the amber chip, shortening cleared it; chip is CSS-uppercased so text-matching needs case-insensitive check. Route validation paths verified by curl (400 unknown action / missing outlineItem / missing deckBrief) + real 200 regen. Note: full toast-capture E2E was foiled twice by HMR full-reloads from parallel agents (M-a/M-d landing mid-test reset the client session); toast uses the same sonner success API already proven across the app and the success path (write-back + status clear) executed.
- bunx eslint on both owned files: clean (project-wide `bun run lint` errors are pre-existing, all in upload/decksmith-extracted vendored archive); GET / 200, dev.log shows only 200s for the new route.

Stage Summary:
- /api/ai/outline-item contract: POST {action:'regenerate', outlineItem:{layout,title,brief}, deckBrief:string, audience?, tone?, themeName?, language?, position?, total?} -> 200 {item:{layout,title,brief}, rationale} | 400/429/500/502 {error}. Layout pinned server-side; title<=90, brief<=200, rationale<=140; rate limit 30/min.
- OutlineView: per-row AI regenerate with idle/loading/error affordances (dim + spinner + aria-busy; red retry), sonner toast with Undo, amber "long title" chip >60 chars, R shortcut for the focused row (form-field + modifier safe), move/delete locked during any in-flight regen; inline editing, preview mode and the Approve flow unchanged.
- Outline edits remain outside deck undo history by design (store untouched); undo is offered per-regeneration via the toast action.

---
Task ID: M-a
Agent: pipeline-agent
Task: Port decksmith narrative intelligence into the structured pipeline + fix settings flow (strategies/formulas/bans/floors/pacing, tone+verbosity enums, audience forwarding bug, per-slide status in GeneratingView, notes-quality upgrade)

Work Log:
- Read worklog, docs/council-decision.md and decksmith's system-prompt.ts + slide-prompt.ts (STRATEGIES, COPYWRITING_FORMULAS, BANS, FLOORS) to source the port.
- NEW src/lib/ai/strategies.ts (pure data + pure functions, client+server safe): STRATEGY_IDS/StrategyId, STRATEGIES (10 strategies with id/name/description/slideRange/sectionArc/emotionArc/bestFor), STRATEGY_MAP, DEFAULT_STRATEGY='kawasaki-10', STRATEGY_OPTIONS; detectStrategy(brief) keyword scoring (rules ordered specific-first for tie-breaks; no match = 'auto') + resolveStrategy(explicit, brief); INTENT_LAYOUT + intentLayout() mapping arc intents to DeckForge layouts; COPY_FORMULAS (layout+intent -> PAS/AIDA/FAB/BAB/COI), FORMULAS_PROMPT_BLOCK, formulaFor(), formulaGuidance(layout); CONTENT_BANS / QUALITY_FLOORS / PACING_RULES prompt blocks adapted to slide CONTENT (no repeated bullets, no eyebrow overuse, no 01/02 everywhere, no invented numbers, 60-char titles, split-don't-crowd); TONE_IDS/ToneId/TONE_OPTIONS (6 with directives), asToneId() legacy free-text normalization, toneDirective(), toneLabel(); VERBOSITY_IDS/Verbosity/VERBOSITY_OPTIONS (3), asVerbosity(), verbosityWordTarget() -> 20/40/60, verbosityDirective().
- deck-store.ts: GenSettings += strategy: StrategyId|'auto' (default 'auto') and verbosity: Verbosity (default 'standard'); tone stays `string` for backward compat with legacy free-text values (normalized via asToneId at consumption); DEFAULT_GEN_SETTINGS updated; also fixed a pre-existing tsc error (missing getTheme import for useActiveTheme).
- outline route: OutlineReq += strategy/verbosity; strategy resolved via resolveStrategy (explicit id > brief detection > default); system prompt gains FORMULAS_PROMPT_BLOCK, user prompt gains a full strategy block (arc with per-intent layout suggestions, emotion arc, typical range), PACING_RULES + CONTENT_BANS + QUALITY_FLOORS; response now also returns { strategyUsed, strategyRationale, slideGuidance: string[] (parallel to outline.slides, = formulaGuidance per layout), meta: { slideRange, slideCountInRange, slideRangeHint? } } — explicit slideCount still respected; theme auto-pick + data-integrity rules untouched.
- slides route: GenReq += strategy/verbosity (audience already existed); system prompt now names the narrative strategy and embeds CONTENT_BANS; per-slide user prompt gains tone directive, verbosity directive + ~20/40/60 word target, formulaGuidance(layout), no-invented-numbers + split-don't-crowd rules; chart-data freeze lines and no-verified-data chart fallback kept EXACTLY as-is; notes contract in slideJsonTemplate upgraded to "2-4 short talking points (not a verbatim script) + exactly one delivery cue in square brackets".
- ai/slide route: speaker_notes action rewritten per Presenter council vote (NOTES_CONTRACT: 2-4 short talking points + one delivery cue like [pause here]/[ask the room], no invented stats); compose_slide notes line aligned; body accepts optional `tone` (resolved via toneDirective) applied to compose_slide + all patch actions; patch whitelist untouched.
- CreateView: brief ticket now has 6 controls (Audience Input, Tone Select with 6 options, Density Select with 3, Language Input, Strategy Select Auto + 10 short names, Slides Slider) in a sm:2/lg:3 grid, all styled with the billposter ink/cream/yellow ticket system (shared TICKET_SELECT/TICKET_CONTENT classes); generateOutline sends strategy+verbosity, persists GenSettings before the fetch and re-persists with the resolved strategyUsed when Auto; buildFromMarkdown persists the same shape; data-mode logic untouched.
- GeneratingView: FIXES the forwarding bug — /api/generate/slides now receives audience, tone, verbosity AND strategy (was language-only); added a live per-slide status list (mono index + title + status dot) derived from the SSE stream: done = received (strict ascending emission), loading = the two slots at the 2-way pipeline head, error = server fallback-placeholder notes detected + everything after a fatal error, pending = queued; list is max-h-64 scroll with custom webkit scrollbar, aria-live polite, sr-only status words, motion-safe:animate-pulse for the loading dot; progress bar / slide previews / error state kept as before.
- Verified: bunx eslint on the 7 owned files = clean; tsc scan of owned files = clean (also fixed 2 pre-existing type errors in owned files: deck-store getTheme import, CreateView ChartSpec.title, GeneratingView latest narrowing); bun -e unit check of detectStrategy over 10 briefs (all 10 map per spec, generic -> kawasaki-10 via auto); E2E via curl: /api/generate/outline (auto -> educational w/ arc followed; explicit yc-seed + slideCount 6 -> range hint 'usually lands at 10-12'), /api/generate/slides SSE (funny tone copy + notes with [pause here] cue, chart rules intact), /api/ai/slide speaker_notes (talking points + cue, patch={notes} only); dev.log clean 200s after edits.
- Untouched (other agents' files): themes.ts, OutlineView.tsx, TemplateGallery.tsx, ExportMenu.tsx, CommandPalette.tsx, types.ts, api/ai/outline-item.

Stage Summary:
- Pipeline now carries a full narrative spine: strategy (10 + auto-detect) -> arc/layout hints + pacing at outline time -> per-slide copy formula + tone directive + verbosity word target + content bans at slide time; decksmith's bans/floors adapted to structured content with the data-integrity rules preserved verbatim.
- Exact exports of src/lib/ai/strategies.ts: STRATEGY_IDS, StrategyId, Strategy, STRATEGIES, STRATEGY_MAP, DEFAULT_STRATEGY, STRATEGY_OPTIONS, isStrategyId(), detectStrategy(), resolveStrategy(), INTENT_LAYOUT, intentLayout(), CopyFormulaId, FORMULA_LINES (private), COPY_FORMULAS, formulaFor(), formulaGuidance(), FORMULAS_PROMPT_BLOCK, CONTENT_BANS, QUALITY_FLOORS, PACING_RULES, TONE_IDS, ToneId, ToneOption, TONE_OPTIONS, asToneId(), toneDirective(), toneLabel(), VERBOSITY_IDS, Verbosity, VERBOSITY_OPTIONS, isVerbosity(), asVerbosity(), verbosityWordTarget(), verbosityDirective().
- GenSettings: { audience: string; tone: string (ToneId id, legacy text tolerated); language: string; slideCount: number; strategy: StrategyId | 'auto'; verbosity: Verbosity } — defaults '' / 'professional' / 'English' / 10 / 'auto' / 'standard'.
- POST /api/generate/outline request += { strategy?: string ('auto'|id), verbosity?: string }; response += { strategyUsed: StrategyId, strategyRationale: string, slideGuidance: string[], meta: { slideRange: [number, number], slideCountInRange: boolean, slideRangeHint?: string } } (outline shape unchanged).
- POST /api/generate/slides request += { strategy?: string, verbosity?: string } (audience/tone/language now actually honored).
- POST /api/ai/slide request += { tone?: string }; speaker_notes returns talking points + one [delivery cue].
- Consumers (M-c OutlineView): outline response's slideGuidance[i] is the per-item copy hint; strategyUsed/strategyRationale are display-ready strings.

---
Task ID: M-b
Agent: themes-agent
Task: Theme expansion 8→16 (real source palettes) + TemplateGallery search/filters + HeroSpecimen reels for all 16

Work Log:
- Read council-decision.md, all contract files (themes.ts, layout.tsx FONTS_HREF, html.ts FONT_HREF, TemplateGallery items/SAMPLES, HeroSpecimen SPECIMENS, css-vars.ts, SlideView Decor switch, deck.css).
- Read actual source CSS :root blocks (did not guess): decksmith templates monochrome/signal/grove/hermes-cyber-terminal/scatterbrain at upload/decksmith-extracted/public/templates/<id>/template.html; skills/design/design-templates/ppt INDEX.md + guizang-ppt (template.html :root + references/themes.md) + ib-pitch-book (SKILL.md + template.html oklch tokens) + html-ppt-zhangzara-biennale-yellow (template.json palette/typography).
- COUNT RESOLUTION: mission said "6 new themes (total 16)" but 8+6=14 while MISSION 3 requires hero "cycles all 16" → added 8 themes to genuinely reach 16 (council decision #6 also lists 8→16). Extra two use sources explicitly provided: decksmith `monochrome` (Source A list) + biennale-yellow (Source B folder, in council text).
- 8 new ThemeManifests appended to THEMES, each full token set, fonts wired to Google families, chart palettes 6 colors, decor motif, motion, unique tone:
  1. eink-editorial "E-Ink Editorial" (tone eink) — guizang ink-classic: paper #f1efea / ink #0a0a0b, Playfair Display + Source Serif 4 body, grayscale chart ramp, NEW decor 'masthead'.
  2. ivory-ledger "Ivory Ledger" (tone ledger) — decksmith monochrome: ivory #fafadf / black ink #1a1a16, Jost + JetBrains Mono, black ledger borders, radius 0, decor 'frame'.
  3. pitch-book-finance "Pitch Book" (tone finance) — ib-pitch-book oklch tokens (paper #faf9f6, oxblood #9e3f3b primary, deep green #2f6b52 accent, rule #d9d6cf), Source Serif 4 display + Public Sans body, dense small scale (body 17), decor 'rule-top'.
  4. signal-navy "Signal Navy" (tone institutional) — decksmith signal: navy #1c2644 / bone #e2dcd0 / antique gold #c8a870 primary, Source Serif 4 + DM Sans, decor 'band' (gold bottom strip).
  5. forest-grove "Forest Grove" (tone grove) — decksmith grove: forest #192b1b / cream #d4cfbf primary / terracotta #c8524a accent (decorative-only; accent-as-text routes through cream primaryText 9.6:1), Playfair Display + Jost 300-600, decor 'corner'.
  6. cyber-terminal "Cyber Terminal" (tone terminal) — hermes-cyber-terminal: #0a0c10 + mint #7ed3a4 primary + cyan #64dfdf accent + amber/rose chart series, JetBrains Mono as display AND mono, glow shadow, decor NEW 'scanlines' (5% mint repeating gradient, static).
  7. biennale-yellow "Biennale Yellow" (tone biennale) — zhangzara template.json: parchment #e9e5db / indigo #1b2566 primary / ember #d4593a accent (stepped one stop from source #e26b4a for 3.2:1 non-text contrast; solar-yellow #f1ee2e omitted — invisible on parchment in the 2-slot accent system, noted in description), Instrument Serif + Archivo, decor 'corner' (source identity: corner brackets).
  8. paper-collage "Paper Collage" (tone collage) — decksmith scatterbrain: paper #f7f5f0 / ink #2d2a26 / thumbtack-deep #c92a2a primary (source's own deep step of the thumbtack red) / sticky-yellow #ffd43b accent, Shrikhand + Zilla Slab, hard-offset shadows, radius 8/16/24, decor NEW 'tape' (two washi strips, primary + accent, static).
- Contrast verified by script (WCAG relLuminance): every new primary ≥5.0:1 on bg, accent-as-text values ≥4.5:1 or decorative-only with primaryText fallback (grove rust 3.4:1 / biennale ember 3.2:1 pass WCAG 1.4.11 non-text ≥3:1), muted text ≥4.5:1, chart series ≥3:1 on their surface (fixed 2 weak ones pre-emptively: grove chart rust #cf5b52, biennale honey #a87c22).
- Decor motifs: extended ThemeTokens.decor union additively in src/lib/deck/types.ts ('masthead' | 'scanlines' | 'tape' — minimal enabler edit; no other agent owns types.ts), added 3 cases in SlideView Decor(), added token-driven static styles in deck.css (.decor-masthead double rule, .decor-scanlines mix-blend screen overlay, .decor-tape ::before/::after strips). No layout-property animation; reduced-motion safe by construction.
- Fonts: added 8 families to BOTH FONTS_HREF (layout.tsx) and FONT_HREF (html.ts): Source Serif 4, Public Sans, DM Sans, Jost, JetBrains Mono, Instrument Serif (ital@0;1), Shrikhand, Zilla Slab.
- TemplateGallery: search Input (name/tone/id/description/bestFor, case-insensitive) + style-group filter chips (All/Light/Dark/Warm/Playful/Editorial/Tech via local THEME_GROUPS map, one group per theme: light 3, dark 4, warm 2, playful 2, editorial 3, tech 2) + "N of 16 systems" live-region count + dashed empty state with "Clear search & filters" reset; Auto card stays first in every result set; radiogroup/radio/aria-checked contract and CreateView props untouched; SAMPLES entries added for all 8 new tones so previews render.
- HeroSpecimen: 8 new SPECIMENS (spec-9..16) with short neutral content (quote/bullets/stats/section/title/chart/title/bullets); header comment updated to sixteen; REEL counter/16 and theme dots scale automatically.
- Verification (agent-browser): 17 radio cards (Auto + 16); search "navy" → "2 of 16" (matches Corporate Clean description + Signal Navy — correct); Dark chip → "4 of 16" (Bold Impact, Dark Elegant, Signal Navy, Forest Grove), Auto first; "zzz" → "0 of 16" + empty state; all 8 new preview slides render exact source bg colors; masthead/scanlines (opacity .05)/tape (rgb(201,42,42)) present; hero shows 16 dots + REEL n/16; 0 console errors/page errors; dev.log all 200s.
- bun run lint: zero findings in all owned files (remaining 10 errors + warnings are pre-existing in upload/decksmith-extracted/** and backups/examples/skills — outside my ownership, flagged for M-e); bunx tsc --noEmit: no errors in owned files (project-wide pre-existing errors elsewhere unchanged).

Stage Summary:
- THEMES now 16 (ids: + eink-editorial, ivory-ledger, pitch-book-finance, signal-navy, forest-grove, cyber-terminal, biennale-yellow, paper-collage); all palettes/typography pulled from real source CSS, WCAG-checked; 3 new decor motifs (masthead/scanlines/tape) token-driven and static; 8 Google font families added to both font URLs; gallery gained search + style chips + count + empty state without touching themeChoice/'auto' semantics; hero cycles all 16 systems.
- Integration notes for M-e: (1) stale copy says "Eight systems"/"8 curated design systems"/"8 SYSTEMS" in CreateView.tsx:834, layout.tsx metadata, HomePage footer — not my files; (2) lint gate currently fails only on pre-existing upload/decksmith-extracted/** files (consider adding upload/** to eslint ignores like backups/**); (3) AI Auto theme picker prompt (themeCatalogForPrompt) now lists 16 — no route changes needed.

---
Task ID: M-e (integration QA)
Agent: main-agent (Z.ai Code)
Task: Integrate M-a/M-b/M-c/M-d outputs, fix cross-agent issues, full browser E2E, README refresh

Work Log:
- eslint config: added upload/**, tool-results/**, download/** to ignores (vendored decksmith archive was polluting lint; src/ now fully clean).
- Stale copy fixes: CreateView "Eight systems" → "Sixteen systems", HomePage footer spec "8 systems · 11 layouts · 3 export formats" → "16 systems · 11 layouts · 5 export formats".
- BUG FOUND + FIXED (snapshot export): html-to-image threw SecurityError reading cssRules of the Google Fonts stylesheet (cross-origin, no CORS attribute) → added crossOrigin="anonymous" to FONTS_HREF <link> in src/app/layout.tsx and crossorigin="anonymous" in src/lib/export/html.ts template. Retest: export succeeded.
- E2E verified with agent-browser: landing (billposter hero cycling new themes incl. Cyber Terminal + Forest Grove specimens, 0 console errors) → brief form (new Tone/Density/Strategy selects render in billposter style; Strategy default "Auto — detect from brief") → filled Series A logistics pitch → outline followed the strategy arc (Title→Crisis→Solution→Traction→Market→...→Closing) and outline item briefs carry copy-formula guidance ("PAS formula: ...") → per-slide regenerate clicked (row 02 re-rolled with layout pinned, POST /api/ai/outline-item 200) → Approve → SSE generation ran with per-slide status view → editor (16 themes in switcher; switched to Cyber Terminal live re-theme with scanline decor + mono display) → Export menu shows new "PIXEL-PERFECT" group → PNG export verified (2560×1440 @2x, 124KB valid) → snapshot PPTX export verified (2.2MB, 10 slides, 11 embedded PNGs, notes carried, sldSz 9144000×5143500 = exact 16:9) → present mode regression passed (keyboard nav to 3/10, timer, chrome) → gallery search "navy" → "2 of 16 systems" + Auto card, filter chips All/Light/Dark/Warm/Playful/Editorial/Tech → mobile 390×844: form stacks correctly, header collapses.
- README rewritten: strategies/tone/density, 16 systems with provenance, per-slide outline regenerate, pixel-perfect + PNG exports, presenter-grade notes, new architecture entries (strategies.ts, ai/outline-item).
- QA tooling note: Radix menu refs go stale between agent-browser commands — ref-fresh single chains required for dropdown downloads.

Stage Summary:
- All four agent workstreams integrated and verified end-to-end; lint clean; dev.log all 200s; 0 console errors.
- DeckForge AI now: 16 token themes + gallery search/filters, 10 narrative strategies (auto-detect + explicit) with copy formulas/bans/pacing, tone+density enums with settings forwarded end-to-end, per-slide outline regenerate (R key + button), per-slide generation status, pixel-perfect PPTX/PNG exports, presenter-grade notes.
- Known follow-ups: strategy metadata not persisted into deck metaJson (works transiently during generation); html-to-image font embedding adds ~1-2s per slide on cold cache; vendored decksmith archive kept at upload/ for reference only.

---
Task ID: T-1
Agent: themes-agent-w2
Task: Wave-2 template absorption — 8 more decksmith templates → native token themes (16→24)

Work Log:
- Context: user's 57 decksmith PPT templates were never "rejected" — wave 1 (M-b) absorbed 8; this wave distills 8 more so THEMES = 24. Read worklog M-b/M-e + council-decision.md + full themes.ts first.
- Read ACTUAL source values (never guessed) from upload/decksmith-extracted/public/templates: _shared/themes/tokyo-night.css (:root #1a1b26/#24283b/#c0caf5/#7aa2f7/#bb9af7, Inter); 8-bit-orbit/template.html (#0A0E27/#0F1B3D, neon pink/cyan/yellow, Tektur + Chakra Petch + Space Mono); vellum/template.html (:root #2a3870 periwinkle / #E8D85C yellow type / #3a7878 dusty teal, Cormorant Garamond + DM Sans + Courier Prime); retro-windows/template.html (#c0c0c0/#000080/#008080 VGA set, Press Start 2P + VT323); _shared/themes/neo-brutalism.css (#fffef0/#000/#ffd400/#ff5ca8, 3px black borders, 6px/10px hard shadows, Archivo Black + Space Grotesk); sakura-chroma/template.html (:root #F1E6CB/#3A2516/#E5392A/#E54489/#F09131/#3D9F47/#3F8BC4, Big Shoulders Display + Albert Sans + halftone .stage::before); cobalt-grid/template.html (#F0EBDE/#1F2BE0/#5560E5, Hanken Grotesk + Newsreader + DM Mono); xhs-pastel-card/template.html (--xp- set #fef8f1/#2a2340 + peach/mint/sky/lilac/rose deep steps, radius 14/20/28, Playfair + Inter + JetBrains Mono).
- SKIPPED as too close to existing themes: knowledge-arch-blueprint (warm paper + rust ≈ pitch-book/editorial), long-table (cream + terracotta + Fraunces ≈ warm-earth), taste-brutalist (black + phosphor mono ≈ cyber-terminal), obsidian-claude-gradient (violet dark ≈ tokyo-night slot; kept tokyo-night, named in mission), aurora (mint ≈ cyber-terminal), graphify-dark-graph (shares #7ed3a4 with cyber-terminal), xiaohongshu-white (red-on-white ≈ editorial), pin-and-paper/broadside/daisy-days/stencil-tablet/neo-grid-bold/soft-editorial left for a possible wave 3.
- 8 ThemeManifests appended to src/lib/design/themes.ts (unique tones: nocturne, arcade, vellum, retro, brutalist, riso, cobalt, pastel; 6-color chart palettes; full type/spacing/radius/shadow/motion/decor tokens): tokyo-night, pixel-orbit (from 8-bit-orbit; digit-leading id avoided), vellum, retro-win95, neo-brutalist, sakura-chroma, cobalt-grid, pastel-card. primaryText not set on any (all primaries pass ≥4.5 as text; accents decorative-only, noted in comments).
- WCAG evidence: wrote scripts/wave2-contrast-check.cjs (plain relLuminance), output saved to tool-results/wave2-contrast-evidence.txt — ALL CHECKS PASS. primary/bg: tokyo 6.79, pixel-orbit 11.78, vellum 7.59, retro-win95 8.80, neo-brutalist 20.69, sakura 5.10, cobalt 7.11, pastel 5.53. muted ≥4.85 everywhere. chart series ≥3:1 on surface AND bg (min 3.04 sakura-bg). Stepped source colors, noted in descriptions: sakura red #E5392A→#B7271b, blue #3F8BC4→#3c84ba, green→#378f40, orange→#c26f0f, pink→#c22e6f; cobalt muted #5560E5→#454dc2; pastel lilac-d #7b5dc4→#6f54b4, lemon-d→#b48309, peach-d→#d96f2f; neo-brutalist pink→#ec559b, green→#00a160, orange→#c96f00; retro-win95 green→#007600, olive→#666600, teal→#007070; vellum teal #3a7878→#5f9d9d (lighter step, 3.58 non-text).
- Decor: only 2 NEW motif kinds truly needed — 'pixels' (8-bit checkerboard conic-gradient) for Pixel Orbit and 'titlebar' (navy→teal window bar + 3 bevel buttons via ::after box-shadow) for Retro Win95. Extended ThemeTokens.decor union additively in src/lib/deck/types.ts, added 2 cases in SlideView Decor(), added static token-driven styles in deck.css (.decor-pixels opacity .22, .decor-titlebar uses --s-primary/--s-accent/--s-surface/--s-border). No animation; reduced-motion safe by construction. Other 6 themes reuse existing motifs (rule-top ×2, corner, frame, dots, tape).
- Fonts: appended 10 new Google families to BOTH FONTS_HREF (src/app/layout.tsx) and FONT_HREF (src/lib/export/html.ts), no duplicates: Tektur, Chakra Petch, Space Mono, Press Start 2P, VT323, Courier Prime, Albert Sans, Hanken Grotesk, Newsreader, DM Mono; extended Big Shoulders Display weights to include 900 (all 10 verified 200 against fonts.googleapis.com with curl). tokyo-night/neo-brutalist/pastel-card reuse already-loaded families.
- TemplateGallery: SAMPLES entries for 8 new tones (chart/section/quote/bullets/title/stats mixes, neutral content); THEME_GROUPS rebalanced so all 24 have exactly one group — light 4 (incl. cobalt-grid), dark 7 (incl. tokyo-night, pixel-orbit, vellum), tech 3 (incl. retro-win95), editorial 3, warm 3 (incl. sakura-chroma), playful 4 (incl. neo-brutalist, pastel-card); "N of M systems" already derived from THEMES.length (no hardcode found).
- HeroSpecimen: SPECIMENS spec-17..24 added (tokyo chart, pixel section, vellum quote, retro bullets, brutalist section, sakura title, cobalt stats, pastel bullets); header comment → "twenty-four"; REEL counter and dots already derive from SPECIMENS.length.
- Copy sweep → 24: CreateView.tsx:834 "Sixteen systems." → "Twenty-four systems."; layout.tsx metadata "8 curated design systems" → "24 curated design systems" (was still stale from M-e!); HomePage footer "16 systems · 11 layouts · 5 export formats" → "24 systems · …"; README.md feature bullet + architecture line + new "Template provenance" paragraph (24 themes = 8 curated + 16 distilled from decksmith library); PRODUCT.md "8 curated" → "24 curated". docs/council-decision.md + old worklog entries left as historical record.
- Did NOT touch: deck-store, routes, OutlineView, GeneratingView, ExportMenu, CommandPalette, PresentOverlay, or anything under upload/.
- Verification: bun run lint — clean (zero output); bunx tsc --noEmit — zero errors in touched files (remaining errors are pre-existing in backups/, examples/, skills/ and unrelated src files; grep confirmed none reference my files). agent-browser QA: hero REEL cycles to n/24 with 24 dots (+3 transport btns), tokyo/cobalt reels render exact source bgs; gallery 25 radios (Auto + 24), search "tokyo" → "1 of 24 systems" + Auto first, Dark → 7 of 24, Playful → 4 of 24, Tech → 3 of 24, All resets, no hardcoded count; all 8 new preview cards show exact source bg rgb values + decor (pixels conic cyan .22, titlebar navy→teal + #d4d0c8 buttons, sakura radial halftone, pastel tape ::before lilac / ::after peach rotated); editor switcher lists 24; RouteLogic deck switched live to Tokyo Night (#1a1b26 + rule-top gradient) → Retro Win95 (silver + titlebar + Press Start 2P) → Sakura Chroma (cream + halftone + footer "01 / 06" renders) → Cobalt Grid (#f0ebde, --s-chart-1 #1f2be0, Hanken Grotesk) — instant re-theme each time, then restored deck to Cyber Terminal; present mode on Pixel Orbit: fullscreen, nav to 03/10, bg stays #0a0e27, Esc restores editor; 0 page errors; console has one hydration warning verified PRE-EXISTING (reproduced on git-stash baseline without wave-2 files); dev.log status codes 137×200 + 1×201, only 3×400 on /api/ai/outline-item predate this session (earlier QA probe), no 5xx.

Stage Summary:
- THEMES = 24: wave-2 ids tokyo-night, pixel-orbit, vellum, retro-win95, neo-brutalist, sakura-chroma, cobalt-grid, pastel-card — every palette/font pulled from real source CSS, WCAG-checked with saved evidence, 2 new static decor motifs, 10 new Google families wired into both font URLs.
- Zero route/pipeline changes: gallery, editor switcher, Auto AI picker (themeCatalogForPrompt now lists 24), live re-theming, present mode and all exports keep working token-driven; gallery/hero counters all derive from data length.
- Follow-up risks: (1) Google Fonts URL is now ~30 families — page weight grows; consider subsetting or self-hosting if export font-embedding slows further. (2) Press Start 2P display at 46px is intentionally smaller than other display scales — fine on canvas, but AI-composed long titles should be watched. (3) Pre-existing hydration warning + pre-existing tsc errors in backups/examples/skills remain outside this task's ownership. (4) Rejected-for-now candidates (obsidian-claude-gradient, aurora, pin-and-paper, broadside, daisy-days, stencil-tablet, neo-grid-bold, soft-editorial, xiaohongshu-white, graphify-dark-graph) are documented above for a future wave 3 with rationale.

---
Task ID: T-1-verify
Agent: main-agent (Z.ai Code)
Task: Independent browser verification of wave-2 theme absorption (T-1) + user-question response

Work Log:
- User asked "why reject the templates" — explained in reply: council rejected decksmith's vendored runtimes (reveal/impress/shower, 9.4MB) + free-form HTML codegen mode, NOT the template designs; 8 were distilled in M-b, T-1 added 8 more.
- Verified T-1 output independently: bun run lint clean; THEMES count = 24; landing shows all 8 new specimen buttons (Tokyo Night / Pixel Orbit / Vellum / Retro Win95 / Neo Brutalist / Sakura Chroma / Cobalt Grid / Pastel Card) + "TWENTY-FOUR SYSTEMS" copy; gallery search "tokyo" → "1 of 24 systems" (count is dynamic).
- Editor live re-theme verified on Q3 Fintech Review deck: Corporate Clean → Tokyo Night (dark indigo canvas + periwinkle kicker pill, Saved chip fired) → Sakura Chroma (cream riso + deep-red kicker + condensed display). Radix Select automation required keyboard nav (click-points covered by radix spans); typeahead/Arrow+Enter both work.
- Restored deck theme to Corporate Clean afterwards (user state untouched). Console: only devtools info + HMR connected, zero errors. dev.log: no new errors (200s + prisma noise only).

Stage Summary:
- Wave-2 absorption CONFIRMED working end-to-end: 24 token themes total (24 of user's 57 decksmith presets now represented), gallery/editor/exports all theme-driven with zero route changes.
- QA note for future rounds: agent-browser cannot click Radix Select options (span overlay) — use open-dropdown + typeahead/ArrowDown/Enter chains.

---
Task ID: HT-b
Agent: htmlgen-engine-agent
Task: HTML Template Studio — AI generation engine (prompts, assembler, 3 SSE/JSON generation routes, HtmlDeck CRUD + raw viewer route)

Task Summary:
- Built the server-side HTML-generation engine for the "HTML Template Studio" mode: ported decksmith's prompt system + assembler, added scratch-mode (reveal.js / plain) chunked generation, and exposed HtmlDeck CRUD + raw-HTML serving. Contract frozen with HT-c (UI) respected — {deckId} in SSE complete events, no field renames.

Work Log:
- Read worklog (T-1-verify + newest) and ported near-verbatim from upload/decksmith-extracted/src/lib/presentation/{system-prompt,slide-prompt,assemble}.ts + api/generate-{outline,slide}/route.ts: LAYOUT_CATALOG (15 layouts incl. section-divider), STRATEGIES (10), COPYWRITING_FORMULAS (PAS/AIDA/FAB/BAB/COI), BANS, QUALITY FLOORS, MOTION RULES, per-framework slide-element contracts + notes tags, template digest extraction (<head> + first 2 slides + framework script tags + style.css), detectFramework(html), extractHtml() fence stripper, extractHead/extractScripts/assembleDeck (all 5 frameworks with is-active/aria-selected patching, shower body class, dzslides inlined runtime, impress hint div). DID NOT modify upload/.
- src/lib/htmlgen/prompts.ts: buildOutlineSystemPrompt/UserPrompt (exactly-N slides JSON {title≤60, layout from catalog, content_markdown ~verbosity words, speaker_notes} + subtitle; strategies+formulas embedded; mode-aware "Rendering:" line), buildSlideSystemPrompt/buildSlideUserPrompt (per-call, template digest, framework contract), buildScratchSystemPrompt/UserPrompt (chunked: reveal = plain <section>s + first-chunk <style> + `<!-- reveal-theme: NAME -->` from the 14 vendored themes; plain = <section class="slide" data-title> + first-chunk full design-system <style> incl. .progress-bar/.slide-counter chrome), extractHtml(), sanitizeMarkdownText (like helpers.sanitizeText but preserves newlines — needed for markdown bodies), OUTLINE_LAYOUTS, REVEAL_THEMES.
- src/lib/htmlgen/assemble.ts: decksmith assemble.ts port + framework 'scratch' passthrough + assembleScratchDeck (reveal: reset/reveal/theme CSS links + plugins init inside .reveal>.slides; plain: .deck + is-active patch + progress-bar + slide-counter + inline keyboard-nav runtime [arrows/space/PgUp/PgDn/Home/End, hash #/N deep-link, no scrollIntoView]) + extractStyleBlocks/escapeHtml exports.
- Routes built (all rate-limited via helpers.rateLimit/clientKey, zai via getZAI, thinking disabled):
  - POST /api/htmlgen/outline — body {brief, mode, templateId?, slideCount?, audience?, tone?, verbosity?}; brief≥10 chars else 400, slideCount clamped 3..20 (default 10); extractJson + sanitizeText (sanitizeMarkdownText for content_markdown); returns bare {title, subtitle, slides:[{title,layout,content_markdown,speaker_notes}]}.
  - POST /api/htmlgen/slides (template mode ONLY) — body {outline, templateId}; JSON 400/404 for invalid body/template, then SSE (named events + type in data): status → status → slide×N per batch → … → status → complete{type,deckId,html,title} / error{type,message}. Batches of 3 with 2-way concurrency inside, strictly ordered emission; loadTemplate() imported from @/app/api/template-content/route; engine via prefix-rule detectEngine copied from /api/templates; failed slides → resilient per-framework placeholders so the deck still completes; req.signal abort + stream cancel() stop scheduling; INSERT db.htmlDeck.
  - POST /api/htmlgen/scratch — body {outline, mode:'reveal'|'plain' (default reveal)}; ≤3 chunked AI calls (even split, 1 retry per chunk, max_tokens 8000), stitches sections + style blocks, AI-picked reveal theme parsed from first chunk comment (fallback black), missing sections padded with placeholders; engine 'scratch-reveal'|'scratch-plain', templateId ''; same SSE contract.
  - GET /api/htmldecks — {decks:[{id,title,subtitle,templateId,engine,createdAt,updatedAt}]} updatedAt DESC take 100, NO html. POST — {title, subtitle?, templateId?, engine?, html (cap 1.5MB → 413), outlineJson? (string or object)} → 201 full bare deck JSON (id,title,subtitle,templateId,engine,html,outlineJson,createdAt,updatedAt ISO).
  - GET/PUT/DELETE /api/htmldecks/[id] — full deck JSON incl. html (bare, not wrapped); PUT partial {title?, subtitle?, html?} returns updated deck; DELETE {ok:true}; Next 16 `await params`.
  - GET /api/htmldecks/[id]/raw — NextResponse(html, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}) — the iframe src.
- Helper src/lib/htmlgen/decks.ts (HTML_CAP + serializeHtmlDeck) so route files only export handlers.
- Verification (dev server had died; restarted detached with setsid; left running):
  - bun run lint: ZERO findings in htmlgen/htmldecks files (repo-wide exit 1 is pre-existing/parallel-agent files: src/components/app/template/TemplatePicker.tsx etc., none mine).
  - bunx tsc --noEmit: ZERO errors in my files; 60 total errors all pre-existing (backups/, examples/, skills/, unrelated src files — same baseline T-1 recorded).
  - POST /api/htmlgen/outline (mode template, templateId studio, slideCount 4) → 200 in ~5s: {"title":"Q3 Logistics Performance Review","subtitle":"Driving efficiency and growth in our logistics operations","slides":[4 × {title, layout ∈ [title,metrics,comparison,cta], content_markdown (newlines preserved), speaker_notes}]}. Short brief → 400.
  - POST /api/htmlgen/slides (outline + templateId studio) → SSE sequence: status("Loading template \"studio\" (open-design)…") → status("Generating slides 1–3 of 4…") → slide{index 0..2,total 4,title}×3 → status("Generating slides 4–4 of 4…") → slide×1 → status("Assembling deck…") → complete{deckId:cmuyjps9l0000nchvdh11umlz, html 37,324 chars, title}. Row in DB via GET /api/htmldecks (engine "opendesign", templateId "studio", no html in list). GET …/raw → 200 text/html; charset=utf-8, contains <div class="deck">, 4 <section class="slide dark/light slide--*"> with studio vocabulary (data-anim ×19) + is-active patch + progress-bar/counter + template runtime.
  - Same route + templateId reveal-dracula → engine "reveal", raw contains class="reveal" + theme/dracula.css + 4 sections + Reveal.initialize (framework branching verified).
  - POST /api/htmlgen/scratch (mode reveal) → status → slide×2 → status → slide×2 → status → complete{deckId:cmuyjqv8m0001nchv1nl15s85}; raw contains 'reveal' ×12, /revealjs/dist/reveal.css, AI-picked theme league.css via theme comment, 4 sections, Reveal.initialize. Mode plain → engine "scratch-plain", .deck wrapper, 4 .slide sections, inline keyboard runtime, zero <script src>.
  - HtmlDeck CRUD: POST 201 (+full JSON), GET by id 200, PUT partial 200 (updatedAt bumped), raw reflects update, 1.6MB html → 413, DELETE {ok:true}, GET/raw after delete → 404.
  - dev.log: no 5xx on any htmlgen/htmldecks route; validation paths return intended 400/404/413.
- SSE wire format (for HT-c): `event: <status|slide|error|complete>\ndata: {"type":"<same>","message"|"index,total,title"|"deckId,html,title":...}\n\n` — slide.index is 0-based; complete returns deckId (NOT id). Scratch htmldecks list rows have templateId "" and engine scratch-reveal|scratch-plain.

Stage Summary:
- HTML Template Studio engine complete: outline → per-slide template-fill (57 templates × 5 frameworks) → assembleDeck, and outline → ≤3-chunk from-scratch decks on vendored reveal.js or hand-rolled HTML — both persisted as HtmlDeck rows and servable at /api/htmldecks/[id]/raw for iframe viewing.
- All HT-c contract shapes verified live: outline JSON, SSE event names/payloads ({type:'status'|'slide'|'error'|'complete'}, deckId), list/create/update/delete/raw endpoints.
- Deviations: none functional. Additive notes: content_markdown uses newline-preserving sanitizer (sanitizeText would destroy markdown lists); scratch route defaults mode to 'reveal' when omitted; slide placeholders keep decks completable when a single AI call fails; scratch outline mode + templateId recorded in outlineJson.
- Follow-ups: dev server under sandbox died twice when backgrounded with nohup — `setsid bun run dev` survives; decksmith-style single-shot full-deck prompt (system-prompt buildSystemPrompt) intentionally NOT ported (per-slide + chunked paths replace it); deck-structure contract constants omitted from prompts.ts for the same reason (assembly is code-side in assemble.ts).

---
Task ID: HT-c (completed by main-agent after deadline cutoff)
Agent: template-ui-agent / main-agent (integration)
Task: Template Studio UI + integration of the HTML template mode (all 57 open-design/JS-library templates, AI fill, scratch mode, viewer, exports)

Work Log:
- HT-c agent built before its deadline: src/lib/store/html-store.ts (zustand: tab/mode/picker/brief/SSE consumption), src/components/app/template/{TemplateModeView,TemplatePicker,HtmlDeckViewer}.tsx, src/components/app/HtmlDeckList.tsx, src/lib/export/html-snapshot.ts (toPngPerSlide/toPngCurrentSlide/toPptx/downloadBlob/slugify, hidden same-origin iframe technique ported from decksmith export.tsx), RecentDecks.tsx + partial HomePage wiring (ModeSwitch tabs studio|template).
- Main-agent integration: mounted HtmlDeckList in HomePage template tab (both reduced-motion + motion branches); footer copy updated (24 systems · 57 templates · 11 layouts · 6 export formats; "Token-rendered · HTML template studio · JS-library decks" replaces "No templates").
- eslint ignores extended to public/templates/**, public/revealjs/**, public/frameworks/** (vendored runtimes were tripping lint; src/ is fully clean).
- HT-b engine (separate agent, verified): src/lib/htmlgen/{prompts,assemble,decks}.ts + /api/htmlgen/{outline,slides,scratch} + /api/htmldecks CRUD + [id]/raw. Contract kept.
- BUG FIXED (speaker notes leak): slides embed <div class="notes"> per the decksmith contract; _shared/base.css hides them but self-contained templates (biennale-yellow) never link it → notes rendered visibly over the slide. Fix: assembleDeck injects `<style>.notes{display:none!important}[role="note"]{display:none!important}</style>` when the head doesn't already declare it. Verified by regeneration (style present, notes still in DOM).
- BUG FIXED (snapshot cssRules SecurityError): Google Fonts <link> in assembled decks lacked crossorigin → html-to-image font inlining threw SecurityError (same bug class M-e fixed for studio). Fix: withCorsFontLinks() in assemble.ts adds crossorigin="anonymous" to fonts.googleapis.com links (idempotent); scratch prompts updated to <link> instead of @import; existing Atlas demo deck patched via PUT.
- E2E (agent-browser, clean console): mode switch → picker (57 cards, search "biennale" → 1, lazy iframes = 0 mounted off-screen) → selected Zhangzara Biennale Yellow → brief → GENERATE → SSE progress ("BUILDING YOUR DECK…") → 8-slide deck in viewer (01/08, template design intact) → PRESENT fullscreen (ESC/←→ hint chip, deck owns keys) → PNG · THIS SLIDE ("1 SAVED", 0 console errors post-fix) → PPTX · SNAPSHOT ("Snapshot PPTX saved." toast) → HtmlDeckList shows deck w/ engine badge → DELETE tested earlier via API → Studio tab regression: Q3 Fintech Review opens in editor, 0 errors.
- Test data cleaned (8 HT-b/curl test decks deleted); Atlas Design System Quarterly All-Hands kept as demo.
- Cron webDevReview recreated (job 443040, fixed_rate 900s) — previous job lost between sessions.

Stage Summary:
- The app now has BOTH modes: Studio (structured, token themes, editable PPTX) + Template Studio (57 real HTML templates incl. reveal.js/impress.js/shower/dzslides JS-library decks, AI-filled, snapshot exports, from-scratch mode). All routes under /api/htmlgen/** + /api/htmldecks/**; DB: HtmlDeck model.
- lint clean; hydration/cssRules console errors proven stale-session artifacts (fresh-load console: 0 entries).
- Risks/next: impress/shower/dzslides engines have no PPTX snapshot (PNG/HTML only, button disabled w/ tooltip); scratch decks from AI may still @import fonts (prompt now bans it — verify on next scratch runs); 57 template iframes add ~2.6MB + runtimes ~7MB static weight (acceptable); template gallery could gain category filter persistence; HtmlDeckList polls via htmldecks:changed event.
