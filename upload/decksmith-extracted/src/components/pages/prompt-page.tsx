'use client'

import { motion } from 'framer-motion'
import { Sparkles, ChevronDown, Settings2, ArrowRight, Loader2 } from 'lucide-react'
import { usePresentation, type Tone, type Verbosity } from '@/lib/presentation/store'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useState } from 'react'

const EXAMPLE_PROMPTS = [
  { title: 'Pitch', text: 'Lumen — an AI calendar that protects deep-work time. Problem: knowledge workers lose 23% of focus to meetings. Solution: Lumen auto-blocks focus time, declines low-priority invites, and drafts agendas. Traction: 8k weekly actives, 32% MoM growth, $14k MRR. Team: ex-Linear, ex-Notion. Raising $2M seed to scale GTM.' },
  { title: 'Launch', text: 'Introducing Halo 3 — wireless earbuds with on-device translation for 47 languages. 5 standout features (adaptive ANC, 36h battery, spatial audio, translation, multipoint), pricing tiers ($179/$229/$279), availability Nov 15.' },
  { title: 'Report', text: 'Engineering weekly. Shipped: dark mode v2, OAuth login, export-to-PDF. KPIs: DAU 42k (+8%), latency p95 280ms (-12ms). Blockers: iOS 17 keyboard bug, Stripe webhook flakiness. Next: billing v2, k8s migration.' },
  { title: 'Talk', text: 'Building edge-first databases for sub-10ms reads. Cover: why edge matters, CAP theorem tradeoffs, CRDT replication, conflict resolution, benchmarks (8 regions, 4ms p50 read), lessons from production incidents, multi-region roadmap.' },
]

const TONES: { value: Tone; label: string }[] = [
  { value: 'default', label: 'Default' }, { value: 'casual', label: 'Casual' },
  { value: 'professional', label: 'Pro' }, { value: 'funny', label: 'Funny' },
  { value: 'educational', label: 'Edu' }, { value: 'sales-pitch', label: 'Sales' },
]

const VERBOSITIES: { value: Verbosity; label: string; hint: string }[] = [
  { value: 'concise', label: 'Concise', hint: '~20w' },
  { value: 'standard', label: 'Standard', hint: '~40w' },
  { value: 'text-heavy', label: 'Detailed', hint: '~60w' },
]

export function PromptPage({ onNext }: { onNext: () => void }) {
  const {
    text, setText, slideCount, setSlideCount,
    audience, setAudience, tone, setTone, verbosity, setVerbosity,
    focus, setFocus, model, setModel, models,
  } = usePresentation()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const canProceed = text.trim().length >= 10

  return (
    <div className="max-w-[700px] mx-auto px-4 py-12 flex flex-col gap-6 min-h-[calc(100vh-64px-36px)]">
      <div className="text-center">
        <span className="cohere-mono block mb-2" style={{ color: 'var(--slate)' }}>Step 1</span>
        <h2 className="cohere-display" style={{ fontSize: 'clamp(28px, 5vw, 44px)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          What's your presentation about?
        </h2>
        <p className="cohere-text-body mt-3" style={{ color: 'var(--slate)' }}>
          Write a brief — the more specific, the better the slides.
        </p>
      </div>

      {/* Text input */}
      <div className="flex flex-col gap-2 flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Lumen — an AI calendar that protects deep-work time. Problem: 23% of focus time lost to meetings. Solution: auto-block focus, decline low-priority invites. Traction: 8k WAU, $14k MRR. Raising $2M seed..."
          className="cohere-input w-full flex-1 min-h-[200px] resize-none cohere-text-body leading-relaxed"
          style={{ padding: '16px', borderRadius: '12px', fontFamily: 'var(--font-inter)' }}
          suppressHydrationWarning
          autoFocus
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="cohere-mono" style={{ color: 'var(--slate)' }}>
            {text.length} chars {text.length < 10 && '· min 10'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((ex) => (
              <button key={ex.title} onClick={() => setText(ex.text)}
                className="cohere-btn-outline" style={{ height: '28px', fontSize: '11px', padding: '0 10px', borderRadius: '20px' }}>
                {ex.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Slide count */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="cohere-mono">Slides</Label>
          <motion.span key={slideCount} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            className="cohere-display text-xl" style={{ lineHeight: 1, color: 'var(--ink)' }}>
            {slideCount}
          </motion.span>
        </div>
        <Slider value={[slideCount]} min={3} max={20} step={1} onValueChange={(v) => setSlideCount(v[0])} />
      </div>

      {/* Advanced */}
      <button onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center justify-between w-full py-2.5 px-3 transition-colors hover:opacity-70"
        style={{ borderTop: '1px solid var(--hairline)', borderBottom: showAdvanced ? 'none' : '1px solid var(--hairline)' }}>
        <span className="cohere-mono flex items-center gap-2">
          <Settings2 className="size-3.5" style={{ color: 'var(--slate)' }} /> Advanced settings
        </span>
        <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="size-4" style={{ color: 'var(--slate)' }} />
        </motion.div>
      </button>

      {showAdvanced && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
          className="overflow-hidden flex flex-col gap-4 pb-4" style={{ borderBottom: '1px solid var(--hairline)' }}>
          <div className="grid grid-cols-2 gap-3 p-1">
            <div className="flex flex-col gap-1.5">
              <Label className="cohere-mono">Audience</Label>
              <input value={audience} onChange={(e) => setAudience(e.target.value)}
                placeholder="investors" className="cohere-input w-full" suppressHydrationWarning />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="cohere-mono">Strategy</Label>
              <input value={focus} onChange={(e) => setFocus(e.target.value)}
                placeholder="kawasaki-10" className="cohere-input w-full" suppressHydrationWarning />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 px-1">
            <Label className="cohere-mono">AI Model</Label>
            <select value={model} onChange={(e) => setModel(e.target.value)}
              className="cohere-input w-full cursor-pointer"
              style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\' fill=\'none\'%3E%3Cpath d=\'M3 4.5L6 7.5L9 4.5\' stroke=\'%2375758a\' stroke-width=\'1.5\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px' }}>
              {models.length === 0 && <option value="z-ai-default">Z.AI (Default)</option>}
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.label} {m.free ? '· Free' : ''} — {m.description}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-1">
            <div className="flex flex-col gap-1.5">
              <Label className="cohere-mono">Tone</Label>
              <div className="flex flex-wrap gap-1.5">
                {TONES.map((t) => (
                  <button key={t.value} onClick={() => setTone(t.value)} className="cohere-btn-outline"
                    data-active={tone === t.value} style={{ height: '30px', fontSize: '11px', padding: '0 10px' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="cohere-mono">Verbosity</Label>
              <div className="flex flex-wrap gap-1.5">
                {VERBOSITIES.map((v) => (
                  <button key={v.value} onClick={() => setVerbosity(v.value)} className="cohere-btn-outline"
                    data-active={verbosity === v.value} style={{ height: '30px', fontSize: '11px', padding: '0 10px' }}>
                    {v.label}<span className="opacity-50 ml-1 text-[10px]">{v.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Next button */}
      <div className="flex justify-end pt-2">
        <button onClick={onNext} disabled={!canProceed}
          className="cohere-btn-primary" style={{ height: '48px', fontSize: '14px', padding: '0 28px' }}>
          Choose Template <ArrowRight className="size-4 ml-1.5" />
        </button>
      </div>
    </div>
  )
}
