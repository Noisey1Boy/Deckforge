'use client';

/**
 * THE 4-MINUTE IDEA PITCH — a full-screen, keyboard-driven deck:
 * Title → Problem → Idea → LIVE human×robot conversation (real recorded call)
 * → How it works → Use cases → Open-source stack → Build timeline →
 * Interactive demo → Close. Arrow keys / space to navigate, F = fullscreen,
 * a 4:00 pacing timer runs top-right.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Bot, CalendarCheck2, CalendarPlus, Clock, Database, FileSpreadsheet,
  Handshake, Headset, Inbox, Layers, Mail, Maximize, MessageSquareText, Mic, NotebookPen,
  Phone, Play, Puzzle, Radio, Rocket, Send, Sheet, Sparkles, Timer, Wrench, Workflow,
} from 'lucide-react';
import { ConversationSlide } from '@/components/pitch/ConversationSlide';
import { DemoApp } from '@/components/pitch/DemoApp';
import { cn } from '@/lib/utils';

const TARGET_SECONDS = 240; // 4:00 pitch budget

interface Slide {
  id: string;
  label: string;
  budget: number; // seconds
  node: React.ReactNode;
}

/* ============================== slide 1 · title ============================== */

function TitleSlide({ onNext }: { onNext: () => void }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6 text-center">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="stg-label flex items-center gap-2 text-[10px] text-[color:var(--stg-ink)]/60">
        <Sparkles className="h-3.5 w-3.5 text-[color:var(--stg-yellow-deep)]" aria-hidden />
        AN IDEA PITCH · 4 MINUTES
      </motion.div>
      <h1 className="stg-display mt-4 text-[11vw] uppercase leading-[0.92] text-[color:var(--stg-ink)] sm:text-6xl md:text-7xl lg:text-[86px]">
        {['One AI employee.', 'Every channel.'].map((line, i) => (
          <motion.span key={line} className="block" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.14, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            {i === 1 ? <span className="text-[color:var(--stg-yellow-deep)]">{line}</span> : line}
          </motion.span>
        ))}
      </h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-5 max-w-xl text-sm leading-relaxed text-[color:var(--stg-ink)]/75 sm:text-base">
        Voice agents that answer, book, sell and follow up for real businesses —
        built on open source, self-hosted voices, and one dashboard for everything.
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button onClick={onNext} className="stg-label inline-flex h-12 items-center gap-2 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] px-6 text-[11px] text-[color:var(--stg-ink)] shadow-[5px_5px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5">
          <Play className="h-4 w-4" aria-hidden /> START THE PITCH
        </button>
        <Link href="/demo" className="stg-label inline-flex h-12 items-center gap-2 border-2 border-[color:var(--stg-ink)]/40 bg-white px-6 text-[11px] text-[color:var(--stg-ink)] transition-colors hover:border-[color:var(--stg-ink)]">
          <Bot className="h-4 w-4" aria-hidden /> OPEN THE LIVE DEMO
        </Link>
      </motion.div>
      {/* floating robot */}
      <motion.div className="pointer-events-none absolute right-[8%] top-[14%] hidden md:block" animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }} transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }} aria-hidden>
        <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-yellow)] shadow-[6px_6px_0_0_var(--stg-yellow)]">
          <Bot className="h-10 w-10" />
        </div>
      </motion.div>
      <motion.p className="stg-label absolute bottom-4 text-[9px] text-[color:var(--stg-ink)]/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
        ← → TO NAVIGATE · F FOR FULLSCREEN
      </motion.p>
    </div>
  );
}

/* ============================= slide 2 · problem ============================= */

const PAINS = [
  { icon: Phone, title: 'The 6 PM black hole', body: 'Calls after hours hit voicemail. The customer doesn’t leave a message — they dial the next clinic on the list.' },
  { icon: Handshake, title: 'Reception is expensive', body: 'A human front desk costs thousands every month — and still has lunch breaks, holidays, sick days and burnout.' },
  { icon: Puzzle, title: 'Today’s bots rent, not own', body: 'Hosted voice platforms charge per minute, lock your data in, and still leave bookings, sheets and inboxes scattered.' },
];

function ProblemSlide() {
  return (
    <div className="flex h-full flex-col justify-center px-6 py-8 sm:px-12 lg:px-20">
      <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/55">01 · THE PROBLEM</p>
      <h2 className="stg-display mt-2 max-w-3xl text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-5xl">
        Business happens after hours. <span className="text-[color:var(--stg-yellow-deep)]">Staffing doesn’t.</span>
      </h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PAINS.map((p, i) => (
          <motion.div key={p.title} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.16, duration: 0.4 }}
            className="rounded-xl border-2 border-[color:var(--stg-ink)] bg-white p-5 shadow-[6px_6px_0_0_var(--stg-ink)]">
            <div className="grid h-10 w-10 place-items-center border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] text-[color:var(--stg-ink)]"><p.icon className="h-5 w-5" aria-hidden /></div>
            <h3 className="stg-display mt-3 text-lg uppercase leading-tight">{p.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--stg-ink)]/75">{p.body}</p>
          </motion.div>
        ))}
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="stg-label mt-7 text-[10px] text-[color:var(--stg-ink)]/60">
        ★ EVERY MISSED CALL IS A CUSTOMER DIALING A COMPETITOR.
      </motion.p>
    </div>
  );
}

/* ============================== slide 3 · the idea =========================== */

function IdeaSlide() {
  const channels = [
    { icon: Phone, label: 'Phone (SIP)' }, { icon: MessageSquareText, label: 'WhatsApp' },
    { icon: Send, label: 'Telegram' }, { icon: Radio, label: 'Web voice' }, { icon: Inbox, label: 'Social DMs' },
  ];
  const actions = [
    { icon: CalendarPlus, label: 'Calendar + invites' }, { icon: Mail, label: 'Gmail' },
    { icon: Sheet, label: 'Google Sheets' }, { icon: Database, label: 'CRM · webhooks' }, { icon: Headset, label: 'Follow-ups' },
  ];
  return (
    <div className="flex h-full flex-col justify-center px-6 py-8 sm:px-12 lg:px-20">
      <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/55">02 · THE IDEA</p>
      <h2 className="stg-display mt-2 text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-5xl">
        One platform. <span className="text-[color:var(--stg-yellow-deep)]">One agent per business.</span> Fully yours.
      </h2>

      <div className="mt-8 grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-2">
          <p className="stg-label text-[9px] text-[color:var(--stg-ink)]/50">CHANNELS — WHERE CUSTOMERS TALK</p>
          {channels.map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.09 }}
              className="flex items-center gap-2.5 rounded-lg border-2 border-[color:var(--stg-ink)]/30 bg-white px-3 py-2.5">
              <c.icon className="h-4 w-4 text-[color:var(--stg-ink)]/70" aria-hidden /><span className="text-[13px] font-medium">{c.label}</span>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.45, type: 'spring', stiffness: 200, damping: 16 }}
          className="mx-auto grid h-28 w-28 place-items-center rounded-3xl border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-center shadow-[7px_7px_0_0_var(--stg-yellow)]" aria-label="The agent brain">
          <div><Bot className="mx-auto h-10 w-10 text-[color:var(--stg-yellow)]" aria-hidden /><p className="stg-label mt-1 text-[8px] text-[color:var(--stg-cream)]">LLM BRAIN<br />+ TOOLS</p></div>
        </motion.div>
        <div className="space-y-2">
          <p className="stg-label text-right text-[9px] text-[color:var(--stg-ink)]/50">ACTIONS — WHAT IT DOES</p>
          {actions.map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.09 }}
              className="flex items-center justify-end gap-2.5 rounded-lg border-2 border-[color:var(--stg-ink)]/30 bg-white px-3 py-2.5 text-right">
              <span className="text-[13px] font-medium">{c.label}</span><c.icon className="h-4 w-4 text-[color:var(--stg-ink)]/70" aria-hidden />
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-7 flex flex-wrap gap-2.5">
        <span className="stg-label rounded-full border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] px-3.5 py-2 text-[9px]">SELF-HOSTED VOICES · COSYVOICE / FISH SPEECH / KITTENTTS</span>
        <span className="stg-label rounded-full border-2 border-[color:var(--stg-ink)]/40 bg-white px-3.5 py-2 text-[9px]">ONE DASHBOARD: CALLS · TRANSCRIPTS · BOOKINGS · COSTS</span>
      </motion.div>
    </div>
  );
}

/* ============================ slide 5 · how it works ========================= */

function PipelineSlide() {
  const steps = [
    { icon: Mic, label: 'Caller speaks' }, { icon: Layers, label: 'STT · faster-whisper' },
    { icon: Workflow, label: 'LLM brain + tools' }, { icon: Radio, label: 'TTS · CosyVoice' }, { icon: Phone, label: 'Caller hears' },
  ];
  return (
    <div className="flex h-full flex-col justify-center px-6 py-8 sm:px-12 lg:px-20">
      <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/55">03 · HOW IT WORKS</p>
      <h2 className="stg-display mt-2 text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-5xl">
        Talk in. <span className="text-[color:var(--stg-yellow-deep)]">Action out.</span> Under a second.
      </h2>

      <div className="relative mt-10 flex flex-wrap items-center gap-y-6 lg:justify-between">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.14 }}
              className="flex w-28 flex-col items-center gap-2 text-center sm:w-32">
              <div className={cn('grid h-14 w-14 place-items-center rounded-2xl border-2', i === 2 ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-yellow)]' : 'border-[color:var(--stg-ink)]/40 bg-white text-[color:var(--stg-ink)]')}>
                <s.icon className="h-6 w-6" aria-hidden />
              </div>
              <span className="stg-label text-[8px] text-[color:var(--stg-ink)]/70">{s.label}</span>
            </motion.div>
            {i < steps.length - 1 && (
              <div className="relative mx-1 h-0.5 w-6 overflow-hidden bg-[color:var(--stg-ink)]/15 sm:w-10 lg:w-14" aria-hidden>
                <span className="stg-flow-dot absolute top-0 h-full w-2 bg-[color:var(--stg-yellow-deep)]" style={{ animationDelay: `${i * 0.35}s` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-9 grid gap-4 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="rounded-xl border-2 border-[color:var(--stg-ink)] bg-white p-4">
          <p className="stg-label flex items-center gap-2 text-[9px] text-[color:var(--stg-ink)]/60"><Wrench className="h-3.5 w-3.5" aria-hidden /> WHILE TALKING, THE BRAIN CALLS TOOLS</p>
          <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-[color:var(--stg-ink)]/80">check_availability( ) · create_event( ) · send_email( ) · update_sheet_row( )</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="rounded-xl border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] p-4">
          <p className="stg-label flex items-center gap-2 text-[9px]"><Timer className="h-3.5 w-3.5" aria-hidden /> THE LATENCY BUDGET</p>
          <p className="mt-1.5 text-[13px] font-semibold leading-snug">A voice feel is natural under ~800 ms — streaming STT, a fast LLM, streaming TTS. Tuning this is the real work.</p>
        </motion.div>
      </div>
    </div>
  );
}

/* ============================= slide 6 · use cases =========================== */

const USECASES = [
  { icon: Headset, title: 'Receptionist', body: 'Answers every call on ring 1, greets by name, never puts anyone on hold.', tools: 'calendar · email · FAQ' },
  { icon: CalendarCheck2, title: 'Appointment scheduler', body: 'Offers real openings, books with the right doctor, sends invites + reminders, reschedules on request.', tools: 'create_event · reminders' },
  { icon: Rocket, title: 'Sales person', body: 'Qualifies inbound leads, answers product questions, books demos, logs everything to the sheet.', tools: 'CRM · sheets · demo-booking' },
  { icon: MessageSquareText, title: 'Customer care', body: 'Handles order status and common issues on WhatsApp and web chat — escalates the tricky 5% to humans.', tools: 'Chatwoot inbox · webhooks' },
  { icon: NotebookPen, title: 'FAQ support', body: 'Prices, hours, insurance, directions — grounded answers in the business’s own documents.', tools: 'knowledge base · FAQ' },
  { icon: FileSpreadsheet, title: 'Info collector', body: 'Captures names, contacts and requirements conversationally, then writes clean rows to Google Sheets.', tools: 'update_sheet_row( )' },
];

function UseCasesSlide() {
  const [open, setOpen] = useState<number>(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setOpen((o) => (o + 1) % USECASES.length), 3200);
    return () => clearInterval(id);
  }, [auto]);
  return (
    <div className="flex h-full flex-col justify-center px-6 py-6 sm:px-12 lg:px-20">
      <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/55">04 · ONE AGENT, MANY HATS <span className="ml-2 hidden text-[color:var(--stg-ink)]/40 sm:inline">(CLICK A CARD)</span></p>
      <h2 className="stg-display mt-2 text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-4xl">
        Hire it as a <span className="text-[color:var(--stg-yellow-deep)]">receptionist</span> — or the whole front office.
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-3" onClick={() => setAuto(false)}>
        {USECASES.map((u, i) => (
          <motion.button key={u.title} onClick={() => setOpen(i)} aria-pressed={open === i}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.07 }}
            className={cn('rounded-xl border-2 p-3 text-left transition-all duration-200 sm:p-4',
              open === i ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)] shadow-[5px_5px_0_0_var(--stg-yellow)]' : 'border-[color:var(--stg-ink)]/30 bg-white text-[color:var(--stg-ink)] hover:border-[color:var(--stg-ink)]')}>
            <u.icon className={cn('h-5 w-5', open === i && 'text-[color:var(--stg-yellow)]')} aria-hidden />
            <p className="stg-display mt-1.5 text-sm uppercase leading-tight sm:text-base">{u.title}</p>
            <AnimatePresence>
              {open === i && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <p className="mt-1.5 text-[11px] leading-snug text-[color:var(--stg-cream)]/85">{u.body}</p>
                  <p className="stg-label mt-1.5 text-[7px] text-[color:var(--stg-yellow)]">{u.tools.toUpperCase()}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ============================== slide 7 · stack ============================== */

const STACK = [
  { layer: 'Voice runtime', picks: 'LiveKit Agents · Pipecat', note: 'WebRTC + SIP calls, interruptions, turn detection' },
  { layer: 'STT', picks: 'faster-whisper', note: 'self-hosted streaming transcription' },
  { layer: 'TTS', picks: 'CosyVoice · Fish Speech · KittenTTS', note: 'swappable behind one interface' },
  { layer: 'Tools & glue', picks: 'n8n · Activepieces · Composio', note: 'Calendar, Gmail, Sheets with OAuth handled' },
  { layer: 'Omnichannel inbox', picks: 'Chatwoot (+ official WhatsApp API)', note: 'no unofficial gateways — bans are real' },
  { layer: 'Data & dashboard', picks: 'Postgres + Metabase / Grafana', note: 'calls, transcripts, outcomes, costs' },
];

function StackSlide() {
  return (
    <div className="flex h-full flex-col justify-center px-6 py-6 sm:px-12 lg:px-20">
      <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/55">05 · BUILT FROM OPEN SOURCE</p>
      <h2 className="stg-display mt-2 text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-4xl">
        $0 in licenses. <span className="text-[color:var(--stg-yellow-deep)]">Every layer swappable.</span>
      </h2>
      <div className="mt-6 space-y-2">
        {STACK.map((s, i) => (
          <motion.div key={s.layer} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.09 }}
            className="grid grid-cols-[92px_1fr] items-center gap-3 rounded-lg border-2 border-[color:var(--stg-ink)]/30 bg-white p-3 sm:grid-cols-[140px_1fr_1fr]">
            <span className="stg-label text-[8px] text-[color:var(--stg-ink)]/60">{s.layer.toUpperCase()}</span>
            <span className="text-[13px] font-semibold text-[color:var(--stg-ink)]">{s.picks}</span>
            <span className="hidden text-[11px] text-[color:var(--stg-ink)]/60 sm:block">{s.note}</span>
          </motion.div>
        ))}
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="stg-label mt-5 text-[9px] text-[color:var(--stg-ink)]/55">
        STRATEGY: VALIDATE ON A HOSTED PLATFORM IN DAYS, THEN MOVE THE VOICE LAYER TO LIVEKIT/PIPECAT AND OWN THE MARGINS.
      </motion.p>
    </div>
  );
}

/* ============================= slide 8 · timeline ============================ */

const MILESTONES = [
  { label: 'Working prototype', span: '1–2 weeks', w: 14, note: 'one agent · self-hosted TTS · 1–2 tools' },
  { label: 'Client-ready MVP', span: '4–8 weeks', w: 30, note: 'phone number · calendar/email/sheets · dashboard' },
  { label: 'Multi-client platform', span: '3–5 months', w: 52, note: 'tenant configs · templates · logging · alerts' },
  { label: 'Each new client after', span: 'days → 2 weeks', w: 12, note: 'config, prompt, voice — not a rewrite' },
];

function TimelineSlide() {
  return (
    <div className="flex h-full flex-col justify-center px-6 py-6 sm:px-12 lg:px-20">
      <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/55">06 · TIME TO BUILD</p>
      <h2 className="stg-display mt-2 text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-4xl">
        One developer. <span className="text-[color:var(--stg-yellow-deep)]">AI-assisted.</span> Real dates.
      </h2>
      <div className="mt-8 space-y-4">
        {MILESTONES.map((m, i) => (
          <div key={m.label}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-[13px] font-semibold text-[color:var(--stg-ink)] sm:text-sm">{m.label}</p>
              <p className="stg-label text-[9px] text-[color:var(--stg-yellow-deep)]">{m.span.toUpperCase()}</p>
            </div>
            <div className="mt-1 h-7 overflow-hidden rounded-md border-2 border-[color:var(--stg-ink)]/25 bg-white">
              <motion.div initial={{ width: 0 }} animate={{ width: `${m.w}%` }} transition={{ delay: 0.15 + i * 0.18, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className={cn('flex h-full items-center px-2', i === 2 ? 'bg-[color:var(--stg-ink)]' : 'bg-[color:var(--stg-yellow)]')}>
                <span className={cn('stg-label whitespace-nowrap text-[7px]', i === 2 ? 'text-[color:var(--stg-yellow)]' : 'text-[color:var(--stg-ink)]')}>{m.note.toUpperCase()}</span>
              </motion.div>
            </div>
          </div>
        ))}
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="mt-6 text-[12px] leading-relaxed text-[color:var(--stg-ink)]/70">
        AI tooling speeds up CRUD, dashboards and glue ~2–3× — but latency tuning, real-call testing and client
        conversations still take the time they take. That’s the honest math.
      </motion.p>
    </div>
  );
}

/* ============================== slide 9 · demo =============================== */

function DemoSlide() {
  return (
    <div className="flex h-full flex-col px-4 py-4 sm:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/55">07 · TRY THE PRODUCT <span className="ml-2 text-[color:var(--stg-ink)]/40">(INTERACTIVE — CLICK “CALL LAYLA”)</span></p>
        <Link href="/demo" className="stg-label text-[9px] text-[color:var(--stg-yellow-deep)] underline-offset-2 hover:underline">OPEN FULLSCREEN →</Link>
      </div>
      <div className="mt-3 min-h-0 flex-1"><DemoApp compact /></div>
    </div>
  );
}

/* ============================== slide 10 · close ============================= */

function CloseSlide() {
  const chips = ['24/7 answers', 'phone + chat + social', 'self-hosted voices', 'books while you sleep', 'recurring revenue per client'];
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-yellow)] shadow-[5px_5px_0_0_var(--stg-yellow)]">
        <Bot className="h-8 w-8" aria-hidden />
      </motion.div>
      <h2 className="stg-display mt-5 max-w-3xl text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-5xl">
        Fewer missed calls. Faster answers. <span className="text-[color:var(--stg-yellow-deep)]">Lower cost per call.</span>
      </h2>
      <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
        {chips.map((c, i) => (
          <motion.span key={c} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
            className="rounded-full border-2 border-[color:var(--stg-ink)] bg-white px-3.5 py-2 text-[11px] font-medium">{c}</motion.span>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/demo" className="stg-label inline-flex h-12 items-center gap-2 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] px-6 text-[11px] shadow-[5px_5px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5">
          <Play className="h-4 w-4" aria-hidden /> RUN THE LIVE DEMO
        </Link>
        <Link href="/create" className="stg-label inline-flex h-12 items-center gap-2 border-2 border-[color:var(--stg-ink)]/40 bg-white px-6 text-[11px] transition-colors hover:border-[color:var(--stg-ink)]">
          BUILD A DECK LIKE THIS →
        </Link>
      </motion.div>
      <p className="stg-label mt-8 text-[8px] text-[color:var(--stg-ink)]/40">FULL 5:16 RECORDING AVAILABLE AT /DEMO · PITCH RUNTIME ≈ 4 MIN</p>
    </div>
  );
}

/* ================================= deck shell ================================ */

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -60 : 60 }),
};

function buildSlides(go: (n: number) => void): Slide[] {
  return [
    { id: 'title', label: 'TITLE', budget: 10, node: <TitleSlide onNext={() => go(1)} /> },
    { id: 'problem', label: 'PROBLEM', budget: 25, node: <ProblemSlide /> },
    { id: 'idea', label: 'THE IDEA', budget: 25, node: <IdeaSlide /> },
    { id: 'live', label: 'LIVE CALL · THE PROOF', budget: 115, node: <ConversationSlide /> },
    { id: 'how', label: 'HOW IT WORKS', budget: 25, node: <PipelineSlide /> },
    { id: 'uses', label: 'USE CASES', budget: 25, node: <UseCasesSlide /> },
    { id: 'stack', label: 'OPEN-SOURCE STACK', budget: 20, node: <StackSlide /> },
    { id: 'time', label: 'TIME TO BUILD', budget: 20, node: <TimelineSlide /> },
    { id: 'demo', label: 'INTERACTIVE DEMO', budget: 25, node: <DemoSlide /> },
    { id: 'close', label: 'CLOSE', budget: 10, node: <CloseSlide /> },
  ];
}

export function PitchDeck() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();

  const go = useCallback((next: number) => {
    setIndex((cur) => {
      const clamped = Math.max(0, Math.min(9, next)); // 10 slides, fixed
      if (clamped !== cur) setDir(clamped > cur ? 1 : -1);
      setStarted(true);
      return clamped;
    });
  }, []);

  const slides: Slide[] = useMemo(() => buildSlides(go), [go]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(index + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(index - 1); }
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(slides.length - 1);
      else if (e.key.toLowerCase() === 'f') {
        try {
          if (document.fullscreenElement) void document.exitFullscreen();
          else void stageRef.current?.requestFullscreen();
        } catch { /* denied */ }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index, slides.length]);

  // pacing timer
  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [started]);

  const over = elapsed > TARGET_SECONDS;
  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div ref={stageRef} className="fixed inset-0 flex flex-col bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)]" data-testid="pitch-deck">
      {/* top chrome */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] px-4 text-[color:var(--stg-cream)] sm:px-6">
        <Link href="/" className="stg-label text-[9px] text-white/60 transition-colors hover:text-white" aria-label="Back to DeckForge home">← DECKFORGE</Link>
        <span className="stg-label hidden text-[9px] text-[color:var(--stg-yellow)] sm:block">IDEA PITCH · THE VOICE AGENT PLATFORM</span>
        <span className={cn('stg-label ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] tabular-nums', over ? 'border-red-400/60 text-red-300' : 'border-white/25 text-white/70')} data-testid="pitch-timer">
          <Clock className="h-3 w-3" aria-hidden /> {mm}:{ss} / 4:00 {over ? '· OVER' : ''}
        </span>
        <button onClick={() => { try { if (document.fullscreenElement) void document.exitFullscreen(); else void stageRef.current?.requestFullscreen(); } catch { /* denied */ } }}
          aria-label="Toggle fullscreen" className="grid h-8 w-8 place-items-center text-white/60 transition-colors hover:text-white">
          <Maximize className="h-4 w-4" aria-hidden />
        </button>
      </header>

      {/* stage */}
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.section
            key={slides[index].id}
            custom={dir}
            variants={reduceMotion ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } } : variants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: reduceMotion ? 0.12 : 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex flex-col"
            data-testid={`pitch-slide-${slides[index].id}`}
          >
            {slides[index].node}
          </motion.section>
        </AnimatePresence>
      </main>

      {/* bottom chrome */}
      <footer className="flex h-14 shrink-0 items-center gap-3 border-t-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)] px-4 sm:px-6">
        <button onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous slide"
          className="grid h-10 w-10 place-items-center border-2 border-[color:var(--stg-ink)] bg-white transition-all hover:bg-[color:var(--stg-yellow)] disabled:opacity-30">
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </button>
        <div className="flex flex-1 flex-wrap items-center gap-1.5" role="tablist" aria-label="Slides">
          {slides.map((s, i) => (
            <button key={s.id} role="tab" aria-selected={i === index} aria-label={`Slide ${i + 1}: ${s.label}`} onClick={() => go(i)}
              className={cn('h-2.5 rounded-full transition-all', i === index ? 'w-7 bg-[color:var(--stg-ink)]' : 'w-2.5 bg-[color:var(--stg-ink)]/25 hover:bg-[color:var(--stg-ink)]/50')} />
          ))}
        </div>
        <span className="stg-label hidden text-[9px] text-[color:var(--stg-ink)]/60 md:block">{slides[index].label} · ~{slides[index].budget >= 60 ? `${Math.floor(slides[index].budget / 60)}:${String(slides[index].budget % 60).padStart(2, '0')}` : `${slides[index].budget}s`}</span>
        <span className="stg-label text-[9px] tabular-nums text-[color:var(--stg-ink)]/70">{String(index + 1).padStart(2, '0')} / {slides.length}</span>
        <button onClick={() => go(index + 1)} disabled={index === slides.length - 1} aria-label="Next slide"
          className="grid h-10 w-10 place-items-center border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] transition-all hover:-translate-y-0.5 disabled:opacity-30">
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </footer>
    </div>
  );
}
