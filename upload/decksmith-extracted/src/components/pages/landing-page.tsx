'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Layers, FileText, Wand2, Download, Trash2, Clock } from 'lucide-react'
import { usePresentation, type SavedDeck } from '@/lib/presentation/store'

const FALLBACK_TEMPLATE_COUNT = 57

export function LandingPage({ templateCount, onStart, onOpenDeck }: {
  templateCount: number
  onStart: () => void
  onOpenDeck: (deck: SavedDeck) => void
}) {
  const { savedDecks, deleteDeck } = usePresentation()
  const tplCount = templateCount || FALLBACK_TEMPLATE_COUNT

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
        className="py-16 sm:py-24 text-center"
      >
        <motion.span
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="cohere-mono block mb-6" style={{ color: 'var(--slate)' }}
        >
          AI HTML → Presentation Generator
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="cohere-display"
          style={{ fontSize: 'clamp(40px, 7vw, 80px)', lineHeight: 1, letterSpacing: '-0.03em', marginBottom: '24px' }}
        >
          Turn any text into a<br />
          <span style={{ color: 'var(--deep-green)' }}>polished</span> HTML deck
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="cohere-text-body-large max-w-2xl mx-auto mb-10" style={{ color: 'var(--slate)' }}
        >
          {tplCount} templates across 5 frameworks. AI plans an outline, writes each slide,
          and assembles a complete deck. Free, no signup.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <button onClick={onStart} className="cohere-btn-primary">
            <Sparkles className="size-4" /> Start Creating <ArrowRight className="size-3.5 ml-1" />
          </button>
        </motion.div>
      </motion.section>

      {/* Stats band */}
      <motion.section
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="pb-12"
      >
        <div className="cohere-dark-band p-6 sm:p-10" style={{ borderRadius: '22px' }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { num: tplCount, label: 'Templates' },
              { num: 5, label: 'Frameworks' },
              { num: '~21s', label: 'Avg generate' },
              { num: 3, label: 'Export formats' },
            ].map((s, i) => (
              <div key={i}>
                <div className="cohere-display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', lineHeight: 1, color: 'var(--on-dark)' }}>{s.num}</div>
                <div className="cohere-mono mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How it works */}
      <motion.section
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="py-16"
      >
        <span className="cohere-mono block text-center mb-2" style={{ color: 'var(--slate)' }}>How it works</span>
        <h3 className="cohere-display text-center mb-12" style={{ fontSize: 'clamp(24px, 4vw, 36px)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          Three steps to a polished deck
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { icon: FileText, step: '01', title: 'Write your brief', desc: 'Describe your topic, pick tone and style. The AI reads your brief and plans a structured outline.' },
            { icon: Layers, step: '02', title: 'Choose a template', desc: 'Browse 57 templates across 5 frameworks. Pick one or let AI auto-select based on your content.' },
            { icon: Download, step: '03', title: 'Preview & export', desc: 'Navigate slides, present fullscreen, export to PPTX, PDF, or standalone HTML. Saved automatically.' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--soft-stone)', width: '52px', height: '52px', borderRadius: '12px' }}>
                <item.icon className="size-5" style={{ color: 'var(--deep-green)' }} />
              </div>
              <span className="cohere-display text-2xl block mb-2" style={{ lineHeight: 1, color: 'var(--muted)' }}>{item.step}</span>
              <h4 className="cohere-text-feature mb-2">{item.title}</h4>
              <p className="cohere-text-caption leading-relaxed" style={{ color: 'var(--slate)' }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Recent decks */}
      {savedDecks.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="pb-16"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="cohere-display" style={{ fontSize: 'clamp(20px, 3vw, 28px)', letterSpacing: '-0.02em' }}>
              Recent decks
            </h3>
            <span className="cohere-mono" style={{ color: 'var(--slate)' }}>{savedDecks.length} saved</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedDecks.slice(0, 6).map((deck) => (
              <div
                key={deck.id}
                className="cohere-card p-4 flex items-center justify-between"
                style={{ border: '1px solid var(--card-border)', borderRadius: '12px' }}
              >
                <button onClick={() => onOpenDeck(deck)} className="flex-1 text-left min-w-0">
                  <h4 className="cohere-text-button truncate">{deck.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="cohere-mono" style={{ color: 'var(--slate)', fontSize: '10px' }}>
                      {deck.slideCount} slides
                    </span>
                    <span className="cohere-mono flex items-center gap-1" style={{ color: 'var(--muted)', fontSize: '10px' }}>
                      <Clock className="size-2.5" />
                      {new Date(deck.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => deleteDeck(deck.id)}
                  className="ml-3 p-1.5 rounded transition-colors hover:bg-error/10"
                  style={{ color: 'var(--muted)' }}
                  aria-label="Delete deck"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  )
}
