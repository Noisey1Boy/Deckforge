'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Github, ArrowRight } from 'lucide-react'
import { usePresentation, type TemplateMeta, type SavedDeck } from '@/lib/presentation/store'
import { LandingPage } from '@/components/pages/landing-page'
import { PromptPage } from '@/components/pages/prompt-page'
import { TemplatePage } from '@/components/pages/template-page'
import { BuildPage } from '@/components/pages/build-page'
import { Breadcrumbs } from '@/components/pages/breadcrumbs'
import { PresentMode } from '@/components/presentation/present-mode'
import { OutlinePanel } from '@/components/presentation/outline-panel'
import { Button } from '@/components/ui/button'

const FALLBACK_TEMPLATE_COUNT = 57

export default function Home() {
  const {
    step, setStep, status, setModels,
    generateOutline, generateSlides,
    loadSavedDecks, savedDecks,
  } = usePresentation()
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [loadingTpls, setLoadingTpls] = useState(true)

  useEffect(() => {
    fetch('/api/templates').then(r => r.json()).then(d => { setTemplates(d.templates ?? []); setLoadingTpls(false) }).catch(() => setLoadingTpls(false))
  }, [])

  useEffect(() => {
    fetch('/api/models').then(r => r.json()).then(d => { if (d.models) setModels(d.models) }).catch(() => {})
  }, [setModels])

  // Load saved decks on mount
  useEffect(() => { loadSavedDecks() }, [loadSavedDecks])

  const handleStart = () => setStep('prompt')

  const handlePromptNext = () => setStep('template')

  const handleTemplateGenerate = () => {
    generateOutline()
  }

  const handleOpenDeck = (deck: SavedDeck) => {
    // Load the saved deck into the build page
    usePresentation.setState({
      result: {
        html: deck.html,
        meta: {
          templateId: deck.templateId,
          framework: 'open-design' as any,
          slideCount: deck.slideCount,
          generatedAt: deck.createdAt,
          htmlSize: deck.html.length,
        },
      },
      status: 'success',
      step: 'build',
      currentSlide: 0,
    })
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--canvas)' }} suppressHydrationWarning>
      {/* Announcement bar */}
      <div className="cohere-announcement">
        <span className="hidden sm:inline">
          {templates.length || FALLBACK_TEMPLATE_COUNT} templates across 5 frameworks ·{' '}
          <a href="https://github.com/nexu-io/open-design" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">open-design</a>
        </span>
        <span className="sm:hidden">{templates.length || FALLBACK_TEMPLATE_COUNT} templates · 5 frameworks</span>
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b" style={{ background: 'var(--canvas)', borderColor: 'var(--hairline)', height: '56px' }}>
        <div className="px-4 sm:px-8 h-full flex items-center justify-between max-w-[1440px] mx-auto">
          <button onClick={() => setStep('landing')} className="flex items-center gap-2 cursor-pointer">
            <div className="flex items-center justify-center" style={{ background: 'var(--primary)', color: 'var(--on-primary)', width: '26px', height: '26px', borderRadius: '6px' }}>
              <Sparkles className="size-3.5" />
            </div>
            <span className="text-sm font-medium tracking-tight" style={{ fontFamily: 'var(--font-grotesk)', letterSpacing: '-0.02em' }}>Decksmith</span>
          </button>
          {step === 'landing' && (
            <button onClick={handleStart} className="cohere-btn-primary" style={{ height: '32px', fontSize: '12px', padding: '0 16px' }}>
              Start Creating <ArrowRight className="size-3 ml-1" />
            </button>
          )}
          {step !== 'landing' && (
            <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
              <a href="https://github.com/nexu-io/open-design" target="_blank" rel="noopener noreferrer">
                <Github className="size-3 mr-1" /><span className="hidden sm:inline">Source</span>
              </a>
            </Button>
          )}
        </div>
      </header>

      {/* Breadcrumbs (hidden on landing) */}
      {step !== 'landing' && <Breadcrumbs />}

      {/* Main content */}
      <main className="flex-1 min-h-0 flex flex-col">
        {step === 'landing' && (
          <LandingPage templateCount={templates.length} onStart={handleStart} onOpenDeck={handleOpenDeck} />
        )}
        {step === 'prompt' && (
          <PromptPage onNext={handlePromptNext} />
        )}
        {step === 'template' && (
          <TemplatePage onBack={() => setStep('prompt')} onGenerate={handleTemplateGenerate} />
        )}
        {step === 'build' && (
          <BuildPage />
        )}
      </main>

      {/* Outline panel (slide-in during generation) */}
      <OutlinePanel />

      {/* Presentation mode */}
      <PresentMode />

      {/* Footer */}
      <footer className="mt-auto py-3 px-4 sm:px-8 text-center cohere-text-micro" style={{ background: 'var(--canvas)', color: 'var(--muted)', borderTop: '1px solid var(--hairline)' }}>
        <span className="hidden sm:inline">Built with Next.js 16 · Framer Motion · z-ai-web-dev-sdk</span>
        <span className="sm:hidden">Decksmith</span>
      </footer>
    </div>
  )
}
