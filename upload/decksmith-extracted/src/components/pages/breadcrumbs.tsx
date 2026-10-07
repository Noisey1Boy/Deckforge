'use client'

import { ChevronRight, Home } from 'lucide-react'
import { usePresentation, type Step } from '@/lib/presentation/store'

const STEPS: { key: Step; label: string }[] = [
  { key: 'landing', label: 'Home' },
  { key: 'prompt', label: 'Prompt' },
  { key: 'template', label: 'Template' },
  { key: 'build', label: 'Build' },
]

export function Breadcrumbs() {
  const { step, setStep, status } = usePresentation()
  const currentIdx = STEPS.findIndex(s => s.key === step)

  return (
    <div className="flex items-center gap-1 px-4 sm:px-8 py-2 border-b"
      style={{ borderColor: 'var(--hairline)', background: 'var(--canvas)' }}>
      {STEPS.map((s, i) => {
        const isCurrent = i === currentIdx
        const isPast = i < currentIdx
        const canClick = s.key === 'landing' || (isPast && status !== 'slides-loading' && status !== 'outline-loading')
        return (
          <div key={s.key} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3" style={{ color: 'var(--muted)' }} />}
            <button
              onClick={() => canClick && setStep(s.key)}
              disabled={!canClick && !isCurrent}
              className="flex items-center gap-1.5 px-2 py-1 rounded transition-colors"
              style={{
                cursor: canClick ? 'pointer' : 'default',
                opacity: isCurrent ? 1 : isPast ? 0.7 : 0.4,
              }}
            >
              {s.key === 'landing' && <Home className="size-3" style={{ color: isCurrent ? 'var(--ink)' : 'var(--muted)' }} />}
              <span className="cohere-mono" style={{
                color: isCurrent ? 'var(--ink)' : 'var(--muted)',
                fontWeight: isCurrent ? 600 : 400,
                fontSize: '11px',
              }}>
                {s.label}
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
