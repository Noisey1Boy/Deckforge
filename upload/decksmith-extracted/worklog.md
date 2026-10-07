# Worklog — AI HTML-to-Presentation Generator

---
Task ID: 1
Agent: main
Task: Initialize Next.js project, load fullstack-dev skill

Stage Summary:
- Project base ready at /home/z/my-project/
- Framer Motion already installed (no install needed)
- z-ai-web-dev-sdk already installed (for AI codegen)
- Need to install: pptxgenjs, html-to-image

---
Task ID: 2
Agent: open-design-analyzer (subagent)
Task: Analyze nexu-io/open-design repo

Stage Summary:
- 48 standalone HTML deck templates + 15 multi-file decks + 36 swappable themes
- Pattern B/C (single self-contained HTML) is best for AI codegen
- Token-driven CSS with `:root` variables, no Tailwind/Bootstrap
- Common vocabulary: `.deck`, `.slide`, `.kicker`, `.h1/.h2/.h3`, `.lede`, `.card`, `.pill`, `.grid.g2/g3/g4`
- Keyboard nav contract: arrows/space/PgUp/PgDn/Home/End, `?preview=N` for iframe single-slide render
- 10 templates curated for the web app

---
Task ID: 3
Agent: skills-analyzer (subagent)
Task: Analyze 4 skill repos for relevant patterns

Stage Summary:
- impeccable: absolute bans list, contrast/typography floors, 4pt spacing scale, semantic z-index, ease-out exponential only motion, AI-slop test
- ui-ux-pro-max: 14 named layouts, 15 deck strategies (YC/Kawasaki/Series A/Duarte Sparkline), 25 copywriting formulas, token contract, contextual decision flow, Chart.js for charts
- ponytail: 7-rung minimization ladder, intensity levels, output contract
- claude-skills: 5-layer system-prompt architecture, MUST DO/MUST NOT DO lists, output templates
- 15 concrete rules to encode into AI system prompt + 15 into UI/UX

---
Task ID: 4a
Agent: main
Task: Copy 10 curated templates + shared assets into public/templates/

Work Log:
- Created public/templates/ with subdirectories for each template
- Copied shared assets to _shared/ (base.css, fonts.css, runtime.js, animations/, themes/)
- Copied 10 templates: pitch-deck, weekly-report, bold-poster, coral, monochrome, vellum, creative-mode, raw-grid, presenter-mode
- Patched relative paths in multi-file templates (weekly-report, presenter-mode) from `../../../assets/` → `../_shared/`
- Installed pptxgenjs@4.0.1 and html-to-image@1.11.13
- Copied creative-mode/assets/deck-stage.js (referenced by template)

Stage Summary:
- /public/templates/ has 10 template folders, each with template.html (+ optional style.css)
- /public/templates/_shared/ has the shared design system
- /public/templates/templates.json manifest with metadata for gallery

---
Task ID: 4-5
Agent: main
Task: Build API routes + system prompt + store

Work Log:
- /api/templates GET — returns manifest JSON
- /api/template-content GET — returns raw HTML of a template by id
- /api/generate POST — calls z-ai-web-dev-sdk with skill-encoded system prompt
- /lib/presentation/system-prompt.ts — encodes impeccable + ui-ux-pro-max + ponytail rules
- /lib/presentation/store.ts — Zustand store for client state
- /lib/presentation/export.tsx — PPTX export via html-to-image + pptxgenjs, HTML download
- extractTemplateDigest() — keeps prompt tight by sending only <head> + first 3 slides + <script>

Stage Summary:
- AI generation takes 80-180 seconds per deck (acceptable for v1)
- 5 successful generations tested via curl and via UI

---
Task ID: 6-9
Agent: main
Task: Build UI components, integrate Framer Motion, verify

Work Log:
- /components/presentation/input-panel.tsx — brief textarea, example prompts, audience/tone/focus inputs, slide slider
- /components/presentation/template-gallery.tsx — 10 template cards with live iframe previews, auto-select option
- /components/presentation/deck-preview.tsx — sandboxed iframe with injected preview-mode script
- /components/presentation/slide-navigator.tsx — thumbnail strip of all slides
- /components/presentation/preview-panel.tsx — main preview, code view, fullscreen, PPTX/HTML export
- /app/page.tsx — landing layout (hero + input + gallery) → studio layout (resizable panels) after generate
- Framer Motion transitions on all interactive elements
- Loading state with animated spinner + 5-step progress checklist
- Error handling with toast notifications (sonner)
- Resizable panels for adjustable input/preview split
- Keyboard nav (arrow keys, space, PageUp/Down) when preview is open

Stage Summary:
- App passes ESLint clean (after fixing react-hooks/set-state-in-effect via useSyncExternalStore + useMemo)
- Browser-verified: landing page renders all 10 templates with live previews
- Browser-verified: Tech Talk brief → AI generated 5-slide deck in ~2 min
- Browser-verified: Slide navigation (1→2→3) works, slide content updates correctly
- Browser-verified: Generated deck title "Edge-First Databases for Sub-10ms Reads" matches brief
- Browser-verified: Code view toggle, fullscreen mode, HTML download all functional
- PPTX export implemented (renders slides to PNG via html-to-image, assembles via pptxgenjs)
- Test artifacts cleaned up

---
Task ID: 10
Agent: main
Task: Final verification

Stage Summary:
- App running at http://localhost:3000 (preview: https://preview-{bot-id}.space-z.ai/)
- Lint clean
- AI generation working end-to-end
- 10 templates from open-design repo all rendering in gallery
- Skill rules from 4 repos encoded into AI system prompt (impeccable + ui-ux-pro-max + ponytail + claude-skills)
- Framer Motion integrated for UI transitions
- PPTX + HTML export implemented
- Ready for user testing

---
Task ID: 11
Agent: main
Task: Expand template library from 10 curated to all 45 html-ppt templates

Work Log:
- Wrote /scripts/import-all-templates.py to bulk-import all html-ppt* folders
- Script parses SKILL.md YAML frontmatter for name/description/triggers/scenario
- Script extracts palette from :root tokens, fonts from @import URLs, slide count from <section class="slide">
- Script copies example.html → template.html + any assets/ subfolder
- Skipped 2 templates with 0 slides (editorial-tri-tone, peoples-platform)
- Updated template-gallery.tsx with:
  - Search box (filters by name/tagline/style/tags/bestFor)
  - Category filter chips (All/Business/Creative/Editorial/Education/Engineering/Social/Tech)
  - IntersectionObserver-based lazy iframe loading (critical for 45 templates)
  - Animated grid with layout animations
  - Category badge on each card
- Updated generate API route:
  - Added autoSelectTemplate() — keyword-based template picker for "auto" mode
  - 13 signal categories: pitch, weekly-report, product-launch, tech-sharing, course, brutalist, scholarly, brand, cyber, graph, testing, knowledge, social
  - Falls back to pitch-deck for unknown content
  - Returns autoSelected flag in meta
- Updated store.ts: templateId null → 'auto' instead of 'pitch-deck'
- Updated preview-panel.tsx: shows "Auto-selected <template>" badge when autoSelected=true
- Updated system-prompt.ts: mentions 45+ template library
- maxDuration raised to 180s for larger generations

Stage Summary:
- 45 templates from open-design repo now bundled (was 10)
- Categories: Editorial 30, Education 3, Tech 3, Business 3, Engineering 2, Creative 2, Social 2
- Total templates disk size: 2.1 MB
- Auto-select verified end-to-end: research paper brief → AI auto-selected "vellum" template → generated 4-slide "Effects of Sleep Deprivation on Cognitive Performance" deck with vellum's scholarly dark-navy aesthetic
- Search and category filter verified working in browser
- Lazy iframe loading prevents page freeze when 45 templates are in gallery
- ESLint clean

---
Task ID: 12
Agent: main
Task: Integrate reveal.js framework — install, create 7 themed templates, update preview/export/prompt to be framework-aware

Work Log:
- Installed reveal.js@6.0.1 via bun add
- Copied reveal.js dist assets to /public/revealjs/dist/:
  - reveal.css, reveal.js, reveal.mjs, reset.css
  - 14 theme CSS files (black, white, dracula, league, solarized, night, moon, beige, blood, sky, simple, serif, etc.)
  - 5 plugins (notes, markdown, highlight, math, search, zoom) as flat .js + .mjs files
  - highlight/ subfolder with monokai.css, zenburn.css themes
- Wrote /scripts/build-reveal-templates.py — generates 7 themed templates programmatically:
  - reveal-black, reveal-white, reveal-dracula, reveal-league, reveal-solarized, reveal-night, reveal-moon
  - Each has 7-slide demo deck with cover/problem/solution/traction/roadmap/quote/thanks structure
  - Custom helper classes: .kicker, .lede, .grid-2/.grid-3/.grid-4, .card, .big-number, .pill, .quote, .timeline, .bullets
  - --accent CSS variable per theme (#42affa for black, #ff79c6 for dracula, etc.)
- BUG FIXED: initial templates referenced plugins as /plugin/notes/notes.js (subfolder) but reveal.js 6 ships them as flat /plugin/notes.js — fixed via script regeneration
- Updated /components/presentation/deck-preview.tsx:
  - Added detectFramework() — checks for class="reveal" / Reveal.initialize / /revealjs/ markers
  - Framework-aware preview script: for reveal.js, hooks Reveal.initialize() to inject a ready callback that navigates to slide N and hides chrome
  - Framework-aware slide count regex: for reveal.js, counts <section> inside <div class="slides">
- Updated /lib/presentation/export.tsx:
  - Added isRevealDeck() detector
  - Existing slide-section extraction already falls back to plain <section>, so reveal decks export correctly
- Updated /lib/presentation/system-prompt.ts:
  - Added REVEAL_DECK_STRUCTURE contract (separate from open-design DECK_STRUCTURE)
  - buildSystemPrompt() now detects framework from template HTML and picks the right contract
  - extractTemplateDigest() framework-aware: for reveal.js, extracts <section> from <div class="slides"> AND includes <script src> tags
  - Updated BANS list: reveal.js itself is allowed (exception), other JS libs still banned
  - Updated WORKFLOW: separate instructions for reveal.js (use <aside class="notes">) vs open-design (use <div class="notes">)
- Updated /api/generate/route.ts:
  - Auto-select function extended: "reveal.js" / "syntax highlighting" / "code walkthrough" → reveal-dracula; "tutorial" / "lecture" → reveal-solarized
- Updated /components/presentation/template-gallery.tsx:
  - Added amber "reveal.js" badge on cards where tpl.framework === 'reveal.js'
- Updated /lib/presentation/store.ts: TemplateMeta type extended with framework field
- Updated eslint.config.mjs: added public/revealjs/** to ignores (reveal.js's own bundled files have lint warnings)

Stage Summary:
- 52 total templates: 45 open-design + 7 reveal.js
- AI generation verified with reveal-dracula template: brief about WebSocket chat app → AI produced 6-slide reveal.js deck with proper class="reveal"/class="slides"/Reveal.initialize structure, dracula theme linked, <aside class="notes"> for speaker notes, in 34 seconds
- All 7 reveal.js themes verified rendering correctly in browser (each has distinct color palette)
- Deck preview correctly displays reveal.js slides by hooking Reveal.initialize's ready callback to navigate to slide N
- Export logic handles reveal.js decks via plain <section> fallback selector
- Auto-select routes code-heavy/tutorial briefs to reveal.js templates
- ESLint clean (reveal.js's own bundled JS excluded from lint)

---
Task ID: 1
Agent: framework-researcher
Task: Research which HTML presentation frameworks are actively maintained and suitable for integration

Work Log:
- Read worklog.md: prior context = reveal.js already integrated at /public/revealjs/, 7 themed reveal.js templates, 45 open-design templates, framework-aware preview/export/system-prompt already built
- Used `web-search` skill + raw.githubusercontent.com fetches + GitHub atom feeds (API was rate-limited) to investigate each of the 11 candidate frameworks
- For each framework checked: last commit date (via commits.atom feed), npm publish date (via registry.npmjs.org), README contents, slide HTML structure, dependencies (jQuery/build-step), CDN availability
- Cross-checked dainiak.com HTML presentation frameworks list and Bespoke.js (the Fathom.js successor) for additional context

Findings per framework (last commit | npm | verdict):
- CSSS (LeaVerou/csss) — RENAMED to Inspire.js. Use inspirejs.org npm package. Last commit June 2026. ✅ ADD (as Inspire.js)
- deck.js — last commit May 2016 (10y stale), jQuery+Modernizr dependency, not on npm. ❌ SKIP
- DZSlides — last commit Oct 2017 (9y stale), single self-contained HTML file, not on npm. ⚠️ CONSIDER (works as-is, no deps, but no maintenance)
- Fathom.js — README explicitly says "no longer maintained", suggests Bespoke.js. jQuery. ❌ SKIP
- html5slides — Google Code Archive (Google Code shut down 2016). ❌ SKIP
- impress.js — last commit Sep 2025, v2.0.0 release Jul 2022, on jsdelivr CDN, npm pkg `impress.js` stale at 1.1.0 but GitHub v2.0.0 is current, vanilla JS (no jQuery), 3D CSS transforms. ✅ ADD
- POW! — last commit April 2011 (15y stale). ❌ SKIP
- S5 — Eric Meyer's 2005 framework, no GitHub repo, homepage on meyerweb.com only. ❌ SKIP
- Scrolldeck.js — last commit 2012, jQuery plugin. ❌ SKIP
- Shower (shower/shower) — last commit June 29 2026 (3 days ago!), npm packages @shower/core@3.5.1, @shower/ribbon, @shower/material, vanilla JS, modular engine+themes, printable PDF. ✅ ADD
- Slippy — last commit June 2018 (8y stale), jQuery-based. ❌ SKIP
- Bespoke.js (Fathom's recommended successor, bonus check) — last commit Sep 2020 (5y stale). ❌ SKIP

Stage Summary:
- 3 frameworks strongly recommended for ADD: impress.js, Inspire.js (formerly CSSS), Shower
- 1 framework borderline CONSIDER: DZSlides (single-file, stable, minimalist — but stale)
- 7 frameworks to SKIP (dead/archived/jQuery-only/duplicate)
- Final shortlist (4-5 frameworks total including existing reveal.js):
  1. reveal.js (existing) — comprehensive, professional
  2. impress.js — 3D CSS transforms / Prezi-style spatial navigation
  3. Inspire.js — CSS-first, lean, hackable (Lea Verou's project, was CSSS)
  4. Shower — modern modular, Ribbon + Material themes (vanilla JS, printable PDF)
  5. (optional) DZSlides — single-file minimalist snapshot
- Diversity coverage achieved: comprehensive (reveal.js), 3D/transforms (impress.js), CSS-first/lean (Inspire.js), modern-themed (Shower). Scrolling-style gap noted — no actively-maintained candidate in the user's list; recommend using reveal.js overview mode or building a custom scrolldeck-style template instead
- Next action: integrate the 3-4 chosen frameworks by copying dist assets to /public/frameworks/<name>/ following the same pattern as /public/revealjs/, then add framework detection to deck-preview.tsx and framework contracts to system-prompt.ts

---
Task ID: 13
Agent: main
Task: Add 3 more HTML presentation frameworks (impress.js, Shower, DZSlides) based on user-provided HTML-presentation-tools.md

Work Log:
- Read /home/z/my-project/upload/HTML-presentation-tools.md (12 frameworks listed)
- Dispatched research subagent (Task ID: 1) to investigate maintenance status of each framework
- Research verdict: 3 frameworks suitable for integration (impress.js, Inspire.js, Shower), 1 optional (DZSlides), 8 to skip (dead/jQuery-coupled/archived)
- Installed @shower/core@3.5.1, @shower/ribbon@4.2.0, @shower/material@3.2.0 via bun
- Initially installed inspirejs.org but discovered it's pure ESM with relative imports requiring a bundler — DROPPED Inspire.js from integration (incompatible with sandboxed iframe / static-file pattern)
- Downloaded impress.js v2.0.0 from jsdelivr → /public/frameworks/impressjs/impress.js (183KB) + impress-demo.css (20KB)
- Downloaded DZSlides template.html from GitHub → /public/frameworks/dzslides/template.html (19KB, single-file format)
- Wrote /scripts/bundle-shower-css.py to inline all @import statements from Shower's fragmented CSS into single ribbon.css / material.css (16KB each)
- Fixed Shower font paths: copied PT Sans fonts to /public/frameworks/shower/themes/fonts/ribbon/, Roboto fonts to /public/frameworks/shower/themes/fonts/material/, patched CSS to use ./fonts/<theme>/ paths
- Removed decorative grid.svg / ribbon.svg references (only used in full mode, were causing 404s)
- Wrote /scripts/build-framework-templates.py — generates 5 framework templates:
  - impress-spatial (3D spatial, light theme, blue accent)
  - impress-dark (3D spatial, dark navy, electric-cyan accent)
  - shower-ribbon (Shower Ribbon theme, light, blue accent stripe)
  - shower-material (Shower Material theme, Google Material Design, indigo accent)
  - dzslides-minimal (single-file, plain sections, no dependencies)
  Each has 7-slide demo (Cover/Problem/Solution/Traction/Roadmap/Quote/Thanks) with custom helper classes
- Updated /lib/presentation/store.ts: TemplateMeta.framework type extended to include 'impress.js' | 'shower' | 'dzslides'
- Updated /components/presentation/deck-preview.tsx:
  - detectFramework() now recognizes 5 frameworks (reveal, impress.js, shower, dzslides, open-design, plain)
  - countSlides() framework-aware: impress.js counts .step elements, others count <section>
  - Preview script per framework:
    - reveal.js: hooks Reveal.initialize() ready callback → Reveal.slide(N)
    - impress.js: hooks impress().init() then api.goto(steps[N], 0)
    - shower: hooks window.shower.player.go(N+1) (Shower is 1-indexed)
    - dzslides: toggles [aria-selected] attribute on sections
    - open-design / plain: hides all sections except slideIndex
- Updated /lib/presentation/system-prompt.ts:
  - Added 3 new deck structure contracts: IMPRESS_DECK_STRUCTURE, SHOWER_DECK_STRUCTURE, DZSLIDES_DECK_STRUCTURE
  - buildSystemPrompt() detects framework from template HTML and picks the right contract + notes tag + inline note
  - extractTemplateDigest() framework-aware: extracts slides per framework's structure (.step for impress, .slide for shower, plain <section> for dzslides, etc.)
  - BANS list updated to allow all 5 frameworks' external assets via /revealjs/ or /frameworks/<name>/
- Updated /lib/presentation/export.tsx:
  - Framework-aware slide extraction: detects #impress container and extracts .step elements
  - Slide rendering resets transforms (transform: none) so impress.js slides don't carry 3D positioning into the export stage
- Updated /api/generate/route.ts autoSelectTemplate(): added 5 new triggers for impress.js (3d/spatial/prezi/camera/zoom), shower (material design/google-style), dzslides (single-file/minimalist/offline)
- Updated /components/presentation/template-gallery.tsx: framework badges with distinct colors per framework (amber for reveal.js, fuchsia for impress.js, emerald for shower, rose for dzslides)
- Updated eslint.config.mjs: added public/frameworks/** to ignores

Stage Summary:
- 5 frameworks now supported: open-design, reveal.js, impress.js, shower, dzslides
- 57 total templates: 45 open-design + 7 reveal.js + 2 impress.js + 2 shower + 1 dzslides
- AI generation verified with impress.js: 45-second generation produced a 7-slide "Journey Through the Solar System" deck with proper id="impress", .step elements, data-x/data-rotate/data-scale attributes, <div class="notes"> speaker notes, and /frameworks/impressjs/ asset paths
- All 5 framework templates verified rendering in browser with distinct visual styles:
  - impress-spatial: light (243/244/245)
  - impress-dark: dark navy (11/15/27)
  - shower-ribbon: gray (174/175/177)
  - shower-material: light green-tinted (217/232/218)
  - dzslides-minimal: near-white (246/246/246)
- Framework badges in gallery: amber (reveal.js), fuchsia (impress.js), emerald (shower), rose (dzslides)
- ESLint clean (all framework assets excluded from lint)
- All 8 skipped frameworks documented in research briefing: deck.js (jQuery, dead 2016), Fathom (abandoned), html5slides (Google Code dead), POW! (2011), S5 (2005), Scrolldeck (jQuery, 2012), Slippy (jQuery, 2018), Bespoke (2020)

---
Task ID: 14
Agent: presenton-researcher
Task: Research presenton/presenton repo — features, architecture, AI flow, export options, UI/UX

Work Log:
- Read worklog.md to understand Decksmith context: Next.js 16 + TypeScript + Tailwind + z-ai-web-dev-sdk + pptxgenjs + html-to-image + Framer Motion + 5 presentation frameworks (open-design/reveal.js/impress.js/shower/dzslides) + 57 templates + skill-encoded system prompt
- Shallow-cloned https://github.com/presenton/presenton.git to /home/z/my-project/research/presenton/ (10,065 files)
- Read README.md (697 lines): Apache 2.0, self-hosted (Docker) + Desktop (Electron Mac/Win/Linux), BYOK for 16 LLM providers, 8 image providers, 5 web search providers, PPTX+PDF export, MCP server, Mem0 presentation memory, LiteParse document parsing, single-admin auth, /api/v1/ppt/presentation/generate API
- Read manifests: presenton uses Next.js 16.2.6 + React 19 + Redux Toolkit + Tailwind 3 + Radix UI + shadcn/ui + TipTap + Chart.js + Recharts + Mermaid + Prism + html2canvas + Python (FastAPI + python-pptx + sqlmodel + alembic + mem0ai + fastembed + LiteParse + google-genai + openai + llmai abstraction)
- Located monorepo: /servers/nextjs (frontend + some API), /servers/fastapi (AI/LLM/export backend), /electron (desktop wrapper), /scripts (sync), /docs
- Read /servers/fastapi/api/main.py: FastAPI app with routers for ppt/webhook/auth/mock, SessionAuthMiddleware, UserConfigEnvUpdateMiddleware, static icon fallback
- Read /servers/fastapi/api/v1/ppt/endpoints/presentation.py (1278 lines): full presentation generation flow — /create, /prepare, /stream/{id} (SSE), /generate, /generate/async, /status/{id}, /edit, /update, /all, /{id}. Multi-step pipeline: outlines → structure → per-slide content (batched 10) → assets → export
- Read AI pipeline files:
  - generate_presentation_outlines.py — single LLM call, streaming, system prompt asks for title + slide content (markdown), uses dynamic JSON Schema response_format with strict=True. Verbosity controls 20/40/60 words per slide. Native web search (OpenAI/Google/Anthropic) or external (SearXNG/Tavily/Exa). Separate query generation LLM call before search.
  - generate_presentation_structure.py — separate LLM call to pick a layout index for each slide based on content (tables → table layout, numeric tables → chart layout with n-1 charts for n cols, no image layouts unless content has images, adjacent layouts should differ)
  - generate_slide_content.py — per-slide LLM call, uses the slide layout's JSON Schema as response_format. Adds __speaker_note__ field (100-500 chars). Markdown emphasis rules. Tone + verbosity instructions.
- Read chat prompts.py and tools.py: AI chat assistant uses tool-calling with 16 tools (getPresentationOutline, searchSlides, getSlideAtIndex, saveSlide, deleteSlide, setPresentationTheme, generateAssets, getAvailableLayouts, getContentSchemaFromLayoutId, addOutline, updateOutline, deleteOutline, moveOutline, getOutlineDraft, getPresentationThemeCatalog, generateImage, generateIcon). System prompt enforces tool-first protocol, autonomous edits, length retries.
- Examined template system: 13 template families in /servers/nextjs/app/presentation-templates/ (general, pitch-deck, Report, Code, Education, ProductOverview, modern, standard, swift, neo-general, neo-modern, neo-standard, neo-swift). Each template = a folder of React TSX components, one component per slide layout. Each component exports a Zod schema that becomes the JSON Schema passed to the LLM as response_format. Settings.json per template has: description, ordered (bool), default (bool), icon_weight (thin/regular/bold). ~250 total slide layouts across 13 families.
- Read /servers/nextjs/app/presentation-templates/general/IntroSlideLayout.tsx: React component using Tailwind + CSS variables (var(--primary-color), var(--background-text), var(--card-color), var(--stroke), var(--heading-font-family)) driven by theme. Layout is fixed 1280x720 (aspect-video). Zod schema validates fields with min/max lengths.
- Read export pipeline: /servers/fastapi/utils/export_utils.py + services/export_task_service.py. Export = spawn a Node.js child process (the "presentation-export" runtime v0.3.6) that uses Puppeteer to load the Next.js page /pdf-maker?id=<uuid>, render all slides as 1280x720 fixed-size HTML, then print to PDF (Chromium print) or screenshot to PNG + assemble PPTX via python-pptx. Three task types: 'export' (pdf/pptx from URL), 'pptx-to-html' (parse existing PPTX back to HTML), 'extract-schema' (parse PPTX → JSON schema for custom template). Cookie header forwarded for auth during headless render.
- Read /servers/nextjs/app/(export)/pdf-maker/PdfMakerPage.tsx: client-only page that fetches presentation data from /api/export-presentation-data/[id] (with x-export-cookie header), renders all slides stacked vertically as 1280x720 divs with @media print @page { size: 1280px 720px; margin: 0; } so each slide becomes one PDF page. Applies theme by setting CSS variables on #presentation-slides-wrapper.
- Read UI pages: /upload (UploadPage), /outline (OutlinePage with tabs Outline/LAYOUTS), /presentation (PresentationPage 3-column: 120px thumbnail sidebar + 1280px main slide area + 370px Chat panel), /custom-template (template-from-PPTX flow with FileUploadSection + SchemaEditor + FontManager), /dashboard (presentation grid), /settings (Text/Image/WebSearch providers), /theme (custom theme builder)
- Read PresentationPage.tsx (422 lines): supports PresentationMode (fullscreen presenter view with auto-hiding chrome + speaker notes toggle + keyboard nav), auto-save (debounced 2s), follow-mode (chat agent auto-scrolls to slide being edited), Chat panel with glowing slide highlighting when agent is editing
- Read ThemeSelector.tsx: theme = {data: {colors: {primary, background, card, stroke, primary_text, background_text, graph_0..9}, fonts: {textFont: {name, url}}}}. Themes are stored in DB, applied via CSS variables on wrapper element. Custom theme builder at /theme route.
- Read image_generation_service.py (890 lines): 9 image providers — Pexels, Pixabay (stock), Gemini Flash, NanoBanana Pro, DALL-E 3, GPT-image-1.5 (generative), ComfyUI (self-hosted workflow), Open WebUI (compatible endpoint), OpenAI-compatible. ImageAsset SQL model tracks generated/uploaded images.
- Read icon_finder_service.py: local vector store over Phosphor icons using fastembed AllMiniLML6V2 embeddings. LLM provides icon query → semantic search → returns SVG URL. icon_weight (thin/regular/bold) per template.
- Read SQL schema: PresentationModel (id, content, n_slides, language, title, outlines JSON, layout JSON, structure JSON, tone, verbosity, instructions, include_table_of_contents, include_title_slide, web_search, theme JSON, created_at, updated_at), SlideModel (presentation FK, layout_group, layout, index, content JSON, html_content, speaker_note, properties), ImageAsset, TemplateModel (custom templates), PresentationLayoutCodeModel (TSX layout code as text — supports user-created layouts), AsyncPresentationGenerationTaskModel (background job status), ChatHistoryMessage, WebhookSubscription, KeyValue
- Confirmed /api/v1/ppt/presentation/generate API: takes content + n_slides + language + tone + verbosity + instructions + include_table_of_contents + include_title_slide + web_search + template + files + slides_markdown + export_as. Returns presentation_id + path + edit_path. Also /generate/async with /status/{id} polling.
- Confirmed MCP server: /servers/fastapi/mcp_server.py exposes presentation generation as MCP tools for Claude Desktop / Cursor etc.

Stage Summary:
- Presenton is the most production-ready open-source AI presentation generator. Key takeaways for Decksmith:
  1. AI PIPELINE: 3-stage (outline → structure → per-slide content), each with JSON Schema response_format and strict validation. Per-slide calls run concurrently in batches of 10 — much faster than our single mega-prompt. Total ~12 LLM calls for 10 slides.
  2. TEMPLATES AS SCHEMAS: Each slide layout is a React TSX component with a Zod schema → JSON Schema → LLM response_format. LLM generates structured data, not HTML. ~250 layouts across 13 families. THIS IS THE BIG ARCHITECTURAL DIFFERENCE.
  3. EXPORT: Headless Chromium (Puppeteer) renders /pdf-maker page → PDF (print) or PPTX (screenshot each slide + python-pptx assembly). Produces fully-editable PPTX. Their pdf-maker page uses fixed @page { size: 1280px 720px } + break-after: page per slide.
  4. CHAT EDITING: AI assistant with 16 tools manipulates live SQL slides (read slide → validate schema → saveSlide with retry on maxLength). System prompt enforces tool-first, autonomous decisions.
  5. THEMES: Decoupled from templates. Theme = {colors: 11 tokens + graph_0..9, fonts: textFont}. Stored in DB. Applied via CSS variables. Templates use var(--primary-color) etc.
  6. IMAGES+ICONS: 9 image providers (stock + generative + self-hosted). Icons = local vector store over Phosphor SVGs using fastembed embeddings (no API call needed).
  7. WEB SEARCH: Native (OpenAI/Google/Anthropic) or external (SearXNG/Tavily/Exa). Separate LLM call to generate the search query first.
  8. UX FLOW: Upload page (prompt + files + tone/verbosity/language/sliders) → Outline page (edit/reorder outlines + pick template) → Presentation page (3-column: thumbnails + main + chat). Inline per-slide AI edit popover. Fullscreen PresentationMode with speaker notes.
  9. CUSTOM TEMPLATES FROM PPTX: extract-schema task uses Puppeteer to parse uploaded PPTX → JSON schema + TSX layout code → saved to DB as reusable custom template.
  10. INFRA: FastAPI+SQLModel+Alembic (SQLite default, Postgres/MySQL supported). Mem0 OSS for presentation memory (per-presentation RAG). LiteParse for PDF/DOCX/XLSX parsing. MCP server for agentic integrations.
- Concrete borrowing recommendations for Decksmith: (a) split our monolithic generate call into outline→layout-pick→per-slide batched concurrent generation, (b) adopt JSON-Schema response_format per slide for guaranteed structure, (c) add a chat edit assistant with tool-calling for post-generation edits, (d) add Tone + Verbosity + include_title_slide + include_table_of_contents as API params, (e) decouple themes from templates via CSS variables, (f) add a /pdf-maker-style fixed-@page print CSS route for Chromium PDF export, (g) add web search query generation step before outline LLM call, (h) add inline per-slide edit popover (SlideContent.tsx pattern), (i) add PresentationMode with auto-hiding chrome + speaker notes, (j) add custom-template-from-PPTX via Puppeteer extract-schema task.
- Where Decksmith already wins: (a) 5 framework support (open-design/reveal.js/impress.js/shower/dzslides) vs Presenton's single React-Tailwind framework, (b) 57 hand-curated design templates from open-design with distinct aesthetics vs Presenton's same-flavor 13 families, (c) AI generates free-form HTML (creative freedom) vs Presenton's rigid schema-constrained slides (less visual surprise), (d) skill-encoded system prompt from impeccable + ui-ux-pro-max + ponytail + claude-skills (4-skill knowledge base) vs Presenton's plain system prompts, (e) client-side PPTX export via html-to-image + pptxgenjs (no Puppeteer/Chromium server dependency).
- Full briefing with code snippets + file paths delivered in final message.

---
Task ID: 14
Agent: presenton-researcher (subagent)
Task: Research presenton/presenton repo for features to borrow

Stage Summary:
- Cloned presenton to /research/presenton/ — monorepo: Next.js 16 frontend + FastAPI backend + Electron desktop + Puppeteer export subprocess
- Tech: 3-stage LLM pipeline (outline → layout-pick → per-slide concurrent), llmai abstraction (16 LLM providers), SQLModel persistence, ~250 React-TSX layout templates, python-pptx export, MCP server, AI chat assistant with 16 tools
- 10 features recommended to borrow; 5 things Decksmith already does better (5 frameworks vs 1, 57 templates vs 13, free-form HTML generation, skill-encoded prompt, client-side export)

---
Task ID: 15
Agent: main
Task: Implement top borrowable features from presenton

Work Log:
- Implemented 3-stage concurrent AI pipeline (Stage 1: outline ~5-8s, Stage 2: per-slide HTML in batches of 3 ~10-15s)
  - Created /api/generate-outline route: returns JSON {title, slides: [{title, layout, content_markdown, speaker_notes}]}
  - Created /api/generate-slide route: per-slide HTML generation with framework detection + retry on 429/500/502/503
  - Created /lib/presentation/slide-prompt.ts: focused per-slide system prompt builder (much smaller than full-deck prompt)
  - Created /lib/presentation/assemble.ts: wraps N slide HTMLs into complete deck document per framework structure
  - Updated store.ts: new GenStatus type (idle/outline-loading/outline-ready/slides-loading/success/error), Tone + Verbosity state, slideStatuses tracking, batched concurrent generation (BATCH_SIZE=3 to avoid 429s)
- Added Tone + Verbosity UI controls
  - Tone dropdown: default/casual/professional/funny/educational/sales-pitch (borrowed from presenton's enums/tone.py)
  - Verbosity dropdown: concise (~20 words)/standard (~40)/text-heavy (~60) (borrowed from presenton's enums/verbosity.py)
  - Both propagate to outline + slide LLM calls via TONE_LABELS map
- Added Outline Review Panel (borrowed from presenton's OutlinePage.tsx)
  - Slide-in panel from right showing all slide outlines with layout badges
  - Per-slide inline edit (click pencil icon to edit title + content_markdown)
  - Per-slide generation status (pending/loading/done/error) with color-coded cards
  - Progress bar + percentage during stage 2
  - "Generate N slides" approve button
- Added Presentation Mode (borrowed from presenton's PresentationMode.tsx)
  - Fullscreen overlay with auto-hiding chrome (2s timeout on mouse inactivity)
  - Speaker notes panel (extracted from current slide's .notes/aside.notes/[role=note]/details.notes)
  - Keyboard nav: ←/→/space/Esc/N(notes)/F(fullscreen)
  - Click zones: left 1/3 = prev, right 2/3 = next
  - Fullscreen toggle via document.documentElement.requestFullscreen()
- Added Print-CSS PDF export (borrowed from presenton's pdf-maker approach but client-side only)
  - exportToPdf() injects @media print CSS with @page { size: 1280px 720px; margin: 0; } + break-after: page
  - Opens hidden iframe, writes the printable HTML, calls iframe.contentWindow.print()
  - User selects "Save as PDF" in browser's native print dialog — no server-side Chromium needed
- Updated preview-panel.tsx:
  - New status branches: outline-loading (ListChecks spinner), outline-ready (checkmark + slide list preview), slides-loading (per-slide progress grid)
  - Added Present, PDF buttons alongside existing HTML, PPTX buttons
  - Framework badge in toolbar (shows result.meta.framework)
- Updated input-panel.tsx: Tone + Verbosity Select dropdowns, pipeline stage hint at bottom
- Updated page.tsx: renders <OutlinePanel /> + <PresentMode /> at top level
- Added 429/500/502/503 retry logic with exponential backoff (1s, 2s, 4s + jitter) to both /api/generate-outline and /api/generate-slide routes
- Reduced BATCH_SIZE from N (all concurrent) to 3 to avoid z-ai-web-dev-sdk rate limits

Stage Summary:
- 3-stage pipeline verified end-to-end: Tech Talk brief → outline (6.8s) → 4 slides in 2 batches (~14s) → assembled deck — total ~21s (vs 80-180s with old single-call approach = 4-9x speedup)
- All 4 slides generated successfully with proper pitch-deck template styling
- Outline Review Panel lets user edit slide titles + content before approving
- Presentation Mode works: fullscreen + auto-hiding chrome + speaker notes + keyboard nav
- PDF export opens print dialog with proper @page size (1280×720) + break-after:page
- Tone + Verbosity controls propagate through both stages
- Rate limit (429) handling: retry with exponential backoff + batch size 3 = no failures
- ESLint clean
- Old /api/generate route kept for backward compatibility (not called by new UI but still works)

---
Task ID: 16
Agent: main
Task: Redesign entire UI/UX using Nike design tokens (DESIGN-nike.md) + UI-UX pro max skill + Framer Motion

Work Log:
- Cleaned up unnecessary files: removed /research/ (cloned repos), cleared /download/ test artifacts, reset dev.log
- Loaded UI-UX pro max skill (skills/ui-ux-pro-max/SKILL.md) — 4-step workflow for design system tokens, component specs, accessibility
- Installed @fontsource/inter + @fontsource/bebas-neue as open-source substitutes for Nike's Helvetica Now + Futura ND
- Rewrote /src/app/globals.css with Nike design tokens:
  - Colors: ink #111111, canvas #ffffff, soft-cloud #f5f5f5, mute #707072, hairline #cacacb, sale #d30005, success #007d48, info #1151ff, accent-pink #ed1aa0, accent-teal #0a7281
  - Radius: none 0px, sm 18px, md 24px, lg 30px, full 9999px
  - Typography: --font-inter (Inter 400/500/600/700), --font-bebas (Bebas Neue 400), .nike-display class
  - Dark mode support (canvas #0a0a0a, ink #ffffff)
  - Nike utility classes: .nike-btn-primary (black pill CTA), .nike-btn-secondary (soft-cloud pill), .nike-btn-on-image (white pill overlay), .nike-btn-icon (circular 40px), .nike-chip (filter chip with data-active state), .nike-search (search-pill input), .nike-badge-promo, .nike-divider, .nike-card (flat, no shadow, no radius), .nike-scroll (thin scrollbar)
  - Pill press animation: transform: scale(0.97) on :active (Nike's signature tap collapse)
- Rewrote /src/app/layout.tsx: Inter + Bebas Neue via next/font/google
- Rewrote /src/app/page.tsx with Nike editorial structure:
  - Utility bar (32px, soft-cloud bg, uppercase tracking-wider)
  - Primary nav (64px, canvas bg, inset hairline-soft bottom border, swoosh-style logo)
  - Editorial hero: full-bleed ink background, Bebas Neue display headline (clamp 56-112px), accent-pink "polished" highlight, decorative grid lines, billboard stat row (57 templates / 5 frameworks / 21s avg / 3 exports), white pill CTAs
  - Studio layout: input panel (canvas bg) + template gallery (soft-cloud bg) with hairline divider
  - Footer: hairline top border, uppercase tracking-wider mute text
- Rewrote /src/components/presentation/input-panel.tsx:
  - Section header with "BRIEF" uppercase kicker label
  - Textarea: nike-search style with 24px radius
  - Example prompt chips (28px height, 11px font)
  - Audience/Strategy: 2-col grid with nike-search inputs
  - Tone pills: 6 options (default/casual/professional/funny/educational/sales-pitch) as nike-chip with data-active
  - Verbosity pills: 3 options (concise/standard/text-heavy) with word-count hint
  - Slide count: Bebas Neue display number next to slider
  - Generate button: full-width nike-btn-primary (52px height, 15px font)
  - Pipeline hint: uppercase tracking-wider with stage icons
- Rewrote /src/components/presentation/template-gallery.tsx:
  - Search input: nike-search with magnifier icon (24px radius)
  - Category filter chips: nike-chip with data-active state
  - Grid: 2/3/4 cols responsive, 1px gap (Nike PLP style)
  - Auto-select card: inverted (ink bg, canvas text) with Bebas Neue "Auto select" display
  - Template cards: 4:5 aspect ratio thumbnails on soft-cloud, no shadow, no radius, hairline-soft outline
  - Selected state: 2px solid ink outline + checkmark badge (ink bg, canvas text)
  - Framework badge: top-left white pill with framework color (info blue for reveal.js, accent-pink for impress.js, success green for shower, sale red for dzslides)
  - Metadata: name + Bebas Neue slide count, 2-line tagline, swatch dots (Nike-style color row)
  - Lazy iframe loading via IntersectionObserver (200px rootMargin)
- Rewrote /src/components/presentation/slide-navigator.tsx:
  - Square thumbnails (180x101px) on soft-cloud, hairline-soft outline
  - Selected: 2px solid ink outline
  - Slide number: Bebas Neue display in bottom-left ink-bg canvas-text badge
  - Prev/Next: 32px nike-btn-icon circular buttons
  - whileTap scale 0.96 animation
- Rewrote /src/components/presentation/preview-panel.tsx:
  - Toolbar: success dot + uppercase tracking-wider template/framework label, pill button cluster (Code/Preview chip, Present primary pill, Fullscreen icon, HTML/PDF chips, PPTX primary pill)
  - Preview area: 16:9 letterbox on soft-cloud with subtle 1px shadow (Nike's only allowed shadow)
  - Slide nav: nike-btn-icon circular buttons (32px) with opacity-based disabled state
  - Slide counter: white pill top-right with Bebas Neue number + hairline border
  - Code view: ink bg (black), canvas text
  - Loading states: circular spinner (56px ink border-top), Bebas Neue percentage display, 8-col progress grid
  - Fullscreen modal: ink bg, white pill CTAs
- Rewrote /src/components/presentation/outline-panel.tsx:
  - Slide-in animation (spring stiffness 320, damping 32)
  - Header: uppercase tracking-wider kicker + Bebas Neue 3xl deck title
  - Slide rows: flat with hairline-soft dividers, Bebas Neue slide numbers (01, 02, ...)
  - Layout badge: soft-cloud pill with uppercase tracking
  - Inline edit: pencil icon on hover, border-bottom ink input, soft-cloud textarea
  - Footer: full-width nike-btn-primary approve + uppercase tracking hint
  - Progress: Bebas Neue percentage + ink progress bar
- Rewrote /src/components/presentation/present-mode.tsx:
  - Pure black canvas (#000)
  - Slide: 16:9 on canvas bg
  - Auto-hiding chrome (2.5s timeout): gradient top/bottom bars
  - Top bar: white pill Exit button, Bebas Neue slide counter (01 / 10), Notes + Fullscreen white pills
  - Bottom bar: Prev/Next white pills + uppercase tracking keyboard hint
  - Speaker notes overlay: dark glass (rgba(17,17,17,0.96) + blur), accent-pink label
  - Click zones: left 1/3 prev, right 2/3 next
  - Keyboard: ←/→/space/Esc/N(notes)/F(fullscreen)

Stage Summary:
- Complete Nike design system implemented: pure black/white/single-gray palette, pill geometry everywhere (radius-full 9999px), Bebas Neue display tier (96px→56px responsive), Inter UI tier (12-16px), 8px spacing system, zero drop shadows (only 1px hairlines + 1 subtle preview shadow)
- UI-UX pro max principles applied: WCAG AAA touch targets (44px+ pills, 40px icons), keyboard navigation, focus states (ink border on nike-search focus), semantic color usage (sale red only for errors, success green only for confirmation)
- Framer Motion integration: page section reveals (opacity+y with staggered delays), slide-in panels (spring physics), pill press animations (scale 0.97 on :active), progress bar animations, outline panel slide-in (spring 320/32), present mode chrome auto-hide
- All 5 framework badges preserved with distinct colors: reveal.js (info blue), impress.js (accent-pink), shower (success green), dzslides (sale red)
- ESLint clean
- End-to-end verified: Tech Talk brief → outline generated → 4 slides assembled → deck preview shows "Edge-First Database Architecture" with Nike-styled toolbar (Present/HTML/PDF/PPTX pill buttons)
