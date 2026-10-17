'use client';

/**
 * use-pitch-audio — hardened playback engine for the pitch's conversation
 * slide. Contract with the slide UI:
 *   - elementProps: spread onto a single <audio> element (ref/src/handlers)
 *   - status / t / duration / rate / error drive the controls + status chips
 *   - toggle / restart / seekTo / setRate / retry / runTranscript = actions
 * Failure modes surface loudly (never a silent dead button):
 *   autoplay-blocked → 'autoplay' chip (press play again),
 *   network / decode → actionable chip + RETRY / RUN TRANSCRIPT MODE,
 *   clock frozen 8 s while "playing" → 'stalled' chip + RETRY.
 * Transcript mode runs a simulated clock over the same TURNS timeline so the
 * demo still works when audio genuinely can't (codec, offline, CSP).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type PitchAudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'transcript' | 'error';

export interface PitchAudioError {
  kind: 'autoplay' | 'decode' | 'network' | 'stalled' | 'unknown';
  message: string;
}

const STALL_WATCH_MS = 8000;

function describeMediaError(a: HTMLAudioElement | null): PitchAudioError {
  const code = a?.error?.code ?? 0;
  if (code === 2) return { kind: 'network', message: 'Network error fetching the recording.' };
  if (code === 3 || code === 4) return { kind: 'decode', message: 'This browser can’t decode the recording.' };
  if (code === 1) return { kind: 'unknown', message: 'Audio loading was aborted.' };
  return { kind: 'unknown', message: 'Playback failed unexpectedly.' };
}

export function usePitchAudio(src: string, durationHint: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTickRef = useRef({ t: 0, at: 0 });
  const simPosRef = useRef(0);
  const statusRef = useRef<PitchAudioStatus>('idle');

  const [status, setStatus] = useState<PitchAudioStatus>('idle');
  const [t, setT] = useState(0);
  const [duration, setDuration] = useState(durationHint);
  const [rate, setRateState] = useState(1);
  const [error, setError] = useState<PitchAudioError | null>(null);

  const setStatusBoth = useCallback((s: PitchAudioStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  /* ---- mirror the element clock + watch for stalls while playing ---- */
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const a = audioRef.current;
      if (a && !a.paused && statusRef.current === 'playing') {
        setT(a.currentTime);
        const last = lastTickRef.current;
        if (a.currentTime > last.t + 0.005) {
          lastTickRef.current = { t: a.currentTime, at: Date.now() };
        } else if (Date.now() - last.at > STALL_WATCH_MS) {
          setStatusBoth('error');
          setError({ kind: 'stalled', message: 'Playback clock frozen for 8 s — the stream stalled.' });
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [setStatusBoth]);

  /* ---- transcript mode: simulated clock over the same timeline ---- */
  useEffect(() => {
    if (status !== 'transcript') return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      simPosRef.current += ((now - last) / 1000) * rate;
      last = now;
      if (simPosRef.current >= duration) {
        simPosRef.current = duration;
        setT(duration);
        setStatusBoth('ended');
        return;
      }
      setT(simPosRef.current);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [status, rate, duration, setStatusBoth]);

  /* ---- shared play attempt (used by toggle / restart / retry) ---- */
  const attemptPlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    setStatusBoth('loading');
    void a
      .play()
      .then(() => setError(null)) // onPlay handler flips status to 'playing'
      .catch((e: DOMException) => {
        if (e?.name === 'NotAllowedError') {
          setError({ kind: 'autoplay', message: 'Browser blocked autoplay — press play once more.' });
          setStatusBoth('paused'); // user gesture already happened; next tap plays
        } else if (e?.name === 'NotSupportedError') {
          setError({ kind: 'decode', message: 'Codec not supported here — run transcript mode instead.' });
          setStatusBoth('error');
        } else {
          setError(describeMediaError(a));
          setStatusBoth('error');
        }
      });
  }, [setStatusBoth]);

  /* ---- element handlers (spread via elementProps) ---- */
  const handleCanPlay = useCallback(() => {
    setError(null);
    const a = audioRef.current;
    if (a && Number.isFinite(a.duration) && a.duration > 0) setDuration(a.duration);
    if (statusRef.current === 'loading') setStatusBoth('paused');
  }, [setStatusBoth]);

  const handleLoadedMetadata = useCallback(() => {
    const a = audioRef.current;
    if (a && Number.isFinite(a.duration) && a.duration > 0) setDuration(a.duration);
  }, []);

  const handlePlay = useCallback(() => {
    lastTickRef.current = { t: audioRef.current?.currentTime ?? 0, at: Date.now() };
    setError(null);
    setStatusBoth('playing');
  }, [setStatusBoth]);

  const handlePause = useCallback(() => {
    if (statusRef.current === 'playing') setStatusBoth('paused');
  }, [setStatusBoth]);

  const handleEnded = useCallback(() => setStatusBoth('ended'), [setStatusBoth]);

  const handleError = useCallback(() => {
    setError(describeMediaError(audioRef.current));
    setStatusBoth('error');
  }, [setStatusBoth]);

  /* ---- actions ---- */
  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (statusRef.current === 'transcript') {
      // pause the simulated clock — next toggle tries real audio again
      setStatusBoth('paused');
      if (a) { try { a.currentTime = simPosRef.current; } catch { /* not seekable yet */ } }
      return;
    }
    if (!a) return;
    if (statusRef.current === 'playing') { a.pause(); return; }
    if (statusRef.current === 'ended') { simPosRef.current = 0; try { a.currentTime = 0; } catch { /* noop */ } }
    attemptPlay();
  }, [attemptPlay, setStatusBoth]);

  const restart = useCallback(() => {
    simPosRef.current = 0;
    setT(0);
    const a = audioRef.current;
    if (a) { try { a.currentTime = 0; } catch { /* noop */ } }
    attemptPlay();
  }, [attemptPlay]);

  const seekTo = useCallback(
    (sec: number) => {
      const clamped = Math.max(0, Math.min(duration - 0.25, sec));
      if (statusRef.current === 'transcript') { simPosRef.current = clamped; setT(clamped); return; }
      const a = audioRef.current;
      if (!a) return;
      try { a.currentTime = clamped; setT(clamped); } catch { /* not seekable yet */ }
    },
    [duration],
  );

  /** pitch-preserving rate switch (Safari/Chrome/Firefox prefixes) */
  const setRate = useCallback((r: number) => {
    const a = audioRef.current;
    if (a) {
      a.playbackRate = r;
      type PitchFlag = { preservesPitch?: boolean; mozPreservesPitch?: boolean; webkitPreservesPitch?: boolean };
      const flagged = a as unknown as PitchFlag;
      try { flagged.preservesPitch = true; flagged.mozPreservesPitch = true; flagged.webkitPreservesPitch = true; } catch { /* older engines */ }
    }
    setRateState(r);
  }, []);

  const retry = useCallback(() => {
    setError(null);
    const a = audioRef.current;
    if (a) { try { a.load(); } catch { /* noop */ } }
    attemptPlay();
  }, [attemptPlay]);

  const runTranscript = useCallback(() => {
    audioRef.current?.pause();
    const a = audioRef.current;
    simPosRef.current = a && a.currentTime > 0 ? a.currentTime : simPosRef.current;
    setError(null);
    setStatusBoth('transcript');
  }, [setStatusBoth]);

  const elementProps = {
    ref: audioRef,
    src,
    preload: 'auto' as const,
    onCanPlay: handleCanPlay,
    onLoadedMetadata: handleLoadedMetadata,
    onPlay: handlePlay,
    onPause: handlePause,
    onEnded: handleEnded,
    onError: handleError,
  };

  return { elementProps, status, t, duration, rate, error, toggle, restart, seekTo, setRate, retry, runTranscript };
}
