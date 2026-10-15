/**
 * remove-strategy-lede — strip the "Strategy: validate on a hosted platform in
 * days — then own the voice layer and the margins." lede paragraph from the
 * DeckForge HTML deck (user asked for its removal), in BOTH the HtmlDeck DB row
 * and the exported single file, so they never diverge. Idempotent: re-running
 * on a clean target is a no-op.
 */
import { db } from '@/lib/db';

const FILE = '/home/z/my-project/exports/voice-agent-pitch/deckforge-pitch.html';
const DECK_ID = 'cmv72s0780001ohu3w3lfe86s';

const LEDE_RE = /<p class="lede fade-up"[^>]*>Strategy: validate on a hosted platform in days — then own the voice layer and the margins\.<\/p>\s*/;

let html = await Bun.file(FILE).text();
const beforeFile = html.length;
html = html.replace(LEDE_RE, '');
if (html.length !== beforeFile) {
  await Bun.write(FILE, html);
  console.log('file: removed', beforeFile - html.length, 'chars');
} else {
  console.log('file: already clean');
}

const deck = await db.htmlDeck.findUnique({ where: { id: DECK_ID }, select: { id: true, html: true } });
if (!deck) {
  console.log('db: deck not found — nothing to patch');
} else {
  const cleaned = deck.html.replace(LEDE_RE, '');
  if (cleaned.length !== deck.html.length) {
    await db.htmlDeck.update({ where: { id: DECK_ID }, data: { html: cleaned } });
    console.log('db: removed', deck.html.length - cleaned.length, 'chars');
  } else {
    console.log('db: already clean');
  }
}
process.exit(0);
