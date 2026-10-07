'use client';

import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import PptxGenJS from 'pptxgenjs';
import { toPng } from 'html-to-image';
import type { Deck, Slide, ThemeManifest } from '@/lib/deck/types';
import { deckFooterText, visibleSlides } from '@/lib/deck/types';
import { deckTheme } from '@/lib/design/themes';
import { SlideView } from '@/components/deck/SlideView';

/**
 * Pixel-perfect ("snapshot") exports.
 *
 * Unlike pptx.ts — which rebuilds native, editable text/shapes/charts in
 * PptxGenJS — this module renders every slide with the REAL React components
 * the app uses, at the exact 1280x720 canvas, then rasterizes it to PNG with
 * html-to-image. Output is identical to the screen (accent overrides, theme
 * decor, custom fonts, chart rendering) at the cost of editability.
 *
 * Approach mirrors decksmith's proven pattern
 * (upload/decksmith-extracted/src/lib/presentation/export.tsx): an offscreen
 * fixed-position stage -> createRoot render -> fonts.ready -> toPng ->
 * pptxgenjs full-bleed image slide. html-to-image cannot snapshot iframes,
 * so the slide renders directly in this document, offscreen.
 */

const STAGE_W = 1280;
const STAGE_H = 720;
/** Hard cap so a runaway deck can't exhaust memory (matches the editor cap). */
const MAX_SNAPSHOT_SLIDES = 60;
/** Recharts animates charts on mount; capture only after they have rested. */
const CHART_SETTLE_MS = 1800;
const SETTLE_MS = 150;
/** Small pause between slides so the browser can reclaim nodes. */
const BETWEEN_SLIDES_MS = 30;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** Same naming convention as the editable PPTX export in pptx.ts. */
export function deckSlug(title: string): string {
  return title.replace(/[^\w\d -]+/g, '').slice(0, 60) || 'deck';
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64 = ''] = dataUrl.split(',');
  const mime = /:(.*?);/.exec(meta)?.[1] ?? 'image/png';
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function assertBrowser(): void {
  if (typeof document === 'undefined') {
    throw new Error('Snapshot export only runs in the browser.');
  }
}

/** Offscreen fixed-size stage: far offscreen, non-interactive, theme-colored. */
function createStage(bg: string): HTMLDivElement {
  const stage = document.createElement('div');
  stage.setAttribute('aria-hidden', 'true');
  stage.style.position = 'fixed';
  stage.style.left = '-99999px';
  stage.style.top = '0';
  stage.style.width = `${STAGE_W}px`;
  stage.style.height = `${STAGE_H}px`;
  stage.style.pointerEvents = 'none';
  stage.style.zIndex = '-1';
  stage.style.background = bg;
  document.body.appendChild(stage);
  return stage;
}

interface SnapshotSlideProps {
  slide: Slide;
  theme: ThemeManifest;
  /** Visible position (0-based) — drives the footer page number. */
  index: number;
  pageCount: number;
  deckTitle: string;
  showPageNumbers: boolean;
  /** PNG resolution multiplier (2 = 2560x1440 per slide). */
  pixelRatio: number;
}

/**
 * Mounts one slide into the stage at natural 1280x720 (no ScaledSlide
 * transform), waits for fonts + a frame + chart settle, and returns the PNG
 * data URL. Always unmounts the React tree and removes the node.
 */
async function renderSlideToPng(stage: HTMLDivElement, props: SnapshotSlideProps): Promise<string> {
  const holder = document.createElement('div');
  holder.style.width = `${STAGE_W}px`;
  holder.style.height = `${STAGE_H}px`;
  holder.style.position = 'relative';
  holder.style.overflow = 'hidden';
  holder.style.background = props.theme.tokens.colors.bg;
  stage.replaceChildren(holder);

  const root = createRoot(holder);
  try {
    root.render(
      createElement(SlideView, {
        slide: props.slide,
        theme: props.theme,
        deckTitle: props.deckTitle,
        index: props.index,
        pageCount: props.pageCount,
        showPageNumbers: props.showPageNumbers,
      })
    );

    // Commit -> font loads settle -> one more frame so ResponsiveContainer
    // charts measure at full size (identical to the editor canvas).
    await nextFrame();
    await document.fonts.ready;
    await nextFrame();
    const isChart = props.slide.layout === 'chart' && !!props.slide.chart;
    await delay(isChart ? CHART_SETTLE_MS : SETTLE_MS);

    return await toPng(holder, {
      width: STAGE_W,
      height: STAGE_H,
      pixelRatio: props.pixelRatio,
      cacheBust: true,
      backgroundColor: props.theme.tokens.colors.bg,
    });
  } finally {
    root.unmount();
    holder.remove();
    await delay(BETWEEN_SLIDES_MS);
  }
}

export interface PptxSnapshotOptions {
  deck: Deck;
  /** Resolved render theme. Defaults to deckTheme(deck) (accent applied). */
  theme?: ThemeManifest;
  /** Called after each captured slide: done / total (starts at 0/total). */
  onProgress?: (done: number, total: number) => void;
  /** PNG resolution multiplier (default 2). */
  pixelRatio?: number;
}

/**
 * PPTX where every slide is a full-bleed PNG snapshot of the on-screen
 * render. Hidden slides are skipped (same rule as the editable export).
 */
export async function exportPptxSnapshot(options: PptxSnapshotOptions): Promise<void> {
  assertBrowser();

  const { deck, onProgress } = options;
  const theme = options.theme ?? deckTheme(deck);
  const pixelRatio = options.pixelRatio ?? 2;

  const slides = visibleSlides(deck.slides).slice(0, MAX_SNAPSHOT_SLIDES);
  if (slides.length === 0) throw new Error('No visible slides to export.');

  const stage = createStage(theme.tokens.colors.bg);
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9'; // built-in 10 x 5.625 in — PNGs go full-bleed
  pptx.title = deck.title;
  pptx.author = 'DeckForge AI';

  const deckTitle = deckFooterText(deck);
  const showPageNumbers = deck.meta?.showPageNumbers !== false;
  const fileName = `${deckSlug(deck.title)}-snapshot.pptx`;

  try {
    await document.fonts.ready;
    onProgress?.(0, slides.length);

    // Sequential on purpose: one React root + one rasterization at a time
    // keeps peak memory at a single 2560x1440 PNG instead of the whole deck.
    for (let i = 0; i < slides.length; i += 1) {
      const slide = slides[i];
      let dataUrl = '';
      try {
        dataUrl = await renderSlideToPng(stage, {
          slide,
          theme,
          index: i,
          pageCount: slides.length,
          deckTitle,
          showPageNumbers,
          pixelRatio,
        });
      } catch (err) {
        console.warn(`Snapshot failed for slide ${i + 1}; adding a text fallback.`, err);
      }

      const ps = pptx.addSlide();
      if (dataUrl) {
        ps.addImage({ data: dataUrl, x: 0, y: 0, w: 10, h: 5.625 });
      } else {
        // A single failing slide must never lose the whole export.
        ps.background = { color: theme.tokens.colors.bg.replace('#', '') };
        ps.addText(slide.title || deck.title, {
          x: 0.5, y: 2.4, w: 9, h: 0.9, fontSize: 28, bold: true,
          color: theme.tokens.colors.text.replace('#', ''), align: 'center',
        });
      }
      if (slide.notes) ps.addNotes(slide.notes);
      onProgress?.(i + 1, slides.length);
    }

    await pptx.writeFile({ fileName });
  } finally {
    stage.remove();
  }
}

export interface SlidePngOptions {
  slide: Slide;
  theme: ThemeManifest;
  /** Visible position (0-based) — footer page number + file name suffix. */
  index: number;
  /** Footer/page-number context (defaults: single page, numbers off). */
  pageCount?: number;
  deckTitle?: string;
  showPageNumbers?: boolean;
  /** File name without extension (defaults to the deck title slug). */
  fileBase?: string;
  /** PNG resolution multiplier (default 2). */
  pixelRatio?: number;
}

/** Single current-slide PNG download: `${base}-slide-NN.png`. */
export async function exportSlidePng(options: SlidePngOptions): Promise<void> {
  assertBrowser();

  const stage = createStage(options.theme.tokens.colors.bg);
  try {
    await document.fonts.ready;
    const dataUrl = await renderSlideToPng(stage, {
      slide: options.slide,
      theme: options.theme,
      index: options.index,
      pageCount: options.pageCount ?? 1,
      deckTitle: options.deckTitle ?? '',
      showPageNumbers: options.showPageNumbers ?? false,
      pixelRatio: options.pixelRatio ?? 2,
    });
    const n = String(options.index + 1).padStart(2, '0');
    const base = options.fileBase ?? deckSlug(options.deckTitle || options.slide.title || 'deck');
    downloadBlob(dataUrlToBlob(dataUrl), `${base}-slide-${n}.png`);
  } finally {
    stage.remove();
  }
}
