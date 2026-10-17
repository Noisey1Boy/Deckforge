import type { Metadata } from 'next';
import { PitchDeck } from '@/components/pitch/PitchDeck';

export const metadata: Metadata = {
  title: 'AI Powered Voice Agent — showcase pitch',
  description:
    'A showcase deck built with DeckForge AI: an interactive 12-slide pitch for a voice-agent platform — live recorded human×robot conversation, agent tool trace, open-source stack and build timeline.',
  openGraph: {
    title: 'AI Powered Voice Agent — a DeckForge showcase deck',
    description:
      'Interactive 12-slide pitch with a live recorded call, agent tool trace and build plan — forged with DeckForge AI.',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Powered Voice Agent — a DeckForge showcase deck',
    description: 'Interactive 12-slide pitch forged with DeckForge AI.',
    images: ['/og-image.png'],
  },
};

export default function PitchPage() {
  return <PitchDeck />;
}
