'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAppStore } from '@/lib/store/deck-store';
import { getTheme, deckTheme } from '@/lib/design/themes';
import { deckFooterText } from '@/lib/deck/types';
import { SlideView } from '@/components/deck/SlideView';
import { ScaledSlide } from '@/components/deck/ScaledSlide';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { X, ChevronLeft, ChevronRight, StickyNote, Maximize2, Minimize2, LayoutGrid, Timer, Play, Pause, ChevronsUpDown, Repeat, Projector, MonitorOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TransitionKind } from '@/lib/deck/types';

const AUTOPLAY_SPEEDS = [5, 10, 15, 20] as const;
const LS_SPEED = 'deckforge.autoplay.speed';
const LS_LOOP = 'deckforge.autoplay.loop';
const LS_PRESENTER_W = 'deckforge.presenter.width';
const PRESENTER_W_MIN = 280;
const PRESENTER_W_MAX = 620;
const PRESENTER_W_DEFAULT = 416;

function loadSpeed(): number {
  try {
    const v = Number(window.localStorage.getItem(LS_SPEED));
    return (AUTOPLAY_SPEEDS as readonly number[]).includes(v) ? v : 10;
  } catch {
    return 10;
  }
}
function loadLoop(): boolean {
  try {
    return window.localStorage.getItem(LS_LOOP) === '1';
  } catch {
    return false;
  }
}
function loadPresenterWidth(): number {
  try {
    const raw = window.localStorage.getItem(LS_PRESENTER_W);
    if (!raw) return PRESENTER_W_DEFAULT;
    const v = Number(raw);
    return Number.isFinite(v) ? Math.min(PRESENTER_W_MAX, Math.max(PRESENTER_W_MIN, v)) : PRESENTER_W_DEFAULT;
  } catch {
    return PRESENTER_W_DEFAULT;
  }
}

interface MotionPreset {
  initial: Record<string, unknown>;
  animate: Record<string, unknown>;
  exit: Record<string, unknown>;
}

/** Framer Motion preset for a transition kind ("inherit" follows the theme). */
function motionFor(kind: TransitionKind | undefined, themeStyle: string, reduceMotion: boolean): MotionPreset | null {
  if (reduceMotion) {
    return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
  }
  const style = !kind || kind === 'inherit' ? themeStyle : kind;
  switch (style) {
    case 'none':
      return null; // hard cut — handled by the caller
    case 'rise':
      return { initial: { opacity: 0, y: 42 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -28 } };
    case 'zoom':
      return { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.05 } };
    case 'slide':
      return { initial: { opacity: 0, x: 120 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -90 } };
    default:
      return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
  }
}

/**
 * Fullscreen present mode: keyboard navigation, click-to-seek progress bar,
 * speaker notes, slide overview, auto-play with loop, a dedicated presenter
 * view (notes + next-slide preview) and per-slide transition overrides —
 * all transitions disabled under prefers-reduced-motion.
 */
export function PresentOverlay() {
  const presenting = useAppStore((s) => s.presenting);
  const setPresenting = useAppStore((s) => s.setPresenting);
  const deck = useAppStore((s) => s.deck);
  const index = useAppStore((s) => s.currentSlideIndex);
  const setCurrent = useAppStore((s) => s.setCurrentSlide);
  const [showNotes, setShowNotes] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [presenter, setPresenter] = useState(false);
  const [blanked, setBlanked] = useState(false);
  const [presenterW, setPresenterWState] = useState<number>(() => (typeof window === 'undefined' ? PRESENTER_W_DEFAULT : loadPresenterWidth()));
  const [isFull, setIsFull] = useState(false);
  const [scale, setScale] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [speed, setSpeedState] = useState<number>(() => (typeof window === 'undefined' ? 10 : loadSpeed()));
  const [loop, setLoopState] = useState<boolean>(() => (typeof window === 'undefined' ? false : loadLoop()));
  const startedAt = useRef<number | null>(null);
  const presenterDrag = useRef<{ startX: number; startW: number } | null>(null);
  const reduceMotion = useReducedMotion();
  const setSpeed = useCallback((v: number) => {
    setSpeedState(v);
    try { window.localStorage.setItem(LS_SPEED, String(v)); } catch { /* private mode */ }
  }, []);
  const setLoop = useCallback((v: boolean) => {
    setLoopState(v);
    try { window.localStorage.setItem(LS_LOOP, v ? '1' : '0'); } catch { /* private mode */ }
  }, []);
  const setPresenterW = useCallback((v: number) => {
    const clamped = Math.min(PRESENTER_W_MAX, Math.max(PRESENTER_W_MIN, Math.round(v)));
    setPresenterWState(clamped);
    try { window.localStorage.setItem(LS_PRESENTER_W, String(clamped)); } catch { /* private mode */ }
  }, []);

  const slides = deck?.slides ?? [];
  const theme = useMemo(() => (deck ? deckTheme(deck) : getTheme(deck?.themeId)), [deck]);
  const footerText = deck ? deckFooterText(deck) : '';
  const showPageNumbers = deck?.meta?.showPageNumbers !== false;
  const slide = slides[index];
  const visibleCount = useMemo(() => slides.filter((s) => !s.hidden).length, [slides]);
  const visiblePos = useMemo(() => slides.slice(0, index).filter((s) => !s.hidden).length, [slides, index]);
  const nextSlide = useMemo(() => {
    let j = index + 1;
    while (j < slides.length && slides[j]?.hidden) j++;
    return j < slides.length ? slides[j] : null;
  }, [slides, index]);
  const nextIndex = useMemo(() => {
    let j = index + 1;
    while (j < slides.length && slides[j]?.hidden) j++;
    return j < slides.length ? j : null;
  }, [slides, index]);

  /** Move one slide in a direction, skipping hidden slides. */
  const stepTo = useCallback(
    (dir: 1 | -1) => {
      let j = index + dir;
      while (j >= 0 && j < slides.length && slides[j]?.hidden) j += dir;
      if (j >= 0 && j < slides.length) setCurrent(j);
    },
    [index, slides, setCurrent]
  );

  const go = useCallback((delta: number) => stepTo(delta as 1 | -1), [stepTo]);

  /** Exit presentation and reset transient state (autoplay, timer, blank). */
  const exitPresent = useCallback(() => {
    setAutoplay(false);
    setElapsed(0);
    setPresenter(false);
    setBlanked(false);
    setPresenting(false);
  }, [setPresenting]);

  // viewport scaling
  useEffect(() => {
    if (!presenting) return;
    const update = () => {
      const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
      setScale(s);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [presenting]);

  // presenter timer (starts on entry; reset happens in exitPresent)
  useEffect(() => {
    if (!presenting) {
      startedAt.current = null;
      return;
    }
    startedAt.current = Date.now();
    const t = setInterval(() => {
      if (startedAt.current) setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 500);
    return () => clearInterval(t);
  }, [presenting]);

  // never land on a hidden slide when entering presentation mode
  useEffect(() => {
    if (!presenting) return;
    const st = useAppStore.getState();
    const all = st.deck?.slides ?? [];
    if (all[st.currentSlideIndex]?.hidden) {
      const first = all.findIndex((s) => !s.hidden);
      if (first >= 0) st.setCurrentSlide(first);
    }
  }, [presenting]);

  // auto-play: advance every `speed` seconds, skipping hidden slides.
  // At the end it loops back to the first visible slide when loop is on.
  useEffect(() => {
    if (!presenting || !autoplay || showOverview) return;
    const t = setInterval(() => {
      const st = useAppStore.getState();
      const all = st.deck?.slides ?? [];
      let j = st.currentSlideIndex + 1;
      while (j < all.length && all[j]?.hidden) j++;
      if (j < all.length) {
        st.setCurrentSlide(j);
      } else if (loop) {
        const first = all.findIndex((s) => !s.hidden);
        if (first >= 0) st.setCurrentSlide(first);
      } else {
        setAutoplay(false);
      }
    }, speed * 1000);
    return () => clearInterval(t);
  }, [presenting, autoplay, showOverview, speed, loop, index]);

  /** Jump to the visible slide nearest a 0..1 fraction of the deck. */
  const seekToFraction = useCallback(
    (f: number) => {
      const vis = slides.map((s, i) => ({ s, i })).filter(({ s }) => !s.hidden);
      if (!vis.length) return;
      const target = Math.min(vis.length - 1, Math.max(0, Math.round(f * (vis.length - 1))));
      setCurrent(vis[target].i);
    },
    [slides, setCurrent]
  );

  // keyboard nav
  useEffect(() => {
    if (!presenting) return;
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          go(1);
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          go(-1);
          break;
        case 'Home': {
          const first = slides.findIndex((s) => !s.hidden);
          if (first >= 0) setCurrent(first);
          break;
        }
        case 'End': {
          const last = slides.length - 1 - [...slides].reverse().findIndex((s) => !s.hidden);
          if (slides[last] && !slides[last].hidden) setCurrent(last);
          break;
        }
        case 'p':
        case 'P':
          setAutoplay((v) => !v);
          break;
        case 'v':
        case 'V':
          setPresenter((v) => !v);
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          setBlanked((v) => !v);
          break;
        case 'Escape': {
          // let Radix menus / popovers consume Escape first (don't exit the deck)
          if (document.querySelector('[role="menu"], [data-radix-popper-content-wrapper]')) break;
          if (showOverview) setShowOverview(false);
          else exitPresent();
          break;
        }
        case 'n':
        case 'N':
          setShowNotes((v) => !v);
          break;
        case 'g':
        case 'G':
          setShowOverview((v) => !v);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presenting, go, setCurrent, exitPresent, slides.length, showOverview]);

  const enterFull = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFull(true);
      } else {
        await document.exitFullscreen();
        setIsFull(false);
      }
    } catch {
      /* fullscreen may be blocked — presenting still works */
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  if (!presenting || !deck) return null;

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  // per-slide transition override: slide.transition → theme motion style
  const preset = motionFor(slide?.transition, theme.tokens.motion.style, !!reduceMotion);
  const cut = !preset; // 'none' — hard cut, no enter animation

  // stage (shared between standard and presenter layout)
  const stage = (
    <div className="flex-1 min-h-0 grid place-items-center relative overflow-hidden">
      {/* subtle spotlight vignette behind the slide */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 62% 58% at 50% 46%, rgba(255,255,255,0.055), transparent 68%)' }}
        aria-hidden
      />
      {/* split click zones: left 28% back, rest forward (keyboard/arrows also work) */}
      <button
        className="absolute inset-y-0 left-0 w-[28%] z-[1] cursor-w-resize"
        onClick={() => go(-1)}
        disabled={index === 0}
        tabIndex={-1}
        aria-hidden
      />
      <button
        className="absolute inset-y-0 right-0 w-[72%] z-[1] cursor-e-resize"
        onClick={() => go(1)}
        disabled={index >= slides.length - 1}
        tabIndex={-1}
        aria-hidden
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={cut ? false : preset!.initial}
          animate={cut ? { opacity: 1 } : { ...preset!.animate, transition: { duration: theme.tokens.motion.duration, ease: [0.22, 0.61, 0.36, 1] } }}
          exit={cut ? { opacity: 0, transition: { duration: 0.08 } } : { ...preset!.exit, transition: { duration: 0.18 } }}
          style={{
            width: 1280 * scale,
            height: 720 * scale,
            boxShadow: '0 24px 96px rgba(0,0,0,.5)',
          }}
          className="overflow-hidden rounded-sm"
        >
          <div style={{ width: 1280, height: 720, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            {slide ? (
              <SlideView slide={slide} theme={theme} deckTitle={footerText} index={index} pageCount={slides.length} showPageNumbers={showPageNumbers} />
            ) : null}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col" role="dialog" aria-modal="true" aria-label="Presentation mode">
      {presenter ? (
        /* ------------------------------------------------ presenter view */
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row" style={{ '--pw': `${presenterW}px` } as React.CSSProperties}>
          {stage}
          {/* drag handle — resize the presenter panel (desktop) */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize presenter panel (arrow keys adjust)"
            tabIndex={0}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              presenterDrag.current = { startX: e.clientX, startW: presenterW };
            }}
            onPointerMove={(e) => {
              const d = presenterDrag.current;
              if (!d) return;
              setPresenterW(d.startW - (e.clientX - d.startX));
            }}
            onPointerUp={() => { presenterDrag.current = null; }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') { e.preventDefault(); setPresenterW(presenterW + 32); }
              if (e.key === 'ArrowRight') { e.preventDefault(); setPresenterW(presenterW - 32); }
            }}
            className="hidden lg:block relative w-1.5 -mx-0.5 z-10 cursor-col-resize shrink-0 group/sep"
            title="Drag to resize · arrow keys"
          >
            <span className="absolute inset-y-0 -left-1 -right-1" aria-hidden />
            <span className="absolute inset-y-0 left-0 w-px bg-white/10 group-hover/sep:bg-white/40 group-focus-visible/sep:bg-white/60 transition-colors" aria-hidden />
          </div>
          <aside
            className="w-full lg:w-[var(--pw,26rem)] shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 bg-neutral-950/95 backdrop-blur p-4 lg:p-5 flex lg:flex-col gap-4 overflow-y-auto max-h-[46%] lg:max-h-none"
            aria-label="Presenter view"
          >
            <div className="flex items-center justify-between lg:justify-start gap-4 shrink-0">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/40">Now showing</div>
                <div className="text-white/90 text-sm font-mono tabular-nums mt-0.5">
                  {Math.min(visiblePos + 1, visibleCount)} <span className="text-white/40">/ {visibleCount}</span>
                </div>
              </div>
              <div className="lg:mt-2">
                <div className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1"><Timer className="h-3 w-3" /> Elapsed</div>
                <div className="text-white/90 text-sm font-mono tabular-nums mt-0.5">{mm}:{ss}</div>
              </div>
              {autoplay && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 self-start lg:mt-2">
                  <Play className="h-2.5 w-2.5" /> Auto {speed}s
                </span>
              )}
            </div>

            <div className="flex-1 min-h-20 lg:min-h-0 lg:overflow-y-auto">
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5">Speaker notes</div>
              {slide?.notes ? (
                <p className="text-white/90 text-sm lg:text-base leading-relaxed whitespace-pre-wrap">{slide.notes}</p>
              ) : (
                <p className="text-white/35 text-sm italic">No notes for this slide — add them in the editor inspector.</p>
              )}
            </div>

            <div className="shrink-0 lg:mt-auto">
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5">Up next</div>
              {nextSlide ? (
                <button
                  onClick={() => nextIndex != null && setCurrent(nextIndex)}
                  className="block w-full rounded-md overflow-hidden border border-white/15 hover:border-white/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white text-left"
                  aria-label={`Preview next slide: ${nextSlide.title || nextSlide.layout}`}
                >
                  <ScaledSlide slide={nextSlide} theme={theme} index={nextIndex ?? undefined} pageCount={slides.length} showPageNumbers={false} />
                </button>
              ) : (
                <div className="h-24 grid place-items-center rounded-md border border-dashed border-white/15 text-white/35 text-xs">
                  End of deck
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : (
        /* ---------------------------------------------- standard layout */
        stage
      )}

      {/* progress — paced over visible slides; click / drag to seek */}
      <div
        className="group h-1.5 hover:h-3 transition-[height] duration-200 bg-neutral-800 shrink-0 cursor-pointer relative"
        role="slider"
        aria-label="Seek to slide"
        aria-valuemin={1}
        aria-valuemax={Math.max(visibleCount, 1)}
        aria-valuenow={Math.min(visiblePos + 1, visibleCount)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); go(1); }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); go(-1); }
        }}
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seekToFraction((e.clientX - rect.left) / rect.width);
        }}
      >
        <div
          className="h-full transition-all duration-300 pointer-events-none"
          style={{ width: `${((visiblePos + 1) / Math.max(visibleCount, 1)) * 100}%`, background: `linear-gradient(90deg, ${theme.tokens.colors.primary}, ${theme.tokens.colors.accent})` }}
        />
      </div>

      {/* blank screen (projector shutter) — B key or click to restore */}
      {blanked && (
        <div
          className="absolute inset-0 z-[2] bg-black grid place-items-center cursor-pointer"
          onClick={() => setBlanked(false)}
          role="button"
          aria-label="Screen hidden. Click or press B to show the slide"
        >
          <p className="text-white/30 text-sm">
            Screen hidden — press <span className="font-mono text-white/50">B</span> or click to show
          </p>
        </div>
      )}

      {/* transient keyboard hint (CSS-animated: fades out once per entry) */}
      {presenting && !showOverview && (
        <div
          data-ui
          className="df-present-hint absolute top-5 left-1/2 z-[2] rounded-full bg-black/70 backdrop-blur px-4 py-1.5 text-xs text-white/85 border border-white/10 shadow-lg"
          aria-hidden
        >
          <span className="font-mono">← →</span> navigate · <span className="font-mono">N</span> notes · <span className="font-mono">V</span> presenter · <span className="font-mono">G</span> grid · <span className="font-mono">P</span> auto · <span className="font-mono">B</span> blank · <span className="font-mono">Esc</span> exit
        </div>
      )}

      {/* controls */}
      <div data-ui className={cn('absolute bottom-6 left-1/2 -translate-x-1/2 z-[3] flex items-center gap-2 rounded-full bg-black/70 backdrop-blur px-4 py-2 transition-opacity', 'opacity-40 hover:opacity-100 focus-within:opacity-100')}>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/15" onClick={() => go(-1)} disabled={index === 0} aria-label="Previous slide">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-white/80 text-sm font-mono min-w-14 text-center">{Math.min(visiblePos + 1, visibleCount)} / {visibleCount}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/15" onClick={() => go(1)} disabled={index >= slides.length - 1} aria-label="Next slide">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="w-px h-5 bg-white/20 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 text-white hover:bg-white/15 relative', autoplay && 'bg-white/15')}
          onClick={() => setAutoplay((v) => !v)}
          aria-label={autoplay ? `Pause auto-play (${speed}s per slide, P)` : `Start auto-play (${speed}s per slide, P)`}
          aria-pressed={autoplay}
          title={autoplay ? `Pause auto-play — ${speed}s/slide (P)` : `Auto-play — ${speed}s/slide (P)`}
        >
          {autoplay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {autoplay && <span className="absolute inset-0 rounded-md ring-2 ring-emerald-400/70 animate-pulse" aria-hidden />}
        </Button>
        {/* speed / loop dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-8 w-7 px-0 text-white hover:bg-white/15 -ml-1.5', (autoplay || loop) && 'text-white')}
              aria-label="Auto-play settings"
              title="Auto-play speed & loop"
            >
              <ChevronsUpDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-44 z-[110]" side="top">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Seconds per slide</DropdownMenuLabel>
            {AUTOPLAY_SPEEDS.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => setSpeed(s)}
                className={cn('justify-between text-sm', speed === s && 'bg-neutral-100 font-medium')}
                aria-checked={speed === s}
                role="menuitemradio"
              >
                {s}s {speed === s && <span aria-hidden>✓</span>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setLoop((v) => !v)}
              className="justify-between text-sm"
              role="menuitemcheckbox"
              aria-checked={loop}
            >
              <span className="inline-flex items-center gap-2"><Repeat className="h-3.5 w-3.5" /> Loop deck</span>
              {loop && <span aria-hidden>✓</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="w-px h-5 bg-white/20 mx-1" />
        <span className="text-white/70 text-sm font-mono tabular-nums inline-flex items-center gap-1.5" title="Elapsed time">
          <Timer className="h-3.5 w-3.5" /> {mm}:{ss}
        </span>
        <span className="w-px h-5 bg-white/20 mx-1" />
        <Button variant="ghost" size="icon" className={cn('h-8 w-8 text-white hover:bg-white/15', showOverview && 'bg-white/15')} onClick={() => setShowOverview((v) => !v)} aria-label="Slide overview (G)">
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className={cn('h-8 w-8 text-white hover:bg-white/15', showNotes && 'bg-white/15')} onClick={() => setShowNotes((v) => !v)} aria-label="Toggle speaker notes (N)">
          <StickyNote className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 text-white hover:bg-white/15', presenter && 'bg-white/15')}
          onClick={() => setPresenter((v) => !v)}
          aria-label="Presenter view (V)"
          aria-pressed={presenter}
          title="Presenter view — notes & next slide (V)"
        >
          <Projector className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 text-white hover:bg-white/15', blanked && 'bg-white/15')}
          onClick={() => setBlanked((v) => !v)}
          aria-label="Toggle blank screen (B)"
          aria-pressed={blanked}
          title="Blank the screen — pause audience attention (B)"
        >
          <MonitorOff className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/15" onClick={enterFull} aria-label="Toggle fullscreen">
          {isFull ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/15" onClick={exitPresent} aria-label="Exit presentation (Escape)">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* speaker notes (standard layout only) */}
      <AnimatePresence>
        {showNotes && !presenter && slide?.notes && (
          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            data-ui
            className="absolute bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-[4] rounded-xl bg-black/80 backdrop-blur text-white p-4 text-sm leading-relaxed shadow-xl border border-white/10"
          >
            <div className="text-[10px] uppercase tracking-widest text-white/50 mb-1.5">Speaker notes · N to toggle</div>
            {slide.notes}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* slide overview grid */}
      <AnimatePresence>
        {showOverview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-ui
            className="absolute inset-0 z-[5] bg-black/85 backdrop-blur-sm overflow-y-auto p-6 sm:p-10"
            role="dialog"
            aria-label="Slide overview"
            onClick={() => setShowOverview(false)}
          >
            <div className="max-w-6xl mx-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white/90 text-sm font-semibold uppercase tracking-widest">All slides · G to close</h2>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/15" onClick={() => setShowOverview(false)} aria-label="Close overview">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {slides.map((s, i) => ({ s, i })).filter(({ s }) => !s.hidden).map(({ s, i }, vi) => (
                  <button
                    key={s.id}
                    onClick={() => { setCurrent(i); setShowOverview(false); }}
                    className={cn(
                      'relative rounded-lg overflow-hidden border-2 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                      i === index ? 'border-white shadow-xl scale-[1.02]' : 'border-white/15 hover:border-white/60'
                    )}
                    aria-label={`Go to slide ${vi + 1}: ${s.title || s.layout}`}
                    aria-current={i === index}
                  >
                    <ScaledSlide slide={s} theme={theme} index={i} pageCount={slides.length} showPageNumbers={false} />
                    <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] rounded px-1.5 py-0.5 font-mono">{vi + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
