'use client';

/**
 * TemplatePicker — the HTML Template Studio gallery.
 *
 * HARD REQUIREMENT: 57 template preview iframes must NOT all mount at once.
 * Each card's iframe mounts only after an IntersectionObserver reports the
 * card is near the viewport (rootMargin 300px), plus loading="lazy".
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useHtmlStore, type TemplateMeta } from '@/lib/store/html-store';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Check, LayoutTemplate, RefreshCw, Search, Sparkles } from 'lucide-react';

const FRAMEWORK_BADGE: Record<TemplateMeta['framework'], string> = {
  opendesign: 'open-design',
  reveal: 'reveal.js',
  impress: 'impress.js',
  shower: 'shower',
  dzslides: 'dzslides',
};

/** Lazy preview: skeleton shimmer until visible, then a real template iframe. */
function TemplatePreview({ id, name }: { id: string; name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === 'undefined') {
      // No IntersectionObserver: degrade to eager after a tick (never setState
      // synchronously inside the effect body).
      const id = window.setTimeout(() => setVisible(true), 0);
      return () => window.clearTimeout(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className="relative aspect-video w-full overflow-hidden bg-[color:var(--stg-cream-2)]">
      {visible && (
        <iframe
          src={`/templates/${id}/template.html`}
          title={`${name} template preview`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          tabIndex={-1}
          aria-hidden="true"
          style={{ pointerEvents: 'none' }}
          className={cn(
            'absolute inset-0 h-full w-full border-0 transition-opacity duration-300 motion-reduce:transition-none',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
      {!loaded && (
        <div className="absolute inset-0 grid place-items-center" aria-hidden>
          <div className="absolute inset-0 animate-pulse bg-[color:var(--stg-cream-2)]" />
          <LayoutTemplate className="relative h-6 w-6 text-[color:var(--stg-ink)]/25" />
        </div>
      )}
    </div>
  );
}

function PaletteDots({ palette }: { palette: string[] }) {
  return (
    <div className="flex items-center" aria-hidden>
      {palette.slice(0, 5).map((c, i) => (
        <span
          key={`${c}-${i}`}
          className="h-3.5 w-3.5 rounded-full border border-[color:var(--stg-ink)]/25"
          style={{ background: c, marginLeft: i === 0 ? 0 : -5 }}
        />
      ))}
    </div>
  );
}

export function TemplatePicker() {
  const templates = useHtmlStore((s) => s.templates);
  const templatesLoading = useHtmlStore((s) => s.templatesLoading);
  const templatesError = useHtmlStore((s) => s.templatesError);
  const loadTemplates = useHtmlStore((s) => s.loadTemplates);
  const selectedId = useHtmlStore((s) =>
    s.modeKind === 'template' ? s.selectedTemplate?.id ?? null : null,
  );
  const activeScratch = useHtmlStore((s) => s.modeKind === 'scratch');
  const scratchEngine = useHtmlStore((s) => s.scratchEngine);
  const selectTemplate = useHtmlStore((s) => s.selectTemplate);
  const startScratch = useHtmlStore((s) => s.startScratch);
  const closePicker = useHtmlStore((s) => s.closePicker);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of templates) counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
    return ['All', ...Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([c]) => c)];
  }, [templates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (category !== 'All' && t.category !== category) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.tagline.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.bestFor.some((b) => b.toLowerCase().includes(q)) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [templates, query, category]);

  return (
    <div className="space-y-4">
      {/* Toolbar: back, search, count */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={closePicker}
          className="stg-label h-9 gap-1.5 rounded-none border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] text-[10px] text-[color:var(--stg-ink)] hover:bg-[color:var(--stg-ink)] hover:text-[color:var(--stg-yellow)]"
        >
          ← Back to brief
        </Button>
        <div className="relative min-w-52 flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--stg-ink)]/50"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, tagline, category, best-for, tags…"
            aria-label="Search templates"
            className="h-9 w-full border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream)] pl-8 pr-3 text-sm text-[color:var(--stg-ink)] outline-none transition-colors placeholder:text-[color:var(--stg-ink)]/50 focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)]/30"
          />
        </div>
        <p className="stg-label shrink-0 text-[10px] text-[color:var(--stg-ink)]/60" aria-live="polite">
          {templatesLoading
            ? 'Loading…'
            : templatesError
              ? 'Shelf unavailable'
              : `${filtered.length} of ${templates.length} templates`}
        </p>
      </div>

      {/* Category chips */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn(
                'stg-label border px-3 py-1.5 text-[9px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)]',
                category === c
                  ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-yellow)]'
                  : 'border-[color:var(--stg-ink)]/40 bg-transparent text-[color:var(--stg-ink)]/70 hover:border-[color:var(--stg-ink)] hover:text-[color:var(--stg-ink)]',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Scrollable card grid */}
      <div
        className="max-h-[68vh] overflow-y-auto pr-1.5
        [&::-webkit-scrollbar]:w-2
        [&::-webkit-scrollbar-track]:bg-[color:var(--stg-cream-2)]
        [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[color:var(--stg-ink)]/25
        [&::-webkit-scrollbar-thumb:hover]:bg-[color:var(--stg-ink)]/50"
      >
        {templatesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border-2 border-[color:var(--stg-ink)]/20 bg-[color:var(--stg-cream)]">
                <Skeleton className="aspect-video w-full rounded-none bg-[color:var(--stg-ink)]/10" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-4 w-2/3 rounded-none bg-[color:var(--stg-ink)]/10" />
                  <Skeleton className="h-3 w-full rounded-none bg-[color:var(--stg-ink)]/10" />
                  <Skeleton className="h-3 w-1/2 rounded-none bg-[color:var(--stg-ink)]/10" />
                </div>
              </div>
            ))}
          </div>
        ) : templatesError ? (
          <div className="border-2 border-dashed border-[color:var(--stg-ink)]/30 p-10 text-center">
            <p className="stg-display text-2xl uppercase">The shelf is stuck.</p>
            <p className="mt-2 text-sm text-[color:var(--stg-ink)]/65">{templatesError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-none border-2 border-[color:var(--stg-ink)]"
              onClick={() => loadTemplates()}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border-2 border-dashed border-[color:var(--stg-ink)]/30 p-10 text-center">
            <p className="stg-display text-2xl uppercase">Nothing on this shelf.</p>
            <p className="mt-2 text-sm text-[color:var(--stg-ink)]/65">
              No templates match “{query.trim()}”{category !== 'All' ? ` in ${category}` : ''}. Try
              another word or category.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-none border-2 border-[color:var(--stg-ink)]"
              onClick={() => {
                setQuery('');
                setCategory('All');
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Reset filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* FROM SCRATCH — always the first card, visually distinct */}
            <article
              className={cn(
                'flex flex-col justify-between gap-3 border-2 border-dashed p-4 transition-colors',
                activeScratch
                  ? 'border-[color:var(--stg-yellow)] bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)] ring-2 ring-[color:var(--stg-yellow)]'
                  : 'border-[color:var(--stg-ink)]/50 bg-[color:var(--stg-cream)] hover:border-[color:var(--stg-ink)]',
              )}
            >
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-current opacity-70" aria-hidden />
                  <h3 className="stg-display text-xl uppercase leading-none">From scratch</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed opacity-75">
                  No template — the AI builds a standalone deck on a JavaScript presentation engine.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Choose scratch engine">
                {(
                  [
                    { id: 'reveal' as const, label: 'reveal.js', hint: 'Keyboard nav · fragments' },
                    { id: 'plain' as const, label: 'Plain HTML', hint: 'One scrolling file' },
                  ]
                ).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => startScratch(e.id)}
                    aria-label={`Build from scratch on ${e.label}`}
                    className={cn(
                      'border-2 px-2 py-2 text-left font-mono text-[11px] font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)]',
                      activeScratch && scratchEngine === e.id
                        ? 'border-[color:var(--stg-yellow)] bg-[color:var(--stg-yellow)] text-[color:var(--stg-ink)]'
                        : activeScratch
                          ? 'border-white/30 text-white/85 hover:border-[color:var(--stg-yellow)]'
                          : 'border-[color:var(--stg-ink)]/40 text-[color:var(--stg-ink)] hover:border-[color:var(--stg-ink)] hover:bg-[color:var(--stg-ink)] hover:text-[color:var(--stg-yellow)]',
                    )}
                  >
                    {e.label}
                    <span className="mt-0.5 block font-sans text-[10px] font-normal leading-tight opacity-70">
                      {e.hint}
                    </span>
                  </button>
                ))}
              </div>
            </article>

            {filtered.map((t) => {
              const selected = selectedId === t.id;
              return (
                <article
                  key={t.id}
                  onClick={() => selectTemplate(t)}
                  className={cn(
                    'group flex cursor-pointer flex-col border-2 bg-[color:var(--stg-cream)] transition-shadow focus-within:shadow-[6px_6px_0_0_var(--stg-ink)]',
                    selected
                      ? 'border-[color:var(--stg-ink)] shadow-[6px_6px_0_0_var(--stg-ink)] ring-2 ring-[color:var(--stg-yellow)]'
                      : 'border-[color:var(--stg-ink)]/25 hover:border-[color:var(--stg-ink)] hover:shadow-[6px_6px_0_0_var(--stg-ink)]',
                  )}
                >
                  <TemplatePreview id={t.id} name={t.name} />
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold leading-snug text-[color:var(--stg-ink)]">
                        {t.name}
                      </h3>
                      <span className="shrink-0 border border-[color:var(--stg-ink)]/30 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[color:var(--stg-ink)]/70">
                        {FRAMEWORK_BADGE[t.framework]}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-[color:var(--stg-ink)]/65">
                      {t.tagline}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                      <div className="flex min-w-0 flex-col gap-1">
                        <PaletteDots palette={t.palette} />
                        <span className="stg-label truncate text-[8px] text-[color:var(--stg-ink)]/50">
                          {t.category}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectTemplate(t);
                        }}
                        aria-label={`Use template ${t.name}`}
                        className={cn(
                          'stg-label h-8 shrink-0 gap-1 rounded-none border-2 border-[color:var(--stg-ink)] px-3 text-[9px]',
                          selected
                            ? 'bg-[color:var(--stg-ink)] text-[color:var(--stg-yellow)]'
                            : 'bg-[color:var(--stg-yellow)] text-[color:var(--stg-ink)] hover:bg-[color:var(--stg-ink)] hover:text-[color:var(--stg-yellow)]',
                        )}
                      >
                        {selected ? <Check className="h-3 w-3" aria-hidden /> : null}
                        {selected ? 'Picked' : 'Use template'}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
