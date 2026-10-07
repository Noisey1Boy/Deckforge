'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import {
  Code2, Eye, Download, FileDown, Loader2, Maximize2, X,
  ChevronLeft, ChevronRight, CheckCircle2, Play, FileText,
  ListChecks, Sparkles, PartyPopper,
} from 'lucide-react'
import { usePresentation } from '@/lib/presentation/store'
import { DeckPreview } from './deck-preview'
import { SlideNavigator } from './slide-navigator'
import { exportToPptx, downloadHtml, exportToPdf } from '@/lib/presentation/export'
import { toast } from 'sonner'

export function PreviewPanel() {
  const {
    result, status, outline, slideStatuses,
    currentSlide, setCurrentSlide,
    showCode, toggleCode, setPresentMode,
  } = usePresentation()
  const [slideCount, setSlideCount] = useState(0)
  const [exporting, setExporting] = useState<'pptx' | 'html' | 'pdf' | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)

  useEffect(() => {
    if (status === 'success') {
      setJustCompleted(true)
      const t = setTimeout(() => setJustCompleted(false), 2000)
      return () => clearTimeout(t)
    }
  }, [status])

  useEffect(() => {
    if (result) setSlideCount(0)
  }, [result])

  const handleSlideCount = useCallback((n: number) => {
    setSlideCount((prev) => (prev !== n ? n : prev))
  }, [])

  useEffect(() => {
    if (!result) return
    function onKey(e: KeyboardEvent) {
      if (fullscreen) { if (e.key === 'Escape') setFullscreen(false); return }
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault(); setCurrentSlide(Math.min(slideCount - 1, currentSlide + 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault(); setCurrentSlide(Math.max(0, currentSlide - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result, currentSlide, slideCount, setCurrentSlide, fullscreen])

  const handleExportPptx = async () => {
    if (!result || exporting) return
    setExporting('pptx')
    const tid = toast.loading('Rendering slides to images…')
    try {
      const baseName = `decksmith-${new Date().toISOString().slice(0, 10)}`
      await exportToPptx({ html: result.html, slideCount: slideCount || 8, baseName })
      toast.success(`Exported ${slideCount} slides to PPTX`, { id: tid })
    } catch (err) {
      toast.error('PPTX export failed', { id: tid, description: err instanceof Error ? err.message : undefined })
    } finally { setExporting(null) }
  }

  const handleDownloadHtml = () => {
    if (!result) return
    setExporting('html')
    try {
      const baseName = `decksmith-${new Date().toISOString().slice(0, 10)}`
      downloadHtml(result.html, baseName)
      toast.success('HTML downloaded')
    } catch { toast.error('Download failed') }
    finally { setExporting(null) }
  }

  const handleExportPdf = () => {
    if (!result || exporting) return
    setExporting('pdf')
    try {
      const baseName = `decksmith-${new Date().toISOString().slice(0, 10)}`
      exportToPdf(result.html, baseName)
      toast.success('Opening print dialog — choose "Save as PDF"')
    } catch { toast.error('PDF export failed') }
    finally { setTimeout(() => setExporting(null), 1500) }
  }

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div
          className="mb-4 flex items-center justify-center"
          style={{ background: 'var(--soft-stone)', width: '64px', height: '64px', borderRadius: '8px' }}
        >
          <Eye className="size-7" style={{ color: 'var(--muted)' }} />
        </div>
        <h3 className="cohere-text-card-heading mb-2" style={{ fontSize: '24px' }}>
          Your deck appears here
        </h3>
        <p className="cohere-text-body max-w-sm mb-6" style={{ color: 'var(--body-muted)' }}>
          Write a brief, pick a template, hit generate. AI plans an outline first,
          then writes each slide in parallel.
        </p>
        <div className="grid grid-cols-2 gap-2 max-w-md w-full">
          <div className="flex items-center gap-2 p-3" style={{ background: 'var(--canvas)', borderRadius: '4px' }}>
            <ListChecks className="size-3.5" style={{ color: 'var(--ink)' }} />
            <span className="cohere-mono">Outline ~5s</span>
          </div>
          <div className="flex items-center gap-2 p-3" style={{ background: 'var(--canvas)', borderRadius: '4px' }}>
            <Sparkles className="size-3.5" style={{ color: 'var(--ink)' }} />
            <span className="cohere-mono">Slides ~3s each</span>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'outline-loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
          className="mb-4 flex items-center justify-center"
          style={{
            border: '2px solid var(--soft-stone)',
            borderTopColor: 'var(--primary)',
            width: '48px', height: '48px', borderRadius: '9999px',
          }}
        >
          <ListChecks className="size-4" style={{ color: 'var(--primary)' }} />
        </motion.div>
        <h3 className="cohere-text-feature mb-2">Planning your outline…</h3>
        <p className="cohere-text-body max-w-sm mb-6" style={{ color: 'var(--body-muted)' }}>
          Reading your brief and mapping slide titles, layouts, and content.
        </p>
        <div className="w-full max-w-sm space-y-1.5">
          <LoadingStep label="Analyzing brief" delay={0} />
          <LoadingStep label="Selecting strategy" delay={0.6} />
          <LoadingStep label="Writing outlines" delay={1.2} />
        </div>
      </div>
    )
  }

  if (status === 'outline-ready') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 20 }}
          className="mb-4 flex items-center justify-center"
          style={{ background: 'var(--primary)', color: 'var(--on-primary)', width: '56px', height: '56px', borderRadius: '9999px' }}
        >
          <CheckCircle2 className="size-6" />
        </motion.div>
        <h3 className="cohere-text-card-heading mb-2" style={{ fontSize: '24px' }}>Outline ready</h3>
        <p className="cohere-text-body max-w-sm mb-6" style={{ color: 'var(--body-muted)' }}>
          {outline?.slides.length ?? 0} slides planned. Review them in the panel on the right,
          then approve to generate each slide.
        </p>
        <div className="grid grid-cols-1 gap-1 max-w-md w-full">
          {outline?.slides.slice(0, 5).map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 text-left p-3"
              style={{ background: 'var(--canvas)', border: '1px solid var(--card-border)', borderRadius: '4px' }}
            >
              <span className="cohere-display text-lg shrink-0" style={{ lineHeight: 1, minWidth: '28px', color: 'var(--muted)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className="cohere-mono shrink-0"
                style={{ color: 'var(--muted)', background: 'var(--soft-stone)', padding: '3px 8px', borderRadius: '4px' }}
              >
                {s.layout}
              </span>
              <span className="cohere-text-button truncate">{s.title}</span>
            </motion.div>
          ))}
          {(outline?.slides.length ?? 0) > 5 && (
            <div className="cohere-mono text-center pt-2" style={{ color: 'var(--muted)' }}>
              + {(outline?.slides.length ?? 0) - 5} more
            </div>
          )}
        </div>
      </div>
    )
  }

  if (status === 'slides-loading') {
    const doneCount = slideStatuses.filter((s) => s.status === 'done').length
    const totalCount = slideStatuses.length
    const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
          className="mb-4 flex items-center justify-center"
          style={{
            border: '2px solid var(--soft-stone)',
            borderTopColor: 'var(--primary)',
            width: '48px', height: '48px', borderRadius: '9999px',
          }}
        >
          <Sparkles className="size-4" style={{ color: 'var(--primary)' }} />
        </motion.div>
        <h3 className="cohere-text-feature mb-2">Writing slides…</h3>
        <p className="cohere-text-body max-w-sm mb-6" style={{ color: 'var(--body-muted)' }}>
          {totalCount} concurrent AI calls — one per slide.
        </p>
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="cohere-mono" style={{ color: 'var(--muted)' }}>
              {doneCount} / {totalCount} slides
            </span>
            <motion.span
              key={pct}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="cohere-display text-2xl"
              style={{ lineHeight: 1, color: 'var(--ink)' }}
            >
              {pct}%
            </motion.span>
          </div>
          <div className="h-1.5 overflow-hidden" style={{ background: 'var(--soft-stone)', borderRadius: '9999px' }}>
            <motion.div
              className="h-full"
              style={{ background: 'var(--primary)', borderRadius: '9999px' }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="mt-4 grid grid-cols-8 gap-1">
            {slideStatuses.map((s) => (
              <div
                key={s.index}
                className="h-1.5"
                style={{
                  background:
                    s.status === 'done' ? 'var(--primary)' :
                    s.status === 'loading' ? 'var(--muted)' :
                    s.status === 'error' ? 'var(--error)' :
                    'var(--card-border)',
                  borderRadius: '9999px',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error' || !result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div
          className="mb-4 flex items-center justify-center"
          style={{ background: 'rgba(179, 0, 0, 0.08)', color: 'var(--error)', width: '56px', height: '56px', borderRadius: '9999px' }}
        >
          <X className="size-7" />
        </div>
        <h3 className="cohere-text-feature mb-2">Generation failed</h3>
        <p className="cohere-text-body max-w-sm" style={{ color: 'var(--body-muted)' }}>
          Try rephrasing your brief or picking a different template. Simplify if the text is very long.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Delight: success banner */}
      <AnimatePresence>
        {justCompleted && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="flex items-center gap-2 px-4 py-2"
            style={{ background: 'rgba(0, 125, 72, 0.08)', borderRadius: '8px', color: 'var(--success)' }}
          >
            <PartyPopper className="size-3.5" />
            <span className="cohere-mono">Deck ready · {slideCount} slides generated</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-1.5 rounded-full shrink-0" style={{ background: 'var(--success)' }} />
          <span className="cohere-mono truncate" style={{ color: 'var(--muted)' }}>
            {result.meta.autoSelected ? (
              <>Auto · <span style={{ color: 'var(--ink)' }}>{result.meta.templateId}</span></>
            ) : (
              <span style={{ color: 'var(--ink)' }}>{result.meta.templateId}</span>
            )}
            <span style={{ opacity: 0.5 }}> · {result.meta.framework}</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleCode} className="cohere-btn-outline" style={{ height: '32px', fontSize: '11px', padding: '0 10px', borderRadius: '20px' }}>
            {showCode ? <Eye className="size-3 mr-1" /> : <Code2 className="size-3 mr-1" />}
            <span className="hidden sm:inline">{showCode ? 'Preview' : 'Code'}</span>
          </button>
          <button onClick={() => setPresentMode(true)} className="cohere-btn-primary" style={{ height: '32px', fontSize: '11px', padding: '0 12px' }}>
            <Play className="size-3 mr-1" />
            <span className="hidden sm:inline">Present</span>
          </button>
          <button onClick={() => setFullscreen(true)} className="cohere-btn-outline" style={{ width: '32px', height: '32px', padding: '0', borderRadius: '9999px' }} aria-label="Fullscreen">
            <Maximize2 className="size-3.5" />
          </button>
          <button onClick={handleDownloadHtml} disabled={exporting !== null} className="cohere-btn-outline" style={{ height: '32px', fontSize: '11px', padding: '0 10px', borderRadius: '20px' }}>
            {exporting === 'html' ? <Loader2 className="size-3 mr-1 animate-spin" /> : <Download className="size-3 mr-1" />}
            <span className="hidden sm:inline">HTML</span>
          </button>
          <button onClick={handleExportPdf} disabled={exporting !== null} className="cohere-btn-outline" style={{ height: '32px', fontSize: '11px', padding: '0 10px', borderRadius: '20px' }}>
            {exporting === 'pdf' ? <Loader2 className="size-3 mr-1 animate-spin" /> : <FileText className="size-3 mr-1" />}
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button onClick={handleExportPptx} disabled={exporting !== null} className="cohere-btn-primary" style={{ height: '32px', fontSize: '11px', padding: '0 12px' }}>
            {exporting === 'pptx' ? <Loader2 className="size-3 mr-1 animate-spin" /> : <FileDown className="size-3 mr-1" />}
            <span className="hidden sm:inline">PPTX</span>
          </button>
        </div>
      </div>

      {/* Preview / code */}
      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {showCode ? (
            <motion.div
              key="code"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 overflow-hidden"
              style={{ background: 'var(--primary)', borderRadius: '8px' }}
            >
              <pre className="h-full w-full overflow-auto p-4 text-[11px] leading-relaxed font-mono whitespace-pre-wrap break-all cohere-scroll" style={{ color: 'var(--canvas)' }}>
                {result.html}
              </pre>
            </motion.div>
          ) : (
            <motion.div
              key={`preview-${currentSlide}`}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 overflow-hidden"
              style={{ background: 'var(--canvas)', borderRadius: '8px' }}
            >
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div
                  className="relative overflow-hidden"
                  style={{
                    background: 'var(--canvas)',
                    width: 'min(100%, calc((100vh - 280px) * 16/9))',
                    aspectRatio: '16 / 9',
                    border: '1px solid var(--card-border)',
                    borderRadius: '8px',
                  }}
                >
                  <DeckPreview html={result.html} slideIndex={currentSlide} onSlideCountChange={handleSlideCount} />
                </div>
              </div>

              <div className="absolute inset-y-0 left-2 flex items-center">
                <button
                  onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                  disabled={currentSlide === 0}
                  className="cohere-btn-outline"
                  style={{ width: '32px', height: '32px', padding: '0', borderRadius: '9999px', opacity: currentSlide === 0 ? 0.3 : 1 }}
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="size-4" />
                </button>
              </div>
              <div className="absolute inset-y-0 right-2 flex items-center">
                <button
                  onClick={() => setCurrentSlide(Math.min(slideCount - 1, currentSlide + 1))}
                  disabled={currentSlide >= slideCount - 1}
                  className="cohere-btn-outline"
                  style={{ width: '32px', height: '32px', padding: '0', borderRadius: '9999px', opacity: currentSlide >= slideCount - 1 ? 0.3 : 1 }}
                  aria-label="Next slide"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <div
                className="absolute top-3 right-3 px-3 py-1.5"
                style={{ background: 'var(--canvas)', border: '1px solid var(--card-border)', borderRadius: '9999px' }}
              >
                <span className="cohere-display text-base" style={{ lineHeight: 1 }}>
                  {String(currentSlide + 1).padStart(2, '0')}
                </span>
                <span className="cohere-mono ml-1" style={{ color: 'var(--muted)' }}>
                  / {String(slideCount).padStart(2, '0')}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Slide navigator */}
      {!showCode && slideCount > 0 && (
        <div className="h-[140px] flex-shrink-0">
          <SlideNavigator
            html={result.html}
            currentSlide={currentSlide}
            slideCount={slideCount}
            onSlideChange={setCurrentSlide}
            slideTitles={outline?.slides.map(s => s.title)}
          />
        </div>
      )}

      {/* Fullscreen modal */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: 'var(--primary)' }}
          >
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3" style={{ color: 'var(--canvas)' }}>
                <CheckCircle2 className="size-4" style={{ color: 'var(--success)' }} />
                <span className="cohere-text-button">
                  {String(currentSlide + 1).padStart(2, '0')} / {String(slideCount).padStart(2, '0')}
                </span>
              </div>
              <button onClick={() => setFullscreen(false)} className="cohere-btn-primary" style={{ background: 'var(--canvas)', color: 'var(--primary)' }}>
                <X className="size-4 mr-1" /> Close
              </button>
            </div>
            <div className="flex-1 p-6 flex items-center justify-center">
              <div
                className="relative overflow-hidden"
                style={{ background: 'var(--canvas)', width: 'min(100%, calc((100vh - 200px) * 16/9))', aspectRatio: '16 / 9', borderRadius: '8px' }}
              >
                <DeckPreview html={result.html} slideIndex={currentSlide} />
              </div>
            </div>
            <div className="p-4 flex items-center justify-center gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
                className="cohere-btn-primary"
                style={{ background: 'var(--canvas)', color: 'var(--primary)', opacity: currentSlide === 0 ? 0.3 : 1 }}
              >
                <ChevronLeft className="size-4 mr-1" /> Prev
              </button>
              <button
                onClick={() => setCurrentSlide(Math.min(slideCount - 1, currentSlide + 1))}
                disabled={currentSlide >= slideCount - 1}
                className="cohere-btn-primary"
                style={{ background: 'var(--canvas)', color: 'var(--primary)', opacity: currentSlide >= slideCount - 1 ? 0.3 : 1 }}
              >
                Next <ChevronRight className="size-4 ml-1" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LoadingStep({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-2"
    >
      <Loader2 className="size-3 animate-spin" style={{ color: 'var(--primary)' }} />
      <span className="cohere-mono" style={{ color: 'var(--muted)' }}>{label}</span>
    </motion.div>
  )
}
