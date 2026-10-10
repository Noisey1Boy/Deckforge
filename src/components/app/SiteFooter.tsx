import Link from 'next/link';
import { Presentation } from 'lucide-react';

/**
 * SiteFooter — the ink colophon (markup carried over from the old HomePage
 * footer) plus route links. Pages render it with `mt-auto` inside a
 * min-h-screen flex column so it sticks to the bottom on short pages and
 * pushes down naturally on long ones.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t-2 border-[color:var(--stg-yellow)] bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)]">
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12">
        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center bg-[color:var(--stg-yellow)] text-[color:var(--stg-ink)]">
                <Presentation className="h-4 w-4" aria-hidden />
              </span>
              <span className="stg-display text-lg uppercase leading-none">DeckForge AI</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
              A presentation foundry that runs on your prompt. Built for people with
              something to say and no time to fight a slide editor.
            </p>
          </div>
          <div className="stg-label space-y-2.5 text-[10px] text-white/55">
            <p>24 systems · 57 templates · 11 layouts · 6 export formats</p>
            <p className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-[color:var(--stg-yellow)]" aria-hidden />
              AI runs server-side · Your data stays yours
            </p>
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1" aria-label="Footer">
              <Link
                href="/create"
                className="stg-link py-1 text-[10px] text-white/55 transition-colors hover:text-[color:var(--stg-cream)]"
              >
                Create
              </Link>
              <Link
                href="/decks"
                className="stg-link py-1 text-[10px] text-white/55 transition-colors hover:text-[color:var(--stg-cream)]"
              >
                My decks
              </Link>
              <Link
                href="/settings"
                className="stg-link py-1 text-[10px] text-white/55 transition-colors hover:text-[color:var(--stg-cream)]"
              >
                Settings
              </Link>
            </nav>
          </div>
        </div>
        <div className="stg-label mt-9 flex flex-col gap-2 border-t border-white/15 pt-4 text-[9px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>Prompt → Outline → Design → Present → Export</span>
          <span>Token-rendered · HTML template studio · JS-library decks</span>
        </div>
      </div>
    </footer>
  );
}
