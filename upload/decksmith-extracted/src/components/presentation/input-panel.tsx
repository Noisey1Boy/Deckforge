'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, RotateCcw, FileText, Layers, ChevronDown, Settings2 } from 'lucide-react'
import { usePresentation, type Tone, type Verbosity } from '@/lib/presentation/store'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useState } from 'react'

const EXAMPLE_PROMPTS = [
  { title: 'Pitch', text: 'Lumen — an AI calendar that protects deep-work time. Problem: knowledge workers lose 23% of focus to meetings. Solution: Lumen auto-blocks focus time, declines low-priority invites, and drafts agendas. Traction: 8k weekly actives, 32% MoM growth, $14k MRR. Team: ex-Linear, ex-Notion. Raising $2M seed to scale GTM.' },
  { title: 'Launch', text: 'Introducing Halo 3 — the first wireless earbuds with on-device translation for 47 languages. Launch event recap: design highlights, 5 standout features (adaptive ANC, 36h battery, spatial audio, translation, multipoint), pricing tiers ($179 / $229 / $279), availability (Nov 15, 32 countries).' },
  { title: 'Report', text: 'Engineering weekly. Shipped: dark mode v2, OAuth login, export-to-PDF. KPIs: DAU 42k (+8%), latency p95 280ms (-12ms), error rate 0.21% (+0.03). Blockers: mobile keyboard bug on iOS 17, Stripe webhook flakiness. Next week: billing v2 launch, infra migration to k8s.' },
  { title: 'Talk', text: 'Building edge-first databases for sub-10ms reads. Cover: why edge matters, the CAP theorem tradeoffs we made, replication via CRDTs, conflict resolution strategy, real-world benchmarks (8 regions, 4ms p50 read), lessons from production incidents, roadmap to multi-region writes.' },
]

const TONES: { value: Tone; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'casual', label: 'Casual' },
  { value: 'professional', label: 'Pro' },
  { value: 'funny', label: 'Funny' },
  { value: 'educational', label: 'Edu' },
  { value: 'sales-pitch', label: 'Sales' },
]

const VERBOSITIES: { value: Verbosity; label: string; hint: string }[] = [
  { value: 'concise', label: 'Concise', hint: '~20w' },
  { value: 'standard', label: 'Standard', hint: '~40w' },
  { value: 'text-heavy', label: 'Detailed', hint: '~60w' },
]

export function InputPanel() {
  const {
    text, setText,
    slideCount, setSlideCount,
    audience, setAudience,
    tone, setTone,
    verbosity, setVerbosity,
    focus, setFocus,
    model, setModel, models,
    generateOutline,
    status, generating, error, reset,
  } = usePresentation()

  const [showAdvanced, setShowAdvanced] = useState(false)
  const isOutlineLoading = status === 'outline-loading'
  const canGenerate = !generating && text.trim().length >= 10

  return (
    <div className="flex flex-col gap-5 h-full" suppressHydrationWarning>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="cohere-mono block mb-1">Brief</span>
          <p className="cohere-text-body" style={{ color: 'var(--slate)' }}>
            What's your presentation about?
          </p>
        </div>
        {(status === 'success' || status === 'error' || status === 'outline-ready') && (
          <button
            onClick={reset}
            className="cohere-btn-outline"
            style={{ height: '32px', fontSize: '12px', padding: '0 12px' }}
          >
            <RotateCcw className="size-3 mr-1" />
            Reset
          </button>
        )}
      </div>

      {/* Textarea — the only required field */}
      <div className="flex flex-col gap-2 flex-1 min-h-0">
        <Label htmlFor="brief" className="cohere-mono">
          Your text <span style={{ color: 'var(--error)' }}>*</span>
        </Label>
        <textarea
          id="brief"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe your topic, key points, audience, and any data you want included. The more specific you are, the better the slides."
          className="cohere-input w-full flex-1 min-h-[180px] resize-none cohere-text-body leading-relaxed"
          style={{ height: 'auto', padding: '14px 16px', borderRadius: '8px', fontFamily: 'var(--font-inter)' }}
          disabled={generating}
          suppressHydrationWarning
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="cohere-mono" style={{ color: 'var(--slate)' }}>
            {text.length} chars {text.length < 10 && '· min 10'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex.title}
                onClick={() => setText(ex.text)}
                disabled={generating}
                className="cohere-btn-outline"
                style={{ height: '28px', fontSize: '11px', padding: '0 10px', borderRadius: '20px' }}
              >
                {ex.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Slide count — always visible */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="cohere-mono">Slides</Label>
          <motion.span
            key={slideCount}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="cohere-display text-2xl"
            style={{ lineHeight: 1, minWidth: '32px', textAlign: 'right', color: 'var(--ink)' }}
          >
            {slideCount}
          </motion.span>
        </div>
        <Slider
          value={[slideCount]}
          min={3}
          max={20}
          step={1}
          onValueChange={(v) => setSlideCount(v[0])}
          disabled={generating}
        />
      </div>

      {/* Advanced Settings — collapsible */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center justify-between w-full py-2 px-3 transition-colors hover:opacity-70"
        style={{ borderTop: '1px solid var(--hairline)', borderBottom: showAdvanced ? 'none' : '1px solid var(--hairline)' }}
      >
        <span className="cohere-mono flex items-center gap-2">
          <Settings2 className="size-3.5" style={{ color: 'var(--slate)' }} />
          Advanced settings
        </span>
        <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="size-4" style={{ color: 'var(--slate)' }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
            style={{ borderBottom: '1px solid var(--hairline)' }}
          >
            <div className="flex flex-col gap-4 p-3">
              {/* Audience + Strategy */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="audience" className="cohere-mono">Audience</Label>
                  <input
                    id="audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="investors"
                    className="cohere-input w-full"
                    suppressHydrationWarning
                    disabled={generating}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="focus" className="cohere-mono">Strategy</Label>
                  <input
                    id="focus"
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    placeholder="kawasaki-10"
                    className="cohere-input w-full"
                    suppressHydrationWarning
                    disabled={generating}
                  />
                </div>
              </div>

              {/* AI Model */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label className="cohere-mono">AI Model</Label>
                  <span className="cohere-mono flex items-center gap-1" style={{ color: 'var(--success)', fontSize: '10px' }}>
                    <span className="size-1.5 rounded-full" style={{ background: 'var(--success)' }} />
                    Free models available
                  </span>
                </div>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={generating}
                  className="cohere-input w-full cursor-pointer"
                  style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\' fill=\'none\'%3E%3Cpath d=\'M3 4.5L6 7.5L9 4.5\' stroke=\'%2375758a\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px' }}
                >
                  {models.length === 0 && (
                    <option value="z-ai-default">Z.AI (Default)</option>
                  )}
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} {m.free ? '· Free' : ''} — {m.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tone + Verbosity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="cohere-mono">Tone</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {TONES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTone(t.value)}
                        disabled={generating}
                        className="cohere-btn-outline"
                        data-active={tone === t.value}
                        style={{ height: '30px', fontSize: '11px', padding: '0 10px' }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="cohere-mono">Verbosity</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {VERBOSITIES.map((v) => (
                      <button
                        key={v.value}
                        onClick={() => setVerbosity(v.value)}
                        disabled={generating}
                        className="cohere-btn-outline"
                        data-active={verbosity === v.value}
                        style={{ height: '30px', fontSize: '11px', padding: '0 10px' }}
                      >
                        {v.label}
                        <span className="opacity-50 ml-1 text-[10px]">{v.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 cohere-text-caption"
          style={{
            color: 'var(--error)',
            background: 'rgba(179, 0, 0, 0.05)',
            border: '1px solid rgba(179, 0, 0, 0.2)',
            borderRadius: '8px',
          }}
        >
          {error}
        </motion.div>
      )}

      {/* Generate */}
      <motion.button
        onClick={generateOutline}
        disabled={!canGenerate}
        whileTap={{ scale: 0.97 }}
        className="cohere-btn-primary w-full"
        style={{ height: '52px', fontSize: '15px', padding: '14px 32px' }}
      >
        {isOutlineLoading ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            Planning outline…
          </>
        ) : (
          <>
            <Sparkles className="size-4 mr-2" />
            Generate presentation
          </>
        )}
      </motion.button>

      {/* Pipeline hint */}
      <div className="flex items-center justify-center gap-3">
        <span className="cohere-mono flex items-center gap-1.5" style={{ color: 'var(--slate)' }}>
          <FileText className="size-3" />
          Outline ~5s
        </span>
        <span className="opacity-30" style={{ color: 'var(--slate)' }}>·</span>
        <span className="cohere-mono flex items-center gap-1.5" style={{ color: 'var(--slate)' }}>
          <Layers className="size-3" />
          Slides ~3s each
        </span>
      </div>
    </div>
  )
}
