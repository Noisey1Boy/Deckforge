'use client';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Deck } from '@/lib/deck/types';
import { getTheme } from '@/lib/design/themes';
import { SlideView } from '@/components/deck/SlideView';

/**
 * Standalone HTML export, rendered in the browser with the same React layout
 * components the app uses (renderToStaticMarkup on the client bundle), then
 * packaged with the deck stylesheet + a tiny navigation script into one file.
 */

const FONT_HREF =
  'https://fonts.googleapis.com/css2' +
  '?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@600;700;800' +
  '&family=Space+Grotesk:wght@500;600;700&family=Archivo+Black&family=Archivo:wght@400;500;600;700' +
  '&family=Baloo+2:wght@500;600;700&family=Nunito:wght@400;600;700;800' +
  '&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500' +
  '&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,500' +
  '&family=Source+Sans+3:wght@400;600;700&family=Sora:wght@400;600;700;800' +
  '&family=Fraunces:wght@500;600;700&family=Work+Sans:wght@400;500;600;700' +
  '&family=IBM+Plex+Mono:wght@400;500;600&display=swap';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string));
}

export async function exportStandaloneHtml(deck: Deck): Promise<void> {
  const theme = getTheme(deck.themeId);

  const cssRes = await fetch('/api/export/deck-css');
  if (!cssRes.ok) throw new Error('Could not load deck stylesheet');
  const css = await cssRes.text();

  const stageStyle = 'width:min(100vw - 48px, calc((100vh - 130px) * 16 / 9));max-width:1280px;';
  const slidesHtml = deck.slides
    .map((s, i) => {
      const markup = renderToStaticMarkup(
        createElement(SlideView, {
          slide: s,
          theme,
          deckTitle: deck.title,
          index: i,
          pageCount: deck.slides.length,
          fixedCharts: true,
        })
      );
      return `<section class="df-stage" style="${stageStyle}" data-index="${i}"><div class="df-scale">${markup}</div></section>`;
    })
    .join('\n');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(deck.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="${FONT_HREF}" />
<style>
${css}
html,body{margin:0;padding:0;background:#101014}
.df-wrap{display:flex;flex-direction:column;align-items:center;gap:28px;padding:24px 12px 96px}
.df-stage{position:relative}
.df-scale{transform-origin:top left}
.df-nav{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);display:flex;gap:10px;align-items:center;background:rgba(16,16,20,.85);color:#fff;padding:8px 16px;border-radius:999px;font:500 13px/1.4 system-ui;z-index:50}
.df-nav button{background:none;border:1px solid rgba(255,255,255,.35);color:#fff;border-radius:999px;width:30px;height:30px;cursor:pointer;font-size:15px}
.df-nav button:hover{background:rgba(255,255,255,.15)}
.df-counter{min-width:56px;text-align:center;font-variant-numeric:tabular-nums}
.df-notes{max-width:min(92vw,720px);margin:0 auto;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#ddd;border-radius:12px;padding:14px 18px;font:400 14px/1.6 system-ui;display:none;white-space:pre-line}
.df-notes.on{display:block}
@media print{.df-nav,.df-notes{display:none!important}html,body{background:#fff}.df-wrap{gap:0;padding:0}.df-stage{width:1280px!important;page-break-after:always}}
</style>
</head>
<body>
<main class="df-wrap" id="wrap">
${slidesHtml}
</main>
<div class="df-notes" id="notes">${escapeHtml(deck.slides.map((s, i) => `${i + 1}. ${s.notes ?? ''}`).join('\n'))}</div>
<nav class="df-nav" aria-label="Deck navigation">
  <button onclick="step(-1)" aria-label="Previous">&uarr;</button>
  <span class="df-counter" id="counter">1 / ${deck.slides.length}</span>
  <button onclick="step(1)" aria-label="Next">&darr;</button>
  <button onclick="document.getElementById('notes').classList.toggle('on')" title="Speaker notes">N</button>
  <button onclick="window.print()" title="Print / PDF">P</button>
</nav>
<script>
(function(){
  var stages=[].slice.call(document.querySelectorAll('.df-stage'));
  function fit(){
    stages.forEach(function(st){
      var inner=st.querySelector('.df-scale');
      var scale=st.clientWidth/1280;
      inner.style.transform='scale('+scale+')';
      st.style.height=(720*scale)+'px';
    });
  }
  var cur=0;
  window.step=function(d){
    cur=Math.min(Math.max(cur+d,0),stages.length-1);
    var top=stages[cur].getBoundingClientRect().top+window.scrollY-12;
    window.scrollTo({top:top,behavior:'smooth'});
    document.getElementById('counter').textContent=(cur+1)+' / '+stages.length;
  };
  window.addEventListener('resize',fit);
  window.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'||e.key==='PageDown'||e.key===' ')window.step(1);
    if(e.key==='ArrowUp'||e.key==='PageUp')window.step(-1);
    if(e.key==='n'||e.key==='N')document.getElementById('notes').classList.toggle('on');
  });
  fit();
})();
</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(deck.title || 'deck').replace(/[^\w\d -]+/g, '').slice(0, 50) || 'deck'}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
