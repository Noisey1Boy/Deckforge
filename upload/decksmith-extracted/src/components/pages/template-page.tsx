'use client'

import { motion } from 'framer-motion'
import { Search, X, Sparkles, Loader2, ArrowLeft, Check } from 'lucide-react'
import { usePresentation, type TemplateMeta } from '@/lib/presentation/store'
import { useSyncExternalStore, useMemo, useState, useEffect, useRef } from 'react'
import { TemplateGallery } from '@/components/presentation/template-gallery'

export function TemplatePage({ onBack, onGenerate }: { onBack: () => void; onGenerate: () => void }) {
  const { templateId, setTemplateId, generating, status, error } = usePresentation()
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [loadingTpls, setLoadingTpls] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch('/api/templates').then(r => r.json()).then(d => { setTemplates(d.templates ?? []); setLoadingTpls(false) }).catch(() => setLoadingTpls(false))
  }, [])

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 min-h-[calc(100vh-64px-36px)]">
      <div className="mb-6">
        <span className="cohere-mono block mb-2" style={{ color: 'var(--slate)' }}>Step 2</span>
        <h2 className="cohere-display" style={{ fontSize: 'clamp(24px, 4vw, 36px)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          Choose a template
        </h2>
        <p className="cohere-text-body mt-2" style={{ color: 'var(--slate)' }}>
          Pick from {templates.length} designs or let AI auto-select.
        </p>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-4 px-4 py-3 cohere-text-caption"
          style={{ color: 'var(--error)', background: 'rgba(179,0,0,0.05)', border: '1px solid rgba(179,0,0,0.2)', borderRadius: '8px' }}>
          {error}
        </motion.div>
      )}

      {loadingTpls && templates.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="cohere-skeleton" style={{ aspectRatio: '16/10', borderRadius: '8px' }} />
          ))}
        </div>
      ) : (
        <TemplateGallery templates={templates} />
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-8 pt-4" style={{ borderTop: '1px solid var(--hairline)' }}>
        <button onClick={onBack} className="cohere-btn-outline" style={{ height: '40px' }}>
          <ArrowLeft className="size-4 mr-1.5" /> Back to prompt
        </button>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="cohere-btn-primary"
          style={{ height: '40px', fontSize: '14px', padding: '0 24px' }}
        >
          {generating ? (
            <><Loader2 className="size-4 mr-2 animate-spin" /> Generating…</>
          ) : (
            <><Sparkles className="size-4 mr-2" /> Generate presentation</>
          )}
        </button>
      </div>
    </div>
  )
}
