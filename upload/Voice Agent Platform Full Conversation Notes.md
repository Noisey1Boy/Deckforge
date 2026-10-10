# Voice Agent Platform: Full Conversation Notes

Oct 13, 2026 · @ANX

## The idea

Build an app where voice agents talk to customers and clients, send emails and calendar invites, check availability, edit Google Sheets, and connect to WhatsApp, Telegram and other social channels. Then sell it as custom software to individual businesses, using self-hosted voice models (CosyVoice, Fish Speech, KittenTTS) and a dashboard that visualizes all their data.

## Part 1: Architecture and open-source building blocks

Build three separate layers so any part can be swapped later: channels (phone, web voice, WhatsApp, Telegram, Instagram/Facebook), an agent brain (LLM with tool calling, memory and prompts), and tools (Google Calendar, Gmail, Google Sheets, CRM, webhooks).

| Layer | Option | Notes |
| --- | --- | --- |
| Voice (real-time calls) | LiveKit Agents (Apache 2.0) | Most complete: WebRTC and SIP phone calls, interruption handling, turn detection, works with any STT, LLM or TTS |
| Voice | Pipecat (BSD) | Python voice pipelines; simpler to read and hack on |
| Voice | Bolna, TEN Framework | More "Vapi-like" open-source stacks |
| STT / TTS | Deepgram, ElevenLabs, Cartesia | Hosted, low latency |
| STT / TTS | Whisper / faster-whisper, Piper, Kokoro | Self-hosted, lower cost |
| Integrations | n8n (fair-code), Activepieces (MIT) | Fastest way to wire Calendar, Gmail, Sheets; the agent calls a webhook and the workflow acts |
| Integrations | Composio, Google Workspace MCP servers | Ready-made tool definitions with OAuth handled |
| Messaging | Chatwoot (MIT) | Omnichannel inbox: WhatsApp, Telegram, email, Facebook, Instagram, web chat, with API and bot hooks |
| Messaging | Botpress, Typebot | Visual bot builders |
| Messaging | WhatsApp Cloud API, grammY, python-telegram-bot | Direct official options |
| Orchestration | Dify, Langflow, Flowise | Optional visual LLM logic; plain SDK tool calling (OpenAI, Anthropic, Gemini) is often enough |

Avoid unofficial WhatsApp libraries (Baileys, Evolution API) for client work: they break often and can get numbers banned.

## Part 1: Build paths, order and pitfalls

Two ways to build it:

1. **Fastest:** a hosted voice platform (Vapi, Retell) for calls, n8n for tools, Chatwoot for text channels. Ships in days, but costs per minute and gives less control.
2. **Fully open-source:** LiveKit or Pipecat for voice, a Python/FastAPI backend that defines the tools, n8n or direct Google API calls for actions, Chatwoot or direct bot APIs for messaging. More work, but you own everything and per-minute cost drops sharply.

Recommended: validate with option 1, then move the voice layer to LiveKit or Pipecat once it works.

Suggested build order:

1. Define the tools first as functions the LLM can call: `check_availability(date_range)`, `create_event(title, time, attendee_email)` (adding attendees makes Google send the invite), `send_email(to, subject, body)`, `update_sheet_row(...)`. They then work across voice, WhatsApp and Telegram.
2. Build one text channel (Telegram is easiest) and get tool calling reliable.
3. Add voice on top of the same agent logic.
4. Add WhatsApp and other channels as thin adapters.
5. Add a database (Postgres or Supabase) for history, client records and logs.

Pitfalls to plan for:

- **Latency:** voice feels natural under about 800 ms; use streaming STT, a fast LLM and streaming TTS.
- **Confirm before writing:** read back dates, times and emails before booking or sending, and pin the timezone.
- **OAuth:** each client needs their own Google authorization; Composio or Nango can handle it.
- **WhatsApp rules:** businesses can only message first with approved templates, and free-form replies are limited to 24 hours after the customer writes.
- **Legal:** call recording consent and data privacy rules depend on your region and your clients'.

## Part 2: Custom software per business with self-hosted TTS

Very feasible: every piece exists as open source, and the real work is gluing them together reliably and making it repeatable across clients.

| TTS model | Strengths | Watch out for |
| --- | --- | --- |
| CosyVoice (Qwen/Alibaba) | Good quality, streaming, voice cloning, strong multilingual | Needs a GPU |
| Fish Speech | Excellent quality | Check the license: some weights have been non-commercial (CC-BY-NC-SA), so selling it may need a license from Fish Audio |
| KittenTTS | Tiny, runs on CPU, cheap to host | Mostly English, fewer voices, lower quality, no cloning |

TTS is one third of a voice agent. You still need STT, turn detection, interruption handling and telephony, so build around LiveKit or Pipecat and put TTS behind a swappable interface.

Where the difficulty is:

- **Latency:** self-hosted TTS must start streaming audio within a few hundred ms; test early in the target language.
- **GPU costs:** one GPU handles only a handful of concurrent calls.
- **Real-call edge cases:** noise, accents, interruptions and dropped calls take longer than the features.
- **Ongoing work:** per-client OAuth, monitoring and support.

Timeline with AI-assisted development (one developer, full time). AI tools speed up CRUD, dashboards and glue code about 2-3x, but not latency tuning, call testing or client back-and-forth.

| Milestone | Estimate |
| --- | --- |
| Working prototype (one agent, self-hosted TTS, 1-2 tools) | 1-2 weeks |
| First client-ready MVP (phone number, calendar/email/sheets, basic dashboard) | 4-8 weeks |
| Reusable multi-client platform (tenant configs, templates, logging, alerts) | 3-5 months |
| Each new client afterward | A few days to 2 weeks |

Dashboard: embed Metabase or Grafana over a Postgres database (calls, transcripts, outcomes, bookings, costs) first, which saves weeks. Build a custom Next.js dashboard later for client-facing polish.

Recommendations:

- Build one core platform with per-client configuration (prompt, voice, tools, dashboard views) rather than separate codebases.
- Start the prototype with the cheapest TTS that sounds acceptable, then upgrade per client.
- Decide early whether you host and maintain it for clients (recurring revenue, more support) or hand it over.

## Part 3: Problem statement, solution, methodology and impact

**Problem statement.** Small and mid-sized businesses lose leads and revenue because calls, messages and bookings go unanswered outside staffed hours. Existing voice-agent platforms are generic, charge per minute, lock data in, and need technical setup. Businesses also rarely get one place to see what their agent is doing.

**Proposed solution.** A configurable platform that deploys a voice and chat agent per business:

- **Channels:** phone, web voice, WhatsApp, Telegram and other social inboxes
- **Voice:** self-hosted, swappable TTS (CosyVoice, Fish Speech, KittenTTS) behind a common interface
- **Actions:** check availability, book calendar events with invites, send emails, read and update Google Sheets
- **Dashboard:** calls, transcripts, bookings, outcomes and costs in one view

One core codebase, with per-client configuration for prompt, voice, tools and dashboard.

**Methodology.**

1. Define tools: calendar, email and sheets functions the LLM can call, shared across all channels.
2. Prototype: one text channel (Telegram) with reliable tool calling.
3. Add voice: LiveKit or Pipecat with STT, LLM and the chosen TTS, tuned to under about 800 ms latency.
4. Add channels: WhatsApp (official Cloud API) and others as thin adapters.
5. Data and dashboard: Postgres for history and logs, Metabase or Grafana first, custom UI later.
6. Pilot: deploy with one or two real businesses, review real calls, fix edge cases.
7. Productize: tenant configs, templates, monitoring and alerts so each new client takes days, not weeks.

**Expected impact.**

- **For businesses:** fewer missed calls, faster responses, automated booking and follow-up, and lower staffing cost for routine inquiries.
- **For you:** recurring revenue from hosting and maintenance, lower per-minute costs than hosted platforms, and a reusable base that makes each new client cheap to onboard.
- **Measurable targets:** answer rate, booking conversion, average response time, cost per call, and hours of staff time saved.
