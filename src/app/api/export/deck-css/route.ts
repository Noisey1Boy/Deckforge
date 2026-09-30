import { readFileSync } from 'fs';
import path from 'path';

/** Serves the deck stylesheet so the client-side HTML export can inline it. */
export async function GET() {
  try {
    const css = readFileSync(path.join(process.cwd(), 'src', 'components', 'deck', 'deck.css'), 'utf8');
    return new Response(css, {
      headers: { 'Content-Type': 'text/css; charset=utf-8' },
    });
  } catch {
    return new Response('/* deck.css not found */', { status: 500 });
  }
}
