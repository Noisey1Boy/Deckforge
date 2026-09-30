'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAppStore } from '@/lib/store/deck-store';
import { getTheme } from '@/lib/design/themes';
import { SlideView } from '@/components/deck/SlideView';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, StickyNote, Maximize2, Minimize2 } from 'lucide-react';
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
  const [isFull, setIsFull] = useState(false);
  const [scale, setScale] = useState(1);
  const reduceMotion = useReducedMotion();

  const slides = deck?.slides ?? [];
  const theme = useMemo(() => getTheme(deck?.themeId), [deck?.themeId]);
  const slide = slides[index];

  const go = useCallback(
    (delta: number) => {
      const next = Math.min(Math.max(index + delta, 0), slides.length - 1);
      setCurrent(next);
    },
    [index, slides.length, setCurrent]
  );

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
        case 'Home':
          setCurrent(0);
          break;
        case 'End':
          setCurrent(slides.length - 1);
          break;
        case 'Escape':
          setPresenting(false);
          break;
        case 'n':
        case 'N':
          setShowNotes((v) => !v);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presenting, go, setCurrent, setPresenting, slides.length]);

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

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col" role="dialog" aria-modal="true" aria-label="Presentation mode">
      {/* stage */}
      <div className="flex-1 min-h-0 grid place-items-center" onClick={(e) => { if ((e.target as HTMLElement).closest('[data-ui]')) return; go(1); }}>
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

      {/* progress */}
      <div className="h-1.5 bg-neutral-800 shrink-0" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={slides.length}>
        <div className="h-full transition-all duration-300" style={{ width: `${((index + 1) / Math.max(slides.length, 1)) * 100}%`, background: theme.tokens.colors.primary }} />
      </div>

      {/* controls */}
      <div data-ui className={cn('absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/70 backdrop-blur px-4 py-2 transition-opacity', 'opacity-40 hover:opacity-100 focus-within:opacity-100')}>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/15" onClick={() => go(-1)} disabled={index === 0} aria-label="Previous slide">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-white/80 text-sm font-mono min-w-14 text-center">{index + 1} / {slides.length}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/15" onClick={() => go(1)} disabled={index >= slides.length - 1} aria-label="Next slide">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="w-px h-5 bg-white/20 mx-1" />
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
    </div>
  );
}
