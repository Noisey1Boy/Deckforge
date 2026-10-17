import type { Metadata } from 'next';

/** Route-level metadata for /signup — auth page, noindex. */
export const metadata: Metadata = {
  title: 'Sign up',
  description: 'Create a free DeckForge account — your decks, themes and preferences in one place.',
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
