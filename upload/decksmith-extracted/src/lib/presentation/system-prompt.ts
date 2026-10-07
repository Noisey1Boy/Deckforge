/**
 * System prompt builder for AI presentation HTML codegen.
 * Encodes rules distilled from the 4 skill repos:
 *   - impeccable (frontend design quality)
 *   - ui-ux-pro-max (slide layouts, strategies, copywriting)
 *   - ponytail (minimize, no over-engineering)
 *   - claude-skills (5-layer prompt architecture, MUST/MUST NOT lists)
 *
 * And the open-design template contract:
 *   - Single self-contained HTML file
 *   - .deck > .slide structure
 *   - Token-driven CSS (var(--...))
 *   - Keyboard nav contract
 */

export interface GenerateParams {
  text: string
  templateId: string
  templateHtml: string
  templateCss?: string
  slideCount: number
  audience?: string
  tone?: string
  focus?: string
}

const LAYOUT_CATALOG = `
LAYOUT CATALOG (use one per slide; do not invent new layouts):
- title          : Big title + subtitle + author/date. Animation: fade-up.
- problem        : Headline + 2-3 pain points. Animation: fade-up.
- solution       : Headline + product description + 3 benefit bullets. Animation: scale.
- feature-grid   : 3-6 cards in a grid (.grid.g3 or .grid.g4). Animation: stagger.
- metrics        : 3-4 large KPI numbers with labels and deltas. Animation: count.
- comparison     : Two-column compare (before/after, us/them). Animation: fade-up.
- timeline       : Horizontal or vertical timeline with 4-5 milestones. Animation: stagger.
- team           : 3-6 team member cards with avatar/initials + name + role. Animation: stagger.
- quote          : Large pull-quote with attribution. Animation: fade-up.
- two-column     : Headline left, supporting content right. Animation: fade-up.
- big-number     : Single oversized stat + supporting sentence. Animation: count.
- product-shot   : Product screenshot or visual + caption. Animation: scale.
- pricing        : 3 pricing tier cards. Animation: stagger.
- cta            : Final call-to-action with contact info. Animation: fade-up.
`.trim()

const STRATEGIES = `
DECK STRATEGIES (pick based on user intent; if unclear, default to "kawasaki-10"):
- yc-seed        : 10-12 slides — Cover→Problem→Solution→Traction→Market→Product→Team→Model→Ask→Thanks. Emotion: curiosity→frustration→hope→confidence→trust→urgency.
- kawasaki-10    : 10 slides — the 10/20/30 rule (10 slides, 20 min, 30pt font). Best default.
- series-a       : 12-15 slides — adds detailed traction, unit economics, competitive moat, GTM, financials.
- sales-pitch    : 8-10 slides — PAS (Problem→Agitate→Solve), 3 case studies, pricing, CTA.
- duarte-sparkline: Pattern-break at 1/3 and 2/3 — alternate "What Is" (pain) ↔ "What Could Be" (hope). For keynotes.
- qbr            : 8-10 slides — quarterly business review. KPIs, wins/misses, blockers, next-quarter plan.
- report-weekly  : 6-8 slides — cover, KPI grid, ship list, blockers, next-week plan, thanks.
- educational    : 8-12 slides — hook, learning objectives, concept slides, examples, exercises, summary, resources.
- manifesto      : 5-8 slides — bold editorial. Cover, thesis, 3 pillars, call to action.
- demo-day       : 5-7 slides — Cover→Problem→Solution→Traction→Team→Ask. Ultra-tight.
`.trim()

const COPYWRITING_FORMULAS = `
COPYWRITING FORMULAS (apply per slide based on slide type):
- PAS  (Problem-Agitate-Solve): for problem slides.
- AIDA (Attention-Interest-Desire-Action): for title and CTA slides.
- FAB  (Features-Advantages-Benefits): for solution/feature slides.
- BAB  (Before-After-Bridge): for transformation slides.
- COI  (Cost of Inaction): for risk/urgency slides.
`.trim()

const BANS = `
ABSOLUTE BANS (match-and-refuse; if you find yourself doing any of these, rewrite):
- No Tailwind, Bootstrap, or any CSS framework. Pure hand-rolled CSS only.
  (Exception: the chosen presentation framework itself — reveal.js, impress.js, shower, dzslides — is allowed via /revealjs/ or /frameworks/<name>/ paths.)
- No external JS libraries for slide navigation EXCEPT the chosen framework's own runtime. (No jQuery, no Swiper, no GSAP, no Chart.js.)
- No side-stripe borders, no gradient text on body, no glassmorphism-as-default.
- No identical card grids (vary card content density, avoid 4-cards-with-identical-icon-title-text).
- No "eyebrow" label on EVERY section — use sparingly for hierarchy.
- No numbered-section markers (e.g. "01", "02") on every slide.
- No text overflow — if content doesn't fit, split the slide.
- No hardcoded color values. Use var(--accent), var(--text-1), etc. from :root.
- No external asset references except: (a) Google Fonts via @import, (b) /revealjs/dist/... when template is reveal.js-based, (c) /frameworks/<name>/... when template is impress.js/shower/dzslides-based, (d) the template's own assets/ folder. No other CDN scripts.
- No scrollIntoView() in any runtime — it can scroll the host page.
- No speaker-only text on the visible slide — wrap in the framework's note tag (<div class="notes">, <aside class="notes">, <div role="note">, or <details class="notes"> depending on framework).
- No bounce or elastic easing — ease-out exponential only.
- No animating layout properties (width, height, top, left) — use transform/opacity only.
`.trim()

const FLOORS = `
QUALITY FLOORS:
- Body text contrast >= 4.5:1 against background. Large text >= 3:1.
- Line length 65-75ch for body, never longer.
- Headlines use clamp() with max <= 6rem (~96px).
- Display letter-spacing >= -0.04em (tighter for huge type).
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px (4pt base). No off-scale values.
- Touch targets >= 44x44px (nav arrows, CTA buttons).
- Semantic z-index: dropdown(1000) < sticky(1100) < modal-backdrop(1200) < modal(1300) < toast(1400) < tooltip(1500).
- prefers-reduced-motion: reduce must disable all non-essential animation.
- Use text-wrap: balance on h1-h3, text-wrap: pretty on body prose.
`.trim()

const MOTION_RULES = `
MOTION RULES:
- Use only ease-out exponential (cubic-bezier(0.16, 1, 0.3, 1)) or quart/quint variants.
- Reveal animations must not gate content visibility (slide must be readable without animation).
- Stagger delays: 0ms, 100ms, 200ms, 300ms, 400ms for staggered children.
- All animations must respect @media (prefers-reduced-motion: reduce).
`.trim()

const OUTPUT_CONTRACT = `
OUTPUT CONTRACT (ponytail):
- Output ONLY the HTML file. No preamble, no explanation, no markdown fences.
- The first character must be "<" (start of <!DOCTYPE html>).
- The last character must be ">" (end of </html>).
- After the closing </html>, output a single line: "<!-- skipped: nothing; reasoning: ... -->" (max 120 chars).
- No essays in chat. Code first, one short comment line after.
`.trim()

const DECK_STRUCTURE = `
DECK STRUCTURE CONTRACT (open-design templates):
- Single self-contained HTML file. All CSS inlined in <style> blocks. All JS inlined in <script>.
- Root structure:
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Deck Title</title>
      <style>/* 1. Google Fonts @import */</style>
      <style>/* 2. :root tokens (copied from template, optionally retuned) */</style>
      <style>/* 3. Base reset + slide primitives */</style>
      <style>/* 4. Deck-scoped styles (palette, typography, layout) */</style>
    </head>
    <body>
      <div class="deck">
        <section class="slide is-active" data-title="Cover">...</section>
        <section class="slide" data-title="Problem">...</section>
        ...
      </div>
      <div class="progress-bar"><span></span></div>
      <div class="slide-counter"><span data-current>1</span>/<span data-total>10</span></div>
      <script>/* keyboard nav: arrows/space/PgUp/PgDn/Home/End, S for speaker notes */</script>
    </body>
    </html>
- Each <section class="slide"> MUST have a data-title attribute.
- Speaker notes go inside <div class="notes">...</div> within each slide. They are display:none by default.
- Use these class names from the template's design system: .kicker, .eyebrow, .h1/.h2/.h3/.h4, .lede, .dim, .dim2, .gradient-text, .row, .grid.g2/.g3/.g4, .stack, .center, .tc, .card, .card-soft, .card-accent, .card-hover, .pill, .pill-accent, .divider, .divider-accent, .deck-header, .deck-footer.
- For charts/data viz use CSS-only bars (.traction-bar > .bar with inline height:%) — no Chart.js.
- Wrap decorative SVGs (corner brackets, geometric shapes) inline.
`.trim()

const REVEAL_DECK_STRUCTURE = `
DECK STRUCTURE CONTRACT (reveal.js templates — applies when the template's HTML uses class="reveal" or includes /revealjs/):
- Single self-contained HTML file. External reveal.js assets via <link>/<script> pointing to /revealjs/dist/... are OK (do not inline reveal.js itself).
- Root structure:
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
      <title>Deck Title</title>
      <link rel="stylesheet" href="/revealjs/dist/reset.css">
      <link rel="stylesheet" href="/revealjs/dist/reveal.css">
      <link rel="stylesheet" href="/revealjs/dist/theme/{THEME}.css" id="theme">
      <style>/* scoped deck styles using var(--accent) */</style>
    </head>
    <body>
      <div class="reveal">
        <div class="slides">
          <section>...slide 1 content...</section>
          <section>...slide 2 content...</section>
          ...
        </div>
      </div>
      <script src="/revealjs/dist/reveal.js"></script>
      <script src="/revealjs/dist/plugin/notes/notes.js"></script>
      <script src="/revealjs/dist/plugin/markdown/markdown.js"></script>
      <script src="/revealjs/dist/plugin/highlight/highlight.js"></script>
      <script>
        Reveal.initialize({
          controls: true,
          progress: true,
          center: true,
          hash: true,
          transition: 'slide',
          plugins: [RevealNotes, RevealMarkdown, RevealHighlight]
        });
      </script>
    </body>
    </html>
- Each slide is a plain <section> (NO class="slide"). reveal.js manages visibility internally.
- Speaker notes go inside <aside class="notes">...</aside> within each <section> — reveal.js's notes plugin surfaces these.
- Keep the <link> and <script> tags pointing to /revealjs/dist/... — do NOT inline reveal.js.
- Preserve the template's theme CSS file (e.g. black.css, dracula.css, white.css).
- You MAY use these helper classes in your scoped <style>: .kicker, .lede, .grid-2, .grid-3, .grid-4, .card, .big-number, .big-label, .pill, .quote, .quote-attr, .timeline, .timeline-item, .bullets — these are defined in the template's <style> block, copy them.
- Use reveal.js's built-in fragment syntax for staggered reveals: <p class="fragment">first</p><p class="fragment">second</p> — but do not gate essential content behind fragments.
- For nested slides (vertical navigation), nest <section> inside <section>.
- For backgrounds, use reveal.js's data-background attribute: <section data-background="#1a1a2e">.
- For code highlighting, use <pre><code class="language-js">...</code></pre> with the highlight plugin loaded.
`.trim()

const IMPRESS_DECK_STRUCTURE = `
DECK STRUCTURE CONTRACT (impress.js templates — applies when the template's HTML uses id="impress" or includes /frameworks/impressjs/):
- Single self-contained HTML file. External impress.js assets via <script src="/frameworks/impressjs/impress.js"> are required (do NOT inline impress.js).
- Root structure:
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
      <title>Deck Title</title>
      <link rel="stylesheet" href="/frameworks/impressjs/impress-demo.css">
      <style>/* scoped deck styles using var(--accent) */</style>
    </head>
    <body class="impress-not-supported">
      <div class="fallback-message"><p>Your browser doesn't support impress.js.</p></div>
      <div id="impress" data-transition-duration="800" data-width="1920" data-height="1080" data-perspective="1500">
        <div class="step slide" data-x="0" data-y="0">...slide 1...</div>
        <div class="step slide" data-x="1400" data-y="0">...slide 2...</div>
        <div class="step" data-x="2800" data-y="0" data-rotate="90">...slide 3...</div>
        <div class="step" data-x="4200" data-y="0" data-scale="2">...slide 4 (zoomed out)...</div>
        ...
      </div>
      <script src="/frameworks/impressjs/impress.js"></script>
      <script>impress().init();</script>
    </body>
    </html>
- Each slide is <div class="step slide" data-x="..." data-y="..." [data-z="..."] [data-rotate="..."] [data-rotate-x="..."] [data-rotate-y="..."] [data-scale="..."]>.
- The "step" class is mandatory; "slide" makes it render as a traditional rectangle (white card with shadow).
- Position slides on a 2D/3D canvas using data-x, data-y, data-z. Use data-rotate (Z-axis), data-rotate-x, data-rotate-y for rotation. Use data-scale for zoom.
- Vary the camera path: linear (data-x increments), grid (alternating data-x/data-y), spiral (data-rotate increments), zoom-out (data-scale grows), etc.
- Speaker notes go inside <div class="notes">...</div> within each .step — impress.js hides these by default.
- Keep <link rel="stylesheet" href="/frameworks/impressjs/impress-demo.css"> — do NOT inline impress-demo.css.
- Keep <script src="/frameworks/impressjs/impress.js"></script> and the <script>impress().init();</script> call.
- You MAY use these helper classes in your scoped <style>: .kicker, .lede, .grid, .card, .big, .big-label, .pill, .quote — defined in the template's <style> block, copy them.
- Include a <div class="hint">Use arrow keys or space to navigate · ESC for overview</div> at the bottom for UX.
`.trim()

const SHOWER_DECK_STRUCTURE = `
DECK STRUCTURE CONTRACT (Shower templates — applies when the template's HTML uses class="shower" or includes /frameworks/shower/):
- Single self-contained HTML file. External Shower assets via <link> and <script> are required.
- Root structure:
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
      <title>Deck Title</title>
      <link rel="stylesheet" href="/frameworks/shower/themes/{THEME}.css">
      <style>/* scoped deck styles using var(--accent) */</style>
    </head>
    <body class="shower list">
      <header class="caption">
        <h1>Deck Title</h1>
        <p>Author Name</p>
      </header>
      <section class="slide" id="cover">...slide 1...</section>
      <section class="slide">...slide 2...</section>
      ...
      <div class="progress"></div>
      <script src="/frameworks/shower/core/index.js" defer></script>
    </body>
    </html>
- Each slide is <section class="slide" id="...">. The id is optional but recommended for deep-linking.
- The body MUST have class="shower list" (or class="shower full" for full-bleed mode).
- A <header class="caption"> with deck title + author is the conventional header.
- A <div class="progress"></div> at the bottom shows progress (Shower's built-in progress bar).
- Keep <link rel="stylesheet" href="/frameworks/shower/themes/{ribbon|material}.css"> — preserve the template's chosen theme.
- Keep <script src="/frameworks/shower/core/index.js" defer></script> — do NOT inline shower core.
- Speaker notes are NOT a built-in Shower feature; use <details class="notes">...</details> if needed.
- You MAY use these helper classes in your scoped <style>: .kicker, .lede, .grid, .grid-3, .card, .big, .big-label, .pill, .quote, .timeline, .timeline-item, .bullets — defined in the template's <style> block, copy them.
- Shower is natively keyboard-accessible (arrow keys, space, ESC for overview) and PDF-printable.
`.trim()

const DZSLIDES_DECK_STRUCTURE = `
DECK STRUCTURE CONTRACT (DZSlides templates — applies when the template's HTML includes /frameworks/dzslides/ or uses [aria-selected] on <section>):
- Single self-contained HTML file. NO external assets — all CSS and JS must be inlined in <style> and <script> blocks.
- Root structure:
    <!DOCTYPE html>
    <meta charset="utf-8">
    <title>Deck Title</title>
    <style>/* all CSS inlined here */</style>
    <header>Deck Title</header>
    <footer>by Author Name</footer>
    <section aria-selected="true">...slide 1 (visible)...</section>
    <section>...slide 2 (hidden)...</section>
    ...
    <script>/* minimal keyboard nav inlined */</script>
- Each slide is a plain <section> element (NO class="slide" — DZSlides uses [aria-selected] for state).
- The visible slide has aria-selected="true"; all others have no aria-selected attribute.
- CSS rule: section { opacity: 0; } section[aria-selected="true"] { opacity: 1; }
- <header> and <footer> are fixed chrome on every slide (optional but conventional).
- Speaker notes go inside <div role="note">...</div> within each section — hidden by default via display:none.
- Incremental reveals use class="next" (opacity:0.3 by default, full opacity when parent has [aria-selected]).
- The inlined <script> must handle: ArrowRight/Space/PageDown → next; ArrowLeft/PageUp → prev; Home/End → jump.
- No external <link> or <script src> tags allowed — DZSlides is a single-file format.
- You MAY use these helper classes in your inlined <style>: .kicker, .lede, .grid, .grid-3, .card, .big, .big-label, .pill, .quote — defined in the template's <style> block, copy them.
- After DOMContentLoaded, post {type: 'preview-ready', slide: 0, count: N} to window.parent for iframe preview integration.
`.trim()

const PREVIEW_MODE = `
PREVIEW MODE (for embedding in iframe):
- The runtime must honor URL param ?preview=N to render only slide N (0-indexed).
- When ?preview=N is set, hide .progress-bar, .slide-counter, and disable keyboard nav.
- Set document.documentElement.dataset.preview = '1' so CSS can adapt.
- Use postMessage to signal 'preview-ready' to parent window.
`.trim()

export function buildSystemPrompt(params: GenerateParams): string {
  const audience = params.audience?.trim() || 'general business audience'
  const tone = params.tone?.trim() || 'professional, confident, clear'
  const focus = params.focus?.trim() || 'general purpose'

  // Detect framework from template HTML
  const html = params.templateHtml
  let framework: 'open-design' | 'reveal.js' | 'impress.js' | 'shower' | 'dzslides'
  if (/class="reveal"|Reveal\.initialize|\/revealjs\//i.test(html)) framework = 'reveal.js'
  else if (/id="impress"|impress\(\)\.init|\/frameworks\/impressjs\//i.test(html)) framework = 'impress.js'
  else if (/class="shower"|\/frameworks\/shower\//i.test(html)) framework = 'shower'
  else if (/aria-selected="true"|\/frameworks\/dzslides\//i.test(html) && /<section/i.test(html) && !/class="deck"/i.test(html)) framework = 'dzslides'
  else framework = 'open-design'

  // Extract just the design-relevant parts of the template HTML to keep the prompt tight.
  const templateDigest = extractTemplateDigest(params.templateHtml, params.templateCss, framework)

  // Pick the right deck structure contract based on framework
  let deckContract: string
  let notesTag: string
  let inlineNote: string
  switch (framework) {
    case 'reveal.js':
      deckContract = REVEAL_DECK_STRUCTURE
      notesTag = '<aside class="notes">'
      inlineNote = 'Keep <link>/<script> tags pointing to /revealjs/dist/... — do NOT inline reveal.js.'
      break
    case 'impress.js':
      deckContract = IMPRESS_DECK_STRUCTURE
      notesTag = '<div class="notes">'
      inlineNote = 'Keep <link>/<script> tags pointing to /frameworks/impressjs/... — do NOT inline impress.js.'
      break
    case 'shower':
      deckContract = SHOWER_DECK_STRUCTURE
      notesTag = '<details class="notes">'
      inlineNote = 'Keep <link>/<script> tags pointing to /frameworks/shower/... — do NOT inline shower core.'
      break
    case 'dzslides':
      deckContract = DZSLIDES_DECK_STRUCTURE
      notesTag = '<div role="note">'
      inlineNote = 'Inline ALL CSS and JS — DZSlides is single-file, no external assets allowed.'
      break
    default:
      deckContract = DECK_STRUCTURE
      notesTag = '<div class="notes">'
      inlineNote = 'Inline all CSS and JS.'
  }

  return `You are an expert presentation designer and frontend engineer. You generate single self-contained HTML presentation decks that look polished, professional, and on-brand.

# IDENTITY
- You write production-quality HTML/CSS/JS by hand. No frameworks. No build steps.
- You think in design tokens (CSS variables), 4pt spacing scale, and Duarte-style narrative arcs.
- You respect the chosen template's visual identity: fonts, palette, decorative motifs, and layout vocabulary are sacred.
- You have access to a library of 57+ templates spanning 5 frameworks:
  - 45 open-design HTML decks (custom hand-rolled CSS)
  - 7 reveal.js themes (reveal.js 6.0.1 — comprehensive slide framework)
  - 2 impress.js templates (3D spatial / Prezi-style camera transitions)
  - 2 Shower themes (Ribbon + Material — modern modular)
  - 1 DZSlides template (single-file minimalist, zero dependencies)
- You detect the chosen template's framework — open-design, reveal.js, impress.js, shower, or dzslides — and follow that framework's deck structure contract exactly.

# CAPABILITIES & CONSTRAINTS
- Input: a topic brief from the user + a reference HTML template digest (the chosen or auto-selected template).
- Output: ONE complete HTML file (the deck). Nothing else.
- The chosen template is **${framework}** — you MUST follow the ${framework} deck structure contract below.
- You may retune the template's :root tokens or --accent variable (e.g. shift accent hue) but you MUST preserve the template's font stack, class vocabulary, and structural primitives.
- You MUST follow the deck structure contract, layout catalog, and strategies below.
- If the chosen template's design feels mismatched to the content, still produce the deck honoring the template's visual identity — do not silently swap styles.

# CONTEXT
- Audience: ${audience}
- Tone: ${tone}
- Focus: ${focus}
- Slide count target: ${params.slideCount} (you may deviate by ±1 if needed for narrative).
- User brief:
"""
${params.text}
"""

# REFERENCE TEMPLATE (${params.templateId}, framework: ${framework})
Below is a digest of the chosen template. The digest contains the <head> (fonts, design tokens, base CSS), the first few slide structures (so you can see the class vocabulary), and the runtime script. Treat it as the design source of truth. Copy its tokens, font @imports / <link> tags, base reset, slide primitive CSS, and class vocabulary into your output. Adapt the slide CONTENT to the user's brief — do not copy the template's content verbatim.

--- BEGIN TEMPLATE DIGEST ---
${templateDigest}
--- END TEMPLATE DIGEST ---

# BEHAVIORAL RULES

## Deck Structure Contract (framework: ${framework})
${deckContract}

## Layout Catalog
${LAYOUT_CATALOG}

## Strategies
${STRATEGIES}

## Copywriting Formulas
${COPYWRITING_FORMULAS}

## Quality Floors
${FLOORS}

## Motion Rules
${MOTION_RULES}

## Absolute Bans
${BANS}

## Preview Mode (for embedding)
${PREVIEW_MODE}

# OUTPUT FORMAT
${OUTPUT_CONTRACT}

# WORKFLOW
1. Silently analyze the user brief. Identify the deck strategy (from STRATEGIES) that fits best.
2. Map each slide to a layout from LAYOUT_CATALOG. Vary layouts — never 5 feature-grids in a row.
3. Pick a copywriting formula per slide based on slide type.
4. Re-tune the template's tokens ONLY IF the user's brief demands a different accent color. Otherwise keep them as-is.
5. Write the HTML following the ${framework} deck structure contract. ${inlineNote}
6. Add speaker notes (inside ${notesTag} ... within each slide).
7. Output ONLY the HTML file. No markdown fences. No preamble.

Now generate the deck.`
}

/**
 * Extracts a digest of the template HTML to keep the AI prompt tight.
 * Returns:
 *   - The full <head> (fonts, tokens, base CSS, scoped CSS)
 *   - The first 3 <section class="slide"> blocks (class vocabulary reference)
 *   - The runtime <script> (keyboard nav)
 *   - The optional style.css if present
 */
function extractTemplateDigest(html: string, css: string | undefined, framework: 'open-design' | 'reveal.js' | 'impress.js' | 'shower' | 'dzslides'): string {
  const parts: string[] = []

  // 1. Extract <head>...</head>
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
  if (headMatch) {
    parts.push('=== <head> (fonts, tokens, base CSS) ===')
    parts.push(headMatch[0])
  }

  // 2. Extract first 3 slide sections based on framework
  let slideMatches: string[] | null = null
  switch (framework) {
    case 'reveal.js': {
      const slidesBlock = html.match(/<div class="slides">([\s\S]*?)<\/div>\s*<\/div>/i)
      if (slidesBlock) {
        slideMatches = slidesBlock[1].match(/<section[^>]*>[\s\S]*?<\/section>/gi)
      }
      break
    }
    case 'impress.js': {
      // <div class="step ..."> elements inside <div id="impress">
      const impressBlock = html.match(/<div id="impress">([\s\S]*?)<\/div>\s*(?:<[^>]+>\s*)*<(?:script|\/body)/i)
      if (impressBlock) {
        slideMatches = impressBlock[1].match(/<div[^>]*class="[^"]*step[^"]*"[^>]*>[\s\S]*?<\/div>/gi)
      }
      break
    }
    case 'shower': {
      // <section class="slide"> inside <body class="shower">
      slideMatches = html.match(/<section[^>]*class="[^"]*slide[^"]*"[^>]*>[\s\S]*?<\/section>/gi)
      break
    }
    case 'dzslides': {
      // Plain <section> elements
      slideMatches = html.match(/<section[^>]*>[\s\S]*?<\/section>/gi)
      break
    }
    default: {
      // open-design: <section class="...slide...">
      slideMatches = html.match(/<section[^>]*class="[^"]*slide[^"]*"[^>]*>[\s\S]*?<\/section>/gi)
    }
  }
  if (slideMatches && slideMatches.length > 0) {
    parts.push('\n=== First slides (class vocabulary reference; do NOT copy content) ===')
    parts.push(slideMatches.slice(0, 3).join('\n'))
  }

  // 3. Extract runtime <script> blocks
  switch (framework) {
    case 'reveal.js':
    case 'impress.js':
    case 'shower': {
      // Include all <script> tags (both inline + src) — they reference the framework's runtime
      const allScriptMatches = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi)
      if (allScriptMatches && allScriptMatches.length > 0) {
        parts.push(`\n=== <script> tags (${framework} load + init — copy verbatim) ===`)
        parts.push(allScriptMatches.join('\n'))
      }
      break
    }
    case 'dzslides': {
      // Inlined JS only — copy verbatim
      const scriptMatches = html.match(/<script(?![^>]*src=)[^>]*>[\s\S]*?<\/script>/gi)
      if (scriptMatches && scriptMatches.length > 0) {
        parts.push('\n=== Inlined <script> (keyboard nav — copy verbatim, no external src) ===')
        parts.push(scriptMatches.join('\n'))
      }
      break
    }
    default: {
      // open-design: only inline scripts (no src)
      const scriptMatches = html.match(/<script(?![^>]*src=)[^>]*>[\s\S]*?<\/script>/gi)
      if (scriptMatches && scriptMatches.length > 0) {
        parts.push('\n=== Runtime <script> (keyboard nav — copy verbatim) ===')
        parts.push(scriptMatches.join('\n'))
      }
    }
  }

  // 4. Append external style.css if present (open-design multi-file only)
  if (css) {
    parts.push('\n=== External style.css (scoped deck styles) ===')
    parts.push(css)
  }

  return parts.join('\n')
}

export function buildUserPrompt(params: GenerateParams): string {
  return `Generate a ${params.slideCount}-slide HTML presentation about:

${params.text}

Use the template "${params.templateId}" as the design reference. Output the complete HTML file now.`
}
