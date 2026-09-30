'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAppStore } from '@/lib/store/deck-store';
import { getTheme } from '@/lib/design/themes';
import { SlideView } from '@/components/deck/SlideView';
import { ScaledSlide } from '@/components/deck/ScaledSlide';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, StickyNote, Maximize2, Minimize2, LayoutGrid, Timer, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Fullscreen present mode: keyboard navigation, progress bar, speaker notes,
 * theme-driven Framer Motion transitions (disabled under
 * prefers-reduced-motion).
 */
export function PresentOverlay() {
  const presenting = useAppStore((s) => s.presenting);
  const setPresenting = useAppStore((s) => s.setPresenting);
  const deck = useAppStore((s) => s.deck);
  const index = useAppStore((s) => s.currentSlideIndex);
  const setCurrent = useAppStore((s) => s.setCurrentSlide);
  const [showNotes, setShowNotes] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const [scale, setScale] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const startedAt = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  const slides = deck?.slides ?? [];
  const theme = useMemo(() => getTheme(deck?.themeId), [deck?.themeId]);
  const slide = slides[index];
  const visibleCount = useMemo(() => slides.filter((s) => !s.hidden).length, [slides]);
  const visiblePos = useMemo(() => slides.slice(0, index).filter((s) => !s.hidden).length, [slides, index]);

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

  // presenter timer (resets on entry)
  useEffect(() => {
    if (!presenting) {
      startedAt.current = null;
      setAutoplay(false);
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

  // auto-play: advance every 6s, skipping hidden slides; stops at the end
  useEffect(() => {
    if (!presenting || !autoplay || showOverview) return;
    const t = setInterval(() => {
      const st = useAppStore.getState();
      const all = st.deck?.slides ?? [];
      let j = st.currentSlideIndex + 1;
      while (j < all.length && all[j]?.hidden) j++;
      if (j < all.length) st.setCurrentSlide(j);
      else setAutoplay(false);
    }, 6000);
    return () => clearInterval(t);
  }, [presenting, autoplay, showOverview, index]);

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
        case 'Escape':
          if (showOverview) setShowOverview(false);
          else setPresenting(false);
          break;
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
  }, [presenting, go, setCurrent, setPresenting, slides.length, showOverview]);

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

  const motionPreset = (() => {
    if (reduceMotion) return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
    switch (theme.tokens.motion.style) {
      case 'rise':
        return { initial: { opacity: 0, y: 42 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -28 } };
      case 'zoom':
        return { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.05 } };
      case 'slide':
        return { initial: { opacity: 0, x: 120 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -90 } };
      default:
        return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
    }
  })();

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col" role="dialog" aria-modal="true" aria-label="Presentation mode">
      {/* stage */}
      <div className="flex-1 min-h-0 grid place-items-center relative">
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
            initial={motionPreset.initial}
            animate={{ ...motionPreset.animate, transition: { duration: theme.tokens.motion.duration, ease: [0.22, 0.61, 0.36, 1] } }}
            exit={{ ...motionPreset.exit, transition: { duration: 0.18 } }}
            style={{
              width: 1280 * scale,
              height: 720 * scale,
              boxShadow: '0 24px 96px rgba(0,0,0,.5)',
            }}
            className="overflow-hidden rounded-sm"
          >
            <div style={{ width: 1280, height: 720, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              {slide ? (
                <SlideView slide={slide} theme={theme} deckTitle={deck.title} index={index} pageCount={slides.length} />
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* progress — paced over visible slides */}
      <div className="h-1.5 bg-neutral-800 shrink-0" role="progressbar" aria-valuenow={Math.min(visiblePos + 1, visibleCount)} aria-valuemin={1} aria-valuemax={Math.max(visibleCount, 1)}>
        <div className="h-full transition-all duration-300" style={{ width: `${((visiblePos + 1) / Math.max(visibleCount, 1)) * 100}%`, background: theme.tokens.colors.primary }} />
      </div>

      {/* transient keyboard hint (CSS-animated: fades out once per entry) */}
      {presenting && !showOverview && (
        <div
          data-ui
          className="df-present-hint absolute top-5 left-1/2 rounded-full bg-black/70 backdrop-blur px-4 py-1.5 text-xs text-white/85 border border-white/10 shadow-lg"
          aria-hidden
        >
          <span className="font-mono">← →</span> navigate · <span className="font-mono">N</span> notes · <span className="font-mono">G</span> grid · <span className="font-mono">P</span> auto · <span className="font-mono">Esc</span> exit
        </div>
      )}

      {/* controls */}
      <div data-ui className={cn('absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/70 backdrop-blur px-4 py-2 transition-opacity', 'opacity-40 hover:opacity-100 focus-within:opacity-100')}>
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
          className={cn('h-8 w-8 text-white hover:bg-white/15', autoplay && 'bg-white/15')}
          onClick={() => setAutoplay((v) => !v)}
          aria-label={autoplay ? 'Pause auto-play (P)' : 'Auto-play (P)'}
          aria-pressed={autoplay}
          title={autoplay ? 'Pause auto-play (P)' : 'Auto-play (P)'}
        >
          {autoplay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
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
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/15" onClick={enterFull} aria-label="Toggle fullscreen">
          {isFull ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/15" onClick={() => setPresenting(false)} aria-label="Exit presentation (Escape)">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* speaker notes */}
      <AnimatePresence>
        {showNotes && slide?.notes && (
          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            data-ui
            className="absolute bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md rounded-xl bg-black/80 backdrop-blur text-white p-4 text-sm leading-relaxed shadow-xl border border-white/10"
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
            className="absolute inset-0 bg-black/85 backdrop-blur-sm overflow-y-auto p-6 sm:p-10"
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
                    <ScaledSlide slide={s} theme={theme} index={i} pageCount={slides.length} />
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
