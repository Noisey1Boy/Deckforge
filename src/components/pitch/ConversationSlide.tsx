'use client';

/**
 * THE CENTERPIECE SLIDE — a human (Robert) and the robot agent (Layla)
 * "having a conversation": the real recorded call plays, speech bubbles
 * appear in sync (timeline computed from the ASR transcript + silence-aligned
 * cut math), avatars animate while their side talks, and tool moments pop
 * as action chips. Playback goes through the hardened use-pitch-audio hook
 * (fail-loud status chips, seekable slider, pitch-preserving 1.5×).
 * PlayStation palette via the .ps-scope token remap.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarCheck, CalendarSearch, CheckCheck, Gauge, Mail, MessageSquare, Pause, Play, RotateCcw, UserPlus } from 'lucide-react';
import {
  ACTIONS, AUDIO_SRC, CUT_DURATION, TURNS, actionIndexAt, turnIndexAt, type Speaker,
} from '@/data/pitch/conversation';
import { usePitchAudio } from '@/hooks/use-pitch-audio';
import { cn } from '@/lib/utils';

const ACTION_ICONS = [CheckCheck, UserPlus, CalendarSearch, CalendarCheck, Mail, MessageSquare];

/* ---------------------------------- avatars ---------------------------------- */

/**
 * Photo avatars (user-supplied): Robert = big.jpg, Layla = OIP-….jpg.
 * Equal circular area + 2px ink border; while that side SPEAKS the ring
 * fills with PS Blue (#0070d1) and a soft blue halo appears. Labels sit on
 * cream chips so they stay readable over the blue speaking halo.
 */
function Avatar({
  src, name, caption, talking, active, position = 'center', side = 'left',
}: {
  src: string; name: string; caption: string; talking: boolean; active: boolean; position?: string; side?: 'left' | 'right';
}) {
  return (
    <motion.div
      animate={talking ? { y: [0, -3, 0] } : { y: 0 }}
      transition={talking ? { repeat: Infinity, duration: 0.5, ease: 'easeInOut' } : {}}
      className="relative flex flex-col items-center"
      aria-label={`${name} — ${caption}`}
    >
      {/* the ring around the photo — fills PS Blue while this avatar speaks */}
      <div
        className={cn(
          'grid h-16 w-16 place-items-center rounded-full p-[3px] transition-all duration-300 sm:h-20 sm:w-20',
          active
            ? 'bg-[color:var(--stg-yellow)] shadow-[0_0_0_4px_rgba(0,112,209,0.25),0_0_18px_rgba(0,112,209,0.45)]'
            : 'bg-[color:var(--stg-ink)]/10',
        )}
      >
        <img
          src={src}
          alt=""
          className="h-full w-full select-none rounded-full border-2 border-[color:var(--stg-ink)] bg-white object-cover"
          style={{ objectPosition: position }}
          draggable={false}
        />
      </div>
      <span
        className={cn(
          'stg-label absolute -bottom-6 z-10 whitespace-nowrap rounded bg-[color:var(--stg-cream)] px-1.5 py-px text-[8px] transition-colors',
          side === 'right' ? 'right-0' : 'left-0',
          active ? 'text-[color:var(--stg-yellow-deep)]' : 'text-[color:var(--stg-ink)]/60',
        )}
      >
        {name} · {caption}
      </span>
    </motion.div>
  );
}

function RobotAvatar({ talking, active }: { talking: boolean; active: boolean }) {
  return <Avatar src="/avatars/ai-layla.jpg" name="LAYLA" caption="AI" talking={talking} active={active} position="center top" side="right" />;
}

function HumanAvatar({ talking, active }: { talking: boolean; active: boolean }) {
  return <Avatar src="/avatars/human-robert.jpg" name="ROBERT" caption="CALLER" talking={talking} active={active} position="center 28%" />;
}

/* ------------------------- status chip (loading/error) ------------------------ */

function StatusChip({
  tone, children, onRetry, onTranscript,
}: {
  tone: 'loading' | 'transcript' | 'error';
  children: React.ReactNode;
  onRetry?: () => void;
  onTranscript?: () => void;
}) {
  return (
    <span
      role="status"
      className={cn(
        'stg-label inline-flex items-center gap-2 rounded border-2 px-2 py-1 text-[8px]',
        tone === 'loading' && 'border-[color:var(--stg-ink)]/30 bg-white text-[color:var(--stg-ink)]/60',
        tone === 'transcript' && 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--ps-link-dark)]',
        tone === 'error' && 'border-[color:var(--ps-warn)] bg-white text-[color:var(--ps-warn)]',
      )}
    >
      {children}
      {onRetry && (
        <button onClick={onRetry} className="stg-label rounded border border-current px-1.5 py-px text-[8px] transition-colors hover:bg-[color:var(--stg-ink)] hover:text-white">
          RETRY
        </button>
      )}
      {onTranscript && (
        <button onClick={onTranscript} className="stg-label rounded border border-current px-1.5 py-px text-[8px] transition-colors hover:bg-[color:var(--stg-ink)] hover:text-white">
          RUN TRANSCRIPT MODE
        </button>
      )}
    </span>
  );
}

/* --------------------------------- the slide --------------------------------- */

export function ConversationSlide() {
  const listRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const audio = usePitchAudio('/audio/dentist-booking.mp3', CUT_DURATION);
  const { status, t, duration, rate, error } = audio;
  const playing = status === 'playing';
  const ended = status === 'ended';

  const idx = turnIndexAt(t);
  const actIdx = actionIndexAt(t);
  const activeSpeaker: Speaker | null = idx < 0 ? null : TURNS[idx].speaker;
  const visible = idx < 0 ? [] : TURNS.slice(Math.max(0, idx - 4), idx + 1);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [idx]);

  const pct = Math.min(100, (t / (duration || CUT_DURATION)) * 100);

  /* ---- seekable progress track (pointer + keyboard) ---- */
  const seekFromPointer = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.seekTo(frac * (duration || CUT_DURATION));
  };

  const fast = rate > 1.05;
  const toggleRate = () => audio.setRate(fast ? 1 : 1.5);

  return (
    <div className="flex h-full flex-col px-4 py-3 sm:px-8" data-testid="conversation-slide">
      <audio {...audio.elementProps} />

      {/* header + status chips */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="stg-label flex items-center gap-2 text-[10px] text-[color:var(--stg-ink)]/60">
          <span className="inline-block h-2 w-2 animate-pulse bg-[color:var(--stg-yellow)]" aria-hidden />
          LIVE RECORDING · DOWNTOWN DENTIST
        </p>
        <p className="stg-label text-[10px] text-[color:var(--stg-ink)]/40">1:50 highlight of the 5:16 real call — not a script</p>
        {status === 'loading' && <StatusChip tone="loading">LOADING…</StatusChip>}
        {status === 'transcript' && <StatusChip tone="transcript">TRANSCRIPT MODE</StatusChip>}
        {status === 'error' && error && (
          <StatusChip tone="error" onRetry={audio.retry} onTranscript={audio.runTranscript}>
            {error.kind.toUpperCase()} · {error.message}
          </StatusChip>
        )}
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
                      <span className={cn('stg-label mr-2 text-[8px]', mine ? 'text-[color:var(--ps-link-dark)]' : 'text-[color:var(--stg-ink)]/50')}>
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
                <p className="stg-label text-[9px] text-white/80">OUTCOME</p>
                <p className="mt-0.5 text-[11px] font-semibold leading-tight text-white">✅ Appointment booked — Dr. Pegel · tomorrow 8:00 AM · email + SMS sent</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* controls */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={audio.toggle}
          aria-label={playing ? 'Pause the call' : 'Play the call'}
          className="stg-label inline-flex h-11 min-w-[112px] items-center justify-center gap-2 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] px-4 text-[10px] text-white shadow-[4px_4px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          {playing ? 'PAUSE' : ended ? 'REPLAY' : t > 0 ? 'RESUME' : 'PLAY THE CALL'}
        </button>
        <button onClick={audio.restart} aria-label="Restart the call" className="grid h-11 w-11 place-items-center border-2 border-[color:var(--stg-ink)]/30 bg-white text-[color:var(--stg-ink)] transition-colors hover:border-[color:var(--stg-ink)]">
          <RotateCcw className="h-4 w-4" aria-hidden />
        </button>
        <button
          onClick={toggleRate}
          aria-pressed={fast} aria-label="Toggle 1.5x speed"
          className={cn('stg-label inline-flex h-11 items-center gap-1.5 border-2 px-3 text-[10px] transition-colors',
            fast ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--ps-link-dark)]' : 'border-[color:var(--stg-ink)]/30 bg-white text-[color:var(--stg-ink)]/70 hover:border-[color:var(--stg-ink)]')}
        >
          <Gauge className="h-4 w-4" aria-hidden /> 1.5×
        </button>
        <div className="min-w-0 flex-1">
          <div
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-label="Seek within the call"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration || CUT_DURATION)}
            aria-valuenow={Math.round(t)}
            aria-valuetext={`${fmt(t)} of ${fmt(duration || CUT_DURATION)}`}
            onPointerDown={(e) => { draggingRef.current = true; e.currentTarget.setPointerCapture(e.pointerId); seekFromPointer(e.clientX); }}
            onPointerMove={(e) => { if (draggingRef.current) seekFromPointer(e.clientX); }}
            onPointerUp={(e) => { draggingRef.current = false; e.currentTarget.releasePointerCapture(e.pointerId); }}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 15 : 5;
              if (e.key === 'ArrowRight') { e.preventDefault(); audio.seekTo(t + step); }
              else if (e.key === 'ArrowLeft') { e.preventDefault(); audio.seekTo(t - step); }
              else if (e.key === 'Home') { e.preventDefault(); audio.seekTo(0); }
              else if (e.key === 'End') { e.preventDefault(); audio.seekTo((duration || CUT_DURATION) - 1); }
            }}
            className="h-2.5 cursor-pointer touch-none overflow-hidden rounded-full border-2 border-[color:var(--stg-ink)]/25 bg-white"
          >
            <div className="h-full bg-[color:var(--stg-ink)] transition-[width] duration-150" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className="stg-label w-16 text-right text-[10px] tabular-nums text-[color:var(--stg-ink)]/60">
          {fmt(t)} / {fmt(duration || CUT_DURATION)}
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
