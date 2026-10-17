import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/app/SiteHeader';
import { SiteFooter } from '@/components/app/SiteFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What DeckForge AI stores, what leaves your browser, and what never happens to your data.',
};

const SECTIONS = [
  {
    n: '01',
    h: 'The short version',
    p: [
      'Your decks and account details live in the DeckForge server database. Your uploaded files are parsed in your browser and never stored. Nothing is sold, nothing is used to train AI models.',
    ],
  },
  {
    n: '02',
    h: 'What we store (server-side)',
    p: [
      'Account: your name, email and a scrypt-hashed password (never the password itself).',
      'Decks: the outlines, slide content and design choices you save, tied to your account so you can reopen them. You can delete a single deck or every deck from the app at any time.',
      'Sessions: an httpOnly session cookie (df_session) that keeps you logged in for 30 days. It contains a random token, not personal data.',
    ],
  },
  {
    n: '03',
    h: 'What leaves your browser (and what doesn’t)',
    p: [
      'When you generate a deck, your brief and the outline travel to the AI provider to draft copy and plan slides.',
      'Spreadsheets and JSON are parsed locally in your browser; only a small structural summary (column names, sample rows) is sent so the AI can plan charts. The full file stays with you.',
      'Chart screenshots are sent to a vision model to read the values off the image — the image itself is not stored.',
      'Mermaid diagrams and markdown are converted to outlines locally; structure you wrote is not rewritten.',
      'Uploaded files are never persisted, never shared, and never used to train models.',
    ],
  },
  {
    n: '04',
    h: 'What stays in your browser',
    p: [
      'Preferences such as your default design system and reduce-motion setting live in localStorage on this device only. Clearing site data removes them.',
    ],
  },
  {
    n: '05',
    h: 'Guest decks',
    p: [
      'Decks saved while browsing as a guest go to a temporary shared server space. Sign in before building anything you care about, so your decks are kept under your account.',
    ],
  },
  {
    n: '06',
    h: 'Your controls & contact',
    p: [
      'Export everything (PPTX, PDF, HTML, .deck.json), delete any deck, or wipe every deck from Settings — deletion is immediate and permanent.',
      'Questions or data requests: support@deckforge.app. See also the Terms of Service.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--stg-cream)]">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
          <p className="stg-label flex items-center gap-2.5 text-[color:var(--stg-ink)]/60">
            <span className="inline-block h-2 w-2 bg-[color:var(--stg-yellow)]" aria-hidden />
            Legal
          </p>
          <h1 className="stg-display mt-3 text-4xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-5xl">
            Privacy Policy.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--stg-ink)]/60">
            What’s stored, what travels, what never happens. Beta edition, updated February 2026.
          </p>

          <div className="mt-10 space-y-8">
            {SECTIONS.map((s) => (
              <section key={s.n} aria-labelledby={`privacy-${s.n}`} className="border-t-2 border-[color:var(--stg-ink)] pt-6">
                <h2
                  id={`privacy-${s.n}`}
                  className="stg-display flex items-baseline gap-3 text-xl uppercase text-[color:var(--stg-ink)] sm:text-2xl"
                >
                  <span className="stg-num text-2xl text-[color:var(--stg-ink)]/30" aria-hidden>
                    {s.n}
                  </span>
                  {s.h}
                </h2>
                <div className="mt-3 space-y-2.5">
                  {s.p.map((para, i) => (
                    <p key={i} className="max-w-[70ch] text-sm leading-relaxed text-[color:var(--stg-ink)]/75">
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-10 border-t-2 border-dashed border-[color:var(--stg-ink)]/20 pt-5 text-sm text-[color:var(--stg-ink)]/65">
            The service side of the story is in the{' '}
            <Link
              href="/terms"
              className="stg-label underline decoration-[color:var(--stg-yellow)] decoration-2 underline-offset-4 hover:bg-[color:var(--stg-yellow)]"
            >
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
