/**
 * HTML Template Studio — prompt builders.
 *
 * Ported (near verbatim) from the user's decksmith app:
 *   upload/decksmith-extracted/src/lib/presentation/system-prompt.ts
 *   upload/decksmith-extracted/src/lib/presentation/slide-prompt.ts
 *   upload/decksmith-extracted/src/app/api/generate-outline/route.ts (outline JSON contract)
 *
 * Encodes rules distilled from the 4 skill repos (impeccable, ui-ux-pro-max,
 * ponytail, claude-skills) + the open-design template contract, and adds
 * scratch-mode prompts (reveal.js on /revealjs/ or hand-rolled plain HTML).
 */

export type Framework = 'open-design' | 'reveal.js' | 'impress.js' | 'shower' | 'dzslides'

export interface SlideOutline {
  title: string
  layout: string
  content_markdown: string
  speaker_notes: string
}

export interface DeckOutlineJson {
  title: string
  subtitle?: string
  slides: SlideOutline[]
}

/** The only layouts the outline may use (validated server-side). */
export const OUTLINE_LAYOUTS = [
  'title', 'problem', 'solution', 'feature-grid', 'metrics', 'comparison',
  'timeline', 'team', 'quote', 'two-column', 'big-number', 'product-shot',
  'pricing', 'cta', 'section-divider',
] as const

/** Vendored reveal.js themes available at /revealjs/dist/theme/<name>.css. */
export const REVEAL_THEMES = [
  'black', 'white', 'league', 'beige', 'sky', 'night', 'serif', 'simple',
  'blood', 'moon', 'solarized', 'dracula', 'black-contrast', 'white-contrast',
] as const

// ---------------------------------------------------------------------------
// Shared rule blocks (ported verbatim from decksmith system-prompt.ts)
// ---------------------------------------------------------------------------

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
- section-divider: Minimal slide with just a kicker + huge section number/title. Used to break up sections. Animation: fade-up.
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
- No external asset references except: (a) Google Fonts via <link rel="stylesheet" crossorigin="anonymous"> in the head (NEVER @import — snapshot export must be able to read the rules), (b) /revealjs/dist/... when the deck is reveal.js-based, (c) /frameworks/<name>/... when the deck is impress.js/shower/dzslides-based, (d) the template's own assets/ folder. No other CDN scripts.
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








const LAYOUT_GUIDANCE: Record<string, string> = {
  'title': 'Big centered title + subtitle + author/date. Use .h1/.h2/.lede classes. Animation: fade-up.',
  'problem': 'Headline + 2-3 pain point cards in a .grid.g2 or .grid.g3. Animation: fade-up.',
  'solution': 'Headline + product description + 3 benefit bullets or .grid.g3 of .card. Animation: scale.',
  'feature-grid': '3-6 .card elements in .grid.g3 or .grid.g4. Each card has h4 title + 1-line description. Animation: stagger.',
  'metrics': '3-4 large KPI numbers with .big-number class + .big-label + .delta.up/.down. Animation: count.',
  'comparison': 'Two-column compare (before/after, us/them) using .grid.g2 with .card-soft. Animation: fade-up.',
  'timeline': 'Horizontal or vertical timeline with 4-5 milestones. Use .timeline-item with border-left. Animation: stagger.',
  'team': '3-6 team member cards with avatar/initials + name + role. Animation: stagger.',
  'quote': 'Large .quote with .quote-attr attribution. Center-aligned. Animation: fade-up.',
  'two-column': 'Headline left, supporting content right via .grid.g2. Animation: fade-up.',
  'big-number': 'Single oversized .big-number + supporting sentence. Center-aligned. Animation: count.',
  'product-shot': 'Product screenshot/visual placeholder + caption. Animation: scale.',
  'pricing': '3 pricing tier .card elements in .grid.g3 with plan name, price, features list. Animation: stagger.',
  'cta': 'Final call-to-action with contact info + .pill links. Animation: fade-up.',
  'section-divider': 'Minimal slide with just a kicker + huge section number/title. Used to break up sections. Animation: fade-up.',
}

// ---------------------------------------------------------------------------
// Outline prompts (contract: {title, subtitle, slides:[{title, layout,
// content_markdown, speaker_notes}]})
// ---------------------------------------------------------------------------

export interface OutlinePromptParams {
  brief: string
  slideCount: number
  audience?: string
  tone?: string
  verbosity?: 'concise' | 'standard' | 'text-heavy'
  mode?: 'template' | 'scratch'
  templateId?: string
}

export function buildOutlineSystemPrompt(params: OutlinePromptParams): string {
  const aud = params.audience?.trim() || 'general business audience'
  const tn = params.tone?.trim() || 'professional, confident, clear'
  const vb = params.verbosity || 'standard'
  const wordCount = vb === 'concise' ? 20 : vb === 'text-heavy' ? 60 : 40
  const rendering = params.mode === 'scratch'
    ? 'The deck will be built FROM SCRATCH on a JS presentation engine (no preset template), so content must work with a generic class vocabulary (.kicker, .h1-.h3, .lede, .card, .pill, .grid, .big-number, .quote).'
    : `The deck will fill the "${params.templateId || 'chosen'}" HTML template — layouts must map cleanly onto its class vocabulary.`

  return `You are an expert presentation designer. Generate a structured slide outline as JSON.

# TASK
Read the user's brief and produce exactly ${params.slideCount} slide outlines. Each outline has:
- title: short slide title (max 60 chars)
- layout: one of these layout types — title | problem | solution | feature-grid | metrics | comparison | timeline | team | quote | two-column | big-number | product-shot | pricing | cta | section-divider
- content_markdown: slide body as markdown (~${wordCount} words). Use ## for subheadings, **bold**, - bullets, > blockquotes. Vary density per slide.
- speaker_notes: 2-3 sentences the presenter would say.

# LAYOUT CATALOG
${LAYOUT_CATALOG}

# STRATEGIES
${STRATEGIES}

# COPYWRITING FORMULAS
${COPYWRITING_FORMULAS}

# CONTEXT
- Audience: ${aud}
- Tone: ${tn}
- Verbosity: ${vb} (~${wordCount} words/slide)
- Rendering: ${rendering}
- User brief:
"""
${params.brief}
"""

# LAYOUT GUIDANCE
- Slide 1 should be "title" layout.
- Slide 2 should usually be "problem" or "section-divider".
- Last slide should be "cta" or "title" (thanks).
- Vary layouts — never 3 feature-grids in a row.

# OUTPUT FORMAT
Return ONLY valid JSON, no markdown fences, no preamble:
{"title": "Deck Title (max 80 chars)", "subtitle": "One-line deck subtitle (max 120 chars)", "slides": [{"title": "...", "layout": "...", "content_markdown": "...", "speaker_notes": "..."}, ...]}`
}

export function buildOutlineUserPrompt(params: OutlinePromptParams): string {
  return `Generate a ${params.slideCount}-slide outline for: ${params.brief}`
}

// ---------------------------------------------------------------------------
// Per-slide prompts (template mode) — ported from decksmith slide-prompt.ts
// ---------------------------------------------------------------------------

export interface SlidePromptParams {
  templateId: string
  templateHtml: string
  templateCss?: string
  framework: Framework
  deckTitle: string
  slideIndex: number
  slideTotal: number
  audience?: string
  tone?: string
  verbosity?: string
}

/**
 * Detects the framework from the template HTML (mirrors deck-preview logic).
 */
export function detectFramework(html: string): Framework {
  if (/class="reveal"|Reveal\.initialize|\/revealjs\//i.test(html)) return 'reveal.js'
  if (/id="impress"|impress\(\)\.init|\/frameworks\/impressjs\//i.test(html)) return 'impress.js'
  if (/class="shower"|\/frameworks\/shower\//i.test(html)) return 'shower'
  if (/aria-selected="true"|\/frameworks\/dzslides\//i.test(html) && /<section/i.test(html) && !/class="deck"/i.test(html)) return 'dzslides'
  return 'open-design'
}

/**
 * Extracts just the design-relevant parts of the template HTML.
 * Returns <head> (fonts, tokens, base CSS) + first 2 slides (for class vocabulary).
 */
function extractTemplateDigest(html: string, css: string | undefined, framework: Framework): string {
  const parts: string[] = []

  // <head>
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
  if (headMatch) {
    parts.push('=== TEMPLATE <head> (fonts, tokens, base CSS) ===')
    parts.push(headMatch[0])
  }

  // First 2 slide structures (for class vocabulary)
  let slideMatches: string[] | null = null
  switch (framework) {
    case 'reveal.js': {
      const slidesBlock = html.match(/<div class="slides">([\s\S]*?)<\/div>\s*<\/div>/i)
      if (slidesBlock) slideMatches = slidesBlock[1].match(/<section[^>]*>[\s\S]*?<\/section>/gi)
      break
    }
    case 'impress.js': {
      const impressBlock = html.match(/<div id="impress">([\s\S]*?)<\/div>\s*(?:<[^>]+>\s*)*<(?:script|\/body)/i)
      if (impressBlock) slideMatches = impressBlock[1].match(/<div[^>]*class="[^"]*step[^"]*"[^>]*>[\s\S]*?<\/div>/gi)
      break
    }
    case 'shower':
      slideMatches = html.match(/<section[^>]*class="[^"]*slide[^"]*"[^>]*>[\s\S]*?<\/section>/gi)
      break
    case 'dzslides':
      slideMatches = html.match(/<section[^>]*>[\s\S]*?<\/section>/gi)
      break
    default:
      slideMatches = html.match(/<section[^>]*class="[^"]*slide[^"]*"[^>]*>[\s\S]*?<\/section>/gi)
  }
  if (slideMatches && slideMatches.length > 0) {
    parts.push('\n=== TEMPLATE first slides (class vocabulary reference; copy class names) ===')
    parts.push(slideMatches.slice(0, 2).join('\n'))
  }

  // Runtime scripts (for framework-based templates)
  if (framework === 'reveal.js' || framework === 'impress.js' || framework === 'shower') {
    const allScripts = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi)
    if (allScripts && allScripts.length > 0) {
      parts.push(`\n=== ${framework} script tags (for context — DO NOT include in slide output) ===`)
      parts.push(allScripts.join('\n'))
    }
  }

  if (css) {
    parts.push('\n=== TEMPLATE style.css ===')
    parts.push(css)
  }

  return parts.join('\n')
}

/**
 * Builds the system prompt for a single slide.
 * Much smaller than the full-deck prompt — focuses on ONE slide's layout + content.
 */
export function buildSlideSystemPrompt(params: SlidePromptParams): string {
  const aud = params.audience?.trim() || 'general business audience'
  const tn = params.tone?.trim() || 'professional, confident, clear'
  const vb = params.verbosity?.trim() || 'standard'
  const digest = extractTemplateDigest(params.templateHtml, params.templateCss, params.framework)
  const layoutHint = LAYOUT_GUIDANCE['title'] ?? 'Use the template class vocabulary.'

  // Per-framework slide-element contract
  let slideElementContract = ''
  let notesTag = '<div class="notes">'
  switch (params.framework) {
    case 'reveal.js':
      slideElementContract = `Output a single <section>...</section> element (NO class="slide", NO wrapping <div class="slides">). reveal.js manages visibility.`
      notesTag = '<aside class="notes">'
      break
    case 'impress.js':
      slideElementContract = `Output a single <div class="step slide" data-x="..." data-y="..." [data-rotate="..."] [data-scale="..."]>...</div> element. Position it on the 3D canvas — vary data-x by ${1400 * params.slideIndex} from the previous slide, optionally rotate or scale.`
      notesTag = '<div class="notes">'
      break
    case 'shower':
      slideElementContract = `Output a single <section class="slide">...</section> element. Shower manages visibility.`
      notesTag = '<details class="notes">'
      break
    case 'dzslides':
      slideElementContract = `Output a single <section>...</section> element. Use aria-selected="true" only if this is slide 0.`
      notesTag = '<div role="note">'
      break
    default:
      slideElementContract = `Output a single <section class="slide" data-title="...">...</section> element. Use the template's class vocabulary: .kicker, .h1/.h2/.h3, .lede, .card, .pill, .grid.g2/.g3/.g4, .stack, .center, .tc, .big-number, .big-label, .quote, .timeline-item, .delta.up/.down.`
      notesTag = '<div class="notes">'
  }

  return `You are an expert presentation designer. Generate the HTML for ONE slide.

# TASK
Generate exactly one slide element for a ${params.framework} deck titled "${params.deckTitle}".
This is slide ${params.slideIndex + 1} of ${params.slideTotal}.
The slide spec (title, layout, content markdown, speaker notes) arrives in the user message.

# CONTEXT
- Audience: ${aud}
- Tone: ${tn}
- Verbosity: ${vb}

# FRAMEWORK CONTRACT (${params.framework})
${slideElementContract}
Speaker notes go inside ${notesTag}...</${notesTag.slice(1, -1).split(' ')[0]}> within the slide element.

# TEMPLATE DESIGN DIGEST
${digest}

# LAYOUT HINT
${layoutHint}

# QUALITY FLOORS
${FLOORS}

# RULES
- Output ONLY the slide element. No <!DOCTYPE>, no <html>, no <head>, no <body>, no <script>.
- Use the template's CSS class vocabulary verbatim — do NOT invent new classes.
- Use var(--accent), var(--text-1), etc. — never hardcoded colors.
- Inline any slide-specific styles in a <style> block BEFORE the slide element if absolutely needed (rare).
- Keep the slide visually consistent with the template's design language.
- Do NOT include external <link> or <script src> tags.
- Honor the content_markdown: convert it to semantic HTML using the template's classes.
- Add speaker notes (${notesTag}...${notesTag.replace('<', '</').replace('>', '>')}) with the slide's speaker_notes.
- No text overflow — if content doesn't fit, trim it. No animating layout properties (width/height/top/left) — transform/opacity only.

# OUTPUT FORMAT
Output ONLY the slide HTML element. No markdown fences. No explanation.`
}

export function buildSlideUserPrompt(slide: SlideOutline): string {
  const layoutHint = LAYOUT_GUIDANCE[slide.layout] ?? ''
  return `Generate slide HTML for:

Title: ${slide.title}
Layout: ${slide.layout}
Layout guidance: ${layoutHint}

Content (markdown — convert to semantic HTML using template classes):
${slide.content_markdown}

Speaker notes:
${slide.speaker_notes}

Output the slide element now.`
}

// ---------------------------------------------------------------------------
// Scratch-mode prompts (chunked full-deck generation, ≤3 calls)
// ---------------------------------------------------------------------------

export interface ScratchPromptParams {
  engine: 'reveal' | 'plain'
  deckTitle: string
  /** 0-based inclusive index of the first slide in this chunk. */
  slideStart: number
  /** 0-based inclusive index of the last slide in this chunk. */
  slideEnd: number
  slideTotal: number
  audience?: string
  tone?: string
  verbosity?: 'concise' | 'standard' | 'text-heavy'
  /** true for the first chunk — it also carries the deck's <style> block(s). */
  isFirst: boolean
}

export function buildScratchSystemPrompt(params: ScratchPromptParams): string {
  const aud = params.audience?.trim() || 'general business audience'
  const tn = params.tone?.trim() || 'professional, confident, clear'
  const vb = params.verbosity || 'standard'
  const wordCount = vb === 'concise' ? 20 : vb === 'text-heavy' ? 60 : 40
  const count = params.slideEnd - params.slideStart + 1

  const engineContract = params.engine === 'reveal'
    ? `# ENGINE CONTRACT (reveal.js — vendored runtime at /revealjs/)
- The assembler builds the full HTML document. You output ONLY slide <section> elements (plus, on the first chunk, ONE <style> block placed before the sections).
- Each slide is a plain <section>...</section> (NO class="slide", NO <div class="slides"> wrapper — the assembler adds it).
- NEVER nest <section> inside <section>. One <section> per slide, flat.
- Speaker notes go inside <aside class="notes">...</aside> within each section.
- You MAY use reveal.js fragment syntax (<p class="fragment">) and data-background attributes.
- In your <style> block define scoped helper classes used by sections: .kicker, .lede, .grid-2, .grid-3, .grid-4, .card, .big-number, .big-label, .pill, .quote, .quote-attr, .timeline, .timeline-item, .bullets — style them against reveal's CSS variables (--r-background-color, --r-main-color, --r-heading-color, --r-link-color) and your own var(--accent).
- On the FIRST chunk only, the very first line of your output must be a theme declaration comment:
<!-- reveal-theme: NAME -->  where NAME is exactly one of: ${REVEAL_THEMES.join(', ')}.
Pick the theme whose mood best fits the brief. The assembler wires /revealjs/dist/theme/NAME.css.`
    : `# ENGINE CONTRACT (plain hand-rolled deck)
- The assembler builds the full HTML document, the .deck wrapper, progress bar, slide counter and the keyboard-nav runtime. You output ONLY slide <section> elements (plus, on the first chunk, the deck's CSS in ONE <style> block placed before the sections).
- Each slide is <section class="slide" data-title="Short title">...</section> (data-title REQUIRED; do NOT add is-active — the assembler patches the first slide).
- NEVER nest <section> inside <section>. One <section> per slide, flat.
- Speaker notes go inside <div class="notes">...</div> within each slide (hidden by default).
- Your <style> block (first chunk) must define the complete design system:
  1. Google Fonts if needed: <link rel="stylesheet" href="https://fonts.googleapis.com/..." crossorigin="anonymous"> in the head (never @import).
  2. :root tokens — --bg, --surface, --text-1, --text-2, --accent, --border, spacing scale.
  3. Base reset + .deck/.slide primitives: .deck fills the viewport, exactly one .slide visible (.slide { display:none } .slide.is-active { display:flex } — the runtime toggles .is-active), each .slide a full-viewport flex container with generous (>=64px) padding.
  4. A shared class vocabulary used across ALL slides: .kicker, .h1, .h2, .h3, .lede, .card, .pill, .grid.g2/.g3/.g4, .stack, .big-number, .big-label, .quote, .timeline-item, .delta.up/.down.
  5. Chrome styles for .progress-bar (fixed bottom bar; its > span is the fill) and .slide-counter (fixed corner, mono, small).
  6. @media (prefers-reduced-motion: reduce) disabling animation.
- Later chunks may add ONE extra small <style> block ONLY for slide-specific styles introduced by their slides (rare).`

  return `You are an expert presentation designer and frontend engineer. You are generating a presentation deck from scratch as HTML — no template, your own hand-rolled CSS.

# IDENTITY
- You write production-quality HTML/CSS by hand. No frameworks, no build steps.
- You think in design tokens (CSS variables), a 4pt spacing scale, and Duarte-style narrative arcs.

# TASK
Generate the slide elements for slides ${params.slideStart + 1}–${params.slideEnd + 1} of ${params.slideTotal} of the deck "${params.deckTitle}".
${params.isFirst ? 'This is the FIRST chunk: also output the deck-wide <style> block(s) described below.' : 'A previous chunk already defined the deck-wide styles — do NOT redefine the design system.'}
The slide specs (title, layout, content markdown, speaker notes) arrive in the user message. Honor them in order — one slide element per spec, same order.

# CONTEXT
- Audience: ${aud}
- Tone: ${tn}
- Verbosity: ${vb} (~${wordCount} words of visible text per slide)

${engineContract}

# LAYOUT GUIDANCE (per layout keyword)
${Object.entries(LAYOUT_GUIDANCE).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

# QUALITY FLOORS
${FLOORS}

# MOTION RULES
${MOTION_RULES}

# ABSOLUTE BANS
${BANS}

# OUTPUT FORMAT
- Output ONLY ${params.isFirst ? 'the <style> block(s) followed by ' : ''}${count} <section> element(s) — no <!DOCTYPE>, no <html>, no <head>, no <body>, no <script>, no markdown fences, no explanation.
${params.engine === 'reveal' && params.isFirst ? '- First line: the <!-- reveal-theme: NAME --> comment. Then the <style> block. Then the sections.\n' : ''}- Keep every slide visually consistent — same tokens, same spacing, same type scale.`
}

export interface ScratchChunkParams extends ScratchPromptParams {
  slides: SlideOutline[]
}

export function buildScratchUserPrompt(params: ScratchChunkParams): string {
  const specs = params.slides.map((s, i) => {
    const n = params.slideStart + i + 1
    return `## Slide ${n} of ${params.slideTotal}
Title: ${s.title}
Layout: ${s.layout}
Layout guidance: ${LAYOUT_GUIDANCE[s.layout] ?? ''}
Content (markdown):
${s.content_markdown}
Speaker notes:
${s.speaker_notes}`
  })
  return `${params.isFirst ? 'Start with the theme comment / <style> block(s), then' : 'Output'} the slide element${params.slides.length > 1 ? 's' : ''} for:

${specs.join('\n\n')}

Output the slide element${params.slides.length > 1 ? 's' : ''} now.`
}

// ---------------------------------------------------------------------------
// HTML fence stripper (ported from decksmith generate-slide route)
// ---------------------------------------------------------------------------

/**
 * Strips markdown fences / preamble and returns just the slide element
 * (<section ...>, <div class="step"...> or <div class="slide"...>).
 */
export function extractHtml(raw: string): string {
  let out = raw.trim()
  const fenceMatch = out.match(/```(?:html|HTML)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch) out = fenceMatch[1].trim()
  const startIdx = out.search(/<section|<div class="step"|<div class="slide"/i)
  if (startIdx >= 0) out = out.slice(startIdx)
  if (out.startsWith('<section')) {
    const endIdx = out.lastIndexOf('</section>')
    if (endIdx >= 0) out = out.slice(0, endIdx + '</section>'.length)
  } else if (out.startsWith('<div class="step')) {
    const endIdx = out.lastIndexOf('</div>')
    if (endIdx >= 0) out = out.slice(0, endIdx + '</div>'.length)
  }
  return out.trim()
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/**
 * Sanitizer for AI text where line breaks matter (markdown bodies):
 * strips tags + control chars but preserves newlines (unlike helpers.sanitizeText).
 */
export function sanitizeMarkdownText(input: unknown, maxLen = 2000): string {
  if (input == null) return ''
  return String(input)
    .replace(/<[^>]*>/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLen)
}
