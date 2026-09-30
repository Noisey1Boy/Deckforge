'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getTheme } from '@/lib/design/themes';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { Deck } from '@/lib/deck/types';
import { cn } from '@/lib/utils';
import {
  Clock, Copy, Trash2, Download, Upload, FolderOpen, Loader2, Layers,
} from 'lucide-react';

interface RecentDeck {
  id: string;
  title: string;
  subtitle?: string | null;
  themeId: string;
  slideCount: number;
  updatedAt: string;
}

/** Landing-page deck library: open, duplicate, export JSON, delete, import. */
export function RecentDecks({ onOpen }: { onOpen: (d: RecentDeck) => void }) {
  const [decks, setDecks] = useState<RecentDeck[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RecentDeck | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/decks');
      if (res.ok) {
        const json = await res.json();
        setDecks(json.decks ?? []);
      }
    } catch {
      /* non-fatal */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const duplicate = async (d: RecentDeck) => {
    setBusy(d.id);
    try {
      const res = await fetch(`/api/decks/${d.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Load failed');
      const deck = json.deck as Deck;
      const copy: Deck = { ...deck, id: `deck_${Date.now().toString(36)}`, title: `${deck.title} (copy)` };
      const save = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copy),
      });
      if (!save.ok) throw new Error('Duplicate failed');
      toast.success(`Duplicated “${d.title}”`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Duplicate failed');
    } finally {
      setBusy(null);
    }
  };

  const exportJson = async (d: RecentDeck) => {
    setBusy(d.id);
    try {
      const res = await fetch(`/api/decks/${d.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Load failed');
      const blob = new Blob([JSON.stringify(json.deck, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(d.title || 'deck').replace(/[^\w\d -]+/g, '').slice(0, 50) || 'deck'}.deck.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Deck JSON exported.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (d: RecentDeck) => {
    setConfirmDelete(null);
    setBusy(d.id);
    try {
      const res = await fetch(`/api/decks/${d.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(`Deleted “${d.title}”`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(null);
    }
  };

  const importJson = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy('import');
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Deck;
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.slides)) {
        throw new Error('Not a DeckForge deck file.');
      }
      if (parsed.slides.length > 60) throw new Error('Decks are limited to 60 slides.');
      const deck: Deck = {
        id: `deck_${Date.now().toString(36)}`,
        title: String(parsed.title || 'Imported deck').slice(0, 200),
        subtitle: parsed.subtitle ? String(parsed.subtitle).slice(0, 300) : undefined,
        themeId: String(parsed.themeId || 'corporate-clean'),
        slides: parsed.slides,
        meta: { ...parsed.meta, sourcePrompt: parsed.meta?.sourcePrompt ?? 'imported JSON' },
      };
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deck),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Import failed');
      toast.success(`Imported “${deck.title}”`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import failed — is it a valid .deck.json?');
    } finally {
      setBusy(null);
      if (importRef.current) importRef.current.value = '';
    }
  };

  if (!loaded) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-neutral-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-neutral-200 p-10 text-center">
        <FolderOpen className="h-8 w-8 mx-auto text-neutral-300" />
        <p className="mt-3 text-sm font-medium">No decks yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Generate your first deck above, or import a .deck.json file.
        </p>
        <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => importRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" /> Import deck JSON
        </Button>
        <input ref={importRef} type="file" accept=".json,application/json" hidden onChange={(e) => importJson(e.target.files)} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" /> Your decks
        </h2>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => importRef.current?.click()} disabled={busy === 'import'}>
          {busy === 'import' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Import JSON
        </Button>
        <input ref={importRef} type="file" accept=".json,application/json" hidden onChange={(e) => importJson(e.target.files)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {decks.map((d) => {
          const theme = getTheme(d.themeId);
          return (
            <div
              key={d.id}
              className={cn(
                'group relative rounded-xl border border-neutral-200 bg-card overflow-hidden transition-all hover:border-neutral-900 hover:shadow-lg hover:shadow-neutral-900/5 focus-within:border-neutral-900'
              )}
            >
              {/* theme color band */}
              <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${theme.tokens.colors.primary}, ${theme.tokens.colors.accent})` }} aria-hidden />
              <button
                onClick={() => onOpen(d)}
                className="w-full text-left p-3.5 focus-visible:outline-none"
                aria-label={`Open deck ${d.title}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm leading-snug line-clamp-2">{d.title}</span>
                  <span
                    className="shrink-0 mt-0.5 h-4 w-4 rounded-full border border-black/10"
                    style={{ background: theme.tokens.colors.primary }}
                    title={theme.name}
                    aria-hidden
                  />
                </div>
                <div className="flex items-center gap-2 mt-2.5 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 font-medium">
                    <Layers className="h-3 w-3" /> {d.slideCount} slides
                  </span>
                  <span>{new Date(d.updatedAt).toLocaleDateString()}</span>
                </div>
              </button>
              {/* hover actions */}
              <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
                {busy === d.id ? (
                  <span className="bg-white/90 rounded-md p-1 shadow-sm"><Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-500" /></span>
                ) : (
                  <>
                    <button onClick={() => exportJson(d)} title="Export deck JSON" aria-label={`Export ${d.title} as JSON`} className="bg-white/90 hover:bg-neutral-900 hover:text-white rounded-md p-1.5 shadow-sm border border-neutral-200 transition-colors">
                      <Download className="h-3 w-3" />
                    </button>
                    <button onClick={() => duplicate(d)} title="Duplicate deck" aria-label={`Duplicate ${d.title}`} className="bg-white/90 hover:bg-neutral-900 hover:text-white rounded-md p-1.5 shadow-sm border border-neutral-200 transition-colors">
                      <Copy className="h-3 w-3" />
                    </button>
                    <button onClick={() => setConfirmDelete(d)} title="Delete deck" aria-label={`Delete ${d.title}`} className="bg-white/90 hover:bg-red-600 hover:border-red-600 hover:text-white rounded-md p-1.5 shadow-sm border border-neutral-200 transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{confirmDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the deck and its {confirmDelete?.slideCount} slides. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && remove(confirmDelete)}
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
