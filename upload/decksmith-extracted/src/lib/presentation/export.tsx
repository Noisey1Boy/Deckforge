'use client'

import pptxgen from 'pptxgenjs'

interface ExportOptions {
  html: string
  slideCount: number
  baseName: string
}

/**
 * Detects whether the deck is reveal.js-based (uses Reveal.initialize / class="reveal").
 */
function isRevealDeck(html: string): boolean {
  return /class="reveal"|Reveal\.initialize|\/revealjs\//i.test(html)
}

/**
 * Parses the deck HTML to extract:
 *   - All <style> blocks (fonts + tokens + base + scoped CSS)
 *   - Each slide section element
 *
 * Then for each slide, renders it directly into a hidden 1280x720 div in the
 * parent document (NOT an iframe — html-to-image can't snapshot iframes),
 * snapshots the div to a PNG via html-to-image, and adds the PNG to a PPTX.
 *
 * Framework-aware: handles both open-design (section.slide) and reveal.js
 * (plain section inside .reveal .slides) deck structures.
 */
export async function exportToPptx({ html, slideCount, baseName }: ExportOptions): Promise<void> {
  const { toPng } = await import('html-to-image')

  // 1. Parse the deck HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Extract all <style> blocks from <head> (and any in body)
  const styleBlocks = Array.from(doc.querySelectorAll('style')).map((s) => s.outerHTML).join('\n')

  // Extract all slide elements — framework-aware
  // - reveal.js / open-design / shower: <section> elements
  // - impress.js: <div class="step"> elements
  // - dzslides: plain <section>
  let slideNodes: Element[] = []

  // Detect impress.js (uses .step elements, not <section>)
  const isImpress = doc.querySelector('#impress') !== null
  if (isImpress) {
    slideNodes = Array.from(doc.querySelectorAll('#impress .step'))
  }
  if (slideNodes.length === 0) {
    slideNodes = Array.from(doc.querySelectorAll('section.slide'))
  }
  if (slideNodes.length === 0) {
    slideNodes = Array.from(doc.querySelectorAll('.slide'))
  }
  if (slideNodes.length === 0) {
    slideNodes = Array.from(doc.querySelectorAll('section'))
  }

  if (slideNodes.length === 0) {
    throw new Error('No slides found in generated HTML.')
  }

  // 2. Set up an offscreen rendering container
  const stage = document.createElement('div')
  stage.style.position = 'fixed'
  stage.style.left = '-99999px'
  stage.style.top = '0'
  stage.style.width = '1280px'
  stage.style.height = '720px'
  stage.style.pointerEvents = 'none'
  stage.style.backgroundColor = '#ffffff'
  document.body.appendChild(stage)

  // The actual slide render area — fixed 1280x720
  const renderArea = document.createElement('div')
  renderArea.style.width = '1280px'
  renderArea.style.height = '720px'
  renderArea.style.position = 'relative'
  renderArea.style.overflow = 'hidden'
  renderArea.style.backgroundColor = '#ffffff'
  stage.appendChild(renderArea)

  // 3. Inject all styles so the slide CSS resolves correctly
  const styleEl = document.createElement('style')
  styleEl.setAttribute('data-export', 'true')
  styleEl.textContent = styleBlocks.replace(/<style[^>]*>|<\/style>/gi, '')
  document.head.appendChild(styleEl)

  // Force the stage to behave like a deck viewport
  const deckWrapper = document.createElement('div')
  deckWrapper.className = 'deck'
  deckWrapper.style.width = '1280px'
  deckWrapper.style.height = '720px'
  deckWrapper.style.position = 'relative'
  deckWrapper.style.overflow = 'hidden'
  renderArea.appendChild(deckWrapper)

  // 4. Build the PPTX
  const pptx = new pptxgen()
  pptx.defineLayout({ name: 'DECK_16x9', width: 13.333, height: 7.5 })
  pptx.layout = 'DECK_16x9'
  pptx.author = 'Decksmith AI'
  pptx.company = 'Generated Deck'

  try {
    // Wait for fonts to be ready
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready
    }

    const totalSlides = Math.min(slideCount, slideNodes.length)
    for (let i = 0; i < totalSlides; i++) {
      const slideHtml = slideNodes[i].outerHTML
      // Render only this slide
      deckWrapper.innerHTML = slideHtml
      // Force the slide to be visible and active
      const slideEl = deckWrapper.querySelector('section, .slide, .step') as HTMLElement | null
      if (slideEl) {
        slideEl.style.display = 'flex'
        slideEl.classList.add('is-active', 'active')
        slideEl.style.position = 'absolute'
        slideEl.style.inset = '0'
        slideEl.style.width = '100%'
        slideEl.style.height = '100%'
        // For impress.js: reset transforms that position the slide on the 3D canvas
        slideEl.style.transform = 'none'
        slideEl.style.left = '0'
        slideEl.style.top = '0'
      }

      // Wait a bit for layout and font loading
      await new Promise((r) => setTimeout(r, 350))

      let dataUrl: string = ''
      try {
        dataUrl = await toPng(renderArea, {
          width: 1280,
          height: 720,
          pixelRatio: 1.5,
          cacheBust: true,
          backgroundColor: '#ffffff',
        })
      } catch (err) {
        console.warn(`Snapshot failed for slide ${i + 1}:`, err)
      }

      const pptxSlide = pptx.addSlide()
      if (dataUrl) {
        pptxSlide.addImage({ data: dataUrl, x: 0, y: 0, w: 13.333, h: 7.5 })
      } else {
        pptxSlide.background = { color: 'FFFFFF' }
        // Fallback: extract text from the slide and add as text
        const text = slideNodes[i].textContent?.trim().slice(0, 200) || `Slide ${i + 1}`
        pptxSlide.addText(text, {
          x: 0.5,
          y: 3,
          w: 12.3,
          h: 1.5,
          fontSize: 18,
          align: 'center',
          color: '333333',
        })
      }
    }

    await pptx.writeFile({ fileName: `${baseName}.pptx` })
  } finally {
    document.head.removeChild(styleEl)
    document.body.removeChild(stage)
  }
}

/**
 * Triggers a browser download of the deck HTML.
 */
export function downloadHtml(html: string, baseName: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${baseName}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Print-CSS PDF export — opens a hidden iframe with the deck HTML + print CSS,
 * then triggers window.print() for one-click PDF download.
 *
 * Borrowed from presenton's pdf-maker approach (servers/nextjs/app/(export)/pdf-maker/PdfMakerPage.tsx)
 * but done entirely client-side — no Puppeteer, no server-side Chromium.
 *
 * Each slide renders at exactly 1280×720 with break-after: page so the browser's
 * native print-to-PDF produces one slide per page.
 */
export function exportToPdf(html: string, baseName: string): void {
  const printCss = `
<style>
  @media print {
    @page { size: 1280px 720px; margin: 0; }
    body { margin: 0; padding: 0; background: white; }
    /* Stack all slides vertically, one per page */
    .deck, .reveal .slides, #impress, body.shower {
      display: block !important;
      position: static !important;
      transform: none !important;
      width: 1280px !important;
      height: auto !important;
      overflow: visible !important;
    }
    /* Each slide = one page */
    .slide, section.slide, #impress .step, .slides > section, body.shower section.slide {
      break-after: page !important;
      page-break-after: always !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      position: relative !important;
      transform: none !important;
      width: 1280px !important;
      height: 720px !important;
      page: slide;
      display: flex !important;
      opacity: 1 !important;
    }
    /* Hide non-slide chrome */
    .progress-bar, .slide-counter, .controls, .progress, .hint, .fallback-message,
    .reveal > .controls, .reveal > .progress, header:not(.slide), footer:not(.slide),
    .caption, aside.notes, .notes, [role="note"], details.notes {
      display: none !important;
    }
  }
  /* Print-time visibility: force all slides visible */
  @media print {
    .slide, section.slide, #impress .step, .slides > section, body.shower section.slide {
      display: flex !important;
      opacity: 1 !important;
    }
  }
</style>`

  // Inject print CSS into the deck HTML
  const printableHtml = html.replace('</head>', `${printCss}</head>`)

  // Create a hidden iframe and print it
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.left = '-99999px'
  iframe.style.top = '0'
  iframe.style.width = '1280px'
  iframe.style.height = '720px'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    return
  }
  doc.open()
  doc.write(printableHtml)
  doc.close()

  // Wait for fonts + layout to settle, then print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch (err) {
      console.error('Print failed:', err)
    }
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1000)
  }, 800)
}
