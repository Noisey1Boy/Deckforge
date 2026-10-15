/**
 * pitch-to-pptx — capture every slide of the /pitch presentation (React deck)
 * with Playwright at 1280×720 @2x, then compose a real PowerPoint file
 * (16:9, 13.333"×7.5", full-bleed slide images + speaker notes) at
 * exports/voice-agent-pitch/voice-agent-pitch.pptx.
 *
 * Notes carry each slide's stage label + time budget (from PitchDeck.tsx),
 * so the deck doubles as a teleprompter for the 4-minute pitch.
 */
import { chromium } from 'playwright';
import pptxgen from 'pptxgenjs';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:3000';
const OUT_DIR = '/home/z/my-project/tmp/pitch-pptx';
const PPTX_OUT = '/home/z/my-project/exports/voice-agent-pitch/voice-agent-pitch.pptx';

const SLIDES: { id: string; label: string; budget: number }[] = [
  { id: 'title', label: 'COVER — AI POWERED VOICE AGENT', budget: 10 },
  { id: 'problem', label: 'THE PROBLEM', budget: 20 },
  { id: 'solution', label: 'THE SOLUTION', budget: 25 },
  { id: 'hats', label: 'ONE AGENT, MANY HATS', budget: 20 },
  { id: 'chapter', label: 'CHAPTER — LIVE DEMO', budget: 5 },
  { id: 'live', label: '★ DEMO: THE RECORDED CALL', budget: 115 },
  { id: 'demo', label: '★ DEMO: TRY THE APP', budget: 25 },
  { id: 'how', label: 'HOW IT WORKS', budget: 25 },
  { id: 'stack', label: 'BUILT FROM OPEN SOURCE', budget: 20 },
  { id: 'time', label: 'BUILD PLAN & TIMELINE', budget: 20 },
  { id: 'business', label: 'BUSINESS & IMPACT', budget: 15 },
  { id: 'close', label: 'CLOSING — THE ASK', budget: 10 },
];

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--font-render-hinting=none'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const consoleLines: string[] = [];
page.on('console', (m) => { if (m.type() === 'error') consoleLines.push(`[console.error] ${m.text()}`); });
page.on('pageerror', (e) => consoleLines.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => consoleLines.push(`[requestfailed] ${r.url()} :: ${r.failure()?.errorText}`));

async function settle(ms = 2400) { await page.waitForTimeout(ms); }

// Remove Next.js dev-indicator DOM (the "Compiling…" toast lives in
// <nextjs-portal>) so it can never burn into a screenshot.
const stripDevChrome = async () => {
  await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach((n) => n.remove()));
};

// ---------- 1) capture the 12 slides ----------
const resp = await page.goto(`${BASE}/pitch`, { waitUntil: 'networkidle', timeout: 60000 });
console.log('GET /pitch ->', resp?.status());
if (!resp || resp.status() >= 400) consoleLines.push(`[fatal] /pitch status ${resp?.status()}`);
await page.evaluate(() => document.fonts.ready);
await settle(2800);

const shots: { file: string; label: string; budget: number }[] = [];
for (let i = 0; i < SLIDES.length; i++) {
  const { id, label, budget } = SLIDES[i];
  if (i > 0) await page.click('button[aria-label="Next slide"]', { timeout: 8000 });
  await page.waitForSelector(`[data-testid="pitch-slide-${id}"]`, { timeout: 10000 });
  // lazy-loaded slides ('live'/'demo') compile on first visit in dev — wait
  // long enough for the dev "Compiling" badge to appear and disappear.
  await settle(id === 'live' || id === 'demo' ? 5000 : 2400);
  const file = `${OUT_DIR}/slide-${String(i + 1).padStart(2, '0')}-${id}.png`;
  await stripDevChrome();
  await page.screenshot({ path: file });
  shots.push({ file, label, budget });
  console.log(`captured slide ${i + 1}/12 — ${id}`);
}
await browser.close();

// ---------- 2) compose the PPTX ----------
const pres = new pptxgen();
pres.defineLayout({ name: 'WIDE_169', width: 13.333, height: 7.5 });
pres.layout = 'WIDE_169';
pres.title = 'AI Powered Voice Agent — Pitch';
pres.subject = '4-minute idea pitch';
pres.author = 'DeckForge AI';
pres.company = 'DeckForge AI';

for (const { file, label, budget } of shots) {
  const slide = pres.addSlide();
  slide.background = { color: 'F5F0E6' }; // brand cream, matches slide edges
  slide.addImage({ path: file, x: 0, y: 0, w: 13.333, h: 7.5 });
  slide.addNotes(`${label} · pace ~${budget}s\nAdvance when the point lands — full pitch is ~4 minutes.`);
}

const data = (await pres.write({ outputType: 'nodebuffer' })) as Buffer;
await Bun.write(PPTX_OUT, data);
console.log('PPTX written:', PPTX_OUT, Math.round(data.length / 1024), 'KB,', shots.length, 'slides');

await Bun.write(`${OUT_DIR}/console.log`, consoleLines.length ? consoleLines.join('\n') : '(no console errors)');
console.log('console lines:', consoleLines.length);
consoleLines.slice(0, 10).forEach((l) => console.log('  ', l.slice(0, 200)));
process.exit(0);
