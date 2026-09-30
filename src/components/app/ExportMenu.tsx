'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store/deck-store';
import { exportPptx } from '@/lib/export/pptx';
import { exportStandaloneHtml } from '@/lib/export/html';
import { exportNotesMarkdown } from '@/lib/export/notes';
import { SlideView } from '@/components/deck/SlideView';
import { getTheme } from '@/lib/design/themes';
import { visibleSlides } from '@/lib/deck/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Download, FileText, Globe, Presentation, Loader2, StickyNote } from 'lucide-react';

/**
 * PPTX → PptxGenJS (client), PDF → print CSS (@page 1280x720), HTML →
 * server-rendered standalone file from /api/export/html/:id.
 */
export function ExportMenu() {
  const deck = useAppStore((s) => s.deck);
  const [busy, setBusy] = useState<string | null>(null);

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
      <DropdownMenuContent align="end" className="w-52">
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
        <DropdownMenuItem onClick={notes} className="gap-2">
          <StickyNote className="h-4 w-4 text-neutral-500" /> Speaker notes (Markdown)
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
  const themeId = useAppStore((s) => s.deck?.themeId);
  if (!deck || typeof window === 'undefined') return null;
  const t = getTheme(themeId);
  const slides = visibleSlides(deck.slides);
  return (
    <div className="print-root" aria-hidden>
      {slides.map((s, i) => (
        <div className="print-slide" key={s.id}>
          <SlideView slide={s} theme={t} deckTitle={deck.title} index={i} pageCount={slides.length} />
        </div>
      ))}
    </div>
  );
}
