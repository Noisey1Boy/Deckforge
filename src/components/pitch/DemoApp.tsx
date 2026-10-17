'use client';

/**
 * INTERACTIVE DEMO — the app we're proposing, as a clickable mock.
 * "Call Layla" → ringing → the real recorded call plays with a live
 * transcript + agent tool trace → booking summary + dashboard, plus a
 * simulated tool playground (check_availability / create_event / send_email).
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarCheck, CalendarSearch, CheckCheck, FileText, Globe, Mail, MessageSquare,
  Phone, PhoneCall, PhoneOff, RotateCcw, Send, TerminalSquare, UserPlus,
} from 'lucide-react';
import { ACTIONS, AUDIO_SRC, TURNS, actionIndexAt, turnIndexAt } from '@/data/pitch/conversation';
import { cn } from '@/lib/utils';

const ACTION_ICONS = [CheckCheck, UserPlus, CalendarSearch, CalendarCheck, Mail, MessageSquare];
type Phase = 'idle' | 'ringing' | 'live' | 'done';
type Channel = 'phone' | 'whatsapp' | 'telegram' | 'web';

const CHANNELS: { id: Channel; label: string; icon: typeof Phone }[] = [
  { id: 'phone', label: 'Phone', icon: Phone },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { id: 'telegram', label: 'Telegram', icon: Send },
  { id: 'web', label: 'Web voice', icon: Globe },
];

const TRACE_STEPS = [
  { icon: CheckCheck, label: 'Read-back confirmation', code: 'confirm(details)' },
  { icon: UserPlus, label: 'Customer record saved', code: 'upsert_contact("Robert John")' },
  { icon: CalendarSearch, label: 'Checking calendar', code: 'check_availability("tomorrow")' },
  { icon: CalendarCheck, label: 'Booking confirmed', code: 'create_event("Dr. Pegel · 8:00 AM")' },
  { icon: Mail, label: 'Confirmation email', code: 'send_email(robertjohn123@yahoo.com)' },
  { icon: MessageSquare, label: 'SMS reminder scheduled', code: 'send_sms("+011 5131 1…")' },
];

export function DemoApp({ compact = false }: { compact?: boolean }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [channel, setChannel] = useState<Channel>('phone');
  const [t, setT] = useState(0);
  const [tab, setTab] = useState<'trace' | 'tools' | 'dashboard'>('trace');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);
  const feedRef = useRef<HTMLDivElement | null>(null);

  // ringing → live
  useEffect(() => {
    if (phase !== 'ringing') return;
    const id = setTimeout(() => {
      setPhase('live');
      setTab('trace');
      void audioRef.current?.play().catch(() => { /* gesture policies */ });
    }, 1500);
    return () => clearTimeout(id);
  }, [phase]);

  // playback clock
  useEffect(() => {
    const tick = () => {
      const a = audioRef.current;
      if (a && phase === 'live') setT(a.currentTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const idx = turnIndexAt(t);
  const actIdx = actionIndexAt(t);
  const visible = idx < 0 ? [] : TURNS.slice(Math.max(0, idx - 5), idx + 1);

  const call = () => {
    setT(0);
    setPhase('ringing');
  };
  const hangup = () => {
    audioRef.current?.pause();
    setPhase('done');
    setTab('dashboard');
  };

  useEffect(() => {
    if (phase !== 'live') return;
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [idx, phase]);

  const ChannelIcon = (CHANNELS.find((c) => c.id === channel) ?? CHANNELS[0]).icon;

  return (
    <div className={cn('grid w-full gap-3', compact ? 'lg:grid-cols-[300px_1fr]' : 'lg:grid-cols-[340px_1fr]')} data-testid="demo-app">
      <audio ref={audioRef} src={AUDIO_SRC} preload="auto" onEnded={() => { setPhase('done'); setTab('dashboard'); }} aria-label="Recorded call audio (transcript is captioned in the chat feed)" />

      {/* ============ the console "device" ============ */}
      <div className="flex flex-col overflow-hidden rounded-xl border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)] shadow-[6px_6px_0_0_var(--stg-yellow)]">
        <div className="flex items-center gap-2 border-b-2 border-white/10 px-3 py-2">
          <ChannelIcon className="h-3.5 w-3.5 text-[color:var(--ps-link-dark)]" aria-hidden />
          <span className="stg-label text-[9px]">{CHANNELS.find((c) => c.id === channel)?.label.toUpperCase()} · DOWNTOWN DENTIST</span>
          <span className={cn('stg-label ml-auto flex items-center gap-1 text-[8px]', phase === 'live' ? 'text-emerald-400' : 'text-white/40')}>
            <span className={cn('h-1.5 w-1.5 rounded-full', phase === 'live' ? 'animate-pulse bg-emerald-400' : 'bg-white/30')} aria-hidden />
            {phase === 'live' ? 'LIVE' : phase === 'ringing' ? 'RINGING' : phase === 'done' ? 'ENDED' : 'OFFLINE'}
          </span>
        </div>

        {/* channel switcher */}
        <div className="flex gap-1 border-b-2 border-white/10 px-2 py-1.5" role="tablist" aria-label="Channels">
          {CHANNELS.map((c) => (
            <button key={c.id} role="tab" aria-selected={channel === c.id} onClick={() => setChannel(c.id)}
              className={cn('stg-label flex items-center gap-1 rounded px-2 py-1.5 text-[8px] transition-colors',
                channel === c.id ? 'bg-[color:var(--stg-yellow)] text-white' : 'text-white/50 hover:text-white')}>
              <c.icon className="h-3 w-3" aria-hidden /> {c.label}
            </button>
          ))}
        </div>

        {/* body */}
        <div className="relative min-h-[300px] flex-1 bg-[color:var(--stg-cream)] p-3 text-[color:var(--stg-ink)] sm:min-h-[340px]">
          {phase === 'idle' && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-[color:var(--stg-ink)] bg-white p-1">
                <img src="/avatars/ai-layla.jpg" alt="Layla — the AI receptionist" className="h-full w-full rounded-full object-cover object-top" draggable={false} />
              </div>
              <div>
                <p className="stg-display text-lg uppercase">Layla</p>
                <p className="stg-label mt-1 text-[9px] text-[color:var(--stg-ink)]/55">AI RECEPTIONIST · ANSWERS IN ~700 MS</p>
              </div>
              <button onClick={call} data-testid="demo-call"
                className="stg-label inline-flex h-12 items-center gap-2 rounded-full border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] px-6 text-[11px] text-white shadow-[4px_4px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5">
                <PhoneCall className="h-4 w-4" aria-hidden /> CALL LAYLA
              </button>
              <p className="stg-label text-[8px] text-[color:var(--stg-ink)]/40">SIMULATED UI · REAL RECORDED VOICE</p>
            </div>
          )}

          {phase === 'ringing' && (
            <div className="flex h-full flex-col items-center justify-center gap-5">
              <div className="relative grid h-20 w-20 place-items-center">
                <span className="absolute inset-0 animate-ping rounded-full border-2 border-[color:var(--stg-ink)]/40" aria-hidden />
                <span className="absolute inset-0 animate-ping rounded-full border-2 border-[color:var(--stg-ink)]/25 [animation-delay:0.4s]" aria-hidden />
                <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] text-white">
                  <PhoneCall className="h-7 w-7 animate-bounce" aria-hidden />
                </div>
              </div>
              <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/60">CONNECTING TO LAYLA…</p>
            </div>
          )}

          {phase === 'live' && (
            <div className="flex h-full min-h-0 flex-col" data-testid="demo-live">
              <div ref={feedRef} className="stg-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1" aria-live="polite" aria-label="Live call transcript — the conversation is captioned here in sync with the audio">
                {visible.map((turn, vi) => {
                  const mine = turn.speaker === 'layla';
                  const isCurrent = idx - Math.max(0, idx - 5) === vi;
                  return (
                    <motion.div key={`${turn.at}-${turn.speaker}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={cn('flex', mine ? 'justify-start' : 'justify-end')}>
                      <div className={cn('max-w-[88%] rounded-xl border-2 px-2.5 py-1.5 text-[11px] leading-snug',
                        mine ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)]' : 'border-[color:var(--stg-ink)]/25 bg-white',
                        isCurrent && (mine ? 'shadow-[3px_3px_0_0_var(--stg-yellow)]' : 'shadow-[3px_3px_0_0_var(--stg-ink)]'))}>
                        <span className={cn('stg-label mr-2 text-[8px]', mine ? 'text-[color:var(--ps-link-dark)]' : 'text-[color:var(--stg-ink)]/50')}>{mine ? 'LAYLA' : 'YOU'}</span>
                        {turn.text}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-2 border-t-2 border-[color:var(--stg-ink)]/10 pt-2">
                <div className="flex h-6 flex-1 items-end gap-0.5" aria-hidden>
                  {Array.from({ length: 28 }).map((_, i) => (
                    <span key={i} className="w-1 flex-1 rounded-full bg-[color:var(--stg-ink)]/70"
                      style={{ height: `${20 + ((i * 4523) % 80)}%`, animation: `stg-wave 0.7s ease-in-out ${(i % 7) * 0.09}s infinite alternate` }} />
                  ))}
                </div>
                <button onClick={hangup} aria-label="End the call"
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-[color:var(--stg-ink)] bg-red-500 text-white shadow-[3px_3px_0_0_var(--stg-ink)]">
                  <PhoneOff className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          )}

          {phase === 'done' && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center" data-testid="demo-done">
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="grid h-16 w-16 place-items-center rounded-full border-2 border-[color:var(--stg-ink)] bg-emerald-500 text-white shadow-[4px_4px_0_0_var(--stg-ink)]">
                <CalendarCheck className="h-8 w-8" aria-hidden />
              </motion.div>
              <div className="rounded-xl border-2 border-[color:var(--stg-ink)] bg-white px-4 py-3 shadow-[4px_4px_0_0_var(--stg-yellow)]">
                <p className="stg-label text-[8px] text-[color:var(--stg-ink)]/55">APPOINTMENT BOOKED</p>
                <p className="stg-display mt-1 text-base uppercase leading-tight">Dr. Pegel · Tomorrow 8:00 AM</p>
                <p className="mt-1 text-[11px] text-[color:var(--stg-ink)]/70"> robertjohn123@yahoo.com · full checkup + toothache · 1 hour</p>
              </div>
              <button onClick={call} className="stg-label inline-flex h-10 items-center gap-2 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] px-4 text-[10px] text-white shadow-[3px_3px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden /> RUN THE CALL AGAIN
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============ right panel: trace / tools / dashboard ============ */}
      <div className="flex min-h-0 flex-col rounded-xl border-2 border-[color:var(--stg-ink)] bg-white" >
        <div className="flex gap-1 border-b-2 border-[color:var(--stg-ink)]/10 p-2" role="tablist" aria-label="Demo panels">
          {([['trace', 'AGENT TRACE', TerminalSquare], ['tools', 'TOOL PLAYGROUND', FileText], ['dashboard', 'DASHBOARD', Globe]] as const).map(([id, label, Icon]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={cn('stg-label inline-flex items-center gap-1.5 border-2 px-2.5 py-2 text-[9px] transition-colors',
                tab === id ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--ps-link-dark)]' : 'border-transparent text-[color:var(--stg-ink)]/55 hover:text-[color:var(--stg-ink)]')}>
              <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
            </button>
          ))}
          {phase !== 'idle' && tab === 'trace' && (
            <button onClick={() => { audioRef.current?.pause(); setPhase('idle'); setT(0); }} className="stg-label ml-auto text-[9px] text-[color:var(--stg-ink)]/50 hover:text-[color:var(--stg-ink)]">RESET</button>
          )}
        </div>

        <div className="stg-scroll min-h-[260px] flex-1 overflow-y-auto p-3 sm:min-h-[320px]">
          {tab === 'trace' && (
            <div className="space-y-2" data-testid="demo-trace" aria-live="polite">
              <p className="stg-label text-[8px] text-[color:var(--stg-ink)]/50">WHAT LAYLA DOES WHILE SHE TALKS — EVERY STEP IS A REAL TOOL CALL</p>
              {TRACE_STEPS.map((s, i) => {
                const fired = actIdx >= i && (phase === 'live' || phase === 'done');
                const Icon = s.icon;
                return (
                  <motion.div key={s.code} animate={fired ? { x: [6, 0] } : {}} className={cn('flex items-center gap-2.5 rounded-lg border-2 p-2.5 transition-all duration-300',
                    fired ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)]' : 'border-dashed border-[color:var(--stg-ink)]/15 opacity-40')}>
                    <Icon className={cn('h-4 w-4 shrink-0', fired ? 'text-[color:var(--stg-ink)]' : 'text-[color:var(--stg-ink)]/30')} aria-hidden />
                    <div className="min-w-0">
                      <p className="stg-label text-[9px]">{s.label}</p>
                      <code className="block truncate font-mono text-[10px] text-[color:var(--stg-ink)]/70">{fired ? s.code : 'waiting…'}</code>
                    </div>
                    {fired && <CheckCheck className="ml-auto h-4 w-4 shrink-0 text-emerald-600" aria-hidden />}
                  </motion.div>
                );
              })}
              {phase === 'idle' && <p className="stg-label pt-2 text-center text-[9px] text-[color:var(--stg-ink)]/40">Press “CALL LAYLA” — the trace lights up in sync with the real audio.</p>}
            </div>
          )}

          {tab === 'tools' && <ToolPlayground />}

          {tab === 'dashboard' && <MiniDashboard />}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- tool playground ------------------------------ */

const SLOT_LINES = '{ ok: true, date: "tomorrow", slots: ["08:00","11:30","14:00"] }';
const EVENT_LINES = '{ ok: true, event: "Dr. Pegel — Robert John", when: "tomorrow 08:00–09:00", invite: "sent → robertjohn123@yahoo.com" }';
const MAIL_LINES = '{ ok: true, to: "robertjohn123@yahoo.com", subject: "Your appointment at Downtown Dentist", attached: "calendar-invite.ics" }';

function ToolPlayground() {
  const [out, setOut] = useState<{ name: string; body: string }[]>([]);
  const [slots, setSlots] = useState<string[]>(['08:00', '11:30', '14:00']);

  const run = (name: string, body: string, after?: () => void) => {
    setOut((o) => [...o.slice(-2), { name, body }]);
    after?.();
  };

  return (
    <div className="space-y-3" data-testid="demo-tools">
      <p className="stg-label text-[8px] text-[color:var(--stg-ink)]/50">THE TOOLS EVERY CLIENT GETS — CLICK ONE, SEE THE (SIMULATED) RESPONSE THE AGENT ACTS ON</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => run('check_availability()', SLOT_LINES)}
          className="stg-label inline-flex h-10 items-center gap-1.5 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)] px-3 text-[9px] shadow-[3px_3px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5">
          <CalendarSearch className="h-3.5 w-3.5" aria-hidden /> check_availability
        </button>
        <button onClick={() => run('create_event()', EVENT_LINES, () => setSlots(['11:30', '14:00']))}
          className="stg-label inline-flex h-10 items-center gap-1.5 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)] px-3 text-[9px] shadow-[3px_3px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5">
          <CalendarCheck className="h-3.5 w-3.5" aria-hidden /> create_event
        </button>
        <button onClick={() => run('send_email()', MAIL_LINES)}
          className="stg-label inline-flex h-10 items-center gap-1.5 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)] px-3 text-[9px] shadow-[3px_3px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5">
          <Mail className="h-3.5 w-3.5" aria-hidden /> send_email
        </button>
      </div>

      {slots.length > 0 && (
        <div className="rounded-lg border-2 border-[color:var(--stg-ink)]/15 p-2.5">
          <p className="stg-label text-[8px] text-[color:var(--stg-ink)]/50">TOMORROW — LIVE SLOTS</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {slots.map((s) => (
              <span key={s} className="rounded border border-[color:var(--stg-ink)]/30 px-2 py-1 font-mono text-[10px]">{s}</span>
            ))}
            {slots.length === 0 && <span className="stg-label text-[9px] text-emerald-700">fully booked by the agent 🎉</span>}
          </div>
        </div>
      )}

      {out.map((o, i) => (
        <motion.div key={`${o.name}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-lg border-2 border-[color:var(--stg-ink)]">
          <p className="stg-label border-b-2 border-[color:var(--stg-ink)]/10 bg-[color:var(--stg-cream-2)] px-2.5 py-1.5 text-[8px]">→ {o.name}</p>
          <pre className="overflow-x-auto whitespace-pre-wrap p-2.5 font-mono text-[10px] leading-relaxed text-[color:var(--stg-ink)]/85">{o.body}</pre>
        </motion.div>
      ))}
      {out.length === 0 && <p className="stg-label py-4 text-center text-[9px] text-[color:var(--stg-ink)]/40">No calls yet — try one above.</p>}
    </div>
  );
}

/* -------------------------------- dashboard tab ------------------------------- */

function MiniDashboard() {
  const stats = [
    { label: 'ANSWER RATE', value: '100%', note: '24/7 — no hold music' },
    { label: 'BOOKINGS TODAY', value: '1', note: 'Robert · 8:00 AM' },
    { label: 'AVG RESPONSE', value: '~700 ms', note: 'streaming STT→LLM→TTS' },
    { label: 'COST / CALL', value: '$0.19', note: 'self-hosted — illustrative' },
  ];
  return (
    <div className="space-y-3" data-testid="demo-dashboard">
      <p className="stg-label text-[8px] text-[color:var(--stg-ink)]/50">EVERY CLIENT GETS THIS VIEW — CALLS, TRANSCRIPTS, OUTCOMES, COSTS. (DEMO DATA IS ILLUSTRATIVE)</p>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)] p-3">
            <p className="stg-label text-[8px] text-[color:var(--stg-ink)]/55">{s.label}</p>
            <p className="stg-display mt-1 text-xl uppercase text-[color:var(--stg-ink)]">{s.value}</p>
            <p className="mt-0.5 text-[10px] text-[color:var(--stg-ink)]/60">{s.note}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border-2 border-[color:var(--stg-ink)] p-3">
        <p className="stg-label text-[8px] text-[color:var(--stg-ink)]/55">LATEST TRANSCRIPT — FLAGGED ENTITIES</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[['NAME', 'Robert John'], ['EMAIL', 'robertjohn123@yahoo.com'], ['PHONE', '011 5131 1…'], ['INTENT', 'emergency + full checkup'], ['SLOT', 'tomorrow 08:00'], ['STATUS', 'booked ✅']].map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--stg-ink)]/25 bg-white px-2.5 py-1 text-[10px]">
              <span className="stg-label text-[7px] text-[color:var(--stg-ink)]/50">{k}</span> {v}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
