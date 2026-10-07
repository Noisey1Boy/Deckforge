'use client'

import { create } from 'zustand'
import type { Framework } from './slide-prompt'
import { detectFramework } from './slide-prompt'
import { assembleDeck } from './assemble'

export interface TemplateMeta {
  id: string
  name: string
  tagline: string
  category: string
  style: string
  palette: string[]
  fonts: string[]
  bestFor: string[]
  slidesCount: number
  tags: string[]
  previewSlide: number
  framework?: Framework
  sourceFolder?: string
}

export interface SlideOutline {
  title: string
  layout: string
  content_markdown: string
  speaker_notes: string
}

export interface GenerateResult {
  html: string
  meta: {
    templateId: string
    framework: Framework
    autoSelected?: boolean
    slideCount?: number
    audience?: string
    tone?: string
    verbosity?: string
    focus?: string
    generatedAt: string
    htmlSize: number
  }
}

export type Step = 'landing' | 'prompt' | 'template' | 'build'

export interface SavedDeck {
  id: string
  title: string
  html: string
  templateId: string
  slideCount: number
  createdAt: string
}

export type Tone = 'default' | 'casual' | 'professional' | 'funny' | 'educational' | 'sales-pitch'
export type Verbosity = 'concise' | 'standard' | 'text-heavy'

export type GenStatus =
  | 'idle'
  | 'outline-loading'
  | 'outline-ready'
  | 'slides-loading'
  | 'success'
  | 'error'

interface SlideStatus {
  index: number
  status: 'pending' | 'loading' | 'done' | 'error'
  html?: string
  error?: string
}

export interface ModelOption {
  id: string
  label: string
  provider: string
  description: string
  free?: boolean
}

interface PresentationStore {
  // Step navigation
  step: Step
  setStep: (s: Step) => void

  // Saved decks (localStorage)
  savedDecks: SavedDeck[]
  saveDeck: () => void
  deleteDeck: (id: string) => void
  loadSavedDecks: () => void

  // Build page panel states
  leftPanelOpen: boolean
  toggleLeftPanel: () => void
  rightPanelOpen: boolean
  toggleRightPanel: () => void

  // Input
  text: string
  setText: (t: string) => void

  templateId: string | null // null = "auto"
  setTemplateId: (id: string | null) => void

  slideCount: number
  setSlideCount: (n: number) => void

  audience: string
  setAudience: (a: string) => void

  tone: Tone
  setTone: (t: Tone) => void

  verbosity: Verbosity
  setVerbosity: (v: Verbosity) => void

  focus: string
  setFocus: (f: string) => void

  // AI Model
  model: string
  setModel: (m: string) => void
  models: ModelOption[]
  setModels: (m: ModelOption[]) => void

  // Generation pipeline state
  status: GenStatus
  error: string | null
  outline: { title: string; slides: SlideOutline[] } | null
  slideStatuses: SlideStatus[]
  result: GenerateResult | null
  generating: boolean

  // Pipeline actions
  generateOutline: () => Promise<void>
  generateSlides: () => Promise<void>
  approveOutlineAndGenerate: () => Promise<void>
  regenerateSlide: (index: number) => Promise<void>
  reset: () => void

  // Preview
  currentSlide: number
  setCurrentSlide: (n: number) => void

  // UI
  showCode: boolean
  toggleCode: () => void

  showTemplateGallery: boolean
  setTemplateGallery: (v: boolean) => void

  showOutlinePanel: boolean
  setOutlinePanel: (v: boolean) => void

  // Presentation mode
  presentMode: boolean
  setPresentMode: (v: boolean) => void

  showSpeakerNotes: boolean
  toggleSpeakerNotes: () => void
}

const TONE_LABELS: Record<Tone, string> = {
  'default': 'professional, confident, clear',
  'casual': 'casual, friendly, conversational',
  'professional': 'professional, authoritative, precise',
  'funny': 'light, funny, playful — but not at the cost of clarity',
  'educational': 'educational, explanatory, patient',
  'sales-pitch': 'persuasive, energetic, sales-pitch',
}

export const usePresentation = create<PresentationStore>((set, get) => ({
  // Step navigation
  step: 'landing',
  setStep: (s) => set({ step: s }),

  // Saved decks
  savedDecks: [],
  saveDeck: () => {
    const s = get()
    if (!s.result) return
    const deck: SavedDeck = {
      id: `deck-${Date.now()}`,
      title: s.outline?.title || 'Untitled Deck',
      html: s.result.html,
      templateId: s.result.meta.templateId,
      slideCount: s.result.meta.slideCount || 0,
      createdAt: new Date().toISOString(),
    }
    const decks = [deck, ...s.savedDecks].slice(0, 20) // Keep last 20
    try { localStorage.setItem('decksmith-decks', JSON.stringify(decks)) } catch {}
    set({ savedDecks: decks })
  },
  deleteDeck: (id) => {
    const decks = get().savedDecks.filter(d => d.id !== id)
    try { localStorage.setItem('decksmith-decks', JSON.stringify(decks)) } catch {}
    set({ savedDecks: decks })
  },
  loadSavedDecks: () => {
    try {
      const raw = localStorage.getItem('decksmith-decks')
      if (raw) set({ savedDecks: JSON.parse(raw) })
    } catch {}
  },

  // Build page panels
  leftPanelOpen: true,
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  rightPanelOpen: true,
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  text: '',
  setText: (t) => set({ text: t }),

  templateId: 'pitch-deck',
  setTemplateId: (id) => set({ templateId: id }),

  slideCount: 10,
  setSlideCount: (n) => set({ slideCount: Math.max(3, Math.min(20, n)) }),

  audience: '',
  setAudience: (a) => set({ audience: a }),

  tone: 'default',
  setTone: (t) => set({ tone: t }),

  verbosity: 'standard',
  setVerbosity: (v) => set({ verbosity: v }),

  focus: '',
  setFocus: (f) => set({ focus: f }),

  model: 'z-ai-default',
  setModel: (m) => set({ model: m }),
  models: [],
  setModels: (m) => set({ models: m }),

  status: 'idle',
  error: null,
  outline: null,
  slideStatuses: [],
  result: null,
  generating: false,

  /**
   * Stage 1: Generate outline (quick LLM call).
   * Returns structured slide outlines as JSON.
   */
  generateOutline: async () => {
    const state = get()
    if (state.generating) return
    if (state.text.trim().length < 10) {
      set({ error: 'Please enter at least 10 characters of text.', status: 'error' })
      return
    }
    set({
      generating: true,
      status: 'outline-loading',
      error: null,
      outline: null,
      result: null,
      slideStatuses: [],
      currentSlide: 0,
      showOutlinePanel: true,
      step: 'build',
    })
    try {
      const res = await fetch('/api/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: state.text,
          slideCount: state.slideCount,
          audience: state.audience,
          tone: TONE_LABELS[state.tone],
          verbosity: state.verbosity,
          focus: state.focus,
          model: state.model,
        }),
        signal: AbortSignal.timeout(120000), // 2 min timeout
      })
      // Handle non-JSON responses (HTML error pages)
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        set({
          generating: false,
          status: 'error',
          error: 'Server returned an error. Please try again.',
        })
        return
      }
      const data = await res.json()
      if (!res.ok) {
        set({
          generating: false,
          status: 'error',
          error: data?.error || 'Outline generation failed',
        })
        return
      }
      set({
        generating: false,
        status: 'outline-ready',
        outline: { title: data.title, slides: data.slides },
        slideStatuses: data.slides.map((_: SlideOutline, i: number) => ({
          index: i,
          status: 'pending' as const,
        })),
      })
    } catch (err) {
      set({
        generating: false,
        status: 'error',
        error: err instanceof Error ? err.message : 'Network error',
      })
    }
  },

  /**
   * Stage 2: Generate all slides concurrently (batched).
   * Fires N /api/generate-slide calls in parallel, then assembles the deck.
   */
  generateSlides: async () => {
    const state = get()
    if (state.generating) return
    if (!state.outline) {
      set({ error: 'No outline to generate slides from.', status: 'error' })
      return
    }

    const templateId = state.templateId ?? 'auto'
    // For 'auto', we still need to resolve it server-side via the slide API
    // (which falls back to pitch-deck). For client-side assembly we need the
    // actual template HTML, so we'll fetch it after the first slide returns.
    set({
      generating: true,
      status: 'slides-loading',
      error: null,
      result: null,
      slideStatuses: state.outline.slides.map((_, i) => ({
        index: i,
        status: 'loading' as const,
      })),
    })

    try {
      const deckTitle = state.outline.title
      const slides = state.outline.slides
      const slideTotal = slides.length
      const toneLabel = TONE_LABELS[state.tone]

      // Fire slide generations in batches of 3 to avoid rate limiting (429s)
      const BATCH_SIZE = 3
      const results: Array<{ index: number; html: string | null; error?: string }> = []
      for (let batchStart = 0; batchStart < slides.length; batchStart += BATCH_SIZE) {
        const batch = slides.slice(batchStart, batchStart + BATCH_SIZE)
        const batchPromises = batch.map((slide, i) => {
          const slideIdx = batchStart + i
          return fetch('/api/generate-slide', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(120000), // 2 min timeout per slide
            body: JSON.stringify({
              templateId: templateId === 'auto' ? 'pitch-deck' : templateId,
              deckTitle,
              slideIndex: slideIdx,
              slideTotal,
              slide,
              audience: state.audience,
              tone: toneLabel,
              verbosity: state.verbosity,
              model: state.model,
            }),
          })
            .then(async (r) => {
              // Handle non-JSON responses (HTML error pages, 500s, etc.)
              const contentType = r.headers.get('content-type') || ''
              if (!contentType.includes('application/json')) {
                const text = await r.text()
                throw new Error(`Server returned ${r.status} (${contentType.slice(0, 30)})`)
              }
              return r.json()
            })
            .then((data) => {
              if (data.error) throw new Error(data.error)
              set((s) => ({
                slideStatuses: s.slideStatuses.map((ss) =>
                  ss.index === slideIdx
                    ? { ...ss, status: 'done' as const, html: data.slideHtml }
                    : ss
                ),
              }))
              return { index: slideIdx, html: data.slideHtml as string }
            })
            .catch((err) => {
              set((s) => ({
                slideStatuses: s.slideStatuses.map((ss) =>
                  ss.index === slideIdx
                    ? { ...ss, status: 'error' as const, error: String(err.message || err) }
                    : ss
                ),
              }))
              return { index: slideIdx, html: null, error: String(err.message || err) }
            })
        })
        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)
      }

      // Check if any slides failed
      const failed = results.filter((r) => r.html === null)
      if (failed.length === results.length) {
        set({
          generating: false,
          status: 'error',
          error: `All ${failed.length} slides failed to generate.`,
        })
        return
      }

      // For failed slides, use a placeholder
      const slideHtmls = results.map((r, i) => {
        if (r.html) return r.html
        // Placeholder for failed slide
        const slide = slides[i]
        return `<section class="slide" data-title="${slide.title}"><div class="kicker">Slide ${i + 1}</div><h2 class="h2">${slide.title}</h2><p class="lede">${slide.content_markdown.slice(0, 200)}</p><div class="notes">Slide generation failed. Edit to retry.</div></section>`
      })

      // Fetch the template HTML to assemble the deck
      const tplRes = await fetch(`/api/template-content?id=${templateId === 'auto' ? 'pitch-deck' : templateId}`)
      if (!tplRes.ok) {
        set({ generating: false, status: 'error', error: 'Failed to load template. Please try again.' })
        return
      }
      const tplData = await tplRes.json()
      const templateHtml = tplData.html as string
      const templateCss = tplData.css as string | undefined
      const framework = detectFramework(templateHtml)

      const assembledHtml = assembleDeck({
        templateId: templateId === 'auto' ? 'pitch-deck' : templateId,
        templateHtml,
        framework,
        deckTitle,
        slideHtmls,
      })

      set({
        generating: false,
        status: 'success',
        result: {
          html: assembledHtml,
          meta: {
            templateId: templateId === 'auto' ? 'pitch-deck' : templateId,
            framework,
            autoSelected: templateId === 'auto',
            slideCount: slideTotal,
            audience: state.audience,
            tone: toneLabel,
            verbosity: state.verbosity,
            focus: state.focus,
            generatedAt: new Date().toISOString(),
            htmlSize: assembledHtml.length,
          },
        },
        currentSlide: 0,
        showOutlinePanel: false,
        step: 'build',
      })
      // Auto-save to localStorage
      setTimeout(() => { get().saveDeck() }, 100)
    } catch (err) {
      set({
        generating: false,
        status: 'error',
        error: err instanceof Error ? err.message : 'Slide generation failed',
      })
    }
  },

  /**
   * Convenience: run outline stage, then automatically proceed to slide generation.
   */
  approveOutlineAndGenerate: async () => {
    await get().generateSlides()
  },

  /**
   * Regenerate a single slide after the user edits the outline.
   */
  regenerateSlide: async (index: number) => {
    const state = get()
    if (!state.outline || !state.result) return
    const slide = state.outline.slides[index]
    if (!slide) return

    set((s) => ({
      slideStatuses: s.slideStatuses.map((ss) =>
        ss.index === index ? { ...ss, status: 'loading' as const } : ss
      ),
    }))

    try {
      const toneLabel = TONE_LABELS[state.tone]
      const res = await fetch('/api/generate-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(120000),
        body: JSON.stringify({
          templateId: state.templateId === 'auto' ? 'pitch-deck' : state.templateId,
          deckTitle: state.outline.title,
          slideIndex: index,
          slideTotal: state.outline.slides.length,
          slide,
          audience: state.audience,
          tone: toneLabel,
          verbosity: state.verbosity,
          model: state.model,
        }),
      })
      // Handle non-JSON responses
      const regenContentType = res.headers.get('content-type') || ''
      if (!regenContentType.includes('application/json')) {
        throw new Error('Server returned an error. Please try again.')
      }
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Update the slide status
      set((s) => ({
        slideStatuses: s.slideStatuses.map((ss) =>
          ss.index === index
            ? { ...ss, status: 'done' as const, html: data.slideHtml }
            : ss
        ),
      }))

      // Re-assemble the deck with the new slide
      const slideHtmls = get().slideStatuses
        .sort((a, b) => a.index - b.index)
        .map((ss) => ss.html || `<section class="slide"><h2>Slide ${ss.index + 1}</h2></section>`)

      const tplRes = await fetch(`/api/template-content?id=${state.templateId === 'auto' ? 'pitch-deck' : state.templateId}`)
      if (!tplRes.ok) {
        throw new Error('Failed to load template for reassembly')
      }
      const tplData = await tplRes.json()
      const templateHtml = tplData.html as string
      const framework = detectFramework(templateHtml)
      const assembledHtml = assembleDeck({
        templateId: state.templateId === 'auto' ? 'pitch-deck' : (state.templateId as string),
        templateHtml,
        framework,
        deckTitle: state.outline.title,
        slideHtmls,
      })

      set((s) => ({
        result: s.result
          ? { ...s.result, html: assembledHtml, meta: { ...s.result.meta, htmlSize: assembledHtml.length } }
          : s.result,
      }))
    } catch (err) {
      set((s) => ({
        slideStatuses: s.slideStatuses.map((ss) =>
          ss.index === index
            ? { ...ss, status: 'error' as const, error: err instanceof Error ? err.message : String(err) }
            : ss
        ),
      }))
    }
  },

  reset: () =>
    set({
      step: 'landing',
      status: 'idle',
      error: null,
      outline: null,
      slideStatuses: [],
      result: null,
      generating: false,
      currentSlide: 0,
      showOutlinePanel: false,
      showCode: false,
      leftPanelOpen: true,
      rightPanelOpen: true,
    }),

  currentSlide: 0,
  setCurrentSlide: (n) => set({ currentSlide: Math.max(0, n) }),

  showCode: false,
  toggleCode: () => set((s) => ({ showCode: !s.showCode })),

  showTemplateGallery: false,
  setTemplateGallery: (v) => set({ showTemplateGallery: v }),

  showOutlinePanel: false,
  setOutlinePanel: (v) => set({ showOutlinePanel: v }),

  presentMode: false,
  setPresentMode: (v) => set({ presentMode: v }),

  showSpeakerNotes: false,
  toggleSpeakerNotes: () => set((s) => ({ showSpeakerNotes: !s.showSpeakerNotes })),
}))
