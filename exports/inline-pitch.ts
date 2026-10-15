/**
 * Standalone capture of the running /pitch page — v4 (binary-safe + avatars + zip).
 *
 * Strategy: mirror the page + every asset into ./standalone/ with RELATIVE paths
 * (no inline-script escaping pitfalls, runtime chunk fetches resolve correctly):
 *   standalone/index.html        (src/href rewritten /x → x)
 *   standalone/_next/**          (all framework chunks, CSS, fonts)
 *   standalone/audio/**          (call recordings)
 *   standalone/avatars/**        (Robert + Layla photos)
 * Then refresh exports/voice-agent-pitch/pitch.zip with index.html at the ZIP
 * ROOT — unzip anywhere and serve the folder; no nesting step needed.
 *
 * v4 hardening (restores PZ-1 parity): saveAsset writes arrayBuffers (fonts and
 * images are never mojibake'd through .text()), strips ?query from decoded
 * filenames, copies avatars/ and rewrites /avatars/ refs to relative, header
 * comment notes the root-serve layout.
 */
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';

const OUT = '/home/z/my-project/exports/voice-agent-pitch/standalone';
const ZIP = '/home/z/my-project/exports/voice-agent-pitch/pitch.zip';
const ORIGIN = 'http://localhost:3000';

async function get(path: string): Promise<Response> {
  const res = await fetch(ORIGIN + path, { redirect: 'follow' });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res;
}

async function saveAsset(urlPath: string, rewrite?: (b: string) => string): Promise<string> {
  // decode percent-encoded names ([turbopack], @swc, ...) + strip ?query so any
  // static server / file:// resolves them
  const rel = decodeURIComponent(urlPath).split('?')[0].replace(/^\//, '');
  const dest = join(OUT, rel);
  if (!existsSync(dest)) {
    mkdirSync(dirname(dest), { recursive: true });
    const buf = Buffer.from(await (await get(urlPath)).arrayBuffer());
    if (rewrite) writeFileSync(dest, rewrite(buf.toString('utf8')));
    else writeFileSync(dest, buf);
  }
  return rel;
}

const decodePath = (u: string) => decodeURIComponent(u).split('?')[0].replace(/^\//, '');

mkdirSync(OUT, { recursive: true });

let html = await (await get('/pitch')).text();

// 1. download every local <script src> and <link rel=stylesheet>
const urls = new Set<string>();
for (const m of html.matchAll(/<script\b[^>]*\bsrc="(\/[^"]+)"[^>]*>/g)) urls.add(m[1]);
for (const m of html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="(\/[^"]+)"[^>]*>/g)) urls.add(m[1]);

for (const u of urls) {
  const isCss = u.split('?')[0].endsWith('.css');
  await saveAsset(u, isCss
    ? (css) => css.split('/_next/').join('../') // css at _next/static/css/x.css → media at ../media/
    : (js) => js.split('/_next/').join('_next/').split('"/audio/').join('"audio/').split("'/audio/").join("'audio/").split('"/avatars/').join('"avatars/').split("'/avatars/").join("'avatars/"));
}

// 1b. recursive pass: chunks dynamically imported at runtime are referenced
// inside JS bodies (module maps), not in the html — scan saved JS for more.
const CHUNK_RE = /(?:\/_next|_next)\/static\/(?:chunks|media)\/[A-Za-z0-9%._-]+\.(?:js|css|woff2?|svg|png|jpg|webp)/g;
for (let round = 0; round < 4; round++) {
  const discovered = new Set<string>();
  for (const f of Array.from(urls)) {
    const p = join(OUT, decodePath(f));
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
  html = html.split(u).join(decodePath(u));
}

// 2. rewrite the html itself to relative paths (framework, audio, avatars)
html = html
  .split('/_next/').join('_next/')
  .split('"/audio/').join('"audio/')
  .split("'/audio/").join("'audio/")
  .split('"/avatars/').join('"avatars/')
  .split("'/avatars/").join("'avatars/");

html = html.replace(
  '<head>',
  `<head>\n<!-- DeckForge AI — standalone offline capture of the "AI Powered Voice Agent" pitch (source route: /pitch). index.html sits at this folder's ROOT: unzip pitch.zip and serve the folder with any static file server (some browsers restrict module/audio fetches on file://). Links to /demo and / only work inside the full app. -->`,
);

writeFileSync(join(OUT, 'index.html'), html);

// 3. audio + avatars must live INSIDE standalone/ (referenced relatively)
mkdirSync(join(OUT, 'audio'), { recursive: true });
for (const f of ['dentist-booking.mp3', 'dentist-full.mp3']) {
  const src = '/home/z/my-project/public/audio/' + f;
  if (existsSync(src)) await Bun.write(join(OUT, 'audio', f), Bun.file(src));
}
mkdirSync(join(OUT, 'avatars'), { recursive: true });
for (const f of ['human-robert.jpg', 'ai-layla.jpg']) {
  const src = '/home/z/my-project/public/avatars/' + f;
  if (existsSync(src)) await Bun.write(join(OUT, 'avatars', f), Bun.file(src));
}
console.log('assets:', urls.size, '| html bytes:', html.length);

// 4. refresh pitch.zip — index.html at the ZIP ROOT (unzip → ready-to-serve folder)
try {
  rmSync(ZIP, { force: true });
  const proc = Bun.spawnSync(['zip', '-rq', ZIP, '.'], { cwd: OUT });
  if (proc.exitCode !== 0) throw new Error(new TextDecoder().decode(proc.stderr));
  const list = Bun.spawnSync(['unzip', '-l', ZIP]);
  const out = new TextDecoder().decode(list.stdout);
  const entries = (out.match(/-\s+\d{4}-\d{2}-\d{2}/g) ?? []).length;
  console.log('pitch.zip refreshed, entries:', entries);
} catch (e) {
  console.log('zip step skipped:', (e as Error).message);
}
