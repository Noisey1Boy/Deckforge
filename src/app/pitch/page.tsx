import type { Metadata } from 'next';
import { PitchDeck } from '@/components/pitch/PitchDeck';

export const metadata: Metadata = {
  title: 'AI Powered Voice Agent — Pitch | DeckForge AI',
  description:
    'Interactive idea pitch: a voice-agent platform for businesses — live recorded human×robot conversation, how it works, use cases, open-source stack and build timeline.',
};

export default function PitchPage() {
  return <PitchDeck />;
}
