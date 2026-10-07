'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store/deck-store';
import { exportPptx } from '@/lib/export/pptx';
import { exportStandaloneHtml } from '@/lib/export/html';
import { exportNotesMarkdown } from '@/lib/export/notes';
import { exportDeckJson } from '@/lib/export/deckjson';
import { exportPptxSnapshot, exportSlidePng, deckSlug } from '@/lib/export/pptx-snapshot';
import { SlideView } from '@/components/deck/SlideView';
import { deckTheme } from '@/lib/design/themes';
import { deckFooterText, visibleSlides } from '@/lib/deck/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Download, FileText, Globe, Presentation, Loader2, StickyNote, FileJson, Camera, ImageDown } from 'lucide-react';

/**
 * Cross-instance guard: the menu and the command palette each hold their own
 * hook instance, so local `busy` state cannot see each other. The snapshot
 * jobs are heavy (offscreen render + rasterize per slide) — never run two.
 */
let snapshotInFlight = false;

/**
 * PPTX → PptxGenJS (client), PDF → print CSS (@page 1280x720), HTML →
 * server-rendered standalone file from /api/export/html/:id.
 * Snapshot exports (pixel-perfect PPTX / slide PNG) rasterize the real
 * slide components offscreen via html-to-image.
 *
 * The export actions live in a hook so the editor command palette (⌘K)
 * can trigger the exact same code paths as this menu.
 */
export function useExportActions() {
  const deck = useAppStore((s) => s.deck);
  const currentSlideIndex = useAppStore((s) => s.currentSlideIndex);
  const [busy, setBusy] = useState<string | null>(null);
  const [snapshotProgress, setSnapshotProgress] = useState<{ done: number; total: number } | null>(null);

  const pptx = async () => {
    if (!deck) return;
    setBusy('pptx');
    try {
      await exportPptx(deck);
      toast.success('PPTX downloaded.');
    } catch (e) {
      console.error(e);
      toast.error('PPTX export failed.');
    } finally {
      setBusy(null);
    }
  };

  /**
   * Pixel-perfect PPTX: every slide rendered by the real components and
   * embedded as a full-bleed image. Slower than the editable export —
   * progress streams through snapshotProgress for the menu label.
   */
  const pptxSnapshot = async () => {
    if (!deck || snapshotInFlight) return;
    setBusy('pptxSnapshot');
    snapshotInFlight = true;
    setSnapshotProgress({ done: 0, total: visibleSlides(deck.slides).length });
    try {
      await exportPptxSnapshot({
        deck,
        onProgress: (done, total) => setSnapshotProgress({ done, total }),
      });
      toast.success('Pixel-perfect PPTX downloaded — slides embedded as full-bleed images.');
    } catch (e) {
      console.error(e);
      toast.error('Snapshot PPTX failed. The editable PPTX export builds native slides instead.');
    } finally {
      snapshotInFlight = false;
      setBusy(null);
      setSnapshotProgress(null);
    }
  };

  /** Single current-slide PNG download (thumbnail / handout quality). */
  const slidePng = async () => {
    if (!deck || snapshotInFlight) return;
    const slides = visibleSlides(deck.slides);
    const visIdx = Math.min(currentSlideIndex, slides.length - 1);
    const slide = slides[visIdx];
    if (!slide) {
      toast.error('Nothing to export — the deck has no visible slides.');
      return;
    }
    setBusy('slidePng');
    snapshotInFlight = true;
    try {
      await exportSlidePng({
        slide,
        theme: deckTheme(deck),
        index: visIdx,
        pageCount: slides.length,
        deckTitle: deckFooterText(deck),
        showPageNumbers: deck.meta?.showPageNumbers !== false,
        fileBase: deckSlug(deck.title),
      });
      toast.success(`Slide ${visIdx + 1} PNG downloaded.`);
    } catch (e) {
      console.error(e);
      toast.error('Slide PNG export failed.');
    } finally {
      snapshotInFlight = false;
      setBusy(null);
    }
  };

  const pdf = () => {
    if (!deck) return;
    toast.info('In the print dialog choose “Save as PDF”, margins: none.');
    setTimeout(() => window.print(), 350);
  };

  const html = async () => {
    if (!deck) return;
    setBusy('html');
    try {
      await exportStandaloneHtml(deck);
      toast.success('Standalone HTML downloaded.');
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'HTML export failed.');
    } finally {
      setBusy(null);
    }
  };

  const notes = () => {
    if (!deck) return;
    try {
      exportNotesMarkdown(deck);
      toast.success('Speaker notes downloaded.');
    } catch (e) {
      console.error(e);
      toast.error('Notes export failed.');
    }
  };

  const deckJson = () => {
    if (!deck) return;
    try {
      exportDeckJson(deck);
      toast.success('Deck file downloaded — re-import it from the landing page.');
    } catch (e) {
      console.error(e);
      toast.error('Deck file export failed.');
    }
  };

  return { deck, busy, snapshotProgress, pptx, pdf, html, notes, deckJson, pptxSnapshot, slidePng };
}

export function ExportMenu() {
  const { busy, snapshotProgress, pptx, pdf, html, notes, deckJson, pptxSnapshot, slidePng } = useExportActions();

  const snapshotLabel =
    busy === 'pptxSnapshot'
      ? `Rendering${snapshotProgress ? ` ${snapshotProgress.done}/${snapshotProgress.total}` : ''}…`
      : 'PPTX — pixel-perfect (images)';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-neutral-300 text-sm font-medium hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          disabled={!!busy}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-neutral-400">Present &amp; share</DropdownMenuLabel>
        <DropdownMenuItem onClick={pptx} className="gap-2">
          <Presentation className="h-4 w-4 text-neutral-500" /> PPTX (editable)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={pdf} className="gap-2">
          <FileText className="h-4 w-4 text-neutral-500" /> PDF (print dialog)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={html} className="gap-2">
          <Globe className="h-4 w-4 text-neutral-500" /> Standalone HTML
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-neutral-400">Pixel-perfect</DropdownMenuLabel>
        <DropdownMenuItem onClick={pptxSnapshot} disabled={!!busy} className="gap-2">
          <Camera className="h-4 w-4 text-neutral-500" /> {snapshotLabel}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={slidePng} disabled={!!busy} className="gap-2">
          <ImageDown className="h-4 w-4 text-neutral-500" /> {busy === 'slidePng' ? 'Rendering…' : 'PNG — current slide'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-neutral-400">Handouts &amp; data</DropdownMenuLabel>
        <DropdownMenuItem onClick={notes} className="gap-2">
          <StickyNote className="h-4 w-4 text-neutral-500" /> Speaker notes (Markdown)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={deckJson} className="gap-2">
          <FileJson className="h-4 w-4 text-neutral-500" /> Deck file (.json)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Hidden print surface: all slides at exact 1280x720, shown only in print.
 * Paired with the @media print block in globals.css.
 */
export function PrintSurface() {
  const deck = useAppStore((s) => s.deck);
  if (!deck || typeof window === 'undefined') return null;
  const t = deckTheme(deck);
  const slides = visibleSlides(deck.slides);
  return (
    <div className="print-root" aria-hidden>
      {slides.map((s, i) => (
        <div className="print-slide" key={s.id}>
          <SlideView
            slide={s}
            theme={t}
            deckTitle={deckFooterText(deck)}
            index={i}
            pageCount={slides.length}
            showPageNumbers={deck.meta?.showPageNumbers !== false}
          />
        </div>
      ))}
    </div>
  );
}
