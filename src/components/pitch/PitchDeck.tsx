'use client';

/**
 * THE 4-MINUTE IDEA PITCH — a full-screen, keyboard-driven deck, structured
 * after the user's reference deck (upload/Voice-Agent-Pitch (1).html):
 *   IDEA → why it's needed → what the agent can do → LIVE DEMO chapter →
 *   recorded call → interactive app → the technical part (how it works,
 *   open source, timeline, business) → the ask.
 * Same billposter chrome (fonts, poster shadows, framer-motion animations),
 * recolored through the .ps-scope PlayStation palette. Arrow keys / space to
 * navigate, F = fullscreen, a 4:00 pacing timer runs top-right.
 */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Bot, CalendarCheck2, CalendarPlus, Clock, Database, FileSpreadsheet,
  Handshake, Headset, Inbox, Layers, Mail, Maximize, MessageSquareText, Mic, MonitorPlay,
  NotebookPen, Phone, Play, Puzzle, Radio, Rocket, Send, Sheet, Store, Timer,
  Wallet, Wrench, Workflow,
} from 'lucide-react';
import { ConversationSlide } from '@/components/pitch/ConversationSlide';
import { DemoApp } from '@/components/pitch/DemoApp';
import { cn } from '@/lib/utils';

const TARGET_SECONDS = 240; // 4:00 pitch budget
const SLIDE_COUNT = 12;

interface Slide {
  id: string;
  label: string;
  budget: number; // seconds
  node: React.ReactNode;
}

/* ============================== slide 1 · title ============================== */

function TitleSlide({ onNext }: { onNext: () => void }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6 pb-14 text-center">
      <h1 className="stg-display mt-2 text-[11vw] uppercase leading-[0.92] text-[color:var(--stg-ink)] sm:text-6xl md:text-7xl lg:text-[86px]">
        {['AI Powered', 'Voice Agent'].map((line, i) => (
          <motion.span key={line} className="block" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.14, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            {i === 1 ? <span className="text-[color:var(--stg-yellow-deep)]">{line}</span> : line}
          </motion.span>
        ))}
      </h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-5 max-w-xl text-sm leading-relaxed text-[color:var(--stg-ink)]/75 sm:text-base">
        Your AI employee that answers every call, books every appointment and never sleeps.
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button onClick={onNext} className="stg-label inline-flex h-12 items-center gap-2 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] px-6 text-[11px] text-white shadow-[5px_5px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5">
          <Play className="h-4 w-4" aria-hidden /> START THE PITCH
        </button>
        <Link href="/demo" className="stg-label inline-flex h-12 items-center gap-2 border-2 border-[color:var(--stg-ink)]/40 bg-white px-6 text-[11px] text-[color:var(--stg-ink)] transition-colors hover:border-[color:var(--stg-ink)]">
          <Bot className="h-4 w-4" aria-hidden /> OPEN THE LIVE DEMO
        </Link>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <span className="stg-label rounded-full border border-[color:var(--stg-ink)]/30 bg-white px-3 py-1.5 text-[8px] text-[color:var(--stg-ink)]/60">LIVE DEMO INSIDE — A REAL RECORDED CALL</span>
        <span className="stg-label rounded-full border border-[color:var(--stg-ink)]/30 bg-white px-3 py-1.5 text-[8px] text-[color:var(--stg-ink)]/60">NAVIGATE: ← → · FULLSCREEN: F</span>
      </motion.div>
      {/* floating robot */}
      <motion.div className="pointer-events-none absolute right-[8%] top-[14%] hidden md:block" animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }} transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }} aria-hidden>
        <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-[color:var(--stg-ink)] bg-white p-1 shadow-[6px_6px_0_0_var(--stg-yellow)]">
          <img src="/avatars/ai-layla.jpg" alt="" className="h-full w-full rounded-full object-cover object-top" />
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
  { icon: Handshake, title: 'The reception bottleneck', body: 'One person, five channels: phone, walk-ins, email, WhatsApp, Telegram. Routine questions eat the whole day.' },
  { icon: Puzzle, title: 'Generic bots, locked data', body: 'Today’s voice-bot platforms are per-minute, one-size-fits-all, and trap call data with no dashboard to see what is happening.' },
];

function ProblemSlide() {
  return (
    <div className="flex h-full flex-col justify-center px-6 py-8 sm:px-12 lg:px-20">
      <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/55">01 · THE PROBLEM</p>
      <h2 className="stg-display mt-2 max-w-3xl text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-5xl">
        Every missed call is a <span className="text-[color:var(--stg-yellow-deep)]">customer walking away.</span>
      </h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PAINS.map((p, i) => (
          <motion.div key={p.title} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.16, duration: 0.4 }}
            className="rounded-xl border-2 border-[color:var(--stg-ink)] bg-white p-5 shadow-[6px_6px_0_0_var(--stg-ink)]">
            <div className="grid h-10 w-10 place-items-center border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] text-white"><p.icon className="h-5 w-5" aria-hidden /></div>
            <h3 className="stg-display mt-3 text-lg uppercase leading-tight">{p.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--stg-ink)]/75">{p.body}</p>
          </motion.div>
        ))}
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="stg-label mt-7 text-[10px] text-[color:var(--stg-ink)]/60">
        ★ STAFF CANNOT SCALE TO 24/7. SOFTWARE CAN.
      </motion.p>
    </div>
  );
}

/* ============================ slide 3 · the solution ========================= */

const SOLUTION_CARDS = [
  { icon: Mic, title: 'Talks & listens', body: 'Natural voice calls on phone and web, responding in under 800 ms so it feels human.' },
  { icon: Wrench, title: 'Acts, not just answers', body: 'Checks availability, books calendar events with invites, sends emails, updates Google Sheets.' },
  { icon: Inbox, title: 'Everywhere customers are', body: 'Phone, web voice, WhatsApp, Telegram and social inboxes — one brain across all of them.' },
  { icon: Database, title: 'Your data, your dashboard', body: 'Calls, transcripts, bookings, outcomes and costs in one live view.' },
];

function SolutionSlide() {
  return (
    <div className="flex h-full flex-col justify-center px-6 py-8 sm:px-12 lg:px-20">
      <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/55">02 · THE SOLUTION</p>
      <h2 className="stg-display mt-2 max-w-4xl text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-5xl">
        One AI employee. Every channel. <span className="text-[color:var(--stg-yellow-deep)]">Your rules.</span>
      </h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-3 max-w-2xl text-[13px] leading-relaxed text-[color:var(--stg-ink)]/70 sm:text-sm">
        A configurable platform that deploys a voice + chat agent per business — built on open source,
        hosted for you, visible in one dashboard.
      </motion.p>
      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SOLUTION_CARDS.map((c, i) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.13, duration: 0.4 }}
            className="rounded-xl border-2 border-[color:var(--stg-ink)] bg-white p-4 shadow-[5px_5px_0_0_var(--stg-ink)]">
            <div className="grid h-10 w-10 place-items-center border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] text-white"><c.icon className="h-5 w-5" aria-hidden /></div>
            <h3 className="stg-display mt-3 text-base uppercase leading-tight">{c.title}</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-[color:var(--stg-ink)]/75">{c.body}</p>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="mt-7 flex flex-wrap gap-2.5">
        <span className="stg-label rounded-full border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] px-3.5 py-2 text-[9px] text-white">ONE CORE CODEBASE</span>
        <span className="stg-label rounded-full border-2 border-[color:var(--stg-ink)]/40 bg-white px-3.5 py-2 text-[9px] text-[color:var(--stg-ink)]">PER-CLIENT PROMPT</span>
        <span className="stg-label rounded-full border-2 border-[color:var(--stg-ink)]/40 bg-white px-3.5 py-2 text-[9px] text-[color:var(--stg-ink)]">PER-CLIENT VOICE</span>
        <span className="stg-label rounded-full border-2 border-[color:var(--stg-ink)]/40 bg-white px-3.5 py-2 text-[9px] text-[color:var(--stg-ink)]">PER-CLIENT TOOLS</span>
      </motion.div>
    </div>
  );
}

/* ========================= slide 4 · one agent, many hats ==================== */

const USECASES = [
  { icon: Headset, title: 'Receptionist', body: 'Answers every call on ring 1, greets by name, never puts anyone on hold.', tools: 'calendar · email · FAQ' },
  { icon: CalendarCheck2, title: 'Appointment scheduler', body: 'Offers real openings, books with the right doctor, sends invites + reminders, reschedules on request.', tools: 'create_event · reminders' },
  { icon: Rocket, title: 'Sales rep', body: 'Qualifies inbound leads, answers product questions, books demos, logs everything to the sheet.', tools: 'CRM · sheets · demo-booking' },
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
      <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/55">03 · ONE AGENT, MANY HATS <span className="ml-2 hidden text-[color:var(--stg-ink)]/40 sm:inline">(CLICK A CARD)</span></p>
      <h2 className="stg-display mt-2 text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-4xl">
        Hire it for any <span className="text-[color:var(--stg-yellow-deep)]">front-desk job.</span>
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-3" onClick={() => setAuto(false)}>
        {USECASES.map((u, i) => (
          <motion.button key={u.title} onClick={() => setOpen(i)} aria-pressed={open === i}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.07 }}
            className={cn('rounded-xl border-2 p-3 text-left transition-all duration-200 sm:p-4',
              open === i ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)] shadow-[5px_5px_0_0_var(--stg-yellow)]' : 'border-[color:var(--stg-ink)]/30 bg-white text-[color:var(--stg-ink)] hover:border-[color:var(--stg-ink)]')}>
            <u.icon className={cn('h-5 w-5', open === i && 'text-[color:var(--ps-link-dark)]')} aria-hidden />
            <p className="stg-display mt-1.5 text-sm uppercase leading-tight sm:text-base">{u.title}</p>
            <AnimatePresence>
              {open === i && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <p className="mt-1.5 text-[11px] leading-snug text-[color:var(--stg-cream)]/85">{u.body}</p>
                  <p className="stg-label mt-1.5 text-[7px] text-[color:var(--ps-link-dark)]">{u.tools.toUpperCase()}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="stg-label mt-5 text-[9px] text-[color:var(--stg-ink)]/55">
        SAME PLATFORM, DIFFERENT PROMPT + TOOLS PER BUSINESS — DENTIST, SALON, CLINIC, PLUMBER, AGENCY.
      </motion.p>
    </div>
  );
}

/* ========================= slide 5 · chapter — live demo ===================== */

function ChapterSlide() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6 text-center" data-testid="chapter-slide">
      {/* PS Blue band — the palette's chapter moment */}
      <div className="absolute inset-0 bg-[color:var(--stg-yellow)]" aria-hidden />
      <div className="relative">
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="stg-label text-[11px] tracking-[0.3em] text-white/80">
          CHAPTER 02 · LIVE DEMO
        </motion.p>
        <motion.h2 initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="stg-display mt-4 text-6xl uppercase leading-[0.92] text-white sm:text-8xl">
          See it. <span className="text-[color:var(--stg-ink)]">Hear it.</span>
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
          A real appointment call, recorded unedited — handled end-to-end by the agent.
          Then the app itself, clickable.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="stg-label mt-8 inline-flex items-center gap-2 rounded-full border-2 border-[color:var(--stg-ink)] bg-white px-5 py-2.5 text-[10px] text-[color:var(--stg-ink)]">
          <MonitorPlay className="h-4 w-4" aria-hidden /> HEADPHONES RECOMMENDED — PRESS PLAY ON THE NEXT SLIDE
        </motion.div>
      </div>
    </div>
  );
}

/* ========================= slide 8 · how it works (tech) ===================== */

function PipelineSlide() {
  const channels = [
    { icon: Phone, label: 'Phone (SIP)' }, { icon: Radio, label: 'Web voice' },
    { icon: MessageSquareText, label: 'WhatsApp' }, { icon: Send, label: 'Telegram' },
  ];
  const brain = ['LLM + tool calling', 'Conversation memory', 'Your business prompt', 'Responds in <800 ms'];
  const tools = [
    { icon: CalendarPlus, label: 'Google Calendar' }, { icon: Mail, label: 'Gmail' },
    { icon: Sheet, label: 'Google Sheets' }, { icon: Database, label: 'CRM · Webhooks' },
  ];
  return (
    <div className="flex h-full flex-col justify-center px-6 py-6 sm:px-12 lg:px-16">
      <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/55">04 · UNDER THE HOOD</p>
      <h2 className="stg-display mt-2 text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-4xl">
        Three layers. <span className="text-[color:var(--stg-yellow-deep)]">Swap any part, keep the rest.</span>
      </h2>

      <div className="mt-6 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {/* channels */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="rounded-xl border-2 border-[color:var(--stg-ink)] bg-white p-3.5">
          <p className="stg-label flex items-center gap-1.5 text-[8px] text-[color:var(--stg-ink)]/55"><Mic className="h-3 w-3" aria-hidden /> CHANNELS</p>
          <div className="mt-2 space-y-1.5">
            {channels.map((c) => (
              <div key={c.label} className="flex items-center gap-2 rounded-lg border border-[color:var(--stg-ink)]/20 bg-[color:var(--stg-cream-2)] px-2.5 py-1.5">
                <c.icon className="h-3.5 w-3.5 text-[color:var(--stg-ink)]/70" aria-hidden /><span className="text-[12px] font-medium">{c.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
        <ArrowCol delay={0.3} />
        {/* brain */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-xl border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] p-3.5 text-[color:var(--stg-cream)] shadow-[5px_5px_0_0_var(--stg-yellow)]">
          <p className="stg-label flex items-center gap-1.5 text-[8px] text-white/60"><Workflow className="h-3 w-3" aria-hidden /> AGENT BRAIN</p>
          <div className="mt-2 space-y-1.5">
            {brain.map((b, i) => (
              <div key={b} className={cn('rounded-lg px-2.5 py-1.5 text-[12px] font-medium', i === 3 ? 'bg-[color:var(--stg-yellow)] text-white' : 'border border-white/15 bg-white/5')}>
                {b}
              </div>
            ))}
          </div>
        </motion.div>
        <ArrowCol delay={0.55} />
        {/* tools */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }}
          className="rounded-xl border-2 border-[color:var(--stg-ink)] bg-white p-3.5">
          <p className="stg-label flex items-center gap-1.5 text-[8px] text-[color:var(--stg-ink)]/55"><Wrench className="h-3 w-3" aria-hidden /> TOOLS</p>
          <div className="mt-2 space-y-1.5">
            {tools.map((c) => (
              <div key={c.label} className="flex items-center gap-2 rounded-lg border border-[color:var(--stg-ink)]/20 bg-[color:var(--stg-cream-2)] px-2.5 py-1.5">
                <c.icon className="h-3.5 w-3.5 text-[color:var(--stg-ink)]/70" aria-hidden /><span className="text-[12px] font-medium">{c.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* the voice loop — human → STT → LLM → TTS → audio, every turn */}
      <VoiceLoopStrip />
    </div>
  );
}

function ArrowCol({ delay }: { delay: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }} className="hidden items-center justify-center lg:flex" aria-hidden>
      <div className="relative h-0.5 w-8 overflow-hidden bg-[color:var(--stg-ink)]/15">
        <span className="stg-flow-dot absolute top-0 h-full w-2 bg-[color:var(--stg-yellow-deep)]" />
      </div>
      <span className="stg-label ml-1 text-[8px] text-[color:var(--stg-ink)]/40">→</span>
    </motion.div>
  );
}

/* ------------------------- the voice loop (slide 8 band) ---------------------- */

const VOICE_LOOP = [
  { icon: Mic, label: 'Caller speaks', tone: 'light' },
  { icon: Layers, label: 'STT · faster-whisper', tone: 'blue' },
  { icon: Workflow, label: 'LLM brain + tools', tone: 'ink' },
  { icon: Radio, label: 'TTS · CosyVoice', tone: 'blue' },
  { icon: Phone, label: 'Caller hears', tone: 'light' },
] as const;

function LoopArrow({ delay }: { delay: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }} className="hidden items-center justify-center sm:flex" aria-hidden>
      <div className="relative h-0.5 w-5 overflow-hidden bg-[color:var(--stg-ink)]/15">
        <span className="stg-flow-dot absolute top-0 h-full w-1.5 bg-[color:var(--stg-yellow-deep)]" />
      </div>
    </motion.div>
  );
}

/**
 * Every turn of every call, end to end: caller speaks → STT (faster-whisper)
 * → LLM brain + tools → TTS (CosyVoice) → caller hears. Self-hosted STT/TTS,
 * swappable — the point the reference deck's technical slide needed to land.
 */
function VoiceLoopStrip() {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}
      className="mt-4 rounded-xl border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)] p-3" data-testid="voice-loop">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="stg-label text-[8px] text-[color:var(--stg-ink)]/55">EVERY TURN OF EVERY CALL — THE VOICE LOOP</p>
        <p className="stg-label text-[8px] font-semibold text-[color:var(--stg-yellow-deep)]">SELF-HOSTED STT / TTS · SWAPPABLE</p>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-1.5">
        {VOICE_LOOP.map((step, i) => (
          <Fragment key={step.label}>
            {i > 0 && <LoopArrow delay={0.95 + i * 0.08} />}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 + i * 0.08 }}
              className="flex min-w-0 flex-col items-center gap-1.5">
              <div className={cn(
                'grid h-10 w-10 place-items-center rounded-lg border-2 border-[color:var(--stg-ink)] sm:h-11 sm:w-11',
                step.tone === 'blue' && 'bg-[color:var(--stg-yellow)] text-white',
                step.tone === 'ink' && 'bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)]',
                step.tone === 'light' && 'bg-white text-[color:var(--stg-ink)]',
              )}>
                <step.icon className="h-5 w-5" aria-hidden />
              </div>
              <span className="stg-label max-w-[72px] text-center text-[7.5px] leading-tight text-[color:var(--stg-ink)]/70 sm:max-w-none">{step.label}</span>
            </motion.div>
          </Fragment>
        ))}
      </div>
    </motion.div>
  );
}

/* ========================= slide 9 · built from open source ================== */

const STACK = [
  { layer: 'Voice runtime', picks: 'LiveKit Agents · Pipecat', note: 'WebRTC + SIP calls, interruptions, turn detection', license: 'Apache 2.0 / BSD' },
  { layer: 'Ears & mouth', picks: 'faster-whisper · CosyVoice · Fish · KittenTTS', note: 'self-hosted STT/TTS, swappable behind one interface', license: 'MIT / Apache' },
  { layer: 'Brain', picks: 'Any LLM via SDK tool calling', note: 'OpenAI, Anthropic, Gemini — no lock-in', license: 'API' },
  { layer: 'Tools & glue', picks: 'n8n · Activepieces · Composio', note: 'Calendar, Gmail, Sheets with OAuth handled', license: 'MIT / fair-code' },
  { layer: 'Omnichannel inbox', picks: 'Chatwoot (+ official WhatsApp API)', note: 'no unofficial gateways — bans are real', license: 'MIT' },
  { layer: 'Data & dashboard', picks: 'Postgres + Metabase / Grafana', note: 'calls, transcripts, outcomes, costs', license: 'MIT / AGPL' },
];

function StackSlide() {
  return (
    <div className="flex h-full flex-col justify-center px-6 py-6 sm:px-12 lg:px-20">
      <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/55">05 · BUILT FROM OPEN SOURCE — 5 LAYERS, ALL SWAPPABLE</p>
      <h2 className="stg-display mt-2 text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-4xl">
        Every layer is free to run. <span className="text-[color:var(--stg-yellow-deep)]">We sell the glue.</span>
      </h2>
      <div className="mt-5 space-y-1.5">
        {STACK.map((s, i) => (
          <motion.div key={s.layer} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
            className="grid grid-cols-[92px_1fr] items-center gap-3 rounded-lg border-2 border-[color:var(--stg-ink)]/30 bg-white p-2.5 sm:grid-cols-[130px_1fr_1fr_88px]">
            <span className="stg-label text-[8px] text-[color:var(--stg-ink)]/60">{s.layer.toUpperCase()}</span>
            <span className="text-[12.5px] font-semibold leading-tight text-[color:var(--stg-ink)]">{s.picks}</span>
            <span className="hidden text-[11px] leading-snug text-[color:var(--stg-ink)]/60 sm:block">{s.note}</span>
            <span className="hidden justify-self-end rounded-full border border-[color:var(--stg-ink)]/30 px-2 py-0.5 text-[8px] font-semibold text-[color:var(--stg-ink)]/70 sm:block">{s.license}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ========================= slide 10 · build plan & timeline ================== */

const MILESTONES = [
  { label: 'Working prototype', span: 'W1–2', w: 14, note: 'one agent · self-hosted TTS · 1–2 tools' },
  { label: 'Client-ready MVP', span: 'W4–8', w: 30, note: 'phone number · calendar/email/sheets · dashboard' },
  { label: 'Reusable platform', span: 'M3–5', w: 52, note: 'tenant configs · templates · logging · alerts' },
  { label: 'New client after', span: 'M5+', w: 12, note: 'days to 2 weeks per onboard' },
];

const BUILD_ORDER = ['Define tools as functions', 'Prove on Telegram (text)', 'Add voice, same brain', 'WhatsApp as thin adapter', 'Postgres + dashboard', 'Pilot with 1–2 businesses'];

function TimelineSlide() {
  return (
    <div className="flex h-full flex-col justify-center px-6 py-6 sm:px-12 lg:px-20">
      <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/55">06 · BUILD PLAN & TIMELINE</p>
      <h2 className="stg-display mt-2 text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-4xl">
        One developer. AI-assisted. <span className="text-[color:var(--stg-yellow-deep)]">A realistic clock.</span>
      </h2>
      <div className="mt-6 space-y-3">
        {MILESTONES.map((m, i) => (
          <div key={m.label}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-[13px] font-semibold text-[color:var(--stg-ink)] sm:text-sm">{m.label}</p>
              <p className="stg-label text-[9px] text-[color:var(--stg-yellow-deep)]">{m.span}</p>
            </div>
            <div className="mt-1 h-6 overflow-hidden rounded-md border-2 border-[color:var(--stg-ink)]/25 bg-white">
              <motion.div initial={{ width: 0 }} animate={{ width: `${m.w}%` }} transition={{ delay: 0.15 + i * 0.16, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className={cn('flex h-full items-center px-2', i === 2 ? 'bg-[color:var(--stg-ink)]' : 'bg-[color:var(--stg-yellow)]')}>
                <span className={cn('stg-label whitespace-nowrap text-[7px]', i === 2 ? 'text-white/80' : 'text-white')}>{m.note.toUpperCase()}</span>
              </motion.div>
            </div>
          </div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-5">
        <p className="stg-label text-[8px] text-[color:var(--stg-ink)]/55">THE BUILD ORDER</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {BUILD_ORDER.map((b, i) => (
            <span key={b} className="stg-label inline-flex items-center gap-1.5 rounded-full border border-[color:var(--stg-ink)]/35 bg-white px-2.5 py-1.5 text-[8px] text-[color:var(--stg-ink)]/80">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-[color:var(--stg-yellow)] text-[7px] font-bold text-white">{i + 1}</span>
              {b.toUpperCase()}
            </span>
          ))}
        </div>
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="stg-label mt-4 text-[8px] text-[color:var(--stg-ink)]/50">
        GUARDRAILS: &lt;800 MS LATENCY BUDGET · CONFIRM-BEFORE-WRITE · PER-CLIENT OAUTH · RECORDING CONSENT
      </motion.p>
    </div>
  );
}

/* ========================= slide 11 · business & impact ====================== */

function BusinessSlide() {
  const money = [
    'Build fee per client + monthly hosting & maintenance (recurring)',
    'Self-hosted voice → per-minute cost collapses vs hosted platforms',
    'One codebase → every new client is cheaper to onboard than the last',
  ];
  const clients = [
    'Fewer missed calls — every call answered 24/7',
    'Faster responses and automated booking + follow-up',
    'Lower staffing cost for routine inquiries',
  ];
  const measure = ['answer rate', 'booking conversion', 'avg response time', 'cost per call', 'staff hours saved'];
  return (
    <div className="flex h-full flex-col justify-center px-6 py-6 sm:px-12 lg:px-20">
      <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/55">07 · WHY THIS IS A BUSINESS</p>
      <h2 className="stg-display mt-2 text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-4xl">
        Custom-software pricing. <span className="text-[color:var(--stg-yellow-deep)]">Open-source costs.</span>
      </h2>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border-2 border-[color:var(--stg-ink)] bg-white p-4 shadow-[5px_5px_0_0_var(--stg-ink)]">
          <p className="stg-label flex items-center gap-2 text-[9px] text-[color:var(--stg-ink)]/60"><Wallet className="h-3.5 w-3.5" aria-hidden /> HOW WE MAKE MONEY</p>
          <ul className="mt-2.5 space-y-2">
            {money.map((m) => <li key={m} className="flex gap-2 text-[12px] leading-snug text-[color:var(--stg-ink)]/85"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--stg-yellow)]" aria-hidden />{m}</li>)}
          </ul>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border-2 border-[color:var(--stg-ink)] bg-white p-4 shadow-[5px_5px_0_0_var(--stg-ink)]">
          <p className="stg-label flex items-center gap-2 text-[9px] text-[color:var(--stg-ink)]/60"><Store className="h-3.5 w-3.5" aria-hidden /> WHAT CLIENTS GET</p>
          <ul className="mt-2.5 space-y-2">
            {clients.map((m) => <li key={m} className="flex gap-2 text-[12px] leading-snug text-[color:var(--stg-ink)]/85"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--stg-yellow)]" aria-hidden />{m}</li>)}
          </ul>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="rounded-xl border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] p-4 text-[color:var(--stg-cream)] shadow-[5px_5px_0_0_var(--stg-yellow)]">
          <p className="stg-label flex items-center gap-2 text-[9px] text-white/60"><Timer className="h-3.5 w-3.5" aria-hidden /> WHAT WE MEASURE & REPORT</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {measure.map((m) => (
              <span key={m} className="stg-label rounded-full border border-white/20 bg-white/5 px-2.5 py-1.5 text-[8px] text-white/85">{m.toUpperCase()}</span>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-snug text-white/70">Every client sees the numbers — that’s the retention engine.</p>
        </motion.div>
      </div>
    </div>
  );
}

/* ============================== slide 12 · close ============================= */

function CloseSlide() {
  const chips = ['Works 24/7', 'Books while you sleep', 'Your data, your dashboard', 'Open-source core'];
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        className="grid h-16 w-16 place-items-center rounded-full border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] text-white shadow-[5px_5px_0_0_var(--stg-ink)]">
        <Phone className="h-8 w-8" aria-hidden />
      </motion.div>
      <h2 className="stg-display mt-5 max-w-3xl text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-5xl">
        Never miss <span className="text-[color:var(--stg-yellow-deep)]">another call.</span>
      </h2>
      <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
        {chips.map((c, i) => (
          <motion.span key={c} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
            className="rounded-full border-2 border-[color:var(--stg-ink)] bg-white px-3.5 py-2 text-[11px] font-medium">{c}</motion.span>
        ))}
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="stg-label mt-6 text-[10px] text-[color:var(--stg-ink)]/70">
        ★ LET’S PILOT IT WITH ONE BUSINESS THIS MONTH.
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/demo" className="stg-label inline-flex h-12 items-center gap-2 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] px-6 text-[11px] text-white shadow-[5px_5px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5">
          <Play className="h-4 w-4" aria-hidden /> REPLAY THE LIVE DEMO
        </Link>
        <Link href="/create" className="stg-label inline-flex h-12 items-center gap-2 border-2 border-[color:var(--stg-ink)]/40 bg-white px-6 text-[11px] text-[color:var(--stg-ink)] transition-colors hover:border-[color:var(--stg-ink)]">
          BUILD A DECK LIKE THIS →
        </Link>
      </motion.div>
      <p className="stg-label mt-8 text-[8px] text-[color:var(--stg-ink)]/40">≈ 4:00 — THANK YOU · PITCH RUNTIME ≈ 4 MIN</p>
    </div>
  );
}

/* ============================== slide 7 · demo =============================== */

function DemoSlide() {
  return (
    <div className="flex h-full flex-col px-4 py-4 sm:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/55">★ TRY THE PRODUCT <span className="ml-2 text-[color:var(--stg-ink)]/40">(INTERACTIVE — CLICK “CALL LAYLA”)</span></p>
        <Link href="/demo" className="stg-label text-[9px] text-[color:var(--stg-yellow-deep)] underline-offset-2 hover:underline">OPEN FULLSCREEN →</Link>
      </div>
      <div className="mt-3 min-h-0 flex-1"><DemoApp compact /></div>
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
    { id: 'title', label: 'COVER — AI POWERED VOICE AGENT', budget: 10, node: <TitleSlide onNext={() => go(1)} /> },
    { id: 'problem', label: 'THE PROBLEM', budget: 20, node: <ProblemSlide /> },
    { id: 'solution', label: 'THE SOLUTION', budget: 25, node: <SolutionSlide /> },
    { id: 'hats', label: 'ONE AGENT, MANY HATS', budget: 20, node: <UseCasesSlide /> },
    { id: 'chapter', label: 'CHAPTER — LIVE DEMO', budget: 5, node: <ChapterSlide /> },
    { id: 'live', label: '★ DEMO: THE RECORDED CALL', budget: 115, node: <ConversationSlide /> },
    { id: 'demo', label: '★ DEMO: TRY THE APP', budget: 25, node: <DemoSlide /> },
    { id: 'how', label: 'HOW IT WORKS', budget: 25, node: <PipelineSlide /> },
    { id: 'stack', label: 'BUILT FROM OPEN SOURCE', budget: 20, node: <StackSlide /> },
    { id: 'time', label: 'BUILD PLAN & TIMELINE', budget: 20, node: <TimelineSlide /> },
    { id: 'business', label: 'BUSINESS & IMPACT', budget: 15, node: <BusinessSlide /> },
    { id: 'close', label: 'CLOSING — THE ASK', budget: 10, node: <CloseSlide /> },
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
      const clamped = Math.max(0, Math.min(SLIDE_COUNT - 1, next));
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

  // touch swipe — mobile navigation alongside the on-screen arrows
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? start) - start;
    if (Math.abs(dx) > 56) go(index + (dx < 0 ? 1 : -1));
  };

  const over = elapsed > TARGET_SECONDS;
  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div ref={stageRef} className="ps-scope fixed inset-0 flex flex-col bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)]" data-testid="pitch-deck">
      {/* top chrome */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] px-4 text-[color:var(--stg-cream)] sm:px-6">
        <Link href="/" className="stg-label text-[9px] text-white/60 transition-colors hover:text-white" aria-label="Back to DeckForge home">← DECKFORGE</Link>
        <span className="stg-label hidden text-[9px] text-[color:var(--ps-link-dark)] sm:block">SHOWCASE DECK · AI POWERED VOICE AGENT</span>
        <span className={cn('stg-label ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] tabular-nums', over ? 'border-[color:var(--ps-warn)] text-[color:var(--ps-warn)]' : 'border-white/25 text-white/70')} data-testid="pitch-timer">
          <Clock className="h-3 w-3" aria-hidden /> {mm}:{ss} / 4:00 {over ? '· OVER' : ''}
        </span>
        <button onClick={() => { try { if (document.fullscreenElement) void document.exitFullscreen(); else void stageRef.current?.requestFullscreen(); } catch { /* denied */ } }}
          aria-label="Toggle fullscreen" className="grid h-8 w-8 place-items-center text-white/60 transition-colors hover:text-white">
          <Maximize className="h-4 w-4" aria-hidden />
        </button>
      </header>

      {/* stage — swipe left/right on touch devices; arrows + dots below */}
      <main
        className="relative min-h-0 flex-1 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
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
          className="grid h-10 w-10 place-items-center border-2 border-[color:var(--stg-ink)] bg-white transition-all hover:bg-[color:var(--stg-yellow)] hover:text-white disabled:opacity-30">
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
          className="grid h-10 w-10 place-items-center border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] text-white transition-all hover:-translate-y-0.5 disabled:opacity-30">
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </footer>
    </div>
  );
}
