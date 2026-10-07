'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, Sparkles, Search, X } from 'lucide-react'
import { usePresentation, type TemplateMeta } from '@/lib/presentation/store'
import { useSyncExternalStore, useMemo, useState, useEffect, useRef } from 'react'

interface TemplateGalleryProps {
  templates: TemplateMeta[]
}

const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

function ThumbnailSkeleton() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 cohere-skeleton" />
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
        <div className="h-3 w-20 cohere-skeleton" style={{ borderRadius: '4px' }} />
        <div className="h-2.5 w-full cohere-skeleton" style={{ borderRadius: '4px' }} />
        <div className="h-2.5 w-3/4 cohere-skeleton" style={{ borderRadius: '4px' }} />
      </div>
    </div>
  )
}

function LazyTemplateThumb({ tpl }: { tpl: TemplateMeta }) {
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [scale, setScale] = useState(0.25)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            obs.disconnect()
          }
        }
      },
      { rootMargin: '200px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const updateScale = () => {
      const w = el.offsetWidth
      if (w > 0) setScale(w / 1280)
    }
    updateScale()
    const ro = new ResizeObserver(updateScale)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: '16 / 9',
        background: 'var(--soft-stone)',
        borderRadius: '8px',
      }}
    >
      {!loaded && <ThumbnailSkeleton />}
      {mounted && inView && (
        <iframe
          src={`/templates/${tpl.id}/template.html?preview=0`}
          title={tpl.name}
          sandbox="allow-scripts allow-same-origin"
          className="pointer-events-none absolute top-0 left-0 origin-top-left"
          style={{ width: '1280px', height: '720px', transform: `scale(${scale})` }}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  )
}

const FRAMEWORK_LABELS: Record<string, { label: string; color: string }> = {
  'reveal.js': { label: 'reveal.js', color: 'var(--action-blue)' },
  'impress.js': { label: 'impress.js', color: 'var(--coral)' },
  'shower': { label: 'shower', color: 'var(--success)' },
  'dzslides': { label: 'dzslides', color: 'var(--error)' },
}

export function TemplateGallery({ templates }: TemplateGalleryProps) {
  const { templateId, setTemplateId } = usePresentation()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('All')

  const categories = useMemo(() => {
    const set = new Set<string>(['All'])
    templates.forEach((t) => set.add(t.category))
    return Array.from(set).sort()
  }, [templates])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter((t) => {
      if (category !== 'All' && t.category !== category) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        t.tagline.toLowerCase().includes(q) ||
        t.style.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.includes(q)) ||
        t.bestFor.some((b) => b.toLowerCase().includes(q))
      )
    })
  }, [templates, query, category])

  return (
    <div className="flex flex-col gap-4">
      {/* Search + category filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 pointer-events-none"
            style={{ color: 'var(--muted)' }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${templates.length} templates…`}
            className="cohere-search w-full pl-10 pr-10"
            suppressHydrationWarning
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full flex items-center justify-center transition-opacity hover:opacity-60"
              style={{ background: 'var(--soft-stone)', color: 'var(--muted)' }}
              aria-label="Clear search"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 cohere-scroll">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="cohere-btn-outline shrink-0"
              data-active={category === cat}
              style={{ height: '36px', borderRadius: '20px' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <span className="cohere-mono" style={{ color: 'var(--muted)' }}>
          Showing {filtered.length} of {templates.length}
        </span>
        {(query || category !== 'All') && (
          <button
            onClick={() => { setQuery(''); setCategory('All') }}
            className="cohere-text-caption hover:opacity-60 transition-opacity"
            style={{ color: 'var(--action-blue)' }}
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Grid — Cohere rounded media cards on soft-stone */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Auto-select card */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setTemplateId(null)}
          className="group relative text-left transition-opacity cohere-card"
          style={{
            background: templateId === null ? 'var(--primary)' : 'var(--canvas)',
            color: templateId === null ? 'var(--on-primary)' : 'var(--ink)',
            border: templateId === null ? '1px solid var(--primary)' : '1px solid var(--card-border)',
          }}
        >
          <div
            className="relative w-full overflow-hidden flex flex-col items-center justify-center"
            style={{
              aspectRatio: '16 / 9',
              background: templateId === null ? 'var(--canvas)' : 'var(--primary)',
              color: templateId === null ? 'var(--ink)' : 'var(--canvas)',
              borderRadius: '8px',
            }}
          >
            <Sparkles className="size-7 mb-2" style={{ opacity: 0.8 }} />
            <span className="cohere-display text-xl" style={{ lineHeight: 0.9 }}>
              Auto
            </span>
            <span className="cohere-display text-xl" style={{ lineHeight: 0.9 }}>
              select
            </span>
            {templateId === null && (
              <div
                className="absolute top-2 right-2 rounded-full p-1"
                style={{ background: 'var(--canvas)', color: 'var(--primary)' }}
              >
                <Check className="size-2.5" />
              </div>
            )}
          </div>
          <div className="p-3">
            <span className="cohere-mono block mb-0.5" style={{ color: 'var(--muted)', opacity: 0.6 }}>
              Recommended
            </span>
            <span className="cohere-text-button">Let AI pick</span>
          </div>
        </motion.button>

        <AnimatePresence mode="popLayout">
          {filtered.map((tpl, i) => {
            const isSelected = templateId === tpl.id
            const fw = tpl.framework ? FRAMEWORK_LABELS[tpl.framework] : null
            return (
              <motion.button
                key={tpl.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i * 0.02, 0.4), duration: 0.25 }}
                onClick={() => setTemplateId(tpl.id)}
                className="group relative text-left cohere-card"
                style={{
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--card-border)',
                }}
                data-selected={isSelected}
              >
                <div className="p-2">
                  <LazyTemplateThumb tpl={tpl} />
                </div>

                {isSelected && (
                  <div
                    className="absolute top-3 right-3 rounded-full p-1 z-10"
                    style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
                  >
                    <Check className="size-2.5" />
                  </div>
                )}

                {fw && (
                  <div
                    className="absolute top-3 left-3 z-10"
                    style={{
                      background: 'var(--canvas)',
                      color: fw.color,
                      border: '1px solid var(--card-border)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      fontWeight: 500,
                    }}
                  >
                    {fw.label}
                  </div>
                )}

                <div className="px-3 pb-3 pt-2">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h4
                      className="cohere-text-button truncate"
                      style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.01em' }}
                    >
                      {tpl.name}
                    </h4>
                    <span
                      className="cohere-display text-base shrink-0"
                      style={{ lineHeight: 1, color: 'var(--muted)' }}
                    >
                      {tpl.slidesCount}
                    </span>
                  </div>
                  <p className="cohere-text-micro line-clamp-2 mb-2" style={{ color: 'var(--body-muted)' }}>
                    {tpl.tagline}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {tpl.palette.slice(0, 4).map((c, idx) => (
                      <span
                        key={idx}
                        className="size-2.5 rounded-full"
                        style={{
                          backgroundColor: c,
                          border: '1px solid var(--card-border)',
                        }}
                        aria-hidden
                      />
                    ))}
                    <span className="cohere-mono ml-1 truncate" style={{ color: 'var(--muted)', fontSize: '10px' }}>
                      {tpl.fonts[0] ?? ''}
                    </span>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div
            className="mb-4 flex items-center justify-center"
            style={{
              background: 'var(--soft-stone)',
              width: '56px',
              height: '56px',
              borderRadius: '8px',
            }}
          >
            <Search className="size-5" style={{ color: 'var(--muted)' }} />
          </div>
          <h4 className="cohere-text-feature mb-1">No templates found</h4>
          <p className="cohere-text-caption max-w-xs mb-4">
            Try a different search term or category. Browse all {templates.length} templates by clearing your filters.
          </p>
          <button
            onClick={() => { setQuery(''); setCategory('All') }}
            className="cohere-btn-primary"
            style={{ height: '36px', fontSize: '12px', padding: '0 16px' }}
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
