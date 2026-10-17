import type { Metadata } from 'next';

/** Route-level metadata for /decks — private workspace, noindex. */
export const metadata: Metadata = {
  title: 'My decks',
  description: 'Your saved DeckForge decks: studio decks and HTML template decks, ready to rerun.',
  robots: { index: false, follow: false },
};

export default function DecksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
