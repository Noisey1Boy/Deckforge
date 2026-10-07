'use client'

import { useEffect, useMemo, useRef } from 'react'

interface DeckPreviewProps {
  html: string
  slideIndex: number
  className?: string
  onSlideCountChange?: (n: number) => void
  onReady?: () => void
}

type Framework = 'open-design' | 'reveal' | 'impress.js' | 'shower' | 'dzslides' | 'plain'

/**
 * Detects which framework the deck uses.
 *   - 'reveal': <section> inside <div class="slides"> inside <div class="reveal">, Reveal.initialize() call
 *   - 'impress.js': <div id="impress"> with <div class="step"> elements, impress().init() call
 *   - 'shower': <body class="shower"> with <section class="slide"> elements, @shower/core script
 *   - 'dzslides': plain <section> elements with [aria-selected] attribute, minimal inlined JS
 *   - 'open-design': <section class="slide" data-title="..."> inside <div class="deck">
 *   - 'plain': plain <section> tags (fallback)
 */
function detectFramework(html: string): Framework {
  if (/class="reveal"|Reveal\.initialize|\/revealjs\//i.test(html)) return 'reveal'
  if (/id="impress"|impress\(\)\.init|\/frameworks\/impressjs\//i.test(html)) return 'impress.js'
  if (/class="shower"|\/frameworks\/shower\//i.test(html)) return 'shower'
  if (/aria-selected="true"|\/frameworks\/dzslides\//i.test(html) && /<section/i.test(html) && !/class="deck"/i.test(html)) return 'dzslides'
  if (/class="deck"|section[^>]*class="[^"]*slide[^"]*"/i.test(html)) return 'open-design'
  return 'plain'
}

/**
 * Counts slides in a deck based on its framework structure.
 */
function countSlides(html: string, framework: Framework): number {
  if (!html) return 0
  switch (framework) {
    case 'reveal': {
      // <section> inside <div class="slides">
      const slidesBlock = html.match(/<div class="slides">([\s\S]*?)<\/div>\s*<\/div>/i)
      if (slidesBlock) {
        const sections = slidesBlock[1].match(/<section[^>]*>/gi)
        return sections ? sections.length : 0
      }
      const sections = html.match(/<section[^>]*>/gi)
      return sections ? sections.length : 0
    }
    case 'impress.js': {
      // <div class="step ..."> inside <div id="impress">
      const impressBlock = html.match(/<div id="impress">([\s\S]*?)<\/div>\s*<[^>]*>/i)
      if (impressBlock) {
        const steps = impressBlock[1].match(/<div[^>]*class="[^"]*step[^"]*"[^>]*>/gi)
        return steps ? steps.length : 0
      }
      const steps = html.match(/<div[^>]*class="[^"]*step[^"]*"[^>]*>/gi)
      return steps ? steps.length : 0
    }
    case 'shower': {
      // <section class="slide"> inside <body class="shower">
      const matches = html.match(/<section[^>]*class="[^"]*slide[^"]*"[^>]*>/gi)
      return matches ? matches.length : 0
    }
    case 'dzslides':
    case 'open-design':
    case 'plain':
    default: {
      // Match <section class="...slide..."> OR plain <section> (dzslides)
      const slideClassMatches = html.match(/<section[^>]*class="[^"]*slide[^"]*"[^>]*>/gi)
      if (slideClassMatches && slideClassMatches.length > 0) return slideClassMatches.length
      // Fallback: any <section>
      const sections = html.match(/<section[^>]*>/gi)
      return sections ? sections.length : 0
    }
  }
}

/**
 * Renders a generated deck HTML inside a sandboxed iframe and shows slide N.
 *
 * Framework-aware: handles reveal.js, impress.js, shower, dzslides, open-design,
 * and plain <section> structures.
 */
export function DeckPreview({ html, slideIndex, className, onSlideCountChange, onReady }: DeckPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const framework = useMemo(() => detectFramework(html), [html])

  // Build the preview script per framework
  const previewScript = useMemo(() => {
    const idx = slideIndex

    if (framework === 'reveal') {
      return `
<script>
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    if (!window.Reveal) return;
    var origInitFn = window.Reveal.initialize;
    window.Reveal.initialize = function(opts){
      var userReady = opts && opts.ready;
      var wrappedOpts = Object.assign({}, opts || {}, {
        controls: false, progress: false, slideNumber: false, hash: false,
        fragments: false, autoSlide: 0,
        ready: function(){
          try {
            var total = window.Reveal.getTotalSlides();
            window.Reveal.slide(${idx});
            ['.controls', '.progress', '.slide-number', '.speaker-notes', '.pause-overlay'].forEach(function(sel){
              document.querySelectorAll(sel).forEach(function(el){ el.style.display = 'none'; });
            });
            window.parent.postMessage({ type: 'preview-ready', slide: ${idx}, count: total }, '*');
          } catch(e) { console.warn('reveal preview ready error:', e); }
          if (typeof userReady === 'function') userReady.call(window.Reveal);
        }
      });
      return origInitFn.call(window.Reveal, wrappedOpts);
    };
  });
})();
</script>`
    }

    if (framework === 'impress.js') {
      // impress.js: hook impress().init() via API after load
      return `
<script>
(function(){
  var __idx = ${idx};
  document.addEventListener('DOMContentLoaded', function(){
    function tryInit(retries) {
      if (typeof impress === 'function') {
        try {
          var api = impress();
          api.init();
          // Wait for impress to be ready, then goto the step
          setTimeout(function(){
            try {
              var steps = document.querySelectorAll('#impress .step');
              // goto takes an index (number) or element id
              if (steps.length > __idx) {
                api.goto(steps[__idx], 0);
              }
              // Hide hint and any progress
              ['.hint', '.progress', '.impress-progress', '.impress-toolbar'].forEach(function(sel){
                document.querySelectorAll(sel).forEach(function(el){ el.style.display = 'none'; });
              });
              window.parent.postMessage({ type: 'preview-ready', slide: __idx, count: steps.length }, '*');
            } catch(e) { console.warn('impress goto error:', e); }
          }, 400);
        } catch(e) {
          console.warn('impress init error:', e);
          if (retries > 0) setTimeout(function(){ tryInit(retries - 1); }, 200);
        }
      } else if (retries > 0) {
        setTimeout(function(){ tryInit(retries - 1); }, 100);
      }
    }
    tryInit(20);
  });
})();
</script>`
    }

    if (framework === 'shower') {
      // Shower: hook into window.shower after script loads
      return `
<script>
(function(){
  var __idx = ${idx};
  function tryShower(retries) {
    if (window.shower && window.shower.player) {
      try {
        var total = document.querySelectorAll('.slide').length;
        window.shower.player.go(__idx + 1); // Shower is 1-indexed
        ['.progress'].forEach(function(sel){
          document.querySelectorAll(sel).forEach(function(el){ el.style.display = 'none'; });
        });
        window.parent.postMessage({ type: 'preview-ready', slide: __idx, count: total }, '*');
      } catch(e) {
        console.warn('shower goto error:', e);
      }
    } else if (retries > 0) {
      setTimeout(function(){ tryShower(retries - 1); }, 100);
    }
  }
  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(function(){ tryShower(30); }, 100);
  });
})();
</script>`
    }

    if (framework === 'dzslides') {
      // DZSlides: use [aria-selected] attribute toggling
      return `
<script>
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var sections = document.querySelectorAll('section');
    sections.forEach(function(s, i){
      if (i === ${idx}) s.setAttribute('aria-selected', 'true');
      else s.removeAttribute('aria-selected');
    });
    ['header', 'footer'].forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){ el.style.display = 'none'; });
    });
    window.parent.postMessage({ type: 'preview-ready', slide: ${idx}, count: sections.length }, '*');
  });
})();
</script>`
    }

    // open-design or plain: hide all sections except slideIndex
    return `
<script>
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var slides = document.querySelectorAll('section.slide, .slide');
    if (!slides.length) {
      slides = document.querySelectorAll('section');
    }
    slides.forEach(function(s, i){
      if (i === ${idx}) {
        s.style.display = '';
        s.classList.add('is-active', 'active');
      } else {
        s.style.display = 'none';
        s.classList.remove('is-active', 'active');
      }
    });
    ['.progress-bar', '.slide-counter', '.counter', '.hint', '.nav', '.deck-nav', '.controls', '.presenter-hint'].forEach(function(sel){
      try { document.querySelectorAll(sel).forEach(function(el){ el.style.display = 'none'; }); } catch(e) {}
    });
    document.documentElement.dataset.preview = '1';
    if (document.body) document.body.dataset.preview = '1';
    window.parent.postMessage({ type: 'preview-ready', slide: ${idx}, count: slides.length }, '*');
  });
})();
</script>`
  }, [framework, slideIndex])

  // Inject preview script into HTML
  const iframeSrcDoc = useMemo(() => {
    if (!html) return ''
    let patched = html
    if (/<\/head>/i.test(html)) {
      patched = html.replace(/<\/head>/i, `${previewScript}</head>`)
    } else if (/<head[^>]*>/i.test(html)) {
      patched = html.replace(/<head[^>]*>/i, (m) => `${m}${previewScript}`)
    } else if (/<html[^>]*>/i.test(html)) {
      patched = html.replace(/<html[^>]*>/i, (m) => `${m}<head>${previewScript}</head>`)
    } else {
      patched = previewScript + html
    }
    return patched
  }, [html, previewScript])

  // Derive slide count from HTML structure
  const slideCount = useMemo(() => countSlides(html, framework), [html, framework])

  // Listen for preview-ready message
  useEffect(() => {
    function handler(ev: MessageEvent) {
      const data = ev.data
      if (data && data.type === 'preview-ready' && typeof data.count === 'number') {
        onSlideCountChange?.(data.count)
        onReady?.()
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onSlideCountChange, onReady])

  // Report slide count up
  useEffect(() => {
    if (slideCount > 0) {
      onSlideCountChange?.(slideCount)
    }
  }, [slideCount, onSlideCountChange])

  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <iframe
        ref={iframeRef}
        title="Presentation preview"
        srcDoc={iframeSrcDoc}
        sandbox="allow-scripts allow-same-origin"
        style={{
          width: '100%',
          height: '100%',
          border: '0',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
        }}
      />
    </div>
  )
}
