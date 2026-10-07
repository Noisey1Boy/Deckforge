'use client'

import { motion } from 'framer-motion'
import { DeckPreview } from './deck-preview'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SlideNavigatorProps {
  html: string
  currentSlide: number
  slideCount: number
  onSlideChange: (n: number) => void
  slideTitles?: string[]
}

export function SlideNavigator({ html, currentSlide, slideCount, onSlideChange, slideTitles }: SlideNavigatorProps) {
  const slides = Array.from({ length: slideCount }, (_, i) => i)

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between px-1">
        <span className="cohere-mono" style={{ color: 'var(--slate)' }}>
          Slides · {slideCount}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSlideChange(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="cohere-btn-outline"
            style={{ width: '32px', height: '32px', padding: '0', borderRadius: '9999px', opacity: currentSlide === 0 ? 0.3 : 1 }}
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => onSlideChange(Math.min(slideCount - 1, currentSlide + 1))}
            disabled={currentSlide >= slideCount - 1}
            className="cohere-btn-outline"
            style={{ width: '32px', height: '32px', padding: '0', borderRadius: '9999px', opacity: currentSlide >= slideCount - 1 ? 0.3 : 1 }}
            aria-label="Next slide"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2 cohere-scroll">
        <div className="flex gap-2 h-full min-w-min">
          {slides.map((i) => {
            const isActive = i === currentSlide
            const title = slideTitles?.[i] || `Slide ${i + 1}`
            return (
              <motion.button
                key={i}
                onClick={() => onSlideChange(i)}
                whileTap={{ scale: 0.96 }}
                className="relative flex-shrink-0 overflow-hidden flex flex-col"
                style={{
                  width: '170px',
                  height: '110px',
                  background: 'var(--soft-stone)',
                  border: isActive ? '2px solid var(--primary)' : '1px solid var(--card-border)',
                  borderRadius: '8px',
                }}
                aria-label={`Slide ${i + 1}: ${title}`}
                title={title}
              >
                {/* Thumbnail area */}
                <div className="relative flex-1 overflow-hidden">
                  <div
                    className="absolute inset-0 origin-top-left"
                    style={{ width: '1280px', height: '720px', transform: 'scale(0.133)' }}
                  >
                    <DeckPreview html={html} slideIndex={i} />
                  </div>
                  {/* Slide number badge */}
                  <div
                    className="absolute top-1 left-1 px-1.5 py-0.5 pointer-events-none"
                    style={{ background: 'var(--primary)', color: 'var(--on-primary)', borderRadius: '4px' }}
                  >
                    <span className="cohere-display text-xs" style={{ lineHeight: 1 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>
                {/* Slide title bar */}
                <div
                  className="px-2 py-1 truncate pointer-events-none"
                  style={{
                    background: isActive ? 'var(--primary)' : 'var(--canvas)',
                    color: isActive ? 'var(--on-primary)' : 'var(--ink)',
                    borderTop: '1px solid var(--card-border)',
                    fontSize: '10px',
                    fontWeight: 500,
                    lineHeight: 1.3,
                  }}
                >
                  {title}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
