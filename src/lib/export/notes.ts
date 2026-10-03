/**
 * Speaker-notes export as a Markdown file — one section per visible slide
 * with the slide title, its bullets and the presenter's notes.
 */
import type { Deck } from '@/lib/deck/types';
import { visibleSlides } from '@/lib/deck/types';

function mdEscape(s: string): string {
  return s.replace(/\r\n/g, '\n').trim();
}

export function exportNotesMarkdown(deck: Deck): void {
  const slides = visibleSlides(deck.slides);
  const parts: string[] = [
    `# ${deck.title || 'Presentation'} — speaker notes`,
  ];
  if (deck.subtitle) parts.push('', `_${mdEscape(deck.subtitle)}_`);
  parts.push('', `_${slides.length} slides · exported from DeckForge AI_`, '\n---');

  slides.forEach((s, i) => {
    parts.push('', `## ${String(i + 1).padStart(2, '0')} · ${mdEscape(s.title || s.layout)}`);
    if (s.notes) {
      parts.push('', mdEscape(s.notes));
    } else {
      parts.push('', '_No notes for this slide._');
    }
    const bullets = (s.bullets ?? []).slice(0, 7);
    if (bullets.length) {
      parts.push('', '**On the slide:**', ...bullets.map((b) => `- ${mdEscape(b)}`));
    }
  });

  const md = parts.join('\n') + '\n';
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(deck.title || 'deck').replace(/[^\w\d -]+/g, '').slice(0, 50) || 'deck'}-notes.md`;
  a.click();
  URL.revokeObjectURL(url);
}
