/**
 * tmp/make-og.ts — render the social share card (public/og-image.png, 1200x630).
 * Run: bun tmp/make-og.ts   (playwright resolves from the bun global install)
 */
import { chromium } from 'playwright';

const HTML = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@700;800&family=Space+Mono:wght@700&display=swap">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:1200px; height:630px; overflow:hidden; }
  body {
    background:#1B1915; color:#F7F3EA;
    font-family:'Inter Tight', system-ui, sans-serif;
    display:flex; flex-direction:column; justify-content:space-between;
    padding:64px 72px;
  }
  .row { display:flex; align-items:center; gap:20px; }
  .mark { width:64px; height:64px; background:#FFC61A; color:#1B1915;
    display:grid; place-items:center; font-weight:800; font-size:40px; }
  .brand { font-weight:800; font-size:30px; letter-spacing:.14em; }
  .ai { color:#FFC61A; font-size:14px; letter-spacing:.3em; margin-left:10px; vertical-align:middle; }
  h1 { font-weight:800; font-size:96px; line-height:.95; text-transform:uppercase; letter-spacing:-.01em; }
  h1 .y { color:#FFC61A; }
  .sub { margin-top:28px; font-size:26px; color:#B9B3A6; max-width:60ch; line-height:1.35; }
  .stats { display:flex; gap:14px; align-items:center;
    font-family:'Space Mono', monospace; font-size:15px; letter-spacing:.08em; color:#F7F3EA; }
  .dot { width:7px; height:7px; background:#FFC61A; display:inline-block; }
</style></head>
<body>
  <div class="row">
    <div class="mark">D</div>
    <div class="brand">DECKFORGE<span class="ai">AI</span></div>
  </div>
  <div>
    <h1>Prompt to<br/><span class="y">polished presentation.</span></h1>
    <p class="sub">Outline first, design second. Charts from your own data, present mode, and files you own.</p>
  </div>
  <div class="stats">
    <span>24 DESIGN SYSTEMS</span><span class="dot"></span>
    <span>57 HTML TEMPLATES</span><span class="dot"></span>
    <span>7 EXPORT OPTIONS</span><span class="dot"></span>
    <span>FREE DURING BETA</span>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(HTML, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
await page.screenshot({ path: '/home/z/my-project/public/og-image.png' });
await browser.close();
console.log('og-image.png written');
