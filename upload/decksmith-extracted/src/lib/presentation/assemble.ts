/**
 * Deck assembler — wraps N slide HTMLs into a complete deck document
 * per the framework's structure.
 *
 * Used by the 3-stage pipeline (outline → per-slide HTML → assembled deck).
 */

import type { Framework } from './slide-prompt'

export interface AssembleParams {
  templateId: string
  templateHtml: string // the original template HTML (for extracting <head> + scripts)
  framework: Framework
  deckTitle: string
  slideHtmls: string[] // N slide elements, in order
}

/**
 * Extracts the <head>...</head> block from the template HTML.
 */
function extractHead(html: string): string {
  const m = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
  return m ? m[0] : '<head><meta charset="utf-8"></head>'
}

/**
 * Extracts all <script> tags from the template HTML.
 * For framework-based templates, these load the framework runtime.
 */
function extractScripts(html: string): string {
  const matches = html.match(/<script[^>]*>(?:[\s\S]*?<\/script>)?/gi)
  return matches ? matches.join('\n') : ''
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
 */
export function assembleDeck(params: AssembleParams): string {
  const { templateId, templateHtml, framework, deckTitle, slideHtmls } = params
  const head = extractHead(templateHtml)
  const scripts = extractScripts(templateHtml)

  // Replace the <title> in head with our deck title
  const headWithTitle = head.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(deckTitle)}</title>`)

  let bodyContent = ''

  switch (framework) {
    case 'reveal.js':
      bodyContent = `
<div class="reveal">
  <div class="slides">
${slideHtmls.map((s, i) => indent(s, 4)).join('\n')}
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

  return `<!DOCTYPE html>
<html lang="en">
${headWithTitle}
${bodyOpen}
${bodyContent}

${runtimeScript}
</body>
</html>`
}

function indent(s: string, n: number): string {
  const pad = ' '.repeat(n)
  return s.split('\n').map((l) => pad + l).join('\n')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
