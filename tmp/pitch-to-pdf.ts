/**
 * pitch-to-pdf — capture every slide of the /pitch presentation (React deck)
 * with Playwright at 1280×720 @2x, then compose a 16:9 PDF (960×540pt pages,
 * full-bleed) at exports/voice-agent-pitch/voice-agent-pitch.pdf.
 * Also: sanity-shots of / and /demo and a mechanical player check on the
 * "live" slide (UI play → seek to 20s → verify playback + tool-trace panel).
 */
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:3000';
const OUT_DIR = '/home/z/my-project/tmp/pitch-pdf';
const PDF_OUT = '/home/z/my-project/exports/voice-agent-pitch/voice-agent-pitch.pdf';
const SLIDES = ['title', 'problem', 'solution', 'hats', 'chapter', 'live', 'demo', 'how', 'stack', 'time', 'business', 'close'];

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--font-render-hinting=none'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const consoleLines: string[] = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consoleLines.push(`[console.${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => consoleLines.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => consoleLines.push(`[requestfailed] ${r.url()} :: ${r.failure()?.errorText}`));

const shot = (name: string) => page.screenshot({ path: `${OUT_DIR}/${name}.png` });
async function settle(ms = 2400) { await page.waitForTimeout(ms); }

// Remove Next.js dev-indicator DOM (the "Compiling…" toast lives in
// <nextjs-portal>) so it can never burn into a screenshot.
const stripDevChrome = async () => {
  await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach((n) => n.remove()));
};

// ---------- 1) open /pitch ----------
const resp = await page.goto(`${BASE}/pitch`, { waitUntil: 'networkidle', timeout: 60000 });
console.log('GET /pitch ->', resp?.status());
if (!resp || resp.status() >= 400) consoleLines.push(`[fatal] /pitch status ${resp?.status()}`);
await page.evaluate(() => document.fonts.ready);
await settle(2800);

const shots: string[] = [];
for (let i = 0; i < SLIDES.length; i++) {
  const id = SLIDES[i];
  if (i > 0) await page.click('button[aria-label="Next slide"]', { timeout: 8000 });
  await page.waitForSelector(`[data-testid="pitch-slide-${id}"]`, { timeout: 10000 });
  // lazy-loaded slides ('live'/'demo') compile on first visit in dev — wait
  // long enough for the dev "Compiling" badge to appear and disappear.
  await settle(id === 'live' || id === 'demo' ? 5000 : 2400);
  const file = `slide-${String(i + 1).padStart(2, '0')}-${id}`;
  await stripDevChrome();
  await shot(file);
  shots.push(`${OUT_DIR}/${file}.png`);
  console.log(`captured ${file}`);

  // ---------- 2) player check on the "live" slide (index 5) ----------
  if (id === 'live') {
    const viaUi = await (async () => {
      try {
        await page.click('button[aria-label="Play the call"]', { timeout: 4000 });
        await page.waitForTimeout(700);
        return await page.evaluate(async () => {
          const a = document.querySelector('audio');
          if (!a) return { found: false };
          a.currentTime = 20; // user asked: start the recording at 20 secs
          await new Promise((r) => setTimeout(r, 1800));
          return {
            found: true,
            src: (a.currentSrc || a.src).split('/').pop(),
            paused: a.paused,
            currentTime: Math.round(a.currentTime * 10) / 10,
            duration: Math.round(a.duration || 0),
            readyState: a.readyState,
          };
        });
      } catch (e) {
        return { clickError: String(e) };
      }
    })();
    console.log('PLAYER@20s:', JSON.stringify(viaUi));
    let trace = '';
    try { trace = await page.locator('[aria-label="Agent tool calls"]').innerText({ timeout: 4000 }); } catch { trace = '(tool trace panel not found)'; }
    console.log('TOOL TRACE @20s:', JSON.stringify(trace.slice(0, 300)));
    const voiceLoop = await page.locator('[data-testid="voice-loop"]').count();
    console.log('voice-loop on how-slide captured later; present flag stored:', voiceLoop);
    await shot('player-at-20s');
  }
}

// ---------- 3) sanity shots of / and /demo ----------
for (const route of ['/', '/demo']) {
  const r = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 60000 });
  await settle(2200);
  await shot(`route-${route === '/' ? 'home' : 'demo'}`);
  console.log(`GET ${route} -> ${r?.status()} (screenshot saved)`);
}

await browser.close();

// ---------- 4) compose the PDF ----------
const pdf = await PDFDocument.create();
pdf.setTitle('AI Powered Voice Agent — 4-Minute Idea Pitch');
pdf.setProducer('DeckForge');
for (const f of shots) {
  const png = await pdf.embedPng(await Bun.file(f).arrayBuffer());
  const p = pdf.addPage([960, 540]); // 13.33" × 7.5" @72pt — standard 16:9 slide
  p.drawImage(png, { x: 0, y: 0, width: 960, height: 540 });
}
await Bun.write(PDF_OUT, await pdf.save());
console.log('PDF written:', PDF_OUT, Math.round((await Bun.file(PDF_OUT).size) / 1024), 'KB,', pdf.getPageCount(), 'pages');

await Bun.write(`${OUT_DIR}/console.log`, consoleLines.length ? consoleLines.join('\n') : '(no console errors/warnings)');
console.log('console lines:', consoleLines.length);
consoleLines.slice(0, 12).forEach((l) => console.log('  ', l.slice(0, 200)));
process.exit(0);
