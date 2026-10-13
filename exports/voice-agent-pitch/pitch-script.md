# The 4-Minute Idea Pitch — Voice Agent Platform
**Speaker script + slide copy · total runtime ≈ 4:00**

Pacing model: you speak ~85 s across 9 slides; slide 4 (the live call) runs 1:50
itself — stay quiet, let Layla book the appointment, then keep moving. A 4:00
pacing timer runs top-right in `/pitch`. Keys: ← → navigate · space next · F fullscreen.

> Budgets per slide (as built): 10s · 25s · 25s · 115s · 25s · 25s · 20s · 20s · 25s · 10s = 300s raw.
> To hit 4:00: present slide 4 at 1.5× (button on the slide → ~75s) or talk over
> slides 2/3/5/6 briskly. The timer chip shows drift.

---

## 1 · TITLE (~10 s)
**On screen:** "ONE AI EMPLOYEE. / EVERY CHANNEL." — subline: Voice agents that answer, book, sell and follow up for real businesses — built on open source, self-hosted voices, and one dashboard for everything.

**Say:** "This is a pitch for one AI employee that answers every channel of a real business — phone, WhatsApp, Telegram, web. Four minutes. Let's go."

## 2 · THE PROBLEM (~25 s)
**On screen:** "Business happens after hours. Staffing doesn't." — three cards:
- **The 6 PM black hole** — Calls after hours hit voicemail. The customer doesn't leave a message — they dial the next clinic on the list.
- **Reception is expensive** — A human front desk costs thousands every month — and still has lunch breaks, holidays, sick days and burnout.
- **Today's bots rent, not own** — Hosted voice platforms charge per minute, lock your data in, and still leave bookings, sheets and inboxes scattered.

**Say:** "Small businesses lose real customers in the hours they can't staff. Human reception is expensive and still goes offline. And today's hosted bots charge rent per minute, lock your data away, and leave bookings scattered. Every missed call is a customer dialing a competitor."

## 3 · THE IDEA (~25 s)
**On screen:** "One platform. One agent per business. Fully yours." — left: channels (Phone/SIP, WhatsApp, Telegram, Web voice, Social DMs) → center: **LLM BRAIN + TOOLS** → right: actions (Calendar + invites, Gmail, Google Sheets, CRM/webhooks, Follow-ups). Chips: self-hosted voices (CosyVoice / Fish Speech / KittenTTS) · one dashboard (calls · transcripts · bookings · costs).

**Say:** "The idea: one platform, one agent per business. Customers talk on any channel; the agent acts in your real tools — calendar, email, sheets, CRM — with self-hosted voices, and one dashboard showing every call, transcript, booking and cost."

## 4 · LIVE CALL — THE PROOF (~115 s, run silent)
**On screen:** the human (Robert) × robot (Layla) conversation synced to the real
recorded call (1:50 highlight of 5:16), with the agent tool trace lighting up:
read-back confirm → upsert_contact → check_availability → create_event →
send_email → send_sms. Ends: "✅ Appointment booked — Dr. Pegel · tomorrow 8:00 AM · email + SMS sent."

**Say (before pressing play):** "This is a real recording — not a script. Watch Layla book an appointment end-to-end."
**Transcript:** see `conversation-timings.json` (17 turns, timestamped).

## 5 · HOW IT WORKS (~25 s)
**On screen:** "Talk in. Action out. Under a second." — pipeline: Caller speaks → STT (faster-whisper) → **LLM brain + tools** → TTS (CosyVoice) → Caller hears. While talking, the brain calls tools: `check_availability( ) · create_event( ) · send_email( ) · update_sheet_row( )`. Latency budget: natural voice feel under ~800 ms — streaming STT, fast LLM, streaming TTS; tuning this is the real work.

**Say:** "Under the hood: speech in, transcribed by faster-whisper; an LLM brain that calls real tools mid-sentence; CosyVoice speaks the reply. The whole loop targets under 800 milliseconds — that latency budget is where the engineering lives."

## 6 · USE CASES (~25 s — cards auto-cycle; click to pin)
**On screen:** "Hire it as a receptionist — or the whole front office."
1. **Receptionist** — answers every call on ring 1, greets by name, never puts anyone on hold. (calendar · email · FAQ)
2. **Appointment scheduler** — offers real openings, books with the right doctor, sends invites + reminders, reschedules on request. (create_event · reminders)
3. **Sales person** — qualifies inbound leads, answers product questions, books demos, logs everything to the sheet. (CRM · sheets · demo-booking)
4. **Customer care** — handles order status and common issues on WhatsApp and web chat; escalates the tricky 5% to humans. (Chatwoot inbox · webhooks)
5. **FAQ support** — prices, hours, insurance, directions — grounded answers in the business's own documents. (knowledge base · FAQ)
6. **Info collector** — captures names, contacts and requirements conversationally, then writes clean rows to Google Sheets. (update_sheet_row( ))

**Say:** "Same agent, many hats: receptionist, scheduler, sales, customer care, FAQ, info collector. One deployment per business — switch it on per role."

## 7 · OPEN-SOURCE STACK (~20 s)
**On screen:** "$0 in licenses. Every layer swappable."
| Layer | Picks | Note |
|---|---|---|
| Voice runtime | LiveKit Agents · Pipecat | WebRTC + SIP calls, interruptions, turn detection |
| STT | faster-whisper | self-hosted streaming transcription |
| TTS | CosyVoice · Fish Speech · KittenTTS | swappable behind one interface |
| Tools & glue | n8n · Activepieces · Composio | Calendar, Gmail, Sheets with OAuth handled |
| Omnichannel inbox | Chatwoot (+ official WhatsApp API) | no unofficial gateways — bans are real |
| Data & dashboard | Postgres + Metabase / Grafana | calls, transcripts, outcomes, costs |

Strategy: validate on a hosted platform in days, then move the voice layer to LiveKit/Pipecat and own the margins.

**Say:** "Every layer is open source and swappable — zero license cost. Validate fast on a hosted platform, then own the voice layer and the margins."

## 8 · TIME TO BUILD (~20 s)
**On screen:** "One developer. AI-assisted. Real dates."
- Working prototype — **1–2 weeks** (one agent · self-hosted TTS · 1–2 tools)
- Client-ready MVP — **4–8 weeks** (phone number · calendar/email/sheets · dashboard)
- Multi-client platform — **3–5 months** (tenant configs · templates · logging · alerts)
- Each new client after — **days → 2 weeks** (config, prompt, voice — not a rewrite)

Honest math: AI tooling speeds up CRUD/dashboards/glue ~2–3×, but latency tuning, real-call testing and client conversations take the time they take.

**Say:** "One AI-assisted developer: prototype in two weeks, first paying client in under two months, a real platform by month five — and every client after that is configuration, not a rewrite."

## 9 · INTERACTIVE DEMO (~25 s)
**On screen:** the product mock — click **CALL LAYLA**: ringing → live (same recorded audio, mini feed + tool trace lighting up) → booking card. Tabs: Agent trace · Tool playground (check_availability / create_event / send_email with simulated JSON) · Dashboard (answer rate, bookings, ~700 ms response, $0.19/call — illustrative).

**Say:** "Don't take my word for it — this is clickable. Call her." *(let the audience member drive, or click through)*

## 10 · CLOSE (~10 s)
**On screen:** "Fewer missed calls. Faster answers. Lower cost per call." — chips: 24/7 answers · phone + chat + social · self-hosted voices · books while you sleep · recurring revenue per client. CTAs: RUN THE LIVE DEMO · BUILD A DECK LIKE THIS.

**Say:** "Fewer missed calls, faster answers, lower cost per call — and recurring revenue per client for us. That's the business. Thank you."

---

### Delivery tips
- The deck is the backdrop, not the script — the words above are the pitch; slides carry the structure.
- On slide 4, don't narrate over the call; the bubbles ARE the narration.
- If time drifts past 4:00, the timer chip turns red — jump to slide 10 with `End`.
