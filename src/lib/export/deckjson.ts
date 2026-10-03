import type { Deck } from '@/lib/deck/types';

/**
 * Deck file export: the deck as a portable .deck.json — exactly the shape
 * the landing "Import JSON" flow accepts, so export → import round-trips
 * (theme, slides, meta: accent/footer/transition/notes all included).
 */
export function exportDeckJson(deck: Deck): void {
  const payload = {
    title: deck.title,
    subtitle: deck.subtitle,
    themeId: deck.themeId,
    slides: deck.slides,
    meta: deck.meta,
    exportedFrom: 'DeckForge AI',
    exportedAt: new Date().toISOString(),
  };
  const slug = deck.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'deck';
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}.deck.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
