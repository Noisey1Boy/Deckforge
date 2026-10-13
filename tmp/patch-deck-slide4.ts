/**
 * DF-3 patch — compact slide 4 ("The proof") so the plain scratch deck fits
 * 1280×720/1440×900 without vertical overflow, and re-syncs the export file.
 * Idempotent: skips if the new markup is already present.
 */
import { db } from '../src/lib/db'

const DECK_ID = 'cmv72s0780001ohu3w3lfe86s'
const EXPORT_PATH = new URL('../exports/voice-agent-pitch/deckforge-pitch.html', import.meta.url).pathname

const OLD_QUOTE_BLOCK = `<h3 class="h3">The call — Robert × Layla, the AI receptionist</h3>
            <div class="quote">
              "Hello, this is Layla from Downtown Dentist. How may I help you today?"
              <br><br>
              "I've been having tooth problems… can you guys help me with that?"
              <br><br>
              "Could I start with your full name?" … "robertjohn123 at yahoo dot com — is that correct?"
              <br><br>
              "I see openings at 8:00 AM, 11:30 AM, and 2:00 PM."
              <br><br>
              "You're all booked in."
            </div>`

const NEW_QUOTE_BLOCK = `<h3 class="h3">The call — Robert × Layla, the AI receptionist</h3>
            <div class="call-lines">
              <p><b class="who ai">Layla</b>"Hello, this is Layla from Downtown Dentist. How may I help you today?"</p>
              <p><b class="who caller">Robert</b>"I've been having tooth problems… can you guys help me with that?"</p>
              <p><b class="who ai">Layla</b>"Could I start with your full name?" … "robertjohn123 at yahoo dot com — is that correct?"</p>
              <p><b class="who ai">Layla</b>"I see openings at 8:00 AM, 11:30 AM, and 2:00 PM."</p>
              <p><b class="who caller">Robert</b>"Um yes — 8:00 AM sounds great."</p>
              <p><b class="who ai">Layla</b>"You're all booked in."</p>
            </div>`

const SLIDE4_CSS = `
/* slide-4 compact call transcript (bounded layout patch) */
section.slide[data-title^="The proof"] .two-column .grid.g2{display:grid;grid-template-columns:1.15fr 1fr;gap:40px;width:100%;align-items:start}
section.slide[data-title^="The proof"] .two-column .left-column,section.slide[data-title^="The proof"] .two-column .right-column{flex:none;width:auto}
section.slide[data-title^="The proof"] .h2{font-size:26px;margin-bottom:6px}
section.slide[data-title^="The proof"] .h3{font-size:17px}
section.slide[data-title^="The proof"] code{white-space:normal;display:block}
section.slide[data-title^="The proof"] .two-column,section.slide[data-title^="The proof"] .grid{min-height:0;overflow:hidden}
.call-lines{display:flex;flex-direction:column;gap:7px;margin-top:10px;font-size:14px;line-height:1.4;min-height:0;overflow:hidden}
.call-lines p{margin:0;padding:6px 11px;border-radius:8px;background:rgba(255,255,255,0.045)}
.call-lines .who{display:inline-block;margin-right:8px;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;vertical-align:1px}
.call-lines .who.ai{color:var(--accent,#3b82f6)}
.call-lines .who.caller{color:#9ca3af}`

const SLIDE7_OLD = `  <section class="slide" data-title="$0 in licenses. Every layer swappable.">
    <div class="grid g2">
      <div class="card-soft">
        <h4>Our Stack</h4>
        <div class="comparison-table">
          <div class="table-row">
            <div class="table-cell">Voice runtime</div>
            <div class="table-cell">LiveKit Agents · Pipecat</div>
          </div>
          <div class="table-row">
            <div class="table-cell">STT</div>
            <div class="table-cell">faster-whisper</div>
          </div>
          <div class="table-row">
            <div class="table-cell">TTS</div>
            <div class="table-cell">CosyVoice · Fish Speech · KittenTTS</div>
          </div>
          <div class="table-row">
            <div class="table-cell">Tools & glue</div>
            <div class="table-cell">n8n · Activepieces · Composio</div>
          </div>
          <div class="table-row">
            <div class="table-cell">Omnichannel inbox</div>
            <div class="table-cell">Chatwoot</div>
          </div>
          <div class="table-row">
            <div class="table-cell">Data & dashboards</div>
            <div class="table-cell">Postgres + Metabase / Grafana</div>
          </div>
        </div>
      </div>
      <div class="card-soft">
        <h4>Strategy</h4>
        <p>Validate on a hosted platform in days, then move the voice layer to LiveKit/Pipecat and own the margins.</p>
      </div>
    </div>
    <div class="notes">
      Every layer is open source and swappable — zero license cost. Validate fast on a hosted platform, then own the voice layer and the margins.
    </div>
  </section>`

const SLIDE7_NEW = `  <section class="slide" data-title="$0 in licenses. Every layer swappable.">
    <div class="content" style="width:100%;max-width:1180px">
      <h1 class="h1 fade-up" style="font-size:34px">$0 in licenses. Every layer swappable.</h1>
      <div class="st-table fade-up" style="animation-delay:0.15s">
        <div class="st-row st-head"><span>Layer</span><span>Picks</span><span>Why</span></div>
        <div class="st-row"><b>Voice runtime</b><span>LiveKit Agents · Pipecat</span><span>WebRTC + SIP calls, interruptions, turn detection</span></div>
        <div class="st-row"><b>STT</b><span>faster-whisper</span><span>self-hosted streaming transcription</span></div>
        <div class="st-row"><b>TTS</b><span>CosyVoice · Fish Speech · KittenTTS</span><span>swappable behind one interface</span></div>
        <div class="st-row"><b>Tools &amp; glue</b><span>n8n · Activepieces · Composio</span><span>calendar, Gmail, Sheets with OAuth handled</span></div>
        <div class="st-row"><b>Omnichannel inbox</b><span>Chatwoot</span><span>official WhatsApp API only — bans are real</span></div>
        <div class="st-row"><b>Data &amp; dashboards</b><span>Postgres + Metabase / Grafana</span><span>calls, transcripts, outcomes, costs</span></div>
      </div>
      <p class="lede fade-up" style="animation-delay:0.3s;margin-top:16px">Strategy: validate on a hosted platform in days — then own the voice layer and the margins.</p>
    </div>
    <div class="notes">
      Every layer is open source and swappable — zero license cost. Validate fast on a hosted platform, then own the voice layer and the margins.
    </div>
  </section>`

const SLIDE7_CSS = `
/* slide-7 stack table (bounded layout patch) */
.st-table{display:flex;flex-direction:column;gap:6px;width:100%;margin-top:14px;min-height:0}
.st-row{display:grid;grid-template-columns:190px 1fr 1.4fr;gap:14px;padding:8px 14px;border-radius:8px;background:rgba(255,255,255,0.045);font-size:14.5px;line-height:1.35;align-items:baseline}
.st-row b{font-size:13px}
.st-head{background:transparent;padding:2px 14px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af}`

const deck = await db.htmlDeck.findUnique({ where: { id: DECK_ID } })
if (!deck) throw new Error('deck not found')
let html = deck.html

if (html.includes('call-lines')) {
  console.log('markup already patched')
} else {
  if (!html.includes(OLD_QUOTE_BLOCK)) throw new Error('old quote block not found — aborting')
  html = html.replace(OLD_QUOTE_BLOCK, NEW_QUOTE_BLOCK)
  console.log('markup patched')
}
// slide 7 markup
if (html.includes('st-table')) {
  console.log('slide-7 markup already patched')
} else if (html.includes(SLIDE7_OLD)) {
  html = html.replace(SLIDE7_OLD, SLIDE7_NEW)
  console.log('slide-7 markup patched')
} else {
  throw new Error('slide-7 block not found — aborting')
}
// swap in the current CSS block (idempotent replace)
html = html.replace(/<style>\s*\/\* slide-4 compact call transcript[\s\S]*?<\/style><\/head>/, '</head>')
html = html.replace(/<style>\s*\/\* slide-4 compact call transcript[\s\S]*?<\/style>/, '')
if (!html.includes('slide-4 compact call transcript')) {
  html = html.replace('</head>', `<style>${SLIDE4_CSS}</style></head>`)
  console.log('css-4 updated')
}
if (!html.includes('slide-7 stack table')) {
  html = html.replace('</head>', `<style>${SLIDE7_CSS}</style></head>`)
  console.log('css-7 updated')
}
await db.htmlDeck.update({ where: { id: DECK_ID }, data: { html } })
console.log('DB row saved, size:', html.length)

await Bun.write(EXPORT_PATH, html)
console.log('export synced:', EXPORT_PATH)
process.exit(0)
