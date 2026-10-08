'use client';

/**
 * HtmlDeckList — the "TEMPLATE DECKS" library section (mounted below the
 * RecentDecks grid on the landing archive). Lists decks from
 * GET /api/htmldecks with open / download / delete actions.
 */

import { useCallback, useEffect, useState } from 'react';
import { useHtmlStore, FRAMEWORK_LABEL, type HtmlEngine, type TemplateMeta } from '@/lib/store/html-store';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { downloadBlob, slugify } from '@/lib/export/html-snapshot';
import {
  Clock,
  Download,
  ExternalLink,
  FolderOpen,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface HtmlDeckSummary {
  id: string;
  title: string;
  subtitle?: string | null;
  templateId?: string;
  engine?: HtmlEngine;
  createdAt?: string;
  updatedAt?: string;
}

/** Compact relative time (mirrors RecentDecks' helper). */
function timeAgo(iso?: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function PaletteDots({ palette }: { palette: string[] }) {
  return (
    <div className="flex items-center" aria-hidden>
      {palette.slice(0, 5).map((c, i) => (
        <span
          key={`${c}-${i}`}
          className="h-3 w-3 rounded-full border border-[color:var(--stg-ink)]/25"
          style={{ background: c, marginLeft: i === 0 ? 0 : -4 }}
        />
      ))}
    </div>
  );
}

export function HtmlDeckList() {
  const [decks, setDecks] = useState<HtmlDeckSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<HtmlDeckSummary | null>(null);
  const [templateMap, setTemplateMap] = useState<Record<string, TemplateMeta>>({});

  const setTab = useHtmlStore((s) => s.setTab);
  const setResult = useHtmlStore((s) => s.setResult);
  const loadTemplates = useHtmlStore((s) => s.loadTemplates);
  const storeTemplates = useHtmlStore((s) => s.templates);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/htmldecks');
      if (res.ok) {
        const json = (await res.json()) as { decks?: HtmlDeckSummary[] };
        setDecks(json.decks ?? []);
      }
    } catch {
      /* non-fatal — route may not exist yet */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener('htmldecks:changed', onChange);
    return () => window.removeEventListener('htmldecks:changed', onChange);
  }, [load]);

  /* Palette dots need template metadata — reuse the store's cached shelf,
     fetched lazily only when at least one deck references a template. */
  useEffect(() => {
    if (!loaded || !decks.some((d) => d.templateId)) return;
    if (storeTemplates.length === 0) {
      void loadTemplates();
      return;
    }
    const map: Record<string, TemplateMeta> = {};
    for (const t of storeTemplates) map[t.id] = t;
    setTemplateMap(map);
  }, [loaded, decks, storeTemplates, loadTemplates]);

  const open = (d: HtmlDeckSummary) => {
    setTab('template');
    setResult({ deckId: d.id, title: d.title });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openRaw = (d: HtmlDeckSummary) => {
    window.open(`/api/htmldecks/${d.id}/raw`, '_blank', 'noopener');
  };

  const downloadHtml = async (d: HtmlDeckSummary) => {
    setBusy(d.id);
    try {
      const res = await fetch(`/api/htmldecks/${d.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Load failed');
      const html = (json.deck ?? json).html as string;
      downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `${slugify(d.title)}.html`);
      toast.success('Deck .html saved.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (d: HtmlDeckSummary) => {
    setConfirmDelete(null);
    setBusy(d.id);
    try {
      const res = await fetch(`/api/htmldecks/${d.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(`Deleted “${d.title}”`);
      window.dispatchEvent(new Event('htmldecks:changed'));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-12 border-t-2 border-[color:var(--stg-ink)]/15 pt-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="stg-label flex items-center gap-2.5 text-[color:var(--stg-ink)]/60">
            <span className="inline-block h-2 w-2 bg-[color:var(--stg-yellow)]" aria-hidden />
            Template decks
          </p>
          <h3 className="stg-display mt-2 text-2xl uppercase leading-none">
            HTML decks from the template studio.
          </h3>
        </div>
        <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/60">
          {loaded ? `${decks.length} saved` : 'Loading…'}
        </p>
      </div>

      {!loaded ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-[color:var(--stg-ink)]/10" />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[color:var(--stg-ink)]/30 p-10 text-center">
          <FolderOpen className="mx-auto h-8 w-8 text-[color:var(--stg-ink)]/30" aria-hidden />
          <p className="mt-3 text-sm font-semibold">No template decks yet</p>
          <p className="mt-1 text-xs text-[color:var(--stg-ink)]/60">
            Fill one of the HTML templates with AI — or build from scratch — in Template Studio.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="stg-label mt-4 h-9 gap-1.5 rounded-none border-2 border-[color:var(--stg-ink)] text-[10px]"
            onClick={() => {
              setTab('template');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Open Template Studio
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {decks.map((d) => {
            const tpl = d.templateId ? templateMap[d.templateId] : undefined;
            const engineLabel = d.engine ? FRAMEWORK_LABEL[d.engine] ?? d.engine : 'html deck';
            return (
              <div
                key={d.id}
                className={cn(
                  'group relative overflow-hidden rounded-xl border border-[color:var(--stg-ink)]/25 bg-[color:var(--stg-cream)] transition-all',
                  'hover:border-[color:var(--stg-ink)] hover:shadow-lg hover:shadow-[color:var(--stg-ink)]/10 focus-within:border-[color:var(--stg-ink)]',
                )}
              >
                {tpl && <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${tpl.palette.slice(0, 3).join(', ')})` }} aria-hidden />}
                <button
                  onClick={() => open(d)}
                  className="w-full p-3.5 text-left focus-visible:outline-none"
                  aria-label={`Open deck ${d.title}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-sm font-semibold leading-snug text-[color:var(--stg-ink)]">
                      {d.title}
                    </span>
                    <span className="mt-0.5 shrink-0 border border-[color:var(--stg-ink)]/30 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[color:var(--stg-ink)]/70">
                      {engineLabel}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    {tpl ? <PaletteDots palette={tpl.palette} /> : null}
                    {d.updatedAt && (
                      <span
                        className="flex items-center gap-1 text-[11px] text-[color:var(--stg-ink)]/55"
                        title={`Updated ${new Date(d.updatedAt).toLocaleString()}`}
                        suppressHydrationWarning
                      >
                        <Clock className="h-3 w-3" aria-hidden /> {timeAgo(d.updatedAt)}
                      </span>
                    )}
                  </div>
                </button>
                <div className="absolute right-2 top-2 hidden items-center gap-1 group-hover:flex">
                  {busy === d.id ? (
                    <span className="rounded-md bg-white/90 p-1 shadow-sm">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[color:var(--stg-ink)]/60" />
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => downloadHtml(d)}
                        title="Download .html"
                        aria-label={`Download ${d.title} as HTML`}
                        className="rounded-md border border-[color:var(--stg-ink)]/20 bg-white/90 p-1.5 shadow-sm transition-colors hover:bg-[color:var(--stg-ink)] hover:text-white"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => openRaw(d)}
                        title="Open raw deck in new tab"
                        aria-label={`Open ${d.title} in a new tab`}
                        className="rounded-md border border-[color:var(--stg-ink)]/20 bg-white/90 p-1.5 shadow-sm transition-colors hover:bg-[color:var(--stg-ink)] hover:text-white"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(d)}
                        title="Delete deck"
                        aria-label={`Delete ${d.title}`}
                        className="rounded-md border border-[color:var(--stg-ink)]/20 bg-white/90 p-1.5 shadow-sm transition-colors hover:border-red-600 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{confirmDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the HTML deck. This action cannot be undone.
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
