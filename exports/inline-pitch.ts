/**
 * Standalone capture of the running /pitch page — v2 (file-based, reliable).
 *
 * Strategy: mirror the page + every asset into ./standalone/ with RELATIVE paths
 * (no inline-script escaping pitfalls, runtime chunk fetches resolve correctly):
 *   standalone/index.html        (src/href rewritten /x → x)
 *   standalone/_next/**          (all framework chunks, CSS, fonts)
 *   standalone/audio/**          (call recordings)
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const OUT = '/home/z/my-project/exports/voice-agent-pitch/standalone';
const ORIGIN = 'http://localhost:3000';

async function get(path: string): Promise<Response> {
  const res = await fetch(ORIGIN + path, { redirect: 'follow' });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res;
}

async function saveAsset(urlPath: string, rewrite?: (b: string) => string): Promise<string> {
  // decode percent-encoded names ([turbopack], @swc, ...) so any static server / file:// resolves them
  const rel = decodeURIComponent(urlPath).replace(/^\//, '');
  const dest = join(OUT, rel);
  if (!existsSync(dest)) {
    mkdirSync(dirname(dest), { recursive: true });
    let body = await (await get(urlPath)).text();
    if (rewrite) body = rewrite(body);
    writeFileSync(dest, body);
  }
  return rel;
}

mkdirSync(OUT, { recursive: true });

let html = await (await get('/pitch')).text();

// 1. download every local <script src> and <link rel=stylesheet>
const urls = new Set<string>();
for (const m of html.matchAll(/<script\b[^>]*\bsrc="(\/[^"]+)"[^>]*>/g)) urls.add(m[1]);
for (const m of html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="(\/[^"]+)"[^>]*>/g)) urls.add(m[1]);

for (const u of urls) {
  const isCss = u.endsWith('.css');
  await saveAsset(u, isCss
    ? (css) => css.split('/_next/').join('../') // css at _next/static/css/x.css → media at ../media/
    : (js) => js.split('/_next/').join('_next/').split('"/audio/').join('"audio/').split("'/audio/").join("'audio/"));
}

// 1b. recursive pass: chunks dynamically imported at runtime are referenced
// inside JS bodies (module maps), not in the html — scan saved JS for more.
const CHUNK_RE = /(?:\/_next|_next)\/static\/(?:chunks|media)\/[A-Za-z0-9%._-]+\.(?:js|css|woff2?|svg|png|jpg|webp)/g;
for (let round = 0; round < 4; round++) {
  const discovered = new Set<string>();
  for (const f of Array.from(new Set(Array.from(urls)))) {
    // read back what we saved (decoded path)
    const p = join(OUT, decodeURIComponent(f).replace(/^\//, ''));
    if (!existsSync(p) || !p.endsWith('.js')) continue;
    const body = await Bun.file(p).text();
    for (const m of body.matchAll(CHUNK_RE)) discovered.add(m[0].startsWith('_next/') ? '/' + m[0] : m[0]);
  }
  const fresh = Array.from(discovered).filter((u) => !urls.has(u) && !u.includes('hmr-client'));
  if (fresh.length === 0) break;
  for (const u of fresh) {
    urls.add(u);
    try {
      await saveAsset(u, (js) => js.split('/_next/').join('_next/'));
    } catch { /* optional chunk */ }
  }
}

// point every encoded reference in the html at the decoded file
for (const u of urls) {
  const rel = decodeURIComponent(u).replace(/^\//, '');
  html = html.split(u).join(rel);
}

// 2. rewrite the html itself to relative paths
html = html
  .split('/_next/').join('_next/')
  .split('"/audio/').join('"audio/')
  .split("'/audio/").join("'audio/");

html = html.replace(
  '<head>',
  `<head>\n<!-- DeckForge AI — standalone offline capture of the 4-minute Voice Agent Platform pitch (source route: /pitch). Serve this folder with any static file server (or try double-click; some browsers restrict module/audio fetches on file://). Links to /demo and / only work inside the full app. -->`,
);

writeFileSync(join(OUT, 'index.html'), html);

// audio must live INSIDE standalone/ (referenced relatively from index.html)
mkdirSync(join(OUT, 'audio'), { recursive: true });
for (const f of ['dentist-booking.mp3', 'dentist-full.mp3']) {
  const src = '/home/z/my-project/public/audio/' + f;
  if (existsSync(src)) await Bun.write(join(OUT, 'audio', f), Bun.file(src));
}
console.log('assets:', urls.size, '| html bytes:', html.length);
