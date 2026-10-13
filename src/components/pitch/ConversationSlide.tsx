'use client';

/**
 * THE CENTERPIECE SLIDE — a human (Robert) and the robot agent (Layla)
 * "having a conversation": the real recorded call plays, speech bubbles
 * appear in sync (timeline computed from the ASR transcript + silence-aligned
 * cut math), avatars animate while their side talks, and tool moments pop
 * as action chips.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarCheck, CalendarSearch, CheckCheck, Gauge, Mail, MessageSquare, Pause, Play, RotateCcw, UserPlus } from 'lucide-react';
import {
  ACTIONS, AUDIO_SRC, CUT_DURATION, TURNS, actionIndexAt, turnIndexAt, type Speaker,
} from '@/data/pitch/conversation';
import { cn } from '@/lib/utils';

const ACTION_ICONS = [CheckCheck, UserPlus, CalendarSearch, CalendarCheck, Mail, MessageSquare];

/* ---------------------------------- avatars ---------------------------------- */

function RobotAvatar({ talking, active }: { talking: boolean; active: boolean }) {
  return (
    <motion.div
      animate={talking ? { y: [0, -3, 0] } : { y: 0 }}
      transition={talking ? { repeat: Infinity, duration: 0.5, ease: 'easeInOut' } : {}}
      className={cn(
        'relative grid h-16 w-16 place-items-center rounded-2xl border-2 transition-colors sm:h-20 sm:w-20',
        active ? 'border-[color:var(--stg-yellow)] bg-[color:var(--stg-ink)] shadow-[4px_4px_0_0_var(--stg-yellow)]' : 'border-[color:var(--stg-ink)]/25 bg-[color:var(--stg-ink)]/5',
      )}
      aria-label="Layla — the AI receptionist"
    >
      <svg viewBox="0 0 64 64" className="h-10 w-10 sm:h-12 sm:w-12" role="img" aria-hidden>
        <line x1="32" y1="4" x2="32" y2="12" stroke="currentColor" strokeWidth="2.5" className={active ? 'text-[color:var(--stg-yellow)]' : 'text-[color:var(--stg-ink)]/40'} />
        <circle cx="32" cy="4" r="3" fill="currentColor" className={cn('text-[color:var(--stg-yellow)]', talking && 'animate-pulse')} />
        <rect x="12" y="12" width="40" height="34" rx="10" className={active ? 'fill-[color:var(--stg-ink)]' : 'fill-[color:var(--stg-ink)]/25'} />
        <circle cx="24" cy="26" r="3.4" className="fill-[color:var(--stg-cream)] stg-blink" />
        <circle cx="40" cy="26" r="3.4" className="fill-[color:var(--stg-cream)] stg-blink" />
        {/* speaker-grill mouth — bars bounce while talking */}
        <g className={active ? 'text-[color:var(--stg-yellow)]' : 'text-[color:var(--stg-cream)]/50'}>
          {[24, 29, 34, 39].map((x, i) => (
            <rect key={x} x={x - 1.4} y={30} width="2.8" height="8" rx="1.4" fill="currentColor"
              className={talking ? undefined : 'opacity-60'}
              style={talking ? { transformOrigin: `${x}px 34px`, animation: `stg-mouth 0.42s ease-in-out ${i * 0.09}s infinite alternate` } : undefined}
            />
          ))}
        </g>
      </svg>
      <span className="stg-label absolute -bottom-5 text-[8px] text-[color:var(--stg-ink)]/60">LAYLA · AI</span>
    </motion.div>
  );
}

function HumanAvatar({ talking, active }: { talking: boolean; active: boolean }) {
  return (
    <motion.div
      animate={talking ? { y: [0, -2.5, 0] } : { y: 0 }}
      transition={talking ? { repeat: Infinity, duration: 0.55, ease: 'easeInOut' } : {}}
      className={cn(
        'relative grid h-16 w-16 place-items-center rounded-2xl border-2 bg-white transition-colors sm:h-20 sm:w-20',
        active ? 'border-[color:var(--stg-ink)] shadow-[4px_4px_0_0_var(--stg-ink)]' : 'border-[color:var(--stg-ink)]/25',
      )}
      aria-label="Robert — the caller"
    >
      <svg viewBox="0 0 64 64" className="h-10 w-10 sm:h-12 sm:w-12" role="img" aria-hidden>
        <circle cx="32" cy="26" r="14" className="fill-[#f2c9a4]" />
        <path d="M18 24c0-8 6-13 14-13s14 5 14 13c0 2-1 3-1 3 0-6-5-9-13-9s-13 3-13 9c0 0-1-1-1-3z" className="fill-[color:var(--stg-ink)]" />
        <circle cx="26" cy="26" r="1.8" className="fill-[color:var(--stg-ink)]" />
        <circle cx="38" cy="26" r="1.8" className="fill-[color:var(--stg-ink)]" />
        {/* mouth scales while talking */}
        <ellipse cx="32" cy="33" rx="5" ry={talking ? 3.4 : 1.2} className="fill-[color:var(--stg-ink)]"
          style={talking ? { transformOrigin: '32px 33px', animation: 'stg-talk 0.38s ease-in-out infinite alternate' } : undefined}
        />
        <path d="M14 60c2-10 9-15 18-15s16 5 18 15z" className="fill-[color:var(--stg-yellow)]" />
      </svg>
      <span className="stg-label absolute -bottom-5 text-[8px] text-[color:var(--stg-ink)]/60">ROBERT · CALLER</span>
    </motion.div>
  );
}

/* --------------------------------- the slide --------------------------------- */

export function ConversationSlide() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fast, setFast] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const a = audioRef.current;
      if (a) setT(a.currentTime);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      audioRef.current?.pause();
    };
  }, []);

  const idx = turnIndexAt(t);
  const actIdx = actionIndexAt(t);
  const activeSpeaker: Speaker | null = idx < 0 ? null : TURNS[idx].speaker;
  const visible = idx < 0 ? [] : TURNS.slice(Math.max(0, idx - 4), idx + 1);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [idx]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else {
      if (ended) { a.currentTime = 0; setEnded(false); }
      void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const restart = () => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0; setT(0); setEnded(false);
    void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const pct = Math.min(100, (t / CUT_DURATION) * 100);

  return (
    <div className="flex h-full flex-col px-4 py-3 sm:px-8" data-testid="conversation-slide">
      <audio ref={audioRef} src={AUDIO_SRC} preload="auto" onEnded={() => { setPlaying(false); setEnded(true); }} onRateChange={(e) => setFast((e.target as HTMLAudioElement).playbackRate > 1.05)} />

      {/* header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="stg-label flex items-center gap-2 text-[10px] text-[color:var(--stg-ink)]/60">
          <span className="inline-block h-2 w-2 animate-pulse bg-[color:var(--stg-yellow)]" aria-hidden />
          LIVE RECORDING · DOWNTOWN DENTIST
        </p>
        <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/40">1:50 highlight of the 5:16 real call — not a script</p>
      </div>

      {/* stage */}
      <div className="mt-3 grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_260px]">
        {/* left: avatars + bubbles */}
        <div className="flex min-h-0 flex-col rounded-xl border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)] p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col items-center"><HumanAvatar talking={playing && activeSpeaker === 'robert'} active={activeSpeaker === 'robert'} /></div>
            <div className="flex flex-1 flex-col items-center pt-1" aria-hidden>
              <div className="flex h-8 items-end gap-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i} className={cn('w-1 rounded-full', playing ? 'bg-[color:var(--stg-ink)]' : 'bg-[color:var(--stg-ink)]/20')}
                    style={playing ? { height: `${6 + ((i * 7919) % 22)}px`, animation: `stg-wave 0.9s ease-in-out ${(i % 5) * 0.12}s infinite alternate` } : { height: '6px' }} />
                ))}
              </div>
              <span className="stg-label mt-1 text-[8px] text-[color:var(--stg-ink)]/45">+1 (513) 555-0117 · PHONE</span>
            </div>
            <div className="flex flex-col items-center"><RobotAvatar talking={playing && activeSpeaker === 'layla'} active={activeSpeaker === 'layla'} /></div>
          </div>

          {/* bubbles */}
          <div ref={listRef} className="stg-scroll mt-4 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1" aria-live="polite">
            {idx < 0 && !playing && (
              <p className="stg-label py-8 text-center text-[11px] text-[color:var(--stg-ink)]/45">Press play — watch Layla book a real appointment, live.</p>
            )}
            <AnimatePresence initial={false}>
              {visible.map((turn, vi) => {
                const mine = turn.speaker === 'layla';
                const isCurrent = idx - Math.max(0, idx - 4) === vi;
                return (
                  <motion.div
                    key={`${turn.at}-${turn.speaker}`}
                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                  >
                    <div className={cn(
                      'max-w-[85%] rounded-2xl border-2 px-3.5 py-2.5 text-[12px] leading-snug sm:text-[13px]',
                      mine
                        ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)]'
                        : 'border-[color:var(--stg-ink)]/30 bg-white text-[color:var(--stg-ink)]',
                      isCurrent && (mine ? 'shadow-[4px_4px_0_0_var(--stg-yellow)]' : 'shadow-[4px_4px_0_0_var(--stg-ink)]'),
                    )}>
                      <span className={cn('stg-label mr-2 text-[8px]', mine ? 'text-[color:var(--stg-yellow)]' : 'text-[color:var(--stg-ink)]/50')}>
                        {mine ? 'LAYLA' : 'ROBERT'}
                      </span>
                      {turn.text}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* right: agent tool trace */}
        <div className="hidden min-h-0 flex-col rounded-xl border-2 border-[color:var(--stg-ink)] bg-white p-3 lg:flex" aria-label="Agent tool calls">
          <p className="stg-label text-[9px] text-[color:var(--stg-ink)]/55">AGENT TRACE · TOOL CALLS</p>
          <div className="stg-scroll mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {ACTIONS.map((a, i) => {
              const fired = i <= actIdx;
              const Icon = ACTION_ICONS[i] ?? CheckCheck;
              return (
                <motion.div key={a.code} animate={fired ? { scale: [1.04, 1] } : {}} className={cn(
                  'rounded-lg border-2 p-2.5 transition-all duration-300',
                  fired ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)]' : 'border-dashed border-[color:var(--stg-ink)]/20 opacity-45',
                )}>
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4 shrink-0', fired ? 'text-[color:var(--stg-ink)]' : 'text-[color:var(--stg-ink)]/40')} aria-hidden />
                    <span className="stg-label text-[9px] text-[color:var(--stg-ink)]/70">{a.label}</span>
                  </div>
                  <code className={cn('mt-1 block truncate font-mono text-[10px]', fired ? 'text-[color:var(--stg-ink)]' : 'text-[color:var(--stg-ink)]/40')}>{fired ? a.code : '— — —'}</code>
                </motion.div>
              );
            })}
          </div>
          <AnimatePresence>
            {ended && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 rounded-lg border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] p-2.5">
                <p className="stg-label text-[9px]">OUTCOME</p>
                <p className="mt-0.5 text-[11px] font-semibold leading-tight text-[color:var(--stg-ink)]">✅ Appointment booked — Dr. Pegel · tomorrow 8:00 AM · email + SMS sent</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* controls */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={toggle}
          aria-label={playing ? 'Pause the call' : 'Play the call'}
          className="stg-label inline-flex h-11 min-w-[112px] items-center justify-center gap-2 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] px-4 text-[10px] text-[color:var(--stg-ink)] shadow-[4px_4px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          {playing ? 'PAUSE' : ended ? 'REPLAY' : t > 0 ? 'RESUME' : 'PLAY THE CALL'}
        </button>
        <button onClick={restart} aria-label="Restart the call" className="grid h-11 w-11 place-items-center border-2 border-[color:var(--stg-ink)]/30 bg-white text-[color:var(--stg-ink)] transition-colors hover:border-[color:var(--stg-ink)]">
          <RotateCcw className="h-4 w-4" aria-hidden />
        </button>
        <button
          onClick={() => { const a = audioRef.current; if (!a) return; a.playbackRate = fast ? 1 : 1.5; setFast(!fast); }}
          aria-pressed={fast} aria-label="Toggle 1.5x speed"
          className={cn('stg-label inline-flex h-11 items-center gap-1.5 border-2 px-3 text-[10px] transition-colors',
            fast ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-yellow)]' : 'border-[color:var(--stg-ink)]/30 bg-white text-[color:var(--stg-ink)]/70 hover:border-[color:var(--stg-ink)]')}
        >
          <Gauge className="h-4 w-4" aria-hidden /> 1.5×
        </button>
        <div className="min-w-0 flex-1">
          <div className="h-2.5 overflow-hidden rounded-full border-2 border-[color:var(--stg-ink)]/25 bg-white" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Call progress">
            <div className="h-full bg-[color:var(--stg-ink)] transition-[width] duration-150" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className="stg-label w-16 text-right text-[10px] tabular-nums text-[color:var(--stg-ink)]/60">
          {fmt(t)} / 1:50
        </span>
      </div>

      {/* mobile outcome chip */}
      <AnimatePresence>
        {ended && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stg-label mt-2 text-center text-[9px] text-[color:var(--stg-ink)]/70 lg:hidden">
            ✅ BOOKED — DR. PEGEL · 8:00 AM · EMAIL + SMS SENT
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, '0')}`;
}
