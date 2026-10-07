'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Code2, Eye, Download, FileDown, Loader2, Maximize2, X,
  ChevronLeft, ChevronRight, CheckCircle2, Play, FileText,
  ListChecks, Sparkles, PartyPopper, PanelLeftClose, PanelLeftOpen,
  PanelRightClose, PanelRightOpen, RotateCcw,
} from 'lucide-react'
import { usePresentation } from '@/lib/presentation/store'
import { DeckPreview } from '../presentation/deck-preview'
import { SlideNavigator } from '../presentation/slide-navigator'
import { OutlinePanel } from '../presentation/outline-panel'
import { exportToPptx, downloadHtml, exportToPdf } from '@/lib/presentation/export'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export function BuildPage() {
  const {
    result, status, outline, slideStatuses,
    currentSlide, setCurrentSlide,
    showCode, toggleCode, setPresentMode,
    leftPanelOpen, toggleLeftPanel, rightPanelOpen, toggleRightPanel,
    text, setText, tone, setTone, verbosity, setVerbosity,
    audience, setAudience, focus, setFocus,
    reset,
  } = usePresentation()
  const [slideCount, setSlideCount] = useState(0)
  const [exporting, setExporting] = useState<'pptx' | 'html' | 'pdf' | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => { if (result) setSlideCount(0) }, [result])

  const handleSlideCount = useCallback((n: number) => {
    setSlideCount((prev) => (prev !== n ? n : prev))
  }, [])

  useEffect(() => {
    if (!result) return
    function onKey(e: KeyboardEvent) {
      if (fullscreen) { if (e.key === 'Escape') setFullscreen(false); return }
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); setCurrentSlide(Math.min(slideCount - 1, currentSlide + 1)) }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); setCurrentSlide(Math.max(0, currentSlide - 1)) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result, currentSlide, slideCount, setCurrentSlide, fullscreen])

  const handleExportPptx = async () => {
    if (!result || exporting) return
    setExporting('pptx')
    const tid = toast.loading('Rendering slides…')
    try {
      await exportToPptx({ html: result.html, slideCount: slideCount || 8, baseName: `decksmith-${new Date().toISOString().slice(0, 10)}` })
      toast.success(`Exported ${slideCount} slides to PPTX`, { id: tid })
    } catch (err) { toast.error('PPTX export failed', { id: tid }) }
    finally { setExporting(null) }
  }

  const handleDownloadHtml = () => {
    if (!result) return
    setExporting('html')
    try { downloadHtml(result.html, `decksmith-${new Date().toISOString().slice(0, 10)}`); toast.success('HTML downloaded') }
    catch { toast.error('Download failed') }
    finally { setExporting(null) }
  }

  const handleExportPdf = () => {
    if (!result || exporting) return
    setExporting('pdf')
    try { exportToPdf(result.html, `decksmith-${new Date().toISOString().slice(0, 10)}`); toast.success('Opening print dialog — choose "Save as PDF"') }
    catch { toast.error('PDF export failed') }
    finally { setTimeout(() => setExporting(null), 1500) }
  }

  // Loading states
  if (status === 'outline-loading' || status === 'outline-ready' || status === 'idle') {
    return <LoadingState icon={ListChecks} title="Preparing your deck…" subtitle="The outline is ready. Review it in the panel on the right, then approve to generate slides." />
  }
  if (status === 'slides-loading') {
    const done = slideStatuses.filter(s => s.status === 'done').length
    const total = slideStatuses.length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
          className="mb-4 flex items-center justify-center"
          style={{ border: '2px solid var(--soft-stone)', borderTopColor: 'var(--primary)', width: '48px', height: '48px', borderRadius: '9999px' }}>
          <Sparkles className="size-4" style={{ color: 'var(--primary)' }} />
        </motion.div>
        <h3 className="cohere-text-feature mb-2">Writing slides…</h3>
        <p className="cohere-text-body mb-6" style={{ color: 'var(--slate)' }}>{total} concurrent AI calls</p>
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="cohere-mono" style={{ color: 'var(--slate)' }}>{done} / {total}</span>
            <span className="cohere-display text-2xl" style={{ lineHeight: 1 }}>{pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden" style={{ background: 'var(--soft-stone)', borderRadius: '9999px' }}>
            <motion.div className="h-full" style={{ background: 'var(--primary)', borderRadius: '9999px' }} animate={{ width: `${pct}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
      </div>
    )
  }
  if (status === 'error' || !result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="mb-4 flex items-center justify-center" style={{ background: 'rgba(179,0,0,0.08)', color: 'var(--error)', width: '56px', height: '56px', borderRadius: '9999px' }}>
          <X className="size-7" />
        </div>
        <h3 className="cohere-text-feature mb-2">Generation failed</h3>
        <p className="cohere-text-body mb-4" style={{ color: 'var(--slate)' }}>Try rephrasing your brief or picking a different template.</p>
        <button onClick={() => { reset() }} className="cohere-btn-primary" style={{ height: '40px' }}>
          <RotateCcw className="size-4 mr-1.5" /> Start over
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel — edit options (minimizable) */}
      <AnimatePresence>
        {leftPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }} animate={{ width: '300px', opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 overflow-hidden border-r flex flex-col"
            style={{ borderColor: 'var(--hairline)', background: 'var(--canvas)' }}
          >
            <div className="p-4 overflow-y-auto cohere-scroll flex-1">
              <div className="flex items-center justify-between mb-4">
                <span className="cohere-mono" style={{ color: 'var(--ink)' }}>Edit Options</span>
                <button onClick={toggleLeftPanel} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--slate)' }}>
                  <PanelLeftClose className="size-4" />
                </button>
              </div>
              {/* Prompt (editable) */}
              <div className="flex flex-col gap-1.5 mb-4">
                <span className="cohere-mono" style={{ color: 'var(--slate)' }}>Prompt</span>
                <textarea value={text} onChange={(e) => setText(e.target.value)}
                  className="cohere-input w-full min-h-[100px] resize-none cohere-text-caption"
                  style={{ borderRadius: '8px' }} suppressHydrationWarning />
              </div>
              {/* Audience */}
              <div className="flex flex-col gap-1.5 mb-4">
                <span className="cohere-mono" style={{ color: 'var(--slate)' }}>Audience</span>
                <input value={audience} onChange={(e) => setAudience(e.target.value)}
                  placeholder="investors" className="cohere-input w-full" suppressHydrationWarning />
              </div>
              {/* Strategy */}
              <div className="flex flex-col gap-1.5 mb-4">
                <span className="cohere-mono" style={{ color: 'var(--slate)' }}>Strategy</span>
                <input value={focus} onChange={(e) => setFocus(e.target.value)}
                  placeholder="kawasaki-10" className="cohere-input w-full" suppressHydrationWarning />
              </div>
              {/* Tone + Verbosity */}
              <div className="flex flex-col gap-1.5 mb-4">
                <span className="cohere-mono" style={{ color: 'var(--slate)' }}>Tone</span>
                <div className="flex flex-wrap gap-1">
                  {(['default','casual','professional','funny','educational','sales-pitch'] as const).map(t => (
                    <button key={t} onClick={() => setTone(t)} className="cohere-btn-outline"
                      data-active={tone === t} style={{ height: '28px', fontSize: '10px', padding: '0 8px' }}>
                      {t === 'sales-pitch' ? 'Sales' : t.charAt(0).toUpperCase() + t.slice(1, 4)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                <span className="cohere-mono" style={{ color: 'var(--slate)' }}>Verbosity</span>
                <div className="flex flex-wrap gap-1">
                  {(['concise','standard','text-heavy'] as const).map(v => (
                    <button key={v} onClick={() => setVerbosity(v)} className="cohere-btn-outline"
                      data-active={verbosity === v} style={{ height: '28px', fontSize: '10px', padding: '0 8px' }}>
                      {v === 'text-heavy' ? 'Detailed' : v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center — slides */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--hairline)' }}>
          <div className="flex items-center gap-2">
            {!leftPanelOpen && (
              <button onClick={toggleLeftPanel} className="cohere-btn-outline" style={{ width: '32px', height: '32px', padding: '0', borderRadius: '9999px' }}>
                <PanelLeftOpen className="size-4" />
              </button>
            )}
            <div className="size-1.5 rounded-full" style={{ background: 'var(--success)' }} />
            <span className="cohere-mono truncate" style={{ color: 'var(--slate)' }}>
              {result.meta.templateId} · {result.meta.framework}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleCode} className="cohere-btn-outline" style={{ height: '30px', fontSize: '11px', padding: '0 8px', borderRadius: '20px' }}>
              {showCode ? <Eye className="size-3 mr-1" /> : <Code2 className="size-3 mr-1" />}
              <span className="hidden sm:inline">{showCode ? 'Preview' : 'Code'}</span>
            </button>
            <button onClick={() => setPresentMode(true)} className="cohere-btn-primary" style={{ height: '30px', fontSize: '11px', padding: '0 10px' }}>
              <Play className="size-3 mr-1" /><span className="hidden sm:inline">Present</span>
            </button>
            <button onClick={() => setFullscreen(true)} className="cohere-btn-outline" style={{ width: '30px', height: '30px', padding: '0', borderRadius: '9999px' }}>
              <Maximize2 className="size-3" />
            </button>
            <button onClick={handleDownloadHtml} disabled={exporting !== null} className="cohere-btn-outline" style={{ height: '30px', fontSize: '11px', padding: '0 8px', borderRadius: '20px' }}>
              {exporting === 'html' ? <Loader2 className="size-3 mr-1 animate-spin" /> : <Download className="size-3 mr-1" />}HTML
            </button>
            <button onClick={handleExportPdf} disabled={exporting !== null} className="cohere-btn-outline" style={{ height: '30px', fontSize: '11px', padding: '0 8px', borderRadius: '20px' }}>
              {exporting === 'pdf' ? <Loader2 className="size-3 mr-1 animate-spin" /> : <FileText className="size-3 mr-1" />}PDF
            </button>
            <button onClick={handleExportPptx} disabled={exporting !== null} className="cohere-btn-primary" style={{ height: '30px', fontSize: '11px', padding: '0 10px' }}>
              {exporting === 'pptx' ? <Loader2 className="size-3 mr-1 animate-spin" /> : <FileDown className="size-3 mr-1" />}PPTX
            </button>
            {!rightPanelOpen && (
              <button onClick={toggleRightPanel} className="cohere-btn-outline" style={{ width: '30px', height: '30px', padding: '0', borderRadius: '9999px' }}>
                <PanelRightOpen className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 min-h-0 relative">
          <AnimatePresence mode="wait">
            {showCode ? (
              <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 overflow-hidden" style={{ background: 'var(--primary)', borderRadius: '0' }}>
                <pre className="h-full w-full overflow-auto p-4 text-[11px] font-mono whitespace-pre-wrap break-all cohere-scroll" style={{ color: 'var(--canvas)' }}>
                  {result.html}
                </pre>
              </motion.div>
            ) : (
              <motion.div key={`preview-${currentSlide}`}
                initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 overflow-hidden" style={{ background: 'var(--soft-stone)' }}>
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="relative overflow-hidden" style={{ background: 'var(--canvas)', width: 'min(100%, calc((100vh - 300px) * 16/9))', aspectRatio: '16 / 9', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
                    <DeckPreview html={result.html} slideIndex={currentSlide} onSlideCountChange={handleSlideCount} />
                  </div>
                </div>
                <div className="absolute inset-y-0 left-2 flex items-center">
                  <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}
                    className="cohere-btn-outline" style={{ width: '30px', height: '30px', padding: '0', borderRadius: '9999px', opacity: currentSlide === 0 ? 0.3 : 1 }}>
                    <ChevronLeft className="size-4" />
                  </button>
                </div>
                <div className="absolute inset-y-0 right-2 flex items-center">
                  <button onClick={() => setCurrentSlide(Math.min(slideCount - 1, currentSlide + 1))} disabled={currentSlide >= slideCount - 1}
                    className="cohere-btn-outline" style={{ width: '30px', height: '30px', padding: '0', borderRadius: '9999px', opacity: currentSlide >= slideCount - 1 ? 0.3 : 1 }}>
                    <ChevronRight className="size-4" />
                  </button>
                </div>
                <div className="absolute top-2 right-2 px-2.5 py-1" style={{ background: 'var(--canvas)', border: '1px solid var(--card-border)', borderRadius: '9999px' }}>
                  <span className="cohere-display text-sm" style={{ lineHeight: 1 }}>{String(currentSlide + 1).padStart(2, '0')}</span>
                  <span className="cohere-mono ml-1" style={{ color: 'var(--muted)' }}>/ {String(slideCount).padStart(2, '0')}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Slide navigator */}
        {!showCode && slideCount > 0 && (
          <div className="h-[120px] flex-shrink-0 px-3 pb-2">
            <SlideNavigator html={result.html} currentSlide={currentSlide} slideCount={slideCount}
              onSlideChange={setCurrentSlide} slideTitles={outline?.slides.map(s => s.title)} />
          </div>
        )}
      </div>

      {/* Right panel — slide info (minimizable) */}
      <AnimatePresence>
        {rightPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }} animate={{ width: '280px', opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 overflow-hidden border-l flex flex-col"
            style={{ borderColor: 'var(--hairline)', background: 'var(--canvas)' }}
          >
            <div className="p-4 overflow-y-auto cohere-scroll flex-1">
              <div className="flex items-center justify-between mb-4">
                <span className="cohere-mono" style={{ color: 'var(--ink)' }}>Slide Info</span>
                <button onClick={toggleRightPanel} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--slate)' }}>
                  <PanelRightClose className="size-4" />
                </button>
              </div>
              {outline && outline.slides[currentSlide] && (
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="cohere-mono block mb-1" style={{ color: 'var(--slate)' }}>Title</span>
                    <p className="cohere-text-body-strong">{outline.slides[currentSlide].title}</p>
                  </div>
                  <div>
                    <span className="cohere-mono block mb-1" style={{ color: 'var(--slate)' }}>Layout</span>
                    <span className="cohere-mono" style={{ background: 'var(--soft-stone)', padding: '3px 8px', borderRadius: '4px', color: 'var(--ink)' }}>
                      {outline.slides[currentSlide].layout}
                    </span>
                  </div>
                  <div>
                    <span className="cohere-mono block mb-1" style={{ color: 'var(--slate)' }}>Content</span>
                    <p className="cohere-text-caption leading-relaxed" style={{ color: 'var(--slate)' }}>
                      {outline.slides[currentSlide].content_markdown}
                    </p>
                  </div>
                  <div>
                    <span className="cohere-mono block mb-1" style={{ color: 'var(--slate)' }}>Speaker Notes</span>
                    <p className="cohere-text-caption leading-relaxed" style={{ color: 'var(--slate)' }}>
                      {outline.slides[currentSlide].speaker_notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LoadingState({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        className="mb-4 flex items-center justify-center"
        style={{ border: '2px solid var(--soft-stone)', borderTopColor: 'var(--primary)', width: '48px', height: '48px', borderRadius: '9999px' }}>
        <Icon className="size-4" style={{ color: 'var(--primary)' }} />
      </motion.div>
      <h3 className="cohere-text-feature mb-2">{title}</h3>
      <p className="cohere-text-body max-w-sm" style={{ color: 'var(--slate)' }}>{subtitle}</p>
    </div>
  )
}
