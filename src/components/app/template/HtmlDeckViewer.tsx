'use client';

/**
 * HtmlDeckViewer — renders a generated/saved HTML deck from
 * /api/htmldecks/[id]/raw and exposes present + export actions.
 *
 * Snapshot exports (PNG / PPTX "snapshot") go through lib/export/html-snapshot
 * and are only enabled for open-design + reveal engines — other engines show
 * the PPTX button disabled with an explanatory tooltip.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FRAMEWORK_LABEL, isSnapshotableEngine, useHtmlStore, type HtmlEngine } from '@/lib/store/html-store';
import {
  downloadBlob,
  slugify,
  toPngCurrentSlide,
  toPptx,
} from '@/lib/export/html-snapshot';
import {
  Download,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Maximize,
  Presentation,
  Trash2,
  TriangleAlert,
} from 'lucide-react';

interface ViewerDeck {
  id?: string;
  title?: string;
  subtitle?: string | null;
  templateId?: string;
  engine?: HtmlEngine;
  html?: string;
}

const SNAPSHOT_TOOLTIP = 'snapshot export supports open-design + reveal decks';
const IFRAME_TIMEOUT_MS = 15_000;

export function HtmlDeckViewer({
  deckId,
  title,
  onBack,
}: {
  deckId: string;
  title: string;
  onBack?: () => void;
}) {
  const reset = useHtmlStore((s) => s.reset);
  const openPicker = useHtmlStore((s) => s.openPicker);

  const [deck, setDeck] = useState<ViewerDeck | null>(null);
  const [deckError, setDeckError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeSlow, setIframeSlow] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [exporting, setExporting] = useState<'png' | 'pptx' | null>(null);
  const [exportNote, setExportNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deckPos, setDeckPos] = useState<{ index: number; total: number } | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /* ---- load deck meta (engine + html for the .html download) ---- */
  useEffect(() => {
    let alive = true;
    setDeck(null);
    setDeckError(null);
    setIframeLoaded(false);
    setIframeSlow(false);
    fetch(`/api/htmldecks/${deckId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Deck load failed (HTTP ${res.status})`);
        return res.json();
      })
      .then((j: { deck?: ViewerDeck } & ViewerDeck) => {
        if (alive) setDeck(j.deck ?? j);
      })
      .catch((e: unknown) => {
        if (alive) setDeckError(e instanceof Error ? e.message : 'Deck load failed');
      });
    return () => {
      alive = false;
    };
  }, [deckId]);

  /* ---- slow-load notice ---- */
  useEffect(() => {
    if (iframeLoaded) return;
    const t = window.setTimeout(() => setIframeSlow(true), IFRAME_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [iframeLoaded]);

  /* ---- position chip: read the deck document's active slide (same-origin).
   * Decks own their chrome, so many templates have no counter at all — and
   * automation observing the parent DOM cannot see inside the frame. Poll
   * the active section read-only and mirror it next to the toolbar. ---- */
  useEffect(() => {
    if (!iframeLoaded) return;
    const read = () => {
      try {
        const doc = iframeRef.current?.contentDocument;
        if (!doc) return;
        const revealSections = doc.querySelectorAll('.reveal .slides > section');
        let total = 0;
        let index = 0;
        if (revealSections.length > 0) {
          total = revealSections.length;
          index = Array.prototype.findIndex.call(revealSections, (s) => s.classList.contains('present'));
        } else {
          const slides = doc.querySelectorAll('.deck > .slide, .deck .slide');
          if (slides.length > 0) {
            total = slides.length;
            index = Array.prototype.findIndex.call(slides, (s) => s.classList.contains('is-active'));
          }
        }
        if (total > 0) setDeckPos({ index: Math.max(index, 0), total });
      } catch {
        /* frame not ready or cross-origin — keep last known position */
      }
    };
    read();
    const t = window.setInterval(read, 400);
    return () => window.clearInterval(t);
  }, [iframeLoaded, deckId]);

  /* ---- fullscreen tracking ---- */
  useEffect(() => {
    const onChange = () => {
      const active = document.fullscreenElement === stageRef.current;
      setIsFullscreen(active);
      if (!active) setShowHint(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  /* ---- key forwarding: deck documents carry their own keyboard nav, but a
   * keydown only ever reaches the frame that has focus. When the parent page
   * holds focus (the common case outside Present mode), arrow/space/page keys
   * did nothing. Mirror nav keys into the deck document (same-origin) so the
   * deck responds no matter which frame is focused. Parent inputs keep keys. ---- */
  useEffect(() => {
    const NAV: Record<string, number> = {
      ArrowRight: 39,
      ArrowLeft: 37,
      ArrowDown: 40,
      ArrowUp: 38,
      PageDown: 34,
      PageUp: 33,
      Home: 36,
      End: 35,
      ' ': 32,
    };
    const onKey = (e: KeyboardEvent) => {
      const keyCode = NAV[e.key];
      if (!keyCode || !iframeRef.current) return;
      const active = document.activeElement as HTMLElement | null;
      const tag = (active?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || active?.isContentEditable) return;
      const frame = iframeRef.current;
      const win = frame.contentWindow;
      const doc = frame.contentDocument;
      if (!win || !doc || !doc.body) return;
      const ev = new win.KeyboardEvent('keydown', {
        key: e.key,
        code: e.code,
        keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true,
      });
      doc.body.dispatchEvent(ev);
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const engine = deck?.engine;
  const snapshotable = isSnapshotableEngine(engine);
  const rawUrl = `/api/htmldecks/${deckId}/raw`;

  const present = useCallback(async () => {
    const el = stageRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
    } catch {
      toast.error('Fullscreen was blocked by the browser.');
    }
    // The deck documents carry their own keyboard nav — hand the iframe focus
    // so arrow keys drive the deck immediately.
    window.setTimeout(() => {
      try {
        iframeRef.current?.contentWindow?.focus();
      } catch {
        /* noop */
      }
      try {
        iframeRef.current?.focus();
      } catch {
        /* noop */
      }
    }, 300);
    setShowHint(true);
    window.setTimeout(() => setShowHint(false), 4500);
  }, []);

  const downloadHtml = useCallback(async () => {
    try {
      let html = deck?.html;
      if (!html) {
        const res = await fetch(`/api/htmldecks/${deckId}`);
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Deck load failed');
        html = (j.deck ?? j).html as string;
      }
      downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `${slugify(title)}.html`);
      toast.success('Deck .html saved.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Download failed');
    }
  }, [deck?.html, deckId, title]);

  const exportPng = useCallback(async () => {
    if (exporting) return;
    setExporting('png');
    setExportNote('');
    try {
      const dataUrl = await toPngCurrentSlide(deckId, iframeRef.current);
      const blob = await (await fetch(dataUrl)).blob();
      downloadBlob(blob, `${slugify(title)}-slide.png`);
      toast.success('Slide PNG saved.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'PNG export failed');
    } finally {
      setExporting(null);
      setExportNote('');
    }
  }, [deckId, exporting, title]);

  const exportPptx = useCallback(async () => {
    if (exporting || !snapshotable) return;
    setExporting('pptx');
    setExportNote('Loading deck…');
    try {
      const blob = await toPptx(deckId, title, (done, total) =>
        setExportNote(`Capturing slide ${Math.min(done + 1, total)} / ${total}…`),
      );
      downloadBlob(blob, `${slugify(title)}.pptx`);
      toast.success('Snapshot PPTX saved.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'PPTX snapshot failed');
    } finally {
      setExporting(null);
      setExportNote('');
    }
  }, [deckId, exporting, snapshotable, title]);

  const deleteDeck = useCallback(async () => {
    setConfirmDelete(false);
    try {
      const res = await fetch(`/api/htmldecks/${deckId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(`Deleted “${title}”`);
      window.dispatchEvent(new Event('htmldecks:changed'));
      reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  }, [deckId, reset, title]);

  const actionBtn =
    'stg-label h-10 gap-1.5 rounded-none border-2 border-[color:var(--stg-ink)] px-3.5 text-[10px]';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="stg-label flex items-center gap-2 text-[10px] text-[color:var(--stg-ink)]/60">
            <span className="inline-block h-2 w-2 bg-[color:var(--stg-yellow)]" aria-hidden />
            Deck ready
          </p>
          <h2 className="stg-display mt-1.5 truncate text-3xl uppercase leading-none sm:text-4xl">
            {title}
          </h2>
          {deck?.subtitle && (
            <p className="mt-1.5 max-w-[70ch] text-sm text-[color:var(--stg-ink)]/70">{deck.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {engine && (
            <span className="border border-[color:var(--stg-ink)]/30 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--stg-ink)]/70">
              {FRAMEWORK_LABEL[engine] ?? engine}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => (onBack ? onBack() : openPicker())}
            className="stg-label h-9 rounded-none border-2 border-[color:var(--stg-ink)] text-[10px]"
          >
            ← Back to templates
          </Button>
        </div>
      </div>

      {deckError && (
        <div className="flex items-center gap-2 border-2 border-red-700/50 bg-red-50 p-3 text-sm text-red-800">
          <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
          {deckError} — the raw document may still render below; try “Open in new tab”.
        </div>
      )}

      {/* Stage — 16:9 frame, ~70vh on desktop */}
      <div
        ref={stageRef}
        className={cn(
          'relative bg-[color:var(--stg-ink)]',
          isFullscreen && 'grid h-screen w-screen place-items-center bg-black',
        )}
      >
        <div
          className={cn(
            'relative w-full',
            isFullscreen ? 'h-full' : 'mx-auto max-w-[calc(70vh*16/9)] border-2 border-[color:var(--stg-ink)] shadow-[8px_8px_0_0_var(--stg-ink)]',
          )}
        >
          <iframe
            ref={iframeRef}
            src={rawUrl}
            title={`${title} — HTML deck`}
            onLoad={() => setIframeLoaded(true)}
            allow="fullscreen"
            className={cn(
              'block w-full border-0 bg-white',
              isFullscreen ? 'h-full' : 'aspect-video',
            )}
          />
          {!iframeLoaded && (
            <div className="absolute inset-0 grid place-items-center" aria-hidden>
              <div className="absolute inset-0 animate-pulse bg-[color:var(--stg-cream-2)]" />
              <span className="stg-label relative text-[10px] text-[color:var(--stg-ink)]/50">
                Loading deck…
              </span>
            </div>
          )}
          {/* Escape hint overlay while presenting */}
          {isFullscreen && showHint && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
              <p className="stg-label bg-[color:var(--stg-ink)]/85 px-4 py-2 text-[10px] text-[color:var(--stg-yellow)]">
                ESC to exit · ← → to navigate · deck owns the keys
              </p>
            </div>
          )}
        </div>
      </div>

      {iframeSlow && !iframeLoaded && (
        <p className="stg-label flex items-center gap-2 text-[10px] text-[color:var(--stg-ink)]/70">
          <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
          Still loading — if nothing appears, the deck document may be missing. Try “Open in new tab”.
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {deckPos && (
          <span
            data-testid="viewer-position"
            aria-label={`Slide ${deckPos.index + 1} of ${deckPos.total}`}
            className="stg-label inline-flex items-center gap-1 border border-[color:var(--stg-ink)]/25 bg-[color:var(--stg-cream-2)] px-2 py-1 font-mono text-[10px] text-[color:var(--stg-ink)]/80"
          >
            {String(deckPos.index + 1).padStart(2, '0')} / {String(deckPos.total).padStart(2, '0')}
          </span>
        )}
        <Button
          onClick={present}
          data-testid="viewer-present"
          className={cn(actionBtn, 'bg-[color:var(--stg-yellow)] text-[color:var(--stg-ink)] hover:bg-[color:var(--stg-yellow-deep)]')}
        >
          <Presentation className="h-4 w-4" aria-hidden /> Present
        </Button>

        <Button
          variant="outline"
          onClick={downloadHtml}
          disabled={!deck}
          className={cn(actionBtn, 'bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)] hover:bg-[color:var(--stg-ink)] hover:text-[color:var(--stg-yellow)]')}
        >
          <Download className="h-3.5 w-3.5" aria-hidden /> .html
        </Button>

        <Button
          variant="outline"
          onClick={exportPng}
          disabled={!deck || !!exporting}
          data-testid="viewer-png-export"
          className={cn(actionBtn, 'bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)] hover:bg-[color:var(--stg-ink)] hover:text-[color:var(--stg-yellow)]')}
        >
          {exporting === 'png' ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <ImageIcon className="h-3.5 w-3.5" aria-hidden />}
          PNG · this slide
        </Button>

        {snapshotable ? (
          <Button
            variant="outline"
            onClick={exportPptx}
            disabled={!deck || !!exporting}
            className={cn(actionBtn, 'bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)] hover:bg-[color:var(--stg-ink)] hover:text-[color:var(--stg-yellow)]')}
          >
            {exporting === 'pptx' ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Download className="h-3.5 w-3.5" aria-hidden />}
            PPTX · snapshot
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex" aria-disabled="true" tabIndex={0} role="button" aria-label={`PPTX snapshot unavailable: ${SNAPSHOT_TOOLTIP}`}>
                <Button
                  variant="outline"
                  disabled
                  aria-hidden
                  tabIndex={-1}
                  className={cn(actionBtn, 'cursor-not-allowed bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)]/40')}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden /> PPTX · snapshot
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-xs">{SNAPSHOT_TOOLTIP}</TooltipContent>
          </Tooltip>
        )}

        <Button
          variant="outline"
          onClick={() => window.open(rawUrl, '_blank', 'noopener')}
          className={cn(actionBtn, 'bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)] hover:bg-[color:var(--stg-ink)] hover:text-[color:var(--stg-yellow)]')}
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Open tab
        </Button>

        <Button
          variant="outline"
          onClick={() => setConfirmDelete(true)}
          className={cn(actionBtn, 'ml-auto border-red-700/60 bg-[color:var(--stg-cream)] text-red-800 hover:border-red-700 hover:bg-red-700 hover:text-white')}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
        </Button>
      </div>

      {exportNote && (
        <p className="stg-label flex items-center gap-2 text-[10px] text-[color:var(--stg-ink)]/70" aria-live="polite">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> {exportNote}
        </p>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the generated HTML deck. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteDeck}
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
            >
              Delete deck
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Skeleton used while a deck opens from the library. */
export function HtmlDeckViewerSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-10 w-2/3 rounded-none bg-[color:var(--stg-ink)]/10" />
      <Skeleton className="aspect-video w-full rounded-none bg-[color:var(--stg-ink)]/10" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-none bg-[color:var(--stg-ink)]/10" />
        ))}
      </div>
    </div>
  );
}
