'use client';

import { useHtmlStore } from '@/lib/store/html-store';
import { cn } from '@/lib/utils';

/**
 * ModeSwitch — landing mode switch for the creation flow.
 * STUDIO (default, structured decks) | TEMPLATE STUDIO — HTML decks.
 * Extracted verbatim from the old HomePage; reads the html-store tab.
 */
export function ModeSwitch() {
  const tab = useHtmlStore((s) => s.tab);
  const setTab = useHtmlStore((s) => s.setTab);

  const tabs = [
    { id: 'studio' as const, label: 'Studio — structured' },
    { id: 'template' as const, label: 'Template studio — HTML decks' },
  ];

  return (
    <div className="border-b-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <span className="stg-label text-[9px] text-[color:var(--stg-ink)]/55">Mode</span>
        <div role="tablist" aria-label="Creation mode" className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                id={`mode-tab-${t.id}`}
                aria-selected={active}
                aria-label={t.label}
                onClick={() => setTab(t.id)}
                className={cn(
                  'stg-label border-2 px-4 py-2 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--stg-cream-2)]',
                  active
                    ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-yellow)] shadow-[4px_4px_0_0_var(--stg-ink)]'
                    : 'border-[color:var(--stg-ink)]/35 bg-transparent text-[color:var(--stg-ink)]/65 hover:border-[color:var(--stg-ink)] hover:text-[color:var(--stg-ink)]',
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
