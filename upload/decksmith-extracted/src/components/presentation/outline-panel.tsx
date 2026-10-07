'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Loader2, AlertCircle, ChevronRight, Pencil, X, RotateCcw } from 'lucide-react'
import { usePresentation } from '@/lib/presentation/store'
import { useState } from 'react'

export function OutlinePanel() {
  const {
    status, outline, slideStatuses,
    approveOutlineAndGenerate, setOutlinePanel, generating, regenerateSlide,
  } = usePresentation()

  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // Don't render if no outline, or if generation succeeded and panel was dismissed
  if (!outline) return null
  // Auto-hide after success — the panel is only for review + progress states
  if (status === 'success' || status === 'error' || status === 'idle') return null

  const isReview = status === 'outline-ready'
  const isProgress = status === 'slides-loading'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 320 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 320 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed inset-y-0 right-0 z-40 w-full max-w-md flex flex-col"
        style={{ background: 'var(--canvas)', borderLeft: '1px solid var(--hairline)' }}
      >
        {/* Header — always has close button */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--hairline)' }}>
          <div className="min-w-0 flex-1">
            <span className="cohere-mono block mb-1">
              {isReview ? 'Review outline' : isProgress ? 'Generating' : 'Outline'}
            </span>
            <h3 className="cohere-display text-2xl truncate" style={{ lineHeight: 1, letterSpacing: '-0.02em' }}>
              {outline.title}
            </h3>
            <span className="cohere-mono mt-1 block" style={{ color: 'var(--slate)' }}>
              {outline.slides.length} slides
            </span>
          </div>
          {/* Close button — always visible */}
          <button
            onClick={() => setOutlinePanel(false)}
            className="cohere-btn-outline shrink-0 ml-3"
            style={{ width: '32px', height: '32px', padding: '0', borderRadius: '9999px' }}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Slide list — research-table style with rule-separated rows */}
        <div className="flex-1 overflow-y-auto cohere-scroll">
          {outline.slides.map((slide, i) => {
            const s = slideStatuses.find((ss) => ss.index === i)
            const isEditing = editingIndex === i
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className="p-4 group"
                style={{ borderBottom: '1px solid var(--hairline)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {s?.status === 'done' ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 20 }}>
                        <CheckCircle2 className="size-4" style={{ color: 'var(--success)' }} />
                      </motion.div>
                    ) : s?.status === 'loading' ? (
                      <Loader2 className="size-4 animate-spin" style={{ color: 'var(--slate)' }} />
                    ) : s?.status === 'error' ? (
                      <AlertCircle className="size-4" style={{ color: 'var(--error)' }} />
                    ) : (
                      <span className="cohere-display text-base" style={{ lineHeight: 1, color: 'var(--slate)', minWidth: '22px' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="cohere-mono shrink-0"
                        style={{ color: 'var(--slate)', background: 'var(--soft-stone)', padding: '3px 8px', borderRadius: '4px' }}
                      >
                        {slide.layout}
                      </span>
                      {isReview && (
                        <button
                          onClick={() => setEditingIndex(isEditing ? null : i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--slate)' }}
                          aria-label="Edit"
                        >
                          <Pencil className="size-3" />
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <input
                        autoFocus
                        defaultValue={slide.title}
                        onChange={(e) => { slide.title = e.target.value }}
                        className="w-full cohere-text-button bg-transparent border-b pb-1 mb-2"
                        style={{ borderColor: 'var(--form-focus)', fontFamily: 'var(--font-inter)' }}
                        suppressHydrationWarning
                      />
                    ) : (
                      <h4 className="cohere-text-button leading-tight mb-1">{slide.title}</h4>
                    )}

                    {isEditing ? (
                      <textarea
                        defaultValue={slide.content_markdown}
                        onChange={(e) => { slide.content_markdown = e.target.value }}
                        className="w-full cohere-text-caption p-2 resize-none"
                        style={{ background: 'var(--soft-stone)', border: '0', borderRadius: '4px', fontFamily: 'var(--font-inter)', color: 'var(--slate)' }}
                        rows={4}
                        suppressHydrationWarning
                      />
                    ) : (
                      <p className="cohere-text-caption line-clamp-2 leading-relaxed" style={{ color: 'var(--slate)' }}>
                        {slide.content_markdown}
                      </p>
                    )}

                    {s?.status === 'error' && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="cohere-mono" style={{ color: 'var(--error)' }}>
                          Failed
                        </span>
                        <button
                          onClick={() => regenerateSlide(i)}
                          disabled={generating}
                          className="cohere-btn-outline"
                          style={{ height: '24px', fontSize: '10px', padding: '0 8px', borderRadius: '12px' }}
                        >
                          <RotateCcw className="size-2.5 mr-1" />
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Footer */}
        {isReview && (
          <div className="p-5" style={{ borderTop: '1px solid var(--hairline)' }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={approveOutlineAndGenerate}
              disabled={generating}
              className="cohere-btn-primary w-full"
              style={{ height: '48px' }}
            >
              Generate {outline.slides.length} slides
              <ChevronRight className="size-4 ml-1" />
            </motion.button>
            <p className="cohere-mono mt-3 text-center" style={{ color: 'var(--slate)' }}>
              Concurrent per-slide HTML
            </p>
          </div>
        )}

        {isProgress && (
          <div className="p-5" style={{ borderTop: '1px solid var(--hairline)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="cohere-mono" style={{ color: 'var(--slate)' }}>
                {slideStatuses.filter((s) => s.status === 'done').length} / {slideStatuses.length}
              </span>
              <motion.span
                key={Math.round((slideStatuses.filter((s) => s.status === 'done').length / slideStatuses.length) * 100)}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="cohere-display text-2xl"
                style={{ lineHeight: 1 }}
              >
                {Math.round((slideStatuses.filter((s) => s.status === 'done').length / slideStatuses.length) * 100)}%
              </motion.span>
            </div>
            <div className="h-1 overflow-hidden" style={{ background: 'var(--soft-stone)', borderRadius: '9999px' }}>
              <motion.div
                className="h-full"
                style={{ background: 'var(--primary)', borderRadius: '9999px' }}
                animate={{ width: `${(slideStatuses.filter((s) => s.status === 'done').length / slideStatuses.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
