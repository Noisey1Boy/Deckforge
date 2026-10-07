'use client';

import { useMemo } from 'react';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator, CommandShortcut,
} from '@/components/ui/command';
import { useExportActions } from '@/components/app/ExportMenu';
import type { LayoutId, Slide } from '@/lib/deck/types';
import {
  Type, Hash, List, Columns2, Image as ImageIcon, Quote, BarChart3, Workflow,
  Table2, Flag, Sigma, Play, Download, FileText, Globe, StickyNote, EyeOff,
  Copy, Trash2, Undo2, Redo2, Shuffle, Palette, NotebookPen, CornerDownLeft,
  Sparkles, ArrowUp, ArrowDown, LayoutGrid, FileJson, Camera, ImageDown,
} from 'lucide-react';

/** Add-slide menu entries — shared shape with the editor toolbar. */
export const LAYOUT_MENU_ITEMS: Array<{ id: LayoutId; label: string; icon: React.ReactNode }> = [
  { id: 'title', label: 'Title', icon: <Type className="h-4 w-4" /> },
  { id: 'section', label: 'Section break', icon: <Hash className="h-4 w-4" /> },
  { id: 'bullets', label: 'Bullets', icon: <List className="h-4 w-4" /> },
  { id: 'two-column', label: 'Two column', icon: <Columns2 className="h-4 w-4" /> },
  { id: 'stats', label: 'Stats', icon: <Sigma className="h-4 w-4" /> },
  { id: 'chart', label: 'Chart', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'diagram', label: 'Diagram', icon: <Workflow className="h-4 w-4" /> },
  { id: 'comparison', label: 'Comparison', icon: <Table2 className="h-4 w-4" /> },
  { id: 'quote', label: 'Quote', icon: <Quote className="h-4 w-4" /> },
  { id: 'image', label: 'Image', icon: <ImageIcon className="h-4 w-4" /> },
  { id: 'closing', label: 'Closing', icon: <Flag className="h-4 w-4" /> },
];

/**
 * Export identifiers. 'pptxSnapshot' and 'slidePng' bypass the onExport prop:
 * they call useExportActions() directly here (the parent handler maps only
 * the native/print kinds), so both menu and palette share the same path.
 */
export type ExportKind = 'pptx' | 'pdf' | 'html' | 'notes' | 'deckjson' | 'pptxSnapshot' | 'slidePng';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slides: Slide[];
  currentSlideIndex: number;
  onJump: (index: number) => void;
  onInsert: (layout: LayoutId) => void;
  onDuplicate: () => void;
  onToggleHidden: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onPresent: () => void;
  /** dir: -1 moves the current slide one position earlier, +1 later. */
  onMoveSlide: (dir: -1 | 1) => void;
  onComposeSlide: () => void;
  onShuffleTheme: () => void;
  onStyle: () => void;
  onWriteNotes: () => void;
  onToggleBoard: () => void;
  onExport: (kind: ExportKind) => void;
}

/**
 * ⌘K command palette: navigate, insert, slide ops, deck actions and exports.
 * Every action routes through the same handlers as the toolbar buttons.
 */
export function CommandPalette({
  open, onOpenChange, slides, currentSlideIndex,
  onJump, onInsert, onDuplicate, onToggleHidden, onDelete,
  onUndo, onRedo, onPresent, onMoveSlide, onComposeSlide, onShuffleTheme, onStyle, onWriteNotes, onToggleBoard, onExport,
}: CommandPaletteProps) {
  const slideItems = useMemo(
    () => slides.map((s, i) => ({ s, i })),
    [slides],
  );

  // Snapshot exports share the exact hook the Export menu uses.
  const { pptxSnapshot, slidePng } = useExportActions();

  const run = (fn: () => void) => {
    onOpenChange(false);
    // let the dialog unmount before side effects (print dialog etc.)
    setTimeout(fn, 60);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="md:max-w-xl">
      <CommandInput placeholder="Type a command or slide title…" aria-label="Command palette" />
      <CommandList className="max-h-80">
        <CommandEmpty>No matching commands.</CommandEmpty>

        <CommandGroup heading="Jump to slide">
          {slideItems.map(({ s, i }) => (
            <CommandItem
              key={s.id}
              value={`slide ${i + 1} ${s.title ?? ''}`}
              onSelect={() => run(() => onJump(i))}
              className="gap-2"
            >
              <span className="w-6 shrink-0 text-center font-mono text-[11px] text-neutral-400">{i + 1}</span>
              <span className="flex-1 truncate">{s.title || 'Untitled'}</span>
              {s.hidden && <EyeOff className="h-3.5 w-3.5 text-amber-500" aria-label="hidden" />}
              {i === currentSlideIndex && <CornerDownLeft className="h-3.5 w-3.5 text-neutral-400" aria-label="current" />}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Insert slide">
          <CommandItem
            value="add generate compose new slide with ai from topic"
            onSelect={() => run(onComposeSlide)}
            className="gap-2 text-violet-700"
          >
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span>Generate slide with AI from a topic…</span>
          </CommandItem>
          {LAYOUT_MENU_ITEMS.map((l) => (
            <CommandItem key={l.id} value={`add ${l.label} slide ${l.id}`} onSelect={() => run(() => onInsert(l.id))} className="gap-2">
              {l.icon}
              <span>Add {l.label.toLowerCase()} slide</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="This slide">
          <CommandItem value="duplicate slide" onSelect={() => run(onDuplicate)} className="gap-2">
            <Copy className="h-4 w-4" /> Duplicate current slide <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem value="move slide earlier up reorder" disabled={currentSlideIndex === 0} onSelect={() => run(() => onMoveSlide(-1))} className="gap-2">
            <ArrowUp className="h-4 w-4" /> Move slide earlier <CommandShortcut>⌥↑</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="move slide later down reorder"
            disabled={currentSlideIndex >= slides.length - 1}
            onSelect={() => run(() => onMoveSlide(1))}
            className="gap-2"
          >
            <ArrowDown className="h-4 w-4" /> Move slide later <CommandShortcut>⌥↓</CommandShortcut>
          </CommandItem>
          <CommandItem value="hide show slide" onSelect={() => run(onToggleHidden)} className="gap-2">
            <EyeOff className="h-4 w-4" /> Hide / show current slide <CommandShortcut>H</CommandShortcut>
          </CommandItem>
          <CommandItem value="delete slide remove" onSelect={() => run(onDelete)} className="gap-2 text-red-600">
            <Trash2 className="h-4 w-4" /> Delete current slide <CommandShortcut>Del</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Deck">
          <CommandItem value="present fullscreen play" onSelect={() => run(onPresent)} className="gap-2">
            <Play className="h-4 w-4" /> Start presentation
          </CommandItem>
          <CommandItem value="slide board grid overview sorter" onSelect={() => run(onToggleBoard)} className="gap-2">
            <LayoutGrid className="h-4 w-4" /> Toggle slide board <CommandShortcut>G</CommandShortcut>
          </CommandItem>
          <CommandItem value="shuffle theme random design" onSelect={() => run(onShuffleTheme)} className="gap-2">
            <Shuffle className="h-4 w-4" /> Shuffle design system
          </CommandItem>
          <CommandItem value="style branding accent footer page numbers" onSelect={() => run(onStyle)} className="gap-2">
            <Palette className="h-4 w-4" /> Style &amp; branding…
          </CommandItem>
          <CommandItem value="write notes speaker notes ai all slides" onSelect={() => run(onWriteNotes)} className="gap-2">
            <NotebookPen className="h-4 w-4" /> Write speaker notes for empty slides (AI)
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="History & export">
          <CommandItem value="undo" onSelect={() => run(onUndo)} className="gap-2">
            <Undo2 className="h-4 w-4" /> Undo <CommandShortcut>⌘Z</CommandShortcut>
          </CommandItem>
          <CommandItem value="redo" onSelect={() => run(onRedo)} className="gap-2">
            <Redo2 className="h-4 w-4" /> Redo <CommandShortcut>⇧⌘Z</CommandShortcut>
          </CommandItem>
          <CommandItem value="export pptx powerpoint" onSelect={() => run(() => onExport('pptx'))} className="gap-2">
            <Download className="h-4 w-4" /> Export PPTX (editable)
          </CommandItem>
          <CommandItem value="export pdf print" onSelect={() => run(() => onExport('pdf'))} className="gap-2">
            <FileText className="h-4 w-4" /> Export PDF (print dialog)
          </CommandItem>
          <CommandItem value="export html standalone" onSelect={() => run(() => onExport('html'))} className="gap-2">
            <Globe className="h-4 w-4" /> Export standalone HTML
          </CommandItem>
          <CommandItem value="export notes markdown speaker" onSelect={() => run(() => onExport('notes'))} className="gap-2">
            <StickyNote className="h-4 w-4" /> Export speaker notes (Markdown)
          </CommandItem>
          <CommandItem value="export deck file json backup import" onSelect={() => run(() => onExport('deckjson'))} className="gap-2">
            <FileJson className="h-4 w-4" /> Export deck file (.json)
          </CommandItem>
          <CommandItem value="export pptx pixel-perfect snapshot image slides projector fidelity" onSelect={() => run(() => void pptxSnapshot())} className="gap-2">
            <Camera className="h-4 w-4" />
            <span className="flex flex-col">
              <span>Export PPTX — pixel-perfect (images)</span>
              <span className="text-xs text-neutral-400">Full-bleed PNG slides — identical to screen</span>
            </span>
          </CommandItem>
          <CommandItem value="export png current slide image snapshot download" onSelect={() => run(() => void slidePng())} className="gap-2">
            <ImageDown className="h-4 w-4" />
            <span className="flex flex-col">
              <span>Export PNG — current slide</span>
              <span className="text-xs text-neutral-400">Download current slide as PNG</span>
            </span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
