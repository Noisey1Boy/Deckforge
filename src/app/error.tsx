'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Global error boundary — ink poster instead of a stack trace. Reset retries
 * the failed segment; the link escapes to a fresh landing render.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in dev tools only; production users just see the poster.
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-[color:var(--stg-cream)] px-6 py-24 text-center text-[color:var(--stg-ink)]">
      <span className="grid h-14 w-14 place-items-center border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] shadow-[6px_6px_0_0_var(--stg-ink)]">
        <AlertTriangle className="h-7 w-7" aria-hidden />
      </span>
      <div className="space-y-2">
        <h1 className="stg-display text-4xl uppercase leading-none sm:text-5xl">The projector jammed.</h1>
        <p className="mx-auto max-w-[46ch] text-sm leading-relaxed text-[color:var(--stg-ink)]/70">
          Something broke while rendering this screen. Your saved decks are safe — retry, or head back
          to the lobby.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="stg-label inline-flex h-11 items-center gap-2 bg-[color:var(--stg-yellow)] px-5 text-[10px] text-[color:var(--stg-ink)] transition-colors hover:bg-[color:var(--stg-yellow-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)] focus-visible:ring-offset-2"
        >
          <RotateCcw className="h-4 w-4" aria-hidden /> Try again
        </button>
        <Link
          href="/"
          className="stg-label inline-flex h-11 items-center border-2 border-[color:var(--stg-ink)] px-5 text-[10px] transition-colors hover:bg-[color:var(--stg-ink)] hover:text-[color:var(--stg-cream)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stg-ink)] focus-visible:ring-offset-2"
        >
          Back to the lobby
        </Link>
      </div>
      {error.digest ? <p className="stg-label text-[9px] text-[color:var(--stg-ink)]/40">ref {error.digest}</p> : null}
    </main>
  );
}
