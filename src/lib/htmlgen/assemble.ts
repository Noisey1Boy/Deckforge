/**
 * HTML Template Studio — deck assembler.
 *
 * Ported from the user's decksmith app:
 *   upload/decksmith-extracted/src/lib/presentation/assemble.ts
 *
 * Wraps N slide HTMLs into a complete deck document per the framework's
 * structure, plus scratch-mode support:
 *   - framework 'scratch' is a passthrough (scratch decks arrive pre-assembled)
 *   - assembleScratchDeck() builds the full doc for the two scratch engines
 *     ('reveal' → vendored reveal.js runtime, 'plain' → hand-rolled + inline runtime)
 */

import type { Framework } from './prompts'
import { REVEAL_THEMES } from './prompts'

export type AssembleFramework = Framework | 'scratch'

export interface AssembleParams {
  templateId: string
  templateHtml: string // the original template HTML (for extracting <head> + scripts)
  framework: AssembleFramework
  deckTitle: string
  slideHtmls: string[] // N slide elements, in order
}

/**
 * Adds crossorigin="anonymous" to Google Fonts <link> tags in a head block.
 * The template/scratch decks load their webfonts from fonts.googleapis.com;
 * without CORS attribution the stylesheet is unreadable (cssRules throws a
 * SecurityError), which breaks html-to-image font inlining during PNG/PPTX
 * snapshot exports. Google Fonts serves permissive CORS headers, so the
 * snapshot attribute makes the rules readable. Idempotent.
 */
export function withCorsFontLinks(headHtml: string): string {
  return headHtml.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/https:\/\/fonts\.googleapis\.com/i.test(tag)) return tag
    if (/crossorigin/i.test(tag)) return tag
    return tag.replace(/\s*\/?>$/i, ' crossorigin="anonymous">')
  })
}

/**
 * Extracts the <head>...</head> block from the template HTML.
 */
export function extractHead(html: string): string {
  const m = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
  return m ? m[0] : '<head><meta charset="utf-8"></head>'
}

/**
 * Extracts all <script> tags from the template HTML.
 * For framework-based templates, these load the framework runtime.
 */
export function extractScripts(html: string): string {
  const matches = html.match(/<script[^>]*>(?:[\s\S]*?<\/script>)?/gi)
  return matches ? matches.join('\n') : ''
}

/**
 * Extracts all <style>...</style> blocks (used for scratch chunk stitching).
 */
export function extractStyleBlocks(html: string): string[] {
  return html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) ?? []
}

/**
 * Assembles N slide HTMLs into a complete deck document.
 *
 * For each framework:
 *   - open-design: <div class="deck"><section class="slide is-active">...</section>...</div> + inline runtime
 *   - reveal.js: <div class="reveal"><div class="slides"><section>...</section>...</div></div> + reveal.js scripts
 *   - impress.js: <div id="impress"><div class="step slide">...</div>...</div> + impress.js scripts
 *   - shower: <section class="slide">...</section>... (body has class="shower list") + shower scripts
 *   - dzslides: <section>...</section>... + inlined runtime
 *   - scratch: passthrough — scratch decks are assembled via assembleScratchDeck()
 */
export function assembleDeck(params: AssembleParams): string {
  const { templateId, templateHtml, framework, deckTitle, slideHtmls } = params

  if (framework === 'scratch') {
    // Scratch decks arrive as complete documents — pass through untouched.
    return slideHtmls.join('\n')
  }

  const head = withCorsFontLinks(extractHead(templateHtml))
  const scripts = extractScripts(templateHtml)

  // Replace the <title> in head with our deck title
  const headWithTitle = head.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(deckTitle)}</title>`)

  let bodyContent = ''

  switch (framework) {
    case 'reveal.js':
      bodyContent = `
<div class="reveal">
  <div class="slides">
${slideHtmls.map((s) => indent(s, 4)).join('\n')}
  </div>
</div>`
      break

    case 'impress.js':
      bodyContent = `
<div class="hint">Use arrow keys or space to navigate · ESC for overview</div>
<div id="impress" data-transition-duration="800" data-width="1920" data-height="1080" data-perspective="1500">
${slideHtmls.map((s) => indent(s, 2)).join('\n')}
</div>`
      break

    case 'shower':
      bodyContent = `
<header class="caption">
  <h1>${escapeHtml(deckTitle)}</h1>
</header>
${slideHtmls.map((s) => indent(s, 0)).join('\n')}
<div class="progress"></div>`
      break

    case 'dzslides': {
      // dzslides: first slide gets aria-selected="true"
      const patched = slideHtmls.map((s, i) => {
        if (i === 0 && !/aria-selected=/i.test(s)) {
          return s.replace(/<section/i, '<section aria-selected="true"')
        }
        return s
      })
      bodyContent = `
<header>${escapeHtml(deckTitle)}</header>
${patched.map((s) => indent(s, 0)).join('\n')}`
      break
    }

    default: { // open-design
      // First slide gets is-active class
      const patched = slideHtmls.map((s, i) => {
        if (i === 0 && !/is-active/i.test(s)) {
          return s.replace(/<section([^>]*)class="([^"]*slide[^"]*)"/i, '<section$1class="$2 is-active"')
        }
        return s
      })
      bodyContent = `
<div class="deck">
${patched.map((s) => indent(s, 2)).join('\n')}
</div>
<div class="progress-bar"><span></span></div>
<div class="slide-counter"><span data-current>1</span>/<span data-total>${slideHtmls.length}</span></div>`
    }
  }

  // For dzslides: inline the runtime keyboard nav script
  // For all others: use the extracted scripts (which include the framework runtime)
  const runtimeScript = framework === 'dzslides'
    ? `<script>
(function() {
  var sections = document.querySelectorAll('section');
  var current = 0;
  function show(i) {
    sections.forEach(function(s, idx) {
      if (idx === i) s.setAttribute('aria-selected', 'true');
      else s.removeAttribute('aria-selected');
    });
    current = i;
  }
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      if (current < sections.length - 1) show(current + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      if (current > 0) show(current - 1);
    } else if (e.key === 'Home') show(0);
    else if (e.key === 'End') show(sections.length - 1);
  });
  show(0);
  window.parent.postMessage({type: 'preview-ready', slide: 0, count: sections.length}, '*');
})();
</script>`
    : scripts

  // For shower, body needs class="shower list"
  const bodyOpen = framework === 'shower' ? '<body class="shower list">' : '<body>'

  // Speaker notes: slides embed their notes as <div class="notes"> (shower:
  // <details class="notes">, dzslides: <div role="note">). The shared runtime
  // stylesheet (_shared/base.css) hides them — but self-contained templates
  // (e.g. biennale-yellow) never link it, so the notes would render visibly
  // on the projected slide. Inject the hide rule once unless the template
  // already declares it.
  const hidesNotes =
    /\.notes\s*[{,]/.test(headWithTitle) || /_shared\/base\.css/.test(headWithTitle)
  const notesHideStyle = hidesNotes
    ? ''
    : '\n<style>.notes{display:none!important}[role="note"]{display:none!important}</style>'

  return `<!DOCTYPE html>
<html lang="en">
${headWithTitle}${notesHideStyle}
${bodyOpen}
${bodyContent}

${runtimeScript}
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Scratch-mode assembly
// ---------------------------------------------------------------------------

export interface ScratchAssembleParams {
  engine: 'reveal' | 'plain'
  deckTitle: string
  /** Slide elements in order (extracted from the chunk responses). */
  sections: string[]
  /** <style> blocks collected from the chunk responses (first chunk carries the design system). */
  styleBlocks: string[]
  /** reveal.js theme css name (validated); ignored for 'plain'. */
  theme?: string
}

export function assembleScratchDeck(params: ScratchAssembleParams): string {
  const { engine, deckTitle, sections, styleBlocks } = params
  const styles = styleBlocks.join('\n\n')
  const title = escapeHtml(deckTitle)

  if (engine === 'reveal') {
    const theme = REVEAL_THEMES.includes((params.theme ?? '') as (typeof REVEAL_THEMES)[number])
      ? (params.theme as string)
      : 'black'
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>${title}</title>
<link rel="stylesheet" href="/revealjs/dist/reset.css">
<link rel="stylesheet" href="/revealjs/dist/reveal.css">
<link rel="stylesheet" href="/revealjs/dist/theme/${theme}.css" id="theme">
${styles}
</head>
<body>
<div class="reveal">
  <div class="slides">
${sections.map((s) => indent(s, 4)).join('\n')}
  </div>
</div>
<script src="/revealjs/dist/reveal.js"></script>
<script src="/revealjs/dist/plugin/notes.js"></script>
<script src="/revealjs/dist/plugin/markdown.js"></script>
<script src="/revealjs/dist/plugin/highlight.js"></script>
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
</html>`
  }

  // plain — hand-rolled deck with the shared inline runtime
  const patched = sections.map((s, i) => {
    if (i === 0 && !/is-active/i.test(s)) {
      return s.replace(/<section([^>]*)class="([^"]*slide[^"]*)"/i, '<section$1class="$2 is-active"')
    }
    return s
  })
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${styles}
</head>
<body>
<div class="deck">
${patched.map((s) => indent(s, 2)).join('\n')}
</div>
<div class="progress-bar"><span></span></div>
<div class="slide-counter"><span data-current>1</span>/<span data-total>${sections.length}</span></div>
<script>
(function() {
  var slides = Array.prototype.slice.call(document.querySelectorAll('.deck > section.slide'));
  var current = 0;
  var counterCur = document.querySelector('[data-current]');
  var counterTot = document.querySelector('[data-total]');
  var bar = document.querySelector('.progress-bar > span');
  function show(i) {
    if (i < 0 || i >= slides.length) return;
    slides.forEach(function(s, idx) { s.classList.toggle('is-active', idx === i); });
    current = i;
    if (counterCur) counterCur.textContent = String(i + 1);
    if (bar) bar.style.width = (((i + 1) / slides.length) * 100) + '%';
    if (history.replaceState) history.replaceState(null, '', '#/' + (i + 1));
  }
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); show(current + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(current - 1); }
    else if (e.key === 'Home') { e.preventDefault(); show(0); }
    else if (e.key === 'End') { e.preventDefault(); show(slides.length - 1); }
  });
  if (counterTot) counterTot.textContent = String(slides.length);
  var m = (location.hash || '').match(/#\\/(\\d+)/);
  show(m ? Math.min(Math.max(parseInt(m[1], 10) - 1, 0), slides.length - 1) : 0);
  window.parent.postMessage({type: 'preview-ready', slide: current, count: slides.length}, '*');
})();
</script>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function indent(s: string, n: number): string {
  const pad = ' '.repeat(n)
  return s.split('\n').map((l) => pad + l).join('\n')
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
