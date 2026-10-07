'use client';

/**
 * HTML deck snapshot exports — ported from decksmith's
 * src/lib/presentation/export.tsx technique, adapted for iframe-rendered
 * HTML decks served by /api/htmldecks/[id]/raw.
 *
 * Approach (differs from decksmith where needed):
 *  - The deck is loaded into a HIDDEN SAME-ORIGIN IFRAME at 1280×720. This
 *    matters: open-design templates size type with vw units, so the capture
 *    viewport must be exactly 1280×720 for pixel-faithful output.
 *  - Wait for iframe load + document.fonts.ready (both documents).
 *  - Iterate slides per engine:
 *      · opendesign: `.deck .slide` sections — activate each by toggling
 *        `is-active`/display exactly like _shared/runtime.js preview mode.
 *      · reveal: drive contentWindow.Reveal when exposed, else capture
 *        `.slides > section` nodes with forced visible styles.
 *      · any other engine: best-effort `section`/`.slide` capture.
 *  - html-to-image toPng per slide (pixelRatio 2), PptxGenJS 16:9 full-bleed.
 *  - ALL contentDocument access is wrapped in try/catch — cross-engine
 *    variance degrades to a thrown Error (caller shows a toast), never a crash.
 */

import pptxgen from 'pptxgenjs';

export type SnapshotProgress = (done: number, total: number, label?: string) => void;

const VIEW_W = 1280;
const VIEW_H = 720;
const LOAD_TIMEOUT_MS = 20_000;
const SETTLE_MS = 350;

interface LoadedFrame {
  iframe: HTMLIFrameElement;
  win: Window;
  doc: Document;
}

/* ------------------------------------------------------------------ */
/* Frame loading                                                       */
/* ------------------------------------------------------------------ */

function loadDeckFrame(deckId: string): Promise<LoadedFrame> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Snapshot export requires a browser.'));
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    iframe.style.position = 'fixed';
    iframe.style.left = '-99999px';
    iframe.style.top = '0';
    iframe.style.width = `${VIEW_W}px`;
    iframe.style.height = `${VIEW_H}px`;
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('The deck took too long to load for export.'));
    }, LOAD_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timer);
      iframe.removeEventListener('load', onLoad);
    };

    const onLoad = () => {
      window.clearTimeout(timer);
      // contentDocument access is the risky bit — same-origin in theory, but
      // never let a weird engine document take the app down.
      let win: Window | null = null;
      let doc: Document | null = null;
      try {
        win = iframe.contentWindow;
        doc = win?.document ?? null;
      } catch {
        doc = null;
      }
      if (!win || !doc || !doc.body) {
        cleanup();
        iframe.remove();
        reject(new Error('Could not access the deck document for export.'));
        return;
      }
      resolve({ iframe, win, doc });
    };

    iframe.addEventListener('load', onLoad);
    iframe.src = `/api/htmldecks/${deckId}/raw`;
    document.body.appendChild(iframe);
  });
}

async function waitForFonts(win: Window): Promise<void> {
  try {
    const fset = (win.document as Document & { fonts?: FontFaceSet }).fonts;
    if (fset?.ready) await fset.ready;
  } catch {
    /* font readiness is best-effort */
  }
  try {
    if (document.fonts?.ready) await document.fonts.ready;
  } catch {
    /* noop */
  }
  // Give web fonts a moment to paint after ready resolves.
  await new Promise((r) => setTimeout(r, 250));
}

/* ------------------------------------------------------------------ */
/* Slide collection per engine                                         */
/* ------------------------------------------------------------------ */

interface SlideCapture {
  el: HTMLElement;
  /** Activate this slide (mutates the live document inside the iframe). */
  prepare: () => void;
  style?: Record<string, string>;
}

function qs(doc: Document, sel: string): Element | null {
  try {
    return doc.querySelector(sel);
  } catch {
    return null;
  }
}

function qsa(doc: Document, sel: string): HTMLElement[] {
  try {
    return Array.from(doc.querySelectorAll<HTMLElement>(sel));
  } catch {
    return [];
  }
}

function collectSlides(doc: Document, win: Window): { engine: string; slides: SlideCapture[] } {
  // --- impress.js: .step nodes on a 3D canvas (best-effort only) ---
  if (qs(doc, '#impress')) {
    const steps = qsa(doc, '#impress .step');
    if (steps.length) {
      return {
        engine: 'impress',
        slides: steps.map((el) => ({
          el,
          prepare: () => {
            try {
              el.classList.add('active');
              el.style.position = 'absolute';
              el.style.transform = 'none';
              el.style.left = '0';
              el.style.top = '0';
              el.style.width = '100%';
              el.style.height = '100%';
            } catch {
              /* noop */
            }
          },
          style: { transform: 'none' },
        })),
      };
    }
  }

  // --- reveal.js: drive the runtime when it is exposed ---
  const revealRoot = qs(doc, '.reveal');
  const revealWin = win as Window & { Reveal?: { slide?: (h: number, v?: number, f?: number) => void; getSlides?: () => HTMLElement[] } };
  if (revealRoot && revealWin.Reveal && typeof revealWin.Reveal.slide === 'function') {
    let count = qsa(doc, '.reveal .slides > section').length;
    try {
      const gs = revealWin.Reveal.getSlides?.();
      if (gs && gs.length) count = gs.length;
    } catch {
      /* keep DOM count */
    }
    if (count > 0) {
      return {
        engine: 'reveal',
        slides: Array.from({ length: count }, (_, i) => ({
          el: revealRoot as HTMLElement,
          prepare: () => {
            try {
              revealWin.Reveal?.slide?.(i, 0, 0);
            } catch {
              /* noop */
            }
          },
        })),
      };
    }
  }

  // --- open-design runtime: .deck .slide with is-active toggling ---
  const odSlides = qsa(doc, '.deck .slide');
  const fallbackSlides = odSlides.length ? odSlides : qsa(doc, '.slide');
  if (fallbackSlides.length) {
    const engine = odSlides.length ? 'opendesign' : 'generic';
    return {
      engine,
      slides: fallbackSlides.map((el, _i) => ({
        el,
        prepare: () => {
          try {
            // Mirror _shared/runtime.js preview-mode activation.
            for (const s of fallbackSlides) {
              const active = s === el;
              s.classList.toggle('is-active', active);
              s.classList.toggle('active', active);
              s.style.display = active ? '' : 'none';
              if (active) {
                s.style.opacity = '1';
                s.style.transform = 'none';
                s.style.pointerEvents = 'auto';
              }
            }
          } catch {
            /* noop */
          }
        },
        style: { transform: 'none' },
      })),
    };
  }

  // --- reveal without runtime / dzslides / shower: plain sections ---
  const sections = qsa(doc, '.slides > section').length
    ? qsa(doc, '.slides > section')
    : qsa(doc, 'body > section');
  return {
    engine: sections.length ? 'generic-sections' : 'unknown',
    slides: sections.map((el) => ({
      el,
      prepare: () => {
        try {
          el.classList.add('present', 'is-active', 'active');
          el.style.display = 'flex';
          el.style.opacity = '1';
          el.style.position = 'absolute';
          el.style.inset = '0';
          el.style.transform = 'none';
        } catch {
          /* noop */
        }
      },
      style: { transform: 'none' },
    })),
  };
}

function findActiveSlide(doc: Document): HTMLElement | null {
  const candidates = [
    '.deck .slide.is-active',
    '.slide.is-active',
    '.reveal .slides > section.present',
    '#impress .step.active',
    'body.shower .slide.active',
    '.slide',
    'section',
  ];
  for (const sel of candidates) {
    const el = qs(doc, sel);
    if (el) return el as HTMLElement;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Capture helpers                                                     */
/* ------------------------------------------------------------------ */

async function toPng(el: HTMLElement, style?: Record<string, string>): Promise<string> {
  const { toPng } = await import('html-to-image');
  return toPng(el, {
    width: VIEW_W,
    height: VIEW_H,
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#ffffff',
    style,
  });
}

function withFrame<T>(frame: LoadedFrame, fn: () => Promise<T>): Promise<T> {
  return fn().finally(() => {
    try {
      frame.iframe.remove();
    } catch {
      /* noop */
    }
  });
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Snapshot every slide of a deck to PNG data URLs (1280×720 @2x). */
export async function toPngPerSlide(
  deckId: string,
  onProgress?: SnapshotProgress,
): Promise<string[]> {
  const frame = await loadDeckFrame(deckId);
  return withFrame(frame, async () => {
    const { engine, slides } = collectSlides(frame.doc, frame.win);
    if (!slides.length) throw new Error('No slides found in the deck document.');
    await waitForFonts(frame.win);
    const urls: string[] = [];
    for (let i = 0; i < slides.length; i++) {
      const cap = slides[i];
      onProgress?.(i, slides.length, cap.el.textContent?.trim().slice(0, 60) || undefined);
      cap.prepare();
      await new Promise((r) => setTimeout(r, SETTLE_MS));
      try {
        urls.push(await toPng(cap.el, cap.style));
      } catch (err) {
        console.warn(`html-snapshot: slide ${i + 1}/${slides.length} failed`, err);
      }
    }
    if (!urls.length) {
      throw new Error(`Snapshot failed — the ${engine} document could not be captured.`);
    }
    return urls;
  });
}

/**
 * Snapshot the CURRENTLY VISIBLE slide of a deck. When the viewer's own
 * (same-origin) iframe is available its live document is used — that keeps
 * "current slide" exact. Falls back to a fresh hidden frame (slide 1).
 * Returns a PNG data URL.
 */
export async function toPngCurrentSlide(
  deckId: string,
  sourceIframe?: HTMLIFrameElement | null,
): Promise<string> {
  let doc: Document | null = null;
  if (sourceIframe) {
    try {
      doc = sourceIframe.contentWindow?.document ?? null;
    } catch {
      doc = null;
    }
  }
  if (doc && doc.body) {
    const el = findActiveSlide(doc);
    if (el) {
      try {
        return await toPng(el, { transform: 'none' });
      } catch (err) {
        console.warn('html-snapshot: live-iframe capture failed, retrying fresh frame', err);
      }
    }
  }
  // Fresh hidden frame — most decks start on slide 1.
  const frame = await loadDeckFrame(deckId);
  return withFrame(frame, async () => {
    const el = findActiveSlide(frame.doc) ?? qsa(frame.doc, '.slide, section')[0];
    if (!el) throw new Error('No slides found in the deck document.');
    await waitForFonts(frame.win);
    return toPng(el);
  });
}

/** Snapshot all slides and assemble a 16:9 PPTX; returns the file blob. */
export async function toPptx(
  deckId: string,
  title: string,
  onProgress?: SnapshotProgress,
): Promise<Blob> {
  const urls = await toPngPerSlide(deckId, onProgress);
  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'DECK_16x9', width: 13.333, height: 7.5 });
  pptx.layout = 'DECK_16x9';
  if (title) pptx.title = title;
  pptx.company = 'DeckForge AI';
  for (const dataUrl of urls) {
    const slide = pptx.addSlide();
    slide.addImage({ data: dataUrl, x: 0, y: 0, w: 13.333, h: 7.5 });
  }
  const out = (await pptx.write({ outputType: 'blob' })) as Blob;
  if (!(out instanceof Blob)) {
    return new Blob([out as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  }
  return out;
}

/** Trigger a browser download for a blob (shared by viewer + library). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Filename-safe slug from a deck title. */
export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^\w\d -]+/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'html-deck'
  );
}
