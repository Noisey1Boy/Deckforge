import type { Metadata } from 'next';

/** Route-level metadata for /login — auth page, noindex. */
export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to your DeckForge decks, themes and exports.',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
