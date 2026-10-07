/**
 * Slide-level prompt builder for the 3-stage pipeline.
 * Each slide gets its own focused LLM call — much smaller and faster than
 * generating the whole deck in one shot.
 *
 * The flow:
 *   1. Client calls /api/generate-outline → gets JSON array of slide outlines
 *   2. Client fires N concurrent /api/generate-slide calls (one per outline entry)
 *   3. Client assembles slide HTMLs into a complete deck
 */

export type Framework = 'open-design' | 'reveal.js' | 'impress.js' | 'shower' | 'dzslides'

export interface SlideOutline {
  title: string
  layout: string
  content_markdown: string
  speaker_notes: string
}

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

# SLIDE SPEC
- Title: ${'' /* slide.title passed via user prompt */}
- Layout: ${'' /* slide.layout passed via user prompt */}
- Content markdown: ${'' /* slide.content_markdown passed via user prompt */}

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

# RULES
- Output ONLY the slide element. No <!DOCTYPE>, no <html>, no <head>, no <body>, no <script>.
- Use the template's CSS class vocabulary verbatim — do NOT invent new classes.
- Use var(--accent), var(--text-1), etc. — never hardcoded colors.
- Inline any slide-specific styles in a <style> block BEFORE the slide element if absolutely needed (rare).
- Keep the slide visually consistent with the template's design language.
- Do NOT include external <link> or <script src> tags.
- Honor the content_markdown: convert it to semantic HTML using the template's classes.
- Add speaker notes (${notesTag}...${notesTag.replace('<', '</').replace('>', '>')}) with the slide's speaker_notes.

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
