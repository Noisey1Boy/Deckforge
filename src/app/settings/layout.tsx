import type { Metadata } from 'next';

/** Route-level metadata for /settings — private, noindex. */
export const metadata: Metadata = {
  title: 'Settings',
  description: 'Account, security and stage preferences for DeckForge AI.',
  robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
