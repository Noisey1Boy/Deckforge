import Link from 'next/link';
import { SearchX } from 'lucide-react';

/** 404 — same ink-poster voice as the rest of the site. */
export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-[color:var(--stg-cream)] px-6 py-24 text-center text-[color:var(--stg-ink)]">
      <span className="grid h-14 w-14 place-items-center border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] shadow-[6px_6px_0_0_var(--stg-ink)]">
        <SearchX className="h-7 w-7" aria-hidden />
      </span>
      <div className="space-y-2">
        <h1 className="stg-display text-4xl uppercase leading-none sm:text-5xl">Wrong theater.</h1>
        <p className="mx-auto max-w-[46ch] text-sm leading-relaxed text-[color:var(--stg-ink)]/70">
          That page doesn&apos;t exist — maybe the deck was deleted, or the link was mistyped.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="stg-label inline-flex h-11 items-center bg-[color:var(--stg-yellow)] px-5 text-[10px] text-[color:var(--stg-ink)] transition-colors hover:bg-[color:var(--stg-yellow-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)] focus-visible:ring-offset-2"
        >
          Back to the lobby
        </Link>
        <Link
          href="/decks"
          className="stg-label inline-flex h-11 items-center border-2 border-[color:var(--stg-ink)] px-5 text-[10px] transition-colors hover:bg-[color:var(--stg-ink)] hover:text-[color:var(--stg-cream)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)] focus-visible:ring-offset-2"
        >
          My decks
        </Link>
      </div>
    </main>
  );
}
