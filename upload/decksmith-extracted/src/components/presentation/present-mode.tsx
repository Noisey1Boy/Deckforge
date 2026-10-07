'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { X, ChevronLeft, ChevronRight, StickyNote, Maximize2, Minimize2 } from 'lucide-react'
import { usePresentation } from '@/lib/presentation/store'
import { DeckPreview } from './deck-preview'

export function PresentMode() {
  const {
    presentMode, setPresentMode,
    result, currentSlide, setCurrentSlide,
    showSpeakerNotes, toggleSpeakerNotes,
  } = usePresentation()

  const [chromeVisible, setChromeVisible] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [slideCount, setSlideCount] = useState(0)

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.().catch(() => {})
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    if (!presentMode) return
    let timer: ReturnType<typeof setTimeout>
    const showChrome = () => {
      setChromeVisible(true)
      clearTimeout(timer)
      timer = setTimeout(() => setChromeVisible(false), 2500)
    }
    window.addEventListener('mousemove', showChrome)
    window.addEventListener('click', showChrome)
    showChrome()
    return () => {
      window.removeEventListener('mousemove', showChrome)
      window.removeEventListener('click', showChrome)
      clearTimeout(timer)
    }
  }, [presentMode])

  useEffect(() => {
    if (!presentMode) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPresentMode(false)
      else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault(); setCurrentSlide(Math.min(slideCount - 1, currentSlide + 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault(); setCurrentSlide(Math.max(0, currentSlide - 1))
      } else if (e.key === 'n' || e.key === 'N') toggleSpeakerNotes()
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presentMode, currentSlide, slideCount, setCurrentSlide, toggleSpeakerNotes, toggleFullscreen])

  const speakerNotes = useMemo(() => {
    if (!result) return ''
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(result.html, 'text/html')
      const slides = doc.querySelectorAll('section.slide, section, .step')
      const current = slides[currentSlide]
      if (current) {
        return (
          current.querySelector('.notes')?.textContent ||
          current.querySelector('aside.notes')?.textContent ||
          current.querySelector('[role="note"]')?.textContent ||
          current.querySelector('details.notes')?.textContent || ''
        ).trim()
      }
    } catch { /* ignore */ }
    return ''
  }, [result, currentSlide])

  if (!presentMode || !result) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: 'var(--deep-green)' }}
      >
        {/* Slide area — cinematic */}
        <div className="flex-1 flex items-center justify-center p-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden"
              style={{
                width: 'min(100%, calc(100vh * 16/9))',
                aspectRatio: '16 / 9',
                background: 'var(--canvas)',
                borderRadius: '8px',
              }}
            >
              <DeckPreview html={result.html} slideIndex={currentSlide} onSlideCountChange={setSlideCount} className="w-full h-full" />
            </motion.div>
          </AnimatePresence>

          <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} className="absolute left-0 top-0 bottom-0 w-1/3 cursor-w-resize" aria-label="Previous slide" tabIndex={-1} />
          <button onClick={() => setCurrentSlide(Math.min(slideCount - 1, currentSlide + 1))} className="absolute right-0 top-0 bottom-0 w-2/3 cursor-e-resize" aria-label="Next slide" tabIndex={-1} />
        </div>

        {/* Chrome — auto-hiding */}
        <AnimatePresence>
          {chromeVisible && (
            <>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between"
                style={{ background: 'linear-gradient(to bottom, rgba(0,60,51,0.9), transparent)' }}
              >
                <div className="flex items-center gap-4">
                  <button onClick={() => setPresentMode(false)} className="cohere-btn-primary" style={{ background: 'var(--canvas)', color: 'var(--primary)', height: '36px', fontSize: '12px', padding: '0 14px' }}>
                    <X className="size-3.5 mr-1" /> Exit
                  </button>
                  <span className="cohere-display text-xl" style={{ color: 'var(--canvas)', lineHeight: 1 }}>
                    {String(currentSlide + 1).padStart(2, '0')}
                    <span style={{ opacity: 0.4, fontSize: '14px' }}> / {String(slideCount).padStart(2, '0')}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSpeakerNotes}
                    className="cohere-btn-primary"
                    style={{
                      height: '36px', fontSize: '12px', padding: '0 14px',
                      background: showSpeakerNotes ? 'var(--canvas)' : 'transparent',
                      color: showSpeakerNotes ? 'var(--primary)' : 'var(--canvas)',
                      border: showSpeakerNotes ? 'none' : '1px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    <StickyNote className="size-3.5 mr-1" /> Notes
                  </button>
                  <button onClick={toggleFullscreen} className="cohere-btn-primary" style={{ width: '36px', height: '36px', padding: '0', background: 'var(--canvas)', color: 'var(--primary)' }} aria-label="Fullscreen">
                    {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center gap-4"
                style={{ background: 'linear-gradient(to top, rgba(0,60,51,0.9), transparent)' }}
              >
                <button
                  onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                  disabled={currentSlide === 0}
                  className="cohere-btn-primary"
                  style={{ background: 'var(--canvas)', color: 'var(--primary)', height: '36px', fontSize: '12px', padding: '0 14px', opacity: currentSlide === 0 ? 0.3 : 1 }}
                >
                  <ChevronLeft className="size-3.5 mr-1" /> Prev
                </button>
                <span className="cohere-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  ← → · N notes · F fullscreen · Esc exit
                </span>
                <button
                  onClick={() => setCurrentSlide(Math.min(slideCount - 1, currentSlide + 1))}
                  disabled={currentSlide >= slideCount - 1}
                  className="cohere-btn-primary"
                  style={{ background: 'var(--canvas)', color: 'var(--primary)', height: '36px', fontSize: '12px', padding: '0 14px', opacity: currentSlide >= slideCount - 1 ? 0.3 : 1 }}
                >
                  Next <ChevronRight className="size-3.5 ml-1" />
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Speaker notes */}
        <AnimatePresence>
          {showSpeakerNotes && speakerNotes && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="absolute bottom-24 right-6 max-w-sm p-5"
              style={{
                background: 'rgba(23, 23, 28, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--canvas)',
                borderRadius: '8px',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="size-3.5" style={{ color: 'var(--coral)' }} />
                <span className="cohere-mono" style={{ color: 'var(--coral)' }}>
                  Notes · Slide {currentSlide + 1}
                </span>
              </div>
              <p className="cohere-text-body leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {speakerNotes}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
